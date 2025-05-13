-- Fix users table by adding missing columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR,
ADD COLUMN IF NOT EXISTS last_name VARCHAR,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR;

-- Add missing tables
-- Check and create quality_check_types table
CREATE TABLE IF NOT EXISTS quality_check_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  category TEXT,
  stage TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Check and create quality_checks table
CREATE TABLE IF NOT EXISTS quality_checks (
  id SERIAL PRIMARY KEY,
  roll_id TEXT REFERENCES rolls(id),
  job_order_id INTEGER REFERENCES job_orders(id),
  check_type_id TEXT REFERENCES quality_check_types(id),
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  notes TEXT,
  checked_by TEXT REFERENCES users(id),
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check and create corrective_actions table
CREATE TABLE IF NOT EXISTS corrective_actions (
  id SERIAL PRIMARY KEY,
  quality_check_id INTEGER REFERENCES quality_checks(id),
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT REFERENCES users(id),
  completed_by TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Check and create sms_messages table
CREATE TABLE IF NOT EXISTS sms_messages (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  customer_id TEXT REFERENCES customers(id),
  order_id INTEGER REFERENCES orders(id),
  job_order_id INTEGER REFERENCES job_orders(id),
  sent_by TEXT REFERENCES users(id),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  message_type TEXT NOT NULL DEFAULT 'notification',
  twilio_message_id TEXT,
  error_message TEXT
);

-- Check and create mix_materials table
CREATE TABLE IF NOT EXISTS mix_materials (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_id INTEGER REFERENCES orders(id),
  mix_date TIMESTAMP NOT NULL,
  mix_person TEXT NOT NULL,
  total_quantity REAL
);

-- Check and create mix_items table
CREATE TABLE IF NOT EXISTS mix_items (
  id SERIAL PRIMARY KEY,
  mix_id INTEGER REFERENCES mix_materials(id),
  raw_material_id INTEGER REFERENCES raw_materials(id),
  quantity REAL NOT NULL,
  percentage REAL
);

-- Check and create mix_machines table
CREATE TABLE IF NOT EXISTS mix_machines (
  id SERIAL PRIMARY KEY,
  mix_id INTEGER REFERENCES mix_materials(id),
  machine_id TEXT REFERENCES machines(id)
);

-- Check and create material_inputs table
CREATE TABLE IF NOT EXISTS material_inputs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id),
  total_quantity REAL,
  notes TEXT,
  input_date TIMESTAMP NOT NULL
);

-- Check and create material_input_items table
CREATE TABLE IF NOT EXISTS material_input_items (
  id SERIAL PRIMARY KEY,
  input_id INTEGER REFERENCES material_inputs(id),
  raw_material_id INTEGER REFERENCES raw_materials(id),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL
);

-- Check and create plate_pricing_parameters table
CREATE TABLE IF NOT EXISTS plate_pricing_parameters (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT,
  value REAL NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT REFERENCES users(id)
);

-- Check and create plate_calculations table
CREATE TABLE IF NOT EXISTS plate_calculations (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  customer_id TEXT REFERENCES customers(id),
  width REAL NOT NULL,
  height REAL NOT NULL,
  area REAL NOT NULL,
  plate_type TEXT NOT NULL,
  thickness REAL,
  unit_price REAL,
  total_price REAL,
  created_by TEXT REFERENCES users(id),
  notes TEXT,
  is_quote BOOLEAN DEFAULT true,
  approval_status TEXT DEFAULT 'pending',
  customer_discount REAL
);

-- Check and create aba_material_configs table
CREATE TABLE IF NOT EXISTS aba_material_configs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  a_percentage REAL NOT NULL,
  b_percentage REAL NOT NULL,
  a_material TEXT,
  b_material TEXT
);

-- Check and create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);