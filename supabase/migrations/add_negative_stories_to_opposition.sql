-- ============================================================
-- Migration: Add negative_stories column to opposition_karyakartas table
-- Created: 2026-05-26
-- ============================================================

ALTER TABLE opposition_karyakartas ADD COLUMN IF NOT EXISTS negative_stories JSONB DEFAULT '[]'::jsonb;
comment on column opposition_karyakartas.negative_stories is 'List of negative stories/controversies of opposition members';
