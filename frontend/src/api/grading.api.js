import api from './axiosInstance';

/* ── GET /api/v1/admin/grading/pending ───────────────────── */
export const getPendingReviews = async ({ page = 0, size = 20 } = {}) => {
    const response = await api.get('/admin/grading/pending', {
        params: { page, size },
    });
    return response.data;
};

/* ── GET /api/v1/admin/grading/{attemptUuid} ─────────────── */
export const getAttemptForGrading = async (attemptUuid) => {
    const response = await api.get(`/admin/grading/${attemptUuid}`);
    return response.data;
};

/* ── POST /api/v1/admin/grading/{attemptUuid}/questions/{questionUuid}/grade */
export const gradeEssayAnswer = async (attemptUuid, questionUuid, payload) => {
    const response = await api.post(
        `/admin/grading/${attemptUuid}/questions/${questionUuid}/grade`,
        payload
    );
    return response.data;
};
