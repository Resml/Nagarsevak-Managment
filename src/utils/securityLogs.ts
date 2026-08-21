import { supabase } from '../services/supabaseClient';
import { getDeviceInfo } from './deviceInfo';

export async function logSecurityEvent(
    eventType: string,
    details: any,
    tenantId: string | null
) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const device = getDeviceInfo();

        console.warn(`[Security Alert] ${eventType}:`, details);

        const { error } = await supabase.rpc('log_security_event', {
            p_event_type: eventType,
            p_details: {
                ...details,
                email: user?.email || null,
                browser: device.browser,
                os: device.os,
                deviceType: device.deviceType,
                user_agent: device.userAgent
            },
            p_tenant_id: tenantId
        });

        if (error) {
            console.error('[SecurityLogs] Error writing log to database:', error);
        }
    } catch (err) {
        console.error('[SecurityLogs] Failed to log security event:', err);
    }
}
