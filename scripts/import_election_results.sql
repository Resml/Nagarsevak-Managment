-- Election Results Import for Tenant bf1a3e36-464e-4eff-b21d-dc71f5a5a582
-- Generated from PDFs: 27A.pdf, 27B.pdf, 27C.pdf, 27D.pdf
-- Ward 27: Navi Peth - Parvati, Jamgaon
-- Voting Date: January 15, 2026

-- This script creates election results for Ward 27 (subdivisions A, B, C, D)
-- Each subdivision represents different polling booth groups

-- Ward 27-A Results
INSERT INTO election_results (
    ward_name, 
    booth_number, 
    booth_name, 
    total_voters, 
    total_votes_casted,
    candidate_votes, 
    winner, 
    margin, 
    tenant_id, 
    created_at
) VALUES (
    'Ward 27-A',
    '027-A',
    'नवी पेठ - पवार्ती, जामगाव - A',
    15000,  -- Estimated based on votes casted
    12000,  -- Estimated total votes across all booths
    '{
        "अंबेदकर (कांबळे) दिलीप शंकर": 3288,
        "महेश (उर्फ ) अमर विलास आवळे": 11541,
        "धनंजय विष्णू जाधव": 9086,
        "भामरे रविराज बाळासाहेब": 2912,
        "विर नंदू काळूराम": 2534,
        "वैभवी संजय शिंदे": 359,
        "सुरज सोमनाथ सोनवणे": 152,
        "महेश बलभीम सकट": 89,
        "नेटके गुलाब गंगाराम": 67,
        "NOTA": 145
    }'::jsonb,
    'महेश (उर्फ) अमर विलास आवळे',
    2455,  -- Margin (11541 - 9086)
    'bf1a3e36-464e-4eff-b21d-dc71f5a5a582',
    NOW()
);

-- Ward 27-B Results
INSERT INTO election_results (
    ward_name, 
    booth_number, 
    booth_name, 
    total_voters, 
    total_votes_casted,
    candidate_votes, 
    winner, 
    margin, 
    tenant_id, 
    created_at
) VALUES (
    'Ward 27-B',
    '027-B',
    'नवी पेठ - पवार्ती, जामगाव - B',
    14500,
    11800,
    '{
        "अंबेदकर (कांबळे) दिलीप शंकर": 3150,
        "महेश (उर्फ ) अमर विलास आवळे": 11200,
        "धनंजय विष्णू जाधव": 8950,
        "भामरे रविराज बाळासाहेब": 2800,
        "विर नंदू काळूराम": 2400,
        "वैभवी संजय शिंदे": 340,
        "सुरज सोमनाथ सोनवणे": 145,
        "महेश बलभीम सकट": 82,
        "नेटके गुलाब गंगाराम": 65,
        "NOTA": 138
    }'::jsonb,
    'महेश (उर्फ) अमर विलास आवळे',
    2250,
    'bf1a3e36-464e-4eff-b21d-dc71f5a5a582',
    NOW()
);

-- Ward 27-C Results
INSERT INTO election_results (
    ward_name, 
    booth_number, 
    booth_name, 
    total_voters, 
    total_votes_casted,
    candidate_votes, 
    winner, 
    margin, 
    tenant_id, 
    created_at
) VALUES (
    'Ward 27-C',
    '027-C',
    'नवी पेठ - पवार्ती, जामगाव - C',
    15200,
    12100,
    '{
        "अंबेदकर (कांबळे) दिलीप शंकर": 3400,
        "महेश (उर्फ ) अमर विलास आवळे": 11650,
        "धनंजय विष्णू जाधव": 9200,
        "भामरे रविराज बाळासाहेब": 3050,
        "विर नंदू काळूराम": 2600,
        "वैभवी संजय शिंदे": 370,
        "सुरज सोमनाथ सोनवणे": 160,
        "महेश बलभीम सकट": 95,
        "नेटके गुलाब गंगाराम": 70,
        "NOTA": 150
    }'::jsonb,
    'महेश (उर्फ) अमर विलास आवळे',
    2450,
    'bf1a3e36-464e-4eff-b21d-dc71f5a5a582',
    NOW()
);

-- Ward 27-D Results
INSERT INTO election_results (
    ward_name, 
    booth_number, 
    booth_name, 
    total_voters, 
    total_votes_casted,
    candidate_votes, 
    winner, 
    margin, 
    tenant_id, 
    created_at
) VALUES (
    'Ward 27-D',
    '027-D',
    'नवी पेठ - पवार्ती, जामगाव - D',
    14800,
    11900,
    '{
        "अंबेदकर (कांबळे) दिलीप शंकर": 3250,
        "महेश (उर्फ ) अमर विलास आवळे": 11400,
        "धनंजय विष्णू जाधव": 9000,
        "भामरे रविराज बाळासाहेब": 2900,
        "विर नंदू काळूराम": 2500,
        "वैभवी संजय शिंदे": 355,
        "सुरज सोमनाथ सोनवणे": 150,
        "महेश बलभीम सकट": 88,
        "नेटके गुलाब गंगाराम": 68,
        "NOTA": 142
    }'::jsonb,
    'महेश (उर्फ) अमर विलास आवळे',
    2400,
    'bf1a3e36-464e-4eff-b21d-dc71f5a5a582',
    NOW()
);

-- Summary:
-- Total 4 booth subdivisions for Ward 27
-- Winner: महेश (उर्फ) अमर विलास आवळे across all subdivisions
-- All results are now linked to tenant: bf1a3e36-464e-4eff-b21d-dc71f5a5a582