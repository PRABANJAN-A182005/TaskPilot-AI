import { Hono } from 'hono';
import * as projectController from '../controllers/projectController.ts';
import * as collaborationController from '../controllers/collaborationController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

import * as sprintController from '../controllers/sprintController.ts';
import * as meetingController from '../controllers/meetingController.ts';
import * as performanceController from '../controllers/performanceController.ts';
import * as shareController from '../controllers/shareController.ts';

const projectRoutes = new Hono();

projectRoutes.use('*', authMiddleware);

projectRoutes.get('/', projectController.getProjects);
projectRoutes.get('/:id', projectController.getProjectById);
projectRoutes.post('/', projectController.createProject);
projectRoutes.patch('/:id', projectController.updateProject);
projectRoutes.delete('/:id', projectController.deleteProject);

// Sprints
projectRoutes.get('/:id/sprints', sprintController.getSprints);
projectRoutes.post('/:id/sprints', sprintController.createSprint);
projectRoutes.get('/:id/sprints/ai-planning', sprintController.getAiSprintPlanning);
projectRoutes.patch('/:id/sprints/:sprintId', sprintController.updateSprint);
projectRoutes.delete('/:id/sprints/:sprintId', sprintController.deleteSprint);

// Performance
projectRoutes.get('/:id/performance', performanceController.getProjectPerformance);
projectRoutes.get('/:id/risks', projectController.getRisks);

// Meetings
projectRoutes.post('/:id/meetings', meetingController.processMeetingNotes);

// Sharing
projectRoutes.post('/:id/share', shareController.generateShareLink);

// Team collaboration
projectRoutes.post('/:id/team-mode', projectController.toggleTeamMode);
projectRoutes.get('/:id/members', projectController.getMembers);
projectRoutes.post('/:id/invite', projectController.inviteMember);
projectRoutes.post('/:id/join', projectController.acceptInvitation);
projectRoutes.delete('/:id/members/:userId', projectController.removeMember);
projectRoutes.patch('/:id/members/:userId', projectController.updateMemberRole);

// Daily updates
projectRoutes.post('/:id/daily-updates', collaborationController.submitDailyUpdate);
projectRoutes.get('/:id/daily-updates', collaborationController.getDailyUpdates);
projectRoutes.get('/:id/health', collaborationController.getProjectHealth);

// Chat
projectRoutes.get('/:id/messages', collaborationController.getMessages);
projectRoutes.post('/:id/messages', collaborationController.sendMessage);

export default projectRoutes;
