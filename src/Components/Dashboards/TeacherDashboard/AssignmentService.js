import { 
    createAssignmentForClass, 
    uploadQuestionImage, 
    createQuestion, 
    createAssignmentQuestion 
} from './TeacherDashboardService';

const API_BASE_URL = 'https://examnationwebapi.azurewebsites.net/api';
const API_BASE_URL_TEST = 'http://localhost:5204/api';

// Create a complete assignment with questions
export const createCompleteAssignment = async (assignmentData, questionsArray) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        console.log('📝 Creating complete assignment with questions...');
        
        // Step 1: Create the assignment first
        console.log('Step 1: Creating assignment...');
        const createdAssignment = await createAssignmentForClass(assignmentData);
        console.log('✅ Assignment created:', createdAssignment);

        // Step 2: Create questions and get their IDs
        console.log('Step 2: Creating questions...');
        const createdQuestions = [];
        
        for (const questionData of questionsArray) {
            // Upload image if provided
            let figureBlobUrl = null;
            if (questionData.imageAssociated) {
                console.log('📷 Uploading question image...');
                figureBlobUrl = await uploadQuestionImage(questionData.imageAssociated);
                console.log('✅ Image uploaded:', figureBlobUrl);
            }

            // Format question data to match API expectations
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

        // Step 3: Link questions to assignment
        console.log('Step 3: Linking questions to assignment...');
        console.log('🔍 Assignment ID to link:', createdAssignment.id);
        
        // Validate assignment ID before proceeding
        if (!createdAssignment.id) {
            console.error('❌ No valid assignment ID found:', createdAssignment);
            throw new Error('Assignment was created but returned no valid ID');
        }
        
        const assignmentQuestions = [];
        
        for (let i = 0; i < createdQuestions.length; i++) {
            const question = createdQuestions[i];
            console.log(`🔗 Linking question ${question.id} to assignment ${createdAssignment.id}`);
            const assignmentQuestion = await createAssignmentQuestion({
                assignmentId: createdAssignment.id,
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
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${API_BASE_URL_TEST}/assignment/${assignmentId}/questions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

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