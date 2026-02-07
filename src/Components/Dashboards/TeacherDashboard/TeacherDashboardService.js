const API_BASE_URL = 'https://examnationwebapi.azurewebsites.net/api';
const API_BASE_URL_TEST = 'http://localhost:5204/api';
const API_BASE_URL_BLOB = 'http://localhost:5290/api/file';

// ================================================================
// READINESS TRACKING API FUNCTIONS
// ================================================================

export const recordStudentReadiness = async (studentId, classId, readinessData) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Readiness/record`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId,
                classId,
                readinessPercentage: readinessData.readinessPercentage,
                questionsAnswered: readinessData.questionsAnswered || 0,
                correctAnswers: readinessData.correctAnswers || 0,
                studyTimeMinutes: readinessData.studyTimeMinutes || 0,
                abilityEstimate: readinessData.abilityEstimate || null
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error recording student readiness:', error);
        throw error;
    }
};

export const getStudentReadinessHistory = async (studentId, weeksBack = 8) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Readiness/student/${studentId}/history?weeksBack=${weeksBack}`, {
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
        console.error('Error fetching student readiness history:', error);
        throw error;
    }
};

export const getClassReadinessHistory = async (classId, weeksBack = 8) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Readiness/class/${classId}/history?weeksBack=${weeksBack}`, {
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
        console.error('Error fetching class readiness history:', error);
        throw error;
    }
};

export const getTeacherReadinessChartData = async (teacherId, weeksBack = 8) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Readiness/teacher/${teacherId}/chart-data?weeksBack=${weeksBack}`, {
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
        console.error('Error fetching teacher readiness chart data:', error);
        throw error;
    }
};

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

export const getTeacherClasses = async (teacherId) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const teacherId = payload.sub;

        const response = await fetch(`${API_BASE_URL}/class/teacher/${teacherId}`, {
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

export const createTeacherClass = async (classData) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        // Get teacher ID from token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const teacherId = payload.sub;

        // Create the payload that matches your API model
        const classPayload = {
            name: classData.name, // Required
            subject: classData.subject, // Required
            gradeLevel: classData.gradeLevel, // Required
            teacherId: parseInt(teacherId), // Required - convert to int
            schedule: classData.schedule, // Required
            courseCode: classData.courseCode || null,
            description: classData.description || null,
            roomNumber: classData.roomNumber || null,
            durationMinutes: classData.durationMinutes || 50,
            term: classData.term || "Fall 2024",
            color: classData.color || "#3b82f6",
            classImageUrl: classData.classImageUrl || null,
            maxStudents: classData.maxStudents || 30,
            currentEnrollment: 0, // Always start at 0
            enrollmentStatus: "open",
            gradingScale: classData.gradingScale || "A-F",
            prerequisites: classData.prerequisites || null,
            creditHours: classData.creditHours || 1.00,
            readinessTarget: classData.readinessTarget || 75,
            practiceFrequency: classData.practiceFrequency || "daily",
            aiAssistanceLevel: classData.aiAssistanceLevel || "medium",
            avgReadiness: 0.00, // Always start at 0
            activeAssignments: 0, // Always start at 0
            status: "active"
        };

        const response = await fetch(`${API_BASE_URL}/class`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(classPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const createdClass = await response.json();
        return createdClass;
    } catch (error) {
        console.error('Error creating teacher class:', error);
        throw error;
    }
};

export const updateTeacherClass = async (classId, classData) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(classData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const updatedClass = await response.json();
        return updatedClass;
    } catch (error) {
        console.error('Error updating teacher class:', error);
        throw error;
    }
};

export const deleteTeacherClass = async (classId) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        return true;
    } catch (error) {
        console.error('Error deleting teacher class:', error);
        throw error;
    }
};

export const getClassEnrollments = async (classId) => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/classenrollment/class/${classId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const enrollments = await response.json();
        return enrollments;
    } catch (error) {
        console.error('Error fetching class enrollments:', error);
        throw error;
    }
};

