import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectStorage() {
  console.log('--- STORAGE BUCKETS ---');
  const { data: buckets, error: bError } = await supabase.storage.listBuckets();
  if (bError) console.error('Error fetching buckets:', bError);
  else console.table(buckets.map(b => ({ id: b.id, public: b.public, owner: b.owner })));

  if (buckets) {
    for (const b of buckets) {
      console.log(`\n--- OBJECTS IN BUCKET: ${b.id} ---`);
      // List all objects or some sample
      const { data: files, error: fError } = await supabase.storage.from(b.id).list('', { limit: 10, offset: 0, sortBy: { column: 'name', order: 'asc' } });
      if (fError) {
          console.error(`Error fetching objects for ${b.id}:`, fError);
      } else {
          if (files.length === 0) console.log(`Bucket ${b.id} is empty.`);
          else {
              console.table(files.map(f => ({ name: f.name, metadata: JSON.stringify(f.metadata) })));
          }
      }
    }
  }
}

inspectStorage();
