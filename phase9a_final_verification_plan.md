# Phase 9A Final Database Scalability Verification Plan

This document outlines the execution plan for verifying the effectiveness of the proposed Phase 9A indexes on a staging replica.

## 1. Staging Preparation
1. Deploy the `phase9a_final_migration_plan.sql` to a Staging database containing representative synthetic data (~50,000 voters per tenant).
2. Connect to the database using `psql` or the Supabase SQL editor.
3. Verify index creation: `\d public.voters` and `\d public.complaints`.
4. Run `ANALYZE public.voters;` to ensure query planner statistics are up-to-date.

## 2. Quantitative Query Plan Analysis (EXPLAIN)

The primary goal is to shift execution plans away from CPU-intensive Sequential Scans into efficient Index / Bitmap Scans, and significantly reduce Buffer Reads (Disk/RAM I/O).

**Testing Methodology:**
Use `EXPLAIN (ANALYZE, BUFFERS)` on the target query **before** and **after** applying the indexes. Compare the `Execution Time`, `Shared Hit/Read` blocks, and the Node types (`Seq Scan` vs `Index Scan`).

### Test 1: RLS Tenant Lookup Bottleneck
Simulates the RLS injection `tenant_id IN (SELECT get_authorized_tenants())`.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.voters WHERE tenant_id = 'test-uuid-here';
```
* **Success Criteria:** 
  - `Seq Scan` is replaced by `Index Scan` on `idx_voters_tenant_id` or `Bitmap Heap Scan`.
  - Significant drop in `Rows Removed by Filter`.
  - Execution time and Shared Read Buffers show measurable reduction compared to the pre-index baseline.

### Test 2: Voter Wildcard Search (ILIKE)
Simulates `VoterService.ts` dynamic wildcard search.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name_english FROM public.voters 
WHERE tenant_id = 'test-uuid-here' 
  AND name_english ILIKE '%rahul%';
```
* **Success Criteria:** 
  - Must show `Bitmap Index Scan` hitting `idx_voters_name_en_trgm`.
  - Must NOT show `Seq Scan` on `public.voters`.
  - Measured buffer reads must plummet compared to the baseline sequential scan.

### Test 3: Composite Feed Sorting
Simulates `Dashboard.tsx` feed loads.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM public.complaints 
WHERE tenant_id = 'test-uuid-here' 
ORDER BY created_at DESC LIMIT 50;
```
* **Success Criteria:** 
  - Execution plan utilizes `Index Scan using idx_complaints_tenant_created`.
  - A dedicated in-memory `Sort` node is completely eliminated from the execution plan.

## 3. Go/No-Go Decision
- **Proceed to Production:** If `EXPLAIN (ANALYZE, BUFFERS)` confirms the elimination of unintended Sequential Scans and a measurable drop in buffer reads for all three test patterns.
- **Rollback / Halt:** If the query planner continues to prioritize `Seq Scan` despite `ANALYZE`, or if the index creation process causes unexpected locks preventing data ingestion on Staging.
