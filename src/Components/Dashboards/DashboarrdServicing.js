const API_BASE_URL = 'https://examnationwebapi.azurewebsites.net/api';

export async function getUserProgress(userId) {
    const token = localStorage.getItem('token'); // Changed from 'jwtToken' to 'token' for consistency
    
    const response = await fetch(`${API_BASE_URL}/userprogress/user/${userId}`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) { 
        const error = await response.text();
        throw new Error(error || 'Failed to get user progress');
    }
    return response.json();
}

export async function getStudentAnswers(userId) {
    const token = localStorage.getItem('token'); // Changed from 'jwtToken' to 'token' for consistency
    
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

// Add other common API functions
export async function getStudentInfo(userId) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to get student info');
    }
    return response.json();
}

export async function getQuestions() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/question`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch questions');
    }
    return response.json();
}

export async function submitAnswer(answerData) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/answer`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(answerData)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to submit answer');
    }
    return response.json();
}