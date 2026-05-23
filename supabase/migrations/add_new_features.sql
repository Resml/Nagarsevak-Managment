-- ============================================================
-- Migration: Add new Amdar section features
-- Created: 2026-05-23
-- ============================================================

-- 1. Add favour column to voters table
ALTER TABLE voters ADD COLUMN IF NOT EXISTS favour TEXT;
COMMENT ON COLUMN voters.favour IS 'Voter political alignment: Favourable, Against, Neutral, Doubtful';

-- 2. Create opposition_karyakartas table
CREATE TABLE IF NOT EXISTS opposition_karyakartas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT,
    party TEXT NOT NULL,
    role TEXT,
    area TEXT,
    strongholds TEXT[] DEFAULT '{}',
    activities JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE opposition_karyakartas ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow read access opposition karyakartas" ON opposition_karyakartas;
CREATE POLICY "Allow read access opposition karyakartas"
ON opposition_karyakartas FOR SELECT
TO public
USING (true);

-- Allow authenticated users full management
DROP POLICY IF EXISTS "Allow manage opposition karyakartas" ON opposition_karyakartas;
CREATE POLICY "Allow manage opposition karyakartas"
ON opposition_karyakartas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_opposition_karyakartas_tenant ON opposition_karyakartas(tenant_id);
