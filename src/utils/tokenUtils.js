const TOKEN_KEY = 'token';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken() {
    const token = getToken();
    if (!token) return null;
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

export function getUserIdFromToken() {
    const p = decodeToken();
    return p?.sub ?? p?.userId ?? p?.id ?? null;
}

export function getRoleFromToken() {
    const p = decodeToken();
    return (
        p?.role ??
        p?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        null
    );
}
