# TaskPilot AI API Specification

## Authentication
All endpoints except login/register and public shared links require a valid JWT token in the Authorization header.
`Authorization: Bearer <accessToken>`

### Auth Routes
- `POST /auth/register`: Create a new user account
  - Body: `{ name, email, password }`
  - Response: `{ user: { id, name, email }, accessToken, refreshToken }`
- `POST /auth/login`: Authenticate an existing user
  - Body: `{ email, password }`
  - Response: `{ user: { id, name, email }, accessToken, refreshToken }`
- `POST /auth/refresh`: Refresh expired access token
  - Body: `{ refreshToken }`
  - Response: `{ accessToken }`

### Project Routes
- `GET /projects`: Get all projects for current user
  - Response: `Project[]`
- `GET /projects/:id`: Get a specific project
  - Response: `Project`
- `POST /projects`: Create a new project
  - Body: `{ name, description }`
  - Response: `Project`
- `PATCH /projects/:id`: Update an existing project
  - Body: `Partial<Project>`
  - Response: `Project`
- `DELETE /projects/:id`: Soft delete a project
  - Response: `204 No Content`
- `POST /projects/:id/team-mode`: Toggle team mode
  - Body: `{ enabled: boolean }`
  - Response: `Project`
- `GET /projects/:id/members`: Get project members
  - Response: `{ members: ProjectMember[] }`
- `POST /projects/:id/invite`: Invite a member via email
  - Body: `{ email: string, role: 'ADMIN' | 'MEMBER' }`
  - Response: `ProjectMember`
- `POST /projects/:id/join`: Join a project after being invited
  - Response: `ProjectMember`
- `DELETE /projects/:id/members/:userId`: Remove a member
  - Response: `204 No Content`
- `PATCH /projects/:id/members/:userId`: Update a member's role
  - Body: `{ role: 'ADMIN' | 'MEMBER' }`
  - Response: `ProjectMember`
- `POST /projects/:id/share`: Generate a secure read-only link
  - Response: `{ shareUrl: string, token: string }`

### Public Share Routes
- `GET /share/:token`: View project progress as client (Public)
  - Response: `Project & { tasks: Task[] }`

### Sprint Planning Routes
- `GET /projects/:id/sprints`: Get all sprints for a project
- `POST /projects/:id/sprints`: Create a new sprint
  - Body: `{ name, startDate, endDate, goal }`
- `GET /projects/:id/sprints/ai-planning`: Get AI sprint planning suggestions (Supports `?forceRefresh=true`)
  - Response: `{ suggestedDuration, recommendedDeadlines, dependencyMap, completionProbability, timeline: any[] }`
- `PATCH /projects/:id/sprints/:sprintId`: Update a sprint
- `DELETE /projects/:id/sprints/:sprintId`: Soft delete a sprint

### Performance Routes
- `GET /performance/me`: Get current user's performance stats
- `GET /projects/:id/performance`: Get performance stats for all project members
- `GET /performance/ai-insights`: Get AI-generated improvement suggestions (Supports `?forceRefresh=true`)

### Task Routes
- `GET /tasks`: Get all tasks for current user (optional `projectId` query param)
  - Query: `?projectId=<id>&sprintId=<id>`
  - Response: `Task[]`
- `GET /tasks/:id`: Get a specific task
  - Response: `Task`
- `POST /tasks`: Create a new task
  - Body: `{ projectId, sprintId?, title, description, deadline, priority, subtasks: string[], strategySummary, assignedToId?: string }`
  - Response: `Task`
- `PATCH /tasks/:id`: Update an existing task
  - Body: `Partial<Task>`
  - Response: `Task`
- `DELETE /tasks/:id`: Soft delete a task
  - Response: `204 No Content`
- `POST /tasks/ai-assign`: Get AI suggestion for task assignment
  - Body: `{ projectId, title, description, deadline }`
  - Response: `{ suggested_member: string, suggested_priority: string, suggested_deadline: string, subtasks: string[] }`

### Meeting Assistant Routes
- `POST /projects/:id/meetings`: Upload meeting notes and get AI extraction
  - Body: `{ notes: string }`
  - Response: `{ summary, actionItems: { title, assigneeEmail? }[] }`

### Notification Routes
- `GET /notifications`: Get user notifications
- `POST /notifications/:id/read`: Mark notification as read
- `GET /notifications/unread-count`: Get unread count

