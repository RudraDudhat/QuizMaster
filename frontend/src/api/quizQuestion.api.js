import api from './axiosInstance';

export const getQuestionsForQuiz = async (quizUuid) => {
    const { data } = await api.get(`/admin/quizzes/${quizUuid}/questions`);
    return data;
};

export const addQuestionToQuiz = async (quizUuid, questionData) => {
    const { data } = await api.post(`/admin/quizzes/${quizUuid}/questions`, questionData);
    return data;
};

export const removeQuestionFromQuiz = async (quizUuid, questionUuid) => {
    const { data } = await api.delete(`/admin/quizzes/${quizUuid}/questions/${questionUuid}`);
    return data;
};

export const reorderQuestions = async (quizUuid, orderedQuestionIds) => {
    const { data } = await api.patch(`/admin/quizzes/${quizUuid}/questions/reorder`, {
        orderedQuestionIds,
    });
    return data;
};
