import prisma from '../client.ts';
import { Llm, LlmProvider } from '@uptiqai/integrations-sdk';

export const submitDailyUpdate = async (userId: string, projectId: string, data: any) => {
  return prisma.dailyUpdate.create({
    data: {
      projectId,
      userId,
      ...data,
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true }
      }
    }
  });
};

export const getDailyUpdates = async (projectId: string) => {
  return prisma.dailyUpdate.findMany({
    where: { projectId, isDeleted: false },
    include: {
      user: {
        select: { id: true, name: true, avatar: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getProjectHealth = async (projectId: string) => {
  const updates = await prisma.dailyUpdate.findMany({
    where: { projectId, isDeleted: false, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    include: { user: { select: { name: true } } }
  });

  const tasks = await prisma.task.findMany({
    where: { projectId, isDeleted: false }
  });

  const llm = new Llm({ provider: process.env.LLM_PROVIDER as LlmProvider });
  
  const prompt = `Analyze project health based on daily updates and task status.
Daily Updates (last 7 days): ${JSON.stringify(updates)}
Task Stats: Total ${tasks.length}, Completed ${tasks.filter(t => t.status === 'Complete').length}, In-Progress ${tasks.filter(t => t.status === 'In-Progress').length}

Respond ONLY with a JSON object in this format:
{
  "team_health_status": "Healthy | At Risk | Critical",
  "risks_detected": ["risk 1", "risk 2"],
  "improvement_suggestions": ["suggestion 1", "suggestion 2"]
}`;

  const result = await llm.generateText({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.LLM_MODEL
  });

  try {
    const text = result.text.trim();
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return JSON.parse(jsonStr);
  } catch (error) {
    return {
      team_health_status: "Neutral",
      risks_detected: ["Insufficient data for analysis"],
      improvement_suggestions: ["Ensure all team members submit daily updates"]
    };
  }
};

export const sendMessage = async (userId: string, projectId: string, content: string, receiverId?: string) => {
  return prisma.chatMessage.create({
    data: {
      projectId,
      userId,
      content,
      receiverId
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true }
      }
    }
  });
};

export const getMessages = async (userId: string, projectId: string) => {
  return prisma.chatMessage.findMany({
    where: {
      projectId,
      isDeleted: false,
      OR: [
        { receiverId: null }, // Public messages
        { receiverId: userId }, // Messages to current user
        { userId: userId, receiverId: { not: null } } // Private messages sent by user
      ]
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
};
