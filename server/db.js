import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pkg;

// Determine if SSL is needed based on the connection string
// Cloud providers typically require SSL, local databases usually don't
const needsSSL = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('neon.tech') ||
  process.env.DATABASE_URL.includes('railway.app') ||
  process.env.DATABASE_URL.includes('heroku') ||
  process.env.DATABASE_URL.includes('amazonaws.com') ||
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('render.com') ||
  process.env.USE_SSL === 'true'
);

const poolConfig = {
  connectionString: process.env.DATABASE_URL
};

if (needsSSL) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const db = new Pool(poolConfig);

db.connect()
  .then(() => console.log("✅ Connected to database"))
  .catch(err => {
    console.error("❌ DB Connection Error:", err.message);
    console.error("Full error:", err);
  });
