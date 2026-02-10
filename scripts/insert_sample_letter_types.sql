-- Insert sample letter types for testing
-- Replace 'YOUR-TENANT-ID' with your actual tenant ID

-- First, let's add tenant_id column if it doesn't exist (safe to run multiple times)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='letter_types' AND column_name='tenant_id'
    ) THEN
        ALTER TABLE letter_types ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- Insert common letter types (adjust tenant_id as needed)
INSERT INTO letter_types (name, name_marathi, template_content, is_active, tenant_id)
VALUES 
    -- Get tenant_id from first tenant, or replace with your actual tenant ID
    ('Residential Certificate', 'निवासी दाखला', 'This is to certify that...', true, (SELECT id FROM tenants LIMIT 1)),
    ('Income Certificate', 'उत्पन्न दाखला', 'This is to certify that the annual income...', true, (SELECT id FROM tenants LIMIT 1)),
    ('Non-Creamy Layer Certificate', 'नॉन क्रिमी लेयर दाखला', 'This is to certify for Non-Creamy Layer...', true, (SELECT id FROM tenants LIMIT 1)),
    ('Caste Certificate', 'जात दाखला', 'This is to certify the caste...', true, (SELECT id FROM tenants LIMIT 1)),
    ('Age Certificate', 'वय दाखला', 'This is to certify the age...', true, (SELECT id FROM tenants LIMIT 1)),
    ('Nationality Certificate', 'राष्ट्रीयत्व दाखला', 'This is to certify nationality...', true, (SELECT id FROM tenants LIMIT 1))
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT id, name, name_marathi, is_active, tenant_id FROM letter_types;
