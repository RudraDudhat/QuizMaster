import api from './axiosInstance';

export const getAdminDashboard = async () => {
    const { data } = await api.get('/admin/analytics/dashboard');
    return data;
};

export const getQuizAnalytics = async (quizUuid) => {
    const { data } = await api.get(`/admin/analytics/quiz/${quizUuid}`);
    return data;
};

export const getAllStudentsPerformance = async ({ page = 0, size = 20 } = {}) => {
    const { data } = await api.get('/admin/analytics/students', {
        params: { page, size },
    });
    return data;
};

export const getAttemptsForQuiz = async (quizUuid, { page = 0, size = 20 } = {}) => {
    const { data } = await api.get(`/admin/analytics/quiz/${quizUuid}/attempts`, {
        params: { page, size },
    });
    return data;
};
