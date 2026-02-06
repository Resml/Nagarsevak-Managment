-- Add new columns for formatting and translation
ALTER TABLE letter_types 
ADD COLUMN IF NOT EXISTS template_content text,
ADD COLUMN IF NOT EXISTS name_marathi text;

-- Update existing types with default templates
UPDATE letter_types 
SET template_content = 'This is to certify that Mr./Ms. {{name}}, residing at {{address}}, is a resident of Ward 12 to the best of my knowledge.

This letter is issued upon their request for the purpose of {{purpose}}.

I wish them all the best for their future endeavors.'
WHERE template_content IS NULL;

-- Set default Marathi names (approximate, user can edit later)
UPDATE letter_types SET name_marathi = 'रहिवासी दाखला' WHERE name = 'Residential Certificate';
UPDATE letter_types SET name_marathi = 'चारित्र्य दाखला' WHERE name = 'Character Certificate';
UPDATE letter_types SET name_marathi = 'ना हरकत प्रमाणपत्र (NOC)' WHERE name = 'No Objection Certificate (NOC)';
UPDATE letter_types SET name_marathi = 'उत्पन्न दाखला शिफारस' WHERE name = 'Income Certificate Recommendation';
UPDATE letter_types SET name_marathi = 'इतर' WHERE name = 'Other';
