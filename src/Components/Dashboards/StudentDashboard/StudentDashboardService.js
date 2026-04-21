import { authFetch } from '../../../utils/api';
import { getUserIdFromToken } from '../../../utils/tokenUtils';
import { analyzeMistakePatterns } from '../../PerformanceEngine/^PerformanceAnalysis';
import { abilityEstimate, updateTopicMastery, thetaToReadiness } from '../Charts/ReadinessLogic';
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
    } catch {
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
    } catch {
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
    } catch {
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

            let avgReadiness = null;
            try {
                const rdResponse = await authFetch(`/Readiness/student/${userId}/class/${enrollment.classId}`);
                if (rdResponse.ok) {
                    const rdData = await rdResponse.json();
                    avgReadiness = Math.round(rdData?.readinessPercentage ?? 0);
                }
            } catch { /* no readiness recorded yet */ }

            // Fall back to topic ability average if no class-level history exists
            if (avgReadiness === null) {
                try {
                    const taResponse = await authFetch(`/studenttopicability/${userId}`);
                    if (taResponse.ok) {
                        const topics = await taResponse.json();
                        if (topics && topics.length > 0) {
                            const avg = topics.reduce((sum, t) => {
                                const theta = t.theta ?? t.Theta ?? 0;
                                const pct = (theta >= -4 && theta <= 4)
                                    ? ((theta + 4) / 8) * 100
                                    : Math.max(0, Math.min(100, theta));
                                return sum + pct;
                            }, 0) / topics.length;
                            avgReadiness = Math.round(avg);
                        }
                    }
                } catch { /* skip */ }
            }

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
    } catch {
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
                status: 'pending_review',
                submittedAt: new Date().toISOString()
            };
            return await updateSubmission(updatedSubmission);
        } else {
            const newSubmission = {
                assignmentId: assignmentId,
                studentId: studentId,
                status: 'pending_review',
                submittedAt: new Date().toISOString()
            };
            return await createSubmission(newSubmission);
        }
    } catch (error) {
        throw error;
    }
};

