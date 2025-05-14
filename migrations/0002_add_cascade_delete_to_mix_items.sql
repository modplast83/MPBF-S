-- Drop the existing foreign key constraint
ALTER TABLE mix_items DROP CONSTRAINT IF EXISTS mix_items_mix_id_fkey;

-- Add it back with ON DELETE CASCADE
ALTER TABLE mix_items 
  ADD CONSTRAINT mix_items_mix_id_fkey 
  FOREIGN KEY (mix_id) 
  REFERENCES mix_materials(id) 
  ON DELETE CASCADE;