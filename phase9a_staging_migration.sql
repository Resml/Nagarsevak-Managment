-- Phase 9A Final Index Migration Plan
-- This file enables Trigram matching and adds required indexes to solve the scalability bottleneck.
-- Note: Staging migration omits CONCURRENTLY to build faster in a downtime window, if applicable, 
-- but we use CONCURRENTLY here to identically mirror production execution safety.

-- 1. Enable Trigram Extension for ILIKE wildcard searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Core RLS Remediation (Base tenant_id B-Tree)
-- Target: Resolves the tenant_id IN (SELECT get_authorized_tenants()) sequential scan bottleneck.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_tenant_id ON public.voters USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_complaints_tenant_id ON public.complaints USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schemes_tenant_id ON public.scheme_applications USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_tenant_id ON public.events USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_tenant_id ON public.staff USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gb_diary_tenant_id ON public.gb_diary USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_surveys_tenant_id ON public.surveys USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_housing_societies_tenant_id ON public.housing_societies USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_orgs_tenant_id ON public.social_organizations USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sadasya_tenant_id ON public.sadasya USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incoming_letters_tenant_id ON public.incoming_letters USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_letter_requests_tenant_id ON public.letter_requests USING btree (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personal_requests_tenant_id ON public.personal_requests USING btree (tenant_id);

-- 3. High-Traffic Feed & Status Filtering (Composite B-Tree)
-- Feed ordering (Recent items first)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_complaints_tenant_created ON public.complaints USING btree (tenant_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incoming_letters_tenant_created ON public.incoming_letters USING btree (tenant_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_area_problems_tenant_created ON public.area_problems USING btree (tenant_id, created_at DESC);

-- Status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_complaints_tenant_status ON public.complaints USING btree (tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_works_tenant_status ON public.works USING btree (tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_area_problems_tenant_status ON public.area_problems USING btree (tenant_id, status);

-- 4. ILIKE Wildcard Search Remediation (GIN Trigram)
-- Name and Identity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_name_en_trgm ON public.voters USING gin (name_english gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_name_mr_trgm ON public.voters USING gin (name_marathi gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_epic_trgm ON public.voters USING gin (epic_no gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_mobile_trgm ON public.voters USING gin (mobile gin_trgm_ops);

-- Demographics & Addresses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_caste_trgm ON public.voters USING gin (caste gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_address_en_trgm ON public.voters USING gin (address_english gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_address_mr_trgm ON public.voters USING gin (address_marathi gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_house_no_trgm ON public.voters USING gin (house_no gin_trgm_ops);

-- 5. Standard Equality Filtering (B-Tree)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_favour ON public.voters USING btree (favour);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_ward_no ON public.voters USING btree (ward_no);
