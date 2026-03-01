import { useEffect, useState } from 'react';
import { taskService } from '../services/task.service';
import { Task } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CheckCircle2, Circle, Calendar, Flag, Search, Filter } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { clsx } from 'clsx';

export default function AllTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await taskService.getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Error loading tasks', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTaskStatus = async (task: Task) => {
        try {
            const newStatus = task.status === 'Complete' ? 'Todo' : 'Complete';
            const updated = await taskService.updateTask(task.id, { status: newStatus as any });
            setTasks(tasks.map(t => (t.id === task.id ? updated : t)));
        } catch (error) {
            console.error('Failed to toggle task status', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesSearch && matchesPriority && matchesStatus;
    });

    return (
        <div className='space-y-6'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900 sm:text-3xl'>All Tasks</h1>
                    <p className='mt-1 text-slate-500'>View and manage tasks across all your projects.</p>
                </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-3'>
                <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                    <input
                        type='text'
                        placeholder='Search all tasks...'
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className='w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <select
                        value={priorityFilter}
                        onChange={e => setPriorityFilter(e.target.value)}
                        className='h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
                    >
                        <option value='all'>All Priorities</option>
                        <option value='High'>High</option>
                        <option value='Medium'>Medium</option>
                        <option value='Low'>Low</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className='h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
                    >
                        <option value='all'>All Status</option>
                        <option value='Todo'>Todo</option>
                        <option value='In Progress'>In Progress</option>
                        <option value='Complete'>Complete</option>
                    </select>
                </div>
            </div>

            <div className='space-y-3'>
                {filteredTasks.map(task => {
                    const isOverdue =
                        task.status !== 'Complete' && task.deadline && isBefore(parseISO(task.deadline), new Date());

                    return (
                        <Card
                            key={task.id}
                            className='hover:border-slate-300 transition-all'
                        >
                            <CardContent className='p-4 flex items-center gap-4'>
                                <button
                                    onClick={() => toggleTaskStatus(task)}
                                    className='flex-shrink-0'
                                >
                                    {task.status === 'Complete' ? (
                                        <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                                    ) : (
                                        <Circle className='h-5 w-5 text-slate-300 hover:text-blue-500' />
                                    )}
                                </button>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1'>
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
                                    <div className='flex items-center gap-4 text-xs text-slate-500'>
                                        <div className='flex items-center gap-1 font-medium text-blue-600'>
                                            Project ID: {task.projectId}
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <Calendar className='h-3.5 w-3.5' />
                                            {task.deadline ? format(parseISO(task.deadline), 'MMM d') : 'No deadline'}
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <Flag className='h-3.5 w-3.5' />
                                            {task.subtasks.length}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {filteredTasks.length === 0 && !isLoading && (
                    <div className='text-center py-20 bg-white rounded-xl border border-dashed border-slate-200'>
                        <p className='text-slate-500'>
                            {searchQuery || priorityFilter !== 'all' || statusFilter !== 'all'
                                ? 'No tasks found matching your filters.'
                                : 'No tasks found. Create a project to add tasks!'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
