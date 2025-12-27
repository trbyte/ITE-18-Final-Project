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

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));
// Serve static files from assets directory
app.use('/assets', express.static(path.join(__dirname, '../assets')));

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

  try {
    // 1. Get current PB
    const result = await db.query("SELECT score FROM player_progress WHERE user_id = $1", [userId]);
    
    if (result.rows.length > 0) {
      const currentPB = result.rows[0].score;
      // 2. Only UPDATE if new score is higher
      if (score > currentPB) {
        await db.query(
          "UPDATE player_progress SET score = $1, last_played = CURRENT_TIMESTAMP WHERE user_id = $2",
          [score, userId]
        );
      } else {
        // Just update the 'last_played' timestamp
        await db.query("UPDATE player_progress SET last_played = CURRENT_TIMESTAMP WHERE user_id = $1", [userId]);
      }
    } else {
      // First time player
      await db.query("INSERT INTO player_progress (user_id, score) VALUES ($1, $2)", [userId, score]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// GET USER HIGHSCORE
app.get("/api/highscore", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT 
         highscore,
         score as last_score,
         last_played,
         -- Rank among all users
         (SELECT COUNT(*) + 1 
          FROM player_progress pp2 
          WHERE pp2.highscore > pp.highscore) as rank
       FROM player_progress pp
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        highscore: 0,
        last_score: 0,
        rank: null,
        message: "No games played yet"
      });
    }

    const data = result.rows[0];
    res.json({
      highscore: data.highscore || 0,
      last_score: data.score || 0,
      rank: data.rank,
      last_played: data.last_played ? 
        new Date(data.last_played).toISOString() : null
    });

  } catch (err) {
    console.error("Error loading highscore:", err);
    res.status(500).json({ error: "Failed to load highscore" });
  }
});


app.get("/load-progress", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query("SELECT score, last_played FROM player_progress WHERE user_id = $1", [userId]);
    if (result.rows.length === 0) return res.json({ score: 0, last_played: null });

    res.json({
      score: result.rows[0].score,
      last_played: result.rows[0].last_played // This is the full timestamp
    });
  } catch (err) {
    res.status(500).send("Error");
  }
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: "drive-smart"
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
    message: "Drive Smart API",
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

// Export app for Vercel serverless functions
export default app;

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
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
}