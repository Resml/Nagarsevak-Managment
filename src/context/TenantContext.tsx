import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, setActiveTenantSession } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { checkFeatureAccess } from '../utils/featureMatrix';

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
    tenantId: string | null;
    refreshTenant: () => Promise<void>;
    tier: TenantTier;
    plan: TenantPlan;
    isNagarsevak: boolean;
    isAmdar: boolean;
    isKhasdar: boolean;
    isMinister: boolean;
    hasFeature: (featureKey: string) => boolean;
    setTestPlan: (plan: TenantPlan) => void;
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    loading: true,
    tenantId: null,
    refreshTenant: async () => {},
    tier: 'nagarsevak',
    plan: 'basic',
    isNagarsevak: true,
    isAmdar: false,
    isKhasdar: false,
    isMinister: false,
    hasFeature: () => true,
    setTestPlan: () => {}
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading: authLoading } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTenant = useCallback(async () => {
        setLoading(true);
        try {
            let tenantIdToFetch: string | null = null;

            if (user?.email === 'demo_nagarsevak@demo.com') {
                tenantIdToFetch = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'; // krishnaniti tenant UUID
            }

            // 1. If User is Logged In, check their mapping FIRST
            if (user?.id && !tenantIdToFetch) {
                const { data: mapping } = await supabase
                    .from('user_tenant_mapping')
                    .select('tenant_id')
                    .eq('user_id', user.id)
                    .single();

                if (mapping && mapping.tenant_id) {
                    tenantIdToFetch = mapping.tenant_id;
                } else {
                    console.warn("User logged in but no tenant mapping found.");
                }
            }

            // 2. If not logged in (or no mapping), Fallback to subdomain
            if (!tenantIdToFetch) {
                const hostname = window.location.hostname;
                const subdomain = hostname.split('.')[0];
                let querySubdomain = subdomain;

                if (querySubdomain === 'amadar') {
                    querySubdomain = 'amdar';
                }

                if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
                    querySubdomain = 'default';
                }

                const { data: tenantBySub } = await supabase
                    .from('tenants')
                    .select('id')
                    .eq('subdomain', querySubdomain)
                    .single();

                if (tenantBySub) {
                    tenantIdToFetch = tenantBySub.id;
                }
            }

            if (tenantIdToFetch) {
                const { data } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('id', tenantIdToFetch)
                    .single();

                if (data) {
                    setTenant(data);
                }
            } else {
                setTenant(null);
            }

        } catch (err) {
            console.error("Failed to load tenant", err);
        } finally {
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
    const pathPlan = pathParts[2]?.toLowerCase();
    
    const validCategories = ['nagarsevak', 'amdar', 'khasdar', 'minister'];
    const validPlans = ['basic', 'pro', 'advance', 'advanced'];

    let tier = tenant?.tier || 'nagarsevak';
    if (validCategories.includes(pathCategory)) {
        tier = pathCategory as TenantTier;
    }
    
    // Explicit plan override via URL query parameter for manual testing (?plan=pro)
    const searchParams = new URLSearchParams(window.location.search);
    const queryPlan = searchParams.get('plan');
    
    // Determine plan:
    // 1. Path-based plan (e.g. /nagarsevak/basic/dashboard)
    // 2. Query param (?plan=basic)
    // 3. Database tenant plan (normalized: 'advanced' -> 'advance')
    // 4. Fallback to 'basic'
    const rawTenantPlan = String(tenant?.plan || 'basic');
    const normalizedTenantPlan = (rawTenantPlan === 'advanced' ? 'advance' : rawTenantPlan) as TenantPlan;

    let plan: TenantPlan = normalizedTenantPlan;
    if (validPlans.includes(pathPlan)) {
        plan = (pathPlan === 'advanced' ? 'advance' : pathPlan) as TenantPlan;
    } else if (queryPlan && validPlans.includes(queryPlan.toLowerCase())) {
        plan = (queryPlan.toLowerCase() === 'advanced' ? 'advance' : queryPlan.toLowerCase()) as TenantPlan;
    }

    const [testPlan, setTestPlanState] = useState<TenantPlan>(() => {
        return (localStorage.getItem('test_plan') as TenantPlan) || normalizedTenantPlan;
    });

    const setTestPlan = useCallback((newPlan: TenantPlan) => {
        localStorage.setItem('test_plan', newPlan);
        setTestPlanState(newPlan);
    }, []);
        const shouldBypass = user?.role === 'admin';
        setActiveTenantSession(tenant?.id || null, tier, plan, shouldBypass);
    }, [tenant, tier, plan, user]);

    const isNagarsevak = tier === 'nagarsevak';
    const isAmdar = tier === 'amdar';
    const isKhasdar = tier === 'khasdar';
    const isMinister = tier === 'minister';

    const hasFeature = useCallback((featureKey: string) => {
        // 1. DYNAMIC DATABASE CHECK: If explicitly disabled for this tenant in config, ALWAYS block it
        const disabledFeatures: string[] = tenant?.config?.disabled_features || [];
        if (disabledFeatures.includes(featureKey)) {
            return false;
        }

        // 2. DYNAMIC DATABASE CHECK: If explicitly enabled for this tenant in config, ALWAYS allow it
        const enabledFeatures: string[] = tenant?.config?.enabled_features || [];
        if (enabledFeatures.includes(featureKey)) {
            return true;
        }

        // 3. Subscription Plan-based matrix access
        return checkFeatureAccess(featureKey, plan);
    }, [plan, tenant]);

    return (
        <TenantContext.Provider value={{
            tenant,
            loading,
            tenantId: tenant?.id || null,
            refreshTenant: fetchTenant,
            tier,
            plan,
            isNagarsevak,
            isAmdar,
            isKhasdar,
            isMinister,
            hasFeature,
            setTestPlan
        }}>
            {loading ? (
                <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                children
            )}
        </TenantContext.Provider>
    );
};
