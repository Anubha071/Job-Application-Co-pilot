
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

// Load applications
async function loadApplications() {
    try {
        const apps = await fetchJson(`${API_BASE}/applications`);
        const select = document.getElementById("appSelect");
        select.innerHTML = '<option value="">-- Select an application --</option>';
        apps.forEach(app => {
            const opt = document.createElement("option");
            opt.value = app.id;
            opt.textContent = `${app.job_title} @ ${app.company_name}`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed to load applications:", err);
    }
}

// Generate negotiation advice
document.getElementById("generateBtn").addEventListener("click", async () => {
    const appId = document.getElementById("appSelect").value;
    if (!appId) {
        document.getElementById("message").textContent = "Please select an application.";
        document.getElementById("message").style.color = "crimson";
        return;
    }
    
    const btn = document.getElementById("generateBtn");
    btn.textContent = "Generating...";
    btn.disabled = true;
    document.getElementById("message").textContent = "Analyzing your resume and generating negotiation advice...";
    document.getElementById("message").style.color = "#333";
    
    try {
        const data = await fetchJson(`${API_BASE}/salary-coach/generate`, {
            method: "POST",
            body: JSON.stringify({
                application_id: parseInt(appId),
                current_offer: document.getElementById("currentOffer").value,
                current_salary: document.getElementById("currentSalary").value,
                location: document.getElementById("location").value,
                years_experience: document.getElementById("yearsExp").value
            })
        });
        
        // Display results
        document.getElementById("marketContext").textContent = data.market_context;
        document.getElementById("results").style.display = "block";
        
        // Scripts
        document.querySelector("#emailScript .pre-box").textContent = data.negotiation_scripts.email_script;
        document.querySelector("#phoneScript .pre-box").textContent = data.negotiation_scripts.phone_script;
        document.querySelector("#counterScript .pre-box").textContent = data.negotiation_scripts.counter_offer_script;
        document.getElementById("scriptsSection").style.display = "block";
        
        // Talking points
        const talkList = document.getElementById("talkingPointsList");
        talkList.innerHTML = "";
        (data.talking_points || []).forEach(tp => {
            const li = document.createElement("li");
            li.textContent = tp;
            talkList.appendChild(li);
        });
        document.getElementById("talkingPointsSection").style.display = "block";
        
        // Questions to ask
        const qList = document.getElementById("questionsList");
        qList.innerHTML = "";
        (data.questions_to_ask || []).forEach(q => {
            const li = document.createElement("li");
            li.textContent = q;
            qList.appendChild(li);
        });
        document.getElementById("questionsSection").style.display = "block";
        
        // Strategy tips
        const stratList = document.getElementById("strategyList");
        stratList.innerHTML = "";
        (data.strategy_tips || []).forEach(tip => {
            const li = document.createElement("li");
            li.textContent = tip;
            stratList.appendChild(li);
        });
        document.getElementById("strategySection").style.display = "block";
        
        // Walkaway point
        document.getElementById("walkawayPoint").textContent = data.walkaway_point;
        document.getElementById("walkawaySection").style.display = "block";
        
        document.getElementById("message").textContent = "✅ Negotiation advice generated successfully!";
        document.getElementById("message").style.color = "green";
        
        // Scroll to results
        document.getElementById("results").scrollIntoView({ behavior: "smooth" });
        
    } catch (err) {
        document.getElementById("message").textContent = "Error: " + err.message;
        document.getElementById("message").style.color = "crimson";
    } finally {
        btn.textContent = "Generate Negotiation Advice";
        btn.disabled = false;
    }
});

// Tab switching for scripts
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        // Remove active from all tabs
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        
        // Activate clicked tab
        btn.classList.add("active");
        const tabId = btn.dataset.tab + "Script";
        document.getElementById(tabId).classList.add("active");
    });
});

// Copy to clipboard - finds the parent tab-content's pre-box
document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const parentTab = btn.closest(".tab-content");
        const pre = parentTab ? parentTab.querySelector(".pre-box") : null;
        if (pre) {
            navigator.clipboard.writeText(pre.textContent).then(() => {
                const originalText = btn.textContent;
                btn.textContent = "✅ Copied!";
                setTimeout(() => { btn.textContent = originalText; }, 2000);
            }).catch(err => {
                console.error("Copy failed:", err);
            });
        }
    });
});

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