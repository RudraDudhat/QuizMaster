import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUnreadCount,
    getNotifications,
    markAsRead,
    markAllAsRead,
} from '../api/notification.api';
import useAuthStore from '../store/authStore';

export default function useNotifications() {
    const queryClient = useQueryClient();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Unread count (polls every 30 seconds)
    const { data: countResponse } = useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: getUnreadCount,
        enabled: isAuthenticated,
        staleTime: 0,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
    });
    const unreadCount = countResponse?.data?.count ?? 0;

    // Notifications list (first page)
    const {
        data: listResponse,
        isLoading: listLoading,
    } = useQuery({
        queryKey: ['notifications-list'],
        queryFn: () => getNotifications({ page: 0, size: 20 }),
        enabled: isAuthenticated,
        staleTime: 30_000,
    });
    const notifications = listResponse?.data?.content ?? [];
    const totalElements = listResponse?.data?.totalElements ?? 0;
    const hasMore = (listResponse?.data?.totalPages ?? 0) > 1;

    // Mark one as read
    const { mutate: markOneRead } = useMutation({
        mutationFn: (uuid) => markAsRead(uuid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
        },
    });

    // Mark all as read
    const { mutate: markAllRead, isPending: markingAll } = useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
        },
    });

    // Refresh helper
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    };

    return {
        unreadCount,
        notifications,
        totalElements,
        hasMore,
        listLoading,
        markOneRead,
        markAllRead,
        markingAll,
        refresh,
    };
}
