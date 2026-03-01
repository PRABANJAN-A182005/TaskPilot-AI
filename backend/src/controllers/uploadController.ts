import { Context } from 'hono';
import { Storage, InfraProvider } from '@uptiqai/integrations-sdk';
import ApiError from '../utils/ApiError.ts';
import catchAsync from '../utils/catchAsync.ts';

const storage = new Storage({ provider: process.env.INFRA_PROVIDER as InfraProvider });

export const uploadAvatar = catchAsync(async (c: Context) => {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const userId = c.get('userId');

    if (!file || !(file instanceof Blob) || file.size === 0) {
        throw new ApiError(400, 'file is required (multipart form field)');
    }

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    const extension = file.type.split('/')[1] || 'png';
    const destinationKey = `avatars/${userId}-${Date.now()}.${extension}`;

    const result = await storage.uploadFile({
        file: file as Blob,
        destinationKey: destinationKey,
    }) as any;

    return c.json({
        url: result.url,
        key: result.key
    });
});
