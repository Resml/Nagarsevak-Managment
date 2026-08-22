# Phase 9: Production Scalability & Load Readiness Audit (Read-Only)

Based on a static analysis of the repository, database schema, and frontend data-fetching patterns, several critical scalability bottlenecks exist that will prevent the system from safely supporting 10,000+ tenants without severe performance degradation or total failure.

## 1. Database Indexes & RLS Performance

> [!WARNING]
> **Missing `tenant_id` Indexes**
> An analysis of `pg_indexes` reveals that **zero** tables currently have an index on `tenant_id` (excluding primary keys). 
> 
> **Impact:** Row Level Security (RLS) injects `tenant_id = (current_setting('request.jwt.claims')::jsonb ->> 'tenant_id')::uuid` into almost every query. Without a B-Tree index on `tenant_id`, PostgreSQL must perform sequential full-table scans across millions of rows to find a specific tenant's data. At 10,000 tenants, this will cause 100% CPU utilization and widespread query timeouts.

**Additional Indexing Gaps:**
- `voters` table lacks indexes on searchable columns (`name`, `voter_id_number`, `ward_no`).
- `complaints` and `schemes` lack compound indexes for frequent filtering (e.g., `(tenant_id, status)`).

## 2. Frontend Data Fetching & Pagination

> [!CAUTION]
> **No Server-Side Pagination**
> A codebase search reveals zero instances of Supabase `.range()` or `.limit()` modifiers in the frontend data-fetching logic. 
> 
> **Impact:** The frontend fetches the entire dataset for a tenant into browser memory. While this works for 100 records, fetching 50,000 voters or 10,000 complaints at once will cause massive JSON payloads (MBs of data), high egress costs, API timeouts, and browser crashes (Out of Memory).

## 3. PDF Generation Architecture

> [!CAUTION]
> **Client-Side PDF Generation (`jsPDF` / `html2canvas`)**
> The application heavily relies on client-side rendering for PDFs (e.g., `AhwalReportGenerator`, `VoterReportGenerator`).
> 
> **Impact:** Generating a 100-page PDF containing 5,000 rows requires the browser to render the entire DOM in memory and capture it as a canvas. This will freeze the UI thread and crash mobile devices and lower-end desktops. PDF generation must be moved to a backend queue (e.g., Puppeteer on an Edge Function or Render background worker).

## 4. Bot/Backend Concurrency & State

> [!WARNING]
> **In-Memory State & Missing Queues**
> The Node.js bot uses `const activeCalls = new Map();` to store Twilio/AI conversational state. Furthermore, there is no message queue (e.g., BullMQ, RabbitMQ) configured for incoming webhooks.
> 
> **Impact:** 
> 1. The in-memory `Map` prevents the bot from horizontally scaling across multiple Render instances. If an instance restarts, active calls are dropped.
> 2. Synchronous webhook processing means a blast of incoming WhatsApp messages or Twilio callbacks will overwhelm the single Node process, causing high event-loop lag and HTTP 502/503 timeouts.

## 5. Connection Pooling

- The backend currently connects via the Supabase REST API (`createClient`), which utilizes PostgREST's internal connection pool. This is generally safe, but custom SQL executed via Edge Functions or direct Postgres connections (if any) must explicitly use Supavisor (connection pooling) to avoid exhausting PostgreSQL's `max_connections` at 10,000 scale.
