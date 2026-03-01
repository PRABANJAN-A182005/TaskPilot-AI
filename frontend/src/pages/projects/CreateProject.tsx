import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/project.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { ChevronLeft, Rocket } from 'lucide-react';

export default function CreateProject() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [teamMode, setTeamMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const project = await projectService.createProject({
                name,
                description,
                teamMode
            } as any);
            navigate(`/projects/${project.id}`);
        } catch (error) {
            console.error('Failed to create project', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='max-w-2xl mx-auto space-y-6'>
            <div className='flex items-center gap-4'>
                <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => navigate('/projects')}
                >
                    <ChevronLeft className='h-4 w-4 mr-1' /> Back
                </Button>
                <h1 className='text-2xl font-bold text-slate-900'>Create New Project</h1>
            </div>

            <Card>
                <CardContent className='p-8'>
                    <form
                        onSubmit={handleSubmit}
                        className='space-y-6'
                    >
                        <Input
                            label='Project Name'
                            placeholder='e.g. Q4 Marketing Campaign'
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                        <div className='space-y-1.5'>
                            <label className='text-sm font-medium text-slate-700'>Description</label>
                            <textarea
                                className='flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[150px]'
                                placeholder='Describe the goals and scope of this project...'
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className='flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-100'>
                            <input
                                type='checkbox'
                                id='teamMode'
                                className='h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500'
                                checked={teamMode}
                                onChange={e => setTeamMode(e.target.checked)}
                            />
                            <label
                                htmlFor='teamMode'
                                className='text-sm font-medium text-blue-900 cursor-pointer'
                            >
                                Enable Team Collaboration Mode
                            </label>
                        </div>

                        <div className='pt-4 border-t border-slate-100 flex justify-end gap-3'>
                            <Button
                                variant='ghost'
                                type='button'
                                onClick={() => navigate('/projects')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type='submit'
                                isLoading={isLoading}
                            >
                                <Rocket className='mr-2 h-4 w-4' /> Launch Project
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
