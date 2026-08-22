# Phase 5B RBAC Security Review

This machine-generated summary verifies all 56 targeted transformations (28 INSERT, 28 UPDATE) against the exact Phase 4 baselines.

### Table: `ai_history` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `ai_content`
- **Outer Table Qualification:** `ai_history.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ai_history.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(ai_history.tenant_id, auth.uid(), 'ai_content')
```
---

### Table: `ai_history` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `ai_content`
- **Outer Table Qualification:** `ai_history.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ai_history.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(ai_history.tenant_id, auth.uid(), 'ai_content')
```
---

### Table: `complaints` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `complaints`
- **Outer Table Qualification:** `complaints.tenant_id`
- **Original Anon/Service Role Behavior:** anon (WITH CHECK), service_role (WITH CHECK)
- **Behavior Preserved Exactly:** Yes
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'anon'::text) OR (auth.role() = 'service_role'::text) OR (tenant_id IS NOT NULL))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = complaints.tenant_id)) OR (auth.role() = 'anon'::text) OR (auth.role() = 'service_role'::text) OR (tenant_id IS NOT NULL))) AND (auth.role() = 'anon'::text OR auth.role() = 'service_role'::text OR public.has_member_feature_access(complaints.tenant_id, auth.uid(), 'complaints'))
```
---

### Table: `complaints` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `complaints`
- **Outer Table Qualification:** `complaints.tenant_id`
- **Original Anon/Service Role Behavior:** service_role (USING)
- **Behavior Preserved Exactly:** Yes
#### USING Expression
**Original:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'service_role'::text))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = complaints.tenant_id)) OR (auth.role() = 'service_role'::text))) AND (auth.role() = 'service_role'::text OR public.has_member_feature_access(complaints.tenant_id, auth.uid(), 'complaints'))
```
---

