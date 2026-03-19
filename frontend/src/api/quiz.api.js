import api from './axiosInstance';

export const getAllQuizzes = async ({ page = 0, size = 20, status } = {}) => {
    const params = { page, size, sort: 'createdAt,desc' };
    const url = status ? `/admin/quizzes/status/${status}` : '/admin/quizzes';
    const { data } = await api.get(url, { params });
    return data;
};

export const getQuizByUuid = async (quizUuid) => {
    const { data } = await api.get(`/admin/quizzes/${quizUuid}`);
    return data;
};

export const createQuiz = async (quizData) => {
    const { data } = await api.post('/admin/quizzes', quizData);
    return data;
};

export const updateQuiz = async (quizUuid, quizData) => {
    const { data } = await api.put(`/admin/quizzes/${quizUuid}`, quizData);
    return data;
};

export const updateQuizStatus = async (quizUuid, status) => {
    const { data } = await api.patch(`/admin/quizzes/${quizUuid}/status`, { status });
    return data;
};

export const duplicateQuiz = async (quizUuid) => {
    const { data } = await api.post(`/admin/quizzes/${quizUuid}/duplicate`);
    return data;
};

export const deleteQuiz = async (quizUuid) => {
    const { data } = await api.delete(`/admin/quizzes/${quizUuid}`);
    return data;
};

export const getSelectableQuizzes = async () => {
    const { data } = await api.get('/admin/quizzes/selectable');
    return data;
};
