import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  BookOpen,
  Briefcase,
  Building2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Globe,
  History,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  Newspaper,
  Smartphone,
  TrendingUp,
  Users,
  Wand2,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/cn';
import { type Language } from '../../utils/translations';

type NavItemDef = {
  to: string;
  icon: LucideIcon;
  label: string;
  show?: boolean;
};

type NavGroupDef = {
  id: string;
  icon: LucideIcon;
  label: string;
  items: NavItemDef[];
};

function SidebarNavItem({
  to,
  icon: Icon,
  label,
  onNavigate,
  end,
  isCollapsed,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  onNavigate?: () => void;
  end?: boolean;
  isCollapsed?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={isCollapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all relative',
          isActive
            ? 'bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-100'
            : 'text-slate-700 hover:bg-slate-100',
          isCollapsed && 'justify-center px-2'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-brand-700' : 'text-slate-400 group-hover:text-slate-600')} />
          {!isCollapsed && <span className="truncate transition-all duration-300">{label}</span>}

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

function SidebarNavGroup({
  label,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  isCollapsed,
}: {
  label: string;
  icon: LucideIcon;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  isCollapsed?: boolean;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        title={isCollapsed ? label : undefined}
        className={cn(
          "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100 transition",
          isCollapsed && "justify-center px-2"
        )}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-slate-500 group-hover:text-slate-700 shrink-0" />
          {!isCollapsed && <span>{label}</span>}
        </span>
        {!isCollapsed && (
          isOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )
        )}
      </button>

      {/* If collapsed, we always show children but they will be just icons (handled by NavItem) 
          OR we can hide them if the group is closed. 
          Let's keep the open/close behavior even when collapsed, but maybe force open?
          Actually, keeping standard behavior is fine, the user can click the icon to toggle expansion of icons. */}
      {isOpen ? (
        <div className={cn("space-y-1", !isCollapsed && "ml-2 border-l border-slate-200 pl-3")}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop toggle

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';
  const isAdmin = user?.role === 'admin';

  const navGroups: NavGroupDef[] = useMemo(
    () => [
      {
        id: 'office',
        icon: Building2,
        label: t('common.office_management'),
        items: [
          { to: '/voters', icon: Users, label: t('nav.voter_search'), show: isAdminOrStaff },
          { to: '/sadasya', icon: Users, label: t('nav.sadasya'), show: isAdminOrStaff },
          { to: '/staff', icon: Users, label: t('nav.my_team'), show: isAdminOrStaff },
          { to: '/visitors', icon: Users, label: t('nav.visitor_log'), show: true },
          { to: '/diary', icon: BookOpen, label: t('nav.gb_register'), show: isAdminOrStaff },
        ],
      },
      {
        id: 'works',
        icon: Briefcase,
        label: t('common.public_works'),
        items: [
          { to: '/complaints', icon: Newspaper, label: t('nav.complaints'), show: true },
          { to: '/schemes', icon: Newspaper, label: t('nav.govt_schemes'), show: true },
          { to: '/letters', icon: Newspaper, label: t('nav.letters'), show: true },
          { to: '/tasks', icon: CheckSquare, label: t('nav.task_management'), show: isAdminOrStaff },
          { to: '/history', icon: History, label: t('nav.work_history'), show: true },
        ],
      },
      {
        id: 'digital',
        icon: Megaphone,
        label: t('common.digital_media'),
        items: [
          { to: '/bot-dashboard', icon: Smartphone, label: t('nav.whatsapp_bot'), show: isAdmin },
          { to: '/social', icon: TrendingUp, label: t('nav.social_analytics'), show: true },
          { to: '/events', icon: Smartphone, label: t('nav.events_invites'), show: true },
          { to: '/gallery', icon: Newspaper, label: t('nav.gallery_media'), show: true },
          { to: '/content', icon: Wand2, label: t('nav.ai_content'), show: true },
          { to: '/surveys', icon: Newspaper, label: t('nav.sample_surveys'), show: true },
        ],
      },
      {
        id: 'finance',
        icon: BarChart2,
        label: t('common.finance_reports'),
        items: [
          { to: '/budget', icon: IndianRupee, label: t('nav.ward_budget'), show: true },
          { to: '/results', icon: BarChart2, label: t('nav.result_analysis'), show: true },
        ],
      },
    ],
    [isAdmin, isAdminOrStaff, t],
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    office: true,
    works: true,
    digital: false,
    finance: false,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onNavigate = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80',
            'transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            isCollapsed ? 'md:w-20' : 'w-72 md:w-72'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className={cn("flex items-center border-b border-slate-200/70 p-4", isCollapsed ? "justify-center" : "justify-between px-5")}>
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-3 text-left overflow-hidden"
                >
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm font-black">
                    N
                  </div>
                  <div>
                    <div className="font-display text-base font-bold leading-tight text-slate-900 whitespace-nowrap">Nagar Sevak</div>
                    <div className="text-xs text-slate-500 leading-tight whitespace-nowrap">Operations & Staff</div>
                  </div>
                </button>
              )}
              {isCollapsed && (
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm font-black cursor-pointer" onClick={() => navigate('/')}>
                  N
                </div>
              )}

              {/* Mobile Close */}
              <button type="button" className="md:hidden ns-btn-ghost px-2 py-2" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </button>

              {/* Desktop Toggle */}
              <button
                type="button"
                className="hidden md:flex ns-btn-ghost px-2 py-2 text-slate-400 hover:text-slate-600"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>
            </div>

            {/* Navigation */}
            <nav className={cn("flex-1 overflow-y-auto space-y-3", isCollapsed ? "px-2 py-4" : "px-3 py-4")}>
              {isAdminOrStaff ? (
                <SidebarNavItem
                  to="/"
                  end
                  icon={LayoutDashboard}
                  label={t('common.dashboard')}
                  onNavigate={onNavigate}
                  isCollapsed={isCollapsed}
                />
              ) : null}

              {navGroups.map((group) => {
                const visibleItems = group.items.filter((i) => i.show !== false);
                if (visibleItems.length === 0) return null;
                return (
                  <SidebarNavGroup
                    key={group.id}
                    label={group.label}
                    icon={group.icon}
                    isOpen={!!openGroups[group.id]}
                    onToggle={() => setOpenGroups((p) => ({ ...p, [group.id]: !p[group.id] }))}
                    isCollapsed={isCollapsed}
                  >
                    {visibleItems.map((item) => (
                      <SidebarNavItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        label={item.label}
                        onNavigate={onNavigate}
                        isCollapsed={isCollapsed}
                      />
                    ))}
                  </SidebarNavGroup>
                );
              })}
            </nav>

            {/* Footer / User Profile */}
            <div className={cn(
              "border-t border-slate-200/70 p-4 space-y-3 bg-slate-50/40",
              isCollapsed && "flex flex-col items-center p-2"
            )}>
              {!isCollapsed ? (
                <>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Globe className="h-4 w-4 text-slate-400" />
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="ns-input"
                  >
                    <option value="en">English</option>
                    <option value="mr">मराठी</option>
                  </select>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center font-bold">
                      {user?.name?.charAt(0) ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 truncate">{user?.name ?? 'User'}</div>
                      <div className="text-xs text-slate-500 capitalize truncate">{user?.role ?? ''}</div>
                    </div>
                  </div>

                  <button type="button" onClick={handleLogout} className="ns-btn-ghost w-full justify-center">
                    <LogOut className="h-4 w-4" />
                    <span>{t('common.logout')}</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-4 items-center w-full">
                  <button title="Change Language" className="p-2 rounded-lg hover:bg-slate-200 text-slate-500">
                    <Globe className="h-5 w-5" />
                    {/* Note: Simplified language switcher for collapsed state - maybe cycle or just hide? 
                            For now, kept simple icon. Realistically would need a dropdown or just rely on expanding. */}
                  </button>
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center font-bold" title={user?.name}>
                    {user?.name?.charAt(0) ?? 'U'}
                  </div>
                  <button type="button" onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title={t('common.logout')}>
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col transition-all duration-300">
          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8">


              <div className="md:hidden flex items-center mb-6">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <span className="ml-3 font-bold text-lg text-slate-800">Nagar Sevak</span>
              </div>

              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
