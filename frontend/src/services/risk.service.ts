import { api } from '@/lib/api';

export interface Risk {
    level: 'Low' | 'Medium' | 'High';
    type: string;
    description: string;
    suggestions: string[];
}

export const riskService = {
    getProjectRisks: async (projectId: string, forceRefresh = false) => {
        const response = await api.get<{ risks: Risk[] }>(`/projects/${projectId}/risks`, {
            params: forceRefresh ? { forceRefresh: 'true' } : {}
        });
        return response.data;
    }
};
