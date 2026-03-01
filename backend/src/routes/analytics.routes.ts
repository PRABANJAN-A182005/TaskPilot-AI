import { Hono } from 'hono';
import * as dashboardController from '../controllers/dashboardController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const analyticsRoutes = new Hono();

analyticsRoutes.use('*', authMiddleware);

analyticsRoutes.get('/executive', dashboardController.getStats); // Reuse dashboard stats for executive view for now

export default analyticsRoutes;
