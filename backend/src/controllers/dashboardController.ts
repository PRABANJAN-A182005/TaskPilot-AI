import { Context } from 'hono';
import * as dashboardService from '../services/dashboardService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const getStats = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const stats = await dashboardService.getStats(userId);
  return c.json(stats);
});

export const getWeeklySummary = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const summary = await dashboardService.getWeeklySummary(userId);
  return c.json({ summary });
});
