import { api } from '@/lib/api';
import { Project, ProjectMember, DailyUpdate, ChatMessage, ProjectHealth } from '@/types';

export const projectService = {
    getProjects: async () => {
        const response = await api.get<Project[]>('/projects');
        return response.data;
    },

    getProjectById: async (id: string) => {
        const response = await api.get<Project>(`/projects/${id}`);
        return response.data;
    },

    createProject: async (data: { name: string; description: string }) => {
        const response = await api.post<Project>('/projects', data);
        return response.data;
    },

    updateProject: async (id: string, data: Partial<Project>) => {
        const response = await api.patch<Project>(`/projects/${id}`, data);
        return response.data;
    },

    deleteProject: async (id: string) => {
        await api.delete(`/projects/${id}`);
    },

    toggleTeamMode: async (id: string, enabled: boolean) => {
        const response = await api.post<Project>(`/projects/${id}/team-mode`, { enabled });
        return response.data;
    },

    getMembers: async (id: string) => {
        const response = await api.get<{ members: ProjectMember[] }>(`/projects/${id}/members`);
        return response.data;
    },

    inviteMember: async (id: string, data: { email: string; role: 'ADMIN' | 'MEMBER' }) => {
        const response = await api.post<ProjectMember>(`/projects/${id}/invite`, data);
        return response.data;
    },

    joinProject: async (id: string) => {
        const response = await api.post<ProjectMember>(`/projects/${id}/join`);
        return response.data;
    },

    removeMember: async (id: string, userId: string) => {
        await api.delete(`/projects/${id}/members/${userId}`);
    },

    updateMemberRole: async (id: string, userId: string, role: 'ADMIN' | 'MEMBER') => {
        const response = await api.patch<ProjectMember>(`/projects/${id}/members/${userId}`, { role });
        return response.data;
    },

    submitDailyUpdate: async (id: string, data: { summary: string; blockers: string; suggestions: string }) => {
        const response = await api.post<DailyUpdate>(`/projects/${id}/daily-updates`, data);
        return response.data;
    },

    getDailyUpdates: async (id: string) => {
        const response = await api.get<DailyUpdate[]>(`/projects/${id}/daily-updates`);
        return response.data;
    },

    getProjectHealth: async (id: string) => {
        const response = await api.get<ProjectHealth>(`/projects/${id}/health`);
        return response.data;
    },

    getMessages: async (id: string) => {
        const response = await api.get<ChatMessage[]>(`/projects/${id}/messages`);
        return response.data;
    },

    sendMessage: async (id: string, data: { content: string; receiverId?: string }) => {
        const response = await api.post<ChatMessage>(`/projects/${id}/messages`, data);
        return response.data;
    }
};
