const API_BASE_URL = 'https://examnationwebapi.azurewebsites.net/api';

// ================================================================
// ASSIGNMENT QUESTION API FUNCTIONS
// ================================================================

export const getAllAssignmentQuestions = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignmentquestion`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching assignment questions:', error);
        throw error;
    }
};

export const getAssignmentQuestionById = async (id) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignmentquestion/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching assignment question:', error);
        throw error;
    }
};

export const getQuestionsByAssignmentId = async (assignmentId) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        // First get the assignment questions (contains questionId references)
        const response = await fetch(`${API_BASE_URL}/assignmentquestion/assignment/${assignmentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignmentQuestions = await response.json();

        // Now fetch full question details for each questionId
        const questionsWithDetails = await Promise.all(
            assignmentQuestions.map(async (assignmentQuestion) => {
                try {
                    const questionResponse = await fetch(`${API_BASE_URL}/question/${assignmentQuestion.questionId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!questionResponse.ok) {
                        console.warn(`Failed to fetch question ${assignmentQuestion.questionId}`);
                        return { ...assignmentQuestion, questionDetails: null };
                    }

                    const questionDetails = await questionResponse.json();
                    
                    // Combine assignment question data with full question details
                    return {
                        ...assignmentQuestion,
                        ...questionDetails
                    };
                } catch (error) {
                    console.error(`Error fetching question ${assignmentQuestion.questionId}:`, error);
                    return { ...assignmentQuestion, questionDetails: null };
                }
            })
        );

        return questionsWithDetails;
    } catch (error) {
        console.error('Error fetching questions for assignment:', error);
        throw error;
    }
};

export const createAssignmentQuestion = async (assignmentQuestion) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignmentquestion`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentQuestion)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating assignment question:', error);
        throw error;
    }
};

export const updateAssignmentQuestion = async (assignmentQuestion) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignmentquestion/${assignmentQuestion.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentQuestion)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating assignment question:', error);
        throw error;
    }
};

export const deleteAssignmentQuestion = async (id) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignmentquestion/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error deleting assignment question:', error);
        throw error;
    }
};

// ================================================================
// EXISTING STUDENT API FUNCTIONS
// ================================================================

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
export const createAssignmentForClass = async (assignmentData) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    try {
        const response = await fetch(`${API_BASE_URL}/assignment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const createdAssignment = await response.json();
        return createdAssignment;
    } catch (error) {
        console.error('Error creating assignment:', error);
        throw error;
    }
};

export const getAssignmentsForClass = async (classId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    try {
        const response = await fetch(`${API_BASE_URL}/assignment/class/${classId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignments = await response.json();
        
        // Pre-load questions for all assignments
        const assignmentsWithQuestions = await Promise.all(
            assignments.map(async (assignment) => {
                try {
                    const questions = await getQuestionsByAssignmentId(assignment.id);
                    return {
                        ...assignment,
                        questions: questions || []
                    };
                } catch (error) {
                    console.warn(`Failed to load questions for assignment ${assignment.id}:`, error);
                    return {
                        ...assignment,
                        questions: []
                    };
                }
            })
        );

        return assignmentsWithQuestions;
    } catch (error) {
        console.error('Error fetching assignments for class:', error);
        return []; // Return empty array instead of throwing
    }
};