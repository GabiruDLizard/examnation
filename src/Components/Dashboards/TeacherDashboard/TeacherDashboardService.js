const API_BASE_URL = 'https://examnationwebapi.azurewebsites.net/api';
const API_BASE_URL_TEST = 'http://localhost:5204/api';

export const getTeacherInfo = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        // Decode token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;

        console.log('Fetching teacher info for userId:', userId); // Debug log

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
        console.log('Teacher data received:', teacherData); // Debug log
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
        console.log(`Fetching enrollments for class ${classId}...`);
        const response = await fetch(`${API_BASE_URL}/classenrollment/class/${classId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log(`No enrollments found for class ${classId}`);
                return []; // Return empty array if no enrollments
            }
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const enrollments = await response.json();
        console.log(`Enrollments received for class ${classId}:`, enrollments);

        // Check if enrollments is an array
        if (!Array.isArray(enrollments)) {
            console.warn(`Expected array of enrollments but got:`, enrollments);
            return [];
        }

        if (enrollments.length === 0) {
            console.log(`No students enrolled in class ${classId}`);
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

                console.log(`Fetching details for student ${studentId}...`);
                
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
        console.log(`Successfully fetched ${validStudentDetails.length} student details for class ${classId}`);
        
        return validStudentDetails;
        
    } catch (error) {
        console.error('Error fetching all student details:', error);
        return []; // Return empty array instead of throwing
    }
};