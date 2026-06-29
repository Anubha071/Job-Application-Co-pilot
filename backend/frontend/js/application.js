
const token = localStorage.getItem("token");
const applicationId = localStorage.getItem("application_id");

if(!token) { 
    window.location.href = "/static/html/login.html";
}

if(!applicationId) {
    window.location.href = "/static/html/dashboard.html"
}

const statusMap = {
    not_applied: "not_applied",
    applied: "applied",
    interviewed: "interviewed",
    rejected: "rejected",
    offer: "offer"
};

function authHeaders() {
    return {
        Authorization: `Bearer ${token}`
    };
}

function showMessage(id, text, isError = false) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.style.color = isError ? "crimson" : "green";
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
    headers: {
        ...options.headers,
        ...authHeaders()
    }
    });

    if(!response.ok) {
        const text = await response.text();
        let detail;
        try {
            detail = JSON.parse(text).detail;
        } catch {
            detail = text || "Request Failed";
        }
        throw new Error(detail);
    }

    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
}

function renderApplication(data) {
    const app = data.application;
    const draft = data.draft || {};

    document.getElementById("jobTitle").textContent = app.job_title || "Application Details";
    document.getElementById("companyName").textContent = app.company_name ? "Company: " + app.company_name : "";

    document.getElementById("statusSelect").value = app.status || "not_applied";

    document.getElementById("fitAnalysis").textContent = draft.fit_analysis || "No fit analysis yet.";
    document.getElementById("resumeRewrite").textContent = draft.resume_rewrite || "No resume rewrite yet.";
    document.getElementById("coverLetter").textContent = draft.cover_letter || "No cover letter yet.";
    document.getElementById("interviewPack").textContent = draft.interview_pack || "No interview pack yet.";
    
    // NEW: ATS score rendered as colorful progress circle with details
    const ats = draft.ats_score;
    if (ats) {
        const scoreClass = ats.score >= 70 ? "high" : ats.score >= 40 ? "mid" : "low";
        document.getElementById("atsScore").innerHTML = `
            <div class="ats-score-display">
                <div class="ats-score-circle ${scoreClass}">${ats.score}</div>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">ATS Match Score</p>
            </div>
            <div class="ats-detail-grid">
                <div class="ats-detail-card">
                    <h4>⚠️ Missing Keywords</h4>
                    <ul>${ats.missing_keywords && ats.missing_keywords.length ? ats.missing_keywords.map(k => `<li>${k}</li>`).join("") : "<li>None identified</li>"}</ul>
                </div>
                <div class="ats-detail-card">
                    <h4>💪 Strengths</h4>
                    <ul>${ats.strengths && ats.strengths.length ? ats.strengths.map(k => `<li>${k}</li>`).join("") : "<li>None identified</li>"}</ul>
                </div>
                <div class="ats-detail-card full-width" style="grid-column: 1 / -1;">
                    <h4>💡 Suggestions</h4>
                    <ul>${ats.suggestions && ats.suggestions.length ? ats.suggestions.map(k => `<li>${k}</li>`).join("") : "<li>None available</li>"}</ul>
                </div>
            </div>
        `;
    } else {
        document.getElementById("atsScore").innerHTML = '<p style="color: var(--text-secondary);">No ATS score yet. Generate an application kit first.</p>';
    }
}

async function loadApplication() {
    const data = await fetchJson(`${API_BASE}/applications/${applicationId}`);
    if (data.draft_id) {
        localStorage.setItem("draft_id", data.draft_id);
    }
    renderApplication(data);
}

