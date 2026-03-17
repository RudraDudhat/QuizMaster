import api from './axiosInstance';

export const register = async ({ fullName, email, password, role }) => {
    const { data } = await api.post('/auth/register', { fullName, email, password, role });
    return data;
};

export const login = async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
};

export const refreshToken = async ({ refreshToken }) => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
};

export const logout = async () => {
    const { data } = await api.post('/auth/logout', {
        refreshToken: localStorage.getItem('refreshToken'),
    });
    return data;
};

export const getMe = async () => {
    const { data } = await api.get('/auth/me');
    return data;
};

export const forgotPassword = async ({ email }) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
};

export const resetPassword = async ({ token, newPassword }) => {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
};
