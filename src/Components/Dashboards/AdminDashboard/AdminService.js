import { authFetch } from '../../../utils/api';

export const getUsers = async (search = '') => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await authFetch(`/admin/users${qs}`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
};

export const createAccount = async ({ firstName, lastName, email, username, password, role, institutionId }) => {
    const res = await authFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
            firstName, lastName, email, username,
            passwordHash: password, role,
            institutionId: institutionId ?? null,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create account');
    }
    return res.json();
};

export const editUser = async (userId, { firstName, lastName, email, username, role, institutionId }) => {
    const res = await authFetch(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName, email, username, role,
            institutionId: institutionId ?? null, passwordHash: '' }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update user');
    }
    return res.json();
};

export const deleteUser = async (userId) => {
    const res = await authFetch(`/admin/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete user');
    }
    return res.json();
};

export const resetPassword = async (userId, newPassword) => {
    const res = await authFetch(`/admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to reset password');
    }
    return res.json();
};

export const getResetRequests = async () => {
    const res = await authFetch('/passwordresetrequest/pending');
    if (!res.ok) throw new Error('Failed to fetch reset requests');
    return res.json();
};

export const completeResetRequest = async (requestId) => {
    const res = await authFetch(`/passwordresetrequest/${requestId}/complete`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete request');
    return res.json();
};

export const dismissResetRequest = async (requestId) => {
    const res = await authFetch(`/passwordresetrequest/${requestId}/dismiss`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to dismiss request');
    return res.json();
};

export const getOrganizations = async () => {
    const res = await authFetch('/organization');
    if (!res.ok) throw new Error('Failed to fetch organizations');
    return res.json();
};

export const createOrganization = async ({ institutionName, country = 'Bahamas', address, institutionLevel }) => {
    const res = await authFetch('/organization', {
        method: 'POST',
        body: JSON.stringify({ institutionName, country, address, institutionLevel }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create organization');
    }
    return res.json();
};

export const getLibrary = async () => {
    const res = await authFetch('/question?source=admin');
    if (!res.ok) throw new Error('Failed to fetch questions');
    return res.json();
};

export const createQuestion = async (questionData) => {
    let figureBlobUrl = '';
    if (questionData.imageAssociated instanceof File) {
        const formData = new FormData();
        formData.append('file', questionData.imageAssociated);
        const uploadRes = await authFetch('/File/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
            const uploaded = await uploadRes.json();
            figureBlobUrl = uploaded.blobUrl || '';
        }
    }

    const payload = {
        questionText:    questionData.questionText,
        subject:         questionData.subject         || 'General',
        correctAnswer:   questionData.correctAnswer,
        answerBreakdown: questionData.answerBreakdown || '',
        difficultyLevel: questionData.difficultyLevel || 'Easy',
        options:         questionData.multipleChoiceOptions || [],
        solutionSteps:   '',
        figureDescription: '',
        figureBlobUrl,
        subjectId:       null,
        source:          'admin',
    };

    const res = await authFetch('/question', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        const err = (() => { try { return JSON.parse(errText); } catch { return {}; } })();
        throw new Error(err.message || errText || 'Failed to create question');
    }
    return res.json();
};

export const editQuestion = async (questionId, questionData) => {
    let figureBlobUrl = questionData.figureBlobUrl || '';
    if (questionData.imageAssociated instanceof File) {
        const formData = new FormData();
        formData.append('file', questionData.imageAssociated);
        const uploadRes = await authFetch('/File/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
            const uploaded = await uploadRes.json();
            figureBlobUrl = uploaded.blobUrl || '';
        }
    }

    const payload = {
        id:              questionId,
        questionText:    questionData.questionText,
        subject:         questionData.subject         || 'General',
        correctAnswer:   questionData.correctAnswer,
        answerBreakdown: questionData.answerBreakdown || '',
        difficultyLevel: questionData.difficultyLevel || 'Easy',
        options:         questionData.multipleChoiceOptions || [],
        solutionSteps:   questionData.solutionSteps   || '',
        figureDescription: questionData.figureDescription || '',
        figureBlobUrl,
        subjectId:       questionData.subjectId       || null,
        source:          'admin',
    };

    const res = await authFetch(`/question/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        const err = (() => { try { return JSON.parse(errText); } catch { return {}; } })();
        throw new Error(err.message || errText || 'Failed to update question');
    }
    return res.json();
};

export const deleteQuestion = async (questionId) => {
    const res = await authFetch(`/question/${questionId}`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete question');
    }
    return res.json();
};

export const getInquiries = async () => {
    const res = await authFetch('/demo-request');
    if (!res.ok) throw new Error('Failed to fetch inquiries.');
    return res.json();
}

export const getAdminClasses = async () => {
    const res = await authFetch('/admin/classes');
    if (!res.ok) throw new Error('Failed to fetch classes');
    return res.json();
};

export const createClass = async ({ name, subject, gradeLevel, teacherId }) => {
    const res = await authFetch('/class', {
        method: 'POST',
        body: JSON.stringify({
            name, subject, gradeLevel,
            teacherId,
            schedule: 'TBD',
            status: 'active',
            currentEnrollment: 0,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create class');
    }
    return res.json();
};

export const editClass = async (classId, { name, subject, gradeLevel, teacherId }) => {
    // Fetch current class first to preserve all fields
    const cur = await authFetch(`/class/${classId}`).then(r => r.json());
    const res = await authFetch(`/class/${classId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...cur, name, subject, gradeLevel, teacherId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update class');
    }
    return res.json();
};

export const deleteClass = async (classId) => {
    const res = await authFetch(`/class/${classId}`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete class');
    }
};

export const updateInquiryStatus = async (requestId, status) => {
    const res = await authFetch(`/demo-request/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update inquiry status');
    }
    return res.json();
}
