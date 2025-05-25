-- Migration to add primary key constraint to customer_products table

-- First, ensure the id column is NOT NULL
ALTER TABLE customer_products 
ALTER COLUMN id SET NOT NULL;

-- Then, add the primary key constraint
ALTER TABLE customer_products
ADD PRIMARY KEY (id);

-- Now create a sequence for the id column if it doesn't exist
DO $$
BEGIN
    -- Check if sequence exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'customer_products_id_seq'
    ) THEN
        CREATE SEQUENCE customer_products_id_seq
        OWNED BY customer_products.id;
        
        -- Set the sequence value to the maximum id + 1
        EXECUTE 'SELECT setval(''customer_products_id_seq'', COALESCE((SELECT MAX(id) FROM customer_products), 0) + 1, false)';
        
        -- Set the default value for the id column to use the sequence
        ALTER TABLE customer_products
        ALTER COLUMN id SET DEFAULT nextval('customer_products_id_seq');
    END IF;
END
$$;