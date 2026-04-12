// ─────────────────────────────────────────────────────────────────────────────
// DEMO MODE — set to false to restore live data across all pages
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_MODE = false;

// ── Shared constants ──────────────────────────────────────────────────────────

export const DEMO_CLASSES = [
    { id: 1, classId: 1, name: 'Form 5A Mathematics', subject: 'Mathematics', color: '#3b82f6', studentCount: 8, description: 'Advanced Mathematics — BGCSE preparation' },
    { id: 2, classId: 2, name: 'Form 4B Mathematics', subject: 'Mathematics', color: '#10b981', studentCount: 6, description: 'Core Mathematics curriculum' },
    { id: 3, classId: 3, name: 'Form 3 Science',      subject: 'Science',     color: '#8b5cf6', studentCount: 7, description: 'Integrated Science' },
];

export const DEMO_STUDENTS = [
    { id: 1, studentId: 1, name: 'Alex Brown',    firstName: 'Alex',    lastName: 'Brown',   username: 'alex.brown' },
    { id: 2, studentId: 2, name: 'Emma Clarke',   firstName: 'Emma',    lastName: 'Clarke',  username: 'emma.clarke' },
    { id: 3, studentId: 3, name: 'Jordan Davis',  firstName: 'Jordan',  lastName: 'Davis',   username: 'jordan.davis' },
    { id: 4, studentId: 4, name: 'Maya Johnson',  firstName: 'Maya',    lastName: 'Johnson', username: 'maya.johnson' },
    { id: 5, studentId: 5, name: 'Noah Martinez', firstName: 'Noah',    lastName: 'Martinez',username: 'noah.martinez' },
    { id: 6, studentId: 6, name: 'Olivia Smith',  firstName: 'Olivia',  lastName: 'Smith',   username: 'olivia.smith' },
    { id: 7, studentId: 7, name: 'Ryan Taylor',   firstName: 'Ryan',    lastName: 'Taylor',  username: 'ryan.taylor' },
    { id: 8, studentId: 8, name: 'Sophie Wilson', firstName: 'Sophie',  lastName: 'Wilson',  username: 'sophie.wilson' },
];

const TOPICS = [
    'Algebra (Linear Equations)',
    'Algebra (Quadratics)',
    'Coordinate Geometry',
    'Geometry (Circles/Area)',
    'Mensuration (Area/Volume)',
    'Number Properties',
    'Percentages',
    'Probability',
    'Sequences',
    'Statistics',
];

// ── Teacher Dashboard overview ────────────────────────────────────────────────

export const DEMO_TEACHER_INFO = {
    id: 1,
    firstName: 'Mrs.',
    lastName: 'Thompson',
    username: 'j.thompson',
    email: 'j.thompson@excelsioracademy.edu',
    role: 'Teacher',
};

export const DEMO_TEACHER_STATS = {
    totalQuestions: 284,
    avgScore: 72,
    avgReadiness: 68,
    averageReadiness: 68,
    totalStudents: 21,
    improvementTrend: 5,
};

export const DEMO_STUDENT_RANKING = [
    { id: 1, name: 'Alex Brown',    className: 'Form 5A Mathematics', readiness: 88, averageScore: 84, improvement: 12 },
    { id: 2, name: 'Emma Clarke',   className: 'Form 5A Mathematics', readiness: 82, averageScore: 79, improvement: 8  },
    { id: 4, name: 'Maya Johnson',  className: 'Form 5A Mathematics', readiness: 78, averageScore: 74, improvement: 10 },
    { id: 6, name: 'Olivia Smith',  className: 'Form 4B Mathematics', readiness: 72, averageScore: 70, improvement: 6  },
    { id: 3, name: 'Jordan Davis',  className: 'Form 5A Mathematics', readiness: 62, averageScore: 60, improvement: 4  },
    { id: 8, name: 'Sophie Wilson', className: 'Form 4B Mathematics', readiness: 55, averageScore: 52, improvement: 3  },
    { id: 7, name: 'Ryan Taylor',   className: 'Form 5A Mathematics', readiness: 48, averageScore: 45, improvement: -2 },
    { id: 5, name: 'Noah Martinez', className: 'Form 5A Mathematics', readiness: 40, averageScore: 38, improvement: -4 },
];

