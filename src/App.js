import React, { Suspense, lazy } from 'react';
import './App.css';
import './styles/utilities.css';
import ErrorBoundary from './Components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './Components/ProtectedRoute';
import ScrollToTop from './Components/ScrollToTop';
import FeedbackButton from './Components/Shared/FeedbackButton';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const LandingPageAuth                = lazy(() => import('./LandingPageAuth'));
const Auth                           = lazy(() => import('./Components/Authentication/Auth'));
const ResetPassword                  = lazy(() => import('./Components/ResetPassword'));
const AdminDashboard                 = lazy(() => import('./Components/Dashboards/AdminDashboard/AdminDashboard'));
const StudentDashboard               = lazy(() => import('./Components/Dashboards/StudentDashboard/StudentDashboard'));
const TeacherDashboard               = lazy(() => import('./Components/Dashboards/TeacherDashboard/TeacherDashboard'));
const ExamPage                       = lazy(() => import('./Components/ExamPage/ExamPage'));
const PracticeArea                   = lazy(() => import('./Components/PracticeArea/PracticeArea'));
const AdaptiveTest                   = lazy(() => import('./Components/Quizzes/AdaptiveTest'));
const TestEntrance                   = lazy(() => import('./Components/Quizzes/TestEntrance'));
const TApageStudent                  = lazy(() => import('./Components/Dashboards/TAPage/TAPageStudent'));
const AssignmentQuestionCreationPage = lazy(() => import('./Components/Dashboards/TeacherDashboard/AssignmentQuestionPage'));
const AssignmentOverview             = lazy(() => import('./Components/Dashboards/StudentDashboard/AssignmentOverview'));
const AssignmentQuestionPage         = lazy(() => import('./Components/Dashboards/StudentDashboard/AssignmentQuestionPage'));
const Settings                       = lazy(() => import('./Components/Settings/Settings'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px', marginRight: 0 }} />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="App">
          <div className="App-body">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPageAuth />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/passwordreset" element={<ResetPassword />} />
                <Route path="/admindashboard" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/studentdashboard" element={
                  <ProtectedRoute requiredRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/teacherdashboard" element={
                  <ProtectedRoute requiredRole="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/exampage" element={<ExamPage />} />
                <Route path="/practice/:id" element={<PracticeArea />} />
                <Route path="/adaptivetest" element={
                  <ProtectedRoute requiredRole="student">
                    <AdaptiveTest />
                  </ProtectedRoute>
                } />
                <Route path="/testentrance" element={
                  <ProtectedRoute requiredRole="student">
                    <TestEntrance />
                  </ProtectedRoute>
                } />
                <Route path="/tapagestudent" element={
                  <ProtectedRoute requiredRole="student">
                    <TApageStudent />
                  </ProtectedRoute>
                } />
                <Route path="/assignment-questions" element={
                  <ProtectedRoute requiredRole="teacher">
                    <AssignmentQuestionCreationPage />
                  </ProtectedRoute>
                } />
                <Route path="/assignment-overview/:classId" element={
                  <ProtectedRoute requiredRole="student">
                    <AssignmentOverview />
                  </ProtectedRoute>
                } />
                <Route path="/assignment/:assignmentId/question/:questionIndex" element={
                  <ProtectedRoute requiredRole="student">
                    <AssignmentQuestionPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
            <FeedbackButton />
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={4000} />
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
