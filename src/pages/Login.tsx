import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTenant } from '../context/TenantContext'; // Added
import { Shield, User, Lock, ArrowRight, Briefcase, Eye, EyeOff, Globe } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import loginHero from '../assets/login_hero.png';

const Login = () => {
    const { login, user, isLoading } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const { tenant, plan, setTestPlan } = useTenant(); // Added
    const navigate = useNavigate();
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || tenant?.subdomain === 'default' || window.location.hostname.includes('vercel.app') || window.location.hostname === 'krishnaniti.in' || window.location.hostname === 'www.krishnaniti.in';
    const [activeTab, setActiveTab] = useState<'nagarsevak' | 'amdar' | 'khasdar' | 'minister' | null>(null);
    const [subRole, setSubRole] = useState<'nagarsevak' | 'staff'>('nagarsevak');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Dynamic Role Detection
    const detectedInfo = useMemo(() => {
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];
        const searchParams = new URLSearchParams(window.location.search);
        const queryMode = searchParams.get('mode') || searchParams.get('role');
        const roles = ['nagarsevak', 'amdar', 'khasdar', 'minister'];

        // 1. Check if query parameter specifies a role (Easiest for testing)
        if (queryMode && roles.includes(queryMode)) {
            return { enforcedRole: queryMode as any, allowedRoles: [queryMode] };
        }

        // Map specific subdomains like 'amadar' to role 'amdar'
        let mappedSubdomain = subdomain;
        if (mappedSubdomain === 'amadar') mappedSubdomain = 'amdar';

        // 2. Check if subdomain is a direct role
        if (roles.includes(mappedSubdomain)) {
            return { enforcedRole: mappedSubdomain as any, allowedRoles: [mappedSubdomain] };
        }

        // 3. Otherwise use tenant config
        const allowed = tenant?.config?.allowed_roles as string[] | undefined;
        if (allowed && allowed.length > 0) {
            return {
                enforcedRole: allowed.length === 1 ? allowed[0] as any : null,
                allowedRoles: allowed
            };
        }

        return { enforcedRole: null, allowedRoles: null };
    }, [tenant]);

    useEffect(() => {
        if (user && !isLoading) {
            navigate('/dashboard');
        }
    }, [user, isLoading, navigate]);

    // Apply enforced role on mount or when detectedInfo changes
    useEffect(() => {
        if (detectedInfo.enforcedRole) {
            setActiveTab(detectedInfo.enforcedRole);
        }
    }, [detectedInfo.enforcedRole]);

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
                let roleName = 'User';
                if (activeTab === 'nagarsevak') {
                    roleName = subRole === 'nagarsevak' ? 'Nagarsevak' : 'Staff';
                } else {
                    switch (activeTab) {
                        case 'amdar': roleName = 'Amdar'; break;
                        case 'khasdar': roleName = 'Khasdar'; break;
                        case 'minister': roleName = 'Minister'; break;
                        default: roleName = 'User';
                    }
                }
                toast.success(`Welcome back, ${roleName}!`);
                navigate('/dashboard');
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
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans py-8 md:py-4">
            <div className="w-full max-w-[1000px] min-h-[600px] h-auto md:h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Left Side - Visual / Brand */}
                <div className="hidden md:flex w-1/2 relative bg-white items-center justify-center overflow-hidden border-r border-slate-100">
                    <img
                        src={loginHero}
                        alt="Login Visual"
                        className="w-full h-full object-cover object-left"
                    />
                </div>



                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-white to-brand-50/30 relative overflow-y-auto">
                    <div className="absolute top-6 right-6">
                        <button
                            onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
                            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all flex items-center gap-2"
                            title={language === 'en' ? 'Switch to Marathi' : 'Switch to English'}
                        >
                            <Globe className="w-5 h-5" />
                            <span className="text-sm font-medium">{language === 'en' ? 'मराठी' : 'English'}</span>
                        </button>
                    </div>

                    <div className="max-w-sm mx-auto w-full mt-14">
                        <div className="mb-8 text-center">
                            <div className="flex justify-center mb-4">
                                <img src="/favicon.svg" alt="Krishnaniti Logo" className="h-16 w-16 object-contain" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">Krishnaniti</h2>
                            <p className="text-slate-500 mt-2">{t('login.subtitle')}</p>
                        </div>

                        {/* Developer Testing: Plan Selector */}
                        {isLocalDev && (
                            <div className="mb-8 p-3.5 bg-brand-50/50 rounded-2xl border border-brand-100/60 text-center shadow-sm">
                                <label className="block text-[10px] font-black text-brand-600 uppercase tracking-widest mb-2.5">
                                    🛠️ Demo Plan Version
                                </label>
                                <div className="bg-slate-100/80 p-1 rounded-xl flex gap-1.5">
                                    {(['basic', 'pro', 'advance'] as const).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setTestPlan(p)}
                                            className={clsx(
                                                "flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all duration-200",
                                                plan === p
                                                    ? "bg-white text-brand-700 shadow-sm border border-slate-200/40"
                                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!activeTab ? (
                            /* Step 1: Role Selection */
                            <div className="grid grid-cols-2 gap-3 mb-8 fade-in-up">
                                {(!detectedInfo.allowedRoles || detectedInfo.allowedRoles.includes('nagarsevak')) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.removeItem('force_amdar');
                                            setActiveTab('nagarsevak');
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-1"
                                    >
                                        <img src="/favicon.svg" alt="Nagarsevak" className="w-8 h-8 object-contain" />
                                        <span className="text-sm font-semibold">Nagarsevak</span>
                                    </button>
                                )}

                                {(!detectedInfo.allowedRoles || detectedInfo.allowedRoles.includes('amdar')) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.setItem('force_amdar', 'true');
                                            setActiveTab('amdar');
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-1"
                                    >
                                        <img src="/favicon.svg" alt="Amdar" className="w-8 h-8 object-contain" />
                                        <span className="text-sm font-semibold">Amdar</span>
                                    </button>
                                )}

                                {(!detectedInfo.allowedRoles || detectedInfo.allowedRoles.includes('khasdar')) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.removeItem('force_amdar');
                                            setActiveTab('khasdar');
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-1"
                                    >
                                        <img src="/favicon.svg" alt="Khasdar" className="w-8 h-8 object-contain" />
                                        <span className="text-sm font-semibold">Khasdar</span>
                                    </button>
                                )}

                                {(!detectedInfo.allowedRoles || detectedInfo.allowedRoles.includes('minister')) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.removeItem('force_amdar');
                                            setActiveTab('minister');
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-1"
                                    >
                                        <img src="/favicon.svg" alt="Amdar" className="w-8 h-8 object-contain" />
                                        <span className="text-sm font-semibold">Minister</span>
                                    </button>
                                )}
                            </div>
                        ) : (

                            /* Step 2: Login Form */
                            <div className="fade-in-up">
                                {!detectedInfo.enforcedRole && (
                                    <button
                                        onClick={() => setActiveTab(null)}
                                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mb-6 group"
                                    >
                                        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                        <span>Back to Role Selection</span>
                                    </button>
                                )}

                                {/* Sub-role Toggle for Nagarsevak */}
                                {activeTab === 'nagarsevak' && (
                                    <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setSubRole('nagarsevak')}
                                            className={clsx(
                                                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                                subRole === 'nagarsevak'
                                                    ? "bg-white text-brand-700 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {t('login.nagarsevak')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSubRole('staff')}
                                            className={clsx(
                                                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                                subRole === 'staff'
                                                    ? "bg-white text-brand-700 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {t('login.staff')}
                                        </button>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 capitalize">
                                        {`${activeTab} Login`}
                                        {activeTab === 'nagarsevak' && <span className="text-slate-400 text-sm font-normal">({subRole})</span>}
                                    </h3>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">{t('login.email_label')}</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="ns-input pl-10 w-full bg-slate-50 border-slate-200 focus:bg-white transition-all py-2.5"
                                                placeholder={t('login.email_placeholder')}
                                                required
                                                autoComplete="username"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">{t('login.password_label')}</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="ns-input pl-10 pr-10 w-full bg-slate-50 border-slate-200 focus:bg-white transition-all py-2.5"
                                                placeholder={t('login.password_placeholder')}
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
                                                <span>{t('login.login_button')}</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

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
