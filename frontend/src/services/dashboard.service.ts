import { api } from '@/lib/api';
import { DashboardStats } from '@/types';

export const dashboardService = {
    getStats: async () => {
        const response = await api.get<DashboardStats>('/dashboard/stats');
        return response.data;
    },

    getWeeklySummary: async () => {
        const response = await api.get<{ summary: string }>('/dashboard/weekly-summary');
        return response.data;
    }
};
