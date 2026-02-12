-- Add permissions column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}';

-- Validate that permissions is an array
ALTER TABLE staff ADD CONSTRAINT staff_permissions_check CHECK (permissions IS NOT NULL);
