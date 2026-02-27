import { authFetch } from '../../../utils/api';
import { getUserIdFromToken } from '../../../utils/tokenUtils';

const API_BASE_URL_BLOB = process.env.REACT_APP_BLOB_URL;

// ================================================================
// READINESS TRACKING API FUNCTIONS
// ================================================================

export const recordStudentReadiness = async (studentId, classId, readinessData) => {
    try {
        const response = await authFetch(`/Readiness/record`, {
            method: 'POST',
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
    try {
        const response = await authFetch(`/Readiness/student/${studentId}/history?weeksBack=${weeksBack}`);

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
    try {
        const response = await authFetch(`/Readiness/class/${classId}/history?weeksBack=${weeksBack}`);

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
    try {
        const response = await authFetch(`/Readiness/teacher/${teacherId}/chart-data?weeksBack=${weeksBack}`);

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
    try {
        const userId = getUserIdFromToken();
        const response = await authFetch(`/user/${userId}`);

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
    try {
        const teacherId = getUserIdFromToken();

        const response = await authFetch(`/class/teacher/${teacherId}`);

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
    try {
        const teacherId = getUserIdFromToken();

        const classPayload = {
            name: classData.name,
            subject: classData.subject,
            gradeLevel: classData.gradeLevel,
            teacherId: parseInt(teacherId),
            schedule: classData.schedule,
            courseCode: classData.courseCode || null,
            description: classData.description || null,
            roomNumber: classData.roomNumber || null,
            durationMinutes: classData.durationMinutes || 50,
            term: classData.term || "Fall 2024",
            color: classData.color || "#3b82f6",
            classImageUrl: classData.classImageUrl || null,
            maxStudents: classData.maxStudents || 30,
            currentEnrollment: 0,
            enrollmentStatus: "open",
            gradingScale: classData.gradingScale || "A-F",
            prerequisites: classData.prerequisites || null,
            creditHours: classData.creditHours || 1.00,
            readinessTarget: classData.readinessTarget || 75,
            practiceFrequency: classData.practiceFrequency || "daily",
            aiAssistanceLevel: classData.aiAssistanceLevel || "medium",
            avgReadiness: 0.00,
            activeAssignments: 0,
            status: "active"
        };

        const response = await authFetch(`/class`, {
            method: 'POST',
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
    try {
        const response = await authFetch(`/class/${classId}`, {
            method: 'PUT',
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
    try {
        const response = await authFetch(`/class/${classId}`, {
            method: 'DELETE'
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
    try {
        const response = await authFetch(`/classenrollment/class/${classId}`);

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
    try {
        const enrollmentPayload = {
            classId: classId,
            studentId: studentId
        };
        const response = await authFetch(`/classenrollment/enroll`, {
            method: 'POST',
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

export const enrollStudentByIdentifier = async (classId, userIdentifier) => {
    try {
        let userData;

        if (userIdentifier.includes('@')) {
            const userLookupResponse = await authFetch(`/user/email/${userIdentifier}`);

            if (!userLookupResponse.ok) {
                throw new Error('Student not found. Please check the email address.');
            }
            userData = await userLookupResponse.json();
        } else {
            const userLookupResponse = await authFetch(`/user/${userIdentifier}`);

            if (!userLookupResponse.ok) {
                throw new Error('Student not found. Please check the user ID.');
            }
            userData = await userLookupResponse.json();
        }

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

export const getAllEnrolledStudentInfo = async (classId) => {
    try {
        const response = await authFetch(`/classenrollment/class/${classId}`);

        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const enrollments = await response.json();

        if (!Array.isArray(enrollments)) {
            console.warn(`Expected array of enrollments but got:`, enrollments);
            return [];
        }

        if (enrollments.length === 0) {
            return [];
        }

        const studentDetailsPromises = enrollments.map(async (enrollment) => {
            try {
                const studentId = enrollment.studentId || enrollment.StudentId;

                if (!studentId) {
                    console.warn('No student ID found in enrollment:', enrollment);
                    return null;
                }

                const studentInfoResponse = await authFetch(`/user/${studentId}`);

                if (!studentInfoResponse.ok) {
                    console.warn(`Could not fetch info for student ${studentId}`);
                    return null;
                }

                const studentInfo = await studentInfoResponse.json();

                let studentProgress = null;
                try {
                    const studentProgressResponse = await authFetch(`/userprogress/user/${studentId}`);

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
        const validStudentDetails = studentDetails.filter(detail => detail !== null);

        return validStudentDetails;

    } catch (error) {
        console.error('Error fetching all student details:', error);
        return [];
    }
};

export const createAssignmentForClass = async (assignmentData) => {
    try {
        const response = await authFetch(`/assignment`, {
            method: 'POST',
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
    try {
        const response = await authFetch(`/assignment/class/${classId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignments = await response.json();
        return assignments;
    } catch (error) {
        console.error('Error fetching assignments for class:', error);
        return [];
    }
};

export const getAssignmentsByTeacher = async (teacherId) => {
    try {
        const response = await authFetch(`/assignment/teacher/${teacherId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignments = await response.json();
        return assignments;
    } catch (error) {
        console.error('Error fetching assignments for class:', error);
        return [];
    }
};

export const getAssignmentsById = async (assignmentId) => {
    try {
        const response = await authFetch(`/assignment/${assignmentId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignment = await response.json();
        return assignment;
    } catch (error) {
        console.error('Error fetching assignment by ID:', error);
        return null;
    }
};

export const updateAssignment = async (assignmentId, assignmentData) => {
    try {
        const response = await authFetch(`/assignment/${assignmentId}`, {
            method: 'PUT',
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
    try {
        const response = await authFetch(`/assignment/${assignmentId}`, {
            method: 'DELETE'
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
    try {
        const formData = new FormData();
        formData.append('file', imageFile);
        const response = await authFetch(`${API_BASE_URL_BLOB}/upload`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const result = await response.json();
        return result.blobUrl;
    } catch (error) {
        console.error('Error uploading question image:', error);
        throw error;
    }
};

export const createQuestion = async (questionData) => {
    const sanitizedData = {
        ...questionData,
        answerBreakdown: questionData.answerBreakdown || "",
        solutionSteps: questionData.solutionSteps || "",
        figureDescription: questionData.figureDescription || "",
        figureBlobUrl: questionData.figureBlobUrl || "",
        subjectId: questionData.subjectId || null
    };

    try {
        const response = await authFetch(`/question`, {
            method: 'POST',
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

export const createAssignmentQuestion = async (linkData) => {
    const requestBody = {
        assignmentId: parseInt(linkData.assignmentId),
        questionId: parseInt(linkData.questionId),
        points: parseFloat(linkData.points || 1.0)
    };

    try {
        const response = await authFetch(`/assignmentquestion`, {
            method: 'POST',
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

export const getAssignmentQuestions = async (assignmentId) => {
    try {
        const response = await authFetch(`/assignmentquestion/assignment/${assignmentId}`);

        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignmentQuestions = await response.json();
        return assignmentQuestions;
    } catch (error) {
        console.error('Error fetching assignment questions:', error);
        return [];
    }
};

export const getAssignmentWithQuestions = async (assignmentId) => {
    try {
        const assignment = await getAssignmentsById(assignmentId);
        if (!assignment) {
            return null;
        }

        const assignmentQuestions = await getAssignmentQuestions(assignmentId);

        const questionsWithDetails = await Promise.all(
            assignmentQuestions.map(async (aq) => {
                try {
                    const questionResponse = await authFetch(`/question/${aq.questionId}`);

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
            questions: validQuestions
        };
    } catch (error) {
        console.error('Error fetching assignment with questions:', error);
        return null;
    }
};

export const getAssignmentsForClassWithQuestions = async (classId) => {
    try {
        const assignments = await getAssignmentsForClass(classId);

        const assignmentsWithQuestions = await Promise.all(
            assignments.map(async (assignment) => {
                const assignmentQuestions = await getAssignmentQuestions(assignment.id);

                const questionsWithDetails = await Promise.all(
                    assignmentQuestions.map(async (aq) => {
                        try {
                            const questionResponse = await authFetch(`/question/${aq.questionId}`);

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
    try {
        const response = await authFetch(`/Readiness/student/${studentId}/class/${classId}`);
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

export const getUserById = async (userId) => {
    try {
        const response = await authFetch(`/user/${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

// ================================================================
// ASSIGNMENT SUBMISSION TRACKING API FUNCTIONS
// ================================================================

export const getSubmissionsByAssignmentId = async (assignmentId) => {
    try {
        const response = await authFetch(`/assignmentsubmission/assignment/${assignmentId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching submissions for assignment:', error);
        return [];
    }
};

export const getSubmissionStatsForTeacher = async (teacherId) => {
    try {
        const assignments = await getAssignmentsByTeacher(teacherId);

        let totalSubmissions = 0;
        let totalPossibleSubmissions = 0;
        let submissionsByAssignment = {};

        for (const assignment of assignments) {
            try {
                const submissions = await getSubmissionsByAssignmentId(assignment.id);
                const submittedCount = submissions.filter(sub => sub.status === 'submitted').length;

                const enrolledStudents = await getAllEnrolledStudentInfo(assignment.classId);
                const totalStudents = enrolledStudents.length;

                submissionsByAssignment[assignment.id] = {
                    submitted: submittedCount,
                    total: totalStudents,
                    pending: totalStudents - submittedCount,
                    submissionRate: totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0
                };

                totalSubmissions += submittedCount;
                totalPossibleSubmissions += totalStudents;

            } catch (error) {
                console.warn(`Error processing assignment ${assignment.id}:`, error);
                submissionsByAssignment[assignment.id] = {
                    submitted: 0,
                    total: 0,
                    pending: 0,
                    submissionRate: 0
                };
            }
        }

        return {
            totalSubmissions,
            totalPossibleSubmissions,
            overallSubmissionRate: totalPossibleSubmissions > 0 ? (totalSubmissions / totalPossibleSubmissions) * 100 : 0,
            submissionsByAssignment
        };

    } catch (error) {
        console.error('Error fetching submission stats:', error);
        return {
            totalSubmissions: 0,
            totalPossibleSubmissions: 0,
            overallSubmissionRate: 0,
            submissionsByAssignment: {}
        };
    }
};

export const getAssignmentWithSubmissionStats = async (assignmentId) => {
    try {
        const assignmentResponse = await authFetch(`/assignment/${assignmentId}`);

        if (!assignmentResponse.ok) {
            throw new Error(`HTTP error! status: ${assignmentResponse.status}`);
        }

        const assignment = await assignmentResponse.json();

        const submissions = await getSubmissionsByAssignmentId(assignmentId);
        const enrolledStudents = await getAllEnrolledStudentInfo(assignment.classId);

        const submittedCount = submissions.filter(sub => sub.status === 'submitted').length;
        const inProgressCount = submissions.filter(sub => sub.status === 'in_progress').length;
        const notStartedCount = enrolledStudents.length - submissions.length;
        const totalStudents = enrolledStudents.length;

        return {
            ...assignment,
            submissionStats: {
                submitted: submittedCount,
                inProgress: inProgressCount,
                notStarted: notStartedCount,
                total: totalStudents,
                submissionRate: totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0
            },
            submissions: submissions
        };

    } catch (error) {
        console.error('Error fetching assignment with submission stats:', error);
        throw error;
    }
};

export const getAnswersBySubmissionId = async (submissionId) => {
    try {
        const response = await authFetch(`/assignmentanswer/submission/${submissionId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching answers for submission:', error);
        return [];
    }
};

export const getSubmissionDetails = async (submissionId) => {
    try {
        const response = await authFetch(`/assignmentsubmission/${submissionId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const submission = await response.json();

        const answersResponse = await authFetch(`/assignmentanswer/submission/${submissionId}`);

        if (answersResponse.ok) {
            const answers = await answersResponse.json();
            submission.answers = answers;
        }

        return submission;
    } catch (error) {
        console.error('Error fetching submission details:', error);
        throw error;
    }
};

export const gradeSubmission = async (submissionId, score, feedback = '') => {
    try {
        const response = await authFetch(`/assignmentsubmission/${submissionId}/grade`, {
            method: 'PUT',
            body: JSON.stringify({
                score: parseFloat(score),
                feedback: feedback,
                gradedAt: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error grading submission:', error);
        throw error;
    }
};

export const exportSubmissionData = async (assignmentId, format = 'csv') => {
    try {
        const response = await authFetch(`/assignment/${assignmentId}/export?format=${format}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `assignment-${assignmentId}-results.${format}`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return true;
    } catch (error) {
        console.error('Error exporting submission data:', error);
        throw error;
    }
};

// ================================================================
// ASSIGNMENT QUESTION MANAGEMENT API FUNCTIONS
// ================================================================

export const getAssignmentQuestionsById = async (assignmentId) => {
    try {
        const assignmentQuestionLinks = await getAssignmentQuestions(assignmentId);

        if (!Array.isArray(assignmentQuestionLinks) || assignmentQuestionLinks.length === 0) {
            return [];
        }

        const questionsWithDetails = await Promise.all(
            assignmentQuestionLinks.map(async (link) => {
                try {
                    const response = await authFetch(`/question/${link.questionId}`);

                    if (!response.ok) {
                        console.warn(`Failed to fetch question ${link.questionId}:`, response.status);
                        return null;
                    }

                    const questionDetails = await response.json();

                    return {
                        ...questionDetails,
                        points: link.points || questionDetails.points || 1.0,
                        assignmentQuestionId: link.id
                    };
                } catch (error) {
                    console.warn(`Error fetching question ${link.questionId}:`, error);
                    return null;
                }
            })
        );

        return questionsWithDetails.filter(q => q !== null);
    } catch (error) {
        console.error('Error fetching assignment questions:', error);
        return [];
    }
};

export const saveQuestionToAssignment = async (assignmentId, questionData) => {
    try {
        const createdQuestion = await createQuestion({
            questionText: questionData.questionText,
            answerType: questionData.answerType,
            difficultyLevel: questionData.difficultyLevel,
            points: questionData.points,
            multipleChoiceOptions: questionData.multipleChoiceOptions || [],
            correctAnswer: questionData.correctAnswer,
            answerBreakdown: questionData.answerBreakdown,
            imageAssociated: questionData.imageAssociated,
            imageDescription: questionData.imageDescription
        });

        await createAssignmentQuestion({
            assignmentId: assignmentId,
            questionId: createdQuestion.id,
            points: questionData.points
        });

        return createdQuestion;
    } catch (error) {
        console.error('Error saving question to assignment:', error);
        throw error;
    }
};

export const updateQuestionInAssignment = async (assignmentId, questionId, questionData) => {
    try {
        const response = await authFetch(`/question/${questionId}`, {
            method: 'PUT',
            body: JSON.stringify({
                id: questionId,
                questionText: questionData.questionText,
                answerType: questionData.answerType,
                difficultyLevel: questionData.difficultyLevel,
                points: questionData.points,
                multipleChoiceOptions: questionData.multipleChoiceOptions || [],
                correctAnswer: questionData.correctAnswer,
                answerBreakdown: questionData.answerBreakdown,
                imageAssociated: questionData.imageAssociated,
                imageDescription: questionData.imageDescription
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating question in assignment:', error);
        throw error;
    }
};

export const deleteQuestionFromAssignment = async (assignmentId, questionId) => {
    try {
        const assignmentQuestionLinks = await getAssignmentQuestions(assignmentId);
        const linkToDelete = assignmentQuestionLinks.find(link => link.questionId === parseInt(questionId));

        if (!linkToDelete) {
            throw new Error('Assignment-question link not found');
        }

        const response1 = await authFetch(`/assignmentquestion/${linkToDelete.id}`, {
            method: 'DELETE'
        });

        return response1.ok;
    } catch (error) {
        console.error('Error deleting question from assignment:', error);
        throw error;
    }
};
