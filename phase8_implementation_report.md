# Phase 8: Audit Logging & Rate Limit Hardening - Implementation Report

This report summarizes the local implementation of Phase 8 security requirements. **No changes have been executed in production yet.**

## 1. Security Audit RPC Implemented
File: `migrations/phase8_01_deploy_audit_rpc.sql`
- **Identity Enforcement:** We successfully bound `v_user_id` to `auth.uid()`, completely overriding any client-supplied user payload.
- **Tenant Validation:** When authenticated, the RPC strictly asserts that the caller exists in `user_tenant_mapping` for the specified `p_tenant_id`. 
- **Unauthenticated Handling:** For unauthenticated calls, `v_user_id` is kept `NULL`, fulfilling the requirement without impersonation risk. 
- **Validation:** Added robust validation checks: `event_type` length boundaries (max 100), and `details` JSONB payload size constraints (max ~5KB) to prevent database exhaustion.
- **Rate Limiting:** Identified that Supabase makes the client IP available via `current_setting('request.headers')::json->>'x-forwarded-for'`. Using this, we implemented a lightweight global rate limit: unauthenticated events are capped per tenant to 20 requests per minute by directly counting recent `user_id IS NULL` rows in the `security_audit_logs` table for that tenant. We also appended `client_ip` to the `p_details` payload for tracking.
- **Privileges:** The function is explicitly declared as `SECURITY DEFINER`, with `search_path = public`, and public execution is revoked before being explicitly granted to `authenticated` and `anon`.

## 2. Frontend Migration Completed
File: `src/utils/securityLogs.ts`
- Removed the direct `.from('security_audit_logs').insert(...)` call.
- Replaced with `.rpc('log_security_event', { p_event_type, p_details, p_tenant_id })`.
- A repository-wide `grep_search` confirmed **zero** remaining `.from('security_audit_logs').insert` calls.

## 3. Security Audit Policy Drop Prepared
File: `migrations/phase8_02_drop_vulnerable_policies.sql`
- Drafted the `DROP POLICY IF EXISTS` command for both the Phase 1 anon policy and the Phase 2 auth insert policy.
- Retained the `Admins Select` read policies.
- **Note:** This file is ready but not executed. It must be run only after the frontend updates reach all end-users.

## 4. Twilio Webhook Validation Applied
Files: `bot/aiCallRoutes.js`, `bot/sarvamCallRoutes.js`
- Inspected the repository and `.env` configuration. `VITE_BOT_API_URL` is set to the exact Render URL `https://nagarsevak-managment-1.onrender.com`, which matches the Twilio console configuration.
- We constructed the exact `url` parameter by dynamically appending `req.originalUrl` to the `VITE_BOT_API_URL` variable.
- Implemented `twilio.validateRequest()` checking `x-twilio-signature` against `TWILIO_AUTH_TOKEN`.
- Bound this middleware exclusively to externally-facing webhook endpoints (`/incoming`, `/process`, `/status`, and `/twiml/:callBatchId`). Internal endpoints (like `/initiate` and edge functions) are intentionally bypassed to prevent breaking server-to-server calls.

---

### Phase 8 Summary per Request
**A. What Phase 8 fixes**
It entirely eliminates direct write-access to the `security_audit_logs` table (a critical spoofing vector) and adds cryptographic signature validation to the expensive Twilio voice API routes, protecting them from credit exhaustion.

**B. What remains**
The `log_security_event` rate limiter is currently lightweight (querying recent rows). This is acceptable for current traffic levels, but at a massive scale, relying on `COUNT(*)` in an RPC for rate limiting might introduce database contention.

**C. Whether Phase 8 can be the final security remediation phase**
Yes, Phase 8 successfully closes the last critical unauthenticated write vectors (Audit Logs and Webhooks) identified in the Phase 5/6 gap analysis. 

**D. Any remaining risks for 10,000+ tenant/politician scale**
At 10,000+ scale, the lightweight unauthenticated rate limiter inside `log_security_event` could become a bottleneck. We strongly recommend implementing Redis-based rate limiting on the edge (e.g., Cloudflare WAF) rather than managing it inside Postgres RPCs.

**E. Exact production deployment order**
1. Execute `phase8_01_deploy_audit_rpc.sql` in the Supabase SQL Editor.
2. Deploy the updated Node.js Bot to Render (to enforce Twilio validation).
3. Build and deploy the Frontend (Vercel/Netlify) to migrate clients to the RPC.
4. WAIT 24-48 hours to ensure all active clients have loaded the new frontend.
5. Execute `phase8_02_drop_vulnerable_policies.sql` to shut the door on direct inserts.
