-- Add Marathi translation columns to schemes table
ALTER TABLE schemes 
ADD COLUMN IF NOT EXISTS name_mr TEXT,
ADD COLUMN IF NOT EXISTS description_mr TEXT,
ADD COLUMN IF NOT EXISTS eligibility_mr TEXT,
ADD COLUMN IF NOT EXISTS benefits_mr TEXT,
ADD COLUMN IF NOT EXISTS documents_mr TEXT;

-- Update existing schemes with Marathi translations
UPDATE schemes SET 
  name_mr = 'माझी लाडकी बहीण योजना',
  description_mr = 'महाराष्ट्रातील महिलांसाठी आर्थिक मदत.',
  eligibility_mr = '२१-६५ वयोगटातील महिला, उत्पन्न < २.५ लाख/वर्ष',
  benefits_mr = '₹१५०० प्रति महिना',
  documents_mr = 'आधार, रेशन कार्ड, बँक पासबुक'
WHERE name = 'Majhi Ladki Bahin Yojana';

UPDATE schemes SET
  name_mr = 'पीएम विश्वकर्मा योजना',
  description_mr = 'पारंपारिक कारागीर आणि हस्तकला व्यावसायिकांसाठी समर्थन.',
  eligibility_mr = 'पारंपारिक कारागीर, हस्तकला व्यावसायिक',
  benefits_mr = 'प्रशिक्षण, साधने, कर्ज सवलत',
  documents_mr = 'आधार, कारागीर प्रमाणपत्र, बँक तपशील'
WHERE name = 'PM Vishwakarma Yojana';

UPDATE schemes SET
  name_mr = 'लेक लाडकी योजना',
  description_mr = 'मुलींसाठी आर्थिक सहाय्य योजना.',
  eligibility_mr = 'मुलगी बाळ, महाराष्ट्र निवासी',
  benefits_mr = 'वयानुसार आर्थिक मदत',
  documents_mr = 'जन्म प्रमाणपत्र, आधार, बँक पासबुक'
WHERE name = 'Lek Ladki Yojana';

UPDATE schemes SET
  name_mr = 'इंदिरा गांधी राष्ट्रीय विधवा पेन्शन',
  description_mr = 'विधवांसाठी सामाजिक सुरक्षा आणि आर्थिक स्वातंत्र्य सुनिश्चित करण्यासाठी मासिक पेन्शन.',
  eligibility_mr = '४०-५९ वयोगटातील विधवा महिला',
  benefits_mr = '₹३०० प्रति महिना',
  documents_mr = 'आधार, विधवेचा दाखला, उत्पन्न प्रमाणपत्र'
WHERE name LIKE '%Widow Pension%';

UPDATE schemes SET
  name_mr = 'मॅट्रिकोत्तर शिष्यवृत्ती - वि.जा.भ.ज. विद्यार्थी',
  description_mr = 'वि.जा.भ.ज. (विमुक्त जाती व भटक्या जमाती) विद्यार्थ्यांसाठी मॅट्रिकोत्तर शिक्षणासाठी शिष्यवृत्ती.',
  eligibility_mr = 'वि.जा.भ.ज. प्रवर्ग, १०वी नंतर शिक्षण',
  benefits_mr = 'ट्यूशन फी + देखभाल भत्ता',
  documents_mr = 'जात प्रमाणपत्र, शुल्क पावती, आधार'
WHERE name LIKE '%VJNT%';

UPDATE schemes SET
  name_mr = 'प्रधानमंत्री विद्यालक्ष्मी योजना',
  description_mr = 'आर्थिकदृष्ट्या कमकुवत घटकांमधील गुणी विद्यार्थ्यांसाठी शिक्षण कर्जावर व्याज सवलत.',
  eligibility_mr = 'गुणी विद्यार्थी, उत्पन्न < ४.५ लाख/वर्ष',
  benefits_mr = 'शिक्षण कर्जावर व्याज सवलत',
  documents_mr = 'उत्पन्न प्रमाणपत्र, गुणपत्रिका, प्रवेश पावती'
WHERE name LIKE '%Vidyalaxmi%';

UPDATE schemes SET
  name_mr = 'मुख्यमंत्री युवा कार्य प्रशिक्षण योजना',
  description_mr = 'तरुणांची रोजगारक्षमता वाढवण्यासाठी उद्योजकांसोबत व्यावहारिक प्रशिक्षण कार्यक्रम.',
  eligibility_mr = '१८-३५ वयोगटातील बेरोजगार तरुण',
  benefits_mr = 'व्यावहारिक प्रशिक्षण + मानधन',
  documents_mr = 'आधार, शैक्षणिक प्रमाणपत्र, बँक तपशील'
WHERE name LIKE '%Yuva Karya%';

UPDATE schemes SET
  name_mr = 'नमो शेतकरी महासन्मान निधी',
  description_mr = 'महाराष्ट्र शासनाकडून शेतकऱ्यांना अतिरिक्त आर्थिक सहाय्य.',
  eligibility_mr = 'महाराष्ट्रातील शेतकरी',
  benefits_mr = '₹६००० प्रति वर्ष (३ हप्ते)',
  documents_mr = 'जमीन अभिलेख, आधार, बँक तपशील'
WHERE name LIKE '%Namo Shetkari%';

UPDATE schemes SET
  name_mr = 'प्रधानमंत्री पीक विमा योजना',
  description_mr = 'नैसर्गिक आपत्तींमुळे पीक नुकसानीपासून शेतकऱ्यांचे संरक्षण करणारी पीक विमा योजना.',
  eligibility_mr = 'सर्व शेतकरी',
  benefits_mr = 'पीक नुकसानीची भरपाई',
  documents_mr = 'जमीन अभिलेख, पेरणी प्रमाणपत्र, आधार'
WHERE name LIKE '%Fasal Bima%';

UPDATE schemes SET
  name_mr = 'प्रधानमंत्री किसान सन्मान निधी',
  description_mr = 'संपूर्ण भारतातील लहान आणि अल्पभूधारक शेतकऱ्यांसाठी उत्पन्न समर्थन.',
  eligibility_mr = 'लहान आणि अल्पभूधारक शेतकरी',
  benefits_mr = '₹६००० प्रति वर्ष (३ हप्ते)',
  documents_mr = 'जमीन अभिलेख, आधार, बँक तपशील'
WHERE name LIKE '%PM Kisan%';
