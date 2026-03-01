import { Context } from 'hono';
import * as shareService from '../services/shareService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const generateShareLink = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const result = await shareService.generateShareLink(projectId);
  return c.json(result);
});

export const getSharedProject = catchAsync(async (c: Context) => {
  const token = c.req.param('token');
  const project = await shareService.getSharedProject(token);
  return c.json(project);
});
