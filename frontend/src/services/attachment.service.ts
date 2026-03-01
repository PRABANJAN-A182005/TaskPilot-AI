import { api } from '@/lib/api';

export interface Attachment {
    id: string;
    taskId: string;
    name: string;
    url: string;
    fileType: string;
    size: number;
    createdAt: string;
}

export const attachmentService = {
    upload: async (taskId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<Attachment>(`/tasks/${taskId}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    getAttachments: async (taskId: string) => {
        const response = await api.get<Attachment[]>(`/tasks/${taskId}/attachments`);
        return response.data;
    },

    getAiSummary: async (attachmentId: string) => {
        const response = await api.post<{ summary: string }>(`/attachments/${attachmentId}/ai-summary`);
        return response.data;
    }
};
