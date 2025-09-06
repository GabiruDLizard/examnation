export async function register({ email, username, password, firstName, lastName, role, ...rest }) {
    const payload = { 
        email, 
        username, 
        firstName, 
        lastName, 
        passwordHash: password, // Send plain password as passwordHash
        role 
    };

    const response = await fetch('https://examnationwebapi.azurewebsites.net/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Registration failed');
    }

    return response.json();
}