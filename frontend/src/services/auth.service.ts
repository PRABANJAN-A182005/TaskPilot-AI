import { api } from '../lib/api';
import { User } from '../types';

export const authService = {
    login: async (
        email: string,
        password: string
    ): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
        const response = await api.post('/auth/login', { email, password });
        const { user, accessToken, refreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        return response.data;
    },

    register: async (
        name: string,
        email: string,
        password: string
    ): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
        const response = await api.post('/auth/register', { name, email, password });
        const { user, accessToken, refreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        return response.data;
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (password: string, token: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/reset-password', { password, token });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    getCurrentUser: (): User | null => {
        const user = localStorage.getItem('user');

        return user ? JSON.parse(user) : null;
    },

    me: async (): Promise<User> => {
        const response = await api.get('/auth/me');

        const { user } = response.data;

        localStorage.setItem('user', JSON.stringify(user));

        return user;
    },

    updateProfile: async (data: {
        name?: string;
        bio?: string;
        avatar?: string;
        avatarKey?: string;
    }): Promise<User> => {
        const response = await api.patch('/auth/profile', data);

        const { user } = response.data;

        localStorage.setItem('user', JSON.stringify(user));

        return user;
    },

    uploadAvatar: async (file: File): Promise<{ url: string; key: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/auth/upload-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    deleteAccount: async (): Promise<void> => {
        await api.delete('/auth/account');

        authService.logout();
    }
};
