import prisma from '../client.ts';
import ApiError from '../utils/ApiError.ts';
import { Llm, LlmProvider } from '@uptiqai/integrations-sdk';

export const getSprints = async (projectId: string) => {
  return prisma.sprint.findMany({
    where: { projectId, isDeleted: false },
    orderBy: { startDate: 'asc' }
  });
};

export const createSprint = async (projectId: string, data: { name: string; startDate: string; endDate: string; goal?: string }) => {
  return prisma.sprint.create({
    data: {
      projectId,
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    }
  });
};

export const updateSprint = async (sprintId: string, data: any) => {
  const updateData = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  return prisma.sprint.update({
    where: { id: sprintId },
    data: updateData
  });
};

export const deleteSprint = async (sprintId: string) => {
  return prisma.sprint.update({
    where: { id: sprintId },
    data: { isDeleted: true }
  });
};

export const getAiSprintPlanning = async (projectId: string, forceRefresh = false) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        where: { isDeleted: false, status: { not: 'Complete' } },
        select: { id: true, title: true, description: true, priority: true }
      }
    }
  });

  if (!project) throw new ApiError(404, 'Project not found');

  // Check if we already have a plan and we are not forcing a refresh
  if (!forceRefresh && project.sprintPlanAi) {
    return project.sprintPlanAi;
  }

  if (project.tasks.length === 0) {
    const defaultData = {
      suggestedDuration: 14,
      recommendedDeadlines: {},
      dependencyMap: {},
      completionProbability: 100,
      timeline: ["No backlog tasks found. Add tasks to plan a sprint."]
    };
    
    // Save default data if not already saved
    if (!project.sprintPlanAi) {
      await prisma.project.update({
        where: { id: projectId },
        data: { sprintPlanAi: defaultData }
      });
    }
    
    return defaultData;
  }

  const llm = new Llm({ provider: process.env.LLM_PROVIDER as LlmProvider });
  
  const prompt = `Backlog for "${project.name}":
  ${JSON.stringify(project.tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority })))}
  
  Suggest a sprint plan. Respond ONLY with a JSON object:
  {
    "suggestedDuration": number (days),
    "recommendedDeadlines": { "taskId": "ISO date" },
    "dependencyMap": { "taskId": ["dependsOnTaskId"] },
    "completionProbability": number (0-100),
    "timeline": ["Milestone 1", "Milestone 2"]
  }`;

  const result = await llm.generateText({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.LLM_MODEL
  });

  try {
    const text = result.text.replace(/```json|```/g, '').trim();
    const aiData = JSON.parse(text);
    
    // Persist the AI data
    await prisma.project.update({
      where: { id: projectId },
      data: { sprintPlanAi: aiData }
    });

    return aiData;
  } catch (error) {
    console.error('Sprint Planning AI Error:', error);
    const fallbackData = {
      suggestedDuration: 14,
      recommendedDeadlines: {},
      dependencyMap: {},
      completionProbability: 75,
      timeline: ["Standard 2-week sprint suggested based on backlog size."]
    };
    return fallbackData;
  }
};
