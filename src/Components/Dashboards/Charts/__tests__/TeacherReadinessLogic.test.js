import {
    generateClassReadinessData,
    generateClassColors,
    calculateTeacherStats,
} from '../TeacherReadinessLogic';

const classes = [{ name: 'Math 101' }, { name: 'Science 101' }];
const studentsData = [
    { className: 'Math 101', readiness: 60 },
    { className: 'Math 101', readiness: 80 },
    { className: 'Science 101', readiness: 50 },
    { className: 'Science 101', readiness: 70 },
];

describe('generateClassReadinessData', () => {
    it('returns the correct number of time-period entries', () => {
        expect(generateClassReadinessData(classes, studentsData, 8)).toHaveLength(8);
    });

    it('defaults to 8 periods when timeperiods is omitted', () => {
        expect(generateClassReadinessData(classes, studentsData)).toHaveLength(8);
    });

    it('each entry has a week label and a key per class', () => {
        const data = generateClassReadinessData(classes, studentsData, 4);
        data.forEach((pt, i) => {
            expect(pt.week).toBe(`Week ${i + 1}`);
            expect(pt).toHaveProperty('Math 101');
            expect(pt).toHaveProperty('Science 101');
        });
    });

    it('all readiness values are numbers in [0, 100]', () => {
        const data = generateClassReadinessData(classes, studentsData, 8);
        data.forEach((pt) => {
            classes.forEach(({ name }) => {
                expect(pt[name]).toBeGreaterThanOrEqual(0);
                expect(pt[name]).toBeLessThanOrEqual(100);
            });
        });
    });

    it('sets readiness to 0 for a class with no matching students', () => {
        const data = generateClassReadinessData([{ name: 'Empty Class' }], studentsData, 4);
        data.forEach((pt) => expect(pt['Empty Class']).toBe(0));
    });

    it('still generates week entries even with empty classes array', () => {
        const data = generateClassReadinessData([], [], 4);
        expect(data).toHaveLength(4);
        data.forEach((pt) => expect(pt).toHaveProperty('week'));
    });
});

describe('generateClassColors', () => {
    it('returns a colour for each class', () => {
        const colors = generateClassColors(classes);
        expect(colors).toHaveProperty('Math 101');
        expect(colors).toHaveProperty('Science 101');
    });

    it('each value is a CSS hex colour string', () => {
        const colors = generateClassColors(classes);
        Object.values(colors).forEach((c) => expect(c).toMatch(/^#[0-9a-fA-F]{6}$/));
    });

    it('cycles colours when there are more than 10 classes', () => {
        const many = Array.from({ length: 11 }, (_, i) => ({ name: `Class ${i + 1}` }));
        const colors = generateClassColors(many);
        // Palette has 10 entries, so Class 1 (index 0) === Class 11 (index 10 % 10 = 0)
        expect(colors['Class 1']).toBe(colors['Class 11']);
    });

    it('returns empty object for empty classes array', () => {
        expect(generateClassColors([])).toEqual({});
    });
});

describe('calculateTeacherStats', () => {
    it('returns zero defaults when given null', () => {
        const s = calculateTeacherStats(null);
        expect(s.averageReadiness).toBe(0);
        expect(s.totalClasses).toBe(0);
        expect(s.improvementTrend).toBe(0);
        expect(s.topPerformingClass).toBeNull();
    });

    it('returns zero defaults when given empty array', () => {
        const s = calculateTeacherStats([]);
        expect(s.averageReadiness).toBe(0);
        expect(s.totalClasses).toBe(0);
    });

    it('calculates averageReadiness from the latest week', () => {
        const data = [
            { week: 'Week 1', 'Math 101': 60, 'Science 101': 80 },
            { week: 'Week 2', 'Math 101': 70, 'Science 101': 90 },
        ];
        expect(calculateTeacherStats(data).averageReadiness).toBe(80);
    });

    it('calculates improvementTrend between first and last week', () => {
        const data = [
            { week: 'Week 1', 'Math 101': 50 },
            { week: 'Week 2', 'Math 101': 70 },
        ];
        expect(calculateTeacherStats(data).improvementTrend).toBeCloseTo(20, 1);
    });

    it('identifies the top performing class in the latest week', () => {
        const data = [
            { week: 'Week 1', 'Math 101': 60, 'Science 101': 80 },
            { week: 'Week 2', 'Math 101': 65, 'Science 101': 85 },
        ];
        const s = calculateTeacherStats(data);
        expect(s.topPerformingClass).toBe('Science 101');
        expect(s.topPerformingScore).toBe(85);
    });

    it('excludes classes with readiness=0 from totalClasses count', () => {
        const data = [{ week: 'Week 1', 'Math 101': 70, 'Empty Class': 0 }];
        expect(calculateTeacherStats(data).totalClasses).toBe(1);
    });
});
