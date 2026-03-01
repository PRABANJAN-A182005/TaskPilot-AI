import React from 'react';
import { Task, TaskStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
    { id: 'Backlog', title: 'Backlog' },
    { id: 'Todo', title: 'Todo' },
    { id: 'In-Progress', title: 'In Progress' },
    { id: 'Review', title: 'Review' },
    { id: 'Complete', title: 'Completed' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskMove }) => {
    const onDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent, status: TaskStatus) => {
        const taskId = e.dataTransfer.getData('taskId');
        onTaskMove(taskId, status);
    };

    return (
        <div className='flex space-x-4 overflow-x-auto pb-4'>
            {COLUMNS.map(column => (
                <div
                    key={column.id}
                    className='flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4'
                    onDragOver={onDragOver}
                    onDrop={e => onDrop(e, column.id)}
                >
                    <div className='flex items-center justify-between mb-4'>
                        <h3 className='font-semibold text-gray-700'>{column.title}</h3>
                        <span className='bg-gray-200 text-gray-600 text-xs font-medium px-2 py-1 rounded-full'>
                            {tasks.filter(t => t.status === column.id).length}
                        </span>
                    </div>

                    <div className='space-y-3'>
                        {tasks
                            .filter(task => {
                                const s = task.status;
                                if (column.id === 'Todo' && (s === 'Todo' || !s)) return true;
                                return s === column.id;
                            })
                            .map(task => (
                                <Card
                                    key={task.id}
                                    className='p-3 cursor-move hover:shadow-md transition-shadow'
                                    draggable
                                    onDragStart={e => onDragStart(e, task.id)}
                                >
                                    <div className='flex flex-col space-y-2'>
                                        <div className='flex justify-between items-start'>
                                            <h4 className='text-sm font-medium text-gray-900'>{task.title}</h4>
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

                                        <p className='text-xs text-gray-500 line-clamp-2'>{task.description}</p>

                                        <div className='flex justify-between items-center pt-2'>
                                            <span className='text-[10px] text-gray-400'>
                                                {task.deadline
                                                    ? format(new Date(task.deadline), 'MMM d')
                                                    : 'No deadline'}
                                            </span>
                                            {task.assignedTo && (
                                                <div className='flex items-center space-x-1'>
                                                    <span className='text-[10px] text-gray-500'>
                                                        {task.assignedTo.name}
                                                    </span>
                                                    <img
                                                        src={
                                                            task.assignedTo.avatar ||
                                                            `https://ui-avatars.com/api/?name=${task.assignedTo.name}`
                                                        }
                                                        alt={task.assignedTo.name}
                                                        className='w-5 h-5 rounded-full'
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
