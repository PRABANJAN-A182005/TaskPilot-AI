import { Email, EmailProvider, Llm, LlmProvider } from '@uptiqai/integrations-sdk';
import prisma from '../client.ts';
import ApiError from '../utils/ApiError.ts';

export const getProjects = async (userId: string) => {
  return prisma.project.findMany({
    where: {
      OR: [
        { userId, isDeleted: false },
        { members: { some: { userId, isDeleted: false } }, isDeleted: false }
      ]
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true }
      },
      members: {
        where: { isDeleted: false },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};


export const getProjectById = async (id: string, userId: string) => {
  return prisma.project.findFirst({
    where: {
      id,
      OR: [
        { userId, isDeleted: false },
        { members: { some: { userId, isDeleted: false } }, isDeleted: false }
      ]
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true }
      },
      members: {
        where: { isDeleted: false },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      }
    }
  });
};

export const createProject = async (userId: string, data: { name: string; description: string }) => {
  return prisma.project.create({
    data: {
      ...data,
      userId,
    },
  });
};

export const updateProject = async (id: string, userId: string, data: any) => {
  // Only owner or admin member can update
  const project = await prisma.project.findUnique({
    where: { id }
  });

  if (!project || project.isDeleted) {
    throw new ApiError(404, 'Project not found');
  }

  const isAdminMember = await prisma.projectMember.findFirst({
    where: {
      projectId: id,
      userId,
      role: 'ADMIN',
      isDeleted: false
    }
  });

  if (project.userId !== userId && !isAdminMember) {
    throw new ApiError(403, 'Unauthorized');
  }

  return prisma.project.update({
    where: { id },
    data,
  });
};

export const deleteProject = async (id: string, userId: string) => {
  // Only owner or admin member can delete
  const project = await prisma.project.findUnique({
    where: { id }
  });

  if (!project || project.isDeleted) {
    throw new ApiError(404, 'Project not found');
  }

  const isAdminMember = await prisma.projectMember.findFirst({
    where: {
      projectId: id,
      userId,
      role: 'ADMIN',
      isDeleted: false
    }
  });

  if (project.userId !== userId && !isAdminMember) {
    throw new ApiError(403, 'Unauthorized');
  }

  return prisma.project.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const toggleTeamMode = async (id: string, userId: string, enabled: boolean) => {
  const project = await prisma.project.findUnique({
    where: { id }
  });

  if (!project || project.isDeleted) {
    throw new ApiError(404, 'Project not found');
  }

  const isAdminMember = await prisma.projectMember.findFirst({
    where: {
      projectId: id,
      userId,
      role: 'ADMIN',
      isDeleted: false
    }
  });

  if (project.userId !== userId && !isAdminMember) {
    throw new ApiError(403, 'Unauthorized');
  }

  return prisma.project.update({
    where: { id },
    data: { teamMode: enabled },
  });
};

export const getMembers = async (projectId: string) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId, isDeleted: false },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    }
  });

  const formattedMembers = members.map(m => ({
    ...m,
    status: m.status || 'JOINED'
  }));

  const invitations = await prisma.projectInvitation.findMany({
    where: { projectId, isDeleted: false, status: 'PENDING' }
  });

  // Map invitations to a similar format as members
  const invitationMembers = invitations.map(inv => ({
    id: inv.id,
    projectId: inv.projectId,
    userId: null,
    role: inv.role,
    status: inv.status,
    email: inv.email,
    user: {
      id: null,
      name: inv.email.split('@')[0],
      email: inv.email,
      avatar: null
    },
    isInvitation: true
  }));

  return [...formattedMembers, ...invitationMembers];
};

