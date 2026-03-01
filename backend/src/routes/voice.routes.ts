import { Hono } from 'hono';
import * as voiceController from '../controllers/voiceController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const voiceRoutes = new Hono();

voiceRoutes.use('*', authMiddleware);

voiceRoutes.post('/command', voiceController.processCommand);

export default voiceRoutes;
