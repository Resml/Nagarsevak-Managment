# Phase 9A: Database Scalability Remediation Audit

## 1. RLS Execution Bottleneck (`get_authorized_tenants()`)
The core of the multi-tenant architecture relies on Row Level Security (RLS) policies evaluated against `get_authorized_tenants()`. 
- **The Function:** Uses a `STABLE` query on `user_tenant_mapping` to fetch allowed `tenant_id`s. Since `user_id` is the primary key of `user_tenant_mapping`, this lookup is indexed and fast ($O(1)$).
- **The Bottleneck:** The RLS policy applies `tenant_id IN (...)` to **all** queries. Because the 34 operational tables (e.g., `voters`, `complaints`, `events`) **lack** a `tenant_id` index, the PostgreSQL query planner is forced to execute a **Sequential Scan** (full table scan) on the target table. At 10,000 tenants, finding 1 tenant's 50,000 voters requires scanning millions of unrelated rows, catastrophically spiking database CPU.

## 2. Voter Search & Bulk Operations (`voters` table)
The `voters` table is the most heavily queried and updated table in the system.
- **Search Queries (`VoterService.ts`):** 
  ```typescript
  .eq('tenant_id', tenantId).or(`name_english.ilike.%${query}%,epic_no.ilike.%${query}%,mobile.ilike.%${query}%`)
  ```
  **Problem:** `ILIKE '%query%'` cannot use standard B-Tree indexes. It requires GIN (Generalized Inverted Index) Trigram indexes (`pg_trgm`). Without them, every search causes a Sequential Scan.
- **Bulk Updates (`VoterList.tsx`):**
  ```typescript
  // Inside a for-loop!
  .update({ caste: selectedCasteForBulk }).ilike('name_english', `%${name}%`).eq('tenant_id', tenantId);
  ```
  **Problem:** Firing sequential `UPDATE` commands with `ILIKE` inside a loop without trigram indexes will lock the table and cause massive write-latency and CPU exhaustion.

## 3. Missing Status and Feed Indexes
- **Feeds (`area_problems`, `complaints`, `incoming_letters`):** Frequent queries order by `created_at DESC` filtered by `tenant_id`. Without a composite index on `(tenant_id, created_at DESC)`, the database must fetch and sort in memory.
- **Status Filtering:** Dashboards filter by `status` (e.g., pending complaints). Without `(tenant_id, status)` composite indexes, sequential scans are required.

## 4. Expected Impact of Remediation
- **Storage:** Adding 50+ indexes will significantly increase database storage size (estimated +40% disk usage).
- **Write Performance:** Heavy indexing slightly degrades `INSERT` and `UPDATE` speeds. However, the system is exceptionally read-heavy (95% Read / 5% Write), so the massive read-latency reduction outweighs the write penalty.
