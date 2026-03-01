import React, { useEffect, useState } from 'react';
import { notificationService, Notification } from '@/services/notification.service';
import { Bell, Check, Info, AlertTriangle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
            const { count } = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n => (n.id === id ? { ...n, isRead: true } : n)));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS':
                return <Check className='w-4 h-4 text-green-500' />;
            case 'WARNING':
                return <AlertTriangle className='w-4 h-4 text-yellow-500' />;
            case 'ERROR':
                return <XCircle className='w-4 h-4 text-red-500' />;
            default:
                return <Info className='w-4 h-4 text-blue-500' />;
        }
    };

    return (
        <div className='relative'>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='relative p-2 text-gray-600 hover:text-indigo-600 focus:outline-none'
            >
                <Bell className='w-6 h-6' />
                {unreadCount > 0 && (
                    <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full'>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className='fixed inset-0 z-40'
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-100'>
                        <div className='p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center'>
                            <span className='font-semibold text-sm text-gray-700'>Notifications</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className='text-gray-400 hover:text-gray-600'
                            >
                                <Check className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='max-h-96 overflow-y-auto'>
                            {notifications.length === 0 ? (
                                <div className='p-8 text-center text-gray-400 text-sm'>No notifications yet</div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`p-4 border-b border-gray-50 flex space-x-3 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
                                        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                                    >
                                        <div className='mt-1'>{getIcon(n.type)}</div>
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm font-medium text-gray-900 truncate'>{n.title}</p>
                                            <p className='text-xs text-gray-500 line-clamp-2 mt-0.5'>{n.content}</p>
                                            <p className='text-[10px] text-gray-400 mt-1'>
                                                {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                                            </p>
                                        </div>
                                        {!n.isRead && <div className='w-2 h-2 bg-indigo-500 rounded-full mt-2'></div>}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className='p-2 border-t border-gray-100 text-center'>
                            <button className='text-xs text-indigo-600 font-medium hover:text-indigo-800'>
                                View all notifications
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
