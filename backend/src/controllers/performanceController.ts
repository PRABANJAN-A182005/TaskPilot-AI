import { Context } from 'hono';
import * as performanceService from '../services/performanceService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const getMe = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const perf = await performanceService.getMemberPerformance(userId);
  return c.json(perf);
});

export const getProjectPerformance = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const result = await performanceService.getProjectPerformance(projectId);
  return c.json(result);
});

export const getTeamPerformance = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const result = await performanceService.getTeamPerformance(userId);
  return c.json(result);
});

export const getAiInsights = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const forceRefresh = c.req.query('forceRefresh') === 'true';
  const insights = await performanceService.getAiPerformanceInsights(userId, forceRefresh);
  return c.json(insights);
});
