
import './App.css';
import Navbar from './Components/Navbar';
import LandingPage from './Components/Landing';
import Auth from './Components/Auth';
import ResetPassword from './Components/ResetPassword';
import SetUp from './Components/AccountSetUp/SetUp';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <div className="App-nav">
          <Navbar />
      </div>
      <div className="App-body">
        
        <Router>
          <Routes>
            <Route path="/" element = {<LandingPage />} />
            {/* <Route path ="/register" element = {<Register />} /> */}
            <Route path ="/login" element = {<Auth />} />
            <Route path ="/setup" element = {<SetUp />} />
            <Route path ="/passwordreset" element = {<ResetPassword />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;
