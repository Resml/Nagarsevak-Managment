import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);

async function main() {
    const tenantId = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582';

    const { data: sadasyas, error } = await supabase
        .from('sadasya')
        .select('id, area')
        .eq('tenant_id', tenantId);

    if (error) {
        console.error("Error fetching sadasyas:", error);
        return;
    }

    const uniqueAreas = Array.from(new Set(sadasyas.map(s => s.area).filter(a => a && a.trim() !== '')));
    console.log("Unique Areas found:", uniqueAreas);
}

main();
