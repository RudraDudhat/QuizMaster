import api from './axiosInstance';

export const getNotifications = async ({ page = 0, size = 20 } = {}) => {
    const { data } = await api.get('/notifications', {
        params: { page, size },
    });
    return data;
};

export const getUnreadCount = async () => {
    const { data } = await api.get('/notifications/unread-count');
    return data;
};

export const markAsRead = async (notificationUuid) => {
    const { data } = await api.patch(`/notifications/${notificationUuid}/read`);
    return data;
};

export const markAllAsRead = async () => {
    const { data } = await api.patch('/notifications/read-all');
    return data;
};
