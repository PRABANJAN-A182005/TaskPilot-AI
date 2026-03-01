import { api } from '@/lib/api';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    content: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export const notificationService = {
    getNotifications: async () => {
        const response = await api.get<Notification[]>('/notifications');
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await api.post(`/notifications/${id}/read`);
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get<{ count: number }>('/notifications/unread-count');
        return response.data;
    }
};
