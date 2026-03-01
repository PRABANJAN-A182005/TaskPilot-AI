import prisma from '../client.ts';
import { Llm, LlmProvider } from '@uptiqai/integrations-sdk';
import ApiError from '../utils/ApiError.ts';

export const getTasks = async (userId: string, projectId?: string) => {
  return prisma.task.findMany({
    where: {
      projectId,
      project: {
        OR: [
          { userId, isDeleted: false },
          { members: { some: { userId, isDeleted: false } }, isDeleted: false }
        ]
      },
      isDeleted: false,
    },
    include: {
      subtasks: {
        where: { isDeleted: false },
        orderBy: { order: 'asc' }
      },
      assignedTo: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getTaskById = async (id: string, userId: string) => {
  return prisma.task.findFirst({
    where: {
      id,
      project: {
        OR: [
          { userId, isDeleted: false },
          { members: { some: { userId, isDeleted: false } }, isDeleted: false }
        ]
      },
      isDeleted: false,
    },
    include: {
      subtasks: {
        where: { isDeleted: false },
        orderBy: { order: 'asc' }
      },
      assignedTo: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    },
  });
};

const normalizeSubtask = (s: any, index: number = 0) => {
  let title = '';
  let isCompleted = false;
  let order = index;

  if (typeof s === 'string') {
    title = s;
  } else if (typeof s === 'object' && s !== null) {
    if (typeof s.title === 'object' && s.title !== null && typeof s.title.title === 'string') {
      title = s.title.title;
      isCompleted = s.title.isCompleted ?? s.isCompleted ?? false;
    } else {
      title = typeof s.title === 'string' ? s.title : (s.title || '');
      isCompleted = !!s.isCompleted;
    }
    order = s.order !== undefined ? s.order : index;
  }

  return { title, isCompleted, order };
};

export const createTask = async (userId: string, data: any) => {
  const { projectId, title, description, deadline, priority, subtasks, strategySummary, assignedToId } = data;

  // Verify user is owner or member of project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { userId, isDeleted: false },
        { members: { some: { userId, isDeleted: false } }, isDeleted: false }
      ]
    },
    include: {
      members: { where: { isDeleted: false } }
    }
  });

  if (!project) {
    throw new ApiError(404, 'Project not found or unauthorized');
  }

  // Verify assignedToId exists and is a project member if provided
  if (assignedToId && assignedToId !== "") {
    const isMember = project.userId === assignedToId || 
                     project.members.some((m: any) => m.userId === assignedToId);
    if (!isMember) {
      throw new ApiError(400, 'Assigned user is not a member of this project');
    }
  }

  return prisma.task.create({
    data: {
      projectId,
      title,
      description,
      deadline: deadline ? new Date(deadline) : null,
      priority: priority || 'Medium',
      strategySummary,
      assignedToId: assignedToId === "" ? null : assignedToId,
      subtasks: {
        create: (subtasks || []).map((s: any, i: number) => normalizeSubtask(s, i)),
      },
    },
    include: {
      subtasks: {
        where: { isDeleted: false },
        orderBy: { order: 'asc' }
      },
      assignedTo: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    },
  });
};

export const updateTask = async (id: string, userId: string, data: any) => {
  const { subtasks, deadline, assignedToId, ...rest } = data;

  // Verify task belongs to a project where user is owner or member
  const task = await prisma.task.findFirst({
    where: {
      id,
      project: {
        OR: [
          { userId, isDeleted: false },
          { members: { some: { userId, isDeleted: false } }, isDeleted: false }
        ]
      },
      isDeleted: false,
    },
    include: {
      project: {
        include: { members: { where: { isDeleted: false } } }
      }
    }
  });

  if (!task) {
    throw new ApiError(404, 'Task not found or unauthorized');
  }

  // Verify assignedToId exists and is a project member if provided
  if (assignedToId && assignedToId !== "") {
    const isMember = task.project.userId === assignedToId || 
                     task.project.members.some((m: any) => m.userId === assignedToId);
    if (!isMember) {
      throw new ApiError(400, 'Assigned user is not a member of this project');
    }
  }

  // Handle subtasks updates if provided
  if (subtasks && Array.isArray(subtasks)) {
    for (const s of subtasks) {
        if (s.id) {
            const normalized = normalizeSubtask(s, s.order);
            await prisma.subTask.update({
                where: { id: s.id },
                data: { 
                    isCompleted: normalized.isCompleted, 
                    title: normalized.title || undefined,
                    order: normalized.order
                }
            });
        }
    }
  }

  const updateData: any = { ...rest };
  if (deadline !== undefined) {
    updateData.deadline = deadline ? new Date(deadline) : null;
  }

  if (assignedToId !== undefined) {
    updateData.assignedToId = assignedToId === "" ? null : assignedToId;
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      subtasks: {
        where: { isDeleted: false },
        orderBy: { order: 'asc' }
      },
      assignedTo: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    },
  });

  // Calculate project progress
  await updateProjectProgress(task.projectId);

  return updatedTask;
};

