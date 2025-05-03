// update-customer-products.js - Update the printed column in customer_products table
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema';

neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('Creating database connection...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    console.log('Checking if customer_products table exists...');
    const tableExists = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customer_products'
      );
    `);
    
    const exists = tableExists.rows[0]?.exists === true;
    
    if (!exists) {
      console.log('Creating customer_products table from schema definition...');
      // Push all tables from the schema
      await db.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE
        );
        
        CREATE TABLE IF NOT EXISTS sections (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS master_batches (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          name_ar TEXT,
          user_id TEXT,
          plate_drawer_code TEXT
        );
        
        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL REFERENCES categories(id),
          name TEXT NOT NULL,
          full_name TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS customer_products (
          id SERIAL PRIMARY KEY,
          customer_id TEXT NOT NULL REFERENCES customers(id),
          category_id TEXT NOT NULL REFERENCES categories(id),
          item_id TEXT NOT NULL REFERENCES items(id),
          size_caption TEXT,
          width DOUBLE PRECISION,
          left_f DOUBLE PRECISION,
          right_f DOUBLE PRECISION,
          thickness DOUBLE PRECISION,
          thickness_one DOUBLE PRECISION,
          printing_cylinder DOUBLE PRECISION,
          length_cm DOUBLE PRECISION,
          cutting_length_cm DOUBLE PRECISION,
          raw_material TEXT,
          master_batch_id TEXT REFERENCES master_batches(id),
          printed BOOLEAN NOT NULL DEFAULT FALSE,
          cutting_unit TEXT,
          unit_weight_kg DOUBLE PRECISION,
          packing TEXT,
          punching TEXT,
          cover TEXT,
          volum TEXT,
          knife TEXT,
          notes TEXT,
          UNIQUE(customer_id, item_id)
        );
      `);
      console.log('customer_products table created successfully!');
    } else {
      console.log('customer_products table exists, updating printed column...');
      
      // Check if 'printed' column is already boolean
      const columnTypeResult = await db.execute(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'customer_products' 
        AND column_name = 'printed';
      `);
      
      const columnType = columnTypeResult.rows[0]?.data_type;
      console.log(`Current 'printed' column type: ${columnType}`);
      
      if (columnType === 'text') {
        // Get current values to migrate them properly
        const printedValues = await db.execute(`
          SELECT id, printed FROM customer_products;
        `);
        
        console.log('Converting printed column from text to boolean...');
        
        // First drop the column
        await db.execute(`
          ALTER TABLE customer_products DROP COLUMN printed;
        `);
        
        // Then add it back as boolean
        await db.execute(`
          ALTER TABLE customer_products ADD COLUMN printed BOOLEAN NOT NULL DEFAULT FALSE;
        `);
        
        // Update values based on previous data
        for (const row of printedValues.rows) {
          if (row.printed) {
            const value = row.printed.toLowerCase() === 'yes' || 
                          row.printed.toLowerCase() === 'true' || 
                          row.printed === '1';
            
            await db.execute(`
              UPDATE customer_products 
              SET printed = ${value} 
              WHERE id = ${row.id};
            `);
          }
        }
        
        console.log('Column updated successfully!');
      } else if (columnType === 'boolean') {
        console.log('The printed column is already boolean, no update needed.');
      } else {
        console.log(`Unexpected column type: ${columnType}. Manual intervention required.`);
      }
    }
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});