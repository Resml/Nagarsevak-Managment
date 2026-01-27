import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    Menu, X, LayoutDashboard, Users, FileText, ChevronDown, ChevronRight,
    CheckSquare, History, LogOut, Smartphone, TrendingUp, BookOpen, Newspaper, IndianRupee, BarChart2, Wand2, Building2, Megaphone, Briefcase, Globe
} from 'lucide-react';
import clsx from 'clsx';
import { type Language } from '../../utils/translations';

const AppLayout = () => {
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // State for collapsible groups
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        office: true,
        works: true,
        digital: false,
        finance: false
    });

    const toggleGroup = (group: string) => {
        setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
        <NavLink
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => clsx(
                "flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                isActive
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
        >
            <Icon className={clsx("w-4 h-4", ({ isActive }: any) => isActive ? "text-brand-600" : "text-gray-400")} />
            <span>{label}</span>
        </NavLink>
    );

    const NavGroup = ({ id, label, icon: Icon, children }: any) => {
        const isOpen = openGroups[id];
        // Check if any child is active to auto-open if needed (optional, keeping manual for now)
        return (
            <div className="mb-1">
                <button
                    onClick={() => toggleGroup(id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                    <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-800" />
                        <span className="font-semibold text-sm">{label}</span>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>
                {isOpen && (
                    <div className="ml-4 pl-3 border-l-2 border-gray-100 space-y-1 mt-1">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed md:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 z-30 transition-transform transform md:translate-x-0 flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                            N
                        </div>
                        <span className="font-display font-bold text-xl text-gray-800">Nagar Sevak</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
                    {isAdminOrStaff && (
                        <NavItem to="/" icon={LayoutDashboard} label={t('common.dashboard')} />
                    )}

                    <div className="h-2"></div>

                    {/* Group: Office Management */}
                    <NavGroup id="office" label={t('common.office_management')} icon={Building2}>
                        {isAdminOrStaff && <NavItem to="/voters" icon={Users} label={t('nav.voter_search')} />}
                        {isAdminOrStaff && <NavItem to="/sadasya" icon={Users} label={t('nav.sadasya')} />}
                        {isAdminOrStaff && <NavItem to="/staff" icon={Users} label={t('nav.my_team')} />}
                        <NavItem to="/visitors" icon={Users} label={t('nav.visitor_log')} />
                        {isAdminOrStaff && <NavItem to="/diary" icon={BookOpen} label={t('nav.gb_register')} />}
                    </NavGroup>

                    {/* Group: Public Works */}
                    <NavGroup id="works" label={t('common.public_works')} icon={Briefcase}>
                        <NavItem to="/complaints" icon={FileText} label={t('nav.complaints')} />
                        <NavItem to="/schemes" icon={FileText} label={t('nav.govt_schemes')} />
                        <NavItem to="/letters" icon={FileText} label={t('nav.letters')} />
                        {isAdminOrStaff && <NavItem to="/tasks" icon={CheckSquare} label={t('nav.task_management')} />}
                        <NavItem to="/history" icon={History} label={t('nav.work_history')} />
                    </NavGroup>

                    {/* Group: Digital & Media */}
                    <NavGroup id="digital" label={t('common.digital_media')} icon={Megaphone}>
                        {user?.role === 'admin' && <NavItem to="/bot-dashboard" icon={Smartphone} label={t('nav.whatsapp_bot')} />}
                        <NavItem to="/social" icon={TrendingUp} label={t('nav.social_analytics')} />
                        <NavItem to="/events" icon={Smartphone} label={t('nav.events_invites')} />
                        <NavItem to="/gallery" icon={Newspaper} label={t('nav.gallery_media')} />
                        <NavItem to="/content" icon={Wand2} label={t('nav.ai_content')} />
                        <NavItem to="/surveys" icon={FileText} label={t('nav.sample_surveys')} />
                    </NavGroup>

                    {/* Group: Finance & Reports */}
                    <NavGroup id="finance" label={t('common.finance_reports')} icon={BarChart2}>
                        <NavItem to="/budget" icon={IndianRupee} label={t('nav.ward_budget')} />
                        <NavItem to="/results" icon={BarChart2} label={t('nav.result_analysis')} />
                    </NavGroup>

                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        {/* Language Selector in Footer */}
                        <div className="relative group w-full">
                            <button className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-brand-300 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-500" />
                                    <span>{language === 'en' ? 'English' : language === 'mr' ? 'मराठी' : 'हिंदी'}</span>
                                </div>
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            </button>
                            <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-50">
                                <button onClick={() => setLanguage('en')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg ${language === 'en' ? 'font-bold text-brand-600' : 'text-gray-700'}`}>English</button>
                                <button onClick={() => setLanguage('mr')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${language === 'mr' ? 'font-bold text-brand-600' : 'text-gray-700'}`}>मराठी</button>
                                <button onClick={() => setLanguage('hi')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg ${language === 'hi' ? 'font-bold text-brand-600' : 'text-gray-700'}`}>हिंदी</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center mb-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold mr-3 border border-brand-200">
                            {user?.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-brand-600 font-medium capitalize flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {user?.role}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center space-x-2 text-gray-600 text-sm hover:text-red-600 w-full py-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{t('common.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-1 -ml-1 rounded-md active:bg-gray-100">
                            <Menu className="w-6 h-6 text-gray-600" />
                        </button>
                        <span className="font-semibold text-gray-900 text-lg">Nagar Sevak</span>
                    </div>

                    {/* Language Selector Mobile */}
                    <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="bg-gray-50 border-none text-sm font-medium rounded-lg focus:ring-0 p-1 pr-2"
                        >
                            <option value="en">Eng</option>
                            <option value="mr">मराठी</option>
                            <option value="hi">हिंदी</option>
                        </select>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
