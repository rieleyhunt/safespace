require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool instance to connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Function to check the database connection
async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully.');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

module.exports = {
  pool,
  checkDatabaseConnection
};