### Risk Monitoring Routes
- `GET /projects/:id/risks`: Get AI risk analysis (Supports `?forceRefresh=true`)
  - Response: `{ risks: { level: 'Low' | 'Medium' | 'High', type: string, description: string, suggestions: string[] }[] }`

### Attachment Routes
- `POST /tasks/:id/attachments`: Upload a file to a task
  - Body: `FormData` (file)
- `GET /tasks/:id/attachments`: Get all attachments for a task
- `POST /attachments/:id/ai-summary`: Get AI summary for an attachment

### Executive Analytics Routes
- `GET /analytics/executive`: Get cross-project performance and resource utilization

### Voice Command Routes
- `POST /voice/command`: Process voice command text
  - Body: `{ command: string }`
  - Response: `{ action: string, data: any, message: string }`

### Daily Progress Routes
- `POST /projects/:id/daily-updates`: Submit daily update
  - Body: `{ summary: string, blockers: string, suggestions: string }`
  - Response: `DailyUpdate`
- `GET /projects/:id/daily-updates`: Get daily updates for a project
  - Response: `DailyUpdate[]`
- `GET /projects/:id/health`: Get AI project health insights
  - Response: `{ team_health_status: string, risks_detected: string[], improvement_suggestions: string[] }`

### Chat Routes
- `GET /projects/:id/messages`: Get chat messages
  - Response: `ChatMessage[]`
- `POST /projects/:id/messages`: Send a chat message
  - Body: `{ content: string, receiverId?: string }`
  - Response: `ChatMessage`

### Dashboard Routes
- `GET /dashboard/stats`: Get summary statistics for the dashboard
- **Response**: `{ totalProjects, pendingTasks, overdueTasks, highPriorityTasks, statusDistribution, priorityDistribution, productivityData, teamStats?: { productivityScore, overdueByMember, workloadIndicators, weeklySummary } }`

## Agent Integration
The application integrates with TaskPilot AI Assistant via the Mattr Agent SDK.

### Agent ID: `6a7f791a-7a16-4981-aa59-67444db75f26`

### Trigger Events:
- `task_description_input` (sync): Analyzes task title and description to generate actionable subtasks and strategy.
  - Payload: `{ description, title }`
  - Output: `{ subtasks: string[], suggested_priority: 'High' | 'Medium' | 'Low', strategy_summary: string }`
- `project_milestone_check` (async): Triggered when a project reaches progress milestones (25%, 50%, 75%, 100%).
  - Payload: `{ projectId, progress }`
- `deadline_proximity_alert` (async): Triggered when a non-completed task is within 24 hours of its deadline.
  - Payload: `{ taskId, title, deadline }`
- `ai_work_distribution` (sync): Analyzes team workload and task details to suggest assignment.
  - Payload: `{ projectId, title, description, teamMembers: any[] }`
  - Output: `{ suggested_member: string, suggested_priority: string, suggested_deadline: string, subtasks: string[] }`
- `project_health_analysis` (sync): Generates health insights based on daily updates and task progress.
  - Payload: `{ dailyUpdates: any[], taskStats: any[] }`
  - Output: `{ team_health_status: string, risks_detected: string[], improvement_suggestions: string[] }`
- `ai_sprint_planning` (sync): Suggests sprint structure and task dependencies.
  - Payload: `{ projectId, backlogTasks: any[] }`
  - Output: `{ suggestedDuration: number, completionProbability: number, timeline: any[] }`
- `ai_risk_detection` (sync): Detects workflow bottlenecks and overloaded members.
  - Payload: `{ projectId, tasks: any[], teamPerformance: any[] }`
  - Output: `{ risks: any[] }`
- `voice_command_nlp` (sync): Parses voice input into structured data.
  - Payload: `{ voiceText: string }`
  - Output: `{ action: string, data: any }`

## Data Models

### Project
```typescript
{
  id: string;
  name: string;
  description: string;
  createdAt: string;
  progress: number;
  isArchived: boolean;
  teamMode: boolean;
}
```

### Sprint
```typescript
{
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  goal?: string;
  status: 'Planned' | 'Active' | 'Completed';
  createdAt: string;
}
```

### Notification
```typescript
{
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
```

### Attachment
```typescript
{
  id: string;
  taskId: string;
  name: string;
  url: string;
  fileType: string;
  size: number;
  createdAt: string;
}
```