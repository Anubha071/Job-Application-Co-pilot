

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    message.innerText = "Logging in...";

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.access_token);
      window.location.href = "/static/html/dashboard.html";
    } else {
      message.innerText = data.detail || data.message || JSON.stringify(data);
    }
  } catch (err) {
    message.innerText = err.message;
  }
});


