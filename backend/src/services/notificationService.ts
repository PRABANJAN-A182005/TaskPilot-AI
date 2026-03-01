import prisma from '../client.ts';

export const getNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
};

export const createNotification = async (data: { userId: string; title: string; content: string; type?: string; link?: string }) => {
  return prisma.notification.create({
    data: {
      ...data,
      type: data.type || 'INFO'
    }
  });
};

export const markAsRead = async (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
};

export const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false, isDeleted: false }
  });
  return { count };
};
