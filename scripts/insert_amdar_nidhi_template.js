const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

async function run() {
  if (urlMatch && keyMatch) {
    const supabaseUrl = urlMatch[1].trim();
    const supabaseKey = keyMatch[1].trim();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tenantData, error: tenantError } = await supabase.from('tenants').select('id').limit(1);
    
    if (tenantError || !tenantData || tenantData.length === 0) {
      console.error('No tenant found:', tenantError);
      process.exit(1);
    }
    
    const tenantId = tenantData[0].id;
    const templateContent = `प्रति,
मा. जिल्हाधिकारी साो,
जिल्हाधिकारी कार्यालय, जालना.

विषय: आमदारांचा स्थानिक विकास निधी २०२६-२७ अंतर्गत खालील कामांना निधी मंजुर करणे बाबत.

महोदय,
उपरोक्त विषयी विनंती की, माझ्या मतदार संघातील खालील कामे करणे अत्यंत गरजेचे आहे. मला एका निवेदनाद्वारे उपरोक्त कामे करणे बाबत सदर गावातील / परिसरातील नागरिकांना कळविलेले आहे. त्यामुळे सदर कामे आमदारांचा स्थानिक विकास निधी २०२६-२७ अंतर्गत निधी मंजुर करणे बाबत आपणास विनंती आहे.

१) {{work_1}}
२) {{work_2}}
३) {{work_3}}

तरी उपरोक्त प्रमाणे माझ्या मतदार संघातील कामे आमदारांचा स्थानिक विकास निधी २०२६-२७ अंतर्गत प्रशासकीय मान्य देणे बाबत उचित कार्यवाही करावी, करीता विनंती आहे.

आपला,

( {{name}} )

प्रत:
मा. जिल्हानियोजन अधिकारी, जालना.`;

    const payload = {
      name: 'Amdar Nidhi Recommendation',
      name_marathi: 'आमदार निधी मंजुरी पत्र',
      description: 'Letter for Amdar Nidhi allocation (Amdar Only)',
      template_content: templateContent,
      is_active: true,
      tenant_id: tenantId
    };

    const { data, error } = await supabase.from('letter_types').upsert(payload, { onConflict: 'name', ignoreDuplicates: false });
    
    if (error) {
      console.error('Error inserting template:', error);
      process.exit(1);
    } else {
      console.log('Successfully inserted Amdar Nidhi template.');
      process.exit(0);
    }
  } else {
    console.log('Credentials not found');
    process.exit(1);
  }
}

run();
