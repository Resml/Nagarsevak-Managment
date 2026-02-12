import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, password, name, role, tenant_id, mobile, area, category, keywords, permissions } = await req.json()
        console.log("Received request:", { email, name, role, tenant_id, mobile, permissions })

        // 1. Create Auth User
        const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { name: name }
        })

        if (userError) {
            console.error("User Creation Error:", userError)
            throw userError
        }

        const userId = userData.user.id

        // 2. Create User Tenant Mapping
        const { error: mappingError } = await supabaseClient
            .from('user_tenant_mapping')
            .insert({
                user_id: userId,
                tenant_id: tenant_id,
                role: 'staff' // Always use system role 'staff' for auth/permissions logic
            })

        if (mappingError) {
            // Rollback user creation if mapping fails (optional but good practice)
            await supabaseClient.auth.admin.deleteUser(userId)
            throw mappingError
        }

        // 3. Create Staff Record
        // We check if a staff with this mobile already exists to avoid duplicates if the UI didn't catch it
        // But typically we just insert.
        const { error: staffError } = await supabaseClient
            .from('staff')
            .insert({
                id: userId, // Link staff ID to Auth User ID for easy reference
                name: name,
                mobile: mobile,
                role: role,
                area: area,
                category: category,
                keywords: keywords,
                permissions: permissions,
                tenant_id: tenant_id
            })

        if (staffError) {
            // Rollback everything
            await supabaseClient.from('user_tenant_mapping').delete().eq('user_id', userId)
            await supabaseClient.auth.admin.deleteUser(userId)
            throw staffError
        }

        return new Response(
            JSON.stringify({ user: userData.user }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error("Edge Function Error:", error)
        // Return 200 even on error so the client can read the error message in the body
        // instead of getting a generic FunctionsHttpError
        return new Response(
            JSON.stringify({ error: error.message || "An unexpected error occurred" }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    }
})
