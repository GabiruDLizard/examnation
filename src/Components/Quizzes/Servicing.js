const API_BASE_URL = 'https://examnationwebapi.azurewebsites.net/api';

export async function saveTestResults(testAnswers) {
    const token = localStorage.getItem('jwtToken');
    const response = await fetch(`${API_BASE_URL}/answer/batch`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testAnswers)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save test results');
    }
    return response.json();
}

export async function getStudentAnswers(userId) {
    const token = localStorage.getItem('jwtToken');
    const response = await fetch(`${API_BASE_URL}/answer/user/${userId}`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
    const response = await fetch(`${API_BASE_URL}/userprogress/upsert`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userProgress)
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save user progress');
    }
    return response.json();
}