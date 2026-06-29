from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks

from sqlalchemy.orm import Session
from app.database import get_db

from app.dependencies import get_current_user
from app.services.pdf_parser import parse_resume
from app.models.application import Application
import os

from app.agents.orchestrator import run_pipeline
from app.models.draft import Draft
from app.models.revision import Revision

from app.schemas.status import StatusUpdate
from app.constants import VALID_STATUS
from app.services.jd_scraper import job_description
import json

router = APIRouter(
    prefix="/applications",
    tags=["applications"]
)

UPLOAD_FOLDER = "uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok= True
)

def run_ai_pipeline_in_background(
    application_id: int,
    parsed_resume: str,
    jd_text: str
):
    """
    Background task: runs the full AI pipeline and saves results to the database.
    This runs AFTER the API response is sent to the frontend.
    Creates its own database session since the request context is gone.
    """
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        results = run_pipeline(
            resume = parsed_resume,
            jd = jd_text
        )
        
        draft = Draft(
            application_id = application_id,
            fit_analysis = results["fit_analysis"],
            resume_rewrite = results["resume_rewrite"],
            cover_letter = results["cover_letter"],
            interview_pack = results["interview_pack"],
            ats_score = json.dumps(results["ats_score"])
        )
        
        db.add(draft)
        db.commit()
        db.refresh(draft)
        
        # Save initial revision for diff view
        revision = Revision(
            draft_id = draft.id,
            section = "resume",
            old_text = parsed_resume,
            new_text = results["resume_rewrite"]
        )
        db.add(revision)
        db.commit()
        
        print(f"[Background Pipeline] ✓ Completed for application {application_id}")
        
    except Exception as e:
        print(f"[Background Pipeline] Error for application {application_id}: {str(e)}")
    finally:
        db.close()


@router.post("/")
async def create_application(
    background_tasks: BackgroundTasks,
    company: str = Form(...),
    job_title: str = Form(...),
    jd_text: str | None = Form(None),
    jd_url: str | None = Form(None),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    try:
        
        file_path = os.path.join(
            UPLOAD_FOLDER,
            resume.filename
        )
        
        with open(file_path, "wb") as f:
            content = await resume.read()
            f.write(content)
        
        parsed_resume = parse_resume(file_path)
        
        if not parsed_resume:
            raise HTTPException(status_code=400, detail="Unable to parse resume.")
        
        # Handle JD URL if provided
        if jd_url and not jd_text:
            jd_text = job_description(jd_url)
        if not jd_text:
            raise HTTPException(status_code=400, detail="Provide Job Description or Job URL.")
        
        # Step 1: Create the application record immediately (fast)
        application = Application(
            user_id = user.id,
            company_name = company,
            job_title = job_title,
            job_description = jd_text,
            resume_text = parsed_resume,
            resume_filename = resume.filename,
            status = "not_applied"
        )
        
        db.add(application)
        db.commit()
        db.refresh(application)
        
        # Step 2: Schedule the AI pipeline to run in the background
        # The response is sent immediately — the AI pipeline continues after
        run_ai_pipeline_in_background(
    application.id,
    parsed_resume,
    jd_text
)
        
        # Return immediately — the AI pipeline runs in the background
        return {
            "success": True,
            "application_id": application.id,
            "company": application.company_name,
            "job_title": application.job_title
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/")
def get_apps(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    apps = db.query(
        Application
    ).filter(
        Application.user_id == user.id
    ).all()
    
    return apps

@router.get("/{app_id}")
def get_id(
    app_id: int,
    db:Session = Depends(
        get_db
    ),
    
    user = Depends (
        get_current_user
    )
):
    
    application = db.query(
        Application
    ).filter(
        Application.id == app_id,
        Application.user_id == user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    draft = db.query(
        Draft
    ).filter(
        Draft.application_id == application.id
    ).first()
    
    ats_score = None
    if draft and draft.ats_score:
        try:
            ats_score = json.loads(draft.ats_score)
        except Exception:
            ats_score = {"score": 0, "missing_keywords": [], "strengths": [], "suggestions": ["Corrupt data"]}

    return {
            "application": {
                "id": application.id,
                "company_name": application.company_name,
                "job_title": application.job_title,
                "status": application.status,
                "resume_filename": application.resume_filename
            },
            "draft_id" : draft.id if draft else None,
            "draft": {
                "fit_analysis": draft.fit_analysis if draft else None,
                "resume_rewrite": draft.resume_rewrite if draft else None,
                "cover_letter": draft.cover_letter if draft else None,
                "interview_pack": draft.interview_pack if draft else None,
                "ats_score": ats_score
            }
    }
    
@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    application = db.query(
        Application
    ).filter(
        Application.id == application_id, 
        Application.user_id == user.id
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    draft = db.query(
        Draft
    ).filter(
        Draft.application_id == application.id
    ).first()

    if draft:
        db.delete(draft)

    db.delete(application)
    db.commit()
    
    return {
        "message": "Application Deleted"
    }
    

@router.patch("/{application_id}/status")
def update_status(
    application_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    application = db.query(
        Application
    ).filter(
        Application.id == application_id,
        Application.user_id == user.id
        
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not Found.")
    
    if payload.status not in VALID_STATUS:
        raise HTTPException(status_code=400, detail="invalid status")
    
    application.status = payload.status
    db.commit()
    db.refresh(application)
    
    return{
        "application_id": application.id,
        "status": application.status
    }