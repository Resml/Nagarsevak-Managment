import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const tables = [
  'area_problems', 'event_rsvps', 'letter_requests', 'personal_requests',
  'scheme_applications', 'survey_responses', 'tasks', 'sadasya',
  'voter_applications', 'work_tracker_history', 'improvements',
  'opposition_karyakartas', 'app_settings', 'surveys', 'works',
  'letter_types', 'incoming_letters', 'gb_diary', 'schemes',
  'message_logs', 'ai_history', 'gallery', 'events', 'housing_societies',
  'visitors', 'work_trackers', 'non_voters', 'staff', 'voters',
  'support_tickets', 'ward_provisions', 'social_organizations',
  'security_audit_logs', 'login_logs', 'election_results'
];

async function checkTenantId() {
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('tenant_id').limit(1);
    if (error) {
      console.log(`[ERROR] Table: ${table} -> ${error.message}`);
    } else {
      console.log(`[OK] Table: ${table} -> Success`);
    }
  }
}

checkTenantId();
