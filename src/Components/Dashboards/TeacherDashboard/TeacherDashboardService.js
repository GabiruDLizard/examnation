import { authFetch } from '../../../utils/api';
import { getUserIdFromToken } from '../../../utils/tokenUtils';


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
        throw error;
    }
};

// ================================================================
// TOPIC ABILITY (MIRT) API FUNCTIONS
// ================================================================

export const updateStudentTopicAbility = async (studentId, topic, theta, questionsAnswered) => {
    try {
        const response = await authFetch('/studenttopicability/upsert', {
            method: 'POST',
            body: JSON.stringify({ studentId, topic, theta, questionsAnswered })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getStudentTopicAbility = async (studentId) => {
    try {
        const response = await authFetch(`/studenttopicability/student/${studentId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch {
        return [];
    }
};

export const getClassTopicAbility = async (classId) => {
    try {
        const response = await authFetch(`/studenttopicability/class/${classId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch {
        return [];
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
        throw error;
    }
};

export const getTeacherReadinessChartData = async (teacherId, daysBack = 30) => {
    try {
        const response = await authFetch(`/Readiness/teacher/${teacherId}/chart-data?daysBack=${daysBack}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
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
        throw error;
    }
};

export const searchStudents = async (query, institutionId) => {
    if (!query || query.trim().length < 2) return [];
    try {
        const qs = new URLSearchParams({ query: query.trim() });
        if (institutionId) qs.set('institutionId', institutionId);
        const response = await authFetch(`/user/search?${qs}`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
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
            return [];
        }

        if (enrollments.length === 0) {
            return [];
        }

        // Fetch class assignments once, then all submissions in parallel
        const classAssignments = await getAssignmentsForClass(classId).catch(() => []);
        const totalAssignments = classAssignments.length;

        const allSubmissionsArrays = await Promise.all(
            classAssignments.map(a => getSubmissionsByAssignmentId(a.id).catch(() => []))
        );
        const allSubmissions = allSubmissionsArrays.flat();

        const studentDetailsPromises = enrollments.map(async (enrollment) => {
            try {
                const studentId = enrollment.studentId || enrollment.StudentId;

                if (!studentId) {
                    return null;
                }

                const studentInfoResponse = await authFetch(`/user/${studentId}`);

                if (!studentInfoResponse.ok) {
                    return null;
                }

                const studentInfo = await studentInfoResponse.json();

                // Compute progress from real submission + readiness data
                const studentSubmissions = allSubmissions.filter(
                    s => (s.studentId ?? s.StudentId) === studentId
                );
                const completed = studentSubmissions.filter(
                    s => s.status === 'submitted' || s.status === 'graded'
                );
                const scored = completed.filter(s => s.grade != null);
                const averageScore = scored.length > 0
                    ? Math.round(scored.reduce((sum, s) => sum + s.grade, 0) / scored.length)
                    : 0;
                const lastSubmission = completed
                    .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0))[0];

                let readinessLevel = 0;
                try {
                    const history = await getStudentReadinessHistory(studentId, 4);
                    if (Array.isArray(history) && history.length > 0) {
                        const sorted = [...history].sort(
                            (a, b) => new Date(b.weekDate ?? b.recordedAt ?? 0) - new Date(a.weekDate ?? a.recordedAt ?? 0)
                        );
                        const classRecord = sorted.find(r => r.classId === classId) ?? sorted[0];
                        readinessLevel = Math.round(classRecord?.readinessPercentage ?? 0);
                    }
                } catch { /* no readiness recorded yet */ }

                let studentProgress = null;
                if (completed.length > 0 || readinessLevel > 0) {
                    studentProgress = {
                        averageScore,
                        readinessLevel,
                        assignmentsCompleted: completed.length,
                        totalAssignments,
                        attendanceRate: null,
                        lastActivity: lastSubmission?.submittedAt ?? null,
                    };
                }

                return [studentInfo, studentProgress];
            } catch {
                return null;
            }
        });

        const studentDetails = await Promise.all(studentDetailsPromises);
        return studentDetails.filter(detail => detail !== null);

    } catch {
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
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const createdAssignment = await response.json();
        return createdAssignment;
    } catch (error) {
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
    } catch {
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
    } catch {
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
    } catch {
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
        throw error;
    }
};

export const uploadQuestionImage = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append('file', imageFile);
        const response = await authFetch(`/File/upload`, {
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
        throw error;
    }
};

export const createQuestion = async (questionData) => {
    const { imageAssociated, imageDescription, options, multipleChoiceOptions, ...rest } = questionData;

    // Normalize MC options — accept either key name, handle plain strings or {text,imageUrl} objects
    const rawOptions = multipleChoiceOptions || options || [];
    const normalizedOptions = rawOptions.map(o => {
        if (typeof o === 'string') return o;
        if (o?.imageUrl) return JSON.stringify({ text: o.text, imageUrl: o.imageUrl });
        return o?.text || '';
    });

    const sanitizedData = {
        ...rest,
        multipleChoiceOptions: normalizedOptions,
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
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const createdQuestion = await response.json();
        return createdQuestion;
    } catch (error) {
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
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const createdLink = await response.json();
        return createdLink;
    } catch (error) {
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
    } catch {
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
                } catch {
                    return null;
                }
            })
        );

        const validQuestions = questionsWithDetails.filter(q => q !== null);

        return {
            ...assignment,
            questions: validQuestions
        };
    } catch {
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
                        } catch {
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
    } catch {
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
    } catch {
        return [];
    }
};

export const getSubmissionStatsForTeacher = async (teacherId) => {
    try {
        const assignments = await getAssignmentsByTeacher(teacherId);

        const results = await Promise.all(assignments.map(async (assignment) => {
            try {
                const [submissions, enrollments] = await Promise.all([
                    getSubmissionsByAssignmentId(assignment.id),
                    getClassEnrollments(assignment.classId)
                ]);
                const submittedCount = submissions.filter(sub =>
                    ['submitted', 'pending_review', 'graded', 'needs_revision'].includes(sub.status)
                ).length;
                const totalStudents = Array.isArray(enrollments) ? enrollments.length : 0;
                return { assignmentId: assignment.id, submittedCount, totalStudents };
            } catch {
                return { assignmentId: assignment.id, submittedCount: 0, totalStudents: 0 };
            }
        }));

        let totalSubmissions = 0;
        let totalPossibleSubmissions = 0;
        const submissionsByAssignment = {};

        for (const { assignmentId, submittedCount, totalStudents } of results) {
            submissionsByAssignment[assignmentId] = {
                submitted: submittedCount,
                total: totalStudents,
                pending: totalStudents - submittedCount,
                submissionRate: totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0
            };
            totalSubmissions += submittedCount;
            totalPossibleSubmissions += totalStudents;
        }

        return {
            totalSubmissions,
            totalPossibleSubmissions,
            overallSubmissionRate: totalPossibleSubmissions > 0 ? (totalSubmissions / totalPossibleSubmissions) * 100 : 0,
            submissionsByAssignment
        };

    } catch {
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

        const SUBMITTED_STATUSES = ['submitted', 'pending_review', 'graded', 'needs_revision'];
        const submittedCount = submissions.filter(sub => SUBMITTED_STATUSES.includes(sub.status)).length;
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
    } catch {
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
        throw error;
    }
};

export const updateAnswerGrade = async (answerId, submissionId, questionId, answerText, isCorrect, pointsEarned) => {
    const response = await authFetch(`/assignmentanswer/${answerId}`, {
        method: 'PUT',
        body: JSON.stringify({ id: answerId, submissionId, questionId, answer: answerText, isCorrect, pointsEarned })
    });
    if (!response.ok) throw new Error('Failed to update answer grade');
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
        throw error;
    }
};

// Approves a pending submission — triggers mastery update and records readiness.
export const approveSubmission = async (submissionId, assignmentId, studentId, classId) => {
    const { applyMasteryAndFinalize } = await import('../StudentDashboard/StudentDashboardService');
    const { readinessPercentage, abilityEstimate } = await applyMasteryAndFinalize(assignmentId, submissionId, studentId);
    if (classId) {
        await recordStudentReadiness(studentId, classId, {
            readinessPercentage,
            questionsAnswered: 0,
            correctAnswers: 0,
            studyTimeMinutes: 0,
            abilityEstimate
        }).catch(() => {});
    }
    return { readinessPercentage };
};

// Sends a submission back to the student with an optional comment.
export const sendBackSubmission = async (submissionId, comment = '') => {
    const subResponse = await authFetch(`/assignmentsubmission/${submissionId}`);
    if (!subResponse.ok) throw new Error('Failed to fetch submission');
    const sub = await subResponse.json();
    const res = await authFetch(`/assignmentsubmission/${submissionId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...sub, status: 'needs_revision', feedback: comment })
    });
    if (!res.ok) throw new Error('Failed to send back submission');
    return res.json();
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
                        return null;
                    }

                    const questionDetails = await response.json();

                    return {
                        ...questionDetails,
                        points: link.points || questionDetails.points || 1.0,
                        assignmentQuestionId: link.id
                    };
                } catch (error) {
                    return null;
                }
            })
        );

        return questionsWithDetails.filter(q => q !== null);
    } catch {
        return [];
    }
};

