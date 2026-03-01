import { Hono } from 'hono';
import * as dashboardController from '../controllers/dashboardController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const dashboardRoutes = new Hono();

dashboardRoutes.use('*', authMiddleware);

dashboardRoutes.get('/stats', dashboardController.getStats);
dashboardRoutes.get('/weekly-summary', dashboardController.getWeeklySummary);

export default dashboardRoutes;
