// Custom migration script that uses DATABASE_URL_HOLY_BONUS if available
import { execSync } from 'child_process';

// Use the holy-bonus database URL if available, otherwise fall back to the standard DATABASE_URL
if (process.env.DATABASE_URL_HOLY_BONUS) {
  // Temporarily set DATABASE_URL to DATABASE_URL_HOLY_BONUS for the migration
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = process.env.DATABASE_URL_HOLY_BONUS;
  
  console.log('Running database migration with custom database URL (holy-bonus)...');
  
  try {
    // Run the standard migration command
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('Database migration completed successfully.');
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exit(1);
  } finally {
    // Restore the original DATABASE_URL
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
} else {
  console.log('No custom database URL found, using default DATABASE_URL...');
  try {
    // Run the standard migration command with the default DATABASE_URL
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('Database migration completed successfully.');
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exit(1);
  }
}