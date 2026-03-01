import { Context } from 'hono';
import * as attachmentService from '../services/attachmentService.ts';
import catchAsync from '../utils/catchAsync.ts';
import ApiError from '../utils/ApiError.ts';

export const uploadAttachment = catchAsync(async (c: Context) => {
  const taskId = c.req.param('id');
  const userId = c.get('userId');
  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof Blob)) {
    throw new ApiError(400, 'File is required');
  }

  const attachment = await attachmentService.createAttachment(taskId, userId, file);
  return c.json(attachment, 201);
});

export const getAttachments = catchAsync(async (c: Context) => {
  const taskId = c.req.param('id');
  const attachments = await attachmentService.getAttachments(taskId);
  return c.json(attachments);
});

export const getAiSummary = catchAsync(async (c: Context) => {
  const attachmentId = c.req.param('id');
  const summary = await attachmentService.getAiSummary(attachmentId);
  return c.json(summary);
});
