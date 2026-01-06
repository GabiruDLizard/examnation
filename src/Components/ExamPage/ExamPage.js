import React, { useState } from 'react';
import './ExamPage.css';
import { useNavigate } from 'react-router-dom';
import questions from '../data/generated_bgcs_questions_200_named_deduped.json';
import { BiSearch, BiMenu, BiX, BiBook, BiBrain } from 'react-icons/bi';
import Navbar from '../Navbar';

const ExamPage = () => {
    const navigate = useNavigate();
    const [selectedDifficulty, setSelectedDifficulty] = useState(null); 
    const [selectedTopic, setSelectedTopic] = useState('All Topics');
    const [searchTerm, setSearchTerm] = useState('');
    const [displayCount, setDisplayCount] = useState(70);
    const [selectedSubject, setSelectedSubject] = useState('Math');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Add sidebar state
    const [activeTab, setActiveTab] = useState('Library'); // New state for active tab

    const topics = ['All Topics', ...new Set(questions.map(q => q.Topic))];
    const subjects = ['Mathematics']; 

    const filteredQuestions = questions.filter(q =>
        (selectedTopic === 'All Topics' || q.Topic === selectedTopic) &&
        (!selectedDifficulty || q.Difficulty === selectedDifficulty) &&
        (q['Question Text'].toLowerCase().includes(searchTerm.toLowerCase()) || q.UniqueName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const loadMore = () => {
        setDisplayCount(prev => prev + 10);
    };

    const handleSubjectChange = (e) => {
        setSelectedSubject(e.target.value);
        setDisplayCount(70);
        // Reset other filters when subject changes
        setSelectedTopic('All Topics');
        setSelectedDifficulty(null);
        setSearchTerm('');
    };

    const handleTopicChange = (topic) => {
        setSelectedTopic(topic);
        setIsSidebarOpen(false); // Close sidebar when topic is selected
    };

    const handleDifficultyChange = (e) => {
        setSelectedDifficulty(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value); 
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            <Navbar />
            <div className="exam-layout">
                {/* Sidebar Toggle Button */}
                {!isSidebarOpen && (
                    <button className="sidebar-toggle" onClick={toggleSidebar}>
                        <BiMenu />
                    </button>
                )}

                {/* Sidebar */}
                <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                    {/* Move the toggle button inside the sidebar */}
                    <button className="sidebar-toggle-inside" onClick={toggleSidebar}>
                        {isSidebarOpen ? <BiX /> : <BiMenu />}
                    </button>
                    
                    <div className="sidebar-content">
                        {/* Top Tabs */}
                        {/* <div className="sidebar-tabs">
                            <button 
                                className={`sidebar-tab ${activeTab === 'Library' ? 'active' : ''}`}
                                onClick={() => setActiveTab('Library')}
                            >
                                <BiBook /> Library
                            </button>
                            <button 
                                className={`sidebar-tab ${activeTab === 'Challenges' ? 'active' : ''}`}
                                onClick={() => setActiveTab('Challenges')}
                            >
                                <BiBrain /> Challenges
                            </button>
                        </div> */}
                        
                        {/* Search in Sidebar */}
                        <div className="sidebar-section">
                            <input 
                                className="sidebar-search" 
                                type="text" 
                                placeholder="Search..." 
                                value={searchTerm} 
                                onChange={handleSearchChange} 
                            />
                        </div>
                        
                        <div className="sidebar-section">
                            <select 
                                className="sidebar-subject"
                                value={selectedSubject} 
                                onChange={handleSubjectChange}
                            >
                                {subjects.map(subject => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                        </div>

                        {/* Difficulty Filter in Sidebar */}
                        <div className="sidebar-section">
                            <label>Difficulty</label>
                            <select 
                                className="sidebar-select"
                                value={selectedDifficulty || ''} 
                                onChange={handleDifficultyChange}
                            >
                                <option value="">All Difficulties</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>

                        {/* Topics in Sidebar */}
                        <div className="sidebar-section">
                            <label>Topics</label>
                            <div className="sidebar-topics">
                                {topics.map(topic => (
                                    <button 
                                        key={topic} 
                                        className={`sidebar-topic-button ${selectedTopic === topic ? 'active' : ''}`}
                                        onClick={() => handleTopicChange(topic)} 
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                    <div className="exam-page">  
                        <div className="page-header">
                            <h2>Practice Questions</h2>
                            <p className="results-info">
                                Showing {Math.min(displayCount, filteredQuestions.length)} of {filteredQuestions.length} questions
                            </p>
                        </div>

                        {/* Mobile Topic Row (hidden when sidebar is open) */}
                        <div className={`topic-row ${isSidebarOpen ? 'hidden' : ''}`}>
                            {topics.slice(0, 5).map(topic => (
                                <button 
                                    key={topic} 
                                    className={'topic-button' + (selectedTopic === topic ? ' active' : '')} 
                                    onClick={() => handleTopicChange(topic)} 
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>

                        <ol className="question-list">
                            {filteredQuestions.slice(0, displayCount).map((question, index) => (
                                <li className="question-item" key={index} onClick={() => navigate(`/practice/${question['Question ID']}`)}>
                                    <span className='question-unique-name'>{question.UniqueName}</span>
                                    <span className={`question-difficulty ${question.Difficulty.toLowerCase()}`}>{question.Difficulty}</span>
                                </li>
                            ))}
                        </ol>

                        {displayCount < filteredQuestions.length && (
                            <div className="load-more-container">
                                <button className="load-more-button" onClick={loadMore}>
                                    Load More ({Math.min(10, filteredQuestions.length - displayCount)} more)
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                {/* Overlay for mobile */}
                {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
            </div>
        </>
    );
};

export default ExamPage;
