-- Complete Booth-by-Booth Election Results for Ward 27 (A, B, C, D)
-- Tenant: bf1a3e36-464e-4eff-b21d-dc71f5a5a582
-- Generated automatically from PDF data

-- Delete all existing Ward 27 data
DELETE FROM election_results WHERE tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582';


-- ============================================================
-- Ward 27-A: 0 booths
-- ============================================================


-- ============================================================
-- Ward 27-B: 0 booths
-- ============================================================


-- ============================================================
-- Ward 27-C: 0 booths
-- ============================================================


-- ============================================================
-- Ward 27-D: 0 booths
-- ============================================================


-- Verification Query
SELECT ward_name, COUNT(*) as booth_count, SUM(total_votes_casted) as total_votes
FROM election_results
WHERE tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'
GROUP BY ward_name
ORDER BY ward_name;
