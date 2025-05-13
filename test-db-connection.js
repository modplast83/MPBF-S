// Test Database Connection Script
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws; // Required for Neon serverless

console.log('Testing database connection...');

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Test connection with a simple query
    console.log('Executing test query...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('Connection successful!');
    console.log('Current database time:', result.rows[0].current_time);
    
    // List tables in the database
    console.log('\nListing database tables:');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      tablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }
    
    // Check users table specifically
    console.log('\nChecking users table:');
    try {
      const usersResult = await pool.query('SELECT COUNT(*) as user_count FROM users');
      console.log(`Users table exists with ${usersResult.rows[0].user_count} records`);
      
      // Check if admin user exists
      const adminCheck = await pool.query(`SELECT COUNT(*) as count FROM users WHERE username = 'admin'`);
      console.log(`Admin user exists: ${adminCheck.rows[0].count > 0 ? 'Yes' : 'No'}`);
      
    } catch (err) {
      console.error('Users table test failed:', err.message);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();