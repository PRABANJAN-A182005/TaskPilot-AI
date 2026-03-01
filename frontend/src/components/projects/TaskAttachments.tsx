import React, { useState, useEffect } from 'react';
import { attachmentService, Attachment } from '@/services/attachment.service';
import { Paperclip, Download, Sparkles, Loader2, FileIcon } from 'lucide-react';
import { format } from 'date-fns';

interface TaskAttachmentsProps {
    taskId: string;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId }) => {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [aiSummary, setAiSummary] = useState<{ [id: string]: string }>({});
    const [summarizingId, setSummarizingId] = useState<string | null>(null);

    useEffect(() => {
        fetchAttachments();
    }, [taskId]);

    const fetchAttachments = async () => {
        try {
            const data = await attachmentService.getAttachments(taskId);
            setAttachments(data);
        } catch (error) {
            console.error('Failed to fetch attachments', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const newAttachment = await attachmentService.upload(taskId, file);
            setAttachments([newAttachment, ...attachments]);
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };

    const getSummary = async (id: string) => {
        setSummarizingId(id);
        try {
            const { summary } = await attachmentService.getAiSummary(id);
            setAiSummary({ ...aiSummary, [id]: summary });
        } catch (error) {
            console.error('Summary failed', error);
        } finally {
            setSummarizingId(null);
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h5 className='text-xs font-bold uppercase tracking-wider text-slate-400'>Attachments</h5>
                <label className='cursor-pointer'>
                    <input
                        type='file'
                        className='hidden'
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                    <div className='flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors'>
                        {isUploading ? <Loader2 className='w-3 h-3 animate-spin' /> : <Paperclip className='w-3 h-3' />}
                        <span>{isUploading ? 'Uploading...' : 'Add File'}</span>
                    </div>
                </label>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {attachments.map(file => (
                    <div
                        key={file.id}
                        className='group relative flex flex-col p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-all hover:shadow-sm'
                    >
                        <div className='flex items-start justify-between mb-2'>
                            <div className='flex items-center space-x-3 overflow-hidden'>
                                <div className='p-2 bg-indigo-50 rounded text-indigo-600 shrink-0'>
                                    <FileIcon className='w-4 h-4' />
                                </div>
                                <div className='min-w-0'>
                                    <p
                                        className='text-sm font-medium text-slate-900 truncate'
                                        title={file.name}
                                    >
                                        {file.name}
                                    </p>
                                    <p className='text-[10px] text-slate-500'>
                                        {Math.round(file.size / 1024)} KB • {format(new Date(file.createdAt), 'MMM d')}
                                    </p>
                                </div>
                            </div>
                            <div className='flex space-x-1'>
                                <a
                                    href={file.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors'
                                >
                                    <Download className='w-3.5 h-3.5' />
                                </a>
                            </div>
                        </div>

                        {aiSummary[file.id] ? (
                            <div className='mt-1 p-2 bg-indigo-50/50 rounded text-[10px] text-slate-600 italic animate-in fade-in slide-in-from-top-1'>
                                <Sparkles className='w-2.5 h-2.5 inline mr-1 text-indigo-500' />
                                {aiSummary[file.id]}
                            </div>
                        ) : (
                            <button
                                onClick={() => getSummary(file.id)}
                                disabled={summarizingId === file.id}
                                className='mt-1 text-[10px] font-medium text-indigo-500 hover:text-indigo-700 flex items-center space-x-1'
                            >
                                {summarizingId === file.id ? (
                                    <Loader2 className='w-2.5 h-2.5 animate-spin' />
                                ) : (
                                    <Sparkles className='w-2.5 h-2.5' />
                                )}
                                <span>{summarizingId === file.id ? 'Summarizing...' : 'AI Summary'}</span>
                            </button>
                        )}
                    </div>
                ))}
                {!isLoading && attachments.length === 0 && (
                    <div className='col-span-full py-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200'>
                        No attachments for this task
                    </div>
                )}
            </div>
        </div>
    );
};
