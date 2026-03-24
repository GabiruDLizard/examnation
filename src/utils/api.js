import { getToken } from './tokenUtils';

export const API_BASE_URL = process.env.REACT_APP_API_URL;

/**
 * Authenticated fetch wrapper.
 * - Automatically attaches Bearer token from storage.
 * - Accepts either a path-only string ('/user/42') or a full URL.
 * - Skips Content-Type header for FormData (multipart uploads).
 */
export async function authFetch(endpointOrUrl, options = {}) {
    const token = getToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const isFormData = options.body instanceof FormData;

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    const url = endpointOrUrl.startsWith('http')
        ? endpointOrUrl
        : `${API_BASE_URL}${endpointOrUrl}`;

    return fetch(url, { ...options, headers });
}
