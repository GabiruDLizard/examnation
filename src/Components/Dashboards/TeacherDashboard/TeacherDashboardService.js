const API_BASE_URL = 'https://examnationwebapi.azurewebsites.net/api';

export const getTeacherInfo = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        // Decode token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;

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

        const teacherData = await response.json();
        return teacherData;
    } catch (error) {
        console.error('Error fetching teacher info:', error);
        throw error;
    }
};

export const getTeacherClasses = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const teacherId = payload.sub;

        const response = await fetch(`${API_BASE_URL}/teacher/classes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const classesData = await response.json();
        return classesData;
    } catch (error) {
        console.error('Error fetching teacher classes:', error);
        throw error;
    }
};