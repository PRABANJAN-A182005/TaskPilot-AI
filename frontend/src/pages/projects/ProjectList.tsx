import { useEffect, useState } from 'react';
import { projectService } from '../../services/project.service';
import { authService } from '../../services/auth.service';
import { Project } from '../../types';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Filter, MoreVertical, Archive, Briefcase, Users, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function ProjectList() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await projectService.getProjects();
            setProjects(data);
        } catch (error) {
            console.error('Error loading projects', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleArchive = async (project: Project) => {
        try {
            await projectService.updateProject(project.id, { isArchived: !project.isArchived });
            loadProjects();
        } catch (error) {
            console.error('Failed to archive project', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            try {
                await projectService.deleteProject(id);
                loadProjects();
            } catch (error) {
                console.error('Failed to delete project', error);
            }
        }
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch =
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && project.progress < 100 && !project.isArchived) ||
            (statusFilter === 'completed' && project.progress === 100 && !project.isArchived) ||
            (statusFilter === 'archived' && project.isArchived);

        return matchesSearch && matchesStatus;
    });

    const user = authService.getCurrentUser();

    return (
        <div className='space-y-6'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900 sm:text-3xl'>Projects</h1>
                    <p className='mt-1 text-slate-500'>Manage and track all your active projects.</p>
                </div>
                <Link to='/projects/new'>
                    <Button>
                        <Plus className='mr-2 h-4 w-4' /> New Project
                    </Button>
                </Link>
            </div>

            <div className='flex flex-col sm:flex-row gap-3'>
                <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                    <input
                        type='text'
                        placeholder='Search projects...'
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className='w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500'
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className='h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
                    >
                        <option value='all'>All Projects</option>
                        <option value='active'>Active</option>
                        <option value='completed'>Completed</option>
                        <option value='archived'>Archived</option>
                    </select>
                </div>
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {filteredProjects.map(project => {
                    const isPending = project.members?.some(m => m.userId === user?.id && m.status === 'PENDING');
                    const isOwner = project.userId === user?.id;
                    const isAdmin =
                        isOwner ||
                        project.members?.some(
                            m => m.userId === user?.id && m.role === 'ADMIN' && m.status === 'JOINED'
                        );

                    return (
                        <Card
                            key={project.id}
                            className='flex flex-col group hover:shadow-lg transition-all border-slate-200'
                        >
                            <CardContent className='p-6 flex-1'>
                                <div className='flex justify-between items-start mb-4'>
                                    <Link
                                        to={`/projects/${project.id}`}
                                        className='hover:text-blue-600 transition-colors flex-1 min-w-0'
                                    >
                                        <div className='flex flex-col gap-1'>
                                            <div className='flex items-center gap-2'>
                                                <h3 className='text-lg font-bold text-slate-900 truncate'>
                                                    {project.name}
                                                </h3>
                                                {project.teamMode && (
                                                    <Users className='h-4 w-4 text-indigo-500 shrink-0' />
                                                )}
                                            </div>
                                            {isPending && (
                                                <div className='flex'>
                                                    <Badge
                                                        variant='warning'
                                                        className='text-[10px] py-0'
                                                    >
                                                        Pending Invitation
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className='flex items-center gap-1'>
                                        {isAdmin && (
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                className='h-8 w-8 p-0 text-slate-400 hover:text-rose-600'
                                                onClick={e => {
                                                    e.preventDefault();
                                                    handleDelete(project.id);
                                                }}
                                            >
                                                <Trash2 className='h-4 w-4' />
                                            </Button>
                                        )}
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            className='h-8 w-8 p-0'
                                        >
                                            <MoreVertical className='h-4 w-4' />
                                        </Button>
                                    </div>
                                </div>
                                <p className='text-sm text-slate-600 line-clamp-3 mb-6'>{project.description}</p>
                                <div className='space-y-2'>
                                    <div className='flex justify-between text-xs font-semibold'>
                                        <span className='text-slate-500'>Progress</span>
                                        <span className='text-slate-900'>{project.progress}%</span>
                                    </div>
                                    <ProgressBar
                                        value={project.progress}
                                        showLabel={false}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className='flex justify-between items-center py-4 bg-slate-50/50'>
                                <span className='text-[10px] font-medium text-slate-400 uppercase tracking-wider'>
                                    Updated {format(new Date(project.createdAt), 'MMM d')}
                                </span>
                                {isAdmin && (
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        className='h-8 text-slate-400 hover:text-slate-600'
                                        onClick={() => handleArchive(project)}
                                    >
                                        <Archive className='mr-1.5 h-3.5 w-3.5' />
                                        {project.isArchived ? 'Unarchive' : 'Archive'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {filteredProjects.length === 0 && !isLoading && (
                <div className='py-20 text-center'>
                    <div className='mx-auto h-12 w-12 text-slate-300 mb-4'>
                        <Briefcase className='h-full w-full' />
                    </div>
                    <h3 className='text-lg font-semibold text-slate-900'>No projects found</h3>
                    <p className='text-slate-500 mt-1'>
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your search or filters.'
                            : 'Get started by creating your first project.'}
                    </p>
                    <Link
                        to='/projects/new'
                        className='mt-4 inline-block'
                    >
                        <Button>Create Project</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
