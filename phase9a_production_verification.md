# Phase 9A Final Production Verification Plan

This document governs the post-deployment validation of the `phase9a_production_migration.sql` script on the live 10,000-tenant production database. 

*Warning: Do not execute the migration during peak traffic windows, even with CONCURRENTLY, to avoid high I/O spikes affecting end users.*

## 1. Index Creation Validation
Ensure all indexes were created successfully without entering an `INVALID` state (which can happen if a concurrent build fails).

**Query:**
```sql
SELECT indexrelname, indisvalid 
FROM pg_index i 
JOIN pg_class c ON i.indexrelid = c.oid 
WHERE indexrelname LIKE 'idx_%_tenant_%' 
   OR indexrelname LIKE 'idx_voters_%_trgm';
```
**Criteria:** All returned indexes must show `indisvalid = true`. If any are false, they must be dropped and recreated `CONCURRENTLY`.

## 2. EXPLAIN (ANALYZE, BUFFERS) Performance Verification
Connect to the production database (`psql` or Supabase UI) and execute the following test queries to guarantee the Postgres Query Planner is using the new indexes. 
*(Wait ~5 minutes after index creation to allow autovacuum/analyze to update statistics).*

### Test 1: RLS Core Lookup
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name_english FROM public.voters 
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1);
```
**Expected Outcome:** 
- The plan MUST show an `Index Scan` or `Bitmap Heap Scan` using `idx_voters_tenant_id`.
- `Seq Scan` on `voters` MUST NOT be present.
- Execution time should be highly responsive (typically < 10ms for a single tenant's scope).

### Test 2: Wildcard Trigram Search
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM public.voters 
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1) 
  AND name_english ILIKE '%kumar%';
```
**Expected Outcome:**
- The plan MUST show a `Bitmap Index Scan` on `idx_voters_name_en_trgm`.
- Shared read blocks should be substantially lower than a full table scan.

### Test 3: Dashboard Sort Optimization
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM public.complaints 
WHERE tenant_id = (SELECT id FROM tenants LIMIT 1) 
ORDER BY created_at DESC LIMIT 20;
```
**Expected Outcome:**
- The plan MUST show an `Index Scan` using `idx_complaints_tenant_created`.
- An explicit `Sort` node must NOT be present in the execution tree.

## 3. Live Traffic Monitoring
Monitor the Supabase Dashboard / pg_stat_activity during the first 2 hours of peak load following deployment:
1. **CPU Utilization:** Verify that peak CPU usage does not exceed 70%. The removal of RLS sequential scans should cause a noticeable drop in median CPU load.
2. **Disk I/O:** Trigram indexing increases disk space. Confirm provisioned storage is within safe limits (≤ 80% usage).
3. **Write Latency:** Monitor webhook and API log ingestion. Confirm that the increased B-Tree/GIN maintenance overhead has not caused API timeouts on `INSERT` operations.
