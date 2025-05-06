// Script to run database migrations for Replit Auth integration
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Starting database migration for Replit Auth...');
  
  try {
    // Create a client from the pool
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      console.log('Checking if sessions table exists...');
      const sessionTableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'sessions'
        );
      `);
      
      // Create sessions table if it doesn't exist
      if (!sessionTableResult.rows[0].exists) {
        console.log('Creating sessions table...');
        await client.query(`
          CREATE TABLE sessions (
            sid VARCHAR(255) PRIMARY KEY,
            sess JSONB NOT NULL,
            expire TIMESTAMP(6) NOT NULL
          );
          CREATE INDEX IDX_session_expire ON sessions (expire);
        `);
        console.log('Sessions table created');
      } else {
        console.log('Sessions table already exists');
      }
      
      // Check if users table exists and current structure
      console.log('Checking users table structure...');
      const columnCheckResult = await client.query(`
        SELECT 
          column_name
        FROM 
          information_schema.columns 
        WHERE 
          table_schema = 'public' 
          AND table_name = 'users';
      `);
      
      const existingColumns = columnCheckResult.rows.map(row => row.column_name);
      console.log('Existing columns:', existingColumns);
      
      // Add missing columns for Replit Auth
      const columnsToAdd = [
        { name: 'username', type: 'VARCHAR', constraint: 'UNIQUE' },
        { name: 'email', type: 'VARCHAR' },
        { name: 'first_name', type: 'VARCHAR' },
        { name: 'last_name', type: 'VARCHAR' },
        { name: 'bio', type: 'TEXT' },
        { name: 'profile_image_url', type: 'VARCHAR' }
      ];
      
      for (const column of columnsToAdd) {
        if (!existingColumns.includes(column.name)) {
          console.log(`Adding column ${column.name}...`);
          await client.query(`
            ALTER TABLE users 
            ADD COLUMN ${column.name} ${column.type} ${column.constraint || ''};
          `);
          console.log(`Column ${column.name} added`);
        } else {
          console.log(`Column ${column.name} already exists`);
        }
      }
      
      // Remove password column (optional for now, keeping it for backward compatibility)
      /* if (existingColumns.includes('password')) {
        console.log('Removing password column...');
        await client.query(`
          ALTER TABLE users 
          DROP COLUMN password;
        `);
        console.log('Password column removed');
      } */
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Migration completed successfully');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();