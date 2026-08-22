# Phase 5B Team RBAC Policy Matrix (Corrected)

## Overview
This matrix summarizes the exact RLS policies deployed across the 28 core domain tables. The new policies explicitly enforce double-gated Staff RBAC by injecting `has_member_feature_access()` into the exact Phase 4 policy configurations.

**Crucially, only INSERT and UPDATE operations are modified.** SELECT and DELETE policies remain entirely untouched to preserve historical read access and existing delete behaviors exactly as they were in Phase 4.

## Strict Tenancy Enforcement
Every updated policy ensures that a member from Tenant A can **never** write or modify data for Tenant B, even if that member holds explicit feature permissions for Tenant A. 

The core scoping constraint applied is:
```sql
EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id)
```

## Matrix of Modified Policies

| Table Name | Operations Replaced | Phase 4 Policy Name Preserved | Native Bypasses Automatically Preserved (From Original Phase 4) | Feature Entitlement Checked |
|---|---|---|---|---|
| `ai_history` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `ai_content` |
| `complaints` | INSERT, UPDATE | `Tenant Isolation [Op]` | `auth.role() = 'anon'` | `complaints` |
| `election_results` | INSERT, UPDATE | `Users can [op] election results...` | None | `election_results` |
| `event_rsvps` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `events` |
| `events` | INSERT, UPDATE | `Tenant Isolation [Op]` | `Allow public [op] events` (Untouched, separate policy) | `events` |
| `gallery` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `gallery` |
| `gb_diary` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `gb_register` |
| `housing_societies` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `housing_societies` |
| `improvements` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `improvements` |
| `incoming_letters` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `letters` |
| `letter_requests` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `letters` |
| `letter_types` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `letters` |
| `message_logs` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `messages` |
| `non_voters` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `election_results` |
| `personal_requests` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `letters` |
| `sadasya` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `sadasya` |
| `schemes` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `schemes` |
| `social_organizations`| INSERT, UPDATE | `Tenant Isolation [Op]` | None | `social_organizations`|
| `survey_responses` | INSERT, UPDATE | `Tenant Isolation [Op]` | `Enable [op] for public` (Untouched, separate policy) | `surveys` |
| `surveys` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `surveys` |
| `tasks` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `tasks` |
| `visitors` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `visitors` |
| `voter_applications` | INSERT, UPDATE | `Tenant Isolation [Op]` | `auth.role() = 'anon'` (Only with `tenant_id IS NOT NULL`) | `election_results` |
| `voters` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `election_results` |
| `ward_provisions` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `ward_provisions` |
| `work_trackers` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `works` |
| `works` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `works` |
| `staff` | INSERT, UPDATE | `Tenant Isolation [Op]` | None | `staff` |

## Removal of Legacy Duplicate Staff Policies
During Phase 5B diagnosis, two legacy duplicate policies on `public.staff` were discovered to contain dangerous `auth.role() = 'anon'` bypasses:
- `Tenant Isolation Insert Staff`
- `Tenant Isolation Update Staff`

These policies are explicitly dropped and permanently removed in Phase 5B. The new double-gated `Tenant Isolation Insert/Update` policies for `staff` provide strictly authenticated, entitlement-checked, and trigger-validated team management.

## Legacy Privilege Cleanup
The migration strictly revokes excessive privileges on the new Team RBAC logic functions:
- `REVOKE EXECUTE ON FUNCTION public.has_member_feature_access(UUID, UUID, TEXT) FROM PUBLIC, anon;`
- `REVOKE EXECUTE ON FUNCTION public.validate_staff_permissions_entitlement() FROM PUBLIC, anon;`
- `REVOKE EXECUTE ON FUNCTION public.prevent_staff_permission_escalation() FROM PUBLIC, anon;`
- Only `authenticated` and `service_role` are granted explicit `EXECUTE`.

## Bot and Storage Architecture
- Storage RLS is unchanged.
- `whatsapp_sessions` is unchanged and correctly leverages the `service_role` where required by proxy bypassing the normal authenticated context, effectively escaping `has_member_feature_access()`.

## Summary
- **56 Policies Updated**: Replaced with structurally perfect Phase 4 semantics + Phase 5 staff gates strictly on INSERT/UPDATE.
- **SELECT/DELETE Untouched**: 0 modifications to any SELECT or DELETE policies.
- **3 Functions Secured**: Execution strictly constrained to authorized roles.
