// Script to apply Drizzle schema to the database
import { Pool } from "@neondatabase/serverless";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

async function runMigration() {
  console.log("Starting database migration...");
  
  // Create a connection pool
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Push the schema directly to the database (simplest approach)
    console.log("Applying schema changes to database...");
    const client = await pool.connect();
    try {
      await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'operator',
        is_active BOOLEAN NOT NULL DEFAULT true,
        section_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        role TEXT NOT NULL,
        module TEXT NOT NULL,
        can_view BOOLEAN DEFAULT false,
        can_create BOOLEAN DEFAULT false,
        can_edit BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(role, module)
      );
      
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE
      );
      
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES categories(id),
        name TEXT NOT NULL,
        full_name TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS machines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        section_id TEXT REFERENCES sections(id),
        is_active BOOLEAN DEFAULT true
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
        user_id TEXT REFERENCES users(id),
        plate_drawer_code TEXT
      );
      
      CREATE TABLE IF NOT EXISTS customer_products (
        id SERIAL PRIMARY KEY,
        customer_id TEXT NOT NULL REFERENCES customers(id),
        category_id TEXT NOT NULL REFERENCES categories(id),
        item_id TEXT NOT NULL REFERENCES items(id),
        size_caption TEXT,
        width REAL,
        left_f REAL,
        right_f REAL,
        thickness REAL,
        thickness_one REAL,
        printing_cylinder REAL,
        length_cm REAL,
        cutting_length REAL,
        raw_material TEXT,
        master_batch_id TEXT REFERENCES master_batches(id),
        printed BOOLEAN,
        cutting_unit TEXT,
        unit_weight REAL,
        packing TEXT,
        punching BOOLEAN,
        bag_length REAL,
        drawer_code TEXT,
        notes TEXT
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'pending',
        customer_id TEXT NOT NULL REFERENCES customers(id),
        user_id TEXT REFERENCES users(id),
        note TEXT
      );
      
      CREATE TABLE IF NOT EXISTS job_orders (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        customer_product_id INTEGER NOT NULL REFERENCES customer_products(id),
        quantity REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        customer_id TEXT REFERENCES customers(id),
        UNIQUE(order_id, customer_product_id)
      );
      
      CREATE TABLE IF NOT EXISTS rolls (
        id TEXT PRIMARY KEY,
        job_order_id INTEGER NOT NULL REFERENCES job_orders(id),
        serial_number TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        extruding_qty REAL,
        printing_qty REAL,
        cutting_qty REAL,
        extruded_at TIMESTAMP,
        printed_at TIMESTAMP,
        cut_at TIMESTAMP,
        length_meters REAL,
        raw_material TEXT,
        master_batch_id TEXT REFERENCES master_batches(id)
      );
      
      CREATE TABLE IF NOT EXISTS raw_materials (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity REAL DEFAULT 0,
        unit TEXT NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS final_products (
        id SERIAL PRIMARY KEY,
        job_order_id INTEGER NOT NULL REFERENCES job_orders(id),
        quantity REAL NOT NULL,
        completed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'in-stock' NOT NULL
      );
      `);
      
      console.log("Schema changes applied successfully");
      client.release();
    } catch (error) {
      console.error("Error during execution:", error);
      client.release();
      throw error;
    }
    
    // Close the pool connection
    await pool.end();
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    // Close the pool connection
    try {
      await pool.end();
    } catch (poolError) {
      console.error("Error closing pool:", poolError);
    }
    process.exit(1);
  }
}

runMigration().catch((err) => {
  console.error("Migration script error:", err);
  process.exit(1);
});