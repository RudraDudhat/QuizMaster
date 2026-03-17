import { create } from 'zustand';
import api from '../api/axiosInstance';

const useAuthStore = create((set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,

    setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, accessToken, isAuthenticated: true });
    },

    clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null, accessToken: null, isAuthenticated: false });
    },

    setLoading: (isLoading) => {
        set({ isLoading });
    },

    initFromStorage: async () => {
        const { setAuth, clearAuth, setLoading } = get();
        setLoading(true);

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            const { data } = await api.get('/auth/me');
            const refreshToken = localStorage.getItem('refreshToken');
            // Backend wraps response in ApiResponse<T>, so data.data is the actual user map
            setAuth(data.data, accessToken, refreshToken);
        } catch {
            // Only clear auth if the token hasn't been replaced by a fresh login
            // that happened while the background /auth/me call was in-flight.
            const currentToken = localStorage.getItem('accessToken');
            if (currentToken === accessToken) {
                clearAuth();
            }
        } finally {
            setLoading(false);
        }
    },
}));

export default useAuthStore;
