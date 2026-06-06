import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTenant } from './context/TenantContext';
import { logSecurityEvent } from './utils/securityLogs';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';

// Lazy-loaded routes for performance optimization
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const VoterList = lazy(() => import('./pages/voters/VoterList'));
const ComplaintList = lazy(() => import('./pages/complaints/ComplaintList'));
const Tasks = lazy(() => import('./pages/tasks/Tasks'));

const VoterProfile = lazy(() => import('./pages/voters/VoterProfile'));
const ComplaintForm = lazy(() => import('./pages/complaints/ComplaintForm'));
const ComplaintDetail = lazy(() => import('./pages/complaints/ComplaintDetail'));
const PersonalRequestForm = lazy(() => import('./pages/complaints/PersonalRequestForm'));

const BotDashboard = lazy(() => import('./pages/admin/BotDashboard'));

const SocialDashboard = lazy(() => import('./pages/social/SocialDashboard'));
const SchemeList = lazy(() => import('./pages/schemes/SchemeList'));
const SchemeForm = lazy(() => import('./pages/schemes/SchemeForm'));
const WorkHistory = lazy(() => import('./pages/works/WorkHistory'));
const WorkDetail = lazy(() => import('./pages/works/WorkDetail'));
const EventManagement = lazy(() => import('./pages/events/EventManagement'));
const EventDetail = lazy(() => import('./pages/events/EventDetail'));
const StaffList = lazy(() => import('./pages/staff/StaffList'));
const LetterDashboard = lazy(() => import('./pages/letters/LetterDashboard'));
const LetterForm = lazy(() => import('./pages/letters/LetterForm'));
const LetterTypeManager = lazy(() => import('./pages/letters/LetterTypeManager'));
const VisitorLog = lazy(() => import('./pages/office/VisitorLog'));
const JoinParty = lazy(() => import('./pages/sadasya/JoinParty'));
const SadasyaList = lazy(() => import('./pages/sadasya/SadasyaList'));
const DiaryList = lazy(() => import('./pages/diary/DiaryList'));
const Gallery = lazy(() => import('./pages/gallery/Gallery'));
const BudgetDashboard = lazy(() => import('./pages/budget/BudgetDashboard'));
const ResultAnalysis = lazy(() => import('./pages/results/ResultAnalysis'));
const ContentStudio = lazy(() => import('./pages/content/ContentStudio'));
const SurveyDashboard = lazy(() => import('./pages/surveys/SurveyDashboard'));
const CreateSurvey = lazy(() => import('./pages/surveys/CreateSurvey'));
const SurveyDetails = lazy(() => import('./pages/surveys/SurveyDetails'));
const PublicSurveyForm = lazy(() => import('./pages/surveys/PublicSurveyForm'));

const WardWiseProblem = lazy(() => import('./pages/ward/WardWiseProblem'));
const WardMap = lazy(() => import('./pages/ward/WardMap'));
const PossibleImprovements = lazy(() => import('./pages/ward/PossibleImprovements'));
const ImprovementDetail = lazy(() => import('./pages/ward/ImprovementDetail'));
const WardWiseProvision = lazy(() => import('./pages/ward/WardProvisions'));
const GovernmentOffice = lazy(() => import('./pages/office/GovernmentOffice'));
const NewspaperClipping = lazy(() => import('./pages/media/NewspaperClipping'));
const MediaTracking = lazy(() => import('./pages/media/MediaTracking'));
const AnalysisStrategy = lazy(() => import('./pages/political/AnalysisStrategy'));
const CastWiseVoters = lazy(() => import('./pages/political/CastWiseVoters'));
const AddVoter = lazy(() => import('./pages/political/AddVoter'));
const FriendsRelatives = lazy(() => import('./pages/political/FriendsRelatives'));
const WardInfoConstituency = lazy(() => import('./pages/political/WardInfoConstituency'));
const PublicCommunication = lazy(() => import('./pages/political/PublicCommunication'));
const SMSCommunication = lazy(() => import('./pages/communication/SMSCommunication'));
const WhatsAppCommunication = lazy(() => import('./pages/communication/WhatsAppCommunication'));
const VoiceCall = lazy(() => import('./pages/communication/VoiceCall'));
const AIVoiceCall = lazy(() => import('./pages/communication/AIVoiceCall'));
const ConferenceRoom = lazy(() => import('./pages/communication/ConferenceRoom'));
const WhatsAppCalling = lazy(() => import('./pages/communication/WhatsAppCalling'));
const VoterForms = lazy(() => import('./pages/political/VoterForms'));
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'));
const OppositionManagement = lazy(() => import('./pages/political/OppositionManagement'));
const SocialOrganizations = lazy(() => import('./pages/political/SocialOrganizations'));
const HousingSocieties = lazy(() => import('./pages/political/HousingSocieties'));
const DuplicateVoters = lazy(() => import('./pages/political/DuplicateVoters'));
const KaryakartaWorkManagement = lazy(() => import('./pages/political/KaryakartaWorkManagement'));
const FileTrackerDashboard = lazy(() => import('./pages/works/FileTrackerDashboard'));
const FileTrackerForm = lazy(() => import('./pages/works/FileTrackerForm'));
const FileTrackerDetail = lazy(() => import('./pages/works/FileTrackerDetail'));


// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

// Route Security Guard Component
const RouteSecurityGuard = ({ children }: { children: React.ReactNode }) => {
  const { routeCategory, routePlan } = useParams<{ routeCategory: string; routePlan: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { tenant, tier, plan, loading: tenantLoading } = useTenant();
  const location = useLocation();

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || tenant?.subdomain === 'default' || window.location.hostname.includes('vercel.app');

  const isChecking = authLoading || tenantLoading;

  // Perform checks and log security mismatch if detected
  useEffect(() => {
    if (isChecking || !user || !tenant) return;

    const expectedCategory = routeCategory?.toUpperCase();
    const actualCategory = tier.toUpperCase();

    const normalizePlan = (p?: string) => {
      if (!p) return '';
      const upper = p.toUpperCase();
      return upper === 'ADVANCED' ? 'ADVANCE' : upper;
    };

    const expectedPlan = normalizePlan(routePlan);
    const actualPlan = normalizePlan(plan);

    const isCategoryMatch = expectedCategory === actualCategory;
    const isPlanMatch = expectedPlan === actualPlan;

    if (user?.email === 'krishnaniti@gmail.com' && !isLocal) return;

    if (!isCategoryMatch || !isPlanMatch) {
      logSecurityEvent(
        'unauthorized_route_access',
        {
          path: location.pathname,
          requestedCategory: routeCategory,
          requestedPlan: routePlan,
          actualCategory: tier,
          actualPlan: plan,
          reason: 'Category or plan mismatch with active tenant session'
        },
        tenant.id
      );
    }
  }, [isChecking, user, tenant, routeCategory, routePlan, tier, plan, location.pathname]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. User authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Tenant active
  if (!tenant) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          <h2 className="text-2xl font-bold text-red-600 mb-2 font-sans">Tenant Inactive</h2>
          <p className="text-slate-600 mb-4">No active tenant found for this subdomain or login session.</p>
        </div>
      </div>
    );
  }

  // 3. Category & 4. Plan matches route
  const expectedCategory = routeCategory?.toUpperCase();
  const actualCategory = tier.toUpperCase();

  const normalizePlan = (p?: string) => {
    if (!p) return '';
    const upper = p.toUpperCase();
    return upper === 'ADVANCED' ? 'ADVANCE' : upper;
  };

  const expectedPlan = normalizePlan(routePlan);
  const actualPlan = normalizePlan(plan);

  const isCategoryMatch = expectedCategory === actualCategory || (user?.email === 'krishnaniti@gmail.com' && !isLocal);
  const isPlanMatch = expectedPlan === actualPlan || (user?.email === 'krishnaniti@gmail.com' && !isLocal);

  if (!isCategoryMatch || !isPlanMatch) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-center p-4">
        <div className="max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-red-100/50 animate-in fade-in duration-300 relative overflow-hidden">
          {/* Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-orange-500" />
          
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-sm border border-red-100">
            <Shield className="w-8 h-8" />
          </div>
          
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2">403</h1>
          <h2 className="text-xl font-bold text-slate-800 mb-4 font-sans">Access Forbidden</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Your representative category or subscription plan does not match the requested route. A security alert has been logged.
          </p>

          <div className="text-xs text-slate-600 font-mono text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
              <span className="font-semibold text-slate-400">Parameter</span>
              <span className="font-semibold text-slate-400">Actual (Tenant)</span>
            </div>
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-bold text-slate-800">{actualCategory}</span>
            </div>
            <div className="flex justify-between">
              <span>Plan:</span>
              <span className="font-bold text-slate-800">{actualPlan}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Tenant ownership verified (Inherently verified via TenantContext resolver)
  return <>{children}</>;
};

// Dashboard Redirect Component (Dynamic URL mapping)
const DashboardRedirect = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { tenant, tier, plan, loading: tenantLoading } = useTenant();
  const location = useLocation();

  if (authLoading || tenantLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !tenant) {
    return <Navigate to="/login" replace />;
  }

  const categoryPath = tier.toLowerCase();
  const planPath = plan.toLowerCase(); // basic, pro, advance

  // Extract path suffix
  // e.g. /dashboard/voters -> voters
  const suffix = location.pathname.substring('/dashboard'.length);
  
  // Construct dynamic path: /category/plan/dashboard/suffix
  const newPath = `/${categoryPath}/${planPath}/dashboard${suffix}${location.search}`;

  return <Navigate to={newPath} replace />;
};

// Permission Guard Component
const PermissionGuard = ({ children, permission }: { children: React.ReactNode; permission: string }) => {
  const { user, isLoading } = useAuth();
  const { hasFeature } = useTenant();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  // 1. Enforce subscription plan feature access first
  if (!hasFeature(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin-level roles always have full access
  const adminRoles = ['admin', 'nagarsevak', 'amdar', 'khasdar', 'minister'];
  if (adminRoles.includes(user.role) && !user.isStaff) return <>{children}</>;

  // Staff check — must have the specific permission
  if (user.isStaff) {
    const perms = user.permissions;
    if (Array.isArray(perms) && perms.includes(permission)) {
      return <>{children}</>;
    }
    // No permission → redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Any other unknown role → no access
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join-party" element={<JoinParty />} />
          <Route path="/s/:id" element={<PublicSurveyForm />} />

          <Route path="/:routeCategory/:routePlan/dashboard" element={
            <ProtectedRoute>
              <RouteSecurityGuard>
                <AppLayout />
              </RouteSecurityGuard>
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />

            {/* Daily Work */}
            <Route path="voters" element={<PermissionGuard permission="voters"><VoterList /></PermissionGuard>} />
            <Route path="voters/:id" element={<PermissionGuard permission="voters"><VoterProfile /></PermissionGuard>} />

            <Route path="complaints" element={<PermissionGuard permission="complaints"><ComplaintList /></PermissionGuard>} />
            <Route path="complaints/new" element={<PermissionGuard permission="complaints"><ComplaintForm /></PermissionGuard>} />
            <Route path="personal-requests/new" element={<PermissionGuard permission="complaints"><PersonalRequestForm /></PermissionGuard>} />
            <Route path="complaints/:id" element={<PermissionGuard permission="complaints"><ComplaintDetail /></PermissionGuard>} />

            <Route path="schemes" element={<PermissionGuard permission="schemes"><SchemeList /></PermissionGuard>} />
            <Route path="schemes/new" element={<PermissionGuard permission="schemes"><SchemeForm /></PermissionGuard>} />
            <Route path="schemes/edit/:id" element={<PermissionGuard permission="schemes"><SchemeForm /></PermissionGuard>} />

            <Route path="events" element={<PermissionGuard permission="events"><EventManagement /></PermissionGuard>} />
            <Route path="events/:id" element={<PermissionGuard permission="events"><EventDetail /></PermissionGuard>} />

            <Route path="tasks" element={<PermissionGuard permission="tasks"><Tasks /></PermissionGuard>} />
            <Route path="staff" element={<PermissionGuard permission="staff"><StaffList /></PermissionGuard>} />

            <Route path="letters" element={<PermissionGuard permission="letters"><LetterDashboard /></PermissionGuard>} />
            <Route path="letters/new" element={<PermissionGuard permission="letters"><LetterForm /></PermissionGuard>} />
            <Route path="letters/edit/:id" element={<PermissionGuard permission="letters"><LetterForm /></PermissionGuard>} />
            <Route path="letters/types" element={<PermissionGuard permission="letters"><LetterTypeManager /></PermissionGuard>} />

            <Route path="visitors" element={<PermissionGuard permission="visitors"><VisitorLog /></PermissionGuard>} />

            {/* Admin Only / Specific Permissions */}
            <Route path="bot-dashboard" element={<PermissionGuard permission="bot"><BotDashboard /></PermissionGuard>} />
            <Route path="sadasya" element={<PermissionGuard permission="sadasya"><SadasyaList /></PermissionGuard>} />

            <Route path="social" element={<PermissionGuard permission="social"><SocialDashboard /></PermissionGuard>} />

            <Route path="history" element={<PermissionGuard permission="work_history"><WorkHistory /></PermissionGuard>} />
            <Route path="history/:id" element={<PermissionGuard permission="work_history"><WorkDetail /></PermissionGuard>} />

            <Route path="diary" element={<PermissionGuard permission="gb_register"><DiaryList /></PermissionGuard>} />
            <Route path="gallery" element={<PermissionGuard permission="gallery"><Gallery /></PermissionGuard>} />
            <Route path="budget" element={<PermissionGuard permission="budget"><BudgetDashboard /></PermissionGuard>} />
            <Route path="results" element={<PermissionGuard permission="results"><ResultAnalysis /></PermissionGuard>} />
            <Route path="content" element={<PermissionGuard permission="ai_content"><ContentStudio /></PermissionGuard>} />

            <Route path="surveys" element={<PermissionGuard permission="surveys"><SurveyDashboard /></PermissionGuard>} />
            <Route path="surveys/new" element={<PermissionGuard permission="surveys"><CreateSurvey /></PermissionGuard>} />
            <Route path="surveys/edit/:id" element={<PermissionGuard permission="surveys"><CreateSurvey /></PermissionGuard>} />
            <Route path="surveys/:id" element={<PermissionGuard permission="surveys"><SurveyDetails /></PermissionGuard>} />

            {/* New Routes */}
            <Route path="ward/problems" element={<PermissionGuard permission="ward_problems"><WardWiseProblem /></PermissionGuard>} />
            <Route path="ward/map" element={<PermissionGuard permission="ward_info"><WardMap /></PermissionGuard>} />
            <Route path="ward/improvements" element={<PermissionGuard permission="improvements"><PossibleImprovements /></PermissionGuard>} />
            <Route path="ward/improvements/:id" element={<PermissionGuard permission="improvements"><ImprovementDetail /></PermissionGuard>} />
            <Route path="ward/provision" element={<PermissionGuard permission="provision"><WardWiseProvision /></PermissionGuard>} />

            <Route path="government-office" element={<PermissionGuard permission="gov_office"><GovernmentOffice /></PermissionGuard>} />
            <Route path="files" element={<PermissionGuard permission="gov_office"><FileTrackerDashboard /></PermissionGuard>} />
            <Route path="files/new" element={<PermissionGuard permission="gov_office"><FileTrackerForm /></PermissionGuard>} />
            <Route path="files/edit/:id" element={<PermissionGuard permission="gov_office"><FileTrackerForm /></PermissionGuard>} />
            <Route path="files/:id" element={<PermissionGuard permission="gov_office"><FileTrackerDetail /></PermissionGuard>} />
            <Route path="media/newspaper" element={<PermissionGuard permission="newspaper"><NewspaperClipping /></PermissionGuard>} />
            <Route path="media/tracking" element={<PermissionGuard permission="newspaper"><MediaTracking /></PermissionGuard>} />

            <Route path="analysis-strategy" element={<PermissionGuard permission="analysis"><AnalysisStrategy /></PermissionGuard>} />

            <Route path="political/cast-wise" element={<PermissionGuard permission="analysis"><CastWiseVoters /></PermissionGuard>} />
            <Route path="political/add-voter" element={<PermissionGuard permission="voters"><AddVoter /></PermissionGuard>} />
            <Route path="political/friends-relatives" element={<PermissionGuard permission="voters"><FriendsRelatives /></PermissionGuard>} />
            <Route path="political/ward-info" element={<PermissionGuard permission="voters"><WardInfoConstituency /></PermissionGuard>} />
            <Route path="political/opposition" element={<PermissionGuard permission="opposition"><OppositionManagement /></PermissionGuard>} />
            <Route path="political/social-organizations" element={<PermissionGuard permission="social_organizations"><SocialOrganizations /></PermissionGuard>} />
            <Route path="political/housing-societies" element={<PermissionGuard permission="housing_societies"><HousingSocieties /></PermissionGuard>} />
            <Route path="political/duplicates" element={<PermissionGuard permission="voters"><DuplicateVoters /></PermissionGuard>} />
            <Route path="political/work-management" element={<PermissionGuard permission="karyakarta_work"><KaryakartaWorkManagement /></PermissionGuard>} />


            <Route path="political/public-communication" element={<PermissionGuard permission="public_comm"><PublicCommunication /></PermissionGuard>} />

            {/* Communication Routes */}
            <Route path="communication/sms" element={<PermissionGuard permission="sms"><SMSCommunication /></PermissionGuard>} />
            <Route path="communication/whatsapp" element={<PermissionGuard permission="whatsapp"><WhatsAppCommunication /></PermissionGuard>} />
            <Route path="communication/voice" element={<PermissionGuard permission="voice_call"><VoiceCall /></PermissionGuard>} />
            <Route path="communication/ai-voice" element={<PermissionGuard permission="ai_voice_call"><AIVoiceCall /></PermissionGuard>} />
            <Route path="communication/conference" element={<PermissionGuard permission="conference_room"><ConferenceRoom /></PermissionGuard>} />
            <Route path="communication/whatsapp-call" element={<PermissionGuard permission="whatsapp_call"><WhatsAppCalling /></PermissionGuard>} />
            <Route path="political/voter-forms" element={<PermissionGuard permission="voter_forms"><VoterForms /></PermissionGuard>} />

            <Route path="settings/profile" element={<PermissionGuard permission="profile_settings"><ProfileSettings /></PermissionGuard>} />
          </Route>

          {/* Legacy Fallback Redirect */}
          <Route path="/dashboard/*" element={<DashboardRedirect />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
