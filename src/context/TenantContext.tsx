import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, setActiveTenantSession } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { checkFeatureAccess } from '../utils/featureMatrix';

// Build-time constant — false in production, true in dev. Never changes at runtime.
const IS_DEV = import.meta.env.DEV;

export type TenantTier = 'nagarsevak' | 'amdar' | 'khasdar' | 'minister';
export type TenantPlan = 'basic' | 'pro' | 'advance';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    tier: TenantTier;
    plan: TenantPlan;
    config: any;
}

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    featureAccessReady: boolean;
    tenantId: string | null;
    refreshTenant: () => Promise<void>;
    tier: TenantTier;
    plan: TenantPlan;
    isNagarsevak: boolean;
    isAmdar: boolean;
    isKhasdar: boolean;
    isMinister: boolean;
    hasFeature: (featureKey: string) => boolean;
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    loading: true,
    featureAccessReady: false,
    tenantId: null,
    refreshTenant: async () => {},
    tier: 'nagarsevak',
    plan: 'basic',
    isNagarsevak: true,
    isAmdar: false,
    isKhasdar: false,
    isMinister: false,
    hasFeature: () => true
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading: authLoading } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [featureOverrides, setFeatureOverrides] = useState<Record<string, boolean> | null>(null);
    const [loading, setLoading] = useState(true);
    const [featureAccessReady, setFeatureAccessReady] = useState(false);
    const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null | undefined>(undefined);

    // Compute derived readiness: if the user has changed but fetchTenant hasn't finished, we are NOT ready.
    const currentUserId = user?.id || null;
    const isSynchronized = currentUserId === lastFetchedUserId;
    const actualFeatureAccessReady = featureAccessReady && isSynchronized;

    const fetchTenant = useCallback(async () => {
        setLoading(true);
        setFeatureAccessReady(false);
        setFeatureOverrides(null);
        try {
            let tenantIdToFetch: string | null = null;

            if (user?.email === 'demo_nagarsevak@demo.com') {
                tenantIdToFetch = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'; // krishnaniti tenant UUID
            }

            // 1. If User is Logged In, check their mapping FIRST
            if (user?.id && !tenantIdToFetch) {
                const { data: mapping, error: mappingError } = await supabase
                    .from('user_tenant_mapping')
                    .select('tenant_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (mapping && mapping.tenant_id) {
                    tenantIdToFetch = mapping.tenant_id;
                } else if (mappingError) {
                    console.warn("Error fetching user tenant mapping:", mappingError);
                } else {
                    console.warn("User logged in but no tenant mapping found.");
                }
            }

            // 2. If not logged in (or no mapping), Fallback to subdomain
            if (!tenantIdToFetch) {
                const hostname = window.location.hostname;
                const subdomain = hostname.split('.')[0]?.toLowerCase();
                let querySubdomain = subdomain;

                if (querySubdomain === 'amadar') {
                    querySubdomain = 'amdar';
                }

                if (
                    hostname.includes('localhost') || 
                    hostname.includes('127.0.0.1') || 
                    hostname.endsWith('.vercel.app') ||
                    subdomain === 'www' || 
                    subdomain === 'krishnaniti' || 
                    subdomain === 'default'
                ) {
                    querySubdomain = 'default';
                }

                let { data: tenantBySub } = await supabase
                    .from('tenants')
                    .select('id')
                    .eq('subdomain', querySubdomain)
                    .maybeSingle();

                // If default is not found, fallback to 'newnagarsevak' or 'krishnaniti' for demo site
                if (!tenantBySub && querySubdomain === 'default') {
                    const { data: demoTenant } = await supabase
                        .from('tenants')
                        .select('id')
                        .or('subdomain.eq.default,subdomain.eq.newnagarsevak,subdomain.eq.krishnaniti')
                        .limit(1)
                        .maybeSingle();
                    tenantBySub = demoTenant;
                }

                if (tenantBySub) {
                    tenantIdToFetch = tenantBySub.id;
                }
            }

            if (tenantIdToFetch) {
                const { data } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('id', tenantIdToFetch)
                    .maybeSingle();

                if (data) {
                    setTenant(data);
                    
                    const { data: overridesData, error: overridesError } = await supabase
                        .from('tenant_feature_overrides')
                        .select('is_enabled, features!inner(feature_key)')
                        .eq('tenant_id', tenantIdToFetch);
                    if (overridesData && !overridesError) {
                        const overridesMap: Record<string, boolean> = {};
                        overridesData.forEach((row: any) => {
                            if (row.features?.feature_key) {
                                overridesMap[row.features.feature_key] = row.is_enabled;
                            }
                        });
                        setFeatureOverrides(overridesMap);
                        setFeatureAccessReady(true);
                    } else {
                        setFeatureOverrides({});
                        setFeatureAccessReady(true);
                    }
                } else {
                    setTenant(null);
                    setFeatureOverrides({});
                    setFeatureAccessReady(true);
                }
            } else {
                setTenant(null);
                setFeatureOverrides({});
                setFeatureAccessReady(true);
            }

        } catch (err) {
            console.error("Failed to load tenant", err);
            setTenant(null);
            setFeatureOverrides({});
            setFeatureAccessReady(true);
        } finally {
            setLastFetchedUserId(user?.id || null);
            setLoading(false);
        }
    }, [user]);

    const [currentPath, setCurrentPath] = useState(window.location.pathname);

    useEffect(() => {
        const handleLocationChange = () => {
            setCurrentPath(window.location.pathname);
        };
        
        window.addEventListener('popstate', handleLocationChange);
        
        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;
        
        window.history.pushState = function(...args) {
            originalPushState.apply(this, args);
            handleLocationChange();
        };
        window.history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            handleLocationChange();
        };
        
        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.history.pushState = originalPushState;
            window.history.replaceState = originalReplaceState;
        };
    }, []);

    useEffect(() => {
        if (authLoading) return;
        fetchTenant();
    }, [user, authLoading, fetchTenant]);

    const pathParts = currentPath.split('/');
    const pathCategory = pathParts[1]?.toLowerCase();
    // NOTE: pathParts[2] (plan segment) is cosmetic routing only — it no longer overrides the effective plan.

    const validCategories = ['nagarsevak', 'amdar', 'khasdar', 'minister'];

    let tier = tenant?.tier || 'nagarsevak';
    if (validCategories.includes(pathCategory)) {
        tier = pathCategory as TenantTier;
    }

    // Plan is authoritative from the database only (tenants.plan).
    // No URL path, query param, or client-side override in production.
    const rawTenantPlan = String(tenant?.plan || 'basic');
    const normalizedTenantPlan = (rawTenantPlan === 'advanced' ? 'advance' : rawTenantPlan) as TenantPlan;

    // Authoritative plan source: tenants.plan from the database.
    const plan: TenantPlan = normalizedTenantPlan;
    useEffect(() => {
        // Pass tenant_id only — plan/tier/bypass injection removed from proxy.
        setActiveTenantSession(tenant?.id || null);
    }, [tenant]);

    const isNagarsevak = tier === 'nagarsevak';
    const isAmdar = tier === 'amdar';
    const isKhasdar = tier === 'khasdar';
    const isMinister = tier === 'minister';

    // UI/UX gate only. DB RLS (has_feature_access) is the authoritative enforcement layer.
    const hasFeature = useCallback((featureKey: string) => {
        // DO NOT expose any features if overrides have not finished initializing for the CURRENT user.
        if (!actualFeatureAccessReady) {
            return false;
        }

        let result = false;
        if (featureOverrides && featureOverrides[featureKey] !== undefined) {
            result = featureOverrides[featureKey];
            return result;
        }
        result = checkFeatureAccess(featureKey, plan);
        return result;
    }, [plan, featureOverrides, actualFeatureAccessReady]);

    return (
        <TenantContext.Provider value={{
            tenant,
            loading,
            featureAccessReady: actualFeatureAccessReady,
            tenantId: tenant?.id || null,
            refreshTenant: fetchTenant,
            tier,
            plan,
            isNagarsevak,
            isAmdar,
            isKhasdar,
            isMinister,
            hasFeature
        }}>
            {loading || !actualFeatureAccessReady ? (
                <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                children
            )}
        </TenantContext.Provider>
    );
};
