import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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
const AnalysisStrategy = lazy(() => import('./pages/political/AnalysisStrategy'));
const CastWiseVoters = lazy(() => import('./pages/political/CastWiseVoters'));
const AddVoter = lazy(() => import('./pages/political/AddVoter'));
const FriendsRelatives = lazy(() => import('./pages/political/FriendsRelatives'));
const WardInfoConstituency = lazy(() => import('./pages/political/WardInfoConstituency'));
const PublicCommunication = lazy(() => import('./pages/political/PublicCommunication'));
const VoterForms = lazy(() => import('./pages/political/VoterForms'));
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'));

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

// Permission Guard Component
const PermissionGuard = ({ children, permission }: { children: React.ReactNode; permission: string }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  // If no user, ProtectedRoute will handle it, but safety check:
  if (!user) return <Navigate to="/login" replace />;

  // Admin always has access
  if (user.role === 'admin') return <>{children}</>;

  // Staff check
  if (user.role === 'staff') {
    if (user.permissions?.includes(permission)) {
      return <>{children}</>;
    } else {
      // No permission, redirect to dashboard
      return <Navigate to="/" replace />;
    }
  }

  // Fallback (e.g., other roles? assume no access for safety)
  return <Navigate to="/" replace />;
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

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout />
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
            <Route path="media/newspaper" element={<PermissionGuard permission="newspaper"><NewspaperClipping /></PermissionGuard>} />

            <Route path="analysis-strategy" element={<PermissionGuard permission="analysis"><AnalysisStrategy /></PermissionGuard>} />

            <Route path="political/cast-wise" element={<PermissionGuard permission="analysis"><CastWiseVoters /></PermissionGuard>} />
            <Route path="political/add-voter" element={<PermissionGuard permission="voters"><AddVoter /></PermissionGuard>} />
            <Route path="political/friends-relatives" element={<PermissionGuard permission="voters"><FriendsRelatives /></PermissionGuard>} />
            <Route path="political/ward-info" element={<PermissionGuard permission="voters"><WardInfoConstituency /></PermissionGuard>} />

            <Route path="political/public-communication" element={<PermissionGuard permission="public_comm"><PublicCommunication /></PermissionGuard>} />
            <Route path="political/voter-forms" element={<PermissionGuard permission="voters"><VoterForms /></PermissionGuard>} />

            <Route path="settings/profile" element={<PermissionGuard permission="profile_settings"><ProfileSettings /></PermissionGuard>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
