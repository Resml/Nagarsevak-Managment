-- Alter gb_diary table to add beneficiaries column
ALTER TABLE gb_diary 
ADD COLUMN IF NOT EXISTS beneficiaries TEXT;

-- Update existing records with a default if needed (optional)
-- UPDATE gb_diary SET beneficiaries = 'Not Specified' WHERE beneficiaries IS NULL;
