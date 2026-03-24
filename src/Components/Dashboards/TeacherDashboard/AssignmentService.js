import {
    createAssignmentForClass,
    uploadQuestionImage,
    createQuestion,
    createAssignmentQuestion
} from './TeacherDashboardService';
import { authFetch } from '../../../utils/api';

// Create a complete assignment with questions
export const createCompleteAssignment = async (assignmentData, questionsArray) => {
    try {

        let assignmentId = assignmentData?.assignmentId;
        let createdAssignment;

        if (assignmentId) {
            createdAssignment = { id: assignmentId, ...assignmentData };
        } else {
            createdAssignment = await createAssignmentForClass(assignmentData);
            assignmentId = createdAssignment.id;
        }

        const createdQuestions = [];

        for (const questionData of questionsArray) {
            let figureBlobUrl = null;
            if (questionData.imageAssociated) {
                try {
                    figureBlobUrl = await uploadQuestionImage(questionData.imageAssociated);
                } catch (uploadError) {
                }
            }

            const formattedQuestionData = {
                questionText: questionData.questionText,
                subject: questionData.subject || 'General',
                correctAnswer: questionData.solution,
                options: questionData.answerType === 'Multiple Choice' ? (questionData.multipleChoiceOptions || []) : [],
                difficultyLevel: mapDifficultyLevel(questionData.difficultyLevel),
                answerBreakdown: questionData.answerBreakdown || null,
                solutionSteps: null,
                figureDescription: questionData.imageDescription || null,
                figureBlobUrl: figureBlobUrl || null,
                createdAt: new Date().toISOString(),
                subjectId: null
            };

            const question = await createQuestion(formattedQuestionData);
            createdQuestions.push(question);
        }


        if (!assignmentId) {
            throw new Error('Assignment was created but returned no valid ID');
        }

        const assignmentQuestions = [];

        for (let i = 0; i < createdQuestions.length; i++) {
            const question = createdQuestions[i];
            const assignmentQuestion = await createAssignmentQuestion({
                assignmentId: assignmentId,
                questionId: question.id,
                points: questionsArray[i].points || 1.0
            });
            assignmentQuestions.push(assignmentQuestion);
        }


        return {
            assignment: createdAssignment,
            questions: createdQuestions,
            assignmentQuestions: assignmentQuestions,
            totalQuestions: createdQuestions.length
        };

    } catch (error) {
        throw error;
    }
};

// Helper function to map difficulty levels
const mapDifficultyLevel = (level) => {
    switch (level) {
        case 1: return 'Easy';
        case 2: return 'Medium-Easy';
        case 3: return 'Medium';
        case 4: return 'Hard';
        case 5: return 'Expert';
        default: return 'Medium';
    }
};

// Get assignment with all questions
export const getAssignmentWithQuestions = async (assignmentId) => {
    try {
        const response = await authFetch(`/assignment/${assignmentId}/questions`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const assignmentWithQuestions = await response.json();
        return assignmentWithQuestions;
    } catch (error) {
        throw error;
    }
};
