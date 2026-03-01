import prisma from '../client.ts';
import { startOfDay, subDays, format } from 'date-fns';
import { Llm, LlmProvider } from '@uptiqai/integrations-sdk';

export const getStats = async (userId: string) => {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { userId, isDeleted: false },
        { members: { some: { userId, isDeleted: false } }, isDeleted: false }
      ]
    },
    include: {
      tasks: {
        where: { isDeleted: false },
        include: {
          assignedTo: { select: { id: true, name: true } }
        }
      },
      members: {
        where: { isDeleted: false },
        include: { user: { select: { id: true, name: true } } }
      },
      user: { select: { id: true, name: true } }
    }
  });

  const totalProjects = projects.length;
  const tasks = projects.flatMap(p => p.tasks);

  const now = new Date();
  const pendingTasks = tasks.filter(t => t.status !== 'Complete').length;
  const overdueTasks = tasks.filter(t => 
    t.status !== 'Complete' && 
    t.deadline && 
    new Date(t.deadline) < now
  ).length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Complete').length;

  // Task Status Distribution
  const normalizeStatus = (s: string) => s?.trim().toLowerCase() || 'todo';
  
  const statusDistribution = {
    Complete: tasks.filter(t => normalizeStatus(t.status) === 'complete').length,
    'In-Progress': tasks.filter(t => normalizeStatus(t.status) === 'in-progress' || normalizeStatus(t.status) === 'in progress').length,
    Todo: tasks.filter(t => normalizeStatus(t.status) === 'todo').length,
  };

  // Priority Distribution
  const priorityDistribution = {
    High: tasks.filter(t => t.priority === 'High').length,
    Medium: tasks.filter(t => t.priority === 'Medium').length,
    Low: tasks.filter(t => t.priority === 'Low').length,
  };

  // Productivity Data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(startOfDay(now), i);
    return format(d, 'yyyy-MM-dd');
  }).reverse();

  const productivityData = last7Days.map(date => {
    const count = tasks.filter(t => 
      t.status === 'Complete' && 
      t.updatedAt && 
      format(new Date(t.updatedAt), 'yyyy-MM-dd') === date
    ).length;
    return {
      date: format(new Date(date), 'MMM d'),
      completed: count,
    };
  });

  // Team Stats
  const teamProjects = projects.filter(p => p.teamMode);
  let teamStats = null;

  if (teamProjects.length > 0) {
    const teamTasks = teamProjects.flatMap(p => p.tasks);
    
    // Team Productivity Score (0-100)
    const completedTeamTasks = teamTasks.filter(t => t.status === 'Complete').length;
    const productivityScore = teamTasks.length > 0 ? Math.round((completedTeamTasks / teamTasks.length) * 100) : 0;

    // Overdue tasks by member
    const membersMap = new Map();
    teamProjects.forEach(p => {
        const members = [p.user, ...p.members.map(m => m.user)];
        members.forEach(m => membersMap.set(m.id, m.name));
    });

    const overdueByMember = Array.from(membersMap.entries()).map(([id, name]) => ({
        member: name,
        count: teamTasks.filter(t => 
            t.assignedToId === id && 
            t.status !== 'Complete' && 
            t.deadline && 
            new Date(t.deadline) < now
        ).length
    })).filter(m => m.count > 0);

    // Workload indicators
    const workloadIndicators = Array.from(membersMap.entries()).map(([id, name]) => ({
        member: name,
        taskCount: teamTasks.filter(t => t.assignedToId === id && t.status !== 'Complete').length
    }));

    teamStats = {
        productivityScore,
        overdueByMember,
        workloadIndicators,
        weeklySummary: "Team activity is being monitored. AI summary will appear here."
    };
  }

  return {
    totalProjects,
    pendingTasks,
    overdueTasks,
    highPriorityTasks,
    statusDistribution,
    priorityDistribution,
    productivityData,
    teamStats
  };
};

export const getWeeklySummary = async (userId: string) => {
    const tasks = await prisma.task.findMany({
        where: {
            project: {
                OR: [
                    { userId, isDeleted: false },
                    { members: { some: { userId, isDeleted: false } }, isDeleted: false }
                ]
            },
            isDeleted: false,
            updatedAt: { gte: subDays(new Date(), 7) }
        },
        include: { project: true }
    });

    if (tasks.length === 0) return "No significant activity in the last 7 days.";

    const llm = new Llm({ provider: process.env.LLM_PROVIDER as LlmProvider });
    const prompt = `Weekly activity for team: ${JSON.stringify(tasks.map(t => ({ t: t.title, s: t.status, p: t.project.name })))}
    Summarize progress and blockers in 2-3 concise sentences.`;

    const result = await llm.generateText({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.LLM_MODEL
    });

    return result.text.trim();
};