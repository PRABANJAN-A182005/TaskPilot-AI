import { api } from '@/lib/api';

export interface PerformanceStats {
    userId: string;
    userName?: string;
    productivityScore: number;
    completedTasks: number;
    overdueTasks: number;
    activityCount: number;
    trend: { date: string; score: number }[];
}

export const performanceService = {
    getMe: async () => {
        const response = await api.get<PerformanceStats>('/performance/me');
        return response.data;
    },

    getTeamPerformance: async () => {
        const response = await api.get<{ members: PerformanceStats[] }>('/performance/team');
        return response.data;
    },

    getProjectPerformance: async (projectId: string) => {
        const response = await api.get<{ members: PerformanceStats[] }>(`/projects/${projectId}/performance`);
        return response.data;
    },

    getAiInsights: async (forceRefresh = false) => {
        const response = await api.get<{ suggestions: string[] }>('/performance/ai-insights', {
            params: forceRefresh ? { forceRefresh: 'true' } : {}
        });
        return response.data;
    }
};
