import { Context } from 'hono';
import * as projectService from '../services/projectService.ts';
import catchAsync from '../utils/catchAsync.ts';
import ApiError from '../utils/ApiError.ts';

export const getProjects = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const projects = await projectService.getProjects(userId);
  return c.json(projects);
});

export const getProjectById = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const project = await projectService.getProjectById(id, userId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return c.json(project);
});

export const createProject = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const project = await projectService.createProject(userId, body);
  return c.json(project, 201);
});

export const updateProject = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();
  const project = await projectService.updateProject(id, userId, body);
  return c.json(project);
});

export const deleteProject = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  await projectService.deleteProject(id, userId);
  return c.body(null, 204);
});

export const getRisks = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const forceRefresh = c.req.query('forceRefresh') === 'true';
  const data = await projectService.getRisks(projectId, forceRefresh);
  return c.json(data);
});

export const toggleTeamMode = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const { enabled } = await c.req.json();
  const project = await projectService.toggleTeamMode(id, userId, enabled);
  return c.json(project);
});

export const getMembers = catchAsync(async (c: Context) => {
  const projectId = c.req.param('id');
  const members = await projectService.getMembers(projectId);
  return c.json({ members });
});

export const inviteMember = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  const { email, role } = await c.req.json();
  const member = await projectService.inviteMember(projectId, userId, email, role);
  return c.json(member);
});

export const removeMember = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  const memberUserId = c.req.param('userId');
  await projectService.removeMember(projectId, userId, memberUserId);
  return c.body(null, 204);
});

export const updateMemberRole = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  const memberUserId = c.req.param('userId');
  const { role } = await c.req.json();
  const member = await projectService.updateMemberRole(projectId, userId, memberUserId, role);
  return c.json(member);
});

export const acceptInvitation = catchAsync(async (c: Context) => {
  const userId = c.get('userId');
  const projectId = c.req.param('id');
  const member = await projectService.acceptInvitation(projectId, userId);
  return c.json(member);
});
