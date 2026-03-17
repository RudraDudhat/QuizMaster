import api from './axiosInstance';

export const getAllGroups = async ({ page = 0, size = 20 } = {}) => {
    const { data } = await api.get('/admin/groups', {
        params: { page, size },
    });
    return data;
};

export const getGroupByUuid = async (groupUuid) => {
    const { data } = await api.get(`/admin/groups/${groupUuid}`);
    return data;
};

export const createGroup = async ({ name, description }) => {
    const { data } = await api.post('/admin/groups', { name, description });
    return data;
};

export const updateGroup = async (groupUuid, { name, description }) => {
    const { data } = await api.put(`/admin/groups/${groupUuid}`, { name, description });
    return data;
};

export const deleteGroup = async (groupUuid) => {
    const { data } = await api.delete(`/admin/groups/${groupUuid}`);
    return data;
};

export const getGroupMembers = async (groupUuid) => {
    const { data } = await api.get(`/admin/groups/${groupUuid}/members`);
    return data;
};

export const addGroupMembers = async (groupUuid, { userUuids }) => {
    const { data } = await api.post(`/admin/groups/${groupUuid}/members`, { userUuids });
    return data;
};

export const removeGroupMember = async (groupUuid, userUuid) => {
    const { data } = await api.delete(`/admin/groups/${groupUuid}/members/${userUuid}`);
    return data;
};
