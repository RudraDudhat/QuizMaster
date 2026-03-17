import api from './axiosInstance';

export const getAllCategories = async () => {
    const { data } = await api.get('/admin/categories');
    return data;
};

export const getCategoryByUuid = async (categoryUuid) => {
    const { data } = await api.get(`/admin/categories/${categoryUuid}`);
    return data;
};

export const createCategory = async (categoryData) => {
    const { data } = await api.post('/admin/categories', categoryData);
    return data;
};

export const updateCategory = async (categoryUuid, categoryData) => {
    const { data } = await api.put(`/admin/categories/${categoryUuid}`, categoryData);
    return data;
};

export const deleteCategory = async (categoryUuid) => {
    const { data } = await api.delete(`/admin/categories/${categoryUuid}`);
    return data;
};
