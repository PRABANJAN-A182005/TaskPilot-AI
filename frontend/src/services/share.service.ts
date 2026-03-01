import { api } from '@/lib/api';

export const shareService = {
    generateShareLink: async (projectId: string) => {
        const response = await api.post<{ shareUrl: string; token: string }>(`/projects/${projectId}/share`);
        return response.data;
    },

    getSharedProject: async (token: string) => {
        const response = await api.get(`/share/${token}`);
        return response.data;
    }
};
