SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND (
    (tablename = 'survey_responses'
        AND policyname = 'Enable insert for authenticated users')
    OR
    (tablename = 'ai_history'
        AND policyname IN (
            'Allow anon insert access',
            'Allow anon update access'
        ))
    OR
    (tablename = 'event_rsvps'
        AND policyname IN (
            'Enable insert access for authenticated users',
            'Enable update access for authenticated users'
        ))
    OR
    (tablename = 'events'
        AND policyname = 'Allow public insert events')
    OR
    (tablename = 'gallery'
        AND policyname IN (
            'Allow anon insert access',
            'Allow anon update access'
        ))
    OR
    (tablename = 'improvements'
        AND policyname IN (
            'Allow public insert improvements',
            'Allow public update improvements'
        ))
    OR
    (tablename = 'incoming_letters'
        AND policyname IN (
            'Allow authenticated users to insert incoming letters',
            'Allow users to update own incoming letters'
        ))
    OR
    (tablename = 'message_logs'
        AND policyname = 'tenant_insert')
    OR
    (tablename = 'non_voters'
        AND policyname IN (
            'Allow public insert non_voters',
            'Allow public update non_voters'
        ))
    OR
    (tablename = 'schemes'
        AND policyname = 'Allow public insert schemes')
    OR
    (tablename = 'staff'
        AND policyname IN (
            'Tenant Isolation Insert Staff',
            'Tenant Isolation Update Staff'
        ))
    OR
    (tablename = 'voter_applications'
        AND policyname IN (
            'Enable insert access for tenant users',
            'Enable update access for tenant users'
        ))
    OR
    (tablename = 'voters'
        AND policyname IN (
            'Allow public insert voters',
            'Allow public update voters'
        ))
    OR
    (tablename = 'ward_provisions'
        AND policyname IN (
            'Allow public insert ward_provisions',
            'Allow public update ward_provisions'
        ))
    OR
    (tablename = 'work_trackers'
        AND policyname IN (
            'Users can insert work trackers for their tenant',
            'Users can update work trackers for their tenant'
        ))
    OR
    (tablename = 'works'
        AND policyname = 'Allow public insert works')
)
ORDER BY tablename, cmd, policyname;
