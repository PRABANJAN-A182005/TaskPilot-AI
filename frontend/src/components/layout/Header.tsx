import { Menu, Bell, User as UserIcon, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { useState, useEffect } from 'react';
import { authService } from '../../services/auth.service';
import { User } from '../../types';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
    const [user, setUser] = useState<User | null>(null);

    const loadUser = () => {
        setUser(authService.getCurrentUser());
    };

    useEffect(() => {
        loadUser();
        window.addEventListener('user-updated', loadUser);
        return () => window.removeEventListener('user-updated', loadUser);
    }, []);

    return (
        <header className='sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md'>
            <div className='flex h-16 items-center justify-between px-4 sm:px-6'>
                <div className='flex items-center gap-4'>
                    <Button
                        variant='ghost'
                        size='sm'
                        className='lg:hidden'
                        onClick={onMenuClick}
                    >
                        <Menu className='h-5 w-5' />
                    </Button>
                    <div className='hidden sm:flex relative max-w-md w-64 lg:w-96'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <input
                            type='text'
                            placeholder='Search tasks or projects...'
                            className='w-full pl-10 pr-4 py-2 text-sm bg-muted border-none rounded-lg focus:ring-2 focus:ring-primary transition-all'
                        />
                    </div>
                </div>

                <div className='flex items-center gap-2 sm:gap-4'>
                    <Button
                        variant='ghost'
                        size='sm'
                        className='relative'
                    >
                        <Bell className='h-5 w-5 text-muted-foreground' />
                        <span className='absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive border-2 border-background' />
                    </Button>
                    <div className='flex items-center gap-3 pl-2 sm:pl-4 border-l border-border'>
                        <div className='hidden sm:block text-right'>
                            <p className='text-xs font-semibold text-foreground'>{user?.name || 'User'}</p>
                            <p className='text-[10px] text-muted-foreground'>Active</p>
                        </div>
                        <div className='h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-background shadow-sm overflow-hidden'>
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className='h-full w-full object-cover'
                                />
                            ) : (
                                <UserIcon className='h-5 w-5' />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
