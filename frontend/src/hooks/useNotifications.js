import { useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from '../api/notification.api';
import useAuthStore from '../store/authStore';

export default function useNotifications() {
    const [unreadCount, setUnreadCount] = useState(0);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const refetch = useCallback(async () => {
        try {
            const data = await getUnreadCount();
            setUnreadCount(data);
        } catch {
            // silently fail
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }

        refetch();
        const interval = setInterval(refetch, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, refetch]);

    return { unreadCount, refetch };
}
