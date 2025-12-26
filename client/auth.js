const API = "http://localhost:5000";
const messageEl = document.getElementById("message");

/* ======================
   SYSTEM MESSAGE
====================== */
function showMessage(text, type = "") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = "system-message " + type;
}

/* ======================
   PAGE NAVIGATION
====================== */
function goToRegister() {
  window.location.href = "register.html";
}

function goToLogin() {
  window.location.href = "index.html";
}

/* ======================
   PASSWORD VALIDATION
====================== */
function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*]/.test(password)) return "Password must contain at least one special character (!@#$%^&*)";
  return null;
}

/* ======================
   REGISTER
====================== */
async function handleRegister() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  showMessage("");

  if (!username || !password) {
    showMessage("All fields are required", "error");
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    showMessage(passwordError, "error");
    return;
  }

  showMessage("Creating driver profile...");

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      let errorMessage = "Registration failed";
      try {
        const data = await res.json();
        errorMessage = data.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${res.status} ${res.statusText}`;
      }
      showMessage(errorMessage, "error");
      return;
    }

    const data = await res.json();
    showMessage("Driver created! Redirecting to login...", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (err) {
    console.error("Registration error:", err);
    const errorMsg = err.message || "Unknown error";
    showMessage(`Cannot connect to game server: ${errorMsg}. Make sure the server is running on ${API}`, "error");
  }
}

/* ======================
   LOGIN
====================== */
async function handleLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  showMessage("");

  if (!username || !password) {
    showMessage("All fields are required", "error");
    return;
  }

  showMessage("Verifying credentials...");

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      let errorMessage = "Access denied";
      try {
        const data = await res.json();
        errorMessage = data.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${res.status} ${res.statusText}`;
      }
      showMessage(errorMessage, "error");
      return;
    }

    const data = await res.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showMessage("Access granted! Loading simulation...", "success");

    setTimeout(() => {
      window.location.href = "game.html";
    }, 1500);

  } catch (err) {
    console.error("Login error:", err);
    const errorMsg = err.message || "Unknown error";
    showMessage(`Cannot connect to game server: ${errorMsg}. Make sure the server is running on ${API}`, "error");
  }
}

/* ======================
   PLAYER PROGRESS
====================== */

// Load progress from backend
async function loadProgress() {
  const token = localStorage.getItem("token");
  if (!token) return { level: 1, score: 0 };

  try {
    const res = await fetch(`${API}/load-progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to load progress:", err);
    return { level: 1, score: 0 };
  }
}

// Save progress to backend
async function saveProgress(level, score) {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    await fetch(`${API}/save-progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ level, score })
    });
  } catch (err) {
    console.error("Failed to save progress:", err);
  }
}
