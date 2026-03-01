import { Context } from 'hono';
import * as sprintService from '../services/sprintService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const getSprints = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const sprints = await sprintService.getSprints(projectId);
  return c.json(sprints);
});

export const createSprint = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const body = await c.req.json();
  const sprint = await sprintService.createSprint(projectId, body);
  return c.json(sprint, 201);
});

export const updateSprint = catchAsync(async (c: Context) => {
  const sprintId = c.req.param('sprintId');
  const body = await c.req.json();
  const sprint = await sprintService.updateSprint(sprintId, body);
  return c.json(sprint);
});

export const deleteSprint = catchAsync(async (c: Context) => {
  const sprintId = c.req.param('sprintId');
  await sprintService.deleteSprint(sprintId);
  return c.body(null, 204);
});

export const getAiSprintPlanning = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const forceRefresh = c.req.query('forceRefresh') === 'true';
  const aiData = await sprintService.getAiSprintPlanning(projectId, forceRefresh);
  return c.json(aiData);
});
