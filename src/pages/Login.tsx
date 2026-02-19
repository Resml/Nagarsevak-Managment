import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Shield, User, Lock, ArrowRight, Briefcase, Users, Eye, EyeOff, Globe } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import loginHero from '../assets/login_hero.jpg';

const Login = () => {
    const { login, user, isLoading } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'nagarsevak' | 'amdar' | 'khasdar' | 'minister' | null>(null);
    const [subRole, setSubRole] = useState<'nagarsevak' | 'staff'>('nagarsevak');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (user && !isLoading) {
            navigate('/dashboard');
        }
    }, [user, isLoading, navigate]);

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
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans">
            <div className="w-full max-w-[1000px] h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Left Side - Visual / Brand */}
                <div className="hidden md:flex w-1/2 relative bg-[#1a237e] items-center justify-center overflow-hidden">
                    <img
                        src={loginHero}
                        alt="Login Visual"
                        className="w-full h-full object-contain object-center"
                    />
                </div>



                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-white to-brand-50/30 relative">
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

                    <div className="max-w-sm mx-auto w-full">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-slate-900">{t('login.welcome')}</h2>
                            <p className="text-slate-500 mt-2">{t('login.subtitle')}</p>
                        </div>

                        {!activeTab ? (
                            /* Step 1: Role Selection */
                            <div className="grid grid-cols-2 gap-3 mb-8 fade-in-up">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('nagarsevak')}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-1"
                                >
                                    <Shield className="w-8 h-8 text-slate-400 group-hover:text-brand-600" />
                                    <span className="text-sm font-semibold">Nagarsevak</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('amdar')}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-1"
                                >
                                    <Briefcase className="w-8 h-8 text-slate-400 group-hover:text-brand-600" />
                                    <span className="text-sm font-semibold">Amdar</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('khasdar')}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-1"
                                >
                                    <Globe className="w-8 h-8 text-slate-400 group-hover:text-brand-600" />
                                    <span className="text-sm font-semibold">Khasdar</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('minister')}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-1"
                                >
                                    <Briefcase className="w-8 h-8 text-slate-400 group-hover:text-brand-600" />
                                    <span className="text-sm font-semibold">Minister</span>
                                </button>
                            </div>
                        ) : (

                            /* Step 2: Login Form */
                            <div className="fade-in-up">
                                <button
                                    onClick={() => setActiveTab(null)}
                                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mb-6 group"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                    <span>Back to Role Selection</span>
                                </button>

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
                                        {activeTab} Login
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
