import {
    createTeacherClass,
    searchStudents,
    enrollStudentByIdentifier,
    recordStudentReadiness,
    getStudentTopicAbility,
} from '../TeacherDashboardService';

jest.mock('../../../../utils/api', () => ({
    authFetch: jest.fn(),
}));
jest.mock('../../../../utils/tokenUtils', () => ({
    __esModule: true,
    getUserIdFromToken: jest.fn(() => '7'),
}));

import { authFetch } from '../../../../utils/api';
import { getUserIdFromToken } from '../../../../utils/tokenUtils';

function ok(body) { return { ok: true, json: async () => body, text: async () => '' }; }
function err(status = 500) { return { ok: false, status, json: async () => ({}), text: async () => 'error' }; }

// CRA sets resetMocks: true, which clears mock implementations between tests.
// Re-establish default return values before each test.
beforeEach(() => {
    authFetch.mockReset();
    getUserIdFromToken.mockReturnValue('7');
});

describe('createTeacherClass()', () => {
    it('reads teacherId from the JWT token and parses it as an integer', async () => {
        authFetch.mockResolvedValueOnce(ok({ id: 1, name: 'Math 101' }));
        await createTeacherClass({ name: 'Math 101', subject: 'Math', gradeLevel: '10' });
        const [, options] = authFetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.teacherId).toBe(7);        // parseInt('7') === 7
        expect(typeof body.teacherId).toBe('number');
    });

    it('POSTs to /class', async () => {
        authFetch.mockResolvedValueOnce(ok({ id: 1 }));
        await createTeacherClass({ name: 'Science', subject: 'Science', gradeLevel: '9' });
        const [url, options] = authFetch.mock.calls[0];
        expect(url).toBe('/class');
        expect(options.method).toBe('POST');
    });

    it('defaults durationMinutes to 50 when not provided', async () => {
        authFetch.mockResolvedValueOnce(ok({ id: 1 }));
        await createTeacherClass({ name: 'English', subject: 'English', gradeLevel: '11' });
        const [, options] = authFetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.durationMinutes).toBe(50);
    });
});

describe('searchStudents()', () => {
    it('returns [] immediately without a network call when query is under 2 chars', async () => {
        const result = await searchStudents('a');
        expect(result).toEqual([]);
        expect(authFetch).not.toHaveBeenCalled();
    });

    it('returns [] for empty string without a network call', async () => {
        const result = await searchStudents('');
        expect(result).toEqual([]);
        expect(authFetch).not.toHaveBeenCalled();
    });

    it('returns [] for null/undefined without a network call', async () => {
        const result = await searchStudents(null);
        expect(result).toEqual([]);
        expect(authFetch).not.toHaveBeenCalled();
    });

    it('makes a network call when query is 2+ characters', async () => {
        authFetch.mockResolvedValueOnce(ok([{ id: 1, firstName: 'Jane' }]));
        const result = await searchStudents('ja');
        expect(authFetch).toHaveBeenCalledTimes(1);
        expect(result).toEqual([{ id: 1, firstName: 'Jane' }]);
    });
});

describe('enrollStudentByIdentifier()', () => {
    it('uses the email endpoint when identifier contains @', async () => {
        // lookup by email
        authFetch.mockResolvedValueOnce(ok({ id: 10, email: 'jane@test.com' }));
        // enroll
        authFetch.mockResolvedValueOnce(ok({ id: 1 }));

        await enrollStudentByIdentifier(5, 'jane@test.com');

        const [lookupUrl] = authFetch.mock.calls[0];
        expect(lookupUrl).toContain('/user/email/jane@test.com');
    });

    it('uses the user ID endpoint when identifier has no @', async () => {
        authFetch.mockResolvedValueOnce(ok({ id: 10 }));
        authFetch.mockResolvedValueOnce(ok({ id: 1 }));

        await enrollStudentByIdentifier(5, '10');

        const [lookupUrl] = authFetch.mock.calls[0];
        expect(lookupUrl).toContain('/user/10');
        expect(lookupUrl).not.toContain('/email/');
    });

    it('throws when student is not found by email', async () => {
        authFetch.mockResolvedValueOnce(err(404));
        await expect(enrollStudentByIdentifier(5, 'notfound@test.com'))
            .rejects.toThrow('Student not found');
    });
});

describe('recordStudentReadiness()', () => {
    it('POSTs to /Readiness/record with capital R', async () => {
        authFetch.mockResolvedValueOnce(ok({ message: 'Recorded' }));
        await recordStudentReadiness(1, 2, { readinessPercentage: 80, questionsAnswered: 5, correctAnswers: 4 });
        const [url, options] = authFetch.mock.calls[0];
        expect(url).toBe('/Readiness/record');
        expect(options.method).toBe('POST');
    });

    it('includes studentId, classId and readinessPercentage in the payload', async () => {
        authFetch.mockResolvedValueOnce(ok({}));
        await recordStudentReadiness(3, 7, { readinessPercentage: 65 });
        const [, options] = authFetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body).toMatchObject({ studentId: 3, classId: 7, readinessPercentage: 65 });
    });
});

describe('getStudentTopicAbility()', () => {
    it('returns an array on success', async () => {
        authFetch.mockResolvedValueOnce(ok([{ topic: 'Algebra', theta: 0.5 }]));
        const result = await getStudentTopicAbility(1);
        expect(result).toEqual([{ topic: 'Algebra', theta: 0.5 }]);
    });

    it('returns [] on error instead of throwing', async () => {
        authFetch.mockResolvedValueOnce(err(500));
        const result = await getStudentTopicAbility(99);
        expect(result).toEqual([]);
    });

    it('returns [] on network failure without throwing', async () => {
        authFetch.mockRejectedValueOnce(new Error('Network down'));
        const result = await getStudentTopicAbility(1);
        expect(result).toEqual([]);
    });
});
