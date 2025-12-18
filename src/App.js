import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import LandingPage from './Components/Landing';
import Auth from './Components/Authentication/Auth';
import ResetPassword from './Components/ResetPassword';
import LandingPageAuth from './LandingPageAuth';
import SetUp from './Components/AccountSetUp/SetUp';
import StudentDashboard from './Components/Dashboards/StudentDashboard/StudentDashboard';
import TeacherDashboard from './Components/Dashboards/TeacherDashboard/TeacherDashboard';
import ExamPage from './Components/ExamPage/ExamPage';
import PracticeArea from './Components/PracticeArea/PracticeArea';
import AdaptiveTest from './Components/Quizzes/AdaptiveTest';
import TestEntrance from './Components/Quizzes/TestEntrance';
import TApageStudent from './Components/Dashboards/TAPage/TAPageStudent';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
function App() {
  // const [user, setUser] = useState(null);

  // const isUserHere = () => {
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     // User is logged in
  //     toUserDashboard(token);
  //   }
  //   // User is not logged in
  //   return;
  // }
  // const toUserDashboard = async (token) => {
  //     try {
  //       const payload = JSON.parse(atob(token.split('.')[1]));
  //       const userId = payload.sub;
  //       const response = await fetch(`https://examnationwebapi.azurewebsites.net/api/user/${userId}`, {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         }
  //       });
  //       if (!response.ok) {
  //         throw new Error('Failed to fetch user data');
  //       }
  //       const data = await response.json();
  //       setUser(data);
  //       console.log(data);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   if(user?.role === 'Student'){
  //       window.location.href = '/studentdashboard';
  //   }
  //   else if(user?.role === 'Educator'){
  //       window.location.href = '/teacherdashboard';
  //   }
  // };
  return (
    <Router>
      <div className="App">
        {/* <div className="App-nav">
          <Navbar />
        </div> */}
        <div className="App-body">
          <Routes>
            <Route path="/" element={<LandingPageAuth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/setup" element={<SetUp />} />
            <Route path="/passwordreset" element={<ResetPassword />} />
            <Route path="/studentdashboard" element={<StudentDashboard student={{ firstName: 'John', setupComplete: true, questionsPracticed: 10, correctAnswers: 8 }} />} />
            <Route path="/teacherdashboard" element={<TeacherDashboard />} />
            <Route path="/exampage" element={<ExamPage />} />
            <Route path="/practice/:id" element={<PracticeArea />} />
            <Route path="/adaptivetest" element={<AdaptiveTest />} />
            <Route path="/testentrance" element={<TestEntrance />} />
            <Route path="/tapagestudent" element={<TApageStudent />} />
          </Routes>
        </div>
        <div className="App-foot">
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;
