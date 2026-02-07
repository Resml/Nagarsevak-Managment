import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);
        setError('');

        const { success, error: authError } = await login(email, password);

        if (success) {
            toast.success('Welcome back!');
            navigate('/');
        } else {
            setError(authError || 'Invalid credentials.');
            toast.error(authError || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Brand / Info side */}
            <div className="hidden lg:flex relative overflow-hidden bg-brand-700">
                <div className="p-12 flex flex-col justify-between w-full z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center font-black">
                            N
                        </div>
                        <div>
                            <div className="text-white font-display font-bold text-xl leading-tight">Nagar Sevak</div>
                            <div className="text-white/70 text-sm">Staff & office operations</div>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <h1 className="text-white text-3xl font-display font-extrabold leading-tight">
                            One workspace for Nagarasevaks and staff.
                        </h1>
                        <p className="mt-3 text-white/70 leading-relaxed">
                            Secure, multi-tenant platform for managing citizen requests, office work, and reporting.
                        </p>
                        <div className="mt-8 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                            <Shield className="h-6 w-6 text-brand-200 mb-2" />
                            <h3 className="text-white font-semibold">Strict Access Control</h3>
                            <p className="text-brand-100 text-sm mt-1">
                                This portal is restricted to authorized personnel only. Please contact your administrator for credentials.
                            </p>
                        </div>
                    </div>

                    <div className="text-xs text-white/50">
                        &copy; {new Date().getFullYear()} Nagarsevak Management System
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brand-600 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-brand-800 rounded-full blur-3xl opacity-50"></div>
            </div>

            {/* Login side */}
            <div className="flex items-center justify-center p-6 md:p-10 bg-slate-50">
                <div className="w-full max-w-md">
                    <div className="ns-card p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-11 w-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black shadow-sm">
                                N
                            </div>
                            <div>
                                <div className="text-lg font-display font-bold text-slate-900">Sign in</div>
                                <div className="text-sm text-slate-500">Enter your credentials to continue</div>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="ns-input mt-1"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="ns-input mt-1"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {error ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="ns-btn-primary w-full flex justify-center items-center"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-xs text-slate-400">
                            Authorized access only. Public registration is disabled.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