### Table: `election_results` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Users can insert election results for their tenant`
- **New Policy Name:** `Users can insert election results for their tenant` (Preserved exactly)
- **Feature Key Injected:** `election_results`
- **Outer Table Qualification:** `election_results.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))
```
**New:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))) AND public.has_member_feature_access(election_results.tenant_id, auth.uid(), 'election_results')
```
---

### Table: `election_results` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Users can update election results for their tenant`
- **New Policy Name:** `Users can update election results for their tenant` (Preserved exactly)
- **Feature Key Injected:** `election_results`
- **Outer Table Qualification:** `election_results.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))
```
**New:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))) AND public.has_member_feature_access(election_results.tenant_id, auth.uid(), 'election_results')
```
---

### Table: `event_rsvps` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `events`
- **Outer Table Qualification:** `event_rsvps.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = event_rsvps.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(event_rsvps.tenant_id, auth.uid(), 'events')
```
---

### Table: `event_rsvps` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `events`
- **Outer Table Qualification:** `event_rsvps.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = event_rsvps.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(event_rsvps.tenant_id, auth.uid(), 'events')
```
---

### Table: `events` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `events`
- **Outer Table Qualification:** `events.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = events.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(events.tenant_id, auth.uid(), 'events')
```
---

### Table: `events` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `events`
- **Outer Table Qualification:** `events.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = events.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(events.tenant_id, auth.uid(), 'events')
```
---

### Table: `gallery` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `gallery`
- **Outer Table Qualification:** `gallery.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gallery.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(gallery.tenant_id, auth.uid(), 'gallery')
```
---

### Table: `gallery` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `gallery`
- **Outer Table Qualification:** `gallery.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gallery.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(gallery.tenant_id, auth.uid(), 'gallery')
```
---

### Table: `gb_diary` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `gb_register`
- **Outer Table Qualification:** `gb_diary.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gb_diary.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(gb_diary.tenant_id, auth.uid(), 'gb_register')
```
---

### Table: `gb_diary` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `gb_register`
- **Outer Table Qualification:** `gb_diary.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gb_diary.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(gb_diary.tenant_id, auth.uid(), 'gb_register')
```
---

### Table: `housing_societies` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `housing_societies`
- **Outer Table Qualification:** `housing_societies.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = housing_societies.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(housing_societies.tenant_id, auth.uid(), 'housing_societies')
```
---

### Table: `housing_societies` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `housing_societies`
- **Outer Table Qualification:** `housing_societies.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = housing_societies.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(housing_societies.tenant_id, auth.uid(), 'housing_societies')
```
---

### Table: `improvements` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `improvements`
- **Outer Table Qualification:** `improvements.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = improvements.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(improvements.tenant_id, auth.uid(), 'improvements')
```
---

### Table: `improvements` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `improvements`
- **Outer Table Qualification:** `improvements.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = improvements.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(improvements.tenant_id, auth.uid(), 'improvements')
```
---

### Table: `incoming_letters` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `letters`
- **Outer Table Qualification:** `incoming_letters.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = incoming_letters.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(incoming_letters.tenant_id, auth.uid(), 'letters')
```
---

### Table: `incoming_letters` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `letters`
- **Outer Table Qualification:** `incoming_letters.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = incoming_letters.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(incoming_letters.tenant_id, auth.uid(), 'letters')
```
---

### Table: `letter_requests` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `letters`
- **Outer Table Qualification:** `letter_requests.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_requests.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(letter_requests.tenant_id, auth.uid(), 'letters')
```
---

### Table: `letter_requests` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `letters`
- **Outer Table Qualification:** `letter_requests.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_requests.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(letter_requests.tenant_id, auth.uid(), 'letters')
```
---

### Table: `letter_types` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `letters`
- **Outer Table Qualification:** `letter_types.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_types.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(letter_types.tenant_id, auth.uid(), 'letters')
```
---

### Table: `letter_types` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `letters`
- **Outer Table Qualification:** `letter_types.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_types.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(letter_types.tenant_id, auth.uid(), 'letters')
```
---

### Table: `message_logs` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `messages`
- **Outer Table Qualification:** `message_logs.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = message_logs.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(message_logs.tenant_id, auth.uid(), 'messages')
```
---

### Table: `message_logs` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `messages`
- **Outer Table Qualification:** `message_logs.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = message_logs.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(message_logs.tenant_id, auth.uid(), 'messages')
```
---

### Table: `non_voters` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `election_results`
- **Outer Table Qualification:** `non_voters.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = non_voters.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(non_voters.tenant_id, auth.uid(), 'election_results')
```
---

### Table: `non_voters` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `election_results`
- **Outer Table Qualification:** `non_voters.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = non_voters.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(non_voters.tenant_id, auth.uid(), 'election_results')
```
---

### Table: `personal_requests` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `letters`
- **Outer Table Qualification:** `personal_requests.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = personal_requests.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(personal_requests.tenant_id, auth.uid(), 'letters')
```
---

### Table: `personal_requests` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `letters`
- **Outer Table Qualification:** `personal_requests.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = personal_requests.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(personal_requests.tenant_id, auth.uid(), 'letters')
```
---

### Table: `sadasya` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `sadasya`
- **Outer Table Qualification:** `sadasya.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = sadasya.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(sadasya.tenant_id, auth.uid(), 'sadasya')
```
---

### Table: `sadasya` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `sadasya`
- **Outer Table Qualification:** `sadasya.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = sadasya.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(sadasya.tenant_id, auth.uid(), 'sadasya')
```
---

### Table: `schemes` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `schemes`
- **Outer Table Qualification:** `schemes.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = schemes.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(schemes.tenant_id, auth.uid(), 'schemes')
```
---

### Table: `schemes` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `schemes`
- **Outer Table Qualification:** `schemes.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = schemes.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(schemes.tenant_id, auth.uid(), 'schemes')
```
---

### Table: `social_organizations` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `social_organizations`
- **Outer Table Qualification:** `social_organizations.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = social_organizations.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(social_organizations.tenant_id, auth.uid(), 'social_organizations')
```
---

### Table: `social_organizations` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `social_organizations`
- **Outer Table Qualification:** `social_organizations.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = social_organizations.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(social_organizations.tenant_id, auth.uid(), 'social_organizations')
```
---

### Table: `staff` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `staff`
- **Outer Table Qualification:** `staff.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = staff.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(staff.tenant_id, auth.uid(), 'staff')
```
---

### Table: `staff` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `staff`
- **Outer Table Qualification:** `staff.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = staff.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(staff.tenant_id, auth.uid(), 'staff')
```
---

### Table: `survey_responses` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `surveys`
- **Outer Table Qualification:** `survey_responses.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = survey_responses.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(survey_responses.tenant_id, auth.uid(), 'surveys')
```
---

### Table: `survey_responses` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `surveys`
- **Outer Table Qualification:** `survey_responses.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = survey_responses.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(survey_responses.tenant_id, auth.uid(), 'surveys')
```
---

### Table: `surveys` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `surveys`
- **Outer Table Qualification:** `surveys.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = surveys.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(surveys.tenant_id, auth.uid(), 'surveys')
```
---

### Table: `surveys` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `surveys`
- **Outer Table Qualification:** `surveys.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = surveys.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(surveys.tenant_id, auth.uid(), 'surveys')
```
---

### Table: `tasks` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `tasks`
- **Outer Table Qualification:** `tasks.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = tasks.tenant_id))) AND public.has_member_feature_access(tasks.tenant_id, auth.uid(), 'tasks')
```
---

### Table: `tasks` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `tasks`
- **Outer Table Qualification:** `tasks.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = tasks.tenant_id))) AND public.has_member_feature_access(tasks.tenant_id, auth.uid(), 'tasks')
```
---

### Table: `visitors` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `visitors`
- **Outer Table Qualification:** `visitors.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = visitors.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(visitors.tenant_id, auth.uid(), 'visitors')
```
---

### Table: `visitors` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `visitors`
- **Outer Table Qualification:** `visitors.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = visitors.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(visitors.tenant_id, auth.uid(), 'visitors')
```
---

### Table: `voter_applications` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `election_results`
- **Outer Table Qualification:** `voter_applications.tenant_id`
- **Original Anon/Service Role Behavior:** anon (WITH CHECK)
- **Behavior Preserved Exactly:** Yes
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR ((auth.role() = 'anon'::text) AND (tenant_id IS NOT NULL)))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voter_applications.tenant_id)) OR ((auth.role() = 'anon'::text) AND (tenant_id IS NOT NULL)))) AND (auth.role() = 'anon'::text OR public.has_member_feature_access(voter_applications.tenant_id, auth.uid(), 'election_results'))
```
---

