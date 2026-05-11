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

    // Mark one as read — optimistic: patch caches immediately so the UI
    // feels instant. We avoid invalidate() since that triggers a refetch
    // and a flash of the old state.
    const { mutate: markOneRead } = useMutation({
        mutationFn: (uuid) => markAsRead(uuid),
        onMutate: async (uuid) => {
            await queryClient.cancelQueries({ queryKey: ['notifications-list'] });
            await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });

            const prevList = queryClient.getQueryData(['notifications-list']);
            const prevCount = queryClient.getQueryData(['notifications-unread-count']);

            // Patch the list: flip isRead on the target notification
            queryClient.setQueryData(['notifications-list'], (old) => {
                if (!old?.data?.content) return old;
                const wasUnread = old.data.content.some(
                    (n) => n.uuid === uuid && !n.isRead
                );
                if (!wasUnread) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        content: old.data.content.map((n) =>
                            n.uuid === uuid ? { ...n, isRead: true } : n
                        ),
                    },
                };
            });

            // Decrement unread count (clamped at 0)
            queryClient.setQueryData(['notifications-unread-count'], (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: { ...old.data, count: Math.max(0, (old.data.count ?? 0) - 1) },
                };
            });

            return { prevList, prevCount };
        },
        onError: (_err, _uuid, ctx) => {
            // Roll back on failure
            if (ctx?.prevList) queryClient.setQueryData(['notifications-list'], ctx.prevList);
            if (ctx?.prevCount) queryClient.setQueryData(['notifications-unread-count'], ctx.prevCount);
        },
    });

    // Mark all as read — optimistic too
    const { mutate: markAllRead, isPending: markingAll } = useMutation({
        mutationFn: markAllAsRead,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['notifications-list'] });
            await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });
            const prevList = queryClient.getQueryData(['notifications-list']);
            const prevCount = queryClient.getQueryData(['notifications-unread-count']);

            queryClient.setQueryData(['notifications-list'], (old) => {
                if (!old?.data?.content) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        content: old.data.content.map((n) => ({ ...n, isRead: true })),
                    },
                };
            });
            queryClient.setQueryData(['notifications-unread-count'], (old) => {
                if (!old?.data) return old;
                return { ...old, data: { ...old.data, count: 0 } };
            });

            return { prevList, prevCount };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prevList) queryClient.setQueryData(['notifications-list'], ctx.prevList);
            if (ctx?.prevCount) queryClient.setQueryData(['notifications-unread-count'], ctx.prevCount);
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
