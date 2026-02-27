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
        console.log('📝 Creating complete assignment with questions...');
        console.log('🔍 Assignment data received:', assignmentData);
        console.log('🔍 Assignment ID in data:', assignmentData?.assignmentId);

        let assignmentId = assignmentData?.assignmentId;
        let createdAssignment;

        if (assignmentId) {
            console.log('✅ Using existing assignment ID:', assignmentId);
            console.log('🚫 SKIPPING assignment creation - using existing assignment');
            createdAssignment = { id: assignmentId, ...assignmentData };
        } else {
            console.log('⚠️ No assignment ID found - creating new assignment');
            console.log('Step 1: Creating assignment...');
            createdAssignment = await createAssignmentForClass(assignmentData);
            console.log('✅ Assignment created:', createdAssignment);
            assignmentId = createdAssignment.id;
        }

        console.log('Step 2: Creating questions...');
        const createdQuestions = [];

        for (const questionData of questionsArray) {
            let figureBlobUrl = null;
            if (questionData.imageAssociated) {
                console.log('📷 Uploading question image...');
                figureBlobUrl = await uploadQuestionImage(questionData.imageAssociated);
                console.log('✅ Image uploaded:', figureBlobUrl);
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
        console.log('✅ Questions created:', createdQuestions);

        console.log('Step 3: Linking questions to assignment...');
        console.log('🔍 Assignment ID to link:', assignmentId);

        if (!assignmentId) {
            console.error('❌ No valid assignment ID found:', createdAssignment);
            throw new Error('Assignment was created but returned no valid ID');
        }

        const assignmentQuestions = [];

        for (let i = 0; i < createdQuestions.length; i++) {
            const question = createdQuestions[i];
            console.log(`🔗 Linking question ${question.id} to assignment ${assignmentId}`);
            const assignmentQuestion = await createAssignmentQuestion({
                assignmentId: assignmentId,
                questionId: question.id,
                points: questionsArray[i].points || 1.0
            });
            assignmentQuestions.push(assignmentQuestion);
        }

        console.log('✅ Assignment questions linked:', assignmentQuestions);

        return {
            assignment: createdAssignment,
            questions: createdQuestions,
            assignmentQuestions: assignmentQuestions,
            totalQuestions: createdQuestions.length
        };

    } catch (error) {
        console.error('❌ Error creating complete assignment:', error);
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
        console.error('Error fetching assignment with questions:', error);
        throw error;
    }
};
