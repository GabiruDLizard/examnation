import { authFetch } from '../../../utils/api';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import { analyzeMistakePatterns } from '../../PerformanceEngine/^PerformanceAnalysis';
import { abilityEstimate } from '../Charts/ReadinessLogic';
import { updateStudentTopicAbility, getStudentTopicAbility } from '../TeacherDashboard/TeacherDashboardService';
import { evaluate as mjsEval } from 'mathjs';

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
                        return { ...assignmentQuestion, questionDetails: null };
                    }

                    const questionDetails = await questionResponse.json();

                    return {
                        ...assignmentQuestion,
                        ...questionDetails
                    };
                } catch (error) {
                    return { ...assignmentQuestion, questionDetails: null };
                }
            })
        );

        return questionsWithDetails;
    } catch (error) {
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
        throw error;
    }
};

export const getUserProgress = async (userId) => {
    try {
        const response = await authFetch(`/userprogress/user/${userId}`);

        if (!response.ok) {
            return {};
        }

        const progressData = await response.json();
        return progressData;
    } catch (error) {
        return {};
    }
};

export const getStudentAnswers = async (userId) => {
    try {
        const response = await authFetch(`/answer/user/${userId}`);

        if (!response.ok) {
            return [];
        }

        const answersData = await response.json();
        return answersData;
    } catch (error) {
        return [];
    }
};

export const getStudentEnrollments = async (userId) => {
    try {
        const response = await authFetch(`/classenrollment/student/${userId}`);

        if (!response.ok) {
            return [];
        }

        const enrollmentsData = await response.json();
        return enrollmentsData;
    } catch (error) {
        return [];
    }
};

export const getClassDetails = async (classId) => {
    try {
        const response = await authFetch(`/class/${classId}`);

        if (!response.ok) {
            return null;
        }

        const classData = await response.json();
        return classData;
    } catch (error) {
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

            let avgReadiness = 0;
            try {
                const rdResponse = await authFetch(`/Readiness/student/${userId}/class/${enrollment.classId}`);
                if (rdResponse.ok) {
                    const rdData = await rdResponse.json();
                    avgReadiness = Math.round(rdData?.readinessPercentage ?? 0);
                }
            } catch { /* no readiness recorded yet */ }

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
                avgReadiness,
                activeAssignments: classDetails?.activeAssignments || enrollment.pendingAssignments || 0,
                lastActivity: enrollment.lastActivity || new Date().toISOString()
            };
        });

        const classesWithDetails = await Promise.all(classDetailsPromises);
        return classesWithDetails.filter(cls => cls !== null);

    } catch (error) {
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

export const getAssignmentsForClass = async (classId, studentId) => {
    try {
        const studentParam = studentId ? `?studentId=${studentId}` : '';
        const response = await authFetch(`/assignment/class/${classId}${studentParam}`);
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
                    return {
                        ...assignment,
                        questions: []
                    };
                }
            })
        );

        return assignmentsWithQuestions;
    } catch (error) {
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
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
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
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
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
        throw error;
    }
};