export const inviteMember = async (projectId: string, userId: string, inviteEmail: string, role: string) => {
  // Verify inviter is owner or admin
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project || project.isDeleted) {
    throw new ApiError(404, 'Project not found');
  }

  const isAdminMember = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
      role: 'ADMIN',
      isDeleted: false
    }
  });

  if (project.userId !== userId && !isAdminMember) {
    throw new ApiError(403, 'Unauthorized');
  }

  const userToInvite = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: inviteEmail, mode: 'insensitive' } },
        { name: { equals: inviteEmail, mode: 'insensitive' } }
      ],
      isDeleted: false
    }
  });

  if (userToInvite) {
    return prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: userToInvite.id
        }
      },
      update: {
        role,
        status: 'PENDING',
        isDeleted: false
      },
      create: {
        projectId,
        userId: userToInvite.id,
        role,
        status: 'PENDING'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });
  } else {
    // If user not found, send invite email and create ProjectInvitation
    const invitation = await prisma.projectInvitation.upsert({
      where: {
        projectId_email: {
          projectId,
          email: inviteEmail
        }
      },
      update: {
        role,
        status: 'PENDING',
        isDeleted: false
      },
      create: {
        projectId,
        email: inviteEmail,
        role,
        status: 'PENDING'
      }
    });

    // Send invitation email
    const email = new Email({ provider: EmailProvider.Resend });
    try {
      await email.sendEmail({
        to: [inviteEmail],
        subject: `You've been invited to join ${project.name} on TaskPilot AI`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Project Invitation</h2>
            <p>Hello,</p>
            <p>You have been invited to join the project <strong>${project.name}</strong> as a <strong>${role}</strong> on TaskPilot AI.</p>
            <p>To join the project, please sign up or log in to TaskPilot AI using your email address: <strong>${inviteEmail}</strong>.</p>
            <div style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_DOMAIN}/register?email=${encodeURIComponent(inviteEmail)}" 
                 style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                 Accept Invitation
              </a>
            </div>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `
      });
    } catch (err) {
      console.error('Failed to send invitation email:', err);
      // We still return the invitation even if email fails, but maybe log it
    }

    return {
      ...invitation,
      user: {
        id: null,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        avatar: null
      },
      isInvitation: true
    };
  }
};

export const processPendingInvitations = async (userId: string, email: string) => {
  const invitations = await prisma.projectInvitation.findMany({
    where: {
      email: { equals: email, mode: 'insensitive' },
      status: 'PENDING',
      isDeleted: false
    }
  });

  for (const invitation of invitations) {
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: invitation.projectId,
        userId
      }
    });

    const status = existingMember && !existingMember.isDeleted ? existingMember.status : 'PENDING';

    await prisma.$transaction([
      prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: invitation.projectId,
            userId
          }
        },
        update: {
          role: invitation.role,
          status: status,
          isDeleted: false
        },
        create: {
          projectId: invitation.projectId,
          userId,
          role: invitation.role,
          status: 'PENDING'
        }
      }),
      prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })
    ]);
  }
};

export const acceptInvitation = async (projectId: string, userId: string) => {
  return prisma.projectMember.update({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    },
    data: {
      status: 'JOINED'
    }
  });
};

export const updateMemberRole = async (projectId: string, userId: string, memberUserId: string, role: string) => {
  // Verify requester is owner or admin
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project || project.isDeleted) {
    throw new ApiError(404, 'Project not found');
  }

  const isAdminMember = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
      role: 'ADMIN',
      isDeleted: false
    }
  });

  if (project.userId !== userId && !isAdminMember) {
    throw new ApiError(403, 'Unauthorized');
  }

  return prisma.projectMember.update({
    where: {
      projectId_userId: {
        projectId,
        userId: memberUserId
      }
    },
    data: { role },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    }
  });
};

export const removeMember = async (projectId: string, userId: string, memberIdOrUserId: string) => {
  // Verify requester is owner or admin or removing themselves
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project || project.isDeleted) {
    throw new ApiError(404, 'Project not found');
  }

  const isAdminMember = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
      role: 'ADMIN',
      isDeleted: false
    }
  });

  if (project.userId !== userId && !isAdminMember && userId !== memberIdOrUserId) {
    // Check if memberIdOrUserId is actually the member's ID or userId
    const memberToRemove = await prisma.projectMember.findFirst({
      where: {
        OR: [
          { projectId, userId: memberIdOrUserId },
          { id: memberIdOrUserId, projectId }
        ]
      }
    });

    if (!memberToRemove || memberToRemove.userId !== userId) {
      throw new ApiError(403, 'Unauthorized');
    }
  }

  // Try to find as ProjectMember first
  const member = await prisma.projectMember.findFirst({
    where: {
      OR: [
        { projectId, userId: memberIdOrUserId },
        { id: memberIdOrUserId, projectId }
      ]
    }
  });

  if (member) {
    return prisma.projectMember.update({
      where: { id: member.id },
      data: { isDeleted: true }
    });
  }

  // If not found, try to find as ProjectInvitation
  const invitation = await prisma.projectInvitation.findFirst({
    where: { id: memberIdOrUserId, projectId }
  });

  if (invitation) {
    return prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { isDeleted: true }
    });
  }

    throw new ApiError(404, 'Member or invitation not found');

  };

  

  export const getRisks = async (projectId: string, forceRefresh = false) => {

    const project = await prisma.project.findUnique({

      where: { id: projectId },

      select: { id: true, name: true, riskMonitoringAi: true }

    });

  

    if (!project) throw new ApiError(404, 'Project not found');

  

    if (!forceRefresh && project.riskMonitoringAi) {

      return project.riskMonitoringAi;

    }

  

    const tasks = await prisma.task.findMany({ 

      where: { projectId, isDeleted: false },

      select: { title: true, status: true, deadline: true, priority: true }

    });

  

    if (tasks.length === 0) {

      return { risks: [] };

    }

  

        const llm = new Llm({ provider: process.env.LLM_PROVIDER as LlmProvider });

  

        

  

        const prompt = `Tasks for "${project.name}":

  

        ${JSON.stringify(tasks.map(t => ({ 

  

          t: t.title, 

  

          s: t.status, 

  

          d: t.deadline ? t.deadline.toISOString().split('T')[0] : 'None',

  

          p: t.priority

  

        })))}

  

        

  

        Detect top 3 execution risks.

  

        Respond ONLY with JSON: 

  

        { "risks": [ { "level": "Low"|"Medium"|"High", "type": "string", "description": "string", "suggestions": ["string"] } ] }`;

  

    

  

        const result = await llm.generateText({

  

          messages: [{ role: 'user', content: prompt }],

  

          model: process.env.LLM_MODEL

  

        });

  

    try {

      const text = result.text.replace(/```json|```/g, '').trim();

      const data = JSON.parse(text);

      

      // Persist the AI data

      await prisma.project.update({

        where: { id: projectId },

        data: { riskMonitoringAi: data }

      });

  

      return data;

    } catch (error) {

      console.error('LLM Risk Parsing Error:', error);

      return { 

        risks: [

          { 

            level: 'Medium', 

            type: 'Analysis Error', 

            description: 'AI was unable to generate a risk report. Please review tasks manually.', 

            suggestions: ['Check task deadlines', 'Verify member workloads'] 

          }

        ] 

      };

    }

  };

  