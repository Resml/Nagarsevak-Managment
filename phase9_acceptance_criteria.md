# Phase 9: Load Test Acceptance Criteria

To officially certify the Nagarsevak Management System as "Production Ready for 10,000 Tenants", the following criteria must be met during the Phase 9 Load Test. Failure to meet any of these metrics constitutes a blocking bottleneck that must be remediated.

## 1. API Latency Requirements
- **P50 (Median):** < 200 ms (The typical user should experience near-instant navigation).
- **P95 (95th Percentile):** < 800 ms (Heavy queries like filtered search should still resolve sub-second).
- **P99 (Worst Case):** < 2.5 seconds (Must remain well below standard 10s API timeout limits).
- **Timeout Rate:** < 0.1% of all requests.

## 2. Database Stability Requirements (Supabase)
- **Max CPU Utilization:** Must remain ≤ 70% during sustained Peak Load (5,000 CCU). CPU spikes above 90% indicate missing indexes or inefficient RLS policies.
- **Sequential Scans:** The `pg_stat_user_tables` metric for `seq_scan` must remain stable. Massive spikes in `seq_scan` on core tables (`voters`, `complaints`, `tenants`) indicate missing indexes.
- **Connection Pool:** The active database connections must not exceed the provisioned `max_connections` (causing "too many clients" errors).

## 3. Backend Bot Stability Requirements (Render)
- **Webhook Throughput:** Must successfully process 100 inbound webhook requests per second without dropping payloads.
- **OOM (Out of Memory):** 0 crashes. The Node.js process heap memory must stabilize and undergo successful garbage collection. Unbounded growth in the `activeCalls` Map constitutes a failure.
- **HTTP Errors:** < 0.5% 5xx (Server Error) responses during the Webhook Blast.

## 4. Frontend Resilience Requirements
- **Client OOM:** Simulating the retrieval of 10,000 rows (e.g., voters list or PDF report data payload) must NOT crash the browser tab or freeze the UI thread for more than 3 seconds.
- **Payload Size:** The maximum JSON payload returned by standard Supabase fetch calls should not exceed 5MB. If it does, server-side pagination (using `.range()`) must be implemented as a prerequisite.

---
**Verdict System:**
- **PASS:** All metrics met. System is cleared for 10,000 tenant scale.
- **REMEDIATE:** Some metrics failed. Targeted remediation (e.g., adding `tenant_id` indexes, moving PDF generation to backend, adding BullMQ) is required before re-testing.
