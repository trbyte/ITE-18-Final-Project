import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // NeonDB requires SSL
  ssl: {
    rejectUnauthorized: false,
    require: true
  },
  
  // Optimize for NeonDB's connection pooling
  max: 10, 
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  
  // NeonDB-specific optimizations
  application_name: 'road-safety-simulator',
  
 
  statement_timeout: 5000
});

// Connection event handlers
db.on('connect', (client) => {
  console.log('NeonDB: New client connected');
});

db.on('error', (err, client) => {
  console.error('NeonDB: Unexpected error on idle client', err);
});

db.on('remove', (client) => {
  console.log('ℹNeonDB: Client removed from pool');
});

// Test connection function
export async function testNeonConnection() {
  try {
    const client = await db.connect();
    const result = await client.query('SELECT version(), current_timestamp');
    client.release();
    
    console.log('NeonDB Connection Test:');
    console.log('   Version:', result.rows[0].version);
    console.log('   Time:', result.rows[0].current_timestamp);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('NeonDB Connection Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run connection test on startup
if (process.env.NODE_ENV !== 'test') {
  setTimeout(async () => {
    await testNeonConnection();
  }, 1000);
}