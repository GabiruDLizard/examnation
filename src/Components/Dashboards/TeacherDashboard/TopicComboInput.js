import React, { useState, useEffect, useRef } from 'react';
import { BiPlus } from 'react-icons/bi';

export const DEFAULT_TOPICS = [
    'Number Properties', 'Percentages', 'Ratios & Proportions', 'Speed/Distance/Time',
    'Algebra (Linear Equations)', 'Algebra (Simultaneous Equations)', 'Algebra (Quadratics)',
    'Algebra (Algebraic Fractions)', 'Sequences', 'Functions',
    'Coordinate Geometry', 'Graphs', 'Geometry (Angles/Triangles)',
    'Geometry (Circles/Area)', 'Geometry (Pythagoras)', 'Mensuration (Area/Volume)',
    'Trigonometry', 'Statistics (Mean/Median/Mode)', 'Probability',
    'Sets & Venn Diagrams', 'Number Theory', 'Sequences & Series',
    'Matrices & Transformations', 'Matrices', 'Vectors', 'Financial Mathematics'
];

const TopicComboInput = ({ value, onChange, availableTopics, onTopicCreated }) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const trimmed = inputValue.trim();
    const filtered = availableTopics.filter(t =>
        t.toLowerCase().includes(trimmed.toLowerCase())
    );
    const exactMatch = availableTopics.some(t => t.toLowerCase() === trimmed.toLowerCase());
    const showCreateOption = trimmed.length > 0 && !exactMatch;

    const selectTopic = (topic) => {
        setInputValue(topic);
        onChange(topic);
        setIsOpen(false);
    };

    const createTopic = () => {
        if (!trimmed) return;
        onTopicCreated(trimmed);
        onChange(trimmed);
        setIsOpen(false);
    };

    const dropdownStyles = {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
        marginTop: '2px',
        maxHeight: '220px',
        overflowY: 'auto',
    };

    const itemStyles = {
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#1e293b',
        borderBottom: '1px solid #f1f5f9',
    };

    const createItemStyles = {
        ...itemStyles,
        color: '#6366f1',
        fontWeight: 500,
        borderBottom: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <input
                type="text"
                placeholder="e.g. Algebra, Fractions, Probability"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                autoComplete="off"
            />
            {isOpen && (filtered.length > 0 || showCreateOption) && (
                <div style={dropdownStyles}>
                    {filtered.map((topic) => (
                        <div
                            key={topic}
                            style={itemStyles}
                            onMouseDown={(e) => { e.preventDefault(); selectTopic(topic); }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                        >
                            {topic}
                        </div>
                    ))}
                    {showCreateOption && (
                        <div
                            style={createItemStyles}
                            onMouseDown={(e) => { e.preventDefault(); createTopic(); }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f3ff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                        >
                            <BiPlus size={16} />
                            Create &ldquo;{trimmed}&rdquo; as new topic
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TopicComboInput;
