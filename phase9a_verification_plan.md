# Phase 9A: Database Scalability Verification Plan

This document outlines the strict criteria and steps to verify that the proposed index migration resolves the 10,000-tenant scalability bottleneck without regressions.

## 1. Local / Staging Execution Verification
Before deploying to production, the indexes must be applied to a Staging environment (or local Supabase instance) mirroring the production schema.

**Verification Steps:**
1. Connect via `psql` or `supabase db query`.
2. Run `\d public.voters` and `\d public.complaints` to confirm indexes exist.
3. Confirm the `pg_trgm` extension is active: `SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';`.

## 2. Query Plan Analysis (EXPLAIN ANALYZE)

The core verification is proving that PostgreSQL switches from **Sequential Scans** to **Index Scans** or **Bitmap Index Scans**.

**Test Query 1 (RLS Tenant Lookup):**
```sql
EXPLAIN ANALYZE
SELECT * FROM public.voters WHERE tenant_id = 'test-uuid-here';
```
*Acceptance Criteria:* The execution plan must show `Index Scan using idx_voters_tenant_id`. Sequential Scan must NOT appear.

**Test Query 2 (Wildcard Search):**
```sql
EXPLAIN ANALYZE
SELECT id, name_english FROM public.voters 
WHERE tenant_id = 'test-uuid-here' 
  AND name_english ILIKE '%rahul%';
```
*Acceptance Criteria:* The execution plan must show `Bitmap Index Scan` on `idx_voters_name_en_trgm` and `idx_voters_tenant_id`. Execution time should be < 50ms.

**Test Query 3 (Composite Feed Sort):**
```sql
EXPLAIN ANALYZE
SELECT id FROM public.complaints 
WHERE tenant_id = 'test-uuid-here' 
ORDER BY created_at DESC LIMIT 50;
```
*Acceptance Criteria:* Must use `Index Scan using idx_complaints_tenant_created` without triggering an expensive in-memory `Sort` node.

## 3. Production Monitoring Criteria (Post-Deployment)
Once deployed to production:
1. **CPU Usage:** Supabase database CPU should drop drastically during active hours due to the elimination of RLS sequential scans.
2. **API Latency:** The `VoterList` and `VoterProfile` pages on the frontend should load visibly faster.
3. **Locking Anomalies:** Use `pg_stat_activity` to ensure `CREATE INDEX CONCURRENTLY` does not block active transactions during the migration phase.

**STOP CRITERIA:** If database CPU *increases* or `EXPLAIN ANALYZE` still shows Sequential Scans after indexing, the `pg_statistics` may need updating via `ANALYZE public.voters;`.
