
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/static/html/login.html";
}

function authHeaders() {
    return { Authorization: `Bearer ${token}` };
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            ...authHeaders(),
            ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {})
        }
    });
    if (!response.ok) {
        const text = await response.text();
        let detail;
        try { detail = JSON.parse(text).detail; } catch { detail = text || "Request failed"; }
        throw new Error(detail);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

let selectedAppId = null;

// Load applications
async function loadApplications() {
    try {
        const apps = await fetchJson(`${API_BASE}/applications`);
        const select = document.getElementById("appSelect");
        select.innerHTML = '<option value="">-- Select an application --</option>';
        apps.forEach(app => {
            const opt = document.createElement("option");
            opt.value = app.id;
            opt.textContent = `${app.company_name} - ${app.job_title} (${app.status})`;
            select.appendChild(opt);
        });
        return apps;
    } catch (err) {
        console.error("Failed to load applications:", err);
        return [];
    }
}

// Check follow-up status
document.getElementById("checkStatusBtn").addEventListener("click", async () => {
    const appId = document.getElementById("appSelect").value;
    if (!appId) {
        document.getElementById("statusMessage").textContent = "Please select an application.";
        document.getElementById("statusMessage").style.color = "crimson";
        return;
    }
    
    selectedAppId = parseInt(appId);
    
    try {
        const data = await fetchJson(`${API_BASE}/calendar/follow-up-status/${appId}`);
        
        document.getElementById("statusCompany").textContent = data.company_name;
        document.getElementById("statusPosition").textContent = data.job_title;
        
        const statusBadge = document.getElementById("statusAppStatus");
        statusBadge.textContent = data.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        statusBadge.className = "status-badge status-" + data.status;
        
        const followUpStatus = data.follow_up_status;
        document.getElementById("followUpAction").textContent = followUpStatus.suggested_action;
        
        const urgencyBadge = document.getElementById("urgencyBadge");
        urgencyBadge.textContent = `Urgency: ${followUpStatus.urgency.toUpperCase()}`;
        urgencyBadge.className = "urgency-badge urgency-" + followUpStatus.urgency;
        
        document.getElementById("statusDisplay").style.display = "block";
        document.getElementById("icsSection").style.display = "block";
        document.getElementById("statusMessage").textContent = "";
        
        // Scroll to status
        document.getElementById("statusDisplay").scrollIntoView({ behavior: "smooth" });
        
    } catch (err) {
        document.getElementById("statusMessage").textContent = "Error: " + err.message;
        document.getElementById("statusMessage").style.color = "crimson";
    }
});

// Generate ICS file
document.getElementById("generateICSBtn").addEventListener("click", async () => {
    if (!selectedAppId) {
        document.getElementById("icsMessage").textContent = "Please check an application's status first.";
        document.getElementById("icsMessage").style.color = "crimson";
        return;
    }
    
    const reminderDays = parseInt(document.getElementById("reminderSelect").value);
    const btn = document.getElementById("generateICSBtn");
    btn.textContent = "Generating...";
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/calendar/generate-ics`, {
            method: "POST",
            headers: {
                ...authHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                application_id: selectedAppId,
                reminder_days: reminderDays
            })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Generation failed");
        }
        
        // Download the .ics file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `follow_up_reminder_${reminderDays}days.ics`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        document.getElementById("icsMessage").textContent = "✅ Calendar file downloaded! Open it to add the reminder to your calendar.";
        document.getElementById("icsMessage").style.color = "green";
        
    } catch (err) {
        document.getElementById("icsMessage").textContent = "Error: " + err.message;
        document.getElementById("icsMessage").style.color = "crimson";
    } finally {
        btn.textContent = "📥 Download .ics File";
        btn.disabled = false;
    }
});

// Load all applications overview
async function loadAllAppsOverview() {
    try {
        const apps = await fetchJson(`${API_BASE}/applications`);
        const container = document.getElementById("allAppsFollowUps");
        
        if (!apps || apps.length === 0) {
            container.innerHTML = "<p>No applications found. <a href='create-application.html'>Create one</a> to get started.</p>";
            return;
        }
        
        let html = '<div class="apps-followup-grid">';
        apps.forEach(app => {
            const statusClass = "status-" + (app.status || "not_applied");
            const statusLabel = (app.status || "not_applied").replace(/_/g, " ");
            
            html += `
                <div class="followup-card">
                    <h4>${app.job_title}</h4>
                    <p class="muted-text">${app.company_name}</p>
                    <p>Status: <span class="status-badge ${statusClass}">${statusLabel}</span></p>
                    <button onclick="selectAndCheck(${app.id})" class="secondary-btn">Check Follow-up</button>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (err) {
        document.getElementById("allAppsFollowUps").innerHTML = "<p>Error loading applications.</p>";
        console.error(err);
    }
}

// Helper: select app and check status
function selectAndCheck(appId) {
    document.getElementById("appSelect").value = appId;
    document.getElementById("checkStatusBtn").click();
}

// Logout
document.querySelectorAll("#logoutBtn, #logoutBtnSidebar").forEach(btn => {
    btn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("application_id");
        localStorage.removeItem("draft_id");
        window.location.href = "/static/html/login.html";
    });
});

// Initialize
loadApplications();
loadAllAppsOverview();