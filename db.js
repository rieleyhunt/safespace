require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool instance to connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Supabase pooler connection settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Connection timeout
});

// Handle pool errors to prevent crashes
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client:', err.message);
  // Don't exit the process - the pool will handle reconnection
});

// Function to check the database connection
async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully.');
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

module.exports = {
  pool,
  checkDatabaseConnection
};
