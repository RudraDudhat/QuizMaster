import api from './axiosInstance';

/** GET /api/v1/auth/me — current user profile */
export const getMyProfile = async () => {
    const { data } = await api.get('/auth/me');
    return data;
};

/** PUT /api/v1/auth/me — update name, displayName, bio, profilePictureUrl */
export const updateMyProfile = async (payload) => {
    const { data } = await api.put('/auth/me', payload);
    return data;
};

/** POST /api/v1/auth/me/password — { currentPassword, newPassword } */
export const changeMyPassword = async (payload) => {
    const { data } = await api.post('/auth/me/password', payload);
    return data;
};
