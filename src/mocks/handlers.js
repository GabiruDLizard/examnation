import { http, HttpResponse } from 'msw';

// Helper: build a fake but structurally valid JWT
function makeFakeJwt(payload) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `${header}.${body}.fakesignature`;
}

const FAKE_STUDENT_TOKEN = makeFakeJwt({
    sub: '1',
    role: 'student',
    institution_id: 1,
    exp: 9999999999,
});

const BASE = 'https://examnationwebapi.azurewebsites.net/api';

export const handlers = [
    // Auth
    http.post(`${BASE}/user/login`, () =>
        HttpResponse.json({ token: FAKE_STUDENT_TOKEN })
    ),
    http.post(`${BASE}/user/register`, () =>
        HttpResponse.json({ message: 'User created' })
    ),
    http.get(`${BASE}/user/:userId`, () =>
        HttpResponse.json({ userId: 1, firstName: 'Test', lastName: 'User', role: 'student', email: 'test@test.com', username: 'testuser' })
    ),
    http.get(`${BASE}/user/search`, () =>
        HttpResponse.json([])
    ),
    http.get(`${BASE}/user/email/:email`, () =>
        HttpResponse.json({ id: 1, email: 'test@test.com', role: 'student' })
    ),

    // Admin
    http.get(`${BASE}/admin/users`, () =>
        HttpResponse.json([
            { userId: 1, firstName: 'Jane', lastName: 'Doe', username: 'janedoe', email: 'jane@test.com', role: 'student', createdAt: '2024-01-01' },
        ])
    ),
    http.post(`${BASE}/admin/users`, () =>
        HttpResponse.json({ userId: 2, message: 'Created' })
    ),
    http.put(`${BASE}/admin/users/:userId`, () =>
        HttpResponse.json({ message: 'Updated' })
    ),
    http.delete(`${BASE}/admin/users/:userId`, () =>
        HttpResponse.json({ message: 'Deleted' })
    ),
    http.post(`${BASE}/admin/users/:userId/reset-password`, () =>
        HttpResponse.json({ message: 'Password reset' })
    ),

    // Password reset requests
    http.get(`${BASE}/passwordresetrequest/pending`, () =>
        HttpResponse.json([])
    ),
    http.post(`${BASE}/passwordresetrequest`, () =>
        HttpResponse.json({ message: 'Request created' })
    ),
    http.post(`${BASE}/PasswordResetRequest`, () =>
        HttpResponse.json({ message: 'Request created' })
    ),
    http.post(`${BASE}/passwordresetrequest/:id/complete`, () =>
        HttpResponse.json({ message: 'Complete' })
    ),
    http.post(`${BASE}/passwordresetrequest/:id/dismiss`, () =>
        HttpResponse.json({ message: 'Dismissed' })
    ),

    // Organizations
    http.get(`${BASE}/organization`, () =>
        HttpResponse.json([])
    ),
    http.post(`${BASE}/organization`, () =>
        HttpResponse.json({ institutionId: 1, institutionName: 'Test School' })
    ),

    // Answers
    http.get(`${BASE}/answer/user/:userId`, () =>
        HttpResponse.json([])
    ),
    http.post(`${BASE}/answer/batch`, () =>
        HttpResponse.json({ message: 'Saved' })
    ),

    // User progress
    http.post(`${BASE}/userprogress/upsert`, () =>
        HttpResponse.json({ message: 'Saved' })
    ),

    // Classes
    http.get(`${BASE}/class/teacher/:teacherId`, () =>
        HttpResponse.json([])
    ),
    http.get(`${BASE}/class/:classId`, () =>
        HttpResponse.json({ id: 1, name: 'Test Class', subject: 'Math' })
    ),
    http.post(`${BASE}/class`, () =>
        HttpResponse.json({ id: 1, name: 'Test Class' })
    ),

    // Enrollments
    http.get(`${BASE}/classenrollment/class/:classId`, () =>
        HttpResponse.json([])
    ),
    http.get(`${BASE}/classenrollment/student/:userId`, () =>
        HttpResponse.json([])
    ),
    http.post(`${BASE}/classenrollment/enroll`, () =>
        HttpResponse.json({ message: 'Enrolled' })
    ),

    // Assignments
    http.get(`${BASE}/assignment/class/:classId`, () =>
        HttpResponse.json([])
    ),
    http.post(`${BASE}/assignment`, () =>
        HttpResponse.json({ id: 1, title: 'Test Assignment' })
    ),

    // Assignment questions
    http.get(`${BASE}/assignmentquestion`, () =>
        HttpResponse.json([])
    ),
    http.get(`${BASE}/assignmentquestion/assignment/:assignmentId`, () =>
        HttpResponse.json([])
    ),

    // Submissions
    http.get(`${BASE}/assignmentsubmission/assignment/:assignmentId/student/:studentId`, () =>
        HttpResponse.json(null)
    ),
    http.post(`${BASE}/assignmentsubmission`, () =>
        HttpResponse.json({ id: 1 })
    ),
    http.put(`${BASE}/assignmentsubmission/:id`, () =>
        HttpResponse.json({ id: 1, status: 'submitted' })
    ),

    // Readiness
    http.get(`${BASE}/Readiness/student/:studentId/class/:classId`, () =>
        HttpResponse.json({ readinessPercentage: 0 })
    ),
    http.post(`${BASE}/Readiness/record`, () =>
        HttpResponse.json({ message: 'Recorded' })
    ),

    // Topic ability
    http.get(`${BASE}/studenttopicability/student/:studentId`, () =>
        HttpResponse.json([])
    ),
    http.post(`${BASE}/studenttopicability/upsert`, () =>
        HttpResponse.json({ message: 'Saved' })
    ),

    // Mistake log
    http.get(`${BASE}/MistakeLog/student/:studentId/patterns`, () =>
        HttpResponse.json({ patterns: [] })
    ),
];
