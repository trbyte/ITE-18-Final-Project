import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./db.js";

dotenv.config();

const app = express();

// -----------------------------
// MIDDLEWARE
// -----------------------------
app.use(cors());
app.use(express.json());

// * UPDATED: SERVE THE CLIENT FOLDER *
// "../client" means: Go up one level, then into the 'client' folder.
app.use(express.static('../client'));

// Password Validation Helper
function validatePassword(password) {
  if (password.length < 😎 return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*]/.test(password)) return "Password must contain at least one special character (!@#$%^&*)";
  return null;
}

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
// AUTH ROUTES
// -----------------------------

// REGISTER
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

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

    if (!result.rows.length) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      token, 
      user: {
        id: user.id,
        username: user.username
      } 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// SCORE ROUTES
// -----------------------------

// SAVE PLAYER SCORE (Authenticated)
app.post("/api/save-score", authenticateToken, async (req, res) => {
  const { score } = req.body;
  const userId = req.user.id;

  console.log(Saving score for user ID ${userId}: ${score});

  if (score === undefined || score === null) {
    return res.status(400).json({ error: "Score is required" });
  }

  const scoreValue = parseInt(score);
  if (isNaN(scoreValue)) {
    return res.status(400).json({ error: "Score must be a number" });
  }

  try {
    const checkResult = await db.query(
      "SELECT * FROM player_progress WHERE user_id = $1",
      [userId]
    );

    if (checkResult.rows.length > 0) {
      await db.query(
        `UPDATE player_progress 
         SET score = $1, last_played = CURRENT_TIMESTAMP 
         WHERE user_id = $2`,
        [scoreValue, userId]
      );
    } else {
      await db.query(
        `INSERT INTO player_progress (user_id, score, last_played) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [userId, scoreValue]
      );
    }

    console.log("Score saved successfully for user:", userId);

    res.json({ 
      success: true, 
      message: "Score saved successfully",
      score: scoreValue 
    });

  } catch (err) {
    console.error("Error saving score:", err);
    res.status(500).json({ error: "Failed to save score to database" });
  }
});

// LOAD PROGRESS (Authenticated)
app.get("/load-progress", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT level, score, last_played 
       FROM player_progress 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        level: 1,
        score: 0,
        last_played: null
      });
    }

    const progress = result.rows[0];
    res.json({
      level: progress.level || 1,
      score: progress.score || 0,
      last_played: progress.last_played
    });

  } catch (err) {
    console.error("Error loading progress:", err);
    res.status(500).json({ error: "Failed to load progress" });
  }
});

// -----------------------------
// ROUTES
// -----------------------------

// Redirect root URL to game.html
app.get("/", (req, res) => {
  res.redirect('/game.html');
});

// Test database connection
app.get("/test-db", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW() as current_time");
    res.json({ 
      message: "Database connected successfully",
      time: result.rows[0].current_time 
    });
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "road-safety-simulator"
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(🚀 Server running on http://localhost:${PORT});
  console.log(👉 Open http://localhost:${PORT} to play!);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});
