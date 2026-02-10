-- Booth-by-Booth Results for Ward 27-A (Sample: First 10 booths)
-- Tenant: bf1a3e36-464e-4eff-b21d-dc71f5a5a582
-- NOTE: This is a SAMPLE with first 10 booths only
-- For complete data, all 80 booths would need to be manually entered

-- Delete existing Ward 27-A booth data
DELETE FROM election_results WHERE ward_name = 'Ward 27-A' AND tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582';

-- Booth 1
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '1', 'मतदान केंद्र 1', 0, 485,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 27, "महेश (उर्फ) अमर विलास आवळे": 123, "धनंजय विष्णू जाधव": 209, "भामरे रविराज बाळासाहेब": 31, "विर नंदू काळूराम": 62, "वैभवी संजय शिंदे": 3, "सुरज सोमनाथ सोनवणे": 5, "महेश बलभीम सकट": 1, "नेटके गुलाब गंगाराम": 1, "NOTA": 23}'::jsonb,
    'धनंजय विष्णू जाधव', 86, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);

-- Booth 2
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '2', 'मतदान केंद्र 2', 0, 459,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 15, "महेश (उर्फ) अमर विलास आवळे": 142, "धनंजय विष्णू जाधव": 222, "भामरे रविराज बाळासाहेब": 26, "विर नंदू काळूराम": 32, "वैभवी संजय शिंदे": 2, "सुरज सोमनाथ सोनवणे": 4, "महेश बलभीम सकट": 0, "नेटके गुलाब गंगाराम": 1, "NOTA": 15}'::jsonb,
    'धनंजय विष्णू जाधव', 80, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);

-- Booth 3
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '3', 'मतदान केंद्र 3', 0, 479,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 26, "महेश (उर्फ) अमर विलास आवळे": 154, "धनंजय विष्णू जाधव": 245, "भामरे रविराज बाळासाहेब": 9, "विर नंदू काळूराम": 25, "वैभवी संजय शिंदे": 3, "सुरज सोमनाथ सोनवणे": 1, "महेश बलभीम सकट": 2, "नेटके गुलाब गंगाराम": 1, "NOTA": 13}'::jsonb,
    'धनंजय विष्णू जाधव', 91, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);

-- Booth 4
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '4', 'मतदान केंद्र 4', 0, 533,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 26, "महेश (उर्फ) अमर विलास आवळे": 173, "धनंजय विष्णू जाधव": 244, "भामरे रविराज बाळासाहेब": 17, "विर नंदू काळूराम": 40, "वैभवी संजय शिंदे": 9, "सुरज सोमनाथ सोनवणे": 3, "महेश बलभीम सकट": 0, "नेटके गुलाब गंगाराम": 1, "NOTA": 20}'::jsonb,
    'धनंजय विष्णू जाधव', 71, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);

-- Booth 5
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '5', 'मतदान केंद्र 5', 0, 496,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 27, "महेश (उर्फ) अमर विलास आवळे": 185, "धनंजय विष्णू जाधव": 229, "भामरे रविराज बाळासाहेब": 21, "विर नंदू काळूराम": 11, "वैभवी संजय शिंदे": 4, "सुरज सोमनाथ सोनवणे": 7, "महेश बलभीम सकट": 0, "नेटके गुलाब गंगाराम": 0, "NOTA": 12}'::jsonb,
    'धनंजय विष्णू जाधव', 44, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);

-- Booth 6
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '6', 'मतदान केंद्र 6', 0, 464,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 26, "महेश (उर्फ) अमर विलास आवळे": 204, "धनंजय विष्णू जाधव": 170, "भामरे रविराज बाळासाहेब": 26, "विर नंदू काळूराम": 17, "वैभवी संजय शिंदे": 1, "सुरज सोमनाथ सोनवणे": 3, "महेश बलभीम सकट": 0, "नेटके गुलाब गंगाराम": 0, "NOTA": 17}'::jsonb,
    'महेश (उर्फ) अमर विलास आवळे', 34, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);

-- Booth 7
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '7', 'मतदान केंद्र 7', 0, 473,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 14, "महेश (उर्फ) अमर विलास आवळे": 170, "धनंजय विष्णू जाधव": 241, "भामरे रविराज बाळासाहेब": 9, "विर नंदू काळूराम": 16, "वैभवी संजय शिंदे": 2, "सुरज सोमनाथ सोनवणे": 1, "महेश बलभीम सकट": 0, "नेटके गुलाब गंगाराम": 0, "NOTA": 20}'::jsonb,
    'धनंजय विष्णू जाधव', 71, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);

-- Booth 8
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '8', 'मतदान केंद्र 8', 0, 418,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 13, "महेश (उर्फ) अमर विलास आवळे": 275, "धनंजय विष्णू जाधव": 87, "भामरे रविराज बाळासाहेब": 6, "विर नंदू काळूराम": 15, "वैभवी संजय शिंदे": 1, "सुरज सोमनाथ सोनवणे": 2, "महेश बलभीम सकट": 0, "नेटके गुलाब गंगाराम": 0, "NOTA": 19}'::jsonb,
    'महेश (उर्फ) अमर विलास आवळे', 188, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);

-- Booth 9
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '9', 'मतदान केंद्र 9', 0, 446,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 18, "महेश (उर्फ) अमर विलास आवळे": 223, "धनंजय विष्णू जाधव": 139, "भामरे रविराज बाळासाहेब": 17, "विर नंदू काळूराम": 31, "वैभवी संजय शिंदे": 0, "सुरज सोमनाथ सोनवणे": 1, "महेश बलभीम सकट": 0, "नेटके गुलाब गंगाराम": 0, "NOTA": 17}'::jsonb,
    'महेश (उर्फ) अमर विलास आवळे', 84, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);

-- Booth 10
INSERT INTO election_results (
    ward_name, booth_number, booth_name, total_voters, total_votes_casted,
    candidate_votes, winner, margin, tenant_id, created_at
) VALUES (
    'Ward 27-A', '10', 'मतदान केंद्र 10', 0, 458,
    '{"अंबेदकर (कांबळे) दिलीप शंकर": 7, "महेश (उर्फ) अमर विलास आवळे": 322, "धनंजय विष्णू जाधव": 83, "भामरे रविराज बाळासाहेब": 10, "विर नंदू काळूराम": 21, "वैभवी संजय शिंदे": 0, "सुरज सोमनाथ सोनवणे": 2, "महेश बलभीम सकट": 0, "नेटके गुलाब गंगाराम": 0, "NOTA": 13}'::jsonb,
    'महेश (उर्फ) अमर विलास आवळे', 239, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', NOW()
);


-- Verify
SELECT booth_number, total_votes_casted, winner, margin
FROM election_results
WHERE ward_name = 'Ward 27-A' AND tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'
ORDER BY CAST(booth_number AS INTEGER);
