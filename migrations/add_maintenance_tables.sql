-- Add maintenance module tables

-- Maintenance Requests
CREATE TABLE IF NOT EXISTS "maintenance_requests" (
  "id" SERIAL PRIMARY KEY,
  "request_number" TEXT NOT NULL,
  "machine_id" TEXT REFERENCES "machines" ("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "requested_by" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "assigned_to" TEXT,
  "completed_at" TIMESTAMP,
  "notes" TEXT
);

-- Spare Parts
CREATE TABLE IF NOT EXISTS "spare_parts" (
  "id" SERIAL PRIMARY KEY,
  "part_name" TEXT NOT NULL,
  "part_number" TEXT,
  "barcode" TEXT,
  "serial_number" TEXT,
  "machine_id" TEXT REFERENCES "machines" ("id") ON DELETE SET NULL,
  "category" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "manufacturer" TEXT,
  "supplier" TEXT,
  "purchase_date" TIMESTAMP,
  "price" DOUBLE PRECISION DEFAULT 0,
  "quantity" INTEGER DEFAULT 1,
  "min_quantity" INTEGER DEFAULT 0,
  "location" TEXT,
  "notes" TEXT,
  "last_used" TIMESTAMP
);

-- Maintenance Actions
CREATE TABLE IF NOT EXISTS "maintenance_actions" (
  "id" SERIAL PRIMARY KEY,
  "request_id" INTEGER REFERENCES "maintenance_requests" ("id") ON DELETE CASCADE,
  "machine_id" TEXT REFERENCES "machines" ("id") ON DELETE CASCADE,
  "action_date" TIMESTAMP DEFAULT NOW(),
  "action_type" TEXT NOT NULL,
  "part_replaced" TEXT,
  "part_id" INTEGER REFERENCES "spare_parts" ("id") ON DELETE SET NULL,
  "description" TEXT,
  "performed_by" TEXT NOT NULL,
  "hours" DOUBLE PRECISION DEFAULT 0,
  "cost" DOUBLE PRECISION DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'completed'
);

-- Maintenance Logbook
CREATE TABLE IF NOT EXISTS "maintenance_logbook" (
  "id" SERIAL PRIMARY KEY,
  "machine_id" TEXT REFERENCES "machines" ("id") ON DELETE CASCADE,
  "maintenance_type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "work_done" TEXT NOT NULL,
  "parts_replaced" TEXT,
  "technician" TEXT NOT NULL,
  "completed_at" TIMESTAMP DEFAULT NOW(),
  "downtime" DOUBLE PRECISION DEFAULT 0,
  "cost" DOUBLE PRECISION DEFAULT 0,
  "follow_up_needed" BOOLEAN DEFAULT FALSE,
  "follow_up_description" TEXT,
  "created_by" TEXT NOT NULL,
  "attachments" TEXT[]
);

-- Maintenance Schedule
CREATE TABLE IF NOT EXISTS "maintenance_schedule" (
  "id" SERIAL PRIMARY KEY,
  "machine_id" TEXT REFERENCES "machines" ("id") ON DELETE CASCADE,
  "task_name" TEXT NOT NULL,
  "task_description" TEXT,
  "frequency" TEXT NOT NULL,
  "last_completed" TIMESTAMP,
  "next_due" TIMESTAMP,
  "assigned_to" TEXT,
  "priority" TEXT DEFAULT 'medium',
  "estimated_hours" DOUBLE PRECISION DEFAULT 1,
  "instructions" TEXT,
  "status" TEXT DEFAULT 'pending',
  "created_by" TEXT NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "maintenance_requests_machine_idx" ON "maintenance_requests" ("machine_id");
CREATE INDEX IF NOT EXISTS "maintenance_requests_status_idx" ON "maintenance_requests" ("status");
CREATE INDEX IF NOT EXISTS "spare_parts_machine_idx" ON "spare_parts" ("machine_id");
CREATE INDEX IF NOT EXISTS "maintenance_actions_request_idx" ON "maintenance_actions" ("request_id");
CREATE INDEX IF NOT EXISTS "maintenance_logbook_machine_idx" ON "maintenance_logbook" ("machine_id");
CREATE INDEX IF NOT EXISTS "maintenance_schedule_machine_idx" ON "maintenance_schedule" ("machine_id");
CREATE INDEX IF NOT EXISTS "maintenance_schedule_status_idx" ON "maintenance_schedule" ("status");