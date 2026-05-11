import api from './axiosInstance';

// Accepts an optional second arg for React Query's `signal` so rapid
// filter changes can cancel in-flight requests via AbortController.
export const getAllQuestions = async (
    { page = 0, size = 20, type, difficulty, tagUuid, search } = {},
    { signal } = {}
) => {
    const params = { page, size };
    if (type) params.type = type;
    if (difficulty) params.difficulty = difficulty;
    if (tagUuid) params.tagUuid = tagUuid;
    if (search) params.search = search;
    const { data } = await api.get('/admin/questions', { params, signal });
    return data;
};

export const getQuestionByUuid = async (questionUuid) => {
    const { data } = await api.get(`/admin/questions/${questionUuid}`);
    return data;
};

export const createQuestion = async (questionData) => {
    const { data } = await api.post('/admin/questions', questionData);
    return data;
};

export const updateQuestion = async (questionUuid, questionData) => {
    const { data } = await api.put(`/admin/questions/${questionUuid}`, questionData);
    return data;
};

export const deleteQuestion = async (questionUuid) => {
    const { data } = await api.delete(`/admin/questions/${questionUuid}`);
    return data;
};

export const bulkImportQuestions = async (formData) => {
    const { data } = await api.post('/admin/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const searchQuestions = async ({ keyword, page = 0, size = 20 }) => {
    const { data } = await api.get('/admin/questions', {
        params: { search: keyword, page, size },
    });
    return data;
};
