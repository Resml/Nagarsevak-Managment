-- Keep only the oldest row (likely the correct one or the default one)
DELETE FROM app_settings
WHERE id NOT IN (
  SELECT id
  FROM app_settings
  ORDER BY id ASC
  LIMIT 1
);

-- Reset sequence if needed (optional but good)
-- SELECT setval('app_settings_id_seq', (SELECT MAX(id) FROM app_settings));