export const enrollStudentInClass = async (classId, studentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    try {
        const enrollmentPayload = {
            classId: classId,
            studentId: studentId
        };
        const response = await fetch(`${API_BASE_URL}/classenrollment/enroll`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enrollmentPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const enrollment = await response.json();
        return enrollment;
    } catch (error) {
        console.error('Error enrolling student in class:', error);
        throw error;
    }
};

// Fix the enrollStudentByIdentifier function:
export const enrollStudentByIdentifier = async (classId, userIdentifier) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        let userData;
        
        // Check if userIdentifier is an email (contains @) or a user ID
        if (userIdentifier.includes('@')) {
            // Look up by email
            const userLookupResponse = await fetch(`${API_BASE_URL}/user/email/${userIdentifier}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!userLookupResponse.ok) {
                throw new Error('Student not found. Please check the email address.');
            }
            userData = await userLookupResponse.json();
        } else {
            // Look up by user ID
            const userLookupResponse = await fetch(`${API_BASE_URL}/user/${userIdentifier}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!userLookupResponse.ok) {
                throw new Error('Student not found. Please check the user ID.');
            }
            userData = await userLookupResponse.json();
        }
        
        // Then enroll them using the existing method
        const enrollment = await enrollStudentInClass(classId, userData.id);
        
        return {
            enrollment,
            student: userData
        };
        
    } catch (error) {
        console.error('Error enrolling student by identifier:', error);
        throw error;
    }
};

// Replace the getAllEnrolledStudentInfo function with this corrected version:

export const getAllEnrolledStudentInfo = async (classId) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        // Get enrolled students using the correct endpoint from your controller
        const response = await fetch(`${API_BASE_URL}/classenrollment/class/${classId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return []; // Return empty array if no enrollments
            }
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const enrollments = await response.json();

        // Check if enrollments is an array
        if (!Array.isArray(enrollments)) {
            console.warn(`Expected array of enrollments but got:`, enrollments);
            return [];
        }

        if (enrollments.length === 0) {
            return [];
        }
        
        // Get detailed info for each enrolled student
        const studentDetailsPromises = enrollments.map(async (enrollment) => {
            try {
                // The enrollment object should have a StudentId property
                const studentId = enrollment.studentId || enrollment.StudentId;
                
                if (!studentId) {
                    console.warn('No student ID found in enrollment:', enrollment);
                    return null;
                }

                // Get student info
                const studentInfoResponse = await fetch(`${API_BASE_URL}/user/${studentId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!studentInfoResponse.ok) {
                    console.warn(`Could not fetch info for student ${studentId}`);
                    return null;
                }

                const studentInfo = await studentInfoResponse.json();

                // Try to get student progress (optional)
                let studentProgress = null;
                try {
                    const studentProgressResponse = await fetch(`${API_BASE_URL}/userprogress/user/${studentId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (studentProgressResponse.ok) {
                        studentProgress = await studentProgressResponse.json();
                    }
                } catch (progressError) {
                    console.warn(`Could not fetch progress for student ${studentId}:`, progressError);
                }

                return [studentInfo, studentProgress];
            } catch (error) {
                console.error(`Error fetching details for enrollment:`, enrollment, error);
                return null;
            }
        });

        const studentDetails = await Promise.all(studentDetailsPromises);
        
        // Filter out null results
        const validStudentDetails = studentDetails.filter(detail => detail !== null);
        
        return validStudentDetails;
        
    } catch (error) {
        console.error('Error fetching all student details:', error);
        return []; // Return empty array instead of throwing
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
            console.error('❌ Assignment creation failed:', {
                status: response.status,
                statusText: response.statusText,
                errorBody: errorText,
                sentData: JSON.stringify(assignmentData, null, 2)
            });
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
        return assignments;
    } catch (error) {
        console.error('Error fetching assignments for class:', error);
        return []; // Return empty array instead of throwing
    }
};
export const getAssignmentsByTeacher = async (teacherId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    try {
        const response = await fetch(`${API_BASE_URL}/assignment/teacher/${teacherId}`, {
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
        return assignments;
    } catch (error) {
        console.error('Error fetching assignments for class:', error);
        return []; // Return empty array instead of throwing
    }
};
export const getAssignmentsById = async (assignmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    try {
        const response = await fetch(`${API_BASE_URL}/assignment/${assignmentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignment = await response.json();
        return assignment;
    } catch (error) {
        console.error('Error fetching assignment by ID:', error);
        return null; // Return null instead of throwing
    }
};
export const updateAssignment = async (assignmentId, assignmentData) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    try {
        const response = await fetch(`${API_BASE_URL}/assignment/${assignmentId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedAssignment = await response.json();
        return updatedAssignment;
    } catch (error) {
        console.error('Error updating assignment:', error);
        throw error;
    }
};
export const deleteAssignment = async (assignmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    try {
        const response = await fetch(`${API_BASE_URL}/assignment/${assignmentId}`, {
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
        console.error('Error deleting assignment:', error);
        throw error;
    }
};

export const uploadQuestionImage = async (imageFile) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    try {
        const formData = new FormData();
        formData.append('file', imageFile);
        const response = await fetch(`${API_BASE_URL_BLOB}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const result = await response.json();
        return result.blobUrl; // API returns blobUrl, not fileUrl
    } catch (error) {
        console.error('Error uploading question image:', error);
        throw error;
    }
};

// Create a single question
export const createQuestion = async (questionData) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    // Fix null values that cause PostgreSQL parameter errors
    const sanitizedData = {
        ...questionData,
        answerBreakdown: questionData.answerBreakdown || "",
        solutionSteps: questionData.solutionSteps || "",
        figureDescription: questionData.figureDescription || "",
        figureBlobUrl: questionData.figureBlobUrl || "",
        subjectId: questionData.subjectId || null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/question`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sanitizedData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Question creation failed:', {
                status: response.status,
                statusText: response.statusText,
                errorBody: errorText,
                sentData: JSON.stringify(sanitizedData, null, 2)
            });
            
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const createdQuestion = await response.json();
        return createdQuestion;
    } catch (error) {
        console.error('Error creating question:', error);
        throw error;
    }
};

// Create assignment-question link
export const createAssignmentQuestion = async (linkData) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const requestBody = {
        assignmentId: parseInt(linkData.assignmentId),
        questionId: parseInt(linkData.questionId),
        points: parseFloat(linkData.points || 1.0)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/assignmentquestion`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Assignment question link failed:', {
                status: response.status,
                statusText: response.statusText,
                errorBody: errorText,
                sentData: JSON.stringify(requestBody, null, 2)
            });
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const createdLink = await response.json();
        return createdLink;
    } catch (error) {
        console.error('Error creating assignment question link:', error);
        throw error;
    }
};

