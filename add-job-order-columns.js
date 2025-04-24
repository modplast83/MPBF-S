// add-job-order-columns.js - Add production_qty and confirmation columns
import { db } from './server/db';

async function main() {
  console.log('Adding production_qty column to job_orders table...');
  await db.execute(`
    ALTER TABLE job_orders 
    ADD COLUMN IF NOT EXISTS production_qty DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS confirmed_by_user_id TEXT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
  `);

  console.log('Migration complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});