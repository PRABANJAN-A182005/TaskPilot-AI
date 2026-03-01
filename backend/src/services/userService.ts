import prisma from '../client.ts';
import { User } from '../types/user.ts';
import { Storage, InfraProvider } from '@uptiqai/integrations-sdk';
import bcrypt from 'bcrypt';
import ApiError from '../utils/ApiError.ts';

const storage = process.env.INFRA_PROVIDER 
    ? new Storage({ provider: process.env.INFRA_PROVIDER as InfraProvider })
    : null;

/**
 * User Service - Functional approach for user and identity management
 */

/**
 * Helper to enrich user with fresh signed URL if avatarKey is present
 */
async function enrichUserWithAvatar(user: any): Promise<User> {
    if (!user) return user;
    
    // Safety check for isDeleted which might be null in some records
    if (user.isDeleted === true) return null as any;

    if (user.avatarKey && storage) {
        try {
            const { url } = await storage.generateDownloadSignedUrl({
                key: user.avatarKey
            });
            return { ...user, avatar: url } as unknown as User;
        } catch (error) {
            console.error('Failed to generate signed URL for avatar:', error);
        }
    }
    return user as unknown as User;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
        where: { 
            id: userId,
            NOT: { isDeleted: true }
        }
    });
    return enrichUserWithAvatar(user);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
        where: { 
            email,
            NOT: { isDeleted: true }
        }
    });
    return enrichUserWithAvatar(user);
}

/**
 * Get all identities for a user
 */
export async function getUserIdentities(userId: string) {
    return await prisma.userIdentity.findMany({
        where: { 
            userId,
            NOT: { isDeleted: true }
        }
    });
}

/**
 * Unlink an identity from a user
 * Only allowed if user has at least one other identity
 */
export async function unlinkIdentity(userId: string, provider: string): Promise<void> {
    const identities = await getUserIdentities(userId);

    if (identities.length <= 1) {
        throw new ApiError(400, 'Cannot unlink last identity. User must have at least one login method.');
    }

    await prisma.userIdentity.updateMany({
        where: {
            userId,
            provider,
            isDeleted: false
        },
        data: {
            isDeleted: true
        }
    });
}

/**
 * Register user with email and password
 */
export async function registerWithEmailPassword(emailInput: string, password: string, name?: string): Promise<User> {
    const email = emailInput.toLowerCase();
    // Check if user already exists (even if soft-deleted)
    const existingUser = await prisma.user.findFirst({
        where: { 
            email: { equals: email, mode: 'insensitive' }
        }
    });

    if (existingUser) {
        if (existingUser.isDeleted) {
            throw new ApiError(400, 'This email is associated with a deleted account. Please contact support or use a different email.');
        }
        throw new ApiError(400, 'User with this email already exists');
    }

    // Hash password
    let passwordHash: string;
    try {
        passwordHash = await bcrypt.hash(password, 10);
    } catch (error) {
        console.error('Bcrypt hashing failed:', error);
        throw new ApiError(500, 'Internal server error during registration');
    }

    // Create user with email/password identity
    try {
        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || null,
                identities: {
                    create: {
                        provider: 'EmailPassword',
                        providerId: email,
                        metadata: {
                            passwordHash,
                            emailVerified: false,
                            registeredAt: new Date().toISOString()
                        }
                    }
                }
            }
        });

        return enrichUserWithAvatar(newUser);
    } catch (error: any) {
        console.error('Prisma user creation failed:', error);
        if (error.code === 'P2002') {
            throw new ApiError(400, 'This email is already taken');
        }
        throw new ApiError(500, 'Failed to create user account');
    }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateWithEmailPassword(emailInput: string, password: string): Promise<User> {
    const email = emailInput.toLowerCase();
    // Find user identity
    const identity = await prisma.userIdentity.findFirst({
        where: {
            provider: 'EmailPassword',
            providerId: { equals: email, mode: 'insensitive' },
            NOT: { isDeleted: true }
        },
        include: {
            user: true
        }
    });

    if (!identity || !identity.user || identity.user.isDeleted === true) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Verify password
    const metadata = identity.metadata as any;
    const isValid = await bcrypt.compare(password, metadata.passwordHash);

    if (!isValid) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Update last login
    await prisma.userIdentity.update({
        where: { id: identity.id },
        data: {
            metadata: {
                ...metadata,
                lastLoginAt: new Date().toISOString()
            }
        }
    });

    return enrichUserWithAvatar(identity.user);
}

/**
 * Reset user password
 */
export async function resetPassword(userId: string, newPassword: string): Promise<void> {
    // Hash new password
    let passwordHash: string;
    try {
        passwordHash = await bcrypt.hash(newPassword, 10);
    } catch (error) {
        console.error('Bcrypt hashing failed:', error);
        throw new ApiError(500, 'Internal server error during password reset');
    }

    // Find the EmailPassword identity for the user
    const identity = await prisma.userIdentity.findFirst({
        where: {
            userId,
            provider: 'EmailPassword',
            isDeleted: false
        }
    });

    if (!identity) {
        throw new ApiError(404, 'User identity not found or password reset not supported for this account type');
    }

    // Update the identity metadata with the new password hash
    const metadata = identity.metadata as any;
    await prisma.userIdentity.update({
        where: { id: identity.id },
        data: {
            metadata: {
                ...metadata,
                passwordHash,
                updatedAt: new Date().toISOString()
            }
        }
    });
}

/**
 * Find or create user with phone number
 */
export async function findOrCreateUserByPhone(phone: string, name?: string): Promise<User> {
    // Check if identity exists
    const existingIdentity = await prisma.userIdentity.findFirst({
        where: {
            provider: 'PhoneOTP',
            providerId: phone,
            NOT: { isDeleted: true }
        },
        include: {
            user: true
        }
    });

    if (existingIdentity && existingIdentity.user && existingIdentity.user.isDeleted !== true) {
        // Update last login
        await prisma.userIdentity.update({
            where: { id: existingIdentity.id },
            data: {
                metadata: {
                    ...(existingIdentity.metadata as any),
                    lastLoginAt: new Date().toISOString()
                }
            }
        });
        return enrichUserWithAvatar(existingIdentity.user);
    }

    // Create new user with phone identity
    const newUser = await prisma.user.create({
        data: {
            email: `${phone.replace(/[^0-9]/g, '')}@phone.local`, // Placeholder email
            name: name || null,
            identities: {
                create: {
                    provider: 'PhoneOTP',
                    providerId: phone,
                    metadata: {
                        phone,
                        phoneVerified: true,
                        registeredAt: new Date().toISOString(),
                        lastLoginAt: new Date().toISOString()
                    }
                }
            }
        }
    });

    return enrichUserWithAvatar(newUser);
}

/**
 * Update user profile information
 */
export async function updateUser(userId: string, data: { name?: string; bio?: string; avatar?: string; avatarKey?: string }): Promise<User> {
    const user = await prisma.user.update({
        where: { id: userId },
        data
    });
    return enrichUserWithAvatar(user);
}

/**
 * Soft delete user account
 */
export async function deleteUser(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { isDeleted: true }
    });

    // Also soft delete identities
    await prisma.userIdentity.updateMany({
        where: { userId },
        data: { isDeleted: true }
    });
}
