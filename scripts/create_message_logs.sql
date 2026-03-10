-- ============================================================
-- Message Logs Table — for Public Communication history
-- Run this once in Supabase SQL Editor
-- ============================================================

create table if not exists message_logs (
    id            uuid primary key default gen_random_uuid(),
    tenant_id     uuid not null,
    sent_at       timestamptz not null default now(),
    channel       text not null check (channel in ('whatsapp', 'sms')),
    message       text not null,
    recipients    int not null default 0,
    sent_count    int not null default 0,
    failed_count  int not null default 0,
    created_by    text
);

-- Index for fast per-tenant queries
create index if not exists idx_message_logs_tenant_sent
    on message_logs (tenant_id, sent_at desc);

-- Row Level Security
alter table message_logs enable row level security;

-- Allow service_role (used by bot) to insert
create policy "service_role_all" on message_logs
    for all to service_role using (true) with check (true);

-- Allow authenticated users to read their own tenant's logs
create policy "tenant_select" on message_logs
    for select to authenticated
    using (tenant_id::text = current_setting('request.jwt.claims', true)::json->>'tenant_id');

-- Allow authenticated users to insert logs
create policy "tenant_insert" on message_logs
    for insert to authenticated
    with check (tenant_id::text = current_setting('request.jwt.claims', true)::json->>'tenant_id');
