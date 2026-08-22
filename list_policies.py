import csv
tables = {'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events', 'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters', 'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests', 'sadasya', 'schemes', 'social_organizations', 'survey_responses', 'surveys', 'tasks', 'visitors', 'voter_applications', 'voters', 'ward_provisions', 'work_trackers', 'works', 'staff'}
with open('migrations/live_policies.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['tablename'] in tables:
            print(f"{row['tablename']}: {row['policyname']}")
