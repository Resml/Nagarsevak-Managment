# Phase 9: Load Test Plan (10,000+ Tenants)

This document outlines the load testing methodology to validate the Nagarsevak Management System's readiness for 10,000 active tenants. 

## 1. Test Environments & Tooling
- **Tooling:** K6 or Locust for API load generation.
- **Environment:** Staging replica matching production compute (Supabase Large/X-Large, Render Standard/Pro).
- **Test Data Volume:** 
  - 10,000 Tenants
  - 1,000,000 Voters (distributed)
  - 500,000 Complaints/Works
  - 100,000 Users/Sadasyas

## 2. Load Stages (Step-Up Simulation)
Tests will be executed in phases, simulating concurrent active users (CCU) scaling up:
- **Phase 1 (Baseline):** 100 CCU (Represents quiet hours)
- **Phase 2 (Normal Load):** 500 CCU -> 1,000 CCU (Represents typical daily usage)
- **Phase 3 (Peak Load):** 2,500 CCU -> 5,000 CCU (Represents election season peak)
- **Phase 4 (Stress Test):** 10,000 CCU (Represents maximum theoretical capacity)

## 3. Simulated Workloads

### A. The "Election Day" Search Pattern
Simulate 20% of users concurrently searching the `voters` table.
- **Action:** `GET /rest/v1/voters?tenant_id=eq.{id}&name=ilike.*{query}*`
- **Goal:** Identify RLS CPU overhead and index utilization.

### B. The Webhook Blast
Simulate a mass WhatsApp/Twilio inbound event (e.g., public API broadcast response).
- **Action:** Blast 100 to 500 POST requests per second to the Render `/api/inbound-ai/incoming` endpoint.
- **Goal:** Measure Node.js event loop lag, memory leaks, and 502/503 HTTP errors.

### C. The "Heavy Report" Generation
Simulate 5% of users generating PDF reports (e.g., Ahwal or Ward Provisions) simultaneously.
- **Action:** Request heavy multi-join data payload required for report generation.
- **Goal:** Identify API timeout thresholds and payload size constraints.

## 4. Metrics to Measure

### Database (Supabase / PostgreSQL)
1. **CPU Utilization:** Must not hit 100% (target < 70%).
2. **RAM / Cache Hit Ratio:** Measure disk read overhead.
3. **Active Connections:** Ensure pool does not exhaust `max_connections`.
4. **Statement Latency:** Log queries taking > 1 second.

### Backend Bot (Render / Node.js)
1. **Memory Usage:** Track heap size to catch OOM leaks from `activeCalls` map.
2. **Event Loop Lag:** Crucial for async webhook throughput.
3. **HTTP Status Rates:** Count 429s (Rate Limits) and 5xxs (Server Errors).

### End-User Latency (API)
- **P50 (Median Latency):** Expected typical user experience.
- **P70 / P95 Latency:** Expected experience for heavy queries.
- **P99 Latency:** Worst-case scenario (timeout thresholds).
