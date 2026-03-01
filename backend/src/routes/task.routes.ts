import { Hono } from 'hono';
import * as taskController from '../controllers/taskController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

import * as attachmentController from '../controllers/attachmentController.ts';

const taskRoutes = new Hono();

taskRoutes.use('*', authMiddleware);

taskRoutes.get('/', taskController.getTasks);
taskRoutes.get('/:id', taskController.getTaskById);
taskRoutes.post('/', taskController.createTask);
taskRoutes.patch('/:id', taskController.updateTask);
taskRoutes.delete('/:id', taskController.deleteTask);
taskRoutes.post('/ai-assign', taskController.aiWorkDistribution);

// Attachments
taskRoutes.post('/:id/attachments', attachmentController.uploadAttachment);
taskRoutes.get('/:id/attachments', attachmentController.getAttachments);
taskRoutes.post('/attachments/:id/ai-summary', attachmentController.getAiSummary);

export default taskRoutes;
