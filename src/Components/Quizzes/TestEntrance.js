import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TestEntrance.css'; // Add styling if you want

const TestEntrance = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10); // Default to 10 questions

  const ToExam = () => {
    if(!token){
        if(window.confirm("You need to be logged in to take the adaptive test. Proceed to login page?")){
            navigate('/login');
        }
    }
    else{
        // Pass the selected question count to the adaptive test
        navigate('/adaptivetest', { 
          state: { 
            questionCount: selectedQuestionCount 
          }
        });
    }
  }

  const getMaxPoints = (questionCount) => {
    return questionCount * 5; // Maximum if all questions are hard (5pts each)
  }

  const getEstimatedTime = (questionCount) => {
    const timePerQuestion = 2; // 2 minutes per question estimate
    return questionCount * timePerQuestion;
  }

  return (
    <div className="test-entrance">
      <div className="entrance-content">
        <h1>🎯 Adaptive Assessment</h1>
        
        <div className="question-selector">
          <h3>📊 Choose Test Length:</h3>
          <div className="question-options">
            <div 
              className={`option-card ${selectedQuestionCount === 5 ? 'selected' : ''}`}
              onClick={() => setSelectedQuestionCount(5)}
            >
              <div className="option-header">
                <span className="option-number">5</span>
                <span className="option-label">Questions</span>
              </div>
              <div className="option-details">
                <p>⚡ <strong>Quick Assessment</strong></p>
                <p>🕒 ~{getEstimatedTime(5)} minutes</p>
                <p>🎯 Max {getMaxPoints(5)} points</p>
                <p>💡 Perfect for a quick check</p>
              </div>
            </div>

            <div 
              className={`option-card ${selectedQuestionCount === 10 ? 'selected' : ''}`}
              onClick={() => setSelectedQuestionCount(10)}
            >
              <div className="option-header">
                <span className="option-number">10</span>
                <span className="option-label">Questions</span>
              </div>
              <div className="option-details">
                <p>⚖️ <strong>Balanced Assessment</strong></p>
                <p>🕒 ~{getEstimatedTime(10)} minutes</p>
                <p>🎯 Max {getMaxPoints(10)} points</p>
                <p>💡 Recommended for most students</p>
              </div>
            </div>

            <div 
              className={`option-card ${selectedQuestionCount === 20 ? 'selected' : ''}`}
              onClick={() => setSelectedQuestionCount(20)}
            >
              <div className="option-header">
                <span className="option-number">20</span>
                <span className="option-label">Questions</span>
              </div>
              <div className="option-details">
                <p>🔥 <strong>Comprehensive Test</strong></p>
                <p>🕒 ~{getEstimatedTime(20)} minutes</p>
                <p>🎯 Max {getMaxPoints(20)} points</p>
                <p>💡 Deep assessment of abilities</p>
              </div>
            </div>
          </div>
        </div>

        <div className="test-info">
          <h3>📋 What to Expect:</h3>
          <ul>
            <li>✅ <strong>{selectedQuestionCount} questions</strong> selected</li>
            <li>⭐ <strong>Points:</strong> Easy (1pt), Medium (3pts), Hard (5pts)</li>
            <li>🎲 <strong>Random questions</strong> from all subjects</li>
            <li>⏱️ <strong>Estimated time:</strong> ~{getEstimatedTime(selectedQuestionCount)} minutes</li>
            <li>💾 <strong>Your progress is saved</strong> automatically</li>
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
            🚀 Start {selectedQuestionCount}-Question Test
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