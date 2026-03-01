import { Hono } from 'hono';
import * as shareController from '../controllers/shareController.ts';

const shareRoutes = new Hono();

shareRoutes.get('/:token', shareController.getSharedProject);

export default shareRoutes;
