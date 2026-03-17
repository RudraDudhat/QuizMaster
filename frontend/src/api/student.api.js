import api from './axiosInstance';

export const getAllStudents = async ({ page = 0, size = 20, keyword } = {}) => {
    const params = { page, size };
    if (keyword) params.keyword = keyword;
    const { data } = await api.get('/admin/students', { params });
    return data;
};

export const getStudentDetail = async (userUuid) => {
    const { data } = await api.get(`/admin/students/${userUuid}`);
    return data;
};

export const updateStudentStatus = async (userUuid, { isActive, reason }) => {
    const { data } = await api.patch(`/admin/students/${userUuid}/status`, { isActive, reason });
    return data;
};

export const resetStudentAttempts = async (userUuid, { quizUuid }) => {
    const { data } = await api.post(`/admin/students/${userUuid}/reset-attempts`, { quizUuid });
    return data;
};
