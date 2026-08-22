# Sadasya Policy Audit

## Policy Examined
`"Enable all access for authenticated users"` on `public.sadasya`

## Original Definition
```sql
CREATE POLICY "Enable all access for authenticated users" 
ON public."sadasya" 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
```

## Origin Migration
This policy was created in **Phase 2 / Phase 3** when the application relied heavily on broad permissive rules before strict Tenant Isolation was introduced. 
It was explicitly targeted for removal during **Phase 4 Stage 3** (in `phase4_stage3_rls_integration.sql`), where it was meant to be split into granular, feature-gated `_sel`, `_ins`, `_upd`, `_del` policies. However, due to rollbacks (e.g., `phase4_stage3_rollback.sql`), the original `ALL` policy was restored.

## Why it is Insecure
The policy uses `USING (true)` and `WITH CHECK (true)` for the `ALL` operation (SELECT, INSERT, UPDATE, DELETE). Because PostgreSQL RLS policies evaluate permissively using logical `OR`, this policy completely overrides and bypasses **all** other Tenant Isolation rules. Any authenticated user (regardless of their tenant mapping or staff role) is granted unrestricted read and write access to the entire `sadasya` table. 

## Did it exist before Phase 5B?
**Yes.** This is a legacy artifact from before Phase 4 finalized its isolation framework. It existed in the database long before Phase 5B was started.

## Does removing it affect functionality?
**Yes, but securely.** Removing it will enforce the strict `Tenant Isolation` policies that already exist on the `sadasya` table. 
- **Current Behavior (Insecure):** A user from Tenant A can view, edit, or delete `sadasya` records belonging to Tenant B.
- **After Removal (Secure):** Users will be restricted to accessing `sadasya` records belonging to their mapped tenant, matching the intended architecture of the application. 
- **Risk:** If any frontend logic is relying on this broken cross-tenant access, it will begin receiving `403/404` errors. However, this is the functionally correct and secure behavior.
