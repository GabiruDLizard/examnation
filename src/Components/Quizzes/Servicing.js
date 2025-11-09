export async function saveTestResults(testAnswers) {

    const response = await fetch('http://localhost:5204/api/answer/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAnswers) // This should now work with your batch endpoint
    });
}

export async function getStudentAnswers(userId) {  // Changed parameter name
    const token = localStorage.getItem('jwtToken');
    const response = await fetch(`http://localhost:5204/api/answer/user/${userId}`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Add this line!
        }
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch student answers');
    }
    return response.json();
}

export async function saveUserProgress(userProgress) {
    const token = localStorage.getItem('jwtToken');
    const response = await fetch('http://localhost:5204/api/userprogress/upsert', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Add this line!
        },
        body: JSON.stringify(userProgress)
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save user progress');
    }
    return response.json();
}