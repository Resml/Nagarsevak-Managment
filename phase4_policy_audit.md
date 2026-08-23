# Phase 4 to Phase 5B Policy Audit (Read-Only)

## Standalone Anon/Public Policies Identified
- **admin_billing**: Enable all operations for admin_billing
- **admin_support_tickets**: Enable all operations for admin_support_tickets
- **admin_updates**: Enable all operations for admin_updates
- **ai_history**: Allow anon delete access, Allow anon insert access, Allow anon read access, Allow anon update access, Tenant Isolation Delete, Tenant Isolation Select
- **app_settings**: Allow full access app_settings
- **area_problems**: area_problems_tenant_isolation
- **complaints**: Tenant Isolation Delete, Tenant Isolation Select
- **election_results**: Users can delete election results for their tenant, Users can view election results for their tenant
- **event_rsvps**: Enable delete access for authenticated users, Enable insert access for authenticated users, Enable read access for authenticated users, Enable update access for authenticated users, Tenant Isolation Delete, Tenant Isolation Select
- **events**: Allow public insert events, Allow public read events, Tenant Isolation Delete, Tenant Isolation Select
- **gallery**: Allow anon delete access, Allow anon insert access, Allow anon read access, Allow anon update access, Tenant Isolation Delete, Tenant Isolation Select
- **gb_diary**: Allow all for everyone, Tenant Isolation Delete, Tenant Isolation Select
- **housing_societies**: Tenant Isolation Delete, Tenant Isolation Select
- **improvements**: Allow public insert improvements, Allow public read improvements, Allow public update improvements, Tenant Isolation Delete, Tenant Isolation Select
- **incoming_letters**: Tenant Isolation Delete, Tenant Isolation Select
- **letter_requests**: Public Access Letters, Tenant Isolation Delete, Tenant Isolation Select
- **letter_types**: Public Access Letter Types, Tenant Isolation Delete, Tenant Isolation Select, letter_types_tenant_isolation
- **login_logs**: Nagarsevak can view all login logs for their tenant, Users can insert their own login logs, Users can view their own login logs
- **message_logs**: Tenant Isolation Delete, Tenant Isolation Select
- **non_voters**: Allow public insert non_voters, Allow public read non_voters, Allow public update non_voters, Tenant Isolation Delete, Tenant Isolation Select
- **opposition_karyakartas**: Allow read access opposition karyakartas
- **personal_requests**: Tenant Isolation Delete, Tenant Isolation Select, personal_requests_tenant_isolation
- **sadasya**: Enable read access for all users of same tenant, Tenant Isolation Delete, Tenant Isolation Select
- **scheme_applications**: Enable all access for tenant users
- **schemes**: Allow public insert schemes, Allow public read schemes, Tenant Isolation Delete, Tenant Isolation Select
- **security_audit_logs**: Admins can view tenant audit logs, Users can insert security audit logs
- **social_organizations**: Tenant Isolation Delete, Tenant Isolation Select
- **staff**: Tenant Isolation Delete, Tenant Isolation Delete Staff, Tenant Isolation Insert Staff, Tenant Isolation Select, Tenant Isolation Select Staff, Tenant Isolation Update Staff
- **support_tickets**: Tenant Isolation Delete, Tenant Isolation Select
- **survey_responses**: Enable insert for public, Enable select for public, Tenant Isolation Delete, Tenant Isolation Select
- **surveys**: Tenant Isolation Delete, Tenant Isolation Select
- **tasks**: Tenant Isolation Delete, Tenant Isolation Select
- **tenants**: Allow public read of tenants, Public read access to tenants, Users can update own tenant
- **user_tenant_mapping**: Users can read own tenant mapping
- **visitors**: Public Access Visitors, Tenant Isolation Delete, Tenant Isolation Select
- **voter_applications**: Enable insert access for tenant users, Enable read access for tenant users, Enable update access for tenant users, Tenant Isolation Delete, Tenant Isolation Select
- **voters**: Allow public insert voters, Allow public read voters, Allow public update voters, Tenant Isolation Delete, Tenant Isolation Select
- **ward_provisions**: Allow public insert ward_provisions, Allow public read ward_provisions, Allow public update ward_provisions, Tenant Isolation Delete, Tenant Isolation Select
- **whatsapp_sessions**: Allow all access to whatsapp_sessions
- **work_trackers**: Tenant Isolation Delete, Tenant Isolation Select
- **works**: Allow public insert works, Allow public read works, Tenant Isolation Delete, Tenant Isolation Select

---

## Target 28 Table Audit (Tenant Isolation Policies)

### `ai_history` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `ai_history` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `complaints` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: True
- **Contains Inline service_role logic?**: True
**Qual:** `null`
**With Check:** `((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'anon'::text) OR (auth.role() = 'service_role'::text) OR (tenant_id IS NOT NULL))`

### `complaints` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: True
**Qual:** `((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'service_role'::text))`
**With Check:** `null`

### `election_results` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))`

### `election_results` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))`
**With Check:** `null`

### `event_rsvps` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `event_rsvps` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `events` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `events` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = events.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = events.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `gallery` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `gallery` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `gb_diary` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `gb_diary` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `housing_societies` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `housing_societies` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `improvements` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `improvements` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `incoming_letters` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `incoming_letters` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `letter_requests` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `letter_requests` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `letter_types` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `letter_types` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `message_logs` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `message_logs` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `non_voters` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `non_voters` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `personal_requests` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `personal_requests` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `sadasya` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `sadasya` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `schemes` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `schemes` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `social_organizations` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `social_organizations` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `staff` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `staff` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `survey_responses` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `survey_responses` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `surveys` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `surveys` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `tasks` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))`

### `tasks` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))`
**With Check:** `null`

### `visitors` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `visitors` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `voter_applications` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: True
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR ((auth.role() = 'anon'::text) AND (tenant_id IS NOT NULL)))`

### `voter_applications` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))`
**With Check:** `null`

### `voters` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `voters` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `ward_provisions` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `ward_provisions` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `work_trackers` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `work_trackers` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

### `works` (INSERT)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `null`
**With Check:** `((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`

### `works` (UPDATE)
- **Targeted Roles**: {public}
- **Has Standalone Anon Policy?**: Yes
- **Contains Inline anon logic?**: False
- **Contains Inline service_role logic?**: False
**Qual:** `(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = works.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = works.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))`
**With Check:** `null`

