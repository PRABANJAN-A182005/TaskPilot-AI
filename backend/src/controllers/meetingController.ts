import { Context } from 'hono';
import * as meetingService from '../services/meetingService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const processMeetingNotes = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  const { notes } = await c.req.json();
  const result = await meetingService.processMeetingNotes(projectId, userId, notes);
  return c.json(result);
});
