import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./db.js"; // your existing db.js

dotenv.config();

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json());

// -----------------------------
// Password Validation Helper
// -----------------------------
function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*]/.test(password)) return "Password must contain at least one special character (!@#$%^&*)";
  return null;
}

// -----------------------------
// AUTH ROUTES
// -----------------------------

// REGISTER
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "All fields are required" });

  const passwordError = validatePassword(password);
  if (passwordError)
    return res.status(400).json({ error: passwordError });

  const hashed = await bcrypt.hash(password, 10);

  try {
    await db.query(
      "INSERT INTO users(username, password) VALUES ($1,$2)",
      [username, hashed]
    );
    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Username already exists" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    if (!result.rows.length)
      return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid)
      return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// AUTH MIDDLEWARE
// -----------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// -----------------------------
// PLAYER PROGRESS ROUTES
// -----------------------------

// SAVE PLAYER PROGRESS
app.post("/save-progress", authenticateToken, async (req, res) => {
  const { level, score } = req.body;
  const userId = req.user.id;

  try {
    await db.query(
      `INSERT INTO player_progress (user_id, level, score)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET level = $2, score = $3, last_played = CURRENT_TIMESTAMP`,
      [userId, level || 1, score || 0]
    );

    res.json({ message: "Progress saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

// LOAD PLAYER PROGRESS
app.get("/load-progress", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      "SELECT * FROM player_progress WHERE user_id = $1",
      [userId]
    );

    if (!result.rows.length) {
      return res.json({ level: 1, score: 0 });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load progress" });
  }
});

// -----------------------------
// TEST ROUTE
// -----------------------------
app.get("/", (req, res) => {
  res.send("Server is running");
});

// -----------------------------
// START SERVER
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
