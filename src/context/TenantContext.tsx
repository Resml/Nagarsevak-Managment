import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    config: any;
}

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    tenantId: string | null;
}

const TenantContext = createContext<TenantContextType>({ tenant: null, loading: true, tenantId: null });

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading: authLoading } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        const fetchTenant = async () => {
            setLoading(true);
            try {
                let tenantIdToFetch: string | null = null;

                // 1. If User is Logged In, check their mapping FIRST
                if (user?.id) {
                    const { data: mapping, error: mappingError } = await supabase
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
                // This allows public pages (like Complaint Box) to work if we enable them later
                if (!tenantIdToFetch) {
                    const hostname = window.location.hostname;
                    const subdomain = hostname.split('.')[0];
                    let querySubdomain = subdomain;

                    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
                        querySubdomain = 'default';
                        // console.log('Dev Mode fallback: Using default tenant');
                    }

                    // We only fetch by subdomain if we don't have a user mapping
                    // But for strict admin, we might NOT want this. 
                    // However, we need to fetch the tenant ID to know WHICH tenant we are visiting publicly.
                    // For now, let's allow finding tenant by subdomain so consistent context exists.
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
                    const { data, error } = await supabase
                        .from('tenants')
                        .select('*')
                        .eq('id', tenantIdToFetch)
                        .single();

                    if (data) {
                        setTenant(data);
                        // document.title = data.name + " - Nagarsevak Management";
                    }
                } else {
                    setTenant(null);
                }

            } catch (err) {
                console.error("Failed to load tenant", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, [user, authLoading]);

    return (
        <TenantContext.Provider value={{ tenant, loading, tenantId: tenant?.id || null }}>
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
