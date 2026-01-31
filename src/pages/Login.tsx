import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Users } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        const success = await login(email);
        if (success) {
            navigate('/');
        } else {
            setError('Invalid email. Try admin@ns.com');
        }
    };

    const quickLogin = (email: string) => {
        setEmail(email);
        login(email).then((success) => {
            if (success) navigate('/');
        });
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Brand / Info side */}
            <div className="hidden lg:flex relative overflow-hidden bg-brand-700">
                <div className="p-12 flex flex-col justify-between w-full">
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
                            Manage citizen requests, office work, media, and reporting with a clean dashboard and fast navigation.
                        </p>
                        <div className="mt-8 grid grid-cols-3 gap-3">
                            {[
                                { icon: Shield, label: 'Admin', hint: 'Full access', email: 'admin@ns.com' },
                                { icon: Users, label: 'Staff', hint: 'Team workflows', email: 'staff@ns.com' },
                                { icon: User, label: 'Citizen', hint: 'Limited access', email: 'voter@ns.com' },
                            ].map((role) => (
                                <button
                                    key={role.label}
                                    type="button"
                                    onClick={() => quickLogin(role.email)}
                                    className="text-left p-4 rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 transition"
                                >
                                    <role.icon className="h-5 w-5 text-white/80" />
                                    <div className="mt-3 text-white font-semibold">{role.label}</div>
                                    <div className="text-xs text-white/60">{role.hint}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-xs text-white/50">
                        Demo accounts are enabled for preview.
                    </div>
                </div>
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
                                <div className="text-sm text-slate-500">Use your email to continue</div>
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
                                    placeholder="admin@ns.com"
                                    autoComplete="email"
                                />
                            </div>

                            {error ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </div>
                            ) : null}

                            <button type="submit" className="ns-btn-primary w-full">
                                Login
                            </button>
                        </form>

                        <div className="mt-6 lg:hidden">
                            <div className="text-xs font-semibold text-slate-500 mb-3">DEMO LOGIN</div>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => quickLogin('admin@ns.com')}
                                    className="ns-btn-ghost border border-slate-200"
                                >
                                    <Shield className="h-4 w-4 text-purple-600" />
                                    <span className="text-xs">Admin</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => quickLogin('staff@ns.com')}
                                    className="ns-btn-ghost border border-slate-200"
                                >
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs">Staff</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => quickLogin('voter@ns.com')}
                                    className="ns-btn-ghost border border-slate-200"
                                >
                                    <User className="h-4 w-4 text-green-600" />
                                    <span className="text-xs">Citizen</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        Tip: try <span className="font-mono text-slate-700">admin@ns.com</span> for full access.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
