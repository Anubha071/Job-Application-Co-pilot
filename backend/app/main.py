from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse
from pathlib import Path
from fastapi.openapi.utils import get_openapi
from app.database import Base, engine, ensure_sqlite_schema
from app.routes.auth import router as auth_router
from app.routes.application import router as app_router
from app.routes.regenerate import router as regenerate_router
import app.models.user
import app.models.application
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import app.models.draft
import app.models.revision
from app.routes.downloads import router as download_router
from app.routes.revision import router as revision_router
from app.routes.voice_interview import router as voice_interview_router
from app.routes.salary_coach import router as salary_coach_router
from app.routes.calendar_routes import router as calendar_router

# BROKEN CODE: Base.metadata.create_all only creates missing tables.
# It does not alter existing SQLite tables when models change, so old DB files
# can remain missing newly added columns like resume_text.
ensure_sqlite_schema()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Application Tracker API",
    description="API for tracking job applications, built with FastAPI and SQLAlchemy.",
)

BASE_DIR = Path(__file__).resolve().parent.parent
frontend_dir = BASE_DIR / "frontend"

app.mount(
    "/static",
    StaticFiles(directory=str(frontend_dir), html=True),
    name="static"
)

# Provide a simple redirect so requests to `/static/html` go to a usable page.
# Register this route before mounting StaticFiles so the redirect is matched
# instead of being intercepted by the static mount.
@app.get("/static/html")
def static_html_index():
    return RedirectResponse(url="/static/html/login.html")

if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir), html=True), name="static")


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        description=app.description,
        routes=app.routes,
    )
    # BROKEN CODE: scheme name mismatch between security dependency and OpenAPI component
    # The Security dependency uses scheme_name="Bearer", so the OpenAPI component must match that.
    # If it does not match, Swagger UI may not correctly bind the Authorization field.
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# DEBUGGING: Middleware to log all requests and headers
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print("\n" + "=" * 80)
        print(f"📨 INCOMING REQUEST: {request.method} {request.url.path}")
        print(f"Headers:")
        for header_name, header_value in request.headers.items():
            if header_name.lower() == "authorization":
                # Show first 50 chars of token for security
                print(f"  {header_name}: {header_value[:50]}...")
            else:
                print(f"  {header_name}: {header_value}")
        print("=" * 80 + "\n")
        response = await call_next(request)
        return response

app.add_middleware(RequestLoggingMiddleware)

# BROKEN CODE: without CORS middleware allowing Authorization headers,
# browsers will reject requests with custom headers like Authorization: Bearer <token>,
# causing 401 Unauthorized errors even when the token is valid.
# Add CORS middleware to allow Authorization header and credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # Includes Authorization header
)

app.include_router(
    auth_router # Include the authentication routes
)

# BROKEN CODE: If the applications router is not included, routes like
# PATCH /applications/{application_id}/status will not appear in Swagger UI.
app.include_router(
    app_router # Include the application management routes
)

# BROKEN CODE: The drafts/regenerate router was not included, so
# endpoints like GET /drafts/{draft_id}/diff never appeared in Swagger.
app.include_router(
    regenerate_router
)

app.include_router(
    download_router
)

app.include_router(
    revision_router
)

app.include_router(
    voice_interview_router
)

app.include_router(
    salary_coach_router
)

app.include_router(
    calendar_router
)

@app.get("/")
def home():
    return FileResponse(frontend_dir / "html" / "login.html")