import { api } from '@/lib/api';

export const meetingService = {
    processMeetingNotes: async (projectId: string, notes: string) => {
        const response = await api.post<{
            summary: string;
            actionItems: { title: string; assigneeEmail?: string }[];
        }>(`/projects/${projectId}/meetings`, { notes });
        return response.data;
    }
};
