import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './shared/schema.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ws from 'ws';

neonConfig.webSocketConstructor = ws; // Required for Neon serverless

console.log('Starting deployment database migration...');

// Function to check if a table exists
async function tableExists(db, tableName) {
  const result = await db.execute(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '${tableName}'
    );`
  );
  
  return result.rows[0].exists;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    // Check if users table exists
    const usersExist = await tableExists(db, 'users');
    
    if (usersExist) {
      console.log('Users table already exists, checking other tables...');
    } else {
      console.log('Users table does not exist, running full migration...');
      
      // Run SQL migration directly
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const sqlFilePath = path.join(__dirname, 'migrations', '0000_greedy_corsair.sql');
      
      if (fs.existsSync(sqlFilePath)) {
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('Executing SQL migration...');
        await pool.query(sqlContent);
        console.log('SQL migration completed');
      } else {
        console.error('Migration SQL file not found!');
      }
    }
    
    // Create admin user if needed
    const adminExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'admin')
    });
    
    if (!adminExists) {
      console.log('Creating admin user...');
      // This is just a placeholder - the actual password will be hashed by the API
      await db.insert(schema.users).values({
        id: '00U1',
        username: 'admin',
        password: '$2b$10$f5SQQGIcXwUTJr6YxZrMRu.iZcZTUJdK5jCYQ3eKF1NvPkkQu2vQm', // "admin123"
        role: 'administrator',
        firstName: 'Admin',
        lastName: 'User'
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    console.log('Deployment migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();