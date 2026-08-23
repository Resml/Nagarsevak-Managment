# Phase 8: Audit Logging & Rate Limit Hardening - Verification Checklist

This document is to be used *after* deploying Phase 8 to production to certify the environment.

## 1. RPC Deployment Verification
- [ ] Run `SELECT routine_name, security_type FROM information_schema.routines WHERE routine_name = 'log_security_event';` and verify `security_type` is `DEFINER`.
- [ ] Test the RPC via Postman (as authenticated): `POST /rpc/log_security_event` with a valid JWT and confirm it inserts correctly.
- [ ] Test the RPC via Postman (unauthenticated): `POST /rpc/log_security_event` with the Anon Key and confirm it inserts with `user_id = null`.
- [ ] Flood the RPC with >20 unauthenticated requests within 1 minute. Verify it returns the custom rate limit Exception.

## 2. Policy Hardening Verification
- [ ] Execute `SELECT policyname FROM pg_policies WHERE tablename = 'security_audit_logs';` and verify that `Users can insert security audit logs` is MISSING.
- [ ] Send a direct `POST /rest/v1/security_audit_logs` using the Anon Key. Confirm the request is rejected by RLS (`new row violates row-level security policy`).

## 3. Frontend Integration Verification
- [ ] Visit the live production site and intentionally trigger a failed login.
- [ ] Check the Supabase Table Editor for `security_audit_logs` and verify the event is logged successfully via the RPC with the correct payload and `client_ip`.

## 4. Webhook Signature Verification
- [ ] Send a direct mock POST request without the `X-Twilio-Signature` header to `https://nagarsevak-managment-1.onrender.com/api/inbound-ai/incoming`.
- [ ] Verify the bot returns `403 Forbidden`.
- [ ] Call the configured Twilio number and confirm the AI responds normally (proving the signature validation logic accurately computes the signature using the live Render URL).
