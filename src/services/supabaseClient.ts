import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase Environment Variables');
}

const rawSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Active Tenant Session State
let activeTenantId: string | null = null;
let activeTier: string | null = null;
let activePlan: string | null = null;
let bypassTenantFilter = false;

export function setActiveTenantSession(tenantId: string | null, tier: string | null, plan: string | null, bypass: boolean = false) {
    console.log('[SupabaseClient Proxy] Setting active tenant session:', { tenantId, tier, plan, bypass });
    activeTenantId = tenantId;
    activeTier = tier;
    activePlan = plan;
    bypassTenantFilter = bypass;
}

export function getGlobalTenantId(): string | null {
    return activeTenantId;
}

export function getGlobalTenantTier(): string | null {
    return activeTier;
}

export function getGlobalTenantPlan(): string | null {
    return activePlan;
}

const EXEMPT_TABLES = ['tenants', 'user_tenant_mapping', 'login_logs', 'security_audit_logs'];

// Intercept all supabase.from() calls to append tenant isolation automatically
const supabaseProxyHandler: ProxyHandler<any> = {
    get(target, prop, receiver) {
        if (prop === 'from') {
            return (relation: string) => {
                const queryBuilder = target.from(relation);
                
                // If it is an exempt table, or no active tenant session exists, or bypassed, bypass the wrapper
                if (EXEMPT_TABLES.includes(relation) || !activeTenantId || bypassTenantFilter) {
                    return queryBuilder;
                }

                // Return a proxy for the query builder to inject parameters
                return new Proxy(queryBuilder, {
                    get(builderTarget, builderProp) {
                        // 1. SELECT: append .eq('tenant_id', activeTenantId)
                        if (builderProp === 'select') {
                            return (...args: any[]) => {
                                return builderTarget.select(...args).eq('tenant_id', activeTenantId);
                            };
                        }

                        // 2. INSERT: inject tenant details into payload
                        if (builderProp === 'insert') {
                            return (values: any, ...args: any[]) => {
                                const injectDetails = (val: any) => {
                                    if (typeof val === 'object' && val !== null) {
                                        return {
                                            ...val,
                                            tenant_id: activeTenantId,
                                            category: activeTier?.toUpperCase(),
                                            plan: activePlan?.toUpperCase()
                                        };
                                    }
                                    return val;
                                };
                                const processed = Array.isArray(values) ? values.map(injectDetails) : injectDetails(values);
                                return builderTarget.insert(processed, ...args);
                            };
                        }

                        // 3. UPDATE: inject tenant details and append .eq('tenant_id', activeTenantId)
                        if (builderProp === 'update') {
                            return (values: any, ...args: any[]) => {
                                const injectDetails = (val: any) => {
                                    if (typeof val === 'object' && val !== null) {
                                        return {
                                            ...val,
                                            tenant_id: activeTenantId,
                                            category: activeTier?.toUpperCase(),
                                            plan: activePlan?.toUpperCase()
                                        };
                                    }
                                    return val;
                                };
                                return builderTarget.update(injectDetails(values), ...args).eq('tenant_id', activeTenantId);
                            };
                        }

                        // 4. UPSERT: inject tenant details and append .eq('tenant_id', activeTenantId)
                        if (builderProp === 'upsert') {
                            return (values: any, ...args: any[]) => {
                                const injectDetails = (val: any) => {
                                    if (typeof val === 'object' && val !== null) {
                                        return {
                                            ...val,
                                            tenant_id: activeTenantId,
                                            category: activeTier?.toUpperCase(),
                                            plan: activePlan?.toUpperCase()
                                        };
                                    }
                                    return val;
                                };
                                const processed = Array.isArray(values) ? values.map(injectDetails) : injectDetails(values);
                                return builderTarget.upsert(processed, ...args).eq('tenant_id', activeTenantId);
                            };
                        }

                        // 5. DELETE: append .eq('tenant_id', activeTenantId)
                        if (builderProp === 'delete') {
                            return (...args: any[]) => {
                                return builderTarget.delete(...args).eq('tenant_id', activeTenantId);
                            };
                        }

                        const val = Reflect.get(builderTarget, builderProp);
                        return typeof val === 'function' ? val.bind(builderTarget) : val;
                    }
                });
            };
        }

        const val = Reflect.get(target, prop);
        return typeof val === 'function' ? val.bind(target) : val;
    }
};

export const supabase = new Proxy(rawSupabase, supabaseProxyHandler);