// Serialize MC options for the API — backend expects string[].
// Options with images are stored as JSON strings so no schema change is needed.
const serializeOptions = (options = []) =>
    options.map(o => {
        if (typeof o === 'string') return o;
        if (o.imageUrl) return JSON.stringify({ text: o.text, imageUrl: o.imageUrl });
        return o.text || '';
    });

export const saveQuestionToAssignment = async (assignmentId, questionData) => {
    try {
        let figureBlobUrl = questionData.figureBlobUrl || '';
        if (questionData.imageAssociated instanceof File) {
            figureBlobUrl = await uploadQuestionImage(questionData.imageAssociated);
        }

        const createdQuestion = await createQuestion({
            questionText: questionData.questionText,
            answerType: questionData.answerType,
            difficultyLevel: String(questionData.difficultyLevel),
            subject: questionData.subject || 'General',
            points: questionData.points,
            multipleChoiceOptions: serializeOptions(questionData.multipleChoiceOptions),
            correctAnswer: questionData.correctAnswer,
            answerBreakdown: questionData.answerBreakdown,
            figureBlobUrl,
            figureDescription: questionData.imageDescription || '',
            source: 'teacher'
        });

        await createAssignmentQuestion({
            assignmentId: assignmentId,
            questionId: createdQuestion.id,
            points: questionData.points
        });

        return createdQuestion;
    } catch (error) {
        throw error;
    }
};

