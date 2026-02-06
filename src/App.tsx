import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import VoterList from './pages/voters/VoterList';
import ComplaintList from './pages/complaints/ComplaintList';
import Tasks from './pages/tasks/Tasks';

import VoterProfile from './pages/voters/VoterProfile';
import ComplaintForm from './pages/complaints/ComplaintForm';
import ComplaintDetail from './pages/complaints/ComplaintDetail';

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
import ProfileSettings from './pages/settings/ProfileSettings';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/join-party" element={<JoinParty />} />

        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="voters" element={<VoterList />} />
          <Route path="voters/:id" element={<VoterProfile />} />
          <Route path="complaints" element={<ComplaintList />} />
          <Route path="complaints/new" element={<ComplaintForm />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="schemes" element={<SchemeList />} />
          <Route path="schemes/new" element={<SchemeForm />} />
          <Route path="schemes/edit/:id" element={<SchemeForm />} />
          <Route path="events" element={<EventManagement />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="letters" element={<LetterDashboard />} />
          <Route path="letters/new" element={<LetterForm />} />
          <Route path="letters/types" element={<LetterTypeManager />} />
          <Route path="visitors" element={<VisitorLog />} />
          <Route path="bot-dashboard" element={<BotDashboard />} />
          <Route path="sadasya" element={<SadasyaList />} />
          <Route path="social" element={<SocialDashboard />} />
          <Route path="history" element={<WorkHistory />} />
          <Route path="history/:id" element={<WorkDetail />} />
          <Route path="diary" element={<DiaryList />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="budget" element={<BudgetDashboard />} />
          <Route path="results" element={<ResultAnalysis />} />
          <Route path="content" element={<ContentStudio />} />
          <Route path="surveys" element={<SurveyDashboard />} />
          <Route path="surveys" element={<SurveyDashboard />} />
          <Route path="surveys/new" element={<CreateSurvey />} />

          {/* New Routes */}
          <Route path="ward/problems" element={<WardWiseProblem />} />
          <Route path="ward/improvements" element={<PossibleImprovements />} />
          <Route path="ward/improvements/:id" element={<ImprovementDetail />} />
          <Route path="ward/provision" element={<WardWiseProvision />} />
          <Route path="government-office" element={<GovernmentOffice />} />
          <Route path="media/newspaper" element={<NewspaperClipping />} />
          <Route path="analysis-strategy" element={<AnalysisStrategy />} />
          <Route path="political/cast-wise" element={<CastWiseVoters />} />
          <Route path="political/add-voter" element={<AddVoter />} />
          <Route path="political/friends-relatives" element={<FriendsRelatives />} />
          <Route path="political/ward-info" element={<WardInfoConstituency />} />
          <Route path="political/ward-info" element={<WardInfoConstituency />} />
          <Route path="political/public-communication" element={<PublicCommunication />} />
          <Route path="settings/profile" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
