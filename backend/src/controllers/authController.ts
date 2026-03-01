import * as tokenService from '../services/tokenService.ts';
import * as userService from '../services/userService.ts';
import * as otpService from '../services/otpService.ts';
import * as projectService from '../services/projectService.ts';
import ApiError from '../utils/ApiError.ts';
import { validateEmailPassword } from '../utils/emailPassword.ts';
import { Context } from 'hono';
import { Email, EmailProvider } from '@uptiqai/integrations-sdk';

/**
 * Auth Controller - Functional approach for handling auth-related HTTP requests
 */

/**
 * POST /auth/forgot-password
 * Send password reset link to user's email
 * Body: { email: string }
 */
export async function forgotPassword(c: Context) {
    try {
        const body = await c.req.json();
        const { email } = body;

        if (!email) {
            throw new ApiError(400, 'Email is required');
        }

        const user = await userService.getUserByEmail(email);

        // For security, always return success even if user not found to prevent email enumeration
        if (!user) {
            return c.json({ message: 'If an account exists with this email, you will receive a reset link.' });
        }

        // Generate reset token
        const resetToken = tokenService.generateResetToken(user.id, user.email);

        // Send reset email
        const frontendUrl = process.env.FRONTEND_DOMAIN || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        const emailProvider = new Email({ provider: EmailProvider.Resend });
        await emailProvider.sendEmail({
            to: [user.email],
            subject: 'Reset Your TaskPilot AI Password',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Reset Your Password</h2>
                    <p>We received a request to reset your password for TaskPilot AI.</p>
                    <p>Click the button below to reset it. This link will expire in 1 hour.</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p>Or copy and paste this link: <br> ${resetLink}</p>
                </div>
            `
        });

        return c.json({ message: 'If an account exists with this email, you will receive a reset link.' });
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Forgot password error:', error);
        throw new ApiError(500, 'Failed to process forgot password request');
    }
}

/**
 * POST /auth/reset-password
 * Reset user password using reset token
 * Body: { token: string, password: string }
 */
export async function resetPassword(c: Context) {
    try {
        const body = await c.req.json();
        const { token, password } = body;

        if (!token || !password) {
            throw new ApiError(400, 'Token and password are required');
        }

        // Verify token
        let payload;
        try {
            payload = tokenService.verifyResetToken(token);
        } catch (error) {
            throw new ApiError(401, 'Invalid or expired reset token');
        }

        // Update password
        await userService.resetPassword(payload.userId, password);

        return c.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Reset password error:', error);
        throw new ApiError(500, 'Failed to reset password');
    }
}

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 * Body: { refreshToken: string }
 */
export async function refreshToken(c: Context) {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
    }

    try {
        // Verify refresh token and generate new access token
        const newAccessToken = tokenService.refreshAccessToken(refreshToken);

        return c.json({
            accessToken: newAccessToken
        });
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }
}

/**
 * GET /auth/me
 * Get current user info (requires auth middleware)
 */
export async function getCurrentUser(c: Context) {
    // User is already attached by auth middleware
    const userId = c.get('userId');

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    const user = await userService.getUserById(userId);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return c.json({ user });
}

/**
 * GET /auth/identities
 * Get all linked identities for current user
 */
export async function getUserIdentities(c: Context) {
    const userId = c.get('userId');

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    const identities = await userService.getUserIdentities(userId);

    return c.json({ identities });
}

/**
 * DELETE /auth/identities/:provider
 * Unlink an identity provider
 */
export async function unlinkIdentity(c: Context) {
    const userId = c.get('userId');
    const provider = c.req.param('provider');

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    try {
        await userService.unlinkIdentity(userId, provider);
        return c.json({ message: 'Identity unlinked successfully' });
    } catch (error) {
        if (error instanceof Error) {
            throw new ApiError(400, error.message);
        }
        throw error;
    }
}

/**
 * POST /auth/register
 * Register new user with email and password
 * Body: { email: string, password: string, name?: string }
 */
export async function register(c: Context) {
    try {
        const body = await c.req.json();
        const { email, password, name } = body;

        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required');
        }

        validateEmailPassword(email, password);

        // Register user in database with hashed password
        const user = await userService.registerWithEmailPassword(email, password, name);

        // Process any pending project invitations
        await projectService.processPendingInvitations(user.id, user.email);

        // Generate JWT tokens
        const tokens = tokenService.generateTokens(user.id, user.email);

        return c.json(
            {
                ...tokens,
                user
            },
            201
        );
    } catch (error) {
        if (error instanceof Error) {
            throw new ApiError(400, error.message);
        }
        throw error;
    }
}

/**
 * POST /auth/login
 * Login with email and password
 * Body: { email: string, password: string }
 */
export async function login(c: Context) {
    try {
        const body = await c.req.json();
        const { email, password } = body;

        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required');
        }

        validateEmailPassword(email, password);
        // Authenticate user and verify password
        const user = await userService.authenticateWithEmailPassword(email, password);

        // Process any pending project invitations
        await projectService.processPendingInvitations(user.id, user.email);

        // Generate JWT tokens
        const tokens = tokenService.generateTokens(user.id, user.email);

        return c.json({
            ...tokens,
            user
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new ApiError(401, error.message);
        }
        throw error;
    }
}

/**
 * PATCH /auth/profile
 * Update current user profile
 */
export async function updateProfile(c: Context) {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { name, bio, avatar, avatarKey } = body;

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    const updatedUser = await userService.updateUser(userId, { name, bio, avatar, avatarKey });

    return c.json({
        user: updatedUser
    });
}

/**
 * DELETE /auth/account
 * Soft delete current user account
 */
export async function deleteAccount(c: Context) {
    const userId = c.get('userId');

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    await userService.deleteUser(userId);

    return c.json({ message: 'Account deleted successfully' });
}



/**
 * POST /auth/phone/send-otp
 * Send OTP to phone number via WhatsApp
 * Body: { phone: string }
 */
export async function sendPhoneOTP(c: Context) {
    try {
        const body = await c.req.json();
        const { phone } = body;

        if (!phone) {
            throw new ApiError(400, 'Phone number is required');
        }
    
        if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
            throw new ApiError(400, 'Invalid phone number format. Use international format: +1234567890');
        }

        await otpService.generateAndSendOTP(phone, 'phone', 'login');

        return c.json({
            message: 'OTP sent successfully to WhatsApp',
            expiresIn: 600 // 10 minutes in seconds
        });

    } catch (error) {
        if (error instanceof Error) {
            throw new ApiError(400, error.message);
        }
        throw error;
    }
}

/**
 * POST /auth/phone/verify-otp
 * Verify OTP and login/register user
 * Body: { phone: string, otp: string, name?: string }
 */
export async function verifyPhoneOTP(c: Context) {
    try {
        const body = await c.req.json();
        const { phone, otp, name } = body;

        if (!phone || !otp) {
            throw new ApiError(400, 'Phone number and OTP are required');
        }

        // Verify OTP
        await otpService.verifyOTP(phone, 'phone', otp);

        // Find or create user
        const user = await userService.findOrCreateUserByPhone(phone, name);

        // Generate JWT tokens
        const tokens = tokenService.generateTokens(user.id, user.email);

        return c.json({
            ...tokens,
            user
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new ApiError(401, error.message);
        }
        throw error;
    }
}