export const DEMO_READINESS_CHART = [
    { week: 'Jan W1', 'Form 5A Mathematics': 52, 'Form 4B Mathematics': 48, 'Form 3 Science': 44 },
    { week: 'Jan W2', 'Form 5A Mathematics': 55, 'Form 4B Mathematics': 50, 'Form 3 Science': 46 },
    { week: 'Jan W3', 'Form 5A Mathematics': 58, 'Form 4B Mathematics': 53, 'Form 3 Science': 49 },
    { week: 'Jan W4', 'Form 5A Mathematics': 60, 'Form 4B Mathematics': 55, 'Form 3 Science': 51 },
    { week: 'Feb W1', 'Form 5A Mathematics': 63, 'Form 4B Mathematics': 57, 'Form 3 Science': 53 },
    { week: 'Feb W2', 'Form 5A Mathematics': 65, 'Form 4B Mathematics': 60, 'Form 3 Science': 55 },
    { week: 'Feb W3', 'Form 5A Mathematics': 67, 'Form 4B Mathematics': 62, 'Form 3 Science': 58 },
    { week: 'Feb W4', 'Form 5A Mathematics': 70, 'Form 4B Mathematics': 64, 'Form 3 Science': 60 },
    { week: 'Mar W1', 'Form 5A Mathematics': 72, 'Form 4B Mathematics': 66, 'Form 3 Science': 62 },
    { week: 'Mar W2', 'Form 5A Mathematics': 74, 'Form 4B Mathematics': 68, 'Form 3 Science': 64 },
];

export const DEMO_HEATMAP = {
    topics: TOPICS,
    students: ['Alex B.', 'Emma C.', 'Jordan D.', 'Maya J.', 'Noah M.', 'Olivia S.', 'Ryan T.', 'Sophie W.'],
    grid: [
        [0.92, 0.75, 0.60, 0.88, 0.45, 0.70, 0.83, 0.55],
        [0.78, 0.55, 0.40, 0.72, 0.30, 0.65, 0.90, 0.48],
        [0.85, 0.90, 0.72, 0.60, 0.80, 0.55, 0.78, 0.92],
        [0.60, 0.82, 0.88, 0.45, 0.92, 0.70, 0.50, 0.75],
        [0.70, 0.65, 0.55, 0.80, 0.60, 0.88, 0.72, 0.40],
        [0.95, 0.80, 0.75, 0.92, 0.55, 0.78, 0.60, 0.85],
        [0.50, 0.45, 0.88, 0.70, 0.75, 0.40, 0.92, 0.65],
        [0.80, 0.70, 0.65, 0.55, 0.88, 0.92, 0.45, 0.78],
        [0.72, 0.88, 0.80, 0.65, null, 0.60, 0.85, 0.70],
        [0.65, 0.60, 0.92, 0.78, 0.70, 0.85, 0.55, null],
    ],
};

export const DEMO_WEAK_SPOTS = [
    { topic: 'Algebra (Quadratics)',      strugglingCount: 5, totalCount: 8, avgReadiness: 42, pctStruggling: 63 },
    { topic: 'Probability',               strugglingCount: 4, totalCount: 8, avgReadiness: 48, pctStruggling: 50 },
    { topic: 'Mensuration (Area/Volume)', strugglingCount: 3, totalCount: 8, avgReadiness: 51, pctStruggling: 38 },
    { topic: 'Sequences',                 strugglingCount: 2, totalCount: 8, avgReadiness: 55, pctStruggling: 25 },
];

// ── Teacher MyClasses ─────────────────────────────────────────────────────────

export const DEMO_TEACHER_CLASSES = DEMO_CLASSES.map(c => ({
    ...c,
    studentcount: c.studentCount,
    totalAssignments: 4,
    createdAt: '2025-09-01T08:00:00Z',
}));

export const DEMO_TEACHER_ASSIGNMENTS = {
    1: [
        { id: 1, title: 'Quadratics Practice',       status: 'active',   dueDate: '2026-04-20T23:59:00Z', assignmentType: 'homework' },
        { id: 2, title: 'Linear Equations Review',   status: 'active',   dueDate: '2026-04-18T23:59:00Z', assignmentType: 'homework' },
        { id: 3, title: 'Mid-Term Revision',         status: 'active',   dueDate: '2026-04-25T23:59:00Z', assignmentType: 'test' },
        { id: 4, title: 'Coordinate Geometry',       status: 'graded',   dueDate: '2026-04-10T23:59:00Z', assignmentType: 'homework' },
    ],
    2: [
        { id: 5, title: 'Percentages & Ratios',      status: 'active',   dueDate: '2026-04-19T23:59:00Z', assignmentType: 'homework' },
        { id: 6, title: 'Statistics Worksheet',      status: 'active',   dueDate: '2026-04-22T23:59:00Z', assignmentType: 'homework' },
        { id: 7, title: 'Number Properties Quiz',    status: 'graded',   dueDate: '2026-04-08T23:59:00Z', assignmentType: 'quiz' },
    ],
    3: [
        { id: 8,  title: 'Forces & Motion',          status: 'active',   dueDate: '2026-04-21T23:59:00Z', assignmentType: 'homework' },
        { id: 9,  title: 'Chemical Reactions',       status: 'graded',   dueDate: '2026-04-09T23:59:00Z', assignmentType: 'homework' },
    ],
};

// ── Student Dashboard overview ────────────────────────────────────────────────

export const DEMO_STUDENT_INFO = {
    id: 33,
    firstName: 'Jordan',
    lastName: 'Davis',
    username: 'jordan.davis',
    email: 'jordan.davis@student.edu',
    role: 'Student',
};

export const DEMO_STUDENT_STATS = {
    qAnswered: 147,
    correctAns: 103,
    averageCorrectness: 70,
};

export const DEMO_READINESS_SCORES = [
    { date: '2026-01-06', abilityEstimate: -1.2 },
    { date: '2026-01-13', abilityEstimate: -0.9 },
    { date: '2026-01-20', abilityEstimate: -0.6 },
    { date: '2026-01-27', abilityEstimate: -0.3 },
    { date: '2026-02-03', abilityEstimate:  0.1 },
    { date: '2026-02-10', abilityEstimate:  0.4 },
    { date: '2026-02-17', abilityEstimate:  0.6 },
    { date: '2026-02-24', abilityEstimate:  0.8 },
    { date: '2026-03-03', abilityEstimate:  1.0 },
    { date: '2026-03-10', abilityEstimate:  1.2 },
    { date: '2026-03-17', abilityEstimate:  1.4 },
    { date: '2026-03-24', abilityEstimate:  1.5 },
];

export const DEMO_CLASS_READINESS_HISTORY = [
    { weekDate: '2026-01-06', readinessPercentage: 48 },
    { weekDate: '2026-01-13', readinessPercentage: 51 },
    { weekDate: '2026-01-20', readinessPercentage: 54 },
    { weekDate: '2026-01-27', readinessPercentage: 57 },
    { weekDate: '2026-02-03', readinessPercentage: 60 },
    { weekDate: '2026-02-10', readinessPercentage: 63 },
    { weekDate: '2026-02-17', readinessPercentage: 65 },
    { weekDate: '2026-02-24', readinessPercentage: 67 },
    { weekDate: '2026-03-03', readinessPercentage: 69 },
    { weekDate: '2026-03-10', readinessPercentage: 71 },
];

// ── Student MyClasses ─────────────────────────────────────────────────────────

export const DEMO_STUDENT_CLASSES = [
    {
        classId: 1, name: 'Form 5A Mathematics', subject: 'Mathematics', color: '#3b82f6',
        teacherName: 'Mrs. Thompson', actualTotalAssignments: 4,
        assignments: DEMO_TEACHER_ASSIGNMENTS[1],
        assignmentIds: [1, 2, 3, 4],
    },
    {
        classId: 2, name: 'Form 4B Mathematics', subject: 'Mathematics', color: '#10b981',
        teacherName: 'Mrs. Thompson', actualTotalAssignments: 3,
        assignments: DEMO_TEACHER_ASSIGNMENTS[2],
        assignmentIds: [5, 6, 7],
    },
];

// ── Teacher TA page ───────────────────────────────────────────────────────────

export const DEMO_TA_PATTERNS = [
    { topic: 'Algebra (Quadratics)',      mistakeType: 'Sign Error',          count: 14, studentCount: 5 },
    { topic: 'Algebra (Quadratics)',      mistakeType: 'Arithmetic Error',     count: 9,  studentCount: 4 },
    { topic: 'Coordinate Geometry',       mistakeType: 'Wrong Formula',        count: 11, studentCount: 4 },
    { topic: 'Probability',               mistakeType: 'Conceptual Error',     count: 8,  studentCount: 3 },
    { topic: 'Probability',               mistakeType: 'Arithmetic Error',     count: 6,  studentCount: 3 },
    { topic: 'Mensuration (Area/Volume)', mistakeType: 'Wrong Formula',        count: 7,  studentCount: 3 },
    { topic: 'Mensuration (Area/Volume)', mistakeType: 'Distribution Error',   count: 4,  studentCount: 2 },
    { topic: 'Sequences',                 mistakeType: 'Arithmetic Error',     count: 5,  studentCount: 2 },
    { topic: 'Statistics',                mistakeType: 'Incomplete Solution',  count: 6,  studentCount: 2 },
    { topic: 'Number Properties',         mistakeType: 'Wrong Operation',      count: 4,  studentCount: 2 },
];

export const DEMO_TA_STRUGGLING = [
    { studentId: 5, name: 'Noah Martinez', mistakeCount: 18, topTopic: 'Algebra (Quadratics)',      topMistakeType: 'Sign Error' },
    { studentId: 7, name: 'Ryan Taylor',   mistakeCount: 15, topTopic: 'Probability',               topMistakeType: 'Conceptual Error' },
    { studentId: 8, name: 'Sophie Wilson', mistakeCount: 12, topTopic: 'Coordinate Geometry',       topMistakeType: 'Wrong Formula' },
    { studentId: 3, name: 'Jordan Davis',  mistakeCount: 10, topTopic: 'Mensuration (Area/Volume)', topMistakeType: 'Wrong Formula' },
    { studentId: 6, name: 'Olivia Smith',  mistakeCount: 8,  topTopic: 'Sequences',                 topMistakeType: 'Arithmetic Error' },
];

// ── Student TA page ───────────────────────────────────────────────────────────

export const DEMO_STUDENT_MISTAKES = [
    {
        id: 1, topic: 'Algebra (Quadratics)', difficulty: 'Medium',
        questionText: 'Solve for x: $2x^2 + 7x - 9 = 0$',
        studentAnswer: 'x = 1, x = -4', correctAnswer: 'x = 1, x = -4.5',
        mistakeType: 'Arithmetic Error',
        workingSteps: '2x^2 + 7x - 9 = 0\n\\Delta = 49 + 72 = 121\nx = \\frac{-7 \\pm 11}{4}',
        firstErrorStep: 2,
        errorReason: 'Denominator should be 2a = 4, but the division was applied incorrectly.',
    },
    {
        id: 2, topic: 'Coordinate Geometry', difficulty: 'Easy',
        questionText: 'Find the gradient of the line joining $(-1, 2)$ and $(5, 0)$.',
        studentAnswer: '\\frac{1}{3}', correctAnswer: '-\\frac{1}{3}',
        mistakeType: 'Sign Error',
        workingSteps: 'm = \\frac{0-2}{5-(-1)}\nm = \\frac{-2}{6}',
        firstErrorStep: 0,
        errorReason: 'Sign lost when computing the numerator: 0 − 2 = −2, not +2.',
    },
    {
        id: 3, topic: 'Probability', difficulty: 'Medium',
        questionText: 'A bag has 7 red and 3 blue marbles. What is P(not blue)?',
        studentAnswer: '\\frac{3}{10}', correctAnswer: '\\frac{7}{10}',
        mistakeType: 'Conceptual Error',
        workingSteps: 'P(blue) = \\frac{3}{10}\nP(not blue) = \\frac{3}{10}',
        firstErrorStep: 1,
        errorReason: 'P(not blue) = 1 − P(blue), not P(blue) itself.',
    },
];

export const DEMO_STUDENT_PATTERNS = {
    'Algebra (Quadratics)': [
        { mistakeType: 'Arithmetic Error', count: 5 },
        { mistakeType: 'Sign Error',       count: 3 },
    ],
    'Coordinate Geometry': [
        { mistakeType: 'Sign Error',       count: 4 },
        { mistakeType: 'Wrong Formula',    count: 2 },
    ],
    'Probability': [
        { mistakeType: 'Conceptual Error', count: 3 },
        { mistakeType: 'Arithmetic Error', count: 1 },
    ],
};

export const DEMO_TOPIC_ABILITY = {
    'Algebra (Quadratics)':      38,
    'Coordinate Geometry':       45,
    'Probability':               42,
    'Algebra (Linear Equations)':72,
    'Number Properties':         80,
    'Percentages':               68,
    'Sequences':                 55,
    'Statistics':                60,
};

export const DEMO_CURATED = {
    questionIds: [12, 34, 57, 89, 103],
    focusTopics: ['Algebra (Quadratics)', 'Coordinate Geometry', 'Probability'],
};

// ── Teacher Reports ───────────────────────────────────────────────────────────

export const DEMO_REPORT_CHART = DEMO_READINESS_CHART;

export const DEMO_REPORT_STUDENTS = [
    { id: 1, name: 'Alex Brown',    className: 'Form 5A Mathematics', readiness: 88, avgScore: 84, improvement: 12 },
    { id: 2, name: 'Emma Clarke',   className: 'Form 5A Mathematics', readiness: 82, avgScore: 79, improvement: 8  },
    { id: 4, name: 'Maya Johnson',  className: 'Form 5A Mathematics', readiness: 78, avgScore: 74, improvement: 10 },
    { id: 6, name: 'Olivia Smith',  className: 'Form 4B Mathematics', readiness: 72, avgScore: 70, improvement: 6  },
    { id: 1, name: 'Alex Brown',    className: 'Form 4B Mathematics', readiness: 68, avgScore: 65, improvement: 5  },
    { id: 3, name: 'Jordan Davis',  className: 'Form 5A Mathematics', readiness: 62, avgScore: 60, improvement: 4  },
    { id: 8, name: 'Sophie Wilson', className: 'Form 4B Mathematics', readiness: 55, avgScore: 52, improvement: 3  },
    { id: 7, name: 'Ryan Taylor',   className: 'Form 5A Mathematics', readiness: 48, avgScore: 45, improvement: -2 },
    { id: 5, name: 'Noah Martinez', className: 'Form 5A Mathematics', readiness: 40, avgScore: 38, improvement: -4 },
];

export const DEMO_REPORT_TOPICS = [
    { className: 'Form 5A Mathematics', topic: 'Algebra (Quadratics)',      avgReadiness: 42, studentsStruggling: 5, totalStudents: 8 },
    { className: 'Form 5A Mathematics', topic: 'Probability',               avgReadiness: 48, studentsStruggling: 4, totalStudents: 8 },
    { className: 'Form 4B Mathematics', topic: 'Mensuration (Area/Volume)', avgReadiness: 51, studentsStruggling: 3, totalStudents: 6 },
    { className: 'Form 5A Mathematics', topic: 'Sequences',                 avgReadiness: 55, studentsStruggling: 2, totalStudents: 8 },
    { className: 'Form 4B Mathematics', topic: 'Coordinate Geometry',       avgReadiness: 60, studentsStruggling: 2, totalStudents: 6 },
    { className: 'Form 5A Mathematics', topic: 'Statistics',                avgReadiness: 65, studentsStruggling: 1, totalStudents: 8 },
    { className: 'Form 5A Mathematics', topic: 'Number Properties',         avgReadiness: 78, studentsStruggling: 0, totalStudents: 8 },
    { className: 'Form 5A Mathematics', topic: 'Percentages',               avgReadiness: 82, studentsStruggling: 0, totalStudents: 8 },
];

export const DEMO_REPORT_KPIS = {
    avgReadiness: 66,
    atRisk: 3,
    totalStudents: 21,
    avgImprovement: 5,
};
