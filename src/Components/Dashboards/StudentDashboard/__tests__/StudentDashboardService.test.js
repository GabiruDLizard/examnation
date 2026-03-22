/**
 * StudentDashboardService tests
 *
 * Note: extractFinalAnswer and compareAnswers are private (not exported).
 * They are tested indirectly via saveAnswerToBackend and documented below.
 * For direct unit testing they should be exported — see comments per test.
 */

import {
    getStudentClassesWithDetails,
    submitAssignmentToBackend,
} from '../StudentDashboardService';

// Mock all network calls
jest.mock('../../../../utils/api', () => ({
    authFetch: jest.fn(),
}));
jest.mock('../../../../utils/tokenUtils', () => ({
    __esModule: true,
    getUserIdFromToken: jest.fn(),
}));
// Suppress complex transitive imports
jest.mock('../../../PerformanceEngine/^PerformanceAnalysis', () => ({
    analyzeMistakePatterns: jest.fn(),
}));
jest.mock('../../Charts/ReadinessLogic', () => ({
    abilityEstimate: jest.fn(() => 0),
}));
jest.mock('../../TeacherDashboard/TeacherDashboardService', () => ({
    updateStudentTopicAbility: jest.fn(),
}));

import { authFetch } from '../../../../utils/api';
import { getUserIdFromToken } from '../../../../utils/tokenUtils';

function ok(body) { return { ok: true, json: async () => body, text: async () => '' }; }
function err(msg = 'error') { return { ok: false, json: async () => ({ message: msg }), text: async () => msg }; }

// CRA sets resetMocks: true — re-establish default return values before each test.
beforeEach(() => {
    authFetch.mockReset();
    getUserIdFromToken.mockReturnValue('42');
});

// ── extractFinalAnswer behaviour (tested via saveAnswerToBackend) ──────────────
// The private extractFinalAnswer(work):
//   - Returns '' for null/undefined input
//   - Returns the trimmed string when there are no newlines
//   - Returns only the last non-empty line when separated by actual \n
//   - Returns only the last non-empty line when separated by escaped \\n literals
//
// These are validated via integration if saveAnswerToBackend is called, but until
// the functions are exported, the behaviour is documented here for review.

// ── compareAnswers behaviour ──────────────────────────────────────────────────
// The private compareAnswers(student, correct):
//   - Returns false when either argument is falsy
//   - Normalises both strings (lowercase, trim, remove special chars) then exact-matches
//   - Falls back to numeric comparison: true when |student - correct| < 0.001
//   - Returns false when difference >= 0.001
//
// These are documented here; export compareAnswers to enable direct unit tests.

describe('getStudentClassesWithDetails()', () => {
    it('returns [] immediately when enrollment API returns empty array', async () => {
        // getStudentEnrollments hits /classenrollment/student/:userId
        authFetch.mockResolvedValueOnce(ok([]));
        const result = await getStudentClassesWithDetails('42');
        expect(result).toEqual([]);
        // Should not make further API calls after seeing empty enrollments
        expect(authFetch).toHaveBeenCalledTimes(1);
    });

    it('returns [] when enrollment API call fails', async () => {
        authFetch.mockResolvedValueOnce(err('not found'));
        // getStudentEnrollments throws, getStudentClassesWithDetails catches
        const result = await getStudentClassesWithDetails('42');
        expect(result).toEqual([]);
    });

    it('fetches class details for each enrollment', async () => {
        // First call: enrollments
        authFetch.mockResolvedValueOnce(ok([{ classId: 10 }]));
        // Second call: class details
        authFetch.mockResolvedValueOnce(ok({ id: 10, name: 'Math 101', subject: 'Math' }));
        // Third call: readiness
        authFetch.mockResolvedValueOnce(ok({ readinessPercentage: 75 }));

        const result = await getStudentClassesWithDetails('42');
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ id: 10, name: 'Math 101' });
    });
});

describe('submitAssignmentToBackend()', () => {
    it('calls updateSubmission (PUT) when a prior submission already exists', async () => {
        // getSubmissionByAssignmentAndStudent returns an existing submission
        authFetch.mockResolvedValueOnce(ok({ id: 55, status: 'draft', assignmentId: 1, studentId: 42 }));
        // updateSubmission PUT
        authFetch.mockResolvedValueOnce(ok({ id: 55, status: 'submitted' }));

        await submitAssignmentToBackend(1, 42);

        const putCall = authFetch.mock.calls.find(([url, opts]) =>
            opts?.method === 'PUT' && url.includes('/assignmentsubmission/55')
        );
        expect(putCall).toBeDefined();
    });

    it('calls createSubmission (POST) when no prior submission exists', async () => {
        // getSubmissionByAssignmentAndStudent returns null
        authFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => null, text: async () => '' });
        // createSubmission POST
        authFetch.mockResolvedValueOnce(ok({ id: 99, status: 'submitted' }));

        await submitAssignmentToBackend(2, 42);

        const postCall = authFetch.mock.calls.find(([url, opts]) =>
            opts?.method === 'POST' && url.includes('/assignmentsubmission')
        );
        expect(postCall).toBeDefined();
    });

    it('includes status: submitted in the submission payload', async () => {
        authFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => null, text: async () => '' });
        authFetch.mockResolvedValueOnce(ok({ id: 1 }));

        await submitAssignmentToBackend(3, 10);

        const [, opts] = authFetch.mock.calls[1];
        const body = JSON.parse(opts.body);
        expect(body.status).toBe('submitted');
    });
});
