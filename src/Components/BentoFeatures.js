import React, { useState } from 'react';
import './FeatureCards.css';
import {
    BiBarChart, BiBookOpen, BiBrain, BiBuilding,
    BiBullseye, BiChevronRight, BiClipboard,
    BiGroup, BiLineChart, BiLock, BiRocket,
    BiSearch, BiShield, BiSpreadsheet, BiStar,
    BiTrendingUp, BiUser, BiUpload, BiFile,
} from 'react-icons/bi';

const ROLES = ['Teacher', 'Student', 'Admin'];

const FEATURES = {
    Teacher: [
        {
            icon: <BiTrendingUp size={28} />,
            title: 'Class Readiness Dashboard',
            desc: "See every student's exam readiness by topic, updated every week — no manual tracking needed.",
        },
        {
            icon: <BiSearch size={28} />,
            title: 'At-Risk Detection',
            desc: 'Automatically flags students falling behind so you can intervene weeks before exam season.',
        },
        {
            icon: <BiBarChart size={28} />,
            title: 'Struggling Topics Panel',
            desc: 'Instantly see which topics your class is collectively weakest in, ranked by urgency.',
        },
        {
            icon: <BiClipboard size={28} />,
            title: 'Assignment Management',
            desc: 'Build assignments, set due dates, track every submission, and grade from one place.',
        },
        {
            icon: <BiBrain size={28} />,
            title: 'AI Mistake Patterns',
            desc: 'See the exact error types repeating across your class — Sign Errors, Wrong Formula, and more.',
        },
        {
            icon: <BiUser size={28} />,
            title: 'Student Profiles',
            desc: "Deep dive into any student's readiness history, topic mastery, and mistake patterns.",
        },
        {
            icon: <BiRocket size={28} />,
            title: 'Assign Curated Practice',
            desc: 'Push a personalized AI-built practice quiz directly to a struggling student.',
        },
        {
            icon: <BiFile size={28} />,
            title: 'Exportable Reports',
            desc: 'Generate class-wide performance reports in Excel or PDF for parents and administration.',
        },
        {
            icon: <BiStar size={28} />,
            title: 'Class Insights Summary',
            desc: 'Auto-generated weekly summary of your class weak spots — no data analysis required.',
        },
        {
            more: true,
            items: ['Question Library', 'Assignment Results', 'Weekly Readiness Charts', 'BGCSE-Aligned Content'],
        },
    ],
    Student: [
        {
            icon: <BiBrain size={28} />,
            title: 'My TA — AI Study Partner',
            desc: 'Learns exactly where you go wrong across every session and builds a custom quiz to fix it.',
        },
        {
            icon: <BiBullseye size={28} />,
            title: 'Adaptive Practice',
            desc: 'Questions adjust difficulty in real time based on how you answer — no wasted practice.',
        },
        {
            icon: <BiTrendingUp size={28} />,
            title: 'Live Readiness Score',
            desc: 'See exactly how exam-ready you are, by topic, updating every time you practice.',
        },
        {
            icon: <BiSearch size={28} />,
            title: 'Step-by-Step Error Detection',
            desc: 'AI finds the exact step in your working where you went wrong — not just the wrong answer.',
        },
        {
            icon: <BiLineChart size={28} />,
            title: 'Mistake Pattern Tracking',
            desc: 'Tracks which errors keep repeating and shows when they move from Active → Improving → Resolved.',
        },
        {
            icon: <BiBookOpen size={28} />,
            title: 'Curated Practice Quiz',
            desc: 'Auto-built from your weakest areas so every study session targets the gaps that matter.',
        },
        {
            icon: <BiBarChart size={28} />,
            title: 'Topic Mastery Breakdown',
            desc: 'Visual mastery bars for every topic so you always know where to focus next.',
        },
        {
            icon: <BiClipboard size={28} />,
            title: 'Study History',
            desc: 'Full log of every practice session, assignment, and test with scores and question-level detail.',
        },
        {
            icon: <BiSpreadsheet size={28} />,
            title: 'BGCSE-Aligned Questions',
            desc: 'Every question is built around the curriculum you are actually being tested on. No filler.',
        },
        {
            more: true,
            items: ['Progress Charts Over Time', 'Assignment Submissions', 'Assignment Review & Feedback', 'Onboarding Tour'],
        },
    ],
    Admin: [
        {
            icon: <BiBuilding size={28} />,
            title: 'School-Wide Dashboard',
            desc: 'Overview of all classes, readiness scores, and performance across your entire school.',
        },
        {
            icon: <BiUpload size={28} />,
            title: 'Bulk Student Import',
            desc: 'Upload your entire student body in minutes via CSV — no manual entry needed.',
        },
        {
            icon: <BiGroup size={28} />,
            title: 'Class & Teacher Management',
            desc: 'Create classes, assign teachers, and manage the full school structure from one place.',
        },
        {
            icon: <BiFile size={28} />,
            title: 'School-Level Reports',
            desc: 'Performance reports across all classes for leadership decisions and MOE compliance.',
        },
        {
            icon: <BiShield size={28} />,
            title: 'Role-Based Access',
            desc: 'Teachers see their classes. Admins see everything. Students see their own data. Clean and secure.',
        },
        {
            icon: <BiLock size={28} />,
            title: 'Secure Authentication',
            desc: 'Token-based login with protected routes — student data stays safe.',
        },
        {
            more: true,
            items: ['Multi-Class Support', 'Student Progress Visibility', 'Teacher Assignment Oversight', 'Notification System'],
        },
    ],
};

export default function BentoFeatures() {
    const [activeRole, setActiveRole] = useState('Teacher');
    const cards = FEATURES[activeRole];

    return (
        <section id="features" className="fc-section">
            {/* Section heading */}
            <div className="fc-heading">
                <p className="fc-eyebrow">Everything you need</p>
                <h2 className="fc-title">Built for the whole school</h2>
                <p className="fc-subtitle">
                    Switch between roles to see how Examnation works for everyone.
                </p>
            </div>

            {/* Role tabs */}
            <div className="fc-tabs">
                {ROLES.map(role => (
                    <button
                        key={role}
                        className={`fc-tab ${activeRole === role ? 'active' : ''}`}
                        onClick={() => setActiveRole(role)}
                    >
                        {role}
                    </button>
                ))}
            </div>

            {/* Cards grid */}
            <div className="fc-grid">
                {cards.map((card, i) =>
                    card.more ? (
                        <div key={i} className="fc-card fc-card-more">
                            <div className="fc-more-title">And more</div>
                            <ul className="fc-more-list">
                                {card.items.map((item, j) => (
                                    <li key={j}>
                                        <BiChevronRight size={16} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button className="fc-more-btn" onClick={() => {
                                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                Request full demo →
                            </button>
                        </div>
                    ) : (
                        <div key={i} className="fc-card">
                            <div className="fc-icon">{card.icon}</div>
                            <h3 className="fc-card-title">{card.title}</h3>
                            <p className="fc-card-desc">{card.desc}</p>
                        </div>
                    )
                )}
            </div>
        </section>
    );
}
