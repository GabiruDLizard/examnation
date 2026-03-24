import { DetectStep } from '../../Worker/chat';
import { saveMistake } from '../Dashboards/TAPage/TAService';

export const analyzeMistakePatterns = async (
    workingStepsArray,
    questionTextsArray,
    {
        studentId,
        questionIds = [],
        topics = [],
        difficulties = [],
        correctAnswers = [],
        studentAnswers = [],
        source = 'unknown'
    } = {}
) => {
    const mistakePatterns = [];

    for (let i = 0; i < workingStepsArray.length; i++) {
        const userSolution = workingStepsArray[i];
        const questionText = questionTextsArray[i] || "Question text not provided";

        const analysisData = JSON.stringify({
            questionText: questionText,
            userSolution: userSolution
        });

        const errorAnalysis = await DetectStep(analysisData);
        mistakePatterns.push(errorAnalysis);

        // Persist to DB if we have a studentId
        if (studentId) {
            try {
                let parsed = null;
                if (typeof errorAnalysis === 'string') {
                    parsed = JSON.parse(errorAnalysis);
                } else {
                    parsed = errorAnalysis;
                }

                // DetectStep returns an array — grab index 0 since we send one question at a time
                const result = Array.isArray(parsed) ? parsed[0] : parsed;

                await saveMistake({
                    studentId,
                    questionId: questionIds[i] ?? null,
                    questionText,
                    studentAnswer: studentAnswers[i] ?? null,
                    workingSteps: userSolution,
                    correctAnswer: correctAnswers[i] ?? null,
                    firstErrorStep: result?.first_error_step ?? null,
                    errorReason: result?.error_reason ?? null,
                    mistakeType: result?.mistake_type ?? null,
                    topic: topics[i] ?? null,
                    difficulty: difficulties[i] ?? null,
                    source
                });
            } catch {
                // Parsing or save failed — don't break the test flow
            }
        }
    }

    console.log("Mistake Patterns:", mistakePatterns);
    return mistakePatterns;
};

export const analyzeStudentPerformance = async (workingStepsArray, questionTextsArray, context = {}) => {
    const analysis = {
        mistakePatterns: await analyzeMistakePatterns(workingStepsArray, questionTextsArray, context),
    };
    return analysis;
};
