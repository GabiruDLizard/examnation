const API_BASE_URL = 'https://examnationwebapi.azurewebsites.net/api';

export const getStudentInfo = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        // Decode token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;

        console.log('Fetching student info for userId:', userId);

        const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const studentData = await response.json();
        console.log('Student data received:', studentData);
        return studentData;
    } catch (error) {
        console.error('Error fetching student info:', error);
        throw error;
    }
};

export const getUserProgress = async (userId) => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/userprogress/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('Progress API returned:', response.status);
            return {};
        }

        const progressData = await response.json();
        return progressData;
    } catch (error) {
        console.warn('Error fetching user progress:', error);
        return {};
    }
};

export const getStudentAnswers = async (userId) => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/answer/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('Student answers API returned:', response.status);
            return [];
        }

        const answersData = await response.json();
        return answersData;
    } catch (error) {
        console.error('Error fetching student answers:', error);
        return [];
    }
};