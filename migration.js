// migration.js - Create tables for material inputs
import { db } from './server/db';
import { materialInputs, materialInputItems } from './shared/schema';

async function main() {
  console.log('Creating material_inputs table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS material_inputs (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP NOT NULL DEFAULT NOW(),
      user_id TEXT NOT NULL REFERENCES users(id),
      notes TEXT
    );
  `);

  console.log('Creating material_input_items table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS material_input_items (
      id SERIAL PRIMARY KEY,
      input_id INTEGER NOT NULL REFERENCES material_inputs(id) ON DELETE CASCADE,
      raw_material_id INTEGER NOT NULL REFERENCES raw_materials(id),
      quantity REAL NOT NULL
    );
  `);

  console.log('Migration complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});