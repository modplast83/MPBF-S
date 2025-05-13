// Production Authentication Fix Script
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { createHash } from 'crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ws from 'ws';

neonConfig.webSocketConstructor = ws; // Required for Neon serverless

console.log('=== Production Authentication Fix Script ===');

// Function to hash a password with a simple algorithm (for compatibility)
function simpleHash(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function fixAuth() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // 1. Verify table existence
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    const tableNames = tablesResult.rows.map(row => row.table_name);
    console.log(`Found ${tableNames.length} tables in the database.`);
    
    // 2. Check for users table and create if needed
    if (!tableNames.includes('users')) {
      console.log('Creating users table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" text PRIMARY KEY NOT NULL,
          "username" text UNIQUE NOT NULL,
          "password" text NOT NULL,
          "names" text NOT NULL,
          "role" text NOT NULL DEFAULT 'user',
          "is_active" boolean DEFAULT true,
          "section_id" text,
          "email" text,
          "phone" text,
          "first_name" varchar,
          "last_name" varchar,
          "bio" text,
          "profile_image_url" varchar,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      console.log('Users table created successfully.');
    } else {
      console.log('Users table already exists.');
    }
    
    // 3. Check for sessions table and create if needed
    if (!tableNames.includes('sessions')) {
      console.log('Creating sessions table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "sid" varchar PRIMARY KEY,
          "sess" jsonb NOT NULL,
          "expire" timestamp NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
      `);
      console.log('Sessions table created successfully.');
    } else {
      console.log('Sessions table already exists.');
    }
    
    // 4. Check if admin user exists
    const adminResult = await pool.query(`
      SELECT * FROM users WHERE username = 'admin';
    `);
    
    if (adminResult.rows.length === 0) {
      // Create admin user
      console.log('Creating admin user...');
      const adminPassword = simpleHash('admin123');
      await pool.query(`
        INSERT INTO users (id, username, password, names, role, is_active, created_at, updated_at)
        VALUES ('00U1', 'admin', '${adminPassword}', 'Administrator', 'administrator', true, NOW(), NOW());
      `);
      console.log('Admin user created with username: admin, password: admin123');
    } else {
      console.log('Admin user already exists.');
      
      // 5. Verify admin password format
      const adminUser = adminResult.rows[0];
      if (adminUser.password && !adminUser.password.includes('.')) {
        // Password is already in the simple format
        console.log('Admin password is in legacy format - compatible with authentication system.');
      } else if (adminUser.password && adminUser.password.includes('.')) {
        // Convert password to simple format for compatibility
        console.log('Converting admin password to legacy format for compatibility...');
        const simplePasswordHash = simpleHash('admin123');
        await pool.query(`
          UPDATE users 
          SET password = '${simplePasswordHash}' 
          WHERE username = 'admin';
        `);
        console.log('Admin password updated to be compatible with authentication system.');
      }
    }
    
    // 6. Create a test user for additional verification
    console.log('Ensuring test user exists...');
    const testUserResult = await pool.query(`
      SELECT * FROM users WHERE username = 'test';
    `);
    
    if (testUserResult.rows.length === 0) {
      const testPassword = simpleHash('test123');
      await pool.query(`
        INSERT INTO users (id, username, password, names, role, is_active, created_at, updated_at)
        VALUES ('00T1', 'test', '${testPassword}', 'Test User', 'user', true, NOW(), NOW());
      `);
      console.log('Test user created with username: test, password: test123');
    } else {
      console.log('Test user already exists.');
      
      // Update test user password to simple format
      const simplePasswordHash = simpleHash('test123');
      await pool.query(`
        UPDATE users 
        SET password = '${simplePasswordHash}' 
        WHERE username = 'test';
      `);
      console.log('Test user password updated to be compatible with authentication system.');
    }
    
    // 7. List all users for verification
    const usersResult = await pool.query(`
      SELECT id, username, role FROM users ORDER BY username;
    `);
    
    console.log('\nUsers available for login:');
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role}) - ID: ${user.id}`);
    });
    
    console.log('\nAuthentication setup complete!');
    console.log('You can now login with:');
    console.log('- Username: admin, Password: admin123');
    console.log('- Username: test, Password: test123');
    
    await pool.end();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error during authentication setup:', error);
    process.exit(1);
  }
}

fixAuth();