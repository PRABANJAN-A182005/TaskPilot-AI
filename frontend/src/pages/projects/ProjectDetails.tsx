import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';
import { authService } from '../../services/auth.service';
import {
    Project,
    Task,
    Priority,
    TaskStatus,
    ProjectMember,
    DailyUpdate,
    ChatMessage,
    ProjectHealth,
    User
} from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Input } from '../../components/ui/Input';
import { NotificationCenter } from '../../components/layout/NotificationCenter';
import { VoiceCommand } from '../../components/ui/VoiceCommand';
import { KanbanBoard } from '../../components/projects/KanbanBoard';
import { SprintPlanning } from '../../components/projects/SprintPlanning';
import { RiskPanel } from '../../components/projects/RiskPanel';
import { PerformanceCharts } from '../../components/performance/PerformanceCharts';
import { MeetingAssistant } from '../../components/projects/MeetingAssistant';
import { TaskAttachments } from '../../components/projects/TaskAttachments';
import { shareService } from '../../services/share.service';
import { format, isBefore, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { emitter } from '../../agentSdk';
import {
    Plus,
    Search,
    Filter,
    Calendar,
    Flag,
    CheckCircle2,
    Circle,
    Trash2,
    Sparkles,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Users,
    MessageSquare,
    Activity,
    Send,
    UserPlus,
    Shield,
    AlertTriangle,
    Lightbulb,
    Heart,
    GripVertical,
    LayoutGrid,
    TrendingUp,
    Share2,
    ShieldCheck,
    Zap
} from 'lucide-react';

type TabType = 'tasks' | 'kanban' | 'sprints' | 'performance' | 'risks' | 'updates' | 'chat' | 'team';

export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [expandedTask, setExpandedTask] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('tasks');
    const [isExecutiveMode, setIsExecutiveMode] = useState(false);

    // Team Collaboration State
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
    const [isInviting, setIsInviting] = useState(false);

    // Daily Updates State
    const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);
    const [newUpdate, setNewUpdate] = useState({ summary: '', blockers: '', suggestions: '' });
    const [projectHealth, setProjectHealth] = useState<ProjectHealth | null>(null);
    const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
    const [isLoadingHealth, setIsLoadingHealth] = useState(false);

    // Task Search and Filter State
    const [taskSearchQuery, setTaskSearchQuery] = useState('');
    const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');
    const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // New Task Form State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        deadline: format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'),
        priority: 'Medium' as Priority,
        assignedToId: '',
        subtasks: [] as string[],
        strategySummary: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAiAssigning, setIsAiAssigning] = useState(false);

    useEffect(() => {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
        if (id) {
            loadProjectData(id);
            loadCollaborationData(id);
        }
    }, [id]);

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom();
        }
    }, [messages, activeTab]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadProjectData = async (projectId: string) => {
        try {
            const [p, t] = await Promise.all([
                projectService.getProjectById(projectId),
                taskService.getTasks(projectId)
            ]);
            if (!p) {
                navigate('/projects');
                return;
            }
            setProject(p);
            setTasks(t);
        } catch (error) {
            console.error('Error loading project details', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCollaborationData = async (projectId: string) => {
        try {
            const [m, u, msg] = await Promise.all([
                projectService.getMembers(projectId),
                projectService.getDailyUpdates(projectId),
                projectService.getMessages(projectId)
            ]);
            setMembers(m.members);
            setDailyUpdates(u);
            setMessages(msg);
        } catch (error) {
            console.error('Error loading collaboration data', error);
        }
    };

    const fetchHealth = async () => {
        if (!id) return;
        setIsLoadingHealth(true);
        try {
            const health = await projectService.getProjectHealth(id);
            setProjectHealth(health);
        } catch (error) {
            console.error('Error fetching health', error);
        } finally {
            setIsLoadingHealth(false);
        }
    };

    const handleToggleTeamMode = async () => {
        if (!project) return;
        try {
            const updated = await projectService.toggleTeamMode(project.id, !project.teamMode);
            setProject(updated);
        } catch (error) {
            console.error('Failed to toggle team mode', error);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !inviteEmail) return;
        setIsInviting(true);
        try {
            const member = await projectService.inviteMember(project.id, { email: inviteEmail, role: inviteRole });
            setMembers([...members, member]);
            setInviteEmail('');
        } catch (error) {
            console.error('Failed to invite member', error);
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!project) return;
        try {
            await projectService.removeMember(project.id, memberId);
            setMembers(members.filter(m => (m.userId || m.id) !== memberId));
        } catch (error) {
            console.error('Failed to remove member', error);
        }
    };

    const handleToggleRole = async (member: ProjectMember) => {
        if (!project || !member.userId) return;
        const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
        try {
            const updated = await projectService.updateMemberRole(project.id, member.userId, newRole);
            setMembers(members.map(m => (m.id === member.id ? updated : m)));
        } catch (error) {
            console.error('Failed to update member role', error);
        }
    };

    const handleJoinProject = async () => {
        if (!project) return;
        try {
            await projectService.joinProject(project.id);
            const m = await projectService.getMembers(project.id);
            setMembers(m.members);
        } catch (error) {
            console.error('Failed to join project', error);
        }
    };

    const handleSubmitUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !newUpdate.summary) return;
        setIsSubmittingUpdate(true);
        try {
            const update = await projectService.submitDailyUpdate(project.id, newUpdate);
            setDailyUpdates([update, ...dailyUpdates]);
            setNewUpdate({ summary: '', blockers: '', suggestions: '' });
            fetchHealth();
        } catch (error) {
            console.error('Failed to submit update', error);
        } finally {
            setIsSubmittingUpdate(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !newMessage) return;
        try {
            const msg = await projectService.sendMessage(project.id, { content: newMessage });
            setMessages([...messages, msg]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const handleAiAssign = async () => {
        if (!project || !newTask.title) return;
        setIsAiAssigning(true);
        try {
            // If team mode is disabled, we only need breakdown (subtasks, priority, strategy)
            // We use the agent as mandated for synchronous sync events.
            if (!project.teamMode) {
                const res = await emitter.emit({
                    agentId: '6a7f791a-7a16-4981-aa59-67444db75f26',
                    event: 'task_description_input',
                    payload: { title: newTask.title, description: newTask.description },
                    uid: currentUser?.id || crypto.randomUUID()
                });

                if (res) {
                    setNewTask({
                        ...newTask,
                        priority: (res.suggested_priority as Priority) || 'Medium',
                        subtasks: res.subtasks || [],
                        strategySummary: res.strategy_summary || ''
                    });
                    return;
                }
            }

            // If team mode is enabled or agent failed, call backend for full distribution and assignment
            const suggestion = await taskService.getAIWorkDistribution({
                projectId: project.id,
                title: newTask.title,
                description: newTask.description
            });

            setNewTask({
                ...newTask,
                assignedToId: suggestion.suggested_member_id || '',
                priority: (suggestion.suggested_priority as Priority) || newTask.priority,
                deadline:
                    suggestion.suggested_deadline && suggestion.suggested_deadline.includes('T')
                        ? suggestion.suggested_deadline.split('T')[0]
                        : newTask.deadline,
                subtasks:
                    suggestion.subtasks && suggestion.subtasks.length > 0 ? suggestion.subtasks : newTask.subtasks,
                strategySummary: suggestion.strategy_summary || newTask.strategySummary
            });
        } catch (error) {
            console.error('AI assignment failed', error);
        } finally {
            setIsAiAssigning(false);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !newTask.title) return;

        setIsGenerating(true);
        try {
            const createdTask = await taskService.createTask({
                ...newTask,
                projectId: project.id,
                status: 'Todo',
                deadline: newTask.deadline ? new Date(newTask.deadline).toISOString() : null
            });
            setTasks([createdTask, ...tasks]);
            setIsAddingTask(false);
            setNewTask({
                title: '',
                description: '',
                deadline: format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'),
                priority: 'Medium',
                assignedToId: '',
                subtasks: [],
                strategySummary: ''
            });
            setExpandedTask(createdTask.id);
        } catch (error) {
            console.error('Failed to create task', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(taskSearchQuery.toLowerCase());
        const matchesPriority = taskPriorityFilter === 'all' || task.priority === taskPriorityFilter;
        const matchesStatus = taskStatusFilter === 'all' || task.status === taskStatusFilter;
        return matchesSearch && matchesPriority && matchesStatus;
    });

    const toggleTaskStatus = async (task: Task) => {
        try {
            const newStatus: TaskStatus = task.status === 'Complete' ? 'Todo' : 'Complete';

            const updates: any = { status: newStatus };
            if (task.subtasks && task.subtasks.length > 0) {
                updates.subtasks = task.subtasks.map(s => ({ ...s, isCompleted: newStatus === 'Complete' }));
            }

            const updated = await taskService.updateTask(task.id, updates);
            const newTasks = tasks.map(t => (t.id === task.id ? updated : t));
            setTasks(newTasks);

            if (project) {
                let totalPoints = 0;
                let completedPoints = 0;
                newTasks.forEach(t => {
                    if (t.subtasks && t.subtasks.length > 0) {
                        totalPoints += t.subtasks.length;
                        completedPoints += t.subtasks.filter(s => s.isCompleted).length;
                    } else {
                        totalPoints += 1;
                        if (t.status === 'Complete') completedPoints += 1;
                    }
                });
                const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
                setProject({ ...project, progress });
            }
        } catch (error) {
            console.error('Failed to toggle task status', error);
        }
    };

    const toggleSubtask = async (taskId: string, subtaskId: string, currentCompleted: boolean) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const updatedSubtasks = task.subtasks.map(s =>
                s.id === subtaskId ? { ...s, isCompleted: !currentCompleted } : s
            );

            const allCompleted = updatedSubtasks.every(s => s.isCompleted);
            const someCompleted = updatedSubtasks.some(s => s.isCompleted);
            const newStatus: TaskStatus = allCompleted ? 'Complete' : someCompleted ? 'In-Progress' : 'Todo';

            const updatedTask = await taskService.updateTask(taskId, {
                subtasks: updatedSubtasks,
                status: newStatus
            });
            const newTasks = tasks.map(t => (t.id === taskId ? updatedTask : t));
            setTasks(newTasks);

            if (project) {
                let totalPoints = 0;
                let completedPoints = 0;
                newTasks.forEach(t => {
                    if (t.subtasks && t.subtasks.length > 0) {
                        totalPoints += t.subtasks.length;
                        completedPoints += t.subtasks.filter(s => s.isCompleted).length;
                    } else {
                        totalPoints += 1;
                        if (t.status === 'Complete') completedPoints += 1;
                    }
                });
                const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
                setProject({ ...project, progress });
            }
        } catch (error) {
            console.error('Failed to toggle subtask status', error);
        }
    };

    const onSubtaskDragStart = (e: React.DragEvent, taskId: string, subtaskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.setData('subtaskId', subtaskId);
    };

    const onSubtaskDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onSubtaskDrop = async (e: React.DragEvent, taskId: string, targetSubtaskId: string) => {
        const sourceTaskId = e.dataTransfer.getData('taskId');
        const sourceSubtaskId = e.dataTransfer.getData('subtaskId');

        if (sourceTaskId !== taskId) return;
        if (sourceSubtaskId === targetSubtaskId) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = [...task.subtasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const sourceIndex = updatedSubtasks.findIndex(s => s.id === sourceSubtaskId);
        const targetIndex = updatedSubtasks.findIndex(s => s.id === targetSubtaskId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        const [movedSubtask] = updatedSubtasks.splice(sourceIndex, 1);
        updatedSubtasks.splice(targetIndex, 0, movedSubtask);

        const finalSubtasks = updatedSubtasks.map((s, index) => ({
            ...s,
            order: index
        }));

        try {
            const updatedTask = await taskService.updateTask(taskId, {
                subtasks: finalSubtasks
            });
            setTasks(tasks.map(t => (t.id === taskId ? updatedTask : t)));
        } catch (error) {
            console.error('Failed to reorder subtasks', error);
        }
    };

    const handleUpdateAssignment = async (taskId: string, userId: string) => {
        try {
            const updated = await taskService.updateTask(taskId, { assignedToId: userId });
            setTasks(tasks.map(t => (t.id === taskId ? updated : t)));
        } catch (error) {
            console.error('Failed to update assignment', error);
        }
    };

    const handleLeaveProject = async () => {
        if (!project || !currentUser) return;
        if (confirm('Are you sure you want to leave this project?')) {
            try {
                await projectService.removeMember(project.id, currentUser.id);
                navigate('/projects');
            } catch (error) {
                console.error('Failed to leave project', error);
            }
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await projectService.deleteProject(project.id);
                navigate('/projects');
            } catch (error) {
                console.error('Failed to delete project', error);
            }
        }
    };

    const handleShare = async () => {
        if (!project) return;
        try {
            const result = await shareService.generateShareLink(project.id);
            alert(`Shared link generated: ${window.location.origin}${result.shareUrl}`);
        } catch (error) {
            console.error('Failed to generate share link', error);
        }
    };

    const onTaskMove = async (taskId: string, newStatus: TaskStatus) => {
        try {
            const updated = await taskService.updateTask(taskId, { status: newStatus });
            setTasks(tasks.map(t => (t.id === taskId ? updated : t)));
        } catch (error) {
            console.error('Failed to move task', error);
        }
    };

    if (isLoading || !project)
        return (
            <div className='animate-pulse flex items-center justify-center min-h-[400px]'>
                Loading project details...
            </div>
        );

    const isOwner = currentUser?.id === project.userId;
    const isPending = members.some(m => m.userId === currentUser?.id && m.status === 'PENDING');
    const isAdmin =
        isOwner || members.some(m => m.userId === currentUser?.id && m.role === 'ADMIN' && m.status === 'JOINED');
    const allAvailableMembers = [
        { id: project.userId, name: 'Lead: ' + (project.user?.name || 'Owner'), avatar: project.user?.avatar },
        ...members
            .filter(m => m.status === 'JOINED')
            .map(m => ({ id: m.userId || '', name: m.user?.name || 'Unknown', avatar: m.user?.avatar }))
    ];

    return (
        <div className='space-y-6'>
            <VoiceCommand />
            {isPending && (
                <Card className='bg-indigo-600 text-white border-none shadow-lg animate-in slide-in-from-top-4'>
                    <CardContent className='p-4 flex flex-col sm:flex-row items-center justify-between gap-4'>
                        <div className='flex items-center gap-3'>
                            <div className='p-2 bg-indigo-500 rounded-lg'>
                                <Users className='h-6 w-6' />
                            </div>
                            <div>
                                <h3 className='font-bold text-lg'>Project Invitation</h3>
                                <p className='text-indigo-100 text-sm'>
                                    You've been invited to collaborate on <strong>{project.name}</strong>.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleJoinProject}
                            className='bg-white text-indigo-600 hover:bg-indigo-50 border-none font-bold w-full sm:w-auto'
                        >
                            Join Project
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <div className='flex items-center gap-2 text-sm font-medium text-slate-500 mb-2'>
                        <span
                            onClick={() => navigate('/projects')}
                            className='hover:text-blue-600 cursor-pointer'
                        >
                            Projects
                        </span>
                        <ChevronRight className='h-4 w-4' />
                        <span className='text-slate-900'>{project.name}</span>
                    </div>
                    <div className='flex items-center gap-3'>
                        <h1 className='text-2xl font-bold text-slate-900 sm:text-3xl'>{project.name}</h1>
                        {project.teamMode && (
                            <Badge
                                variant='default'
                                className='bg-indigo-100 text-indigo-700 border-indigo-200'
                            >
                                <Users className='h-3 w-3 mr-1' /> Team Mode
                            </Badge>
                        )}
                        {isExecutiveMode && (
                            <Badge
                                variant='default'
                                className='bg-amber-100 text-amber-700 border-amber-200'
                            >
                                <Zap className='h-3 w-3 mr-1' /> Executive View
                            </Badge>
                        )}
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    <NotificationCenter />
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleShare}
                        className='text-slate-500'
                    >
                        <Share2 className='w-4 h-4 mr-1' /> Share
                    </Button>
                    <div className='h-8 w-[1px] bg-slate-200 mx-2'></div>
                    {activeTab === 'tasks' && isAdmin && (
                        <Button
                            onClick={() => setIsAddingTask(true)}
                            disabled={isAddingTask}
                        >
                            <Plus className='mr-2 h-4 w-4' /> Add Task
                        </Button>
                    )}
                    <Button
                        variant={isExecutiveMode ? 'primary' : 'outline'}
                        size='sm'
                        onClick={() => setIsExecutiveMode(!isExecutiveMode)}
                        className={isExecutiveMode ? 'bg-amber-600 hover:bg-amber-700 border-none' : ''}
                    >
                        {isExecutiveMode ? 'Standard View' : 'Executive View'}
                    </Button>
                </div>
            </div>

            <div className='flex border-b border-slate-200 overflow-x-auto no-scrollbar'>
                {[
                    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
                    { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
                    { id: 'sprints', label: 'Sprints', icon: Calendar },
                    { id: 'performance', label: 'Performance', icon: TrendingUp },
                    { id: 'risks', label: 'Risks', icon: ShieldCheck },
                    ...(project.teamMode
                        ? [
                              { id: 'updates', label: 'Daily Updates', icon: Activity },
                              { id: 'chat', label: 'Team Chat', icon: MessageSquare }
                          ]
                        : []),
                    { id: 'team', label: project.teamMode ? 'Team' : 'Project Info', icon: Users }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={clsx(
                            'px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2',
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        )}
                    >
                        <tab.icon className='h-4 w-4' />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'tasks' && (
                <div className='space-y-6'>
                    <Card>
                        <CardContent className='p-6'>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                                <div className='md:col-span-2 space-y-4'>
                                    <h3 className='font-semibold text-slate-900'>Description</h3>
                                    <p className='text-slate-600 text-sm leading-relaxed'>{project.description}</p>
                                </div>
                                <div className='space-y-4'>
                                    <div className='flex justify-between items-center text-sm'>
                                        <span className='font-semibold text-slate-900'>Overall Progress</span>
                                        <span className='font-bold text-blue-600'>{project.progress}%</span>
                                    </div>
                                    <ProgressBar
                                        value={project.progress}
                                        showLabel={false}
                                        className='h-3'
                                    />
                                    <div className='flex items-center gap-2 pt-2 text-xs text-slate-500'>
                                        <Calendar className='h-3.5 w-3.5' />
                                        Created {format(new Date(project.createdAt), 'MMMM d, yyyy')}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className='space-y-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                            <h2 className='text-xl font-bold text-slate-900 flex items-center gap-2'>
                                Tasks
                                <span className='text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full'>
                                    {filteredTasks.length}
                                </span>
                            </h2>
                            <div className='flex flex-col sm:flex-row gap-2'>
                                <div className='relative flex-1 sm:flex-initial'>
                                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                                    <input
                                        type='text'
                                        placeholder='Search tasks...'
                                        value={taskSearchQuery}
                                        onChange={e => setTaskSearchQuery(e.target.value)}
                                        className='pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48'
                                    />
                                </div>
                                <div className='flex items-center gap-2'>
                                    <select
                                        value={taskPriorityFilter}
                                        onChange={e => setTaskPriorityFilter(e.target.value)}
                                        className='h-9 px-2 text-sm bg-white border border-slate-200 rounded-lg outline-none'
                                    >
                                        <option value='all'>All Priority</option>
                                        <option value='High'>High</option>
                                        <option value='Medium'>Medium</option>
                                        <option value='Low'>Low</option>
                                    </select>
                                    <select
                                        value={taskStatusFilter}
                                        onChange={e => setTaskStatusFilter(e.target.value)}
                                        className='h-9 px-2 text-sm bg-white border border-slate-200 rounded-lg outline-none'
                                    >
                                        <option value='all'>All Status</option>
                                        <option value='Todo'>Todo</option>
                                        <option value='In-Progress'>In Progress</option>
                                        <option value='Complete'>Complete</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {isAddingTask && (
                            <Card className='border-blue-200 shadow-md animate-in fade-in slide-in-from-top-4'>
                                <form
                                    onSubmit={handleCreateTask}
                                    className='p-6 space-y-4'
                                >
                                    <div className='flex items-center justify-between mb-2'>
                                        <div className='flex items-center gap-2 text-blue-600'>
                                            <Sparkles className='h-4 w-4' />
                                            <span className='text-xs font-bold uppercase tracking-wider'>
                                                AI Task Generation Enabled
                                            </span>
                                        </div>
                                        <Button
                                            type='button'
                                            variant='ghost'
                                            size='sm'
                                            className='text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                                            onClick={handleAiAssign}
                                            isLoading={isAiAssigning}
                                        >
                                            <Sparkles className='mr-1 h-3.5 w-3.5' />{' '}
                                            {project.teamMode ? 'Assign with AI' : 'AI Breakdown'}
                                        </Button>
                                    </div>
                                    <Input
                                        label='Task Title'
                                        placeholder='What needs to be done?'
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        required
                                    />
                                    <div className='space-y-1.5'>
                                        <label className='text-sm font-medium text-slate-700'>Description</label>
                                        <textarea
                                            className='flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[100px]'
                                            placeholder='Provide details for AI analysis...'
                                            value={newTask.description}
                                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        />
                                    </div>
                                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                                        <Input
                                            type='date'
                                            label='Deadline'
                                            value={newTask.deadline}
                                            onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                        />
                                        <div className='space-y-1.5'>
                                            <label className='text-sm font-medium text-slate-700'>Priority</label>
                                            <select
                                                className='flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                                                value={newTask.priority}
                                                onChange={e =>
                                                    setNewTask({ ...newTask, priority: e.target.value as Priority })
                                                }
                                            >
                                                <option value='Low'>Low</option>
                                                <option value='Medium'>Medium</option>
                                                <option value='High'>High</option>
                                            </select>
                                        </div>
                                        {project.teamMode && (
                                            <div className='space-y-1.5'>
                                                <label className='text-sm font-medium text-slate-700'>Assign To</label>
                                                <select
                                                    className='flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                                                    value={newTask.assignedToId}
                                                    onChange={e =>
                                                        setNewTask({ ...newTask, assignedToId: e.target.value })
                                                    }
                                                >
                                                    <option value=''>Unassigned</option>
                                                    {allAvailableMembers.map(m => (
                                                        <option
                                                            key={m.id}
                                                            value={m.id}
                                                        >
                                                            {m.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {(newTask.strategySummary || (newTask.subtasks && newTask.subtasks.length > 0)) && (
                                        <div className='space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in zoom-in duration-300'>
                                            {newTask.strategySummary && (
                                                <div className='space-y-1'>
                                                    <h5 className='text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1'>
                                                        <Sparkles className='h-3 w-3' /> AI Suggested Strategy
                                                    </h5>
                                                    <p className='text-sm text-slate-700'>{newTask.strategySummary}</p>
                                                </div>
                                            )}
                                            {newTask.subtasks && newTask.subtasks.length > 0 && (
                                                <div className='space-y-1'>
                                                    <h5 className='text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1'>
                                                        <Sparkles className='h-3 w-3' /> AI Suggested Subtasks
                                                    </h5>
                                                    <ul className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1'>
                                                        {newTask.subtasks.map((st, i) => (
                                                            <li
                                                                key={i}
                                                                className='text-xs text-slate-600 flex items-start gap-2'
                                                            >
                                                                <span className='text-blue-400 font-bold'>•</span> {st}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className='flex justify-end gap-3 pt-2'>
                                        <Button
                                            variant='ghost'
                                            type='button'
                                            onClick={() => setIsAddingTask(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type='submit'
                                            isLoading={isGenerating}
                                        >
                                            Create Task
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        <div className='space-y-3'>
                            {filteredTasks.map(task => {
                                const isOverdue =
                                    task.status !== 'Complete' &&
                                    task.deadline &&
                                    isBefore(parseISO(task.deadline), new Date());
                                const isExpanded = expandedTask === task.id;

                                return (
                                    <Card
                                        key={task.id}
                                        className={clsx(
                                            'transition-all duration-200 overflow-hidden',
                                            isExpanded
                                                ? 'border-blue-200 shadow-md ring-1 ring-blue-100'
                                                : 'hover:border-slate-300'
                                        )}
                                    >
                                        <div
                                            className='p-4 sm:p-5 flex items-start gap-4 cursor-pointer group'
                                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                        >
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    toggleTaskStatus(task);
                                                }}
                                                className='mt-1 flex-shrink-0'
                                            >
                                                {task.status === 'Complete' ? (
                                                    <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                                                ) : (
                                                    <Circle className='h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors' />
                                                )}
                                            </button>

                                            <div className='flex-1 min-w-0'>
                                                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1'>
                                                    <h4
                                                        className={clsx(
                                                            'font-bold text-slate-900 truncate',
                                                            task.status === 'Complete' && 'line-through text-slate-400'
                                                        )}
                                                    >
                                                        {task.title}
                                                    </h4>
                                                    <div className='flex items-center gap-2'>
                                                        {isOverdue && (
                                                            <Badge
                                                                variant='danger'
                                                                className='text-[10px] py-0'
                                                            >
                                                                Overdue
                                                            </Badge>
                                                        )}
                                                        <Badge
                                                            variant={
                                                                task.priority === 'High'
                                                                    ? 'danger'
                                                                    : task.priority === 'Medium'
                                                                      ? 'warning'
                                                                      : 'default'
                                                            }
                                                            className='text-[10px] py-0'
                                                        >
                                                            {task.priority}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500'>
                                                    <div className='flex items-center gap-1'>
                                                        <Calendar className='h-3.5 w-3.5' />
                                                        {task.deadline
                                                            ? format(parseISO(task.deadline), 'MMM d, yyyy')
                                                            : 'No deadline'}
                                                    </div>
                                                    <div className='flex items-center gap-1'>
                                                        <Flag className='h-3.5 w-3.5' />
                                                        {task.subtasks?.length || 0} Subtasks
                                                    </div>
                                                    {task.assignedTo && (
                                                        <div className='flex items-center gap-1'>
                                                            {task.assignedTo.avatar ? (
                                                                <img
                                                                    src={task.assignedTo.avatar}
                                                                    alt={task.assignedTo.name}
                                                                    className='h-4 w-4 rounded-full'
                                                                />
                                                            ) : (
                                                                <Users className='h-3.5 w-3.5' />
                                                            )}
                                                            <span>{task.assignedTo.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className='flex items-center gap-2'>
                                                {isExpanded ? (
                                                    <ChevronUp className='h-4 w-4 text-slate-400' />
                                                ) : (
                                                    <ChevronDown className='h-4 w-4 text-slate-400' />
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className='px-14 pb-5 space-y-6 animate-in slide-in-from-top-2'>
                                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                                    <div className='space-y-4'>
                                                        <div className='space-y-2'>
                                                            <h5 className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                                                                Assignment
                                                            </h5>
                                                            <select
                                                                className='flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed'
                                                                value={task.assignedToId || ''}
                                                                onChange={e =>
                                                                    handleUpdateAssignment(task.id, e.target.value)
                                                                }
                                                                onClick={e => e.stopPropagation()}
                                                                disabled={!isAdmin}
                                                            >
                                                                <option value=''>Unassigned</option>
                                                                {allAvailableMembers.map(m => (
                                                                    <option
                                                                        key={m.id}
                                                                        value={m.id}
                                                                    >
                                                                        {m.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className='space-y-2'>
                                                            <h5 className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                                                                Task Strategy
                                                            </h5>
                                                            <p className='text-sm text-slate-600 leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100'>
                                                                {task.strategySummary ||
                                                                    'No specific strategy generated.'}
                                                            </p>
                                                        </div>

                                                        <TaskAttachments taskId={task.id} />
                                                    </div>

                                                    <div className='space-y-3'>
                                                        <div className='flex items-center justify-between'>
                                                            <h5 className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                                                                Subtasks
                                                            </h5>
                                                            <div className='text-[10px] font-bold text-slate-400 uppercase'>
                                                                {task.subtasks?.filter(s => s.isCompleted).length || 0}{' '}
                                                                / {task.subtasks?.length || 0}
                                                            </div>
                                                        </div>
                                                        <div className='space-y-2 bg-slate-50 p-2 rounded-lg border border-slate-100'>
                                                            {(task.subtasks || [])
                                                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                                .map(subtask => (
                                                                    <div
                                                                        key={subtask.id}
                                                                        draggable
                                                                        onDragStart={e =>
                                                                            onSubtaskDragStart(e, task.id, subtask.id)
                                                                        }
                                                                        onDragOver={onSubtaskDragOver}
                                                                        onDrop={e =>
                                                                            onSubtaskDrop(e, task.id, subtask.id)
                                                                        }
                                                                        className='flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-white p-2 rounded shadow-sm border border-transparent hover:border-slate-200 transition-all group'
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            toggleSubtask(
                                                                                task.id,
                                                                                subtask.id,
                                                                                subtask.isCompleted
                                                                            );
                                                                        }}
                                                                    >
                                                                        <GripVertical className='h-3 w-3 text-slate-300 group-hover:text-slate-400 cursor-grab' />
                                                                        {subtask.isCompleted ? (
                                                                            <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />
                                                                        ) : (
                                                                            <Circle className='h-4 w-4 text-slate-300 shrink-0 group-hover:text-blue-400' />
                                                                        )}
                                                                        <span
                                                                            className={clsx(
                                                                                subtask.isCompleted &&
                                                                                    'line-through text-slate-400'
                                                                            )}
                                                                        >
                                                                            {subtask.title}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            {(!task.subtasks || task.subtasks.length === 0) && (
                                                                <p className='text-xs text-slate-400 italic p-2'>
                                                                    No subtasks generated.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='flex justify-between items-center pt-2 border-t border-slate-100'>
                                                    <p className='text-[10px] text-slate-400 italic'>
                                                        Task ID: {task.id.substring(0, 8)} | Created:{' '}
                                                        {format(
                                                            parseISO(task.createdAt || new Date().toISOString()),
                                                            'MMM d'
                                                        )}
                                                    </p>
                                                    {isAdmin && (
                                                        <Button
                                                            variant='ghost'
                                                            size='sm'
                                                            className='text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8'
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                if (
                                                                    confirm(
                                                                        'Are you sure you want to delete this task?'
                                                                    )
                                                                ) {
                                                                    taskService
                                                                        .deleteTask(task.id)
                                                                        .then(() => {
                                                                            setTasks(
                                                                                tasks.filter(t => t.id !== task.id)
                                                                            );
                                                                        })
                                                                        .catch(err => {
                                                                            console.error('Failed to delete task', err);
                                                                        });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className='h-3.5 w-3.5 mr-1' /> Delete Task
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'kanban' && (
                <div className='py-2 animate-in fade-in duration-300'>
                    <KanbanBoard
                        tasks={tasks}
                        onTaskMove={onTaskMove}
                    />
                </div>
            )}

            {activeTab === 'sprints' && (
                <div className='animate-in fade-in duration-300'>
                    <SprintPlanning projectId={project.id} />
                </div>
            )}

            {activeTab === 'performance' && (
                <div className='animate-in fade-in duration-300'>
                    <PerformanceCharts projectId={project.id} />
                </div>
            )}

            {activeTab === 'risks' && (
                <div className='max-w-3xl mx-auto animate-in fade-in duration-300'>
                    <RiskPanel projectId={project.id} />
                </div>
            )}

            {activeTab === 'updates' && (
                <div className='space-y-6'>
                    <MeetingAssistant
                        projectId={project.id}
                        onTasksCreated={() => loadProjectData(project.id)}
                    />
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        <div className='lg:col-span-2 space-y-6'>
                            <Card>
                                <CardContent className='p-6'>
                                    <h3 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
                                        <Activity className='h-5 w-5 text-blue-600' /> Submit Daily Progress
                                    </h3>
                                    <form
                                        onSubmit={handleSubmitUpdate}
                                        className='space-y-4'
                                    >
                                        <div className='space-y-1.5'>
                                            <label className='text-sm font-medium text-slate-700'>
                                                Progress Summary
                                            </label>
                                            <textarea
                                                className='flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[80px]'
                                                placeholder='What did you achieve today?'
                                                value={newUpdate.summary}
                                                onChange={e => setNewUpdate({ ...newUpdate, summary: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                            <div className='space-y-1.5'>
                                                <label className='text-sm font-medium text-slate-700'>Blockers</label>
                                                <textarea
                                                    className='flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 h-[60px]'
                                                    placeholder='Any obstacles?'
                                                    value={newUpdate.blockers}
                                                    onChange={e =>
                                                        setNewUpdate({ ...newUpdate, blockers: e.target.value })
                                                    }
                                                />
                                            </div>
                                            <div className='space-y-1.5'>
                                                <label className='text-sm font-medium text-slate-700'>
                                                    Suggestions
                                                </label>
                                                <textarea
                                                    className='flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 h-[60px]'
                                                    placeholder='Ideas for improvement?'
                                                    value={newUpdate.suggestions}
                                                    onChange={e =>
                                                        setNewUpdate({ ...newUpdate, suggestions: e.target.value })
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className='flex justify-end'>
                                            <Button
                                                type='submit'
                                                isLoading={isSubmittingUpdate}
                                            >
                                                Submit Update
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className='space-y-4'>
                                <h3 className='text-lg font-bold text-slate-900'>Recent Updates</h3>
                                {dailyUpdates.map(update => (
                                    <Card key={update.id}>
                                        <CardContent className='p-4'>
                                            <div className='flex items-start gap-3'>
                                                {update.user.avatar ? (
                                                    <img
                                                        src={update.user.avatar}
                                                        alt={update.user.name}
                                                        className='h-8 w-8 rounded-full'
                                                    />
                                                ) : (
                                                    <div className='h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs'>
                                                        {update.user.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className='flex-1 space-y-2'>
                                                    <div className='flex items-center justify-between'>
                                                        <span className='font-bold text-slate-900 text-sm'>
                                                            {update.user.name}
                                                        </span>
                                                        <span className='text-[10px] text-slate-400'>
                                                            {format(parseISO(update.createdAt), 'MMM d, h:mm a')}
                                                        </span>
                                                    </div>
                                                    <p className='text-sm text-slate-700'>{update.summary}</p>
                                                    {(update.blockers || update.suggestions) && (
                                                        <div className='flex flex-wrap gap-2 pt-1'>
                                                            {update.blockers && (
                                                                <Badge
                                                                    variant='danger'
                                                                    className='text-[10px] bg-red-50 text-red-600 border-red-100'
                                                                >
                                                                    Blocker: {update.blockers}
                                                                </Badge>
                                                            )}
                                                            {update.suggestions && (
                                                                <Badge
                                                                    variant='default'
                                                                    className='text-[10px] bg-amber-50 text-amber-600 border-amber-100'
                                                                >
                                                                    Idea: {update.suggestions}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {dailyUpdates.length === 0 && (
                                    <p className='text-center py-12 text-slate-400 italic'>
                                        No daily updates submitted yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className='space-y-6'>
                            <Card className='border-indigo-100 bg-indigo-50/30'>
                                <CardContent className='p-6'>
                                    <div className='flex items-center justify-between mb-4'>
                                        <h3 className='text-lg font-bold text-indigo-900 flex items-center gap-2'>
                                            <Sparkles className='h-5 w-5 text-indigo-600' /> AI Health Check
                                        </h3>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={fetchHealth}
                                            isLoading={isLoadingHealth}
                                            className='h-8 text-indigo-600'
                                        >
                                            Refresh
                                        </Button>
                                    </div>

                                    {!projectHealth && !isLoadingHealth && (
                                        <div className='text-center py-6'>
                                            <p className='text-sm text-slate-500 mb-4'>
                                                Run analysis to get AI project health insights.
                                            </p>
                                            <Button onClick={fetchHealth}>Analyze Health</Button>
                                        </div>
                                    )}

                                    {isLoadingHealth && (
                                        <div className='animate-pulse space-y-4'>
                                            <div className='h-10 bg-indigo-100 rounded'></div>
                                            <div className='h-20 bg-indigo-100 rounded'></div>
                                        </div>
                                    )}

                                    {projectHealth && (
                                        <div className='space-y-6 animate-in fade-in duration-500'>
                                            <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-100'>
                                                <Heart
                                                    className={clsx(
                                                        'h-10 w-10 p-2 rounded-full',
                                                        projectHealth.team_health_status === 'Healthy'
                                                            ? 'bg-emerald-100 text-emerald-600'
                                                            : projectHealth.team_health_status === 'At Risk'
                                                              ? 'bg-amber-100 text-amber-600'
                                                              : 'bg-rose-100 text-rose-600'
                                                    )}
                                                />
                                                <div>
                                                    <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                                                        Project Status
                                                    </p>
                                                    <p className='font-bold text-slate-900'>
                                                        {projectHealth.team_health_status}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className='space-y-2'>
                                                <h4 className='text-xs font-bold uppercase text-slate-400 flex items-center gap-1'>
                                                    <AlertTriangle className='h-3 w-3' /> Risks Detected
                                                </h4>
                                                <div className='space-y-1.5'>
                                                    {projectHealth.risks_detected.map((risk, i) => (
                                                        <div
                                                            key={i}
                                                            className='text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 flex items-start gap-2'
                                                        >
                                                            <span className='text-rose-500 font-bold'>•</span> {risk}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className='space-y-2'>
                                                <h4 className='text-xs font-bold uppercase text-slate-400 flex items-center gap-1'>
                                                    <Lightbulb className='h-3 w-3' /> AI Suggestions
                                                </h4>
                                                <div className='space-y-1.5'>
                                                    {projectHealth.improvement_suggestions.map((sug, i) => (
                                                        <div
                                                            key={i}
                                                            className='text-xs text-slate-600 bg-white p-2 rounded border border-indigo-100 flex items-start gap-2'
                                                        >
                                                            <span className='text-indigo-500 font-bold'>•</span> {sug}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'chat' && (
                <Card className='h-[600px] flex flex-col'>
                    <CardContent className='p-0 flex-1 flex flex-col overflow-hidden'>
                        <div className='p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50'>
                            <h3 className='font-bold text-slate-900 flex items-center gap-2'>
                                <MessageSquare className='h-5 w-5 text-blue-600' /> Team Collaboration
                            </h3>
                            <div className='flex -space-x-2'>
                                {allAvailableMembers.slice(0, 5).map(m => (
                                    <div
                                        key={m.id}
                                        className='h-7 w-7 rounded-full border-2 border-white bg-slate-200 overflow-hidden'
                                        title={m.name}
                                    >
                                        {m.avatar ? (
                                            <img
                                                src={m.avatar}
                                                alt={m.name}
                                                className='h-full w-full object-cover'
                                            />
                                        ) : (
                                            <div className='h-full w-full flex items-center justify-center text-[10px] font-bold'>
                                                {m.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {allAvailableMembers.length > 5 && (
                                    <div className='h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500'>
                                        +{allAvailableMembers.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                            {messages.map((msg, i) => {
                                const isMe = msg.userId === currentUser?.id;
                                const showAvatar = i === 0 || messages[i - 1].userId !== msg.userId;

                                return (
                                    <div
                                        key={msg.id}
                                        className={clsx('flex gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}
                                    >
                                        {!isMe && (
                                            <div className='w-8 shrink-0'>
                                                {showAvatar &&
                                                    (msg.user.avatar ? (
                                                        <img
                                                            src={msg.user.avatar}
                                                            alt={msg.user.name}
                                                            className='h-8 w-8 rounded-full'
                                                        />
                                                    ) : (
                                                        <div className='h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs'>
                                                            {msg.user.name.charAt(0)}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                        <div
                                            className={clsx(
                                                'max-w-[70%] space-y-1',
                                                isMe ? 'items-end' : 'items-start'
                                            )}
                                        >
                                            {showAvatar && !isMe && (
                                                <span className='text-[10px] font-bold text-slate-500 ml-1'>
                                                    {msg.user.name}
                                                </span>
                                            )}
                                            <div
                                                className={clsx(
                                                    'p-3 rounded-2xl text-sm shadow-sm',
                                                    isMe
                                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                                        : 'bg-white border border-slate-100 rounded-tl-none text-slate-700'
                                                )}
                                            >
                                                {msg.content}
                                            </div>
                                            <span className='text-[10px] text-slate-400 px-1'>
                                                {format(parseISO(msg.createdAt), 'h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {messages.length === 0 && (
                                <div className='h-full flex flex-col items-center justify-center text-slate-400 space-y-2'>
                                    <MessageSquare className='h-12 w-12 opacity-20' />
                                    <p className='text-sm italic'>Start the conversation with your team.</p>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form
                            onSubmit={handleSendMessage}
                            className='p-4 border-t border-slate-100 bg-white'
                        >
                            <div className='relative'>
                                <input
                                    type='text'
                                    className='w-full bg-slate-100 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500 transition-all'
                                    placeholder='Type a message...'
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                />
                                <button
                                    type='submit'
                                    disabled={!newMessage}
                                    className='absolute right-1.5 top-1.5 h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                                >
                                    <Send className='h-4 w-4' />
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'team' && (
                <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div className='md:col-span-2 space-y-6'>
                            <Card>
                                <CardContent className='p-6'>
                                    <div className='flex items-center justify-between mb-6'>
                                        <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
                                            <Users className='h-5 w-5 text-blue-600' /> Team Members
                                        </h3>
                                        {isAdmin && (
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={handleToggleTeamMode}
                                            >
                                                {project.teamMode ? 'Disable Team Mode' : 'Enable Team Mode'}
                                            </Button>
                                        )}
                                    </div>

                                    <div className='space-y-4'>
                                        <div className='flex items-center justify-between p-3 rounded-lg border border-blue-100 bg-blue-50/30'>
                                            <div className='flex items-center gap-3'>
                                                {project.user?.avatar ? (
                                                    <img
                                                        src={project.user.avatar}
                                                        alt={project.user.name}
                                                        className='h-10 w-10 rounded-full border-2 border-blue-200'
                                                    />
                                                ) : (
                                                    <div className='h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold'>
                                                        {project.user?.name?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className='font-bold text-slate-900'>
                                                        {project.user?.name}{' '}
                                                        <span className='text-xs font-normal text-slate-500'>
                                                            (You)
                                                        </span>
                                                    </p>
                                                    <p className='text-xs text-slate-500'>{project.user?.email}</p>
                                                </div>
                                            </div>
                                            <Badge className='bg-blue-600 text-white border-none'>Team Lead</Badge>
                                        </div>

                                        {members.map(member => (
                                            <div
                                                key={member.id}
                                                className='flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors'
                                            >
                                                <div className='flex items-center gap-3'>
                                                    {member.user?.avatar ? (
                                                        <img
                                                            src={member.user.avatar}
                                                            alt={member.user.name}
                                                            className='h-10 w-10 rounded-full'
                                                        />
                                                    ) : (
                                                        <div className='h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold'>
                                                            {member.user?.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className='font-bold text-slate-900'>
                                                            {member.user?.name || 'Invited User'}
                                                        </p>
                                                        <p className='text-xs text-slate-500'>
                                                            {member.user?.email || member.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center gap-3'>
                                                    <Badge
                                                        variant={member.role === 'ADMIN' ? 'warning' : 'default'}
                                                        className={clsx(
                                                            'text-[10px]',
                                                            isAdmin &&
                                                                member.userId &&
                                                                'cursor-pointer hover:opacity-80'
                                                        )}
                                                        onClick={() =>
                                                            isAdmin && member.userId && handleToggleRole(member)
                                                        }
                                                    >
                                                        {member.role === 'ADMIN' ? (
                                                            <Shield className='h-3 w-3 mr-1 inline' />
                                                        ) : null}
                                                        {member.role}
                                                    </Badge>
                                                    {(member as any).isInvitation ? (
                                                        <Badge
                                                            variant='default'
                                                            className='text-[10px] bg-slate-100 text-slate-500 border-slate-200'
                                                        >
                                                            Invited
                                                        </Badge>
                                                    ) : (
                                                        member.status === 'PENDING' && (
                                                            <Badge
                                                                variant='default'
                                                                className='text-[10px] bg-amber-50 text-amber-500 border-amber-100'
                                                            >
                                                                Pending
                                                            </Badge>
                                                        )
                                                    )}
                                                    {isAdmin && (
                                                        <Button
                                                            variant='ghost'
                                                            size='sm'
                                                            className='h-8 w-8 p-0 text-slate-400 hover:text-rose-600'
                                                            onClick={() =>
                                                                handleRemoveMember(member.userId || member.id)
                                                            }
                                                        >
                                                            <Trash2 className='h-4 w-4' />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {members.length === 0 && !project.teamMode && (
                                            <div className='text-center py-8'>
                                                <Users className='mx-auto h-12 w-12 text-slate-200' />
                                                <p className='mt-2 text-sm text-slate-500'>
                                                    This is currently a private project. Enable Team Mode to
                                                    collaborate.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {isAdmin && project.teamMode && (
                            <div className='space-y-6'>
                                <Card>
                                    <CardContent className='p-6'>
                                        <h3 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
                                            <UserPlus className='h-5 w-5 text-blue-600' /> Invite Member
                                        </h3>
                                        <form
                                            onSubmit={handleInvite}
                                            className='space-y-4'
                                        >
                                            <Input
                                                label='User Email'
                                                placeholder='email@example.com'
                                                value={inviteEmail}
                                                onChange={e => setInviteEmail(e.target.value)}
                                                required
                                            />
                                            <div className='space-y-1.5'>
                                                <label className='text-sm font-medium text-slate-700'>Role</label>
                                                <select
                                                    className='flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                                                    value={inviteRole}
                                                    onChange={e => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
                                                >
                                                    <option value='MEMBER'>Member</option>
                                                    <option value='ADMIN'>Admin</option>
                                                </select>
                                            </div>
                                            <Button
                                                type='submit'
                                                className='w-full'
                                                isLoading={isInviting}
                                            >
                                                Send Invite
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card className='bg-slate-900 text-white'>
                                    <CardContent className='p-6 space-y-4'>
                                        <h3 className='font-bold flex items-center gap-2'>
                                            <Shield className='h-5 w-5 text-blue-400' /> Lead Controls
                                        </h3>
                                        <ul className='text-xs space-y-2 text-slate-400 mb-6'>
                                            <li className='flex gap-2'>• Administer team membership</li>
                                            <li className='flex gap-2'>• Assign and redistribute tasks</li>
                                            <li className='flex gap-2'>• Access project health analytics</li>
                                            <li className='flex gap-2'>• Manage project lifecycle</li>
                                        </ul>
                                        <Button
                                            variant='ghost'
                                            className='w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100'
                                            onClick={handleDeleteProject}
                                        >
                                            <Trash2 className='h-4 w-4 mr-2' /> Delete Project
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {!isOwner && !isPending && (
                            <div className='space-y-6'>
                                <Card className='border-slate-200'>
                                    <CardContent className='p-6'>
                                        <h3 className='font-bold flex items-center gap-2 mb-4 text-slate-900'>
                                            <Shield className='h-5 w-5 text-slate-400' /> Member Options
                                        </h3>
                                        <p className='text-xs text-slate-500 mb-6'>
                                            You are a member of this project. You can leave at any time, but you will
                                            lose access to all tasks and collaboration features.
                                        </p>
                                        <Button
                                            variant='outline'
                                            className='w-full text-slate-600 hover:text-rose-600 hover:border-rose-100'
                                            onClick={handleLeaveProject}
                                        >
                                            Leave Project
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
