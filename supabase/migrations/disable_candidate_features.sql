-- Disable AI Voice Call, Voice Call, WhatsApp Call, and Media Tracking for Mamit Chougule tenant
UPDATE tenants
SET config = config || '{"disabled_features": ["voice_call", "ai_voice_call", "whatsapp_call", "media_tracking"]}'::jsonb
WHERE subdomain = 'mamit' OR name ILIKE '%Mamit%';
