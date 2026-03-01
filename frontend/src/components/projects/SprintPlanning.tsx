import React, { useEffect, useState } from 'react';
import { sprintService, Sprint } from '@/services/sprint.service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Calendar, Plus, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface SprintPlanningProps {
    projectId: string;
}

export const SprintPlanning: React.FC<SprintPlanningProps> = ({ projectId }) => {
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiPlan, setAiPlan] = useState<any>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newSprint, setNewSprint] = useState({
        name: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        goal: ''
    });

    useEffect(() => {
        fetchSprints();
        handleAiPlanning();
    }, [projectId]);

    const fetchSprints = async () => {
        setIsLoading(true);
        try {
            const data = await sprintService.getSprints(projectId);
            setSprints(data);
        } catch (error) {
            console.error('Failed to fetch sprints', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAiPlanning = async (refresh = false) => {
        if (refresh) setIsAiLoading(true);
        try {
            const data = await sprintService.getAiPlanning(projectId, refresh);
            setAiPlan(data);
        } catch (error) {
            console.error('AI Planning Error', error);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleCreateSprint = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sprintService.createSprint(projectId, newSprint);
            setShowCreate(false);
            setNewSprint({
                name: '',
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                goal: ''
            });
            fetchSprints();
        } catch (error) {
            console.error('Failed to create sprint', error);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-center'>
                <h3 className='text-xl font-bold text-gray-900'>Sprint Planning</h3>
                <div className='flex space-x-2'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleAiPlanning(false)}
                        disabled={isAiLoading}
                        className='flex items-center space-x-2'
                    >
                        {isAiLoading ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                        ) : (
                            <Sparkles className='w-4 h-4 text-indigo-500' />
                        )}
                        <span>AI Plan</span>
                    </Button>
                    <Button
                        size='sm'
                        className='flex items-center space-x-2'
                        onClick={() => setShowCreate(!showCreate)}
                    >
                        <Plus className='w-4 h-4' />
                        <span>{showCreate ? 'Cancel' : 'New Sprint'}</span>
                    </Button>
                </div>
            </div>

            {showCreate && (
                <Card className='p-4 border-indigo-200 bg-indigo-50/20'>
                    <form
                        onSubmit={handleCreateSprint}
                        className='space-y-4'
                    >
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-xs font-bold text-gray-500 uppercase mb-1'>
                                    Sprint Name
                                </label>
                                <Input
                                    required
                                    placeholder='e.g. Q1 Alpha Launch'
                                    value={newSprint.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setNewSprint({ ...newSprint, name: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-500 uppercase mb-1'>
                                    Sprint Goal
                                </label>
                                <Input
                                    placeholder='What is the objective?'
                                    value={newSprint.goal}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setNewSprint({ ...newSprint, goal: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-500 uppercase mb-1'>
                                    Start Date
                                </label>
                                <Input
                                    type='date'
                                    required
                                    value={newSprint.startDate}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setNewSprint({ ...newSprint, startDate: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-500 uppercase mb-1'>End Date</label>
                                <Input
                                    type='date'
                                    required
                                    value={newSprint.endDate}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setNewSprint({ ...newSprint, endDate: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className='flex justify-end'>
                            <Button type='submit'>Create Sprint</Button>
                        </div>
                    </form>
                </Card>
            )}

            {aiPlan && (
                <Card className='p-4 border-indigo-100 bg-indigo-50/30'>
                    <div className='flex justify-between items-center mb-3'>
                        <h4 className='font-semibold text-indigo-900 flex items-center'>
                            <Sparkles className='w-4 h-4 mr-2' /> AI Suggested Sprint Strategy
                        </h4>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleAiPlanning(true)}
                            disabled={isAiLoading}
                            className='h-8 w-8 p-0 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100'
                            title='Generate better plan'
                        >
                            <Loader2 className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                        <div className='bg-white p-3 rounded-lg shadow-sm'>
                            <p className='text-xs text-gray-500 uppercase font-bold'>Suggested Duration</p>
                            <p className='text-lg font-bold text-gray-800'>{aiPlan.suggestedDuration} Days</p>
                        </div>
                        <div className='bg-white p-3 rounded-lg shadow-sm'>
                            <p className='text-xs text-gray-500 uppercase font-bold'>Completion Prob.</p>
                            <p className='text-lg font-bold text-gray-800'>{aiPlan.completionProbability}%</p>
                        </div>
                        <div className='bg-white p-3 rounded-lg shadow-sm'>
                            <p className='text-xs text-gray-500 uppercase font-bold'>Key Dependency</p>
                            <p className='text-sm font-medium text-gray-700 truncate'>
                                {Object.keys(aiPlan.dependencyMap || {}).length > 0
                                    ? Object.keys(aiPlan.dependencyMap)[0]
                                    : 'None detected'}
                            </p>
                        </div>
                    </div>
                    <div className='space-y-2'>
                        <p className='text-sm font-medium text-gray-700'>Timeline Milestones:</p>
                        <div className='flex items-center space-x-2 overflow-x-auto pb-2'>
                            {aiPlan.timeline?.map((item: any, idx: number) => (
                                <React.Fragment key={idx}>
                                    <div className='flex-shrink-0 bg-white px-3 py-1 rounded-full text-xs font-medium border border-indigo-100 shadow-sm'>
                                        {item.milestone || item}
                                    </div>
                                    {idx < aiPlan.timeline.length - 1 && (
                                        <ArrowRight className='w-3 h-3 text-indigo-300' />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            <div className='grid grid-cols-1 gap-4'>
                {isLoading ? (
                    <div className='flex justify-center p-12'>
                        <Loader2 className='w-8 h-8 animate-spin text-indigo-500' />
                    </div>
                ) : sprints.length === 0 ? (
                    <div className='text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
                        <Calendar className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                        <h4 className='text-gray-500 font-medium'>No sprints planned yet</h4>
                        <p className='text-sm text-gray-400 mt-1'>
                            Start by creating your first sprint or use AI to plan.
                        </p>
                    </div>
                ) : (
                    sprints.map(sprint => (
                        <Card
                            key={sprint.id}
                            className='p-4 hover:shadow-md transition-shadow'
                        >
                            <div className='flex justify-between items-start'>
                                <div>
                                    <div className='flex items-center space-x-2'>
                                        <h4 className='font-bold text-gray-900'>{sprint.name}</h4>
                                        <Badge
                                            variant={
                                                sprint.status === 'Active'
                                                    ? 'success'
                                                    : sprint.status === 'Completed'
                                                      ? 'info'
                                                      : 'warning'
                                            }
                                        >
                                            {sprint.status}
                                        </Badge>
                                    </div>
                                    <p className='text-sm text-gray-500 mt-1'>{sprint.goal}</p>
                                </div>
                                <div className='text-right'>
                                    <p className='text-xs font-medium text-gray-500'>
                                        {format(new Date(sprint.startDate), 'MMM d')} -{' '}
                                        {format(new Date(sprint.endDate), 'MMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
