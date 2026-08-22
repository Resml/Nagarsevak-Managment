# Phase 9A Final Database Scalability & Index Audit

## 1. Missing Core Tenant Indexes
Our `pg_indexes` inventory proves that many operational tables lack a base `tenant_id` index.
* **RLS Vulnerability:** RLS policies globally inject `tenant_id IN (SELECT get_authorized_tenants())`. Without an index on `tenant_id`, the Postgres query planner will initiate a Sequential Scan across millions of rows to find a single tenant's data.

### Impacted Tables (Missing `tenant_id` B-Tree)
- `voters`, `complaints`, `schemes`, `events`, `staff`, `gb_diary`, `surveys`
- `housing_societies`, `social_organizations`, `sadasya`, `incoming_letters`
- `gallery`, `letter_requests`, `personal_requests`, `survey_responses`, `ai_history`, `support_tickets`

## 2. Deep Dive: The `voters` Table ILIKE Bottleneck
A repository search for `.ilike(` reveals that the frontend executes wildcard searches dynamically. Standard B-Tree indexes **cannot** resolve `%wildcard%` queries. 

### Actual Columns Using `ILIKE '%query%'`
1. `name_english` and `name_marathi` (`VoterService.ts`, `VoterList.tsx`, `EventManagement.tsx`)
2. `epic_no` and `mobile` (`VoterService.ts`, `IncomingLetterUpload.tsx`, `LetterForm.tsx`)
3. `address_english` and `address_marathi` (`VoterList.tsx`, `AnalysisStrategy.tsx`)
4. `caste` (`VoterList.tsx` line 341 uses `.ilike('caste', '%...%')`)
5. `house_no` (`VoterList.tsx`, `VisitorLog.tsx`)

*Note on B-Trees:* A standard B-Tree index on `epic_no` or `caste` is useless for these queries because of the leading `%`. 

## 3. Dashboard Feeds & Composite Indexes
Dashboards fetch recent activity or filter by status. 
* **Queries Found:** Sorting `created_at DESC` or filtering by `status` inside `complaints`, `incoming_letters`, `works`.
* **Current Execution:** The query filters by `tenant_id` (via RLS), then performs a heavy in-memory sort or sequential scan for `status`.
* **Solution:** `(tenant_id, created_at DESC)` and `(tenant_id, status)` composite indexes allow PostgreSQL to fetch pre-sorted/filtered data instantly.

## 4. Redundant Index Prevention
We confirmed that no covering indexes currently exist for these patterns. Some tables like `election_results` and `ward_provisions` *do* have `tenant_id` indexes already (`idx_election_results_tenant_id`) and will be excluded from the new migration plan to prevent redundant overhead.

## 5. Storage / Write Cost Analysis
- **Trigram (GIN) Indexes** are expensive to maintain. Updating a voter's name will trigger significant GIN maintenance overhead. However, the system is 95% read-heavy (reporting, dashboards, calling lists). The write penalty is acceptable for the required read performance at 10,000 tenants.
- **Estimated Storage:** ~1GB+ for GIN indexes at max scale.
