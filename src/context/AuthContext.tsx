import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let currentUserId: string | null = null;
        let staffChannel: ReturnType<typeof supabase.channel> | null = null;

        const loadUser = async (sessionUser: { id: string; email?: string; user_metadata?: any }) => {
            currentUserId = sessionUser.id;

            // Fetch role from user_tenant_mapping
            const { data: mappingData } = await supabase
                .from('user_tenant_mapping')
                .select('role')
                .eq('user_id', sessionUser.id)
                .single();
            const userRole = mappingData?.role || 'staff';

            // Fetch permissions from staff table
            const { data: staffData } = await supabase
                .from('staff')
                .select('permissions')
                .eq('id', sessionUser.id)
                .maybeSingle();

            const permissions: string[] = (staffData?.permissions && Array.isArray(staffData.permissions))
                ? staffData.permissions
                : [];

            console.log('[AuthContext] Resolved user:', {
                id: sessionUser.id,
                email: sessionUser.email,
                role: userRole,
                permissions,
                isStaff: !!staffData,
            });

            setUser({
                id: sessionUser.id,
                name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
                email: sessionUser.email || '',
                role: userRole,
                permissions,
                isStaff: !!staffData,
            });
            setIsLoading(false);

            // Set up real-time subscription for staff permissions changes
            // Clean up any previous subscription first
            if (staffChannel) {
                supabase.removeChannel(staffChannel);
            }

            if (staffData) {
                // Only subscribe if user is a staff member
                staffChannel = supabase
                    .channel(`staff-permissions-${sessionUser.id}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'staff',
                            filter: `id=eq.${sessionUser.id}`,
                        },
                        (payload) => {
                            console.log('[AuthContext] Staff permissions updated in real-time:', payload.new);
                            const updatedPermissions: string[] = Array.isArray(payload.new.permissions)
                                ? payload.new.permissions
                                : [];
                            setUser((prev) =>
                                prev
                                    ? { ...prev, permissions: updatedPermissions }
                                    : prev
                            );
                        }
                    )
                    .subscribe();
            }
        };

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadUser(session.user);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth state changes (login/logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadUser(session.user);
            } else {
                currentUserId = null;
                if (staffChannel) {
                    supabase.removeChannel(staffChannel);
                    staffChannel = null;
                }
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            if (staffChannel) supabase.removeChannel(staffChannel);
        };
    }, []);


    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setIsLoading(false); // Only stop loading on error, otherwise wait for auth state change
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (err) {
            setIsLoading(false);
            return { success: false, error: 'An unexpected error occurred' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
