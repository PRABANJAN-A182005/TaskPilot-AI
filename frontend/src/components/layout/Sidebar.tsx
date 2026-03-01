import { LayoutDashboard, Briefcase, CheckSquare, Settings, LogOut, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Briefcase, label: 'Projects', path: '/projects' },
        { icon: CheckSquare, label: 'All Tasks', path: '/tasks' },
        { icon: Settings, label: 'Settings', path: '/settings' }
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={clsx(
                    'fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden',
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed inset-y-0 left-0 z-50 w-72 transform bg-sidebar border-r border-border transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className='flex h-16 items-center justify-between px-6 border-b border-border'>
                    <div className='flex items-center gap-2'>
                        <span className='text-xl font-bold tracking-tight text-foreground'>
                            TaskPilot <span className='text-primary'>AI</span>
                        </span>
                    </div>
                    <Button
                        variant='ghost'
                        size='sm'
                        className='lg:hidden'
                        onClick={onClose}
                    >
                        <X className='h-5 w-5' />
                    </Button>
                </div>

                <div className='flex flex-col justify-between h-[calc(100%-64px)] p-4'>
                    <nav className='space-y-1'>
                        {navItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => onClose()}
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group',
                                        isActive
                                            ? 'bg-primary/10 text-primary shadow-sm'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )
                                }
                            >
                                <item.icon className='h-5 w-5' />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className='pt-4 border-t border-slate-100'>
                        <Button
                            variant='ghost'
                            className='w-full justify-start gap-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                            onClick={handleLogout}
                        >
                            <LogOut className='h-5 w-5' />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
};
