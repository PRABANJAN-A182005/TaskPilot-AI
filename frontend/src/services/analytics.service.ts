import { api } from '@/lib/api';

export const analyticsService = {
    getExecutiveStats: async () => {
        const response = await api.get('/analytics/executive');
        return response.data;
    }
};
