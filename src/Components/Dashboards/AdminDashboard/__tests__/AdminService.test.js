import {
    getUsers, createAccount, editUser, deleteUser,
    resetPassword, getResetRequests, createOrganization,
} from '../AdminService';

// Mock authFetch so we control all network responses
jest.mock('../../../../utils/api', () => ({
    authFetch: jest.fn(),
}));
import { authFetch } from '../../../../utils/api';

function makeOkResponse(body) {
    return {
        ok: true,
        json: async () => body,
        text: async () => JSON.stringify(body),
    };
}
function makeErrorResponse(body, status = 400) {
    return {
        ok: false,
        status,
        json: async () => body,
        text: async () => JSON.stringify(body),
    };
}

beforeEach(() => authFetch.mockReset());

describe('AdminService', () => {
    describe('getUsers()', () => {
        it('fetches from /admin/users with no search param', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse([{ userId: 1 }]));
            const result = await getUsers();
            expect(authFetch).toHaveBeenCalledWith('/admin/users');
            expect(result).toEqual([{ userId: 1 }]);
        });

        it('appends search query string when provided', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse([]));
            await getUsers('jane');
            expect(authFetch).toHaveBeenCalledWith('/admin/users?search=jane');
        });

        it('throws when response is not ok', async () => {
            authFetch.mockResolvedValueOnce({ ok: false });
            await expect(getUsers()).rejects.toThrow('Failed to fetch users');
        });
    });

    describe('createAccount()', () => {
        it('sends password as passwordHash in the request body', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse({ userId: 2 }));
            await createAccount({
                firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com',
                username: 'janedoe', password: 'secret123', role: 'student', institutionId: 1,
            });
            const [, options] = authFetch.mock.calls[0];
            const body = JSON.parse(options.body);
            expect(body).toHaveProperty('passwordHash', 'secret123');
            expect(body).not.toHaveProperty('password');
        });

        it('throws with server error message on failure', async () => {
            authFetch.mockResolvedValueOnce(makeErrorResponse({ message: 'Email already exists' }));
            await expect(createAccount({ firstName: 'A', lastName: 'B', email: 'a@b.com', username: 'ab', password: 'pw', role: 'student' }))
                .rejects.toThrow('Email already exists');
        });
    });

    describe('editUser()', () => {
        it('always sends passwordHash as empty string (never overwrites real password)', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse({ userId: 1 }));
            await editUser(1, { firstName: 'Jane', lastName: 'Doe', email: 'j@d.com', username: 'jd', role: 'student' });
            const [, options] = authFetch.mock.calls[0];
            const body = JSON.parse(options.body);
            expect(body).toHaveProperty('passwordHash', '');
        });

        it('sends PUT to /admin/users/:userId', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse({}));
            await editUser(42, { firstName: 'A', lastName: 'B', email: 'a@b.com', username: 'ab', role: 'student' });
            expect(authFetch).toHaveBeenCalledWith('/admin/users/42', expect.objectContaining({ method: 'PUT' }));
        });
    });

    describe('deleteUser()', () => {
        it('sends DELETE to /admin/users/:userId', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse({ message: 'Deleted' }));
            await deleteUser(5);
            expect(authFetch).toHaveBeenCalledWith('/admin/users/5', { method: 'DELETE' });
        });

        it('throws with the error message from the response body', async () => {
            authFetch.mockResolvedValueOnce(makeErrorResponse({ message: 'Cannot delete last admin' }));
            await expect(deleteUser(99)).rejects.toThrow('Cannot delete last admin');
        });
    });

    describe('getResetRequests()', () => {
        it('fetches from /passwordresetrequest/pending (not /admin/...)', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse([]));
            await getResetRequests();
            expect(authFetch).toHaveBeenCalledWith('/passwordresetrequest/pending');
        });
    });

    describe('createOrganization()', () => {
        it('defaults country to Bahamas when not provided', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse({ institutionId: 1 }));
            await createOrganization({ institutionName: 'Test School' });
            const [, options] = authFetch.mock.calls[0];
            const body = JSON.parse(options.body);
            expect(body.country).toBe('Bahamas');
        });

        it('uses the provided country when supplied', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse({ institutionId: 2 }));
            await createOrganization({ institutionName: 'UK School', country: 'United Kingdom' });
            const [, options] = authFetch.mock.calls[0];
            const body = JSON.parse(options.body);
            expect(body.country).toBe('United Kingdom');
        });
    });

    describe('resetPassword()', () => {
        it('POSTs to /admin/users/:userId/reset-password', async () => {
            authFetch.mockResolvedValueOnce(makeOkResponse({ message: 'Done' }));
            await resetPassword(7, 'newpass123');
            const [url, options] = authFetch.mock.calls[0];
            expect(url).toBe('/admin/users/7/reset-password');
            expect(options.method).toBe('POST');
            expect(JSON.parse(options.body)).toEqual({ newPassword: 'newpass123' });
        });
    });
});
