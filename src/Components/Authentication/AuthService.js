import { API_BASE_URL } from '../../utils/api';

export async function login(usernameOrEmail, password) {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UsernameorEmail: usernameOrEmail, Password: password })
    });
    return response.json();
}

export async function register(email, username, password, firstName, lastName) {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, firstName, lastName })
    });
    return response.json();
}
