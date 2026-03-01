import { errorHandler } from './middlewares/error.ts';
import ApiError from './utils/ApiError.ts';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import authRoutes from './routes/auth.routes.ts';
import projectRoutes from './routes/project.routes.ts';
import taskRoutes from './routes/task.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import notificationRoutes from './routes/notification.routes.ts';
import performanceRoutes from './routes/performance.routes.ts';
import voiceRoutes from './routes/voice.routes.ts';
import shareRoutes from './routes/share.routes.ts';
import analyticsRoutes from './routes/analytics.routes.ts';

const app = new Hono();

// set security HTTP headers only in production
if (process.env.NODE_ENV === 'production') app.use(secureHeaders());

// Note: compress() middleware is intentionally NOT used as it blocks streaming responses
// If you need compression for non-streaming routes, apply it selectively per route

// enable cors
app.use(cors());

app.get('/', c => {
    return c.text('Server is up and running');
});

app.get('/version.json', c => {
    return c.json({ version: parseInt(process.env.VERSION || '0') });
});

app.get('/health', c => {
    return c.text('OK');
});

// Mount routes
app.route('/auth', authRoutes);
app.route('/projects', projectRoutes);
app.route('/tasks', taskRoutes);
app.route('/dashboard', dashboardRoutes);
app.route('/notifications', notificationRoutes);
app.route('/performance', performanceRoutes);
app.route('/voice', voiceRoutes);
app.route('/share', shareRoutes);
app.route('/analytics', analyticsRoutes);

// send back a 404 error for any unknown api request
app.notFound(() => {
    throw new ApiError(404, 'Not found');
});

// handle error
app.onError((err, c) => {
    return errorHandler(err, c);
});

export default app;
