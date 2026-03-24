import { saveTestResults, getStudentAnswers, saveUserProgress } from '../Servicing';

const API_BASE = 'https://examnationwebapi.azurewebsites.net/api';

jest.mock('../../../utils/tokenUtils', () => ({
    getToken: jest.fn(),
}));

import { getToken } from '../../../utils/tokenUtils';

// CRA sets resetMocks: true — re-establish default return values before each test.
beforeEach(() => {
    getToken.mockReturnValue('test-token-abc');
    process.env.REACT_APP_API_URL = API_BASE;
    jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'ok' }),
        text: async () => '',
    });
});
afterEach(() => jest.restoreAllMocks());

describe('Servicing', () => {
    describe('saveTestResults()', () => {
        it('POSTs to /answer/batch with the answers array', async () => {
            const answers = [{ questionId: 1, isCorrect: true }];
            await saveTestResults(answers);
            const [url, options] = global.fetch.mock.calls[0];
            expect(url).toBe(`${API_BASE}/answer/batch`);
            expect(options.method).toBe('POST');
            expect(JSON.parse(options.body)).toEqual(answers);
        });

        it('includes Authorization: Bearer token header', async () => {
            await saveTestResults([]);
            const [, options] = global.fetch.mock.calls[0];
            expect(options.headers['Authorization']).toBe('Bearer test-token-abc');
        });

        it('throws when response is not ok', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Server error',
            });
            await expect(saveTestResults([])).rejects.toThrow('Server error');
        });
    });

    describe('getStudentAnswers()', () => {
        it('GETs from /answer/user/:userId', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });
            await getStudentAnswers(42);
            const [url] = global.fetch.mock.calls[0];
            expect(url).toBe(`${API_BASE}/answer/user/42`);
        });

        it('includes Authorization header', async () => {
            global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
            await getStudentAnswers(1);
            const [, options] = global.fetch.mock.calls[0];
            expect(options.headers['Authorization']).toBe('Bearer test-token-abc');
        });

        it('throws when response is not ok', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Not found',
            });
            await expect(getStudentAnswers(99)).rejects.toThrow('Not found');
        });
    });

    describe('saveUserProgress()', () => {
        it('POSTs to /userprogress/upsert', async () => {
            const progress = { userId: 1, readiness: 80 };
            await saveUserProgress(progress);
            const [url, options] = global.fetch.mock.calls[0];
            expect(url).toBe(`${API_BASE}/userprogress/upsert`);
            expect(options.method).toBe('POST');
            expect(JSON.parse(options.body)).toEqual(progress);
        });

        it('includes Authorization header', async () => {
            await saveUserProgress({});
            const [, options] = global.fetch.mock.calls[0];
            expect(options.headers['Authorization']).toBe('Bearer test-token-abc');
        });

        it('throws with fallback message when response body is empty', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                text: async () => '',
            });
            await expect(saveUserProgress({})).rejects.toThrow('Failed to save user progress');
        });
    });
});
