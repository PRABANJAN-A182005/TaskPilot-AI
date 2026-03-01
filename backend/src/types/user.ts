export interface User {
    id: string;
    email: string;
    name: string | null;
    bio?: string | null;
    avatar?: string | null;
    avatarKey?: string | null;
    createdAt: Date;
}

export interface UserIdentity {
    id: string;
    userId: string;
    provider: string;
    providerId: string;
    metadata: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
}
