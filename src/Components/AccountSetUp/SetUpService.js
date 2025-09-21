export async function register(payload) {
    //payload.Email = payload.Email.toLowerCase();
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