// Get questions linked to an assignment
export const getAssignmentQuestions = async (assignmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignmentquestion/assignment/${assignmentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return []; // Return empty array if no questions found
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignmentQuestions = await response.json();
        return assignmentQuestions;
    } catch (error) {
        console.error('Error fetching assignment questions:', error);
        return []; // Return empty array instead of throwing
    }
};

// Get full assignment details with questions
export const getAssignmentWithQuestions = async (assignmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        // Get the assignment details
        const assignment = await getAssignmentsById(assignmentId);
        if (!assignment) {
            return null;
        }

        // Get the questions linked to this assignment
        const assignmentQuestions = await getAssignmentQuestions(assignmentId);
        
        // If there are linked questions, get the full question details
        const questionsWithDetails = await Promise.all(
            assignmentQuestions.map(async (aq) => {
                try {
                    const questionResponse = await fetch(`${API_BASE_URL}/question/${aq.questionId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (questionResponse.ok) {
                        const questionDetail = await questionResponse.json();
                        return {
                            ...questionDetail,
                            points: aq.points // Include the points from assignment-question link
                        };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error fetching question ${aq.questionId}:`, error);
                    return null;
                }
            })
        );

        // Filter out failed question fetches
        const validQuestions = questionsWithDetails.filter(q => q !== null);

        return {
            ...assignment,
            questions: validQuestions
        };
    } catch (error) {
        console.error('Error fetching assignment with questions:', error);
        return null;
    }
};

// Get assignments for class with questions included
export const getAssignmentsForClassWithQuestions = async (classId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        // Get all assignments for the class
        const assignments = await getAssignmentsForClass(classId);
        
        // Get questions for each assignment
        const assignmentsWithQuestions = await Promise.all(
            assignments.map(async (assignment) => {
                const assignmentQuestions = await getAssignmentQuestions(assignment.id);
                
                // Get full question details
                const questionsWithDetails = await Promise.all(
                    assignmentQuestions.map(async (aq) => {
                        try {
                            const questionResponse = await fetch(`${API_BASE_URL}/question/${aq.questionId}`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (questionResponse.ok) {
                                const questionDetail = await questionResponse.json();
                                return {
                                    ...questionDetail,
                                    points: aq.points
                                };
                            }
                            return null;
                        } catch (error) {
                            console.error(`Error fetching question ${aq.questionId}:`, error);
                            return null;
                        }
                    })
                );

                const validQuestions = questionsWithDetails.filter(q => q !== null);

                return {
                    ...assignment,
                    questions: validQuestions,
                    totalQuestions: validQuestions.length,
                    totalPoints: validQuestions.reduce((sum, q) => sum + (q.points || 0), 0)
                };
            })
        );

        return assignmentsWithQuestions;
    } catch (error) {
        console.error('Error fetching assignments with questions:', error);
        return [];
    }
};

export const getStudentReadiness = async (studentId, classId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    try {
        const response = await fetch(`${API_BASE_URL}/Readiness/student/${studentId}/class/${classId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const readinessData = await response.json();
        return readinessData;
    } catch (error) {
        console.error('Error fetching student readiness:', error);
        throw error;
    }
};