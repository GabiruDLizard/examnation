import React from 'react';
import { DetectStep } from '../../Worker/chat';

const seperator = (num) => {
    const stepRegex = /\s*step\s+\d+[:.\s]*/i;
    return num.split(stepRegex).map(step => step.trim()).filter(step => step.length > 0);
}

export const analyzeMistakePatterns = async (testResults, questionTexts) => {
    const mistakePatterns = [];
    
    for (let i = 0; i < testResults.length; i++) {
        const userSolution = testResults[i];
        const questionText = questionTexts[i] || "Question text not provided";
        
        // Create JSON format for DetectStep
        const analysisData = JSON.stringify({
            questionText: questionText,
            userSolution: userSolution
        });
        
        // Use DetectStep function instead of askGPT
        const errorAnalysis = await DetectStep(analysisData);
        mistakePatterns.push(errorAnalysis);
    }
    
    console.log("Mistake Patterns:", mistakePatterns);
    return mistakePatterns;
}

export const analyzeStudentPerformance = async (testResults, questionTexts) => {
    const analysis = {
        mistakePatterns: await analyzeMistakePatterns(testResults, questionTexts),
        // TODO: Implement these functions later
        // conceptUnderstanding: mapConcepts(testResults),
        // learningProgression: trackProgression(testResults),
        // timeEfficiency: analyzeTimeEfficiency(testResults),
        // recommendations: generateRecommendations(testResults)
    }
    return analysis;
};

//export default analyzeStudentPerformance;