import prisma from '../client.ts';
import { Llm, LlmProvider } from '@uptiqai/integrations-sdk';

export const getMemberPerformance = async (userId: string) => {
  const tasks = await prisma.task.findMany({
    where: { assignedToId: userId, isDeleted: false },
    select: { status: true, deadline: true }
  });

  const now = new Date();
  const completedTasks = tasks.filter(t => t.status === 'Complete').length;
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter(t => 
    t.status !== 'Complete' && 
    t.deadline && 
    new Date(t.deadline) < now
  ).length;

  const productivityScore = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100 - (overdueTasks * 5);
  
  return {
    userId,
    productivityScore: Math.max(0, Math.min(100, productivityScore)),
    completedTasks,
    overdueTasks,
    activityCount: totalTasks,
    trend: [] // Simplified for now
  };
};

export const getProjectPerformance = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { 
      members: { where: { isDeleted: false }, include: { user: true } },
      user: true
    }
  });

  if (!project) return { members: [] };

  const memberIds = [project.userId, ...project.members.map(m => m.userId)];
  const tasks = await prisma.task.findMany({
    where: { projectId, isDeleted: false },
    select: { assignedToId: true, status: true, deadline: true }
  });

  const now = new Date();
  
  // Group tasks by member
  const tasksByMember = new Map<string, typeof tasks>();
  tasks.forEach(t => {
    if (!t.assignedToId) return;
    const userTasks = tasksByMember.get(t.assignedToId) || [];
    userTasks.push(t);
    tasksByMember.set(t.assignedToId, userTasks);
  });

  const results = memberIds.map(userId => {
    const memberTasks = tasksByMember.get(userId) || [];
    const completedTasks = memberTasks.filter(t => t.status === 'Complete').length;
    const totalTasks = memberTasks.length;
    const overdueTasks = memberTasks.filter(t => 
      t.status !== 'Complete' && 
      t.deadline && 
      new Date(t.deadline) < now
    ).length;

    const productivityScore = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100 - (overdueTasks * 2);
    const member = userId === project.userId ? project.user : project.members.find(m => m.userId === userId)?.user;

    return {
      userId,
      userName: member?.name || 'Unknown',
      productivityScore: Math.max(0, Math.min(100, productivityScore)),
      completedTasks,
      overdueTasks,
      activityCount: totalTasks
    };
  });

  return { members: results };
};

export const getAiPerformanceInsights = async (userId: string, forceRefresh = false) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, performanceAi: true }
  });

  if (!user) return { suggestions: [] };

  if (!forceRefresh && user.performanceAi) {
    return user.performanceAi;
  }

  const perf = await getMemberPerformance(userId);
  
  const llm = new Llm({ provider: process.env.LLM_PROVIDER as LlmProvider });
  
  const prompt = `User performance data:
  Productivity Score: ${perf.productivityScore}%
  Completed Tasks: ${perf.completedTasks}
  Overdue Tasks: ${perf.overdueTasks}
  Total Tasks: ${perf.activityCount}
  
  Provide exactly 3 short, actionable suggestions for this user to improve productivity. 
  Respond ONLY with a JSON array of strings. Example: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;

  const result = await llm.generateText({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.LLM_MODEL
  });

  try {
    const suggestions = JSON.parse(result.text.replace(/```json|```/g, '').trim());
    const data = { suggestions };
    
    // Persist the AI data
    await prisma.user.update({
      where: { id: userId },
      data: { performanceAi: data }
    });

    return data;
  } catch (error) {
    const fallbackSuggestions = { suggestions: ["Prioritize high-impact tasks", "Minimize daily blockers", "Focus on overdue tasks first"] };
    return fallbackSuggestions;
  }
};

export const getTeamPerformance = async (userId: string) => {
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [
        { userId, isDeleted: false },
        { members: { some: { userId, isDeleted: false } }, isDeleted: false }
      ]
    },
    include: {
      members: { where: { isDeleted: false }, include: { user: true } },
      user: true
    }
  });

  const memberIdsMap = new Map<string, any>();
  
  // Always include the current user even if no projects
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (currentUser) {
    memberIdsMap.set(userId, currentUser);
  }

  userProjects.forEach(p => {
    // Add owner
    memberIdsMap.set(p.userId, p.user);
    // Add members
    p.members.forEach(m => {
      memberIdsMap.set(m.userId, m.user);
    });
  });

  const memberIds = Array.from(memberIdsMap.keys());
  
  const tasks = await prisma.task.findMany({
    where: {
      projectId: { in: userProjects.map(p => p.id) },
      isDeleted: false
    },
    select: { assignedToId: true, status: true, deadline: true }
  });

  const now = new Date();
  
  // Group tasks by member to avoid O(N*M) filtering
  const tasksByMember = new Map<string, typeof tasks>();
  tasks.forEach(t => {
    if (!t.assignedToId) return;
    const userTasks = tasksByMember.get(t.assignedToId) || [];
    userTasks.push(t);
    tasksByMember.set(t.assignedToId, userTasks);
  });

  const results = memberIds.map(id => {
    const memberTasks = tasksByMember.get(id) || [];
    const completedTasks = memberTasks.filter(t => t.status === 'Complete').length;
    const totalTasks = memberTasks.length;
    const overdueTasks = memberTasks.filter(t => 
      t.status !== 'Complete' && 
      t.deadline && 
      new Date(t.deadline) < now
    ).length;

    const productivityScore = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100 - (overdueTasks * 2);
    const member = memberIdsMap.get(id);

    return {
      userId: id,
      userName: member?.name || 'Unknown',
      productivityScore: Math.max(0, Math.min(100, productivityScore)),
      completedTasks,
      overdueTasks,
      activityCount: totalTasks
    };
  });

  return { members: results };
};
