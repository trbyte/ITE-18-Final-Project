// db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === "production";


if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? { rejectUnauthorized: false } 
    : false,                        
});


db.connect()
  .then(() => console.log("Connected to Neon DB"))
  .catch(err => console.error("DB Connection Error:", err));