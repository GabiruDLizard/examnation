-- Assignment System Extension
-- This extends the existing assignments table with additional functionality

-- Table to link assignments with specific questions
CREATE TABLE assignment_questions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    points_worth DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, question_id),
    UNIQUE(assignment_id, question_order)
);

-- Table to track student submissions for assignments
CREATE TABLE assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, submitted, graded
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    time_spent_minutes INTEGER DEFAULT 0,
    auto_save_data JSONB, -- Store progress for auto-save functionality
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

-- Table to store student answers for specific assignment questions
CREATE TABLE assignment_answers (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    student_answer TEXT,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    answer_steps JSONB, -- Store step-by-step solution if applicable
    feedback TEXT, -- Teacher feedback on this specific answer
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, question_id)
);

-- Table to store overall grades for assignment submissions
CREATE TABLE assignment_grades (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    points_earned DECIMAL(8,2) NOT NULL,
    points_possible DECIMAL(8,2) NOT NULL,
    percentage_score DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN points_possible > 0 THEN ROUND((points_earned / points_possible) * 100, 2)
            ELSE 0 
        END
    ) STORED,
    letter_grade VARCHAR(5),
    teacher_feedback TEXT,
    graded_by INTEGER REFERENCES users(id),
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_excused BOOLEAN DEFAULT FALSE,
    late_penalty DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id)
);

-- Table for assignment rubrics (optional - for detailed grading criteria)
CREATE TABLE assignment_rubrics (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    criteria_name VARCHAR(255) NOT NULL,
    criteria_description TEXT,
    max_points DECIMAL(5,2) NOT NULL,
    weight_percentage DECIMAL(5,2) DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store rubric-based grades for submissions
CREATE TABLE assignment_rubric_grades (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    rubric_id INTEGER REFERENCES assignment_rubrics(id) ON DELETE CASCADE,
    points_earned DECIMAL(5,2) NOT NULL,
    teacher_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, rubric_id)
);

-- Add indexes for performance
CREATE INDEX idx_assignment_questions_assignment_id ON assignment_questions(assignment_id);
CREATE INDEX idx_assignment_questions_question_id ON assignment_questions(question_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX idx_assignment_submissions_status ON assignment_submissions(submission_status);
CREATE INDEX idx_assignment_answers_submission_id ON assignment_answers(submission_id);
CREATE INDEX idx_assignment_answers_question_id ON assignment_answers(question_id);
CREATE INDEX idx_assignment_grades_submission_id ON assignment_grades(submission_id);
CREATE INDEX idx_assignment_rubrics_assignment_id ON assignment_rubrics(assignment_id);

-- Add some useful views for common queries
CREATE VIEW assignment_overview AS
SELECT 
    a.id,
    a.title,
    a.description,
    a.due_date,
    a.points_possible,
    a.assignment_type,
    a.status,
    c.name as class_name,
    c.subject,
    CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
    COUNT(DISTINCT aq.question_id) as question_count,
    COUNT(DISTINCT as_sub.student_id) as submission_count,
    COUNT(DISTINCT CASE WHEN as_sub.submission_status = 'submitted' THEN as_sub.student_id END) as completed_submissions
FROM assignments a
LEFT JOIN classes c ON a.class_id = c.id
LEFT JOIN users u ON a.teacher_id = u.id
LEFT JOIN assignment_questions aq ON a.id = aq.assignment_id
LEFT JOIN assignment_submissions as_sub ON a.id = as_sub.assignment_id
GROUP BY a.id, a.title, a.description, a.due_date, a.points_possible, 
         a.assignment_type, a.status, c.name, c.subject, u.first_name, u.last_name;

-- View for student assignment progress
CREATE VIEW student_assignment_progress AS
SELECT 
    a.id as assignment_id,
    a.title,
    a.due_date,
    a.points_possible,
    c.name as class_name,
    c.subject,
    s.student_id,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    s.submission_status,
    s.started_at,
    s.submitted_at,
    s.time_spent_minutes,
    g.points_earned,
    g.percentage_score,
    g.letter_grade,
    CASE 
        WHEN a.due_date < NOW() AND s.submission_status != 'submitted' THEN TRUE 
        ELSE FALSE 
    END as is_late
FROM assignments a
LEFT JOIN classes c ON a.class_id = c.id
LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
LEFT JOIN users u ON s.student_id = u.id
LEFT JOIN assignment_grades g ON s.id = g.submission_id;

-- Add some sample data for testing
INSERT INTO assignment_questions (assignment_id, question_id, question_order, points_worth)
SELECT 
    1, -- Assuming assignment ID 1 exists
    q.id,
    ROW_NUMBER() OVER (ORDER BY q.id),
    2.5
FROM questions q
LIMIT 10;

-- Add triggers to update assignment status based on submissions
CREATE OR REPLACE FUNCTION update_assignment_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_submission_update_timestamp
    BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_submission_timestamp();

-- Function to auto-calculate assignment grades from question scores
CREATE OR REPLACE FUNCTION calculate_assignment_grade(submission_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    total_points_earned DECIMAL(8,2);
    total_points_possible DECIMAL(8,2);
    submission_record RECORD;
BEGIN
    -- Get submission details
    SELECT * INTO submission_record 
    FROM assignment_submissions 
    WHERE id = submission_id_param;
    
    -- Calculate total points from assignment answers
    SELECT 
        COALESCE(SUM(aa.points_earned), 0),
        COALESCE(SUM(aq.points_worth), 0)
    INTO total_points_earned, total_points_possible
    FROM assignment_answers aa
    JOIN assignment_questions aq ON aa.question_id = aq.question_id 
        AND aq.assignment_id = submission_record.assignment_id
    WHERE aa.submission_id = submission_id_param;
    
    -- Insert or update grade record
    INSERT INTO assignment_grades (submission_id, points_earned, points_possible)
    VALUES (submission_id_param, total_points_earned, total_points_possible)
    ON CONFLICT (submission_id) 
    DO UPDATE SET 
        points_earned = EXCLUDED.points_earned,
        points_possible = EXCLUDED.points_possible,
        graded_at = CURRENT_TIMESTAMP;
        
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate grades when assignment answers are updated
CREATE OR REPLACE FUNCTION trigger_calculate_assignment_grade()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_assignment_grade(NEW.submission_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_answer_grade_calculation
    AFTER INSERT OR UPDATE ON assignment_answers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_assignment_grade();