import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks';
import { useAuthStore } from '@/lib/auth/auth.store';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { isAuthenticated } = useAuthStore();
    useWebSocket();

    useEffect(() => {
        const checkIfMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            setIsSidebarOpen(false);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            <Navbar
                toggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
            />

            <div className="flex flex-1 overflow-hidden">
                {isSidebarOpen && isMobile && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={toggleSidebar}
                    />
                )}

                <div className={cn(
                    "flex-shrink-0 overflow-hidden bg-white dark:bg-gray-800",
                    "fixed lg:relative h-screen z-40 transition-all duration-300 ease-in-out",
                    isSidebarOpen
                        ? "lg:w-44 xl:w-52 w-[280px] translate-x-0 shadow-xl"
                        : "w-[280px] -translate-x-full lg:w-0 lg:translate-x-0"
                )}>
                    <Sidebar closeSidebar={toggleSidebar} />
                </div>

                <main className={cn(
                    "flex-1 overflow-y-auto transition-all duration-300 ease-in-out custom-scrollbar",
                    isSidebarOpen ? "" : "lg:pl-0",
                    "pb-20 lg:pb-6"
                )}>
                    <div className={cn(
                        "mx-auto p-1 sm:p-2 lg:p-3",
                        isSidebarOpen ? "max-w-7xl" : "max-w-full"
                    )}>
                        {children}
                    </div>
                </main>
            </div>

            {isMobile && (
                <MobileNav />
            )}
        </div>
    );
}
