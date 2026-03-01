import prisma from '../client.ts';
import { Llm, LlmProvider } from '@uptiqai/integrations-sdk';
import { createNotification } from './notificationService.ts';

export const processMeetingNotes = async (projectId: string, userId: string, notes: string) => {
  const llm = new Llm({ provider: process.env.LLM_PROVIDER as LlmProvider });
  
  const prompt = `Analyze these meeting notes:
  "${notes}"
  
  Tasks to perform:
  1. Summarize the meeting.
  2. Extract action items with their titles and suggested assignee emails (if mentioned).
  
  Respond ONLY with a JSON object: { summary: string, actionItems: { title: string, assigneeEmail?: string }[] }`;

  const result = await llm.generateText({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.LLM_MODEL
  });

  let data = { summary: "No summary generated", actionItems: [] as any[] };
  try {
    data = JSON.parse(result.text.replace(/```json|```/g, '').trim());
  } catch (error) {
    console.error('AI Meeting Processing Error:', error);
  }

  // Create meeting record
  await prisma.meeting.create({
    data: {
      projectId,
      userId,
      notes,
      summary: data.summary
    }
  });

  // Auto-create tasks
  for (const item of data.actionItems) {
    let assignedToId: string | undefined;
    if (item.assigneeEmail) {
      const user = await prisma.user.findUnique({ where: { email: item.assigneeEmail } });
      if (user) assignedToId = user.id;
    }

    await prisma.task.create({
      data: {
        projectId,
        title: item.title,
        description: `Action item from meeting notes: ${data.summary.substring(0, 100)}...`,
        assignedToId,
        priority: 'Medium'
      }
    });

    if (assignedToId) {
      await createNotification({
        userId: assignedToId,
        title: 'New Task from Meeting',
        content: `You have been assigned a new task: ${item.title}`,
        type: 'INFO'
      });
    }
  }

  return data;
};
