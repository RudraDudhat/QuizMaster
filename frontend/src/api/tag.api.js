import api from './axiosInstance';

export const getAllTags = async () => {
    const { data } = await api.get('/admin/tags');
    return data;
};

export const searchTags = async (keyword) => {
    const { data } = await api.get('/admin/tags/search', {
        params: { q: keyword },
    });
    return data;
};

export const createTag = async ({ name }) => {
    const { data } = await api.post('/admin/tags', { name });
    return data;
};

export const deleteTag = async (tagUuid) => {
    const { data } = await api.delete(`/admin/tags/${tagUuid}`);
    return data;
};
