import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, ArrowRight, Briefcase, Users, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'admin' | 'staff'>('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please enter both email and password.');
            return;
        }

        setLoading(true);

        try {
            const { success, error: authError } = await login(email, password);

            if (success) {
                toast.success(`Welcome back, ${activeTab === 'admin' ? 'Nagarsevak' : 'Staff Member'}!`);
                navigate('/');
            } else {
                toast.error(authError || 'Invalid credentials. Please check your email and password.');
            }
        } catch (err) {
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans">
            <div className="w-full max-w-[1000px] h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Left Side - Visual / Brand */}
                <div className="hidden md:flex flex-col w-1/2 bg-gradient-to-br from-brand-600 to-brand-800 relative p-12 text-white justify-between">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">Nagar Sevak</span>
                        </div>

                        <h1 className="text-4xl font-bold leading-tight mb-6 text-white">
                            Smart Management for Modern Governance.
                        </h1>
                        <p className="text-brand-100 text-lg leading-relaxed max-w-sm">
                            Streamline citizen requests, manage your staff, and track development works in one unified workspace.
                        </p>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 text-sm text-brand-200">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-700 bg-brand-500"></div>
                                ))}
                            </div>
                            <p>Trusted by Nagarsevaks across the state</p>
                        </div>
                    </div>

                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
                    <div className="max-w-sm mx-auto w-full">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                            <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
                        </div>

                        {/* Tabs */}
                        <div className="bg-slate-100 p-1 rounded-xl flex mb-8">
                            <button
                                type="button"
                                onClick={() => setActiveTab('admin')}
                                className={clsx(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    activeTab === 'admin'
                                        ? "bg-white text-brand-700 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                )}
                            >
                                <Shield className="w-4 h-4" />
                                <span>Nagarsevak</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('staff')}
                                className={clsx(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    activeTab === 'staff'
                                        ? "bg-white text-brand-700 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                )}
                            >
                                <Users className="w-4 h-4" />
                                <span>Staff Member</span>
                            </button>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="ns-input pl-10 w-full bg-slate-50 border-slate-200 focus:bg-white transition-all py-2.5"
                                        placeholder={activeTab === 'admin' ? "admin@nagarsevak.com" : "staff@nagarsevak.com"}
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="ns-input pl-10 pr-10 w-full bg-slate-50 border-slate-200 focus:bg-white transition-all py-2.5"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Sign in as {activeTab === 'admin' ? 'Admin' : 'Staff'}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400">
                                Protected by enterprise-grade security. <br />
                                Unauthorized access is strictly prohibited.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
