
BEGIN;
-- Disable foreign key constraints temporarily
SET session_replication_role = 'replica';

-- Drop all tables
DROP TABLE IF EXISTS "[object Object]" CASCADE;

-- Re-enable foreign key constraints
SET session_replication_role = 'origin';
COMMIT;
            