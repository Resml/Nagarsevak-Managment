import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileText,
  Flag,
  Globe,
  History,
  Image,
  IndianRupee,
  Info,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Map as MapIcon,
  Megaphone,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Search,
  Smartphone,
  TrendingUp,
  UserPlus,
  Users,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { cn } from '../../utils/cn';
import { type Language } from '../../utils/translations';
import { supabase } from '../../services/supabaseClient';

type NavItemDef = {
  kind: 'item';
  to: string;
  icon: LucideIcon;
  label: string;
  show?: boolean;
  end?: boolean;
  permission?: string;
};

type NavGroupDef = {
  kind: 'group';
  id: string;
  icon: LucideIcon;
  label: string;
  items: Omit<NavItemDef, 'kind'>[];
  show?: boolean;
  permission?: string;
};

type NavEntry = NavItemDef | NavGroupDef;

function SidebarNavItem({
  to,
  icon: Icon,
  label,
  onNavigate,
  end,
  isCollapsed,
  itemRef,
  className,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  onNavigate?: () => void;
  end?: boolean;
  isCollapsed?: boolean;
  itemRef?: (el: HTMLAnchorElement | null) => void;
  className?: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      ref={itemRef}
      title={isCollapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 relative',
          isActive
            ? 'bg-brand-600 text-white shadow-md shadow-brand-200'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
          isCollapsed && 'justify-center px-2',
          className
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
          {!isCollapsed && <span className="truncate">{label}</span>}

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
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
  className,
}: {
  label: string;
  icon: LucideIcon;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  isCollapsed?: boolean;
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        title={isCollapsed ? label : undefined}
        className={cn(
          "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200",
          isCollapsed && "justify-center px-2",
          className
        )}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
          {!isCollapsed && <span>{label}</span>}
        </span>
        {!isCollapsed && (
          isOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200" />
          )
        )}
      </button>

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
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop toggle
  const [branding, setBranding] = useState<{
    name_english: string;
    name_marathi: string;
    ward_name: string;
    party_name: string;
    profile_image: string;
  } | null>(null);

  useEffect(() => {
    if (tenant && tenant.config) {
      setBranding({
        name_english: tenant.config.nagarsevak_name_english,
        name_marathi: tenant.config.nagarsevak_name_marathi,
        ward_name: tenant.config.ward_name,
        party_name: tenant.config.party_name,
        profile_image: tenant.config.profile_image_url
      });
    }
  }, [tenant]);

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';
  const isAdmin = user?.role === 'admin';

  const navItems: NavEntry[] = useMemo(
    () => [
      // 1) Daily work
      {
        kind: 'group',
        id: 'daily_work',
        icon: Briefcase,
        label: t('nav.daily_work'),
        show: true,
        // permission: 'daily_work', // Removed to allow granular access
        items: [
          { to: '/complaints', icon: Newspaper, label: t('nav.complaints'), show: true, permission: 'complaints' },
          { to: '/letters', icon: FileText, label: t('nav.letters'), show: true, permission: 'letters' },
          { to: '/tasks', icon: CheckSquare, label: t('nav.task_management'), show: isAdminOrStaff, permission: 'tasks' },
          { to: '/visitors', icon: Users, label: t('nav.visitor_log'), show: true, permission: 'visitors' },
          { to: '/schemes', icon: Newspaper, label: t('nav.govt_schemes'), show: true, permission: 'schemes' },
        ],
      },
      // 2) Ward information
      {
        kind: 'group',
        id: 'ward_info',
        icon: Info,
        label: t('nav.ward_info'),
        show: true,
        // permission: 'ward_info', 
        items: [
          { to: '/ward/problems', icon: AlertTriangle, label: t('nav.ward_problem'), show: true, permission: 'ward_problems' },
          { to: '/ward/map', icon: MapIcon, label: t('nav.ward_map'), show: true, permission: 'ward_info' },
          { to: '/history', icon: History, label: t('nav.work_history'), show: true, permission: 'work_history' },
          { to: '/ward/improvements', icon: TrendingUp, label: t('nav.ward_improvement'), show: true, permission: 'improvements' },
          { to: '/ward/provision', icon: IndianRupee, label: t('nav.ward_provision'), show: true, permission: 'provision' },
        ],
      },
      // 3) Municipal work
      {
        kind: 'group',
        id: 'municipal',
        icon: Building2,
        label: t('nav.municipal_work'),
        show: true,
        // permission: 'municipal',
        items: [
          { to: '/diary', icon: BookOpen, label: t('nav.gb_register'), show: isAdminOrStaff, permission: 'gb_register' },
          { to: '/budget', icon: IndianRupee, label: t('nav.ward_budget'), show: true, permission: 'budget' },
        ],
      },
      // 4) Government office
      {
        kind: 'item',
        to: '/government-office',
        icon: Building2,
        label: t('nav.gov_office'),
        show: true,
        permission: 'gov_office',
      },
      // 5) Media of dissemination and promotion
      {
        kind: 'group',
        id: 'media',
        icon: Megaphone,
        label: t('nav.media_promotion'),
        show: true,
        // permission: 'media',
        items: [
          { to: '/social', icon: TrendingUp, label: t('nav.social_analytics'), show: true, permission: 'social' },
          { to: '/media/newspaper', icon: Newspaper, label: t('nav.newspaper_clipping'), show: true, permission: 'newspaper' },
          { to: '/content', icon: Wand2, label: t('nav.ai_content'), show: true, permission: 'ai_content' },
        ],
      },
      // 6) Programs and activities
      {
        kind: 'group',
        id: 'programs',
        icon: Activity,
        label: t('nav.programs_activities'),
        show: true,
        // permission: 'programs',
        items: [
          { to: '/events', icon: Calendar, label: t('nav.events_invites'), show: true, permission: 'events' },
          { to: '/gallery', icon: Image, label: t('nav.gallery_media'), show: true, permission: 'gallery' },
        ],
      },
      // 7) Political
      {
        kind: 'group',
        id: 'political',
        icon: Flag,
        label: t('nav.political'),
        show: true,
        // permission: 'political',
        items: [
          { to: '/results', icon: BarChart2, label: t('nav.result_analysis'), show: true, permission: 'results' },
          { to: '/sadasya', icon: Users, label: t('nav.sadasya'), show: isAdminOrStaff, permission: 'sadasya' },
          { to: '/surveys', icon: CheckSquare, label: t('nav.sample_surveys'), show: true, permission: 'surveys' },
          { to: '/voters', icon: Search, label: t('nav.voter_search'), show: isAdminOrStaff, permission: 'voters' },
          { to: '/staff', icon: Users, label: t('nav.my_team'), show: true, permission: 'staff' },
          { to: '/political/public-communication', icon: Megaphone, label: t('nav.public_communication'), show: true, permission: 'public_comm' },
          { to: '/political/voter-forms', icon: FileText, label: t('nav.voter_forms'), show: true, permission: 'voters' },
        ],
      },
      // 8) Analysis Strategy
      {
        kind: 'item',
        to: '/analysis-strategy',
        icon: LineChart,
        label: t('nav.analysis_strategy'),
        show: true,
        permission: 'analysis',
      },
    ],
    [isAdmin, isAdminOrStaff, t],
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    daily_work: true,
    ward_info: true,
    municipal: true,
    media: true,
    programs: true,
    political: true,
  });

  const navContainerRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);
  const isInitialMount = useRef(true);

  // Auto-scroll to active item and expand its group
  useEffect(() => {
    // Auto-expand group containing active route first
    const currentPath = location.pathname;
    navItems.forEach((entry) => {
      if (entry.kind === 'group') {
        const hasActiveItem = entry.items.some((item) => {
          if (item.to === currentPath) return true;
          if (!item.end && currentPath.startsWith(item.to)) return true;
          return false;
        });
        if (hasActiveItem && !openGroups[entry.id]) {
          setOpenGroups((prev) => ({ ...prev, [entry.id]: true }));
        }
      }
    });

    // Scroll to active item after a brief delay to ensure DOM is ready
    const scrollTimeout = setTimeout(() => {
      if (activeItemRef.current && navContainerRef.current) {
        activeItemRef.current.scrollIntoView({
          behavior: isInitialMount.current ? 'auto' : 'smooth', // Instant on first load, smooth on navigation
          block: 'center', // Center the item for better visibility
        });
        isInitialMount.current = false;
      }
    }, 100); // Small delay to ensure group expansion completes

    return () => clearTimeout(scrollTimeout);
  }, [location.pathname, navItems, openGroups]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Automated Translation Logic
  useEffect(() => {
    // Logic:
    // 1. If we are in /complaints (List or Detail) OR /letters (Dashboard) AND Language is Marathi -> FORCE Google Translate ON
    // 2. If we are in /complaints/new (Form) OR /letters/new (Form) -> FORCE Google Translate OFF
    // 3. If we are anywhere else -> FORCE Google Translate OFF

    const isComplaintSection = location.pathname.startsWith('/complaints');
    const isComplaintForm = location.pathname === '/complaints/new';

    const isLettersSection = location.pathname.startsWith('/letters');
    const isLetterForm = location.pathname === '/letters/new';

    // We want translation active ONLY if:
    // - We are in the complaints OR letters section
    // - We are NOT on a form page (new complaint / new letter)
    // - The App Language is Marathi
    const shouldTranslate = ((isComplaintSection && !isComplaintForm) || (isLettersSection && !isLetterForm)) && language === 'mr';

    const cookies = document.cookie.split(';');
    const transCookie = cookies.find(c => c.trim().startsWith('googtrans='));
    // Check for either /en/mr or /auto/mr or just /mr
    const hasCookie = transCookie && (transCookie.includes('/en/mr') || transCookie.includes('/auto/mr'));

    if (shouldTranslate && !hasCookie) {
      // Turn ON - Robust Cookie Setting
      // Use /auto/mr to be safer with language detection
      document.cookie = "googtrans=/auto/mr; path=/";
      document.cookie = "googtrans=/auto/mr; path=/; domain=" + window.location.hostname;

      // Small delay to ensure cookie is written before reload
      setTimeout(() => {
        window.location.reload();
      }, 50);

    } else if (!shouldTranslate && hasCookie) {
      // Turn OFF - Robust Cookie Clearing
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;

      setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  }, [location.pathname, language]);

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
            'fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 notranslate',
            'transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            isCollapsed ? 'md:w-20' : 'w-72 md:w-72'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className={cn("flex items-center p-4 bg-white", isCollapsed ? "justify-center" : "justify-between px-5")}>
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-3 text-left overflow-hidden group"
                >
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-sm font-black overflow-hidden relative border border-brand-100 group-hover:border-brand-300 transition-colors">
                    {branding?.profile_image ? (
                      <img src={branding.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      "N"
                    )}
                  </div>
                  <div>
                    <div className="font-display text-base font-bold leading-tight text-slate-900 whitespace-nowrap group-hover:text-brand-700 transition-colors">
                      {language === 'mr' ? (branding?.name_marathi || 'Nagar Sevak') : (branding?.name_english || 'Nagar Sevak')}
                    </div>
                    <div className="text-xs text-slate-500 leading-tight whitespace-nowrap font-medium">
                      {branding?.party_name ? `${branding.party_name} | ` : ''}{branding?.ward_name || 'Operations & Staff'}
                    </div>
                  </div>
                </button>
              )}
              {isCollapsed && (
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-sm font-black cursor-pointer overflow-hidden relative border border-brand-100 hover:border-brand-300 transition-colors" onClick={() => navigate('/')}>
                  {branding?.profile_image ? (
                    <img src={branding.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    "N"
                  )}
                </div>
              )}

              {/* Mobile Close */}
              <button type="button" className="md:hidden ns-btn-ghost px-2 py-2 text-slate-500 hover:bg-slate-100" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </button>

              {/* Desktop Toggle */}
              <button
                type="button"
                className="hidden md:flex ns-btn-ghost px-2 py-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>
            </div>

            {/* Navigation */}
            <nav ref={navContainerRef} className={cn("flex-1 overflow-y-auto space-y-3", isCollapsed ? "px-2 py-4" : "px-3 py-4")}>
              {isAdminOrStaff ? (
                <SidebarNavItem
                  to="/"
                  end
                  icon={LayoutDashboard}
                  label={t('common.dashboard')}
                  onNavigate={onNavigate}
                  isCollapsed={isCollapsed}
                  itemRef={(el) => {
                    if (location.pathname === '/') activeItemRef.current = el;
                  }}
                />
              ) : null}

              {navItems.map((entry) => {
                // If it's a group
                if (entry.kind === 'group') {
                  const checkPermission = (perm?: string) => {
                    if (!perm) return true;
                    if (!isAdmin && user?.role === 'staff' && user.permissions) {
                      return user.permissions.includes(perm);
                    }
                    return true; // Admin or no restrictions
                  };

                  if (entry.permission && !checkPermission(entry.permission)) return null;

                  const visibleItems = entry.items.filter((i) => {
                    if (i.show === false) return false;
                    return checkPermission(i.permission);
                  });

                  if (visibleItems.length === 0) return null;

                  // Groups that should have the highlighted background
                  const highlightedGroups = ['daily_work', 'ward_info', 'municipal', 'media', 'programs', 'political'];
                  const isHighlighted = highlightedGroups.includes(entry.id);

                  return (
                    <SidebarNavGroup
                      key={entry.id}
                      label={entry.label}
                      icon={entry.icon}
                      isOpen={!!openGroups[entry.id]}
                      onToggle={() => setOpenGroups((p) => ({ ...p, [entry.id]: !p[entry.id] }))}
                      isCollapsed={isCollapsed}
                      className={''}
                    >
                      {visibleItems.map((item) => (
                        <SidebarNavItem
                          key={item.to}
                          to={item.to}
                          icon={item.icon}
                          label={item.label}
                          onNavigate={onNavigate}
                          isCollapsed={isCollapsed}
                          itemRef={(el) => {
                            const isActive = item.end
                              ? location.pathname === item.to
                              : location.pathname.startsWith(item.to);
                            if (isActive) activeItemRef.current = el;
                          }}
                        />
                      ))}
                    </SidebarNavGroup>
                  );
                }
                // If it's a single item
                else {
                  if (entry.show === false) return null;

                  const checkPermission = (perm?: string) => {
                    if (!perm) return true;
                    if (!isAdmin && user?.role === 'staff' && user.permissions) {
                      return user.permissions.includes(perm);
                    }
                    return true;
                  };

                  if (entry.permission && !checkPermission(entry.permission)) return null;

                  // Items that should have the highlighted background
                  const isHighlighted = entry.to === '/analysis-strategy';

                  return (
                    <SidebarNavItem
                      key={entry.to}
                      to={entry.to}
                      icon={entry.icon}
                      label={entry.label}
                      onNavigate={onNavigate}
                      end={entry.end}
                      isCollapsed={isCollapsed}
                      className={''}
                      itemRef={(el) => {
                        const isActive = entry.end
                          ? location.pathname === entry.to
                          : location.pathname.startsWith(entry.to);
                        if (isActive) activeItemRef.current = el;
                      }}
                    />
                  );
                }
              })}
            </nav>

            {/* Footer / User Profile */}
            <div className={cn(
              "border-t border-slate-100 p-4 space-y-3",
              isCollapsed && "flex flex-col items-center p-2"
            )}>
              {!isCollapsed ? (
                <>
                  <div className="flex items-center justify-between bg-white p-1 rounded-xl border border-slate-200 shadow-sm mb-4">
                    <button
                      onClick={() => setLanguage('en')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                        language === 'en'
                          ? "bg-brand-600 text-white shadow-md"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      )}
                    >
                      <span>English</span>
                    </button>
                    <button
                      onClick={() => setLanguage('mr')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                        language === 'mr'
                          ? "bg-brand-600 text-white shadow-md"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      )}
                    >
                      <span>मराठी</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center font-bold">
                      {user?.name?.charAt(0) ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 truncate">{user?.name ?? 'User'}</div>
                      {(user?.role === 'admin' || user?.permissions?.includes('profile_settings')) && (
                        <button onClick={() => navigate('/settings/profile')} className="text-xs text-brand-600 hover:text-brand-700 font-medium truncate flex items-center gap-1">
                          {t('sadasya.profile_settings') || 'Profile Settings'}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('common.logout')}
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4 items-center w-full">
                  <button title="Change Language" className="p-2 rounded-lg hover:bg-slate-200 text-slate-500">
                    <Globe className="h-5 w-5" />
                  </button>

                  {(user?.role === 'admin' || user?.permissions?.includes('profile_settings')) && (
                    <button type="button" onClick={() => navigate('/settings/profile')} className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg" title={t('sadasya.profile_settings') || 'Settings'}>
                      <UserPlus className="h-5 w-5" />
                    </button>
                  )}
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


              <div className="md:hidden flex items-center mb-6 bg-gradient-to-r from-brand-600 to-brand-700 p-4 rounded-2xl shadow-md text-white">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 -ml-2 text-brand-100 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="ml-3 flex flex-col">
                  <span className="font-bold text-lg leading-none drop-shadow-sm">
                    {language === 'mr' ? (branding?.name_marathi || 'Nagar Sevak') : (branding?.name_english || 'Nagar Sevak')}
                  </span>
                  <span className="text-xs text-brand-100 opacity-90 font-medium">
                    {branding?.party_name ? `${branding.party_name} | ` : ''}{branding?.ward_name || 'Operations & Staff'}
                  </span>
                </div>
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
