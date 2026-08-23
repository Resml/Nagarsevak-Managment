# Phase 5B RBAC Security Review

This machine-generated summary verifies all 56 targeted transformations (28 INSERT, 28 UPDATE) against the exact Phase 4 baselines.

### Table: `ai_history` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `ai_content`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ai_history.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(ai_history.tenant_id, auth.uid(), 'ai_content'))
```
---

### Table: `ai_history` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `ai_content`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ai_history.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(ai_history.tenant_id, auth.uid(), 'ai_content'))
```
---

### Table: `complaints` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `complaints`
- **Anon Allowed Before:** True | **Anon Allowed After:** True
- **Service Role Allowed Before:** True | **Service Role Allowed After:** True

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'anon'::text) OR (auth.role() = 'service_role'::text) OR (tenant_id IS NOT NULL))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = complaints.tenant_id) OR (auth.role() = 'anon'::text) OR (auth.role() = 'service_role'::text) OR (tenant_id IS NOT NULL)) AND (auth.role() IN ('anon'::text, 'service_role'::text) OR public.has_member_feature_access(complaints.tenant_id, auth.uid(), 'complaints')))
```
---

### Table: `complaints` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `complaints`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** True | **Service Role Allowed After:** True

#### USING Expression
**Original:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'service_role'::text))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = complaints.tenant_id) OR (auth.role() = 'service_role'::text)) AND (auth.role() IN ('service_role'::text) OR public.has_member_feature_access(complaints.tenant_id, auth.uid(), 'complaints')))
```
---

### Table: `election_results` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Users can insert election results for their tenant`
- **Original Roles:** `{public}`
- **Feature Key:** `election_results`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))
```
**New:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text)))) AND public.has_member_feature_access(election_results.tenant_id, auth.uid(), 'election_results'))
```
---

### Table: `election_results` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Users can update election results for their tenant`
- **Original Roles:** `{public}`
- **Feature Key:** `election_results`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))
```
**New:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text)))) AND public.has_member_feature_access(election_results.tenant_id, auth.uid(), 'election_results'))
```
---

### Table: `event_rsvps` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `events`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = event_rsvps.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(event_rsvps.tenant_id, auth.uid(), 'events'))
```
---

### Table: `event_rsvps` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `events`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = event_rsvps.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(event_rsvps.tenant_id, auth.uid(), 'events'))
```
---

### Table: `events` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `events`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = events.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(events.tenant_id, auth.uid(), 'events'))
```
---

### Table: `events` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `events`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = events.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = events.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = events.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(events.tenant_id, auth.uid(), 'events'))
```
---

### Table: `gallery` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `gallery`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gallery.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(gallery.tenant_id, auth.uid(), 'gallery'))
```
---

### Table: `gallery` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `gallery`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gallery.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(gallery.tenant_id, auth.uid(), 'gallery'))
```
---

### Table: `gb_diary` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `gb_register`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gb_diary.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(gb_diary.tenant_id, auth.uid(), 'gb_register'))
```
---

### Table: `gb_diary` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `gb_register`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gb_diary.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(gb_diary.tenant_id, auth.uid(), 'gb_register'))
```
---

### Table: `housing_societies` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `housing_societies`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = housing_societies.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(housing_societies.tenant_id, auth.uid(), 'housing_societies'))
```
---

### Table: `housing_societies` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `housing_societies`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = housing_societies.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(housing_societies.tenant_id, auth.uid(), 'housing_societies'))
```
---

### Table: `improvements` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `improvements`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = improvements.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(improvements.tenant_id, auth.uid(), 'improvements'))
```
---

### Table: `improvements` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `improvements`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = improvements.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(improvements.tenant_id, auth.uid(), 'improvements'))
```
---

### Table: `incoming_letters` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `letters`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = incoming_letters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(incoming_letters.tenant_id, auth.uid(), 'letters'))
```
---

### Table: `incoming_letters` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `letters`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = incoming_letters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(incoming_letters.tenant_id, auth.uid(), 'letters'))
```
---

### Table: `letter_requests` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `letters`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_requests.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(letter_requests.tenant_id, auth.uid(), 'letters'))
```
---

### Table: `letter_requests` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `letters`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_requests.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(letter_requests.tenant_id, auth.uid(), 'letters'))
```
---

### Table: `letter_types` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `letters`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_types.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(letter_types.tenant_id, auth.uid(), 'letters'))
```
---

### Table: `letter_types` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `letters`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_types.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(letter_types.tenant_id, auth.uid(), 'letters'))
```
---

### Table: `message_logs` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `messages`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = message_logs.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(message_logs.tenant_id, auth.uid(), 'messages'))
```
---

### Table: `message_logs` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `messages`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = message_logs.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(message_logs.tenant_id, auth.uid(), 'messages'))
```
---

### Table: `non_voters` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `election_results`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = non_voters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(non_voters.tenant_id, auth.uid(), 'election_results'))
```
---

### Table: `non_voters` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `election_results`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = non_voters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(non_voters.tenant_id, auth.uid(), 'election_results'))
```
---

