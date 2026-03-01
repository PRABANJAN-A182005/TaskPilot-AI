import { Hono } from 'hono';
import * as performanceController from '../controllers/performanceController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const performanceRoutes = new Hono();

performanceRoutes.use('*', authMiddleware);

performanceRoutes.get('/me', performanceController.getMe);
performanceRoutes.get('/team', performanceController.getTeamPerformance);
performanceRoutes.get('/ai-insights', performanceController.getAiInsights);

export default performanceRoutes;
