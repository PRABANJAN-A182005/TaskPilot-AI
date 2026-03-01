import React, { useState } from 'react';
import { meetingService } from '@/services/meeting.service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FileText, Loader2, Sparkles, CheckCircle } from 'lucide-react';

interface MeetingAssistantProps {
    projectId: string;
    onTasksCreated: () => void;
}

export const MeetingAssistant: React.FC<MeetingAssistantProps> = ({ projectId, onTasksCreated }) => {
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ summary: string; actionItems: any[] } | null>(null);

    const handleSubmit = async () => {
        if (!notes.trim()) return;
        setIsLoading(true);
        try {
            const data = await meetingService.processMeetingNotes(projectId, notes);
            setResult(data);
            onTasksCreated();
        } catch (error) {
            console.error('Failed to process notes', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className='p-6'>
            <div className='flex items-center space-x-2 mb-4'>
                <div className='p-2 bg-indigo-100 rounded-lg'>
                    <FileText className='w-5 h-5 text-indigo-600' />
                </div>
                <div>
                    <h3 className='text-lg font-semibold text-gray-900'>AI Meeting Assistant</h3>
                    <p className='text-sm text-gray-500'>Paste your meeting notes to auto-generate tasks</p>
                </div>
            </div>

            {!result ? (
                <div className='space-y-4'>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder='Paste meeting notes here...'
                        className='w-full h-40 p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !notes.trim()}
                        className='w-full flex items-center justify-center space-x-2'
                    >
                        {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Sparkles className='w-4 h-4' />}
                        <span>{isLoading ? 'Processing with AI...' : 'Generate Tasks from Notes'}</span>
                    </Button>
                </div>
            ) : (
                <div className='space-y-4'>
                    <div className='p-4 bg-green-50 rounded-lg border border-green-100'>
                        <div className='flex items-center space-x-2 text-green-700 font-medium mb-2'>
                            <CheckCircle className='w-4 h-4' />
                            <span>AI Analysis Complete</span>
                        </div>
                        <p className='text-sm text-green-800'>{result.summary}</p>
                    </div>

                    <div>
                        <h4 className='text-sm font-semibold text-gray-700 mb-2'>
                            Action Items Created ({result.actionItems.length}):
                        </h4>
                        <ul className='space-y-2'>
                            {result.actionItems.map((item, idx) => (
                                <li
                                    key={idx}
                                    className='flex items-start space-x-2 text-sm text-gray-600'
                                >
                                    <div className='w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5'></div>
                                    <span>
                                        <strong>{item.title}</strong>
                                        {item.assigneeEmail && (
                                            <span className='text-gray-400 ml-1'>assigned to {item.assigneeEmail}</span>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Button
                        variant='outline'
                        onClick={() => {
                            setResult(null);
                            setNotes('');
                        }}
                        className='w-full'
                    >
                        Process Another Meeting
                    </Button>
                </div>
            )}
        </Card>
    );
};
