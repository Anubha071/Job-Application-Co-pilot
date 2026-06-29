const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/static/html/login.html";
}

const message = document.getElementById("message");
const submitBtn = document.getElementById("submitAppBtn");

submitBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const company = document.getElementById("company").value.trim();
  const jobTitle = document.getElementById("jobTitle").value.trim();
  const jdText = document.getElementById("jdText").value.trim();
  const jdUrl = document.getElementById("jdUrl").value.trim();
  const resumeFile = document.getElementById("resume").files[0];

  // Validate
  if (!company || !jobTitle) {
    message.textContent = "❌ Please fill in Company and Job Title.";
    message.className = "message error";
    return;
  }
  if (!resumeFile) {
    message.textContent = "❌ Please upload your resume (PDF).";
    message.className = "message error";
    return;
  }
  if (!jdText && !jdUrl) {
    message.textContent = "❌ Please provide a Job Description or a Job URL.";
    message.className = "message error";
    return;
  }

  const formData = new FormData();
  formData.append("company", company);
  formData.append("job_title", jobTitle);
  formData.append("jd_text", jdText);
  formData.append("jd_url", jdUrl);
  formData.append("resume", resumeFile);

  submitBtn.textContent = "⏳ Generating...";
  submitBtn.disabled = true;
  message.textContent = "⏳ Uploading resume and creating your application kit...";
  message.className = "message";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null;
    }

    if (res.ok && data && data.application_id) {
      // Save the app ID and redirect to dashboard
      localStorage.setItem("application_id", data.application_id);
      message.textContent = "✅ Application created! Taking you to dashboard...";
      message.className = "message success";
      
      // ⚠️ Direct redirect — no setTimeout needed, no form to interfere
      window.location.replace("/static/html/dashboard.html");
      return;
    } else {
      const errMsg = data?.detail || data?.message || "Failed to create application.";
      message.textContent = "❌ " + errMsg;
      message.className = "message error";
      submitBtn.textContent = "🚀 Generate Application Kit";
      submitBtn.disabled = false;
    }
  } catch (err) {
    // Show error but STILL redirect to dashboard so user isn't stuck
    console.error("Application creation error:", err.message);
    message.textContent = "⚠️ Request submitted but there was a network issue. Redirecting to dashboard...";
    message.className = "message";
    submitBtn.textContent = "🚀 Generate Application Kit";
    submitBtn.disabled = false;
    
    // 🚨 Always redirect to dashboard even on error — the background task may still succeed
    setTimeout(() => {
      window.location.replace("/static/html/dashboard.html");
    }, 2000);
  }
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

// Allow pressing Enter in any input to trigger submit
document.querySelectorAll("#applicationForm input, #applicationForm textarea").forEach(el => {
  el.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !submitBtn.disabled) {
      e.preventDefault();
      submitBtn.click();
    }
  });
});
