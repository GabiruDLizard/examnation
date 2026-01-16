-- Simple readiness tracking table
CREATE TABLE student_readiness_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    week_date DATE NOT NULL,
    readiness_percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One record per student per class per week
    UNIQUE(student_id, class_id, week_date)
);

-- Basic indexes for queries
CREATE INDEX idx_readiness_student ON student_readiness_history(student_id, week_date);
CREATE INDEX idx_readiness_class ON student_readiness_history(class_id, week_date);