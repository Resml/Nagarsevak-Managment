-- Disable specific features for Mamit Chougule tenant in database
UPDATE tenants
SET config = config || '{"disabled_features": ["ai_voice_call", "whatsapp_call", "media_tracking"]}'::jsonb
WHERE subdomain = 'mamit' OR name ILIKE '%Mamit%';
