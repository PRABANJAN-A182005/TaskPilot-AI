export type Priority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Todo' | 'In-Progress' | 'Review' | 'Complete' | 'Backlog';

export interface User {
    id: string;
    email: string;
    name: string;
    bio?: string;
    avatar?: string;
    avatarKey?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    progress: number;
    userId: string;
    isArchived: boolean;
    teamMode: boolean;
    user?: User;
    members?: ProjectMember[];
}

export interface ProjectMember {
    id: string;
    userId: string | null;
    projectId: string;
    role: 'ADMIN' | 'MEMBER';
    status: 'JOINED' | 'PENDING';
    email?: string;
    isInvitation?: boolean;
    user: User;
}

export interface Sprint {
    id: string;
    projectId: string;
    name: string;
    startDate: string;
    endDate: string;
    goal?: string;
    status: 'Planned' | 'Active' | 'Completed';
    createdAt: string;
}

export interface Task {
    id: string;
    projectId: string;
    sprintId?: string;
    title: string;
    description: string;
    deadline: string | null;
    priority: Priority;
    status: TaskStatus;
    subtasks: SubTask[];
    strategySummary: string;
    assignedToId?: string;
    assignedTo?: User;
    attachments?: Attachment[];
    createdAt?: string;
    updatedAt?: string;
}

export interface SubTask {
    id: string;
    title: string;
    isCompleted: boolean;
    order: number;
}

export interface DailyUpdate {
    id: string;
    userId: string;
    projectId: string;
    summary: string;
    blockers: string;
    suggestions: string;
    createdAt: string;
    user: User;
}

export interface ChatMessage {
    id: string;
    userId: string;
    projectId: string;
    content: string;
    receiverId?: string;
    createdAt: string;
    user: User;
}

export interface ProjectHealth {
    team_health_status: string;
    risks_detected: string[];
    improvement_suggestions: string[];
}

export interface AISuggestion {
    suggested_member: string;
    suggested_member_id: string;
    suggested_priority: Priority;
    suggested_deadline: string;
    subtasks: string[];
    strategy_summary: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    content: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export interface Attachment {
    id: string;
    taskId: string;
    name: string;
    url: string;
    fileType: string;
    size: number;
    createdAt: string;
}

export interface DashboardStats {
    totalProjects: number;
    pendingTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    statusDistribution: {
        'Complete': number;
        'In-Progress': number;
        'Review'?: number;
        'Backlog'?: number;
        'Todo': number;
    };
    priorityDistribution: {
        High: number;
        Medium: number;
        Low: number;
    };
    productivityData: {
        date: string;
        completed: number;
    }[];
    teamStats?: {
        productivityScore: number;
        overdueByMember: { member: string; count: number }[];
        workloadIndicators: { member: string; taskCount: number }[];
        weeklySummary: string;
    };
}
