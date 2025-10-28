import React, { useState } from 'react';
import '../../Styling/ExamPage/ExamPage.css';
import { useNavigate } from 'react-router-dom';
import questions from '../data/generated_bgcs_questions_200_named_deduped.json';
import { BiSearch } from 'react-icons/bi';


const ExamPage = () => {
    const navigate = useNavigate();
    const [selectedDifficulty, setSelectedDifficulty] = useState(null); 
    const [selectedTopic, setSelectedTopic] = useState('All Topics');
    const [searchTerm, setSearchTerm] = useState('');

    const topics = ['All Topics', ...new Set(questions.map(q => q.Topic))];

    const filteredQuestions = questions.filter(q =>
        (selectedTopic === 'All Topics' || q.Topic === selectedTopic) &&
        (!selectedDifficulty || q.Difficulty === selectedDifficulty) &&
        (q['Question Text'].toLowerCase().includes(searchTerm.toLowerCase()) || q.UniqueName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
        <div className="exam-page">  
            <h2>filter by question topic</h2>
            <div className="topic-row">
                {topics.map(topic => (
                    <button key = {topic} className={'topic-button' + (selectedTopic === topic ? ' active' : '')} onClick={() => setSelectedTopic(topic)} style={{
                            padding: '8px 18px',
                            borderRadius: 20,
                            border: selectedTopic === topic ? '2px solid #00796b' : '1px solid #ccc',
                            background: selectedTopic === topic ? '#e0f2f1' : '#fff',
                            color: selectedTopic === topic ? '#00796b' : '#333',
                            fontWeight: 500,
                            cursor: 'pointer',
                            outline: 'none',
                        }}>
                            {topic}
                        </button>
                ))}
            </div>
            <div>
                <div>
                    <input className="search-input" type="text" placeholder="search questions" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <label htmlFor="difficulty">Filter by Difficulty:</label>
                    <select id="difficulty" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
                        <option value="">All</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>
            </div>
            {/* <h1>Exam Page</h1> */}
            <ol className="question-list">
                {filteredQuestions.slice(0, 100).map((question, index) => (
                    <li className="question-item" key={index} onClick={() => navigate(`/practice/${question['Question ID']}`)}>
                        <span className='question-unique-name'>{question.UniqueName}</span>
                        <span className={`question-difficulty ${question.Difficulty.toLowerCase()}`}>{question.Difficulty}</span>
                    </li>
                ))}
            </ol>
            
        </div>
        </>
    );
};

export default ExamPage;
