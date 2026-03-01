import { api } from '@/lib/api';

export interface Sprint {
    id: string;
    projectId: string;
    name: string;
    startDate: string;
    endDate: string;
    goal?: string;
    status: 'Planned' | 'Active' | 'Completed';
    createdAt: string;
}

export const sprintService = {
    getSprints: async (projectId: string) => {
        const response = await api.get<Sprint[]>(`/projects/${projectId}/sprints`);
        return response.data;
    },

    createSprint: async (
        projectId: string,
        data: { name: string; startDate: string; endDate: string; goal?: string }
    ) => {
        const response = await api.post<Sprint>(`/projects/${projectId}/sprints`, data);
        return response.data;
    },

    updateSprint: async (projectId: string, sprintId: string, data: Partial<Sprint>) => {
        const response = await api.patch<Sprint>(`/projects/${projectId}/sprints/${sprintId}`, data);
        return response.data;
    },

    deleteSprint: async (projectId: string, sprintId: string) => {
        await api.delete(`/projects/${projectId}/sprints/${sprintId}`);
    },

    getAiPlanning: async (projectId: string, forceRefresh = false) => {
        const response = await api.get<{
            suggestedDuration: number;
            recommendedDeadlines: Record<string, string>;
            dependencyMap: Record<string, string[]>;
            completionProbability: number;
            timeline: any[];
        }>(`/projects/${projectId}/sprints/ai-planning`, {
            params: forceRefresh ? { forceRefresh: 'true' } : {}
        });
        return response.data;
    }
};
