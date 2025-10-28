import React from 'react'; // Fix: "Ract" -> "React"
import { useNavigate } from 'react-router-dom';
//import '../../Styling/TestEntrance.css'; // Add styling if you want

const TestEntrance = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const ToExam = () => {
    if(!token){
        if(window.confirm("You need to be logged in to take the adaptive test. Proceed to login page?")){
            navigate('/login');
        }
    }
    else{
        navigate('/adaptivetest');
    }
  }

  return (
    <div className="test-entrance">
      <div className="entrance-content">
        <h1>🎯 Adaptive Assessment</h1>
        
        <div className="test-info">
          <h3>📋 What to Expect:</h3>
          <ul>
            <li>✅ <strong>20 questions</strong> total</li>
            <li>⭐ <strong>Points:</strong> Easy (1pt), Medium (3pts), Hard (5pts)</li>
            <li>🎲 <strong>Random questions</strong> from all subjects</li>
            <li>⏱️ <strong>Your progress is saved</strong> automatically</li>
          </ul>
        </div>

        <div className="instructions">
          <h3>📝 Instructions:</h3>
          <p>• Show your working in the answer area</p>
          <p>• Use the math editor for equations</p>
          <p>• Get feedback after each question</p>
          <p>• Your score and answers are saved</p>
        </div>

        <div className="action-buttons">
          <button 
            className="start-test-btn" 
            onClick={() => ToExam()}
          >
            🚀 Start Test
          </button>
          
          <button 
            className="back-btn" 
            onClick={() => navigate('/exampage')}
          >
            ← Back to Exam Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestEntrance;