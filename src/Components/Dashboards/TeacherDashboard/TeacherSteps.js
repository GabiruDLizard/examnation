const teacherSteps = [];

teacherSteps.push({
    id: 'welcome',
    title: 'Welcome to your Teacher Dashboard!',
    text: `This is your command center for managing classes and monitoring student readiness. Let's take a quick tour so we can get you up to speed on what's available.`,
});

teacherSteps.push({
    id: 'kpis',
    attachTo: { element: '.td-kpis', on: 'bottom' },
    title: 'Class Overview',
    text: `These cards will show your average class readiness, total student count, average score, and how many students are at risk — all updated as students practice and submit assignments.`
});

teacherSteps.push({
    id: 'chart',
    attachTo: { element: '.td-grid .panel-large', on: 'bottom' },
    title: 'Readiness Trends',
    text: `As your students practice, this chart will show readiness over time per class so you can quickly spot which classes are improving or falling behind.`
});

teacherSteps.push({
    id: 'heatmap',
    attachTo: { element: '.td-grid .panel-small', on: 'bottom' },
    title: 'Topic Mastery Heatmap',
    text: `This heatmap will show how well each student is performing across every topic at a glance. Green means strong, red means they need more work.`
});

teacherSteps.push({
    id: 'my-classes',
    attachTo: { element: '.td-nav', on: 'right' },
    title: 'My Classes',
    text: `View and manage all your classes, drill into individual student profiles, and see readiness breakdowns per class.`
});

teacherSteps.push({
    id: 'assignments',
    attachTo: { element: '.td-nav', on: 'right' },
    title: 'Assignments',
    text: `Create assignments for your classes, add questions from the library or write your own, and review and approve student submissions.`
});

teacherSteps.push({
    id: 'my-ta',
    attachTo: { element: '.td-nav', on: 'right' },
    title: 'My TA',
    text: `As students practice, you'll be able to see the mistake patterns appearing across your class — grouped by topic and mistake type — so you know exactly what to address in your next lesson.`
});

teacherSteps.push({
    id: 'reports',
    attachTo: { element: '.td-nav', on: 'right' },
    title: 'Reports',
    text: `Generate a full class report showing readiness trends, topic mastery, and individual student performance — downloadable as PDF or Excel.`
});

export default teacherSteps;
