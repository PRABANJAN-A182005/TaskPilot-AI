import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { dashboardService } from '../../services/dashboard.service';
import { DashboardStats, Project, User } from '../../types';
import { projectService } from '../../services/project.service';
import { authService } from '../../services/auth.service';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
    Briefcase,
    Clock,
    AlertCircle,
    TrendingUp,
    Plus,
    Sparkles,
    Users,
    Award,
    BarChart3,
    Shield,
    AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line
} from 'recharts';

import { PerformanceCharts } from '../../components/performance/PerformanceCharts';
import { RiskPanel } from '../../components/projects/RiskPanel';

const COLORS = {
    'Complete': '#10b981',
    'In-Progress': '#3b82f6',
    'Todo': '#f59e0b',
    'High': '#ef4444',
    'Medium': '#f59e0b',
    'Low': '#10b981'
};

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentProjects, setRecentProjects] = useState<Project[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [weeklySummary, setWeeklySummary] = useState<string>('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isExecutiveView, setIsExecutiveView] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [s, p] = await Promise.all([dashboardService.getStats(), projectService.getProjects()]);
                setStats(s);
                setRecentProjects(p.slice(0, 4));
                setUser(authService.getCurrentUser());

                if (s.teamStats) {
                    fetchWeeklySummary();
                }
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const fetchWeeklySummary = async () => {
        setIsLoadingSummary(true);
        try {
            const { summary } = await dashboardService.getWeeklySummary();
            setWeeklySummary(summary);
        } catch (error) {
            console.error('Failed to load weekly summary', error);
        } finally {
            setIsLoadingSummary(false);
        }
    };

    if (isLoading)
        return <div className='animate-pulse flex items-center justify-center min-h-[400px]'>Loading dashboard...</div>;

    const statCards = [
        {
            label: 'Total Projects',
            value: stats?.totalProjects || 0,
            icon: Briefcase,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            label: 'Pending Tasks',
            value: stats?.pendingTasks || 0,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            label: 'Overdue',
            value: stats?.overdueTasks || 0,
            icon: AlertCircle,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        },
        {
            label: 'High Priority',
            value: stats?.highPriorityTasks || 0,
            icon: TrendingUp,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        }
    ];

    const statusData = stats
        ? [
              { name: 'Complete', value: stats.statusDistribution.Complete },
              { name: 'In-Progress', value: stats.statusDistribution['In-Progress'] },
              { name: 'Todo', value: stats.statusDistribution.Todo }
          ]
        : [];

    const priorityData = stats
        ? [
              { name: 'High', value: stats.priorityDistribution.High },
              { name: 'Medium', value: stats.priorityDistribution.Medium },
              { name: 'Low', value: stats.priorityDistribution.Low }
          ]
        : [];

    return (
        <div className='space-y-8'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900 sm:text-3xl'>
                        Welcome back, {user?.name || 'User'}!
                    </h1>
                    <p className='mt-1 text-slate-500'>Here's what's happening with your projects today.</p>
                </div>
                <div className='flex gap-2'>
                    <Button
                        variant={isExecutiveView ? 'primary' : 'outline'}
                        onClick={() => setIsExecutiveView(!isExecutiveView)}
                        className={isExecutiveView ? 'bg-amber-600 hover:bg-amber-700' : ''}
                    >
                        <Shield className='mr-2 h-4 w-4' /> {isExecutiveView ? 'Standard Dashboard' : 'Executive View'}
                    </Button>
                    <Link to='/projects/new'>
                        <Button>
                            <Plus className='mr-2 h-4 w-4' /> New Project
                        </Button>
                    </Link>
                </div>
            </div>

            {isExecutiveView ? (
                <div className='space-y-8 animate-in fade-in duration-500'>
                    <PerformanceCharts />

                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                        <div className='lg:col-span-2 space-y-8'>
                            <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
                                <AlertTriangle className='h-5 w-5 text-amber-500' /> Critical Risks Across Projects
                            </h3>
                            <div className='space-y-6'>
                                {recentProjects.slice(0, 3).map(p => (
                                    <div key={p.id}>
                                        <p className='text-xs font-bold text-slate-400 uppercase mb-2'>{p.name}</p>
                                        <RiskPanel projectId={p.id} />
                                    </div>
                                ))}
                                {recentProjects.length === 0 && (
                                    <p className='text-slate-400 italic'>No projects to analyze.</p>
                                )}
                            </div>
                        </div>

                        <Card className='h-fit'>
                            <CardContent className='p-6'>
                                <h3 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
                                    <BarChart3 className='h-5 w-5 text-blue-600' /> Resource Allocation
                                </h3>
                                <div className='space-y-6'>
                                    {stats?.teamStats?.workloadIndicators.map((w, i) => (
                                        <div
                                            key={i}
                                            className='space-y-1.5'
                                        >
                                            <div className='flex justify-between text-xs'>
                                                <span className='font-medium text-slate-700'>{w.member}</span>
                                                <span className='font-bold text-slate-900'>{w.taskCount} tasks</span>
                                            </div>
                                            <ProgressBar
                                                value={Math.min(100, (w.taskCount / 10) * 100)}
                                                className={w.taskCount > 7 ? 'bg-red-100' : 'bg-blue-100'}
                                                showLabel={false}
                                            />
                                        </div>
                                    ))}
                                    {(!stats?.teamStats || stats.teamStats.workloadIndicators.length === 0) && (
                                        <p className='text-sm text-slate-400 italic'>No team data available.</p>
                                    )}
                                </div>
                                <Button
                                    className='w-full mt-6'
                                    variant='outline'
                                    onClick={() => alert('Exporting to PDF...')}
                                >
                                    Export Executive Report (PDF)
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                        {statCards.map(stat => (
                            <Card key={stat.label}>
                                <CardContent className='flex items-center gap-4 p-6'>
                                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className='text-sm font-medium text-slate-500'>{stat.label}</p>
                                        <p className='text-2xl font-bold text-slate-900'>{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {stats?.teamStats && (
                        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                            <Card className='lg:col-span-2 border-indigo-100 bg-indigo-50/20'>
                                <CardContent className='p-6'>
                                    <div className='flex items-center justify-between mb-6'>
                                        <h3 className='text-lg font-bold text-indigo-900 flex items-center gap-2'>
                                            <Sparkles className='h-5 w-5 text-indigo-600' /> AI Team Weekly Summary
                                        </h3>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={fetchWeeklySummary}
                                            isLoading={isLoadingSummary}
                                            className='h-8 text-indigo-600'
                                        >
                                            Regenerate
                                        </Button>
                                    </div>
                                    {isLoadingSummary ? (
                                        <div className='animate-pulse space-y-2'>
                                            <div className='h-4 bg-indigo-100 rounded w-3/4'></div>
                                            <div className='h-4 bg-indigo-100 rounded w-full'></div>
                                            <div className='h-4 bg-indigo-100 rounded w-2/3'></div>
                                        </div>
                                    ) : (
                                        <p className='text-indigo-900 text-sm leading-relaxed italic'>
                                            "{weeklySummary || stats.teamStats.weeklySummary}"
                                        </p>
                                    )}
                                    <div className='mt-6 pt-6 border-t border-indigo-100 flex flex-wrap gap-6'>
                                        <div className='flex items-center gap-3'>
                                            <div className='h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center'>
                                                <Award className='h-5 w-5' />
                                            </div>
                                            <div>
                                                <p className='text-[10px] font-bold text-slate-400 uppercase'>
                                                    Productivity Score
                                                </p>
                                                <p className='text-xl font-bold text-slate-900'>
                                                    {stats.teamStats.productivityScore}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-3'>
                                            <div className='h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center'>
                                                <Users className='h-5 w-5' />
                                            </div>
                                            <div>
                                                <p className='text-[10px] font-bold text-slate-400 uppercase'>
                                                    Active Members
                                                </p>
                                                <p className='text-xl font-bold text-slate-900'>
                                                    {stats.teamStats.workloadIndicators.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className='p-6'>
                                    <h3 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
                                        <AlertCircle className='h-5 w-5 text-rose-500' /> Overdue by Member
                                    </h3>
                                    <div className='space-y-4'>
                                        {stats.teamStats.overdueByMember.map((m, i) => (
                                            <div
                                                key={i}
                                                className='flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-100'
                                            >
                                                <div className='flex items-center gap-2'>
                                                    <div className='h-6 w-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold'>
                                                        {m.member.charAt(0)}
                                                    </div>
                                                    <span className='text-xs font-medium text-slate-700'>
                                                        {m.member}
                                                    </span>
                                                </div>
                                                <Badge
                                                    variant='danger'
                                                    className='text-[10px]'
                                                >
                                                    {m.count} tasks
                                                </Badge>
                                            </div>
                                        ))}
                                        {stats.teamStats.overdueByMember.length === 0 && (
                                            <div className='text-center py-8 text-slate-400 italic text-sm'>
                                                No overdue tasks across the team!
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                        <Card className='p-6'>
                            <h3 className='text-lg font-bold text-slate-900 mb-6 flex items-center gap-2'>
                                <BarChart3 className='h-5 w-5 text-blue-600' /> Member Workload
                            </h3>
                            <div className='h-[300px]'>
                                {stats?.teamStats ? (
                                    <ResponsiveContainer
                                        width='100%'
                                        height='100%'
                                    >
                                        <BarChart
                                            data={stats.teamStats.workloadIndicators}
                                            margin={{ left: 10, right: 30 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray='3 3'
                                                horizontal={true}
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey='member'
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip />
                                            <Bar
                                                dataKey='taskCount'
                                                fill='#3b82f6'
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className='h-full flex items-center justify-center text-slate-400 italic text-sm'>
                                        Enable Team Mode in projects to see workload stats.
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className='p-6'>
                            <h3 className='text-lg font-bold text-slate-900 mb-6'>Task Status Distribution</h3>
                            <div className='h-[300px]'>
                                <ResponsiveContainer
                                    width='100%'
                                    height='100%'
                                >
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx='50%'
                                            cy='50%'
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey='value'
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[entry.name as keyof typeof COLORS]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend
                                            verticalAlign='bottom'
                                            height={36}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                        <Card className='p-6'>
                            <h3 className='text-lg font-bold text-slate-900 mb-6'>Priority Distribution</h3>
                            <div className='h-[300px]'>
                                <ResponsiveContainer
                                    width='100%'
                                    height='100%'
                                >
                                    <BarChart
                                        layout='vertical'
                                        data={priorityData}
                                        margin={{ left: 10, right: 30 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray='3 3'
                                            horizontal={true}
                                            vertical={false}
                                        />
                                        <XAxis
                                            type='number'
                                            hide
                                        />
                                        <YAxis
                                            dataKey='name'
                                            type='category'
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip />
                                        <Bar
                                            dataKey='value'
                                            radius={[0, 4, 4, 0]}
                                        >
                                            {priorityData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[entry.name as keyof typeof COLORS]}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className='p-6'>
                            <h3 className='text-lg font-bold text-slate-900 mb-6'>Productivity (Last 7 Days)</h3>
                            <div className='h-[300px]'>
                                <ResponsiveContainer
                                    width='100%'
                                    height='100%'
                                >
                                    <LineChart data={stats?.productivityData || []}>
                                        <CartesianGrid
                                            strokeDasharray='3 3'
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey='date'
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip />
                                        <Line
                                            type='monotone'
                                            dataKey='completed'
                                            stroke='#3b82f6'
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    <div>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-lg font-bold text-slate-900'>Recent Projects</h2>
                            <Link
                                to='/projects'
                                className='text-sm font-medium text-blue-600 hover:text-blue-700'
                            >
                                View all
                            </Link>
                        </div>
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                            {recentProjects.map(project => (
                                <Link
                                    key={project.id}
                                    to={`/projects/${project.id}`}
                                >
                                    <Card className='hover:border-blue-200 hover:shadow-md transition-all group'>
                                        <CardContent className='p-6'>
                                            <div className='flex justify-between items-start mb-4'>
                                                <div>
                                                    <div className='flex items-center gap-2'>
                                                        <h3 className='font-bold text-slate-900 group-hover:text-blue-600 transition-colors'>
                                                            {project.name}
                                                        </h3>
                                                        {project.teamMode && (
                                                            <Users className='h-3.5 w-3.5 text-indigo-500' />
                                                        )}
                                                    </div>
                                                    <p className='text-xs text-slate-500 mt-0.5'>
                                                        Created on {format(new Date(project.createdAt), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <div className='text-right'>
                                                    <span className='text-sm font-bold text-slate-900'>
                                                        {project.progress}%
                                                    </span>
                                                </div>
                                            </div>
                                            <ProgressBar
                                                value={project.progress}
                                                showLabel={false}
                                            />
                                            <p className='mt-4 text-sm text-slate-600 line-clamp-2'>
                                                {project.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                            {recentProjects.length === 0 && (
                                <Card className='col-span-full border-dashed p-12 text-center'>
                                    <p className='text-slate-500'>
                                        No projects yet. Create your first one to get started!
                                    </p>
                                </Card>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