async function updateStatus() {
    const status = document.getElementById("statusSelect").value;

    await fetchJson(`${API_BASE}/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({status})
    });

    showMessage("statusMessage", "Status Updated Successfully.")
}

async function regenerateSection(endpoint, targetId, fieldName) {
    const draftId = localStorage.getItem("draft_id");
    if (!draftId) {
        throw new Error("Draft ID not found");
    }

    const data = await fetchJson(`${API_BASE}/drafts/${draftId}/${endpoint}`, {
        method: "POST"
    });

    if (fieldName && data[fieldName]) {
        document.getElementById(targetId).textContent = data[fieldName];
    } else {
        await loadApplication();
    }
}
async function loadDiff() {
    const draftId = localStorage.getItem("draft_id");
    if (!draftId) {
        throw new Error("Draft ID not found");
    }

    const data = await fetchJson(`${API_BASE}/drafts/${draftId}/diff`);

    const diffArea = document.getElementById("diffArea");

    const diffHtml = data.diff.map(line => {
        let cls = "diff-line";
        if (line.startsWith("+")) cls += " diff-add";
        if (line.startsWith("-")) cls += " diff-remove";
        return `<div class="${cls}">${escapeHtml(line)}</div>`;
    }).join("");

    diffArea.innerHTML = `
        <div class="diff-grid">
            <div>
                <h3>Old Text</h3>
                <pre class="pre-box">${escapeHtml(data.old_text || "")}</pre>
            </div>
            <div>
                <h3>New Text</h3>
                <pre class="pre-box">${escapeHtml(data.new_text || "")}</pre>
            </div>
        </div>
        <h3>Line Diff</h3>
        <div class="diff-list">${diffHtml}</div>
    `;
}

// BROKEN CODE: was replacing "&" with "&" (no-op), & never escaped
function escapeHtml(text) {
    return text
        .replaceAll("&", "&" + "amp;")
        .replaceAll("<", "&" + "lt;")
        .replaceAll(">", "&" + "gt;");
}

async function downloadFile(endpoint, filename) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: authHeaders()
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Download failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
}

document.getElementById("saveStatusBtn").addEventListener("click", async () => {
    try {
        await updateStatus();
    } catch (error) {
        showMessage("statusMessage", error.message, true);
    }
});

document.getElementById("loadDiffBtn").addEventListener("click", async () => {
    try {
        await loadDiff();
    } catch (error) {
        const diffArea = document.getElementById("diffArea");
        diffArea.innerHTML = `<p class="error-text">${error.message}</p>`;
    }
});

document.getElementById("regenResumeBtn").addEventListener("click", async () => {
    try {
        await regenerateSection("regenerate-resume", "resumeRewrite", "resume_rewrite");
        await loadDiff();
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById("regenFitBtn").addEventListener("click", async () => {
    try {
        await regenerateSection("regenerate-fit", "fitAnalysis", "fit_analysis");
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById("regenCoverBtn").addEventListener("click", async () => {
    try {
        await regenerateSection("regenerate-cover", "coverLetter", "cover_letter");
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById("regenInterviewBtn").addEventListener("click", async () => {
    try {
        await regenerateSection("regenerate-interview", "interviewPack", "interview_pack");
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById("downloadResumeDocxBtn").addEventListener("click", async () => {
    try {
        const draftId = localStorage.getItem("draft_id");
        await downloadFile(`/downloads/resume-docx/${draftId}`, `resume_${draftId}.docx`);
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById("downloadCoverDocxBtn").addEventListener("click", async () => {
    try {
        const draftId = localStorage.getItem("draft_id");
        await downloadFile(`/downloads/cover-docx/${draftId}`, `cover_letter_${draftId}.docx`);
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById("downloadResumePdfBtn").addEventListener("click", async () => {
    try {
        const draftId = localStorage.getItem("draft_id");
        await downloadFile(`/downloads/resume-pdf/${draftId}`, `resume_${draftId}.pdf`);
    } catch (error) {
        alert(error.message);
    }
});

function setupLogout() {
    document.querySelectorAll("#logoutBtn, #logoutBtnSidebar").forEach(btn => {
        btn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("application_id");
            localStorage.removeItem("draft_id");
            window.location.href = "/static/html/login.html";
        });
    });
}

setupLogout();

document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "/static/html/dashboard.html";
});

document
.getElementById(
    "revisionHistoryBtn"
)
.addEventListener(

    "click",

    () => {

        window.location.href =
            "/static/html/revision.html"
    }
)

loadApplication();