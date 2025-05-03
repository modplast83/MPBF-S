// Script to apply Drizzle schema to the database
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the migrations directory exists
const migrationsDir = path.join(__dirname, 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

console.log('Generating migrations...');
execSync('npx drizzle-kit generate', { stdio: 'inherit' });

console.log('Applying migrations to database...');
execSync('npx drizzle-kit push --verbose', { stdio: 'inherit' });

console.log('Migration completed successfully!');