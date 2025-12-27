import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from 'url';
import { db } from "./db.js";

dotenv.config();
process.env.TZ = 'Asia/Manila';
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://road-safety-simulator.railway.app'
    : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../client')));

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*]/.test(password)) return "Password must contain at least one special character (!@#$%^&*)";
  return null;
}

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

app.post("/api/save-score", authenticateToken, async (req, res) => {
  const { score } = req.body;
  const userId = req.user.id;

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

app.get("/load-progress", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT 
         level, 
         score, 
         last_played as last_played_utc,
         -- Convert UTC to Manila time in the query
         (last_played AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila') as last_played_manila
       FROM player_progress 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        level: 1, 
        score: 0, 
        last_played_utc: null,
        last_played_manila: null,
        last_played_formatted: null
      });
    }

    const progress = result.rows[0];
    let formattedDate = null;
    if (progress.last_played_manila) {
      const manilaDate = new Date(progress.last_played_manila);
      formattedDate = manilaDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    res.json({
      score: progress.score || 0,
      last_played_utc: progress.last_played_utc ? 
        new Date(progress.last_played_utc).toISOString() : null,
      last_played_manila: progress.last_played_manila ? 
        new Date(progress.last_played_manila).toISOString() : null,
      last_played_formatted: formattedDate
    });

  } catch (err) {
    console.error("Error loading progress:", err);
    res.status(500).json({ error: "Failed to load progress" });
  }
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: "road-safety-simulator"
  });
});

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

app.get("/api", (req, res) => {
  res.json({ 
    message: "Road Safety Simulator API",
    version: "1.0.0",
    endpoints: {
      auth: ["POST /register", "POST /login"],
      scores: ["POST /api/save-score", "GET /load-progress"],
      health: ["GET /health", "GET /test-db"]
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.get('/game.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'game.html'));
});

app.get('/game3d.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'game3d.html'));
});

app.get('/*splat', (req, res) => {
  if (req.path.includes('.')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});