export const updateQuestionInAssignment = async (assignmentId, questionId, questionData) => {
    try {
        let figureBlobUrl = questionData.figureBlobUrl || '';
        if (questionData.imageAssociated instanceof File) {
            figureBlobUrl = await uploadQuestionImage(questionData.imageAssociated);
        }

        const [questionResponse, aqLinks] = await Promise.all([
            authFetch(`/question/${questionId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    id: questionId,
                    questionText: questionData.questionText,
                    answerType: questionData.answerType,
                    difficultyLevel: String(questionData.difficultyLevel),
                    subject: questionData.subject || 'General',
                    points: questionData.points,
                    multipleChoiceOptions: serializeOptions(questionData.multipleChoiceOptions),
                    correctAnswer: questionData.correctAnswer,
                    answerBreakdown: questionData.answerBreakdown,
                    figureBlobUrl,
                    figureDescription: questionData.imageDescription || ''
                })
            }),
            authFetch(`/assignmentquestion/assignment/${assignmentId}`)
        ]);

        if (!questionResponse.ok) throw new Error(`HTTP error! status: ${questionResponse.status}`);

        // Update points on the junction record
        if (aqLinks.ok && questionData.points != null) {
            const links = await aqLinks.json();
            const link = links.find(l => l.questionId === questionId);
            if (link) {
                await authFetch(`/assignmentquestion/${link.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...link, points: parseFloat(questionData.points) })
                });
            }
        }

        return await questionResponse.json();
    } catch (error) {
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
        throw error;
    }
};

