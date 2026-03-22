import { authFetch, API_BASE_URL } from '../api';
import { setToken, removeToken } from '../tokenUtils';

const BASE = 'https://examnationwebapi.azurewebsites.net/api';

beforeEach(() => {
    localStorage.clear();
    jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
});
afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
});

describe('authFetch', () => {
    it("throws 'No authentication token found' when no token in localStorage", async () => {
        removeToken();
        await expect(authFetch('/user/1')).rejects.toThrow('No authentication token found');
    });

    it('attaches Authorization: Bearer <token> to every request', async () => {
        setToken('my.test.token');
        await authFetch('/user/1');
        const [, options] = global.fetch.mock.calls[0];
        expect(options.headers['Authorization']).toBe('Bearer my.test.token');
    });

    it('sets Content-Type: application/json when body is a JSON string', async () => {
        setToken('tok');
        await authFetch('/user/1', { method: 'POST', body: JSON.stringify({ name: 'Alice' }) });
        const [, options] = global.fetch.mock.calls[0];
        expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('omits Content-Type when body is FormData (multipart upload)', async () => {
        setToken('tok');
        const form = new FormData();
        form.append('file', new Blob(['data'], { type: 'text/plain' }), 'file.txt');
        await authFetch('/upload', { method: 'POST', body: form });
        const [, options] = global.fetch.mock.calls[0];
        expect(options.headers['Content-Type']).toBeUndefined();
    });

    it('prepends API_BASE_URL to a path-only string', async () => {
        setToken('tok');
        await authFetch('/user/1');
        const [url] = global.fetch.mock.calls[0];
        expect(url).toBe(`${BASE}/user/1`);
    });

    it('passes a full https:// URL through unchanged', async () => {
        setToken('tok');
        const fullUrl = 'https://other.example.com/data';
        await authFetch(fullUrl);
        const [url] = global.fetch.mock.calls[0];
        expect(url).toBe(fullUrl);
    });

    it('API_BASE_URL matches REACT_APP_API_URL set in setupTests', () => {
        expect(API_BASE_URL).toBe(BASE);
    });

    it('caller-supplied headers override defaults', async () => {
        setToken('tok');
        await authFetch('/user/1', { headers: { 'X-Custom': 'yes', 'Content-Type': 'text/plain' } });
        const [, options] = global.fetch.mock.calls[0];
        expect(options.headers['X-Custom']).toBe('yes');
        expect(options.headers['Content-Type']).toBe('text/plain');
    });
});
