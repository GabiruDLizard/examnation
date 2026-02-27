import { authFetch } from '../../../utils/api';
import { getUserIdFromToken } from '../../../utils/tokenUtils';

// ================================================================
// ASSIGNMENT QUESTION API FUNCTIONS
// ================================================================

export const getAllAssignmentQuestions = async () => {
    try {
        const response = await authFetch(`/assignmentquestion`);

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
    try {
        const response = await authFetch(`/assignmentquestion/${id}`);

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
    try {
        const response = await authFetch(`/assignmentquestion/assignment/${assignmentId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignmentQuestions = await response.json();

        const questionsWithDetails = await Promise.all(
            assignmentQuestions.map(async (assignmentQuestion) => {
                try {
                    const questionResponse = await authFetch(`/question/${assignmentQuestion.questionId}`);

                    if (!questionResponse.ok) {
                        console.warn(`Failed to fetch question ${assignmentQuestion.questionId}`);
                        return { ...assignmentQuestion, questionDetails: null };
                    }

                    const questionDetails = await questionResponse.json();

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
    try {
        const response = await authFetch(`/assignmentquestion`, {
            method: 'POST',
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
    try {
        const response = await authFetch(`/assignmentquestion/${assignmentQuestion.id}`, {
            method: 'PUT',
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
    try {
        const response = await authFetch(`/assignmentquestion/${id}`, {
            method: 'DELETE'
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
    try {
        const userId = getUserIdFromToken();

        const response = await authFetch(`/user/${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const studentData = await response.json();
        return studentData;
    } catch (error) {
        console.error('Error fetching student info:', error);
        throw error;
    }
};

export const getUserProgress = async (userId) => {
    try {
        const response = await authFetch(`/userprogress/user/${userId}`);

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
    try {
        const response = await authFetch(`/answer/user/${userId}`);

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
    try {
        const response = await authFetch(`/classenrollment/student/${userId}`);

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
    try {
        const response = await authFetch(`/class/${classId}`);

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
        const enrollments = await getStudentEnrollments(userId);

        if (!enrollments || enrollments.length === 0) {
            return [];
        }

        const classDetailsPromises = enrollments.map(async (enrollment) => {
            const classDetails = await getClassDetails(enrollment.classId);

            return {
                enrollmentId: enrollment.id,
                classId: enrollment.classId,
                enrollmentDate: enrollment.enrollmentDate,
                status: enrollment.status || 'Active',
                progress: enrollment.progress || 0,
                averageScore: enrollment.averageScore || 0,
                completedAssignments: enrollment.completedAssignments || 0,
                totalAssignments: enrollment.totalAssignments || 0,

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
        return [];
    }
};

// ================================================================
// ASSIGNMENT SUBMISSION API FUNCTIONS
// ================================================================

export const getSubmissionByAssignmentAndStudent = async (assignmentId, studentId) => {
    try {
        const response = await authFetch(`/assignmentsubmission/assignment/${assignmentId}/student/${studentId}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching submission:', error);
        throw error;
    }
};

export const createSubmission = async (submissionData) => {
    try {
        const response = await authFetch(`/assignmentsubmission`, {
            method: 'POST',
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Create submission failed:', { status: response.status, error: errorText });
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('❌ Error creating submission:', error);
        throw error;
    }
};

export const updateSubmission = async (submissionData) => {
    try {
        const response = await authFetch(`/assignmentsubmission/${submissionData.id}`, {
            method: 'PUT',
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Update submission failed:', { status: response.status, error: errorText });
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('❌ Error updating submission:', error);
        throw error;
    }
};

// ================================================================
// ASSIGNMENT ANSWER API FUNCTIONS
// ================================================================

export const getAnswersBySubmissionId = async (submissionId) => {
    try {
        const response = await authFetch(`/assignmentanswer/submission/${submissionId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching answers:', error);
        throw error;
    }
};

export const saveAnswerToBackend = async (answerData) => {
    try {
        console.log('💾 Saving answer with auto-grading:', answerData);

        // Get the question details to check the correct answer
        let questionDetails = null;
        let isCorrect = null;
        let pointsEarned = 0;

        try {
            const questionResponse = await authFetch(`/question/${answerData.questionId}`);
            if (questionResponse.ok) {
                questionDetails = await questionResponse.json();
                console.log('📋 Question details loaded:', {
                    questionId: answerData.questionId,
                    correctAnswer: questionDetails.correctAnswer
                });

                if (questionDetails.correctAnswer && answerData.answer) {
                    // Extract final answer from student's work
                    const studentFinalAnswer = extractFinalAnswer(answerData.answer);
                    
                    // Compare with correct answer
                    isCorrect = compareAnswers(studentFinalAnswer, questionDetails.correctAnswer);
                    
                    // Calculate points (you might need to get this from assignment question link)
                    pointsEarned = isCorrect ? 1 : 0; // Default to 1 point, could be enhanced
                    
                    console.log('🔍 Auto-grading result:', {
                        studentAnswer: studentFinalAnswer,
                        correctAnswer: questionDetails.correctAnswer,
                        isCorrect,
                        pointsEarned
                    });
                }
            }
        } catch (questionError) {
            console.warn('⚠️ Could not load question for auto-grading:', questionError);
        }

        // Check if answer already exists
        const existingResponse = await authFetch(`/assignmentanswer/submission/${answerData.submissionId}/question/${answerData.questionId}`);

        if (existingResponse.ok) {
            // Update existing answer
            const existingAnswer = await existingResponse.json();
            
            const updateData = {
                ...existingAnswer,
                answer: answerData.answer,
                isCorrect: isCorrect,
                pointsEarned: pointsEarned
            };

            console.log('🔄 Updating existing answer with grading:', updateData);

            const updateResponse = await authFetch(`/assignmentanswer/${existingAnswer.id}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            if (!updateResponse.ok) {
                throw new Error(`HTTP error! status: ${updateResponse.status}`);
            }

            return await updateResponse.json();
        } else {
            // Create new answer
            const newAnswerData = {
                submissionId: answerData.submissionId,
                questionId: answerData.questionId,
                answer: answerData.answer,
                isCorrect: isCorrect,
                pointsEarned: pointsEarned
            };

            console.log('🆕 Creating new answer with grading:', newAnswerData);

            const createResponse = await authFetch(`/assignmentanswer`, {
                method: 'POST',
                body: JSON.stringify(newAnswerData)
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`HTTP error! status: ${createResponse.status}, message: ${errorText}`);
            }

            return await createResponse.json();
        }
    } catch (error) {
        console.error('❌ Error saving answer:', error);
        throw error;
    }
};

export const submitAssignmentToBackend = async (assignmentId, studentId) => {
    try {
        const submission = await getSubmissionByAssignmentAndStudent(assignmentId, studentId);

        await checkAndGradeAnswers(assignmentId, submission.id);

        if (submission) {
            const updatedSubmission = {
                ...submission,
                status: 'submitted',
                submittedAt: new Date().toISOString()
            };
            const result = await updateSubmission(updatedSubmission);
            return result;
        } else {
            const newSubmission = {
                assignmentId: assignmentId,
                studentId: studentId,
                status: 'submitted',
                submittedAt: new Date().toISOString()
            };
            const result = await createSubmission(newSubmission);

            await checkAndGradeAnswers(assignmentId, result.id);

            return result;
        }
    } catch (error) {
        console.error('❌ Error submitting assignment:', error);
        throw error;
    }
};

export const checkAndGradeAnswers = async (assignmentId, submissionId) => {
    try {
        console.log('🎯 Starting auto-grading for submission:', submissionId);
        
        const questions = await getQuestionsByAssignmentId(assignmentId);
        const submittedAnswers = await getAnswersBySubmissionId(submissionId);
        
        console.log('📋 Questions loaded:', questions.length);
        console.log('📝 Submitted answers:', submittedAnswers.length);

        let totalScore = 0;
        let totalPoints = 0;
        let gradedAnswers = 0;

        for (const submittedAnswer of submittedAnswers) {
            try {
                // Find the corresponding question - handle both old and new question structures
                const question = questions.find(q => {
                    // Try both question.questionDetails.id and question.id
                    const questionId = q.questionDetails?.id || q.id;
                    return questionId === submittedAnswer.questionId;
                });

                if (!question) {
                    console.warn('❓ Question not found for answer:', submittedAnswer.questionId);
                    console.log('Available question IDs:', questions.map(q => q.questionDetails?.id || q.id));
                    continue;
                }

                // Get the correct answer from either structure
                const correctAnswer = question.questionDetails?.correctAnswer || question.correctAnswer;
                const questionPoints = question.points || 1;
                
                console.log('🔍 Grading question:', {
                    questionId: submittedAnswer.questionId,
                    correctAnswer: correctAnswer,
                    studentAnswer: submittedAnswer.answer,
                    points: questionPoints
                });

                if (!correctAnswer) {
                    console.warn('❓ No correct answer found for question:', submittedAnswer.questionId);
                    continue;
                }

                const studentAnswer = submittedAnswer.answer;
                const studentFinalAnswer = extractFinalAnswer(studentAnswer);
                
                console.log('📝 Answer extraction:', {
                    originalAnswer: studentAnswer,
                    extractedFinal: studentFinalAnswer
                });
                
                const isCorrect = compareAnswers(studentFinalAnswer, correctAnswer);
                const pointsEarned = isCorrect ? questionPoints : 0;

                console.log('📊 Grading result:', {
                    questionId: submittedAnswer.questionId,
                    isCorrect,
                    pointsEarned,
                    maxPoints: questionPoints
                });

                await updateAnswerGrading(submittedAnswer.id, isCorrect, pointsEarned);

                totalScore += pointsEarned;
                totalPoints += questionPoints;
                gradedAnswers++;

            } catch (error) {
                console.error('❌ Error checking answer:', submittedAnswer.id, error);
            }
        }

        const finalResults = {
            totalScore,
            totalPoints,
            percentage: totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0,
            gradedAnswers
        };

        console.log('📈 Final grading results:', finalResults);
        
        return finalResults;

    } catch (error) {
        console.error('❌ Error in checkAndGradeAnswers:', error);
        throw error;
    }
};

const extractFinalAnswer = (studentWork) => {
    if (!studentWork) return '';

    // Handle both actual newlines and escaped newlines
    if (typeof studentWork === 'string' && !studentWork.includes('\n') && !studentWork.includes('\\n')) {
        return studentWork.trim();
    }

    // Split by actual newlines OR escaped newlines
    const steps = studentWork.split(/\\n|\n/).filter(step => step.trim());
    return steps.length > 0 ? steps[steps.length - 1].trim() : '';
};

const compareAnswers = (studentAnswer, correctAnswer) => {
    if (!studentAnswer || !correctAnswer) return false;

    console.log('🔍 Comparing answers:', {
        student: `"${studentAnswer}"`,
        correct: `"${correctAnswer}"`,
        studentType: typeof studentAnswer,
        correctType: typeof correctAnswer
    });

    const normalizeAnswer = (answer) => {
        return String(answer)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[()]/g, '') // Remove parentheses
            .replace(/\$/g, '') // Remove dollar signs
            .replace(/,/g, '') // Remove commas
            .replace(/[^\w\s.-]/g, ''); // Remove special characters except word chars, spaces, dots, hyphens
    };

    const normalizedStudent = normalizeAnswer(studentAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);

    console.log('🔄 Normalized comparison:', {
        student: `"${normalizedStudent}"`,
        correct: `"${normalizedCorrect}"`,
        match: normalizedStudent === normalizedCorrect
    });

    // First try exact match after normalization
    if (normalizedStudent === normalizedCorrect) {
        return true;
    }

    // Try numeric comparison if both look like numbers
    const studentNum = parseFloat(normalizedStudent);
    const correctNum = parseFloat(normalizedCorrect);
    
    if (!isNaN(studentNum) && !isNaN(correctNum)) {
        console.log('🔢 Numeric comparison:', {
            studentNum,
            correctNum,
            match: Math.abs(studentNum - correctNum) < 0.001
        });
        // Allow small floating point differences
        return Math.abs(studentNum - correctNum) < 0.001;
    }

    return false;
};

const updateAnswerGrading = async (answerId, isCorrect, pointsEarned) => {
    try {
        console.log('📊 Updating answer grading:', {
            answerId,
            isCorrect: isCorrect,
            isCorrectType: typeof isCorrect,
            pointsEarned
        });

        // Ensure isCorrect is a proper boolean
        const isCorrectBoolean = Boolean(isCorrect);
        
        const updateData = {
            isCorrect: isCorrectBoolean,
            pointsEarned: Number(pointsEarned) || 0
        };

        console.log('📤 Sending update data:', updateData);

        const response = await authFetch(`/assignmentanswer/${answerId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Answer grading update failed:', {
                status: response.status,
                error: errorText,
                answerId,
                updateData
            });
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Answer grading updated successfully:', result);
        return result;
    } catch (error) {
        console.error('❌ Error updating answer grading:', error);
        throw error;
    }
};
