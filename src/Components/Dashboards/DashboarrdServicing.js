import { authFetch, API_BASE_URL } from '../../utils/api';

export async function getUserProgress(userId) {
    const response = await authFetch(`/userprogress/user/${userId}`);
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to get user progress');
    }
    return response.json();
}

export async function getStudentAnswers(userId) {
    const response = await authFetch(`/answer/user/${userId}`);
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch student answers');
    }
    return response.json();
}

export async function getStudentInfo(userId) {
    const response = await authFetch(`/user/${userId}`);
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to get student info');
    }
    return response.json();
}

export async function getQuestions() {
    const response = await authFetch(`/question`);
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch questions');
    }
    return response.json();
}

export async function submitAnswer(answerData) {
    const response = await authFetch(`/answer`, {
        method: 'POST',
        body: JSON.stringify(answerData)
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to submit answer');
    }
    return response.json();
}
