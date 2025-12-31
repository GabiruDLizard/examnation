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

export const getStudentEnrollments = async (userId) => {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/classenrollment/student/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('Enrollments API returned:', response.status);
            return [];
        }

        const enrollmentsData = await response.json();
        return enrollmentsData;
    } catch (error) {
        console.error('Error fetching student enrollments:', error);
        return [];
    }
};

export const getClassDetails = async (classId) => {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`Class details API returned: ${response.status} for classId: ${classId}`);
            return null;
        }

        const classData = await response.json();
        return classData;
    } catch (error) {
        console.error(`Error fetching class details for ${classId}:`, error);
        return null;
    }
};

export const getStudentClassesWithDetails = async (userId) => {
    try {
        // First get enrollments
        const enrollments = await getStudentEnrollments(userId);
        
        if (!enrollments || enrollments.length === 0) {
            return [];
        }

        // Then get full class details for each enrollment
        const classDetailsPromises = enrollments.map(async (enrollment) => {
            const classDetails = await getClassDetails(enrollment.classId);
            
            // Merge enrollment data with class details
            return {
                // From enrollment
                enrollmentId: enrollment.id,
                classId: enrollment.classId,
                enrollmentDate: enrollment.enrollmentDate,
                status: enrollment.status || 'Active',
                progress: enrollment.progress || 0,
                averageScore: enrollment.averageScore || 0,
                completedAssignments: enrollment.completedAssignments || 0,
                totalAssignments: enrollment.totalAssignments || 0,
                
                // From class details (if available)
                id: enrollment.classId,
                name: classDetails?.name || classDetails?.className || `Class ${enrollment.classId}`,
                subject: classDetails?.subject || classDetails?.subjectName || 'General Studies',
                grade: classDetails?.gradeLevel || classDetails?.grade || 'N/A',
                teacher: classDetails?.teacherName || classDetails?.instructor || 'Teacher',
                schedule: classDetails?.schedule || classDetails?.classSchedule || 'TBD',
                roomNumber: classDetails?.roomNumber || classDetails?.room || 'TBD',
                color: classDetails?.color || "#3b82f6",
                maxStudents: classDetails?.maxStudents || classDetails?.capacity || 30,
                term: classDetails?.term || classDetails?.semester || 'Current',
                students: classDetails?.currentEnrollment || 1,
                avgReadiness: Math.round(classDetails?.averageReadiness || enrollment.readiness || 0),
                activeAssignments: classDetails?.activeAssignments || enrollment.pendingAssignments || 0,
                lastActivity: enrollment.lastActivity || new Date().toISOString()
            };
        });

        const classesWithDetails = await Promise.all(classDetailsPromises);
        return classesWithDetails.filter(cls => cls !== null);
        
    } catch (error) {
        console.error('Error fetching student classes with details:', error);
        return [];
    }
};