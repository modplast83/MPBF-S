// Production Database Migration Script
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { createHash } from 'crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ws from 'ws';

neonConfig.webSocketConstructor = ws; // Required for Neon serverless

console.log('Starting production database migration...');

// Function to check if a table exists
async function tableExists(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Function to hash a password
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
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
    
    // Check if users table exists
    const usersExist = await tableExists(pool, 'users');
    
    if (usersExist) {
      console.log('Users table already exists, checking other tables...');
    } else {
      console.log('Users table does not exist, running full migration...');
      
      // Run SQL migration directly from file
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const sqlFilePath = path.join(__dirname, 'migrations', '0000_greedy_corsair.sql');
      
      if (fs.existsSync(sqlFilePath)) {
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('Executing SQL migration...');
        await pool.query(sqlContent);
        console.log('SQL migration completed');
      } else {
        console.error('Migration SQL file not found!');
        console.log('Trying to create essential tables manually...');
        
        // Create minimal tables required for authentication
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "sessions" (
            "sid" varchar PRIMARY KEY,
            "sess" jsonb NOT NULL,
            "expire" timestamp NOT NULL
          );
          
          CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
          
          CREATE TABLE IF NOT EXISTS "users" (
            "id" varchar PRIMARY KEY NOT NULL,
            "username" varchar UNIQUE NOT NULL,
            "password" text,
            "email" varchar UNIQUE,
            "first_name" varchar,
            "last_name" varchar,
            "bio" text,
            "profile_image_url" varchar,
            "role" text NOT NULL DEFAULT 'user',
            "phone" text,
            "is_active" boolean DEFAULT true,
            "section_id" text,
            "created_at" timestamp DEFAULT now(),
            "updated_at" timestamp DEFAULT now()
          );
        `);
        
        console.log('Essential tables created manually');
      }
    }
    
    // Check if admin user exists
    const adminExistsQuery = await pool.query(`
      SELECT EXISTS (
        SELECT FROM "users"
        WHERE "username" = 'admin'
      );
    `);
    
    const adminExists = adminExistsQuery.rows[0].exists;
    
    if (!adminExists) {
      console.log('Creating admin user...');
      const adminPassword = hashPassword('admin123');
      
      await pool.query(`
        INSERT INTO "users" ("id", "username", "password", "role", "is_active", "created_at", "updated_at")
        VALUES ('00U1', 'admin', '${adminPassword}', 'administrator', true, NOW(), NOW());
      `);
      
      console.log('Admin user created with username: admin, password: admin123');
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Deployment migration completed successfully');
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();