-- Add new columns to voters table
ALTER TABLE voters
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS current_address_english TEXT,
ADD COLUMN IF NOT EXISTS current_address_marathi TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'voters';
