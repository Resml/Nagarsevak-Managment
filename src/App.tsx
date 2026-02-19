import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/dashboard/Dashboard';
import VoterList from './pages/voters/VoterList';
import ComplaintList from './pages/complaints/ComplaintList';
import Tasks from './pages/tasks/Tasks';

import VoterProfile from './pages/voters/VoterProfile';
import ComplaintForm from './pages/complaints/ComplaintForm';
import ComplaintDetail from './pages/complaints/ComplaintDetail';
import PersonalRequestForm from './pages/complaints/PersonalRequestForm';

import BotDashboard from './pages/admin/BotDashboard';

import SocialDashboard from './pages/social/SocialDashboard';
import SchemeList from './pages/schemes/SchemeList';
import SchemeForm from './pages/schemes/SchemeForm';
import WorkHistory from './pages/works/WorkHistory';
import WorkDetail from './pages/works/WorkDetail';
import EventManagement from './pages/events/EventManagement';
import EventDetail from './pages/events/EventDetail';
import StaffList from './pages/staff/StaffList';
import LetterDashboard from './pages/letters/LetterDashboard';
import LetterForm from './pages/letters/LetterForm';
import LetterTypeManager from './pages/letters/LetterTypeManager';
import VisitorLog from './pages/office/VisitorLog';
import JoinParty from './pages/sadasya/JoinParty';
import SadasyaList from './pages/sadasya/SadasyaList';
import DiaryList from './pages/diary/DiaryList';
import Gallery from './pages/gallery/Gallery';
import BudgetDashboard from './pages/budget/BudgetDashboard';
import ResultAnalysis from './pages/results/ResultAnalysis';
import ContentStudio from './pages/content/ContentStudio';
import SurveyDashboard from './pages/surveys/SurveyDashboard'; import CreateSurvey from './pages/surveys/CreateSurvey';

import WardWiseProblem from './pages/ward/WardWiseProblem';
import WardMap from './pages/ward/WardMap';
import PossibleImprovements from './pages/ward/PossibleImprovements';
import ImprovementDetail from './pages/ward/ImprovementDetail';
import WardWiseProvision from './pages/ward/WardProvisions';
import GovernmentOffice from './pages/office/GovernmentOffice';
import NewspaperClipping from './pages/media/NewspaperClipping';
import AnalysisStrategy from './pages/political/AnalysisStrategy';
import CastWiseVoters from './pages/political/CastWiseVoters';
import AddVoter from './pages/political/AddVoter';
import FriendsRelatives from './pages/political/FriendsRelatives';
import WardInfoConstituency from './pages/political/WardInfoConstituency';
import PublicCommunication from './pages/political/PublicCommunication';
import VoterForms from './pages/political/VoterForms';
import ProfileSettings from './pages/settings/ProfileSettings';

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join-party" element={<JoinParty />} />

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
    </BrowserRouter>
  );
}

export default App;
