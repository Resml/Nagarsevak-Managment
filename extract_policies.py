import json
import subprocess

tables = [
  'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events',
  'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters',
  'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests',
  'sadasya', 'schemes', 'social_organizations', 'survey_responses', 'surveys',
  'tasks', 'visitors', 'voter_applications', 'voters', 'ward_provisions',
  'work_trackers', 'works', 'staff'
]

sql = f"""
COPY (
    SELECT 
        tablename,
        policyname,
        cmd,
        roles,
        qual,
        with_check
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename IN ({', '.join([f"'{t}'" for t in tables])})
) TO STDOUT WITH CSV HEADER;
"""

with open('extract_policies.sql', 'w') as f:
    f.write(sql)
