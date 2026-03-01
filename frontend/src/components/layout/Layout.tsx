import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
    children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className='flex min-h-screen bg-slate-50'>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className='flex-1 flex flex-col min-w-0'>
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className='flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full'>{children}</main>
            </div>
        </div>
    );
};