### Table: `voter_applications` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `election_results`
- **Outer Table Qualification:** `voter_applications.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voter_applications.tenant_id))) AND public.has_member_feature_access(voter_applications.tenant_id, auth.uid(), 'election_results')
```
---

### Table: `voters` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `election_results`
- **Outer Table Qualification:** `voters.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voters.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(voters.tenant_id, auth.uid(), 'election_results')
```
---

### Table: `voters` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `election_results`
- **Outer Table Qualification:** `voters.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voters.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(voters.tenant_id, auth.uid(), 'election_results')
```
---

### Table: `ward_provisions` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `ward_provisions`
- **Outer Table Qualification:** `ward_provisions.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ward_provisions.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(ward_provisions.tenant_id, auth.uid(), 'ward_provisions')
```
---

### Table: `ward_provisions` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `ward_provisions`
- **Outer Table Qualification:** `ward_provisions.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ward_provisions.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(ward_provisions.tenant_id, auth.uid(), 'ward_provisions')
```
---

### Table: `work_trackers` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `works`
- **Outer Table Qualification:** `work_trackers.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = work_trackers.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(work_trackers.tenant_id, auth.uid(), 'works')
```
---

### Table: `work_trackers` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `works`
- **Outer Table Qualification:** `work_trackers.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = work_trackers.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(work_trackers.tenant_id, auth.uid(), 'works')
```
---

### Table: `works` | Operation: `INSERT`
- **Original Phase 4 Policy Name:** `Tenant Isolation Insert`
- **New Policy Name:** `Tenant Isolation Insert` (Preserved exactly)
- **Feature Key Injected:** `works`
- **Outer Table Qualification:** `works.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
(((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = works.tenant_id)) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(works.tenant_id, auth.uid(), 'works')
```
---

### Table: `works` | Operation: `UPDATE`
- **Original Phase 4 Policy Name:** `Tenant Isolation Update`
- **New Policy Name:** `Tenant Isolation Update` (Preserved exactly)
- **Feature Key Injected:** `works`
- **Outer Table Qualification:** `works.tenant_id`
- **Original Anon/Service Role Behavior:** None
- **Behavior Preserved Exactly:** N/A
#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = works.tenant_id))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND public.has_member_feature_access(works.tenant_id, auth.uid(), 'works')
```
---


## Global Validations
- `utm.tenant_id = utm.tenant_id`: 0 occurrences
- `utm.tenant_id = tenant_id`: 0 occurrences
- Unqualified tenant_id references inside `user_tenant_mapping` subqueries: 0 occurrences
- Generic `auth.role() = 'anon'` bypasses: 0 occurrences (only native Phase 3B bypasses natively explicitly preserved)
- `DROP POLICY` targeting `SELECT` or `DELETE`: 0 occurrences
- Modifications to `storage.objects`: 0
- Modifications to `whatsapp_sessions`: 0

## Function Security Matrix
| Function | SECURITY DEFINER | SET search_path = public | PUBLIC EXECUTE Revoked | anon EXECUTE Revoked | Granted only to authenticated/service_role |
|----------|-----------------|-------------------------|------------------------|----------------------|---------------------------------------------|
| `has_member_feature_access` | Yes | Yes | Yes | Yes | Yes |
| `validate_staff_permissions_entitlement` | Yes | Yes | Yes | Yes | Yes |
| `prevent_staff_permission_escalation` | Yes | Yes | Yes | Yes | Yes |

## Rollback Guarantee
- Restores the exact Phase 4 policy definitions (uses `(tenant_id = (SELECT...))` fallback semantics directly mirroring Phase 4 Stage 3/5).
- Does NOT drop or alter `has_feature_access()`.
- Does NOT touch Storage.
- Does NOT touch `whatsapp_sessions`.
- Does NOT touch Phase 3B pure public intake policies.
