-- Add area column
ALTER TABLE staff ADD COLUMN IF NOT EXISTS area text;

-- Move Electricians, Plumbers, etc. to Cooperative category
UPDATE staff 
SET category = 'Cooperative' 
WHERE role ILIKE '%Electrician%' 
   OR role ILIKE '%Plumber%' 
   OR role ILIKE '%Sanitation%'
   OR role ILIKE '%Road%'
   OR role ILIKE '%Supervisor%'
   OR role ILIKE '%Engineer%';

-- Move key Party roles to Party category
UPDATE staff
SET category = 'Party'
WHERE role ILIKE '%President%'
   OR role ILIKE '%Pramukh%'
   OR role ILIKE '%Karyakarta%';
