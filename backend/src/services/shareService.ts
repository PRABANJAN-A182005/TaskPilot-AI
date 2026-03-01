import prisma from '../client.ts';
import crypto from 'crypto';

export const generateShareLink = async (projectId: string) => {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.projectShare.create({
    data: {
      projectId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    }
  });

  return {
    shareUrl: `/share/${token}`,
    token
  };
};

export const getSharedProject = async (token: string) => {
  const share = await prisma.projectShare.findUnique({
    where: { token, isDeleted: false },
    include: {
      project: {
        include: {
          tasks: {
            where: { isDeleted: false },
            include: { subtasks: true }
          }
        }
      }
    }
  });

  if (!share || (share.expiresAt && share.expiresAt < new Date())) {
    throw new Error('Invalid or expired share link');
  }

  return share.project;
};
