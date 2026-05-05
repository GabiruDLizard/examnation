import { authFetch } from '../../../utils/api';

export const saveMistake = async (mistakeData) => {
    try {
        const response = await authFetch('/MistakeLog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mistakeData)
        });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null; // non-fatal — don't break the test flow
    }
};

export const getRecentMistakes = async (studentId) => {
    try {
        const response = await authFetch(`/MistakeLog/student/${studentId}`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
};

export const getMistakePatterns = async (studentId) => {
    try {
        const response = await authFetch(`/MistakeLog/student/${studentId}/patterns`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
};

export const getCuratedQuiz = async (studentId) => {
    try {
        const response = await authFetch(`/MistakeLog/student/${studentId}/curated-quiz`);
        if (!response.ok) return { questionIds: [], focusTopics: [] };
        return await response.json();
    } catch {
        return { questionIds: [], focusTopics: [] };
    }
};

export const getTeacherPatterns = async (teacherId) => {
    try {
        const response = await authFetch(`/MistakeLog/teacher/${teacherId}/patterns`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
};

export const getStrugglingStudents = async (teacherId, limit = 10) => {
    try {
        const response = await authFetch(`/MistakeLog/teacher/${teacherId}/struggling-students?limit=${limit}`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
};

export const assignCuratedQuizToStudent = async (studentId, studentName, classId, teacherId, dueDate, dueTime) => {
    const { questionIds, focusTopics } = await getCuratedQuiz(studentId);
    if (!questionIds?.length) throw new Error("No questions found for this student's weak topics yet");

    const assignmentPayload = {
        title: `Curated Review — ${studentName}`,
        description: `Targeted quiz focusing on: ${focusTopics.join(', ')}`,
        dueDate: new Date(`${dueDate}T${dueTime || '23:59'}`).toISOString(),
        pointsPossible: questionIds.length,
        assignmentType: 'homework',
        status: 'active',
        classId: parseInt(classId),
        teacherId: parseInt(teacherId),
        studentId: parseInt(studentId),
    };

    const assignmentRes = await authFetch('/assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentPayload)
    });
    if (!assignmentRes.ok) throw new Error('Failed to create assignment');
    const created = await assignmentRes.json();

    for (const qId of questionIds) {
        await authFetch('/assignmentquestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignmentId: created.id, questionId: qId, points: 1.0 })
        });
    }

    return { assignment: created, questionCount: questionIds.length, focusTopics };
};

