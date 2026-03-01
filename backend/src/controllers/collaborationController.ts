import { Context } from 'hono';
import * as collaborationService from '../services/collaborationService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const submitDailyUpdate = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  const body = await c.req.json();
  const update = await collaborationService.submitDailyUpdate(userId, projectId, body);
  return c.json(update, 201);
});

export const getDailyUpdates = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const updates = await collaborationService.getDailyUpdates(projectId);
  return c.json(updates);
});

export const getProjectHealth = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const health = await collaborationService.getProjectHealth(projectId);
  return c.json(health);
});

export const sendMessage = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  const { content, receiverId } = await c.req.json();
  const message = await collaborationService.sendMessage(userId, projectId, content, receiverId);
  return c.json(message, 201);
});

export const getMessages = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  const messages = await collaborationService.getMessages(userId, projectId);
  return c.json(messages);
});
