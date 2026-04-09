const studentSteps = [];

studentSteps.push({
    id: 'welcome',
    title: 'Welcome to your Student Dashboard!',
    text: `This is your home base for BGCSE exam prep. Let's take a quick tour so we can get you up to speed on everything that's available.`,
});

studentSteps.push({
    id: 'kpis',
    attachTo: { element: '.sd-kpis', on: 'bottom' },
    title: 'Your Readiness at a Glance',
    text: `These cards will show your current readiness score, total questions answered, overall accuracy, and recent session count — all updated every time you practice.`
});

studentSteps.push({
    id: 'chart',
    attachTo: { element: '.panel-large', on: 'bottom' },
    title: 'Readiness Over Time',
    text: `As you practice, this chart will track how your readiness score changes over time. You can switch between your personal progress view and a breakdown by class.`
});

studentSteps.push({
    id: 'quick-actions',
    attachTo: { element: '.panel-small', on: 'left' },
    title: 'Quick Actions',
    text: `Jump straight into a practice session, take an adaptive test, check your study history, or head to your TA — all from right here.`
});

studentSteps.push({
    id: 'my-classes',
    attachTo: { element: '.sd-nav', on: 'right' },
    title: 'My Classes',
    text: `Here you'll find all the classes your teacher has enrolled you in. You can track assignment submissions and check your readiness score per subject.`
});

studentSteps.push({
    id: 'study-history',
    attachTo: { element: '.sd-nav', on: 'right' },
    title: 'Study History',
    text: `Every practice session and assignment you complete will be logged here. Expand any entry to review the full questions, your working, and the correct answers.`
});

studentSteps.push({
    id: 'my-ta',
    attachTo: { element: '.sd-nav', on: 'right' },
    title: 'My TA',
    text: `Your AI teaching assistant. As you practice, it will track the mistakes you keep making, group them by topic, and tell you exactly what to fix before exam day.`
});

export default studentSteps;
