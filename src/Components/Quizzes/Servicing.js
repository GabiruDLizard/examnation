export async function saveTestResults(testAnswers) {
    const response = await fetch('https://examnationwebapi.azurewebsites.net/api/answer/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAnswers) // This should now work with your batch endpoint
    });
}

export async function getStudentAnswers(userId) {  // Changed parameter name
    const response = await fetch(`https://examnationwebapi.azurewebsites.net/api/answer/user/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch student answers');
    }
    return response.json();
}