export const aiWorkDistribution = async (userId: string, projectId: string, title: string, description: string) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { userId, isDeleted: false },
        { members: { some: { userId, isDeleted: false } }, isDeleted: false }
      ]
    },
    include: {
      members: {
        where: { isDeleted: false },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      user: {
        select: { id: true, name: true, email: true }
      },
      tasks: {
        where: { isDeleted: false, status: { not: 'Complete' } },
        include: {
          assignedTo: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  if (!project) throw new ApiError(404, 'Project not found');

  const teamMembers = [
    { id: project.user.id, name: project.user.name, email: project.user.email },
    ...project.members.map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email }))
  ];

  const workload = teamMembers.map(member => ({
    member: member.name,
    taskCount: project.tasks.filter(t => t.assignedToId === member.id).length
  }));

  const llm = new Llm({ provider: process.env.LLM_PROVIDER as LlmProvider });
  
  const prompt = `Analyze the following task and suggest the best way to distribute the work among team members.

TASK DETAILS:
Title: "${title}"
Description: "${description || 'No description provided'}"

TEAM CONTEXT:
Available Team Members: ${JSON.stringify(teamMembers)}
Current Workload (tasks per member): ${JSON.stringify(workload)}

YOUR GOAL:
1. Suggest the most suitable member from the available list based on their workload and the task requirements.
2. Break down the task into 3-5 actionable subtasks.
3. Provide a clear strategy summary (30-50 words) on how to approach this task efficiently.
4. Suggest a realistic priority (High, Medium, or Low).
5. Suggest a deadline based on the task complexity.

RESPONSE FORMAT (JSON ONLY):
{
  "suggested_member_id": "MEMBER_ID",
  "suggested_priority": "High | Medium | Low",
  "suggested_deadline": "ISO_DATE_STRING",
  "subtasks": ["Subtask 1", "Subtask 2", "Subtask 3"],
  "strategy_summary": "Detailed strategy explanation..."
}`;

  const result = await llm.generateText({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.LLM_MODEL
  });

  try {
    const text = result.text.trim();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON object found in AI response');
    }

    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    const suggestion = JSON.parse(jsonStr);
    
    const memberId = suggestion.suggested_member_id || suggestion.suggestedMemberId || suggestion.memberId;
    const priority = suggestion.suggested_priority || suggestion.suggestedPriority || suggestion.priority;
    const deadline = suggestion.suggested_deadline || suggestion.suggestedDeadline || suggestion.deadline;
    const subtasksRaw = suggestion.subtasks || suggestion.subTasks || suggestion.tasks;

    const member = teamMembers.find(m => m.id === memberId);
    
    // Robust field extraction
    const subtasks = Array.isArray(subtasksRaw) 
      ? subtasksRaw.map((s: any) => typeof s === 'string' ? s : (s.title || String(s)))
      : [];
      
    const strategySummary = suggestion.strategy_summary || suggestion.strategySummary || suggestion.strategy || 'Focus on efficient execution and team coordination.';

    return {
      suggested_member: member ? member.name : teamMembers[0].name,
      suggested_member_id: member ? member.id : teamMembers[0].id,
      suggested_priority: priority || 'Medium',
      suggested_deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subtasks: subtasks.length > 0 ? subtasks : ['Initial research', 'Development phase', 'Testing and Review'],
      strategy_summary: strategySummary
    };
  } catch (error) {
    console.error('AI Suggestion parsing failed', error);
    return {
      suggested_member: teamMembers[0].name,
      suggested_member_id: teamMembers[0].id,
      suggested_priority: 'Medium',
      suggested_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subtasks: ['Task research', 'Implementation', 'Final verification'],
      strategy_summary: 'Manual assignment recommended. Please review the task details and assign to the best available member.'
    };
  }
};

export const deleteTask = async (id: string, userId: string) => {
  const task = await prisma.task.findFirst({
    where: {
      id,
      project: {
        OR: [
          { userId, isDeleted: false },
          { members: { some: { userId, isDeleted: false } }, isDeleted: false }
        ]
      },
      isDeleted: false,
    },
  });

  if (!task) {
    throw new ApiError(404, 'Task not found or unauthorized');
  }

  const deletedTask = await prisma.task.update({
    where: { id },
    data: { isDeleted: true },
  });

  // Also soft delete subtasks
  await prisma.subTask.updateMany({
    where: { taskId: id },
    data: { isDeleted: true }
  });

  await updateProjectProgress(task.projectId);

  return deletedTask;
};

async function updateProjectProgress(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId, isDeleted: false },
    include: {
      subtasks: {
        where: { isDeleted: false }
      }
    }
  });

  if (tasks.length === 0) {
    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 0 },
    });
    return;
  }

  let totalPoints = 0;
  let completedPoints = 0;

  for (const task of tasks) {
    if (task.subtasks.length > 0) {
      // If task has subtasks, each subtask is 1 point
      totalPoints += task.subtasks.length;
      completedPoints += task.subtasks.filter(s => s.isCompleted).length;
    } else {
      // If task has no subtasks, the task itself is 1 point
      totalPoints += 1;
      if (task.status === 'Complete') {
        completedPoints += 1;
      }
    }
  }

  const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  await prisma.project.update({
    where: { id: projectId },
    data: { progress },
  });
}