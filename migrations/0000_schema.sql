-- We need to fix the circular references by creating tables in the right order
-- First, create tables that don't have foreign keys to other tables

-- Create sections table
CREATE TABLE IF NOT EXISTS "sections" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL
);

-- Create users table - initially without foreign key constraint
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "section_id" TEXT
);

-- Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE
);

-- Create master_batches table
CREATE TABLE IF NOT EXISTS "master_batches" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL
);

-- Create items table
CREATE TABLE IF NOT EXISTS "items" (
  "id" TEXT PRIMARY KEY,
  "category_id" TEXT NOT NULL REFERENCES "categories"("id"),
  "name" TEXT NOT NULL,
  "full_name" TEXT NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS "customers" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "name_ar" TEXT,
  "user_id" TEXT,
  "plate_drawer_code" TEXT
);

-- Create machines table
CREATE TABLE IF NOT EXISTS "machines" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "section_id" TEXT,
  "is_active" BOOLEAN DEFAULT true
);

-- Create customer_products table
CREATE TABLE IF NOT EXISTS "customer_products" (
  "id" SERIAL PRIMARY KEY,
  "customer_id" TEXT NOT NULL REFERENCES "customers"("id"),
  "category_id" TEXT NOT NULL REFERENCES "categories"("id"),
  "item_id" TEXT NOT NULL REFERENCES "items"("id"),
  "size_caption" TEXT,
  "width" DOUBLE PRECISION,
  "left_f" DOUBLE PRECISION,
  "right_f" DOUBLE PRECISION,
  "thickness" DOUBLE PRECISION,
  "thickness_one" DOUBLE PRECISION,
  "printing_cylinder" DOUBLE PRECISION,
  "length_cm" DOUBLE PRECISION,
  "cutting_length_cm" DOUBLE PRECISION,
  "raw_material" TEXT,
  "master_batch_id" TEXT REFERENCES "master_batches"("id"),
  "printed" TEXT,
  "cutting_unit" TEXT,
  "unit_weight_kg" DOUBLE PRECISION,
  "packing" TEXT,
  "punching" TEXT,
  "cover" TEXT,
  "volum" TEXT,
  "knife" TEXT,
  "notes" TEXT,
  CONSTRAINT "customer_product_unique" UNIQUE ("customer_id", "item_id")
);

-- Create orders table
CREATE TABLE IF NOT EXISTS "orders" (
  "id" SERIAL PRIMARY KEY,
  "date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "customer_id" TEXT NOT NULL REFERENCES "customers"("id"),
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "user_id" TEXT
);

-- Create job_orders table
CREATE TABLE IF NOT EXISTS "job_orders" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
  "customer_product_id" INTEGER NOT NULL REFERENCES "customer_products"("id"),
  "quantity" DOUBLE PRECISION NOT NULL,
  "production_qty" DOUBLE PRECISION DEFAULT 0,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "customer_id" TEXT,
  CONSTRAINT "job_order_unique" UNIQUE ("order_id", "customer_product_id")
);

-- Create raw_materials table
CREATE TABLE IF NOT EXISTS "raw_materials" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION DEFAULT 0,
  "unit" TEXT NOT NULL,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quality_check_types table
CREATE TABLE IF NOT EXISTS "quality_check_types" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "checklist_items" TEXT[],
  "parameters" TEXT[],
  "target_stage" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true
);

-- Create rolls table
CREATE TABLE IF NOT EXISTS "rolls" (
  "id" TEXT PRIMARY KEY,
  "job_order_id" INTEGER NOT NULL REFERENCES "job_orders"("id"),
  "roll_serial" TEXT NOT NULL,
  "extruding_qty" DOUBLE PRECISION DEFAULT 0,
  "printing_qty" DOUBLE PRECISION DEFAULT 0,
  "cutting_qty" DOUBLE PRECISION DEFAULT 0,
  "current_stage" TEXT NOT NULL DEFAULT 'extrusion',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "waste_qty" DOUBLE PRECISION DEFAULT 0,
  "waste_percentage" DOUBLE PRECISION DEFAULT 0,
  "created_by_id" TEXT,
  "printed_by_id" TEXT,
  "cut_by_id" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "printed_at" TIMESTAMP,
  "cut_at" TIMESTAMP
);

-- Create quality_checks table
CREATE TABLE IF NOT EXISTS "quality_checks" (
  "id" SERIAL PRIMARY KEY,
  "check_type_id" TEXT NOT NULL REFERENCES "quality_check_types"("id"),
  "roll_id" TEXT REFERENCES "rolls"("id"),
  "job_order_id" INTEGER REFERENCES "job_orders"("id"),
  "performed_by" TEXT,
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "checklist_results" TEXT[],
  "parameter_values" TEXT[],
  "issue_severity" TEXT,
  "image_urls" TEXT[]
);

-- Create corrective_actions table
CREATE TABLE IF NOT EXISTS "corrective_actions" (
  "id" SERIAL PRIMARY KEY,
  "quality_check_id" INTEGER NOT NULL REFERENCES "quality_checks"("id"),
  "assigned_to" TEXT,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "due_date" TIMESTAMP,
  "completed_date" TIMESTAMP,
  "verified_by" TEXT,
  "notes" TEXT
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS "permissions" (
  "id" SERIAL PRIMARY KEY,
  "role" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "can_view" BOOLEAN DEFAULT false,
  "can_create" BOOLEAN DEFAULT false,
  "can_edit" BOOLEAN DEFAULT false,
  "can_delete" BOOLEAN DEFAULT false,
  "is_active" BOOLEAN DEFAULT true,
  CONSTRAINT "role_module_unique" UNIQUE ("role", "module")
);

-- Create final_products table
CREATE TABLE IF NOT EXISTS "final_products" (
  "id" SERIAL PRIMARY KEY,
  "job_order_id" INTEGER NOT NULL REFERENCES "job_orders"("id"),
  "quantity" DOUBLE PRECISION NOT NULL,
  "completed_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'in-stock'
);

-- Create sms_messages table
CREATE TABLE IF NOT EXISTS "sms_messages" (
  "id" SERIAL PRIMARY KEY,
  "recipient_phone" TEXT NOT NULL,
  "recipient_name" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "order_id" INTEGER REFERENCES "orders"("id"),
  "job_order_id" INTEGER REFERENCES "job_orders"("id"),
  "customer_id" TEXT,
  "sent_by" TEXT,
  "sent_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "delivered_at" TIMESTAMP,
  "error_message" TEXT,
  "message_type" TEXT NOT NULL,
  "twilio_message_id" TEXT
);

-- Create mix_materials table
CREATE TABLE IF NOT EXISTS "mix_materials" (
  "id" SERIAL PRIMARY KEY,
  "mix_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "mix_person" TEXT NOT NULL,
  "order_id" INTEGER REFERENCES "orders"("id"),
  "total_quantity" DOUBLE PRECISION DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mix_machines junction table
CREATE TABLE IF NOT EXISTS "mix_machines" (
  "id" SERIAL PRIMARY KEY,
  "mix_id" INTEGER NOT NULL REFERENCES "mix_materials"("id") ON DELETE CASCADE,
  "machine_id" TEXT NOT NULL REFERENCES "machines"("id"),
  CONSTRAINT "mix_machine_unique" UNIQUE ("mix_id", "machine_id")
);

-- Create mix_items table
CREATE TABLE IF NOT EXISTS "mix_items" (
  "id" SERIAL PRIMARY KEY,
  "mix_id" INTEGER NOT NULL REFERENCES "mix_materials"("id"),
  "raw_material_id" INTEGER NOT NULL REFERENCES "raw_materials"("id"),
  "quantity" DOUBLE PRECISION NOT NULL,
  "percentage" DOUBLE PRECISION NOT NULL
);

-- Add session table for authentication
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Now add foreign key constraints:
ALTER TABLE "users" ADD CONSTRAINT "fk_users_section_id" FOREIGN KEY ("section_id") REFERENCES "sections"("id");
ALTER TABLE "customers" ADD CONSTRAINT "fk_customers_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "machines" ADD CONSTRAINT "fk_machines_section_id" FOREIGN KEY ("section_id") REFERENCES "sections"("id");
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "job_orders" ADD CONSTRAINT "fk_job_orders_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "rolls" ADD CONSTRAINT "fk_rolls_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "users"("id");
ALTER TABLE "rolls" ADD CONSTRAINT "fk_rolls_printed_by_id" FOREIGN KEY ("printed_by_id") REFERENCES "users"("id");
ALTER TABLE "rolls" ADD CONSTRAINT "fk_rolls_cut_by_id" FOREIGN KEY ("cut_by_id") REFERENCES "users"("id");
ALTER TABLE "quality_checks" ADD CONSTRAINT "fk_quality_checks_performed_by" FOREIGN KEY ("performed_by") REFERENCES "users"("id");
ALTER TABLE "corrective_actions" ADD CONSTRAINT "fk_corrective_actions_assigned_to" FOREIGN KEY ("assigned_to") REFERENCES "users"("id");
ALTER TABLE "corrective_actions" ADD CONSTRAINT "fk_corrective_actions_verified_by" FOREIGN KEY ("verified_by") REFERENCES "users"("id");
ALTER TABLE "sms_messages" ADD CONSTRAINT "fk_sms_messages_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "sms_messages" ADD CONSTRAINT "fk_sms_messages_sent_by" FOREIGN KEY ("sent_by") REFERENCES "users"("id");
ALTER TABLE "mix_materials" ADD CONSTRAINT "fk_mix_materials_mix_person" FOREIGN KEY ("mix_person") REFERENCES "users"("id");