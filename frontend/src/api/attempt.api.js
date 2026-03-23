import api from './axiosInstance';

export const startAttempt = async (quizUuid, { accessCode } = {}) => {
    const normalizedCode = typeof accessCode === 'string' ? accessCode.trim() : '';
    const payload = normalizedCode ? { accessCode: normalizedCode } : undefined;
    const { data } = await api.post(`/student/quizzes/${quizUuid}/start`, payload);
    return data;
};

export const saveAnswer = async (attemptUuid, answerData) => {
    const { data } = await api.post(`/student/attempts/${attemptUuid}/answer`, answerData);
    return data;
};

export const submitAttempt = async (attemptUuid) => {
    const { data } = await api.post(`/student/attempts/${attemptUuid}/submit`);
    return data;
};

export const getAttemptResult = async (attemptUuid) => {
    const { data } = await api.get(`/student/attempts/${attemptUuid}/result`);
    return data;
};

export const getAttemptReview = async (attemptUuid) => {
    const { data } = await api.get(`/student/attempts/${attemptUuid}/review`);
    return data;
};

export const getAttemptHistory = async ({ page = 0, size = 20 } = {}) => {
    const { data } = await api.get('/student/attempts/history', {
        params: { page, size },
    });
    return data;
};

export const logAuditEvent = async (attemptUuid, { eventType, eventData }) => {
    const { data } = await api.post(`/student/attempts/${attemptUuid}/audit`, {
        eventType,
        eventData,
    });
    return data;
};

export const getStudentDashboard = async () => {
    const { data } = await api.get('/student/dashboard');
    return data;
};

export const getAvailableQuizzes = async ({ page = 0, size = 20 } = {}) => {
    const { data } = await api.get('/student/quizzes', {
        params: { page, size },
    });
    return data;
};

export const getQuizDetailForStudent = async (quizUuid) => {
    const { data } = await api.get(`/student/quizzes/${quizUuid}`);
    return data;
};

// Alias used by QuizDetail page
export const getQuizDetail = getQuizDetailForStudent;