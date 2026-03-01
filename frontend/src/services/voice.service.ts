import { api } from '@/lib/api';

export const voiceService = {
    processCommand: async (command: string) => {
        const response = await api.post<{ action: string; data: any; message: string }>('/voice/command', { command });
        return response.data;
    }
};
