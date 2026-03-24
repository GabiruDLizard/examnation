import { login, register } from '../AuthService';

const API_BASE = 'https://examnationwebapi.azurewebsites.net/api';

beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'fake-token', message: 'ok' }),
    });
});
afterEach(() => jest.restoreAllMocks());

describe('AuthService', () => {
    describe('login()', () => {
        it('POSTs to /user/login with exact field names UsernameorEmail and Password', async () => {
            await login('testuser', 'secret123');
            const [url, options] = global.fetch.mock.calls[0];
            expect(url).toBe(`${API_BASE}/user/login`);
            const body = JSON.parse(options.body);
            expect(body).toHaveProperty('UsernameorEmail', 'testuser');
            expect(body).toHaveProperty('Password', 'secret123');
        });

        it('returns the parsed JSON response on success', async () => {
            const result = await login('user', 'pass');
            expect(result).toEqual({ token: 'fake-token', message: 'ok' });
        });

        it('calls response.json() even on a 401 (returns error body)', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ message: 'Invalid credentials' }),
            });
            const result = await login('bad', 'creds');
            expect(result.message).toBe('Invalid credentials');
        });

        it('throws when a network error occurs', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network failure'));
            await expect(login('user', 'pass')).rejects.toThrow('Network failure');
        });
    });

    describe('register()', () => {
        it('POSTs to /user/register with all five required fields', async () => {
            await register('test@test.com', 'testuser', 'pass123', 'Jane', 'Doe');
            const [url, options] = global.fetch.mock.calls[0];
            expect(url).toBe(`${API_BASE}/user/register`);
            const body = JSON.parse(options.body);
            expect(body).toMatchObject({
                email: 'test@test.com',
                username: 'testuser',
                password: 'pass123',
                firstName: 'Jane',
                lastName: 'Doe',
            });
        });

        it('returns the parsed JSON response', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'User created' }),
            });
            const result = await register('a@b.com', 'u', 'p', 'F', 'L');
            expect(result.message).toBe('User created');
        });
    });
});
