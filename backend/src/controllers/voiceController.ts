import { Context } from 'hono';
import * as voiceService from '../services/voiceService.ts';
import catchAsync from '../utils/catchAsync.ts';

export const processCommand = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const { command } = await c.req.json();
  const result = await voiceService.processVoiceCommand(userId, command);
  return c.json(result);
});
