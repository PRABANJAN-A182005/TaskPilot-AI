import { Project, Task, User } from '../types';

export const MOCK_USER: User = {
    id: '1',
    email: 'demo@taskpilot.ai',
    name: 'Demo User'
};

export const MOCK_PROJECTS: Project[] = [
    {
        id: 'p1',
        name: 'Website Redesign',
        description: 'Modernizing the landing page with Tailwind v4.',
        createdAt: new Date().toISOString(),
        progress: 45,
        userId: '1',
        isArchived: false,
        teamMode: true
    },
    {
        id: 'p2',
        name: 'Mobile App Launch',
        description: 'Preparing the app store assets and final testing.',
        createdAt: new Date().toISOString(),
        progress: 80,
        userId: '1',
        isArchived: false,
        teamMode: false
    }
];

export const MOCK_TASKS: Task[] = [
    {
        id: 't1',
        projectId: 'p1',
        title: 'Design Hero Section',
        description: 'Create a high-impact hero section with clear CTA.',
        deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        priority: 'High',
        status: 'In-Progress',
        subtasks: [
            { id: 's1', title: 'Draft copy', isCompleted: true, order: 0 },
            { id: 's2', title: 'Choose colors', isCompleted: false, order: 1 }
        ],
        strategySummary: 'Focus on visual hierarchy and speed.'
    },
    {
        id: 't2',
        projectId: 'p1',
        title: 'API Integration',
        description: 'Connect the frontend forms to the backend endpoints.',
        deadline: new Date(Date.now() - 86400000).toISOString(), // Yesterday (Overdue)
        priority: 'Medium',
        status: 'Todo',
        subtasks: [],
        strategySummary: 'Use axios interceptors for auth.'
    }
];