export const saveAnswerToBackend = async (answerData) => {
    try {
        // Get the question details to check the correct answer
        let questionDetails = null;
        let isCorrect = null;
        let pointsEarned = 0;

        try {
            const questionResponse = await authFetch(`/question/${answerData.questionId}`);
            if (questionResponse.ok) {
                questionDetails = await questionResponse.json();

                if (questionDetails.correctAnswer && answerData.answer) {
                    // Extract final answer from student's work
                    const studentFinalAnswer = extractFinalAnswer(answerData.answer);
                    
                    // Compare with correct answer
                    isCorrect = compareAnswers(studentFinalAnswer, questionDetails.correctAnswer);

                    // Calculate points (you might need to get this from assignment question link)
                    pointsEarned = isCorrect ? 1 : 0; // Default to 1 point, could be enhanced
                }
            }
        } catch (questionError) {
            // Could not load question for auto-grading; proceed without it
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
        throw error;
    }
};

export const submitAssignmentToBackend = async (assignmentId, studentId) => {
    try {
        const submission = await getSubmissionByAssignmentAndStudent(assignmentId, studentId);

        if (submission) {
            const updatedSubmission = {
                ...submission,
                status: 'submitted',
                submittedAt: new Date().toISOString()
            };
            return await updateSubmission(updatedSubmission);
        } else {
            const newSubmission = {
                assignmentId: assignmentId,
                studentId: studentId,
                status: 'submitted',
                submittedAt: new Date().toISOString()
            };
            return await createSubmission(newSubmission);
        }
    } catch (error) {
        throw error;
    }
};

export const checkAndGradeAnswers = async (assignmentId, submissionId) => {
    try {
        const questions = await getQuestionsByAssignmentId(assignmentId);
        const submittedAnswers = await getAnswersBySubmissionId(submissionId);

        const studentId = getUserIdFromToken();

        let totalScore = 0;
        let totalPoints = 0;
        let gradedAnswers = 0;
        let theta = 0;
        const wrongAnswersForTA = [];

        // Seed per-topic thetas from the student's stored cumulative ability so
        // estimation continues from their current level rather than starting at 0.
        const existingThetas = studentId
            ? await getStudentTopicAbility(studentId).catch(() => [])
            : [];
        const topicThetas = {};
        existingThetas.forEach(row => {
            topicThetas[row.topic] = { theta: row.theta, count: row.questionsAnswered || 1 };
        });

        for (const submittedAnswer of submittedAnswers) {
            try {
                // Find the corresponding question - handle both old and new question structures
                const question = questions.find(q => {
                    // Try both question.questionDetails.id and question.id
                    const questionId = q.questionDetails?.id || q.id;
                    return questionId === submittedAnswer.questionId;
                });

                if (!question) {
                    continue;
                }

                // Get the correct answer from either structure
                const correctAnswer = question.questionDetails?.correctAnswer || question.correctAnswer;
                const questionPoints = question.points || 1;

                if (!correctAnswer) {
                    continue;
                }

                const studentAnswer = submittedAnswer.answer;
                const studentFinalAnswer = extractFinalAnswer(studentAnswer);

                const isCorrect = compareAnswers(studentFinalAnswer, correctAnswer);
                const pointsEarned = isCorrect ? questionPoints : 0;

                await updateAnswerGrading(submittedAnswer.id, isCorrect, pointsEarned);

                if (!isCorrect) {
                    wrongAnswersForTA.push({
                        questionId: question.questionDetails?.id || question.id,
                        questionText: question.questionDetails?.questionText || question.questionText || '',
                        workingSteps: studentAnswer,
                        studentAnswer: studentFinalAnswer,
                        correctAnswer,
                        topic: question.questionDetails?.subject || question.subject || 'General',
                        difficulty: question.questionDetails?.difficultyLevel || question.difficultyLevel || null,
                    });
                }

                const difficulty = question.questionDetails?.difficultyLevel || question.difficultyLevel || 'Medium';
                const subject = question.questionDetails?.subject || question.subject || 'General';

                // Update overall theta
                theta = abilityEstimate(difficulty, isCorrect, theta, gradedAnswers);

                // Update per-topic theta
                if (!topicThetas[subject]) topicThetas[subject] = { theta: 0, count: 0 };
                topicThetas[subject].theta = abilityEstimate(
                    difficulty, isCorrect, topicThetas[subject].theta, topicThetas[subject].count
                );
                topicThetas[subject].count++;

                totalScore += pointsEarned;
                totalPoints += questionPoints;
                gradedAnswers++;

            } catch (error) {
            }
        }

        // Fire-and-forget TA analysis for wrong answers
        if (wrongAnswersForTA.length > 0) {
            analyzeMistakePatterns(
                wrongAnswersForTA.map(a => a.workingSteps),
                wrongAnswersForTA.map(a => a.questionText),
                {
                    studentId,
                    questionIds: wrongAnswersForTA.map(a => a.questionId),
                    topics: wrongAnswersForTA.map(a => a.topic),
                    difficulties: wrongAnswersForTA.map(a => a.difficulty),
                    correctAnswers: wrongAnswersForTA.map(a => a.correctAnswer),
                    studentAnswers: wrongAnswersForTA.map(a => a.studentAnswer),
                    source: 'assignment'
                }
            ).catch(() => { /* non-fatal */ });
        }

        // Compute readiness from the updated cumulative topic thetas (weighted average).
        // This reflects the student's overall ability trajectory, not just this session.
        const topicValues = Object.values(topicThetas);
        let readinessTheta = theta; // fallback: overall session theta if no topics
        if (topicValues.length > 0) {
            const totalCount = topicValues.reduce((s, t) => s + t.count, 0);
            readinessTheta = totalCount > 0
                ? topicValues.reduce((s, t) => s + t.theta * t.count, 0) / totalCount
                : topicValues.reduce((s, t) => s + t.theta, 0) / topicValues.length;
        }

        const finalResults = {
            totalScore,
            totalPoints,
            percentage: totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0,
            gradedAnswers,
            abilityEstimate: theta,
            readinessPercentage: Math.max(0, Math.min(100, ((readinessTheta + 4) / 8) * 100))
        };

        // Save per-topic theta estimates to DB
        if (studentId && Object.keys(topicThetas).length > 0) {
            Object.entries(topicThetas).forEach(([subject, { theta: t, count }]) => {
                updateStudentTopicAbility(studentId, subject, t, count).catch(() => {});
            });
        }

        // Persist grade to submission record
        try {
            const subResponse = await authFetch(`/assignmentsubmission/${submissionId}`);
            if (subResponse.ok) {
                const sub = await subResponse.json();
                await authFetch(`/assignmentsubmission/${submissionId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        ...sub,
                        grade: Math.round(finalResults.percentage * 10) / 10,
                        status: 'graded'
                    })
                });
            }
        } catch (e) { /* non-fatal */ }

        return finalResults;

    } catch (error) {
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

// Convert a LaTeX expression string to a mathjs-compatible expression string.
const latexToMathjs = (raw) => {
    if (!raw) return '';
    let s = String(raw).trim();

    // Strip outer LaTeX math delimiters
    s = s.replace(/^\$\$([\s\S]*?)\$\$$/, '$1').trim();
    s = s.replace(/^\$([\s\S]*?)\$$/, '$1').trim();
    s = s.replace(/^\\\[([\s\S]*?)\\\]$/, '$1').trim();
    s = s.replace(/^\\\(([\s\S]*?)\\\)$/, '$1').trim();

    // \frac{num}{den} → (num)/(den)  — repeat to handle nested fractions
    const expandFrac = (str) =>
        str.replace(/\\frac\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
            (_, num, den) => `(${num})/(${den})`);
    let prev;
    do { prev = s; s = expandFrac(s); } while (s !== prev);

    // \sqrt{a} → sqrt(a)
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)');
    s = s.replace(/\\sqrt\s+(\w)/g, 'sqrt($1)');

    // \left( \right) \left[ \right] → ( )
    s = s.replace(/\\left\s*\(/g, '(').replace(/\\right\s*\)/g, ')');
    s = s.replace(/\\left\s*\[/g, '(').replace(/\\right\s*\]/g, ')');
    s = s.replace(/\\left\s*\|/g, 'abs(').replace(/\\right\s*\|/g, ')');

    // x^{2} → x^(2)
    s = s.replace(/\^\s*\{([^{}]*)\}/g, '^($1)');

    // \cdot \times → *
    s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');

    // \pi → pi,  \infty → Infinity
    s = s.replace(/\\pi\b/g, 'pi');
    s = s.replace(/\\infty\b/g, 'Infinity');

    // Remove remaining LaTeX commands (e.g. \left \right \, \! \; etc.)
    s = s.replace(/\\[a-zA-Z]+/g, '');

    // Remove remaining braces
    s = s.replace(/[{}]/g, '');

    return s.trim();
};

const compareAnswers = (studentAnswer, correctAnswer) => {
    if (!studentAnswer || !correctAnswer) return false;

    const normalizeStr = (answer) =>
        String(answer)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[()]/g, '')
            .replace(/\$/g, '')
            .replace(/,/g, '')
            .replace(/[^\w\s.-]/g, '');

    const normStudent = normalizeStr(studentAnswer);
    const normCorrect = normalizeStr(correctAnswer);

    // 1. Exact match after normalization
    if (normStudent === normCorrect) return true;

    // 2. Pure numeric comparison
    const sNum = parseFloat(normStudent);
    const cNum = parseFloat(normCorrect);
    if (!isNaN(sNum) && !isNaN(cNum)) {
        return Math.abs(sNum - cNum) < 0.001;
    }

    // 3. Math-aware symbolic/numeric comparison via mathjs
    try {
        const sExpr = latexToMathjs(studentAnswer);
        const cExpr = latexToMathjs(correctAnswer);
        if (!sExpr || !cExpr) return false;

        // Detect standalone single-letter variables (exclude mathjs constants e, i, E)
        const CONSTANTS = new Set(['e', 'i', 'E', 'I']);
        const singleLetterRe = /\b([a-zA-Z])\b/g;
        const vars = new Set();
        for (const m of (sExpr + ' ' + cExpr).matchAll(singleLetterRe)) {
            if (!CONSTANTS.has(m[1])) vars.add(m[1]);
        }

        // Remove any chars that are part of known function names (sqrt, sin, cos, pi, …)
        const knownFuncs = ['sqrt', 'sin', 'cos', 'tan', 'log', 'abs', 'exp', 'pi', 'Infinity'];
        knownFuncs.forEach(fn => [...fn].forEach(ch => vars.delete(ch)));

        const varList = [...vars];
        const probeValues = [2, 3, 5, 7, 0.7, -1];

        const probePoints = varList.length === 0
            ? [{}]
            : probeValues.map(v => Object.fromEntries(varList.map(vn => [vn, v])));

        let matches = 0;
        for (const scope of probePoints) {
            try {
                const sv = mjsEval(sExpr, scope);
                const cv = mjsEval(cExpr, scope);
                if (typeof sv !== 'number' || typeof cv !== 'number') continue;
                if (!isFinite(sv) || !isFinite(cv)) continue;
                if (Math.abs(sv - cv) > 1e-6) return false;
                matches++;
            } catch (_) { /* singularity at this probe point — skip */ }
        }

        // Require at least 2 successful probe evaluations that all agreed
        return matches >= 2;
    } catch (_) {
        return false;
    }
};

const updateAnswerGrading = async (answerId, isCorrect, pointsEarned) => {
    try {
        // Ensure isCorrect is a proper boolean
        const isCorrectBoolean = Boolean(isCorrect);

        const updateData = {
            isCorrect: isCorrectBoolean,
            pointsEarned: Number(pointsEarned) || 0
        };

        const response = await authFetch(`/assignmentanswer/${answerId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        throw error;
    }
};
