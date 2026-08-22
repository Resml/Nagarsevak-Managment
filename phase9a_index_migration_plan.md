# Phase 9A: Index Migration Plan

This plan details the specific indexes required to remediate the scalability bottlenecks identified in the Phase 9A audit.

## 1. Extension Requirement
To support high-performance wildcard text search (`ILIKE '%text%'`), the PostgreSQL Trigram extension must be enabled.
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## 2. Core RLS Remediation (B-Tree)
To allow the query planner to quickly resolve `tenant_id IN (SELECT get_authorized_tenants())` without scanning millions of rows, a standard B-Tree index must be added to the `tenant_id` column of every multi-tenant table that currently lacks one.

**Target Tables:**
- `voters`, `complaints`, `schemes`, `events`, `staff`, `gb_diary`, `surveys`
- `housing_societies`, `social_organizations`, `sadasya`, `incoming_letters`
- `gallery`, `survey_responses`, `ai_history`, `support_tickets`
- `work_tracker_history`, `personal_requests`, `letter_requests`

**Proposed SQL Pattern:**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_tenant_id ON public.voters USING btree (tenant_id);
-- (Repeated for all tables above)
```
*Note: We must use `CONCURRENTLY` in production to prevent table locks during indexing.*

## 3. Voter Search Optimization (GIN Trigram)
The `VoterService.ts` and `VoterList.tsx` modules perform heavy wildcard searches across name, EPIC, and mobile fields. Trigram indexes are mandatory.

**Proposed SQL:**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_name_en_trgm ON public.voters USING gin (name_english gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_name_mr_trgm ON public.voters USING gin (name_marathi gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_epic_trgm ON public.voters USING gin (epic_no gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_mobile_trgm ON public.voters USING gin (mobile gin_trgm_ops);
```
**Expected Benefit:** Reduces ILIKE query execution time from >1000ms (Seq Scan) to <50ms (Bitmap Heap Scan).

## 4. Voter Bulk Operations (B-Tree)
Dashboard analysis and bulk allocation loops heavily filter on demographic data.
**Proposed SQL:**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_caste ON public.voters USING btree (caste);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_favour ON public.voters USING btree (favour);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voters_ward ON public.voters USING btree (ward_no);
```

## 5. High-Traffic Feed & Status Filtering (Composite B-Tree)
Dashboards commonly query recent items or items matching a specific status for a specific tenant.
**Proposed SQL:**
```sql
-- Feed ordering (Recent items first)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_complaints_tenant_created ON public.complaints USING btree (tenant_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incoming_letters_tenant_created ON public.incoming_letters USING btree (tenant_id, created_at DESC);

-- Status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_complaints_tenant_status ON public.complaints USING btree (tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_works_tenant_status ON public.works USING btree (tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_area_problems_tenant_status ON public.area_problems USING btree (tenant_id, status);
```

## Risk Assessment
- **Locking:** Using `CONCURRENTLY` avoids locking writes, but index building takes longer and consumes DB resources.
- **Storage:** These indexes will likely consume 500MB+ of DB RAM/Storage depending on the current row count. Ensure the Supabase instance is scaled appropriately before execution.
