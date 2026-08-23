SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    roles::text AS roles, 
    COALESCE(qual, '') AS qual, 
    COALESCE(with_check, '') AS with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
      'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events',
      'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters',
      'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests',
      'sadasya', 'schemes', 'social_organizations', 'survey_responses', 'surveys',
      'tasks', 'visitors', 'voter_applications', 'voters', 'ward_provisions',
      'work_trackers', 'works', 'staff'
  )
  AND cmd IN ('INSERT', 'UPDATE')
  AND NOT (
      policyname = 'Tenant Isolation Insert' OR
      policyname = 'Tenant Isolation Update' OR
      policyname = 'Users can insert election results for their tenant' OR
      policyname = 'Users can update election results for their tenant' OR
      (tablename = 'survey_responses' AND policyname = 'Enable insert for public')
  )
ORDER BY tablename, cmd, policyname;
