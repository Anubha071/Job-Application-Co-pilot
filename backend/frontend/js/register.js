const form = document.getElementById("registerForm");
const messageEl = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    messageEl.innerText = "Registering...";

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      messageEl.innerText = data.message || "Registered";
      setTimeout(() => (window.location.href = "/static/html/login.html"), 1200);
    } else {
      messageEl.innerText = data.detail || data.message || JSON.stringify(data);
    }
  } catch (err) {
    messageEl.innerText = err.message;
  }
});
