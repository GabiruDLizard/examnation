import {
    getToken, setToken, removeToken,
    decodeToken, getUserIdFromToken,
    getRoleFromToken, getInstitutionIdFromToken,
} from '../tokenUtils';

// Build a syntactically valid JWT with arbitrary payload
function makeJwt(payload) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${header}.${body}.fakesig`;
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('getToken / setToken / removeToken', () => {
    it('getToken returns null when nothing is stored', () => {
        expect(getToken()).toBeNull();
    });

    it('getToken returns the value that was set', () => {
        setToken('abc123');
        expect(getToken()).toBe('abc123');
    });

    it('setToken persists to localStorage under the key "token"', () => {
        setToken('my.jwt.here');
        expect(localStorage.getItem('token')).toBe('my.jwt.here');
    });

    it('removeToken deletes a previously stored token', () => {
        setToken('to-remove');
        removeToken();
        expect(getToken()).toBeNull();
    });

    it('removeToken does not throw when no token exists', () => {
        expect(() => removeToken()).not.toThrow();
    });
});

describe('decodeToken', () => {
    it('returns null when localStorage is empty', () => {
        expect(decodeToken()).toBeNull();
    });

    it('correctly parses a real base64 JWT payload', () => {
        setToken(makeJwt({ sub: '42', role: 'student' }));
        const decoded = decodeToken();
        expect(decoded).not.toBeNull();
        expect(decoded.sub).toBe('42');
        expect(decoded.role).toBe('student');
    });

    it('returns null for a token with no dots (not a JWT)', () => {
        setToken('notavalidtoken');
        expect(decodeToken()).toBeNull();
    });

    it('returns null for a token with an invalid base64 middle segment', () => {
        setToken('header.!!!bad!!!.sig');
        expect(decodeToken()).toBeNull();
    });
});

describe('getUserIdFromToken', () => {
    it('reads the sub claim (primary key)', () => {
        setToken(makeJwt({ sub: '99' }));
        expect(getUserIdFromToken()).toBe('99');
    });

    it('falls back to userId when sub is absent', () => {
        setToken(makeJwt({ userId: '7' }));
        expect(getUserIdFromToken()).toBe('7');
    });

    it('falls back to id when both sub and userId are absent', () => {
        setToken(makeJwt({ id: '3' }));
        expect(getUserIdFromToken()).toBe('3');
    });

    it('returns null when no token is stored', () => {
        expect(getUserIdFromToken()).toBeNull();
    });
});

describe('getRoleFromToken', () => {
    it('reads a simple role claim', () => {
        setToken(makeJwt({ sub: '1', role: 'admin' }));
        expect(getRoleFromToken()).toBe('admin');
    });

    it('falls back to the Microsoft namespace claim when role is absent', () => {
        const msClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
        setToken(makeJwt({ sub: '1', [msClaim]: 'educator' }));
        expect(getRoleFromToken()).toBe('educator');
    });

    it('returns null when neither role claim is present', () => {
        setToken(makeJwt({ sub: '1' }));
        expect(getRoleFromToken()).toBeNull();
    });

    it('returns null when no token is stored', () => {
        expect(getRoleFromToken()).toBeNull();
    });
});

describe('getInstitutionIdFromToken', () => {
    it('returns institution_id as a number when valid and positive', () => {
        setToken(makeJwt({ sub: '1', institution_id: 5 }));
        expect(getInstitutionIdFromToken()).toBe(5);
    });

    it('returns null when institution_id is 0 (boundary — must be > 0)', () => {
        setToken(makeJwt({ sub: '1', institution_id: 0 }));
        expect(getInstitutionIdFromToken()).toBeNull();
    });

    it('returns null when institution_id is negative', () => {
        setToken(makeJwt({ sub: '1', institution_id: -3 }));
        expect(getInstitutionIdFromToken()).toBeNull();
    });

    it('returns null when institution_id is a non-numeric string', () => {
        setToken(makeJwt({ sub: '1', institution_id: 'abc' }));
        expect(getInstitutionIdFromToken()).toBeNull();
    });

    it('returns null when institution_id is absent', () => {
        setToken(makeJwt({ sub: '1' }));
        expect(getInstitutionIdFromToken()).toBeNull();
    });

    it('returns null when no token is stored', () => {
        expect(getInstitutionIdFromToken()).toBeNull();
    });
});
