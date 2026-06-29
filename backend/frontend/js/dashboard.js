const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/static/html/login.html";
}

let applications = [];
let pendingDeleteId = null;

async function loadApplications() {
  try {
    const response = await fetch(`${API_BASE}/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/static/html/login.html";
      return;
    }

    const data = await response.json();
    applications = data;
    updateStats(data);
    renderApplications(data);
    document.getElementById("appCount").textContent = data.length;
  } catch (error) {
    console.error(error);
    document.getElementById("applicationsContainer").innerHTML = 
      '<p style="padding: 20px; text-align: center; color: var(--text-secondary);">Failed to load applications. Make sure the server is running.</p>';
  }
}

function updateStats(apps) {
  document.getElementById("totalApps").textContent = apps.length;
  
  const active = apps.filter(a => a.status === "applied" || a.status === "interviewed").length;
  document.getElementById("activeApps").textContent = active;
  
  const offers = apps.filter(a => a.status === "offer").length;
  document.getElementById("offerApps").textContent = offers;
  
  const responded = apps.filter(a => a.status === "interviewed" || a.status === "offer" || a.status === "rejected").length;
  const rate = apps.length > 0 ? Math.round((responded / apps.length) * 100) : 0;
  document.getElementById("responseRate").textContent = rate + "%";
}

function renderApplications(applications) {
  const container = document.getElementById("applicationsContainer");
  container.innerHTML = "";

  if (applications.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
        <div style="font-size: 3rem; margin-bottom: 12px;">📋</div>
        <p style="font-size: 1.1rem; margin-bottom: 8px;">No applications found</p>
        <p style="font-size: 0.9rem;">Create your first application to get started!</p>
        <a href="create-application.html" class="btn-primary" style="margin-top: 16px; display: inline-flex;">➕ New Application</a>
      </div>
    `;
    return;
  }

  applications.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";
    
    const statusLabel = (app.status || "not_applied").replace(/_/g, " ");
    
    card.innerHTML = `
      <div class="app-card-info">
        <h4>${app.job_title || "Untitled Position"}</h4>
        <p>${app.company_name || "Unknown Company"}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="status-badge ${app.status || "not_applied"}">${statusLabel}</span>
        <div class="app-card-actions">
          <button onclick="openApplication(${app.id})" class="btn-primary btn-sm">Open</button>
          <button onclick="showDeleteModal(${app.id})" class="btn-danger btn-sm">🗑️</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function openApplication(applicationId) {
  localStorage.setItem("application_id", applicationId);
  window.location.href = "/static/html/application.html";
}

// ⭐ Fancy modal delete confirmation
function showDeleteModal(applicationId) {
  pendingDeleteId = applicationId;
  document.getElementById("deleteModal").classList.add("active");
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  
  const btn = document.getElementById("confirmDeleteBtn");
  btn.textContent = "Deleting...";
  btn.disabled = true;
  
  await fetch(`${API_BASE}/applications/${pendingDeleteId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  document.getElementById("deleteModal").classList.remove("active");
  btn.textContent = "Yes, Delete It";
  btn.disabled = false;
  
  showToast("Application deleted", "success");
  pendingDeleteId = null;
  loadApplications();
}

function cancelDelete() {
  pendingDeleteId = null;
  document.getElementById("deleteModal").classList.remove("active");
}

// Wire up modal buttons
document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
document.getElementById("cancelDeleteBtn").addEventListener("click", cancelDelete);
// Close on overlay click
document.getElementById("deleteModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) cancelDelete();
});

function filterApplications() {
  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;

  let filtered = applications;

  if (searchText) {
    filtered = filtered.filter(
      app =>
        (app.company_name || "").toLowerCase().includes(searchText) ||
        (app.job_title || "").toLowerCase().includes(searchText)
    );
  }
  if (status) {
    filtered = filtered.filter(app => app.status === status);
  }
  renderApplications(filtered);
  document.getElementById("appCount").textContent = filtered.length;
}

// Toast notification helper
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  toast.innerHTML = `${icons[type] || ""} ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.getElementById("searchInput").addEventListener("input", filterApplications);
document.getElementById("statusFilter").addEventListener("change", filterApplications);

document.querySelectorAll("#logoutBtn, #logoutBtnSidebar").forEach(btn => {
  if (btn) btn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("application_id");
    localStorage.removeItem("draft_id");
    window.location.href = "/static/html/login.html";
  });
});

loadApplications();