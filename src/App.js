import React from 'react';
import './App.css';
import ErrorBoundary from './Components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Auth from './Components/Authentication/Auth';
import { AuthProvider } from './contexts/AuthContext';
import ResetPassword from './Components/ResetPassword';
import LandingPageAuth from './LandingPageAuth';
import AdminDashboard from './Components/Dashboards/AdminDashboard/AdminDashboard';
import StudentDashboard from './Components/Dashboards/StudentDashboard/StudentDashboard';
import TeacherDashboard from './Components/Dashboards/TeacherDashboard/TeacherDashboard';
import ExamPage from './Components/ExamPage/ExamPage';
import PracticeArea from './Components/PracticeArea/PracticeArea';
import AdaptiveTest from './Components/Quizzes/AdaptiveTest';
import TestEntrance from './Components/Quizzes/TestEntrance';
import TApageStudent from './Components/Dashboards/TAPage/TAPageStudent';
import AssignmentQuestionCreationPage from './Components/Dashboards/TeacherDashboard/AssignmentQuestionPage';
import AssignmentOverview from './Components/Dashboards/StudentDashboard/AssignmentOverview';
import AssignmentQuestionPage from './Components/Dashboards/StudentDashboard/AssignmentQuestionPage';
import Settings from './Components/Settings/Settings';
import ProtectedRoute from './Components/ProtectedRoute';
import ScrollToTop from './Components/ScrollToTop';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="App">
          <div className="App-body">
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
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={4000} />
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
