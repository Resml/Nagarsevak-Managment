-- Categorize Women Empowerment Schemes
UPDATE schemes 
SET category = 'Women' 
WHERE name ILIKE '%Ladki Bahin%'
   OR name ILIKE '%Ahilyadevi Holkar%'
   OR name ILIKE '%Widow Pension%'
   OR name ILIKE '%Matru Vandana%'
   OR name ILIKE '%Beti Bachao%'
   OR name ILIKE '%Sukanya Samriddhi%'
   OR name ILIKE '%Stand-Up India%';

-- Categorize Student & Education Schemes
UPDATE schemes 
SET category = 'Student' 
WHERE name ILIKE '%Post-Matric%'
   OR name ILIKE '%Vidyalaxmi%';

-- Categorize Youth & Employment Schemes
UPDATE schemes 
SET category = 'Youth' 
WHERE name ILIKE '%Yuva Karya%'
   OR name ILIKE '%Mudra Yojana%'
   OR name ILIKE '%National Rural Employment guarantee%';

-- Categorize Farmer Schemes
UPDATE schemes 
SET category = 'Farmer' 
WHERE name ILIKE '%Kisan Samman%'
   OR name ILIKE '%Shetkari%'
   OR name ILIKE '%Fasal Bima%'
   OR name ILIKE '%Magel Tyala%'
   OR name ILIKE '%Solar Pump%';

-- Categorize Health Schemes
UPDATE schemes 
SET category = 'Health' 
WHERE name ILIKE '%Ayushman Bharat%'
   OR name ILIKE '%Jyotiba Phule%'
   OR name ILIKE '%Disability Pension%';

-- Categorize Housing & Infrastructure Schemes
UPDATE schemes 
SET category = 'Housing' 
WHERE name ILIKE '%Awas Yojana%'
   OR name ILIKE '%Surya Ghar%';

-- Categorize Senior Citizen & Pension Schemes
UPDATE schemes 
SET category = 'Senior Citizen' 
WHERE name ILIKE '%Old Age Pension%'
   OR name ILIKE '%Atal Pension%'
   OR name ILIKE '%Sanjay Gandhi%';
