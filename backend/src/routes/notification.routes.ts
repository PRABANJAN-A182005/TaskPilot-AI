import { Hono } from 'hono';
import * as notificationController from '../controllers/notificationController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const notificationRoutes = new Hono();

notificationRoutes.use('*', authMiddleware);

notificationRoutes.get('/', notificationController.getNotifications);
notificationRoutes.post('/:id/read', notificationController.markAsRead);
notificationRoutes.get('/unread-count', notificationController.getUnreadCount);

export default notificationRoutes;
