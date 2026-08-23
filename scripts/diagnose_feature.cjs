const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role to bypass RLS
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const bf4cId = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
    const e5a9Id = 'e5a973bb-54de-4a92-bd17-91a97d7fefc3';
    
    // Get the feature UUID for gb_register
    const { data: feat } = await supabase.from('features').select('id').eq('feature_key', 'gb_register').single();
    console.log('gb_register feature id:', feat?.id);
    
    // Get plan UUID for advance
    const { data: plan } = await supabase.from('plans').select('id').eq('plan_key', 'advance').single();
    console.log('advance plan id:', plan?.id);
    
    // Check plan_features
    const { data: pf } = await supabase.from('plan_features').select('*').eq('plan_id', plan?.id).eq('feature_id', feat?.id);
    console.log('plan_features row:', JSON.stringify(pf));
    
    // Check plan_features cumulative — does advance plan include basic/pro features?
    const { data: allPf, count } = await supabase.from('plan_features').select('*', { count: 'exact' }).eq('plan_id', plan?.id);
    console.log('Total advance plan_features:', count, JSON.stringify(allPf?.map(r => r.feature_id)));
    
    // Check bf4c overrides
    const { data: ov1 } = await supabase.from('tenant_feature_overrides').select('*').eq('tenant_id', bf4cId);
    console.log('bf4c overrides:', JSON.stringify(ov1));
    
    // Check bf4c tenant plan value
    const { data: t1 } = await supabase.from('tenants').select('plan, tier, config').eq('id', bf4cId).single();
    console.log('bf4c tenant plan:', t1?.plan, 'tier:', t1?.tier);
}

run();
