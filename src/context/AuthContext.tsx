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
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                // Fetch the user's role from the mapping table
                supabase
                    .from('user_tenant_mapping')
                    .select('role')
                    .eq('user_id', session.user.id)
                    .single()
                    .then(async ({ data, error }) => {
                        const userRole = data?.role || 'staff'; // Default to staff if not found

                        let permissions: string[] = [];
                        // Try to fetch permissions from staff table
                        const { data: staffData } = await supabase
                            .from('staff')
                            .select('permissions')
                            .eq('id', session.user.id)
                            .maybeSingle();

                        if (staffData?.permissions) {
                            permissions = staffData.permissions;
                        }

                        setUser({
                            id: session.user.id,
                            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                            email: session.user.email || '',
                            role: userRole,
                            permissions
                        });
                        setIsLoading(false);
                    });
            } else {
                setIsLoading(false);
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                // Fetch role again on auth change
                supabase
                    .from('user_tenant_mapping')
                    .select('role')
                    .eq('user_id', session.user.id)
                    .single()
                    .then(async ({ data }) => {
                        const userRole = data?.role || 'staff';

                        let permissions: string[] = [];
                        // Try to fetch permissions from staff table
                        const { data: staffData } = await supabase
                            .from('staff')
                            .select('permissions')
                            .eq('id', session.user.id)
                            .maybeSingle();

                        if (staffData?.permissions) {
                            permissions = staffData.permissions;
                        }

                        setUser({
                            id: session.user.id,
                            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                            email: session.user.email || '',
                            role: userRole,
                            permissions
                        });
                        setIsLoading(false);
                    });
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
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
