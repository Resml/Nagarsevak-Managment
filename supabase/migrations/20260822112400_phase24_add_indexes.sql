-- Create index for conference_rooms on tenant_id
CREATE INDEX IF NOT EXISTS conference_rooms_tenant_id_idx 
ON public.conference_rooms USING btree (tenant_id);

-- Create index for user_tenant_mapping on tenant_id
CREATE INDEX IF NOT EXISTS user_tenant_mapping_tenant_id_idx 
ON public.user_tenant_mapping USING btree (tenant_id);
