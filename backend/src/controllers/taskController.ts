import { Context } from 'hono';
import * as taskService from '../services/taskService.ts';
import catchAsync from '../utils/catchAsync.ts';
import ApiError from '../utils/ApiError.ts';

export const getTasks = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const projectId = c.req.query('projectId');
  const tasks = await taskService.getTasks(userId, projectId);
  return c.json(tasks);
});

export const getTaskById = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const task = await taskService.getTaskById(id, userId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  return c.json(task);
});

export const createTask = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  try {
    const task = await taskService.createTask(userId, body);
    return c.json(task, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found or unauthorized')) {
        throw new ApiError(404, error.message);
    }
    throw error;
  }
});

export const updateTask = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    const task = await taskService.updateTask(id, userId, body);
    return c.json(task);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found or unauthorized')) {
        throw new ApiError(404, error.message);
    }
    throw error;
  }
});

export const deleteTask = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  await taskService.deleteTask(id, userId);
  return c.body(null, 204);
});

export const aiWorkDistribution = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const { projectId, title, description } = await c.req.json();
  const suggestion = await taskService.aiWorkDistribution(userId, projectId, title, description);
  return c.json(suggestion);
});
