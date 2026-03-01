import prisma from '../client.ts';
import { Storage, InfraProvider, Llm, LlmProvider } from '@uptiqai/integrations-sdk';

const storage = new Storage({ provider: process.env.INFRA_PROVIDER as InfraProvider });

export const createAttachment = async (taskId: string, userId: string, file: any) => {
  const destinationKey = `tasks/${taskId}/${Date.now()}_${file.name}`;
  const result = await storage.uploadFile({
    file: file as Blob,
    destinationKey
  });

  return prisma.attachment.create({
    data: {
      taskId,
      userId,
      name: file.name,
      url: (result as any).url || '',
      storageKey: destinationKey,
      fileType: file.type || 'application/octet-stream',
      size: file.size || 0
    }
  });
};

export const getAttachments = async (taskId: string) => {
  return prisma.attachment.findMany({
    where: { taskId, isDeleted: false }
  });
};

export const getAiSummary = async (attachmentId: string) => {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment) throw new Error('Attachment not found');

  // Since we can't easily parse complex files here, we'll simulate AI summary based on metadata
  // In a real app, we'd download and parse the file content.
  const llm = new Llm({ provider: process.env.LLM_PROVIDER as LlmProvider });
  const prompt = `Generate a placeholder summary for a file named "${attachment.name}" of type "${attachment.fileType}".`;
  
  const result = await llm.generateText({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.LLM_MODEL
  });

  return { summary: result.text };
};
