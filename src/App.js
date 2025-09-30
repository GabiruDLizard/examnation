import './App.css';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import LandingPage from './Components/Landing';
import Auth from './Components/Authentication/Auth';
import ResetPassword from './Components/ResetPassword';
import SetUp from './Components/AccountSetUp/SetUp';
import StudentDashboard from './Components/Dashboards/StudentDashboard';
import TeacherDashboard from './Components/Dashboards/TeacherDashboard';
import ExamPage from './Components/ExamPage/ExamPage';
import PracticeArea from './Components/PracticeArea/PracticeArea';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <div className="App-nav">
          <Navbar />
        </div>
        <div className="App-body">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/setup" element={<SetUp />} />
            <Route path="/passwordreset" element={<ResetPassword />} />
            <Route path="/studentdashboard" element={<StudentDashboard student={{ firstName: 'John', setupComplete: true, questionsPracticed: 10, correctAnswers: 8 }} />} />
            <Route path="/teacherdashboard" element={<TeacherDashboard />} />
            <Route path="/exampage" element={<ExamPage />} />
            <Route path="/practice/:id" element={<PracticeArea />} />
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