// Grades answers and stores the score, but does NOT update topic mastery.
// Mastery is only applied after teacher approval via applyMasteryAndFinalize.
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

        for (const submittedAnswer of submittedAnswers) {
            try {
                const question = questions.find(q =>
                    (q.questionDetails?.id ?? q.questionId ?? q.id) === submittedAnswer.questionId
                );
                if (!question) continue;

                const correctAnswer = question.questionDetails?.correctAnswer || question.correctAnswer;
                const questionPoints = question.points || 1;
                if (!correctAnswer) continue;

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
                theta = abilityEstimate(difficulty, isCorrect, theta, gradedAnswers);
                totalScore += pointsEarned;
                totalPoints += questionPoints;
                gradedAnswers++;
            } catch { /* ignore */ }
        }

        // TA analysis deferred — runs only after teacher approves the submission
        const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;

        // Save score to submission but keep status as pending_review
        try {
            const subResponse = await authFetch(`/assignmentsubmission/${submissionId}`);
            if (subResponse.ok) {
                const sub = await subResponse.json();
                await authFetch(`/assignmentsubmission/${submissionId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        ...sub,
                        grade: Math.round(percentage * 10) / 10,
                        status: 'pending_review'
                    })
                });
            }
        } catch (e) { /* non-fatal */ }

        return { totalScore, totalPoints, percentage, gradedAnswers, abilityEstimate: theta };

    } catch (error) {
        throw error;
    }
};

// Called by teacher approval. Updates topic mastery and records readiness for the student.
export const applyMasteryAndFinalize = async (assignmentId, submissionId, studentId) => {
    try {
        const questions = await getQuestionsByAssignmentId(assignmentId);
        const submittedAnswers = await getAnswersBySubmissionId(submissionId);

        const existingAbility = studentId
            ? await getStudentTopicAbility(studentId).catch(() => [])
            : [];
        const topicMasteries = {};
        existingAbility.forEach(row => {
            const storedValue = row.theta ?? 50;
            const mastery = (storedValue >= -4 && storedValue <= 4 && row.questionsAnswered <= 200)
                ? thetaToReadiness(storedValue)
                : Math.max(0, Math.min(100, storedValue));
            topicMasteries[row.topic] = { mastery, count: row.questionsAnswered || 1 };
        });

        let theta = 0;
        let gradedAnswers = 0;
        const wrongAnswersForTA = [];

        for (const submittedAnswer of submittedAnswers) {
            try {
                const question = questions.find(q =>
                    (q.questionDetails?.id ?? q.questionId ?? q.id) === submittedAnswer.questionId
                );
                if (!question) continue;

                const correctAnswer = question.questionDetails?.correctAnswer || question.correctAnswer;
                if (!correctAnswer) continue;

                const isCorrect = submittedAnswer.isCorrect ?? compareAnswers(
                    extractFinalAnswer(submittedAnswer.answer), correctAnswer
                );
                const difficulty = question.questionDetails?.difficultyLevel || question.difficultyLevel || 'Medium';
                const subject = question.questionDetails?.subject || question.subject || 'General';

                if (!isCorrect) {
                    wrongAnswersForTA.push({
                        questionId: question.questionDetails?.id || question.id,
                        questionText: question.questionDetails?.questionText || question.questionText || '',
                        workingSteps: submittedAnswer.answer,
                        studentAnswer: extractFinalAnswer(submittedAnswer.answer),
                        correctAnswer,
                        topic: subject,
                        difficulty,
                    });
                }

                theta = abilityEstimate(difficulty, isCorrect, theta, gradedAnswers);
                // Seed new topics from current Rasch theta instead of a cold 50
                if (!topicMasteries[subject]) topicMasteries[subject] = { mastery: thetaToReadiness(theta), count: 0 };
                topicMasteries[subject].mastery = updateTopicMastery(
                    difficulty, isCorrect, topicMasteries[subject].mastery, topicMasteries[subject].count
                );
                topicMasteries[subject].count++;
                gradedAnswers++;
            } catch { /* skip */ }
        }

        // TA analysis now runs on approval — teacher has verified the submission is genuine
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
            ).catch(() => {});
        }

        // Save per-topic mastery — convert mastery % (0–100) to IRT theta (-4 to +4)
        // so StudentProfile.js thetaToPercent() displays it correctly
        if (studentId && Object.keys(topicMasteries).length > 0) {
            Object.entries(topicMasteries).forEach(([subject, { mastery, count }]) => {
                const topicTheta = (mastery / 100) * 8 - 4; // inverse of thetaToPercent
                updateStudentTopicAbility(studentId, subject, topicTheta, count).catch(() => {});
            });
        }

        // Overall readiness driven by Rasch theta — AT-PFA handles per-topic detail
        const readinessPercentage = thetaToReadiness(theta);

        // Mark submission as graded
        try {
            const subResponse = await authFetch(`/assignmentsubmission/${submissionId}`);
            if (subResponse.ok) {
                const sub = await subResponse.json();
                await authFetch(`/assignmentsubmission/${submissionId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...sub, status: 'graded' })
                });
            }
        } catch (e) { /* non-fatal */ }

        return { readinessPercentage: Math.round(readinessPercentage), abilityEstimate: theta };

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
        // Fetch the full existing record first — ASP.NET PUT requires all fields
        const fetchResponse = await authFetch(`/assignmentanswer/${answerId}`);
        if (!fetchResponse.ok) {
            throw new Error(`Could not fetch answer ${answerId}: status ${fetchResponse.status}`);
        }
        const existingAnswer = await fetchResponse.json();

        const updateData = {
            ...existingAnswer,
            isCorrect: Boolean(isCorrect),
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

        return await response.json();
    } catch (error) {
        throw error;
    }
};
