export async function getUserProgress(userId) {
    const token = localStorage.getItem('jwtToken');
    
    const response = await fetch(`http://localhost:5204/api/userprogress/user/${userId}`, {
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