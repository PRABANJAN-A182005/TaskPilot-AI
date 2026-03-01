import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shareService } from '@/services/share.service';
import { Project, Task } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function PublicProjectView() {
    const { token } = useParams<{ token: string }>();
    const [project, setProject] = useState<(Project & { tasks: Task[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            loadSharedProject(token);
        }
    }, [token]);

    const loadSharedProject = async (t: string) => {
        try {
            const data = await shareService.getSharedProject(t);
            setProject(data);
        } catch {
            setError('Project not found or shared link has expired.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading)
        return <div className='flex items-center justify-center min-h-screen'>Loading shared project...</div>;
    if (error || !project)
        return (
            <div className='flex items-center justify-center min-h-screen text-red-500'>
                {error || 'Project not found'}
            </div>
        );

    return (
        <div className='max-w-4xl mx-auto py-12 px-4 space-y-8'>
            <div className='text-center space-y-4'>
                <Badge
                    variant='default'
                    className='bg-indigo-100 text-indigo-700'
                >
                    Client View Mode
                </Badge>
                <h1 className='text-4xl font-bold text-gray-900'>{project.name}</h1>
                <p className='text-gray-500 max-w-2xl mx-auto'>{project.description}</p>
            </div>

            <Card>
                <CardContent className='p-6'>
                    <div className='flex justify-between items-center mb-4'>
                        <span className='font-semibold text-gray-700'>Overall Progress</span>
                        <span className='font-bold text-indigo-600 text-xl'>{project.progress}%</span>
                    </div>
                    <ProgressBar
                        value={project.progress}
                        className='h-4'
                    />
                </CardContent>
            </Card>

            <div className='space-y-4'>
                <h2 className='text-2xl font-bold text-gray-900'>Project Tasks</h2>
                <div className='grid gap-4'>
                    {project.tasks.map(task => (
                        <Card
                            key={task.id}
                            className='hover:shadow-md transition-shadow'
                        >
                            <div className='p-4 flex items-start gap-4'>
                                <div className='mt-1'>
                                    {task.status === 'Complete' ? (
                                        <CheckCircle2 className='w-5 h-5 text-green-500' />
                                    ) : (
                                        <Circle className='w-5 h-5 text-gray-300' />
                                    )}
                                </div>
                                <div className='flex-1'>
                                    <div className='flex justify-between items-start'>
                                        <h3
                                            className={`font-semibold ${task.status === 'Complete' ? 'line-through text-gray-400' : 'text-gray-900'}`}
                                        >
                                            {task.title}
                                        </h3>
                                        <Badge
                                            variant={
                                                task.priority === 'High'
                                                    ? 'danger'
                                                    : task.priority === 'Medium'
                                                      ? 'warning'
                                                      : 'info'
                                            }
                                        >
                                            {task.priority}
                                        </Badge>
                                    </div>
                                    <div className='flex items-center gap-4 mt-2 text-xs text-gray-400'>
                                        <div className='flex items-center gap-1'>
                                            <Calendar className='w-3.5 h-3.5' />
                                            {task.deadline
                                                ? format(parseISO(task.deadline), 'MMM d, yyyy')
                                                : 'No deadline'}
                                        </div>
                                        <div>{task.status}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <footer className='text-center pt-12 text-sm text-gray-400'>
                Generated by TaskPilot AI • Secure Read-Only Link
            </footer>
        </div>
    );
}
