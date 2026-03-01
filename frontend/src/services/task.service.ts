import { api } from '@/lib/api';
import { Task, AISuggestion } from '@/types';

export const taskService = {
    getTasks: async (projectId?: string) => {
        const response = await api.get<Task[]>('/tasks', {
            params: { projectId }
        });
        return response.data;
    },

    getTaskById: async (id: string) => {
        const response = await api.get<Task>(`/tasks/${id}`);
        return response.data;
    },

    createTask: async (data: any) => {
        const response = await api.post<Task>('/tasks', data);
        return response.data;
    },

    updateTask: async (id: string, data: any) => {
        const response = await api.patch<Task>(`/tasks/${id}`, data);
        return response.data;
    },

    deleteTask: async (id: string) => {
        await api.delete(`/tasks/${id}`);
    },

    getAIWorkDistribution: async (data: { projectId: string; title: string; description: string }) => {
        const response = await api.post<AISuggestion>('/tasks/ai-assign', data);
        return response.data;
    }
};
