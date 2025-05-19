-- Create quality violations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "quality_violations" (
  "id" SERIAL PRIMARY KEY,
  "quality_check_id" INTEGER REFERENCES "quality_checks"("id"),
  "reported_by" TEXT REFERENCES "users"("id"),
  "violation_type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "report_date" TIMESTAMP NOT NULL DEFAULT NOW(),
  "resolution_date" TIMESTAMP,
  "affected_area" TEXT NOT NULL,
  "root_cause" TEXT,
  "image_urls" TEXT[],
  "notes" TEXT
);

-- Create quality penalties table if it doesn't exist
CREATE TABLE IF NOT EXISTS "quality_penalties" (
  "id" SERIAL PRIMARY KEY,
  "violation_id" INTEGER NOT NULL REFERENCES "quality_violations"("id"),
  "assigned_to" TEXT NOT NULL REFERENCES "users"("id"),
  "assigned_by" TEXT NOT NULL REFERENCES "users"("id"),
  "penalty_type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION,
  "currency" TEXT,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "verified_by" TEXT REFERENCES "users"("id"),
  "verification_date" TIMESTAMP,
  "comments" TEXT,
  "appeal_details" TEXT,
  "supporting_documents" TEXT[]
);