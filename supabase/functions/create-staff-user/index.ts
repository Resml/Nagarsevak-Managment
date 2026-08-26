import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

        // 1. Authenticate the caller
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error("Missing Authorization header")
        }

        const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const jwt = authHeader.replace('Bearer ', '');
        const { data: { user: caller }, error: authError } = await authSupabase.auth.getUser(jwt)
        if (authError || !caller) {
            console.error("Auth Error details:", authError);
            throw new Error(`Invalid or expired JWT: ${authError?.message || 'No user'}`)
        }

        const { email, password, name, role, tenant_id, mobile, area, category, keywords, permissions } = await req.json()
        
        // Input validation
        if (!email || !password || !name || !tenant_id || !mobile) {
            throw new Error("Missing required fields")
        }

        const serviceSupabase = createClient(supabaseUrl, supabaseServiceRoleKey)

        // 2. Authorize the caller for the requested tenant_id
        const { data: callerMapping, error: callerMappingError } = await serviceSupabase
            .from('user_tenant_mapping')
            .select('role')
            .eq('user_id', caller.id)
            .eq('tenant_id', tenant_id)
            .single()

        if (callerMappingError || !callerMapping) {
            throw new Error("Unauthorized: You do not have access to this tenant")
        }

        if (callerMapping.role !== 'admin' && callerMapping.role !== 'super_admin') {
            throw new Error("Unauthorized: Must be an admin or super_admin to create staff")
        }

        // 3. Create Auth User (using Service Role)
        const { data: userData, error: userError } = await serviceSupabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { name: name }
        })

        if (userError) {
            console.error("User Creation Error:", userError)
            throw new Error(userError.message)
        }

        const userId = userData.user.id

        // 4. Create User Tenant Mapping
        const { error: mappingError } = await serviceSupabase
            .from('user_tenant_mapping')
            .insert({
                user_id: userId,
                tenant_id: tenant_id,
                role: 'staff' // Always use system role 'staff'
            })

        if (mappingError) {
            await serviceSupabase.auth.admin.deleteUser(userId)
            throw new Error(mappingError.message)
        }

        // 5. Create Staff Record
        const { error: staffError } = await authSupabase
            .from('staff')
            .insert({
                id: userId,
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
            await serviceSupabase.from('user_tenant_mapping').delete().eq('user_id', userId)
            await serviceSupabase.auth.admin.deleteUser(userId)
            throw new Error(staffError.message)
        }

        return new Response(
            JSON.stringify({ user: userData.user }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        console.error("Edge Function Error:", error)
        return new Response(
            JSON.stringify({ error: error.message || "An unexpected error occurred" }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Returning 200 to allow client to read error body smoothly
            }
        )
    }
})
