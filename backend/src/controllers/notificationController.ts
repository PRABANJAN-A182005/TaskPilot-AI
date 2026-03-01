import { Context } from 'hono';
import * as notificationService from '../services/notificationService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const getNotifications = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const notifications = await notificationService.getNotifications(userId);
  return c.json(notifications);
});

export const markAsRead = catchAsync(async (c: Context) => {
  const id = c.req.param('id');
  const notification = await notificationService.markAsRead(id);
  return c.json(notification);
});

export const getUnreadCount = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const count = await notificationService.getUnreadCount(userId);
  return c.json(count);
});