### Table: `personal_requests` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `letters`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = personal_requests.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(personal_requests.tenant_id, auth.uid(), 'letters'))
```
---

### Table: `personal_requests` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `letters`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = personal_requests.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(personal_requests.tenant_id, auth.uid(), 'letters'))
```
---

### Table: `sadasya` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `sadasya`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = sadasya.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(sadasya.tenant_id, auth.uid(), 'sadasya'))
```
---

### Table: `sadasya` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `sadasya`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = sadasya.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(sadasya.tenant_id, auth.uid(), 'sadasya'))
```
---

### Table: `schemes` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `schemes`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = schemes.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(schemes.tenant_id, auth.uid(), 'schemes'))
```
---

### Table: `schemes` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `schemes`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = schemes.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(schemes.tenant_id, auth.uid(), 'schemes'))
```
---

### Table: `social_organizations` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `social_organizations`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = social_organizations.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(social_organizations.tenant_id, auth.uid(), 'social_organizations'))
```
---

### Table: `social_organizations` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `social_organizations`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = social_organizations.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(social_organizations.tenant_id, auth.uid(), 'social_organizations'))
```
---

### Table: `staff` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `staff`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = staff.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(staff.tenant_id, auth.uid(), 'staff'))
```
---

### Table: `staff` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `staff`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = staff.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(staff.tenant_id, auth.uid(), 'staff'))
```
---

### Table: `survey_responses` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `surveys`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = survey_responses.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(survey_responses.tenant_id, auth.uid(), 'surveys'))
```
---

### Table: `survey_responses` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `surveys`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = survey_responses.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(survey_responses.tenant_id, auth.uid(), 'surveys'))
```
---

### Table: `surveys` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `surveys`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = surveys.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(surveys.tenant_id, auth.uid(), 'surveys'))
```
---

### Table: `surveys` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `surveys`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = surveys.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(surveys.tenant_id, auth.uid(), 'surveys'))
```
---

### Table: `tasks` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `tasks`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = tasks.tenant_id)) AND public.has_member_feature_access(tasks.tenant_id, auth.uid(), 'tasks'))
```
---

### Table: `tasks` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `tasks`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = tasks.tenant_id)) AND public.has_member_feature_access(tasks.tenant_id, auth.uid(), 'tasks'))
```
---

### Table: `visitors` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `visitors`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = visitors.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(visitors.tenant_id, auth.uid(), 'visitors'))
```
---

### Table: `visitors` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `visitors`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = visitors.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(visitors.tenant_id, auth.uid(), 'visitors'))
```
---

### Table: `voter_applications` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `election_results`
- **Anon Allowed Before:** True | **Anon Allowed After:** True
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR ((auth.role() = 'anon'::text) AND (tenant_id IS NOT NULL)))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voter_applications.tenant_id) OR ((auth.role() = 'anon'::text) AND (tenant_id IS NOT NULL))) AND (auth.role() IN ('anon'::text) OR public.has_member_feature_access(voter_applications.tenant_id, auth.uid(), 'election_results')))
```
---

### Table: `voter_applications` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `election_results`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voter_applications.tenant_id)) AND public.has_member_feature_access(voter_applications.tenant_id, auth.uid(), 'election_results'))
```
---

### Table: `voters` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `election_results`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(voters.tenant_id, auth.uid(), 'election_results'))
```
---

### Table: `voters` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `election_results`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(voters.tenant_id, auth.uid(), 'election_results'))
```
---

### Table: `ward_provisions` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `ward_provisions`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ward_provisions.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(ward_provisions.tenant_id, auth.uid(), 'ward_provisions'))
```
---

### Table: `ward_provisions` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `ward_provisions`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ward_provisions.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(ward_provisions.tenant_id, auth.uid(), 'ward_provisions'))
```
---

### Table: `work_trackers` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `works`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = work_trackers.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(work_trackers.tenant_id, auth.uid(), 'works'))
```
---

### Table: `work_trackers` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `works`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = work_trackers.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(work_trackers.tenant_id, auth.uid(), 'works'))
```
---

### Table: `works` | Operation: `INSERT`
- **Phase 4 Policy Name:** `Tenant Isolation Insert`
- **Original Roles:** `{public}`
- **Feature Key:** `works`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### WITH CHECK Expression
**Original:**
```sql
((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = works.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(works.tenant_id, auth.uid(), 'works'))
```
---

### Table: `works` | Operation: `UPDATE`
- **Phase 4 Policy Name:** `Tenant Isolation Update`
- **Original Roles:** `{public}`
- **Feature Key:** `works`
- **Anon Allowed Before:** False | **Anon Allowed After:** False
- **Service Role Allowed Before:** False | **Service Role Allowed After:** False

#### USING Expression
**Original:**
```sql
(((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = works.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = works.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))
```
**New:**
```sql
((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = works.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(works.tenant_id, auth.uid(), 'works'))
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
