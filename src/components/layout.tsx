import {ReactNode, useEffect, useState} from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import {MobileNav} from './MobileNav';
import {cn} from '@/lib/utils';
import {useWebSocket} from '@/hooks';
import {useAuthStore} from '@/lib/store/auth.store';
import {useMenuStore} from '@/lib/store/menu.store';
import {useTableStore} from '@/lib/store/table.store';
import {useStaffStore} from '@/lib/store/staff.store';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({children}: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const {isAuthenticated} = useAuthStore();
    const {fetchMenuItems, fetchCategories} = useMenuStore();
    const {fetchTables} = useTableStore();
    const {fetchStaff} = useStaffStore();

    // Initialize WebSocket connection
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {isConnected} = useWebSocket();

    // Fetch initial data after login
    useEffect(() => {
        if (isAuthenticated) {
            // Fetch all required data in parallel
            Promise.all([
                fetchMenuItems(),
                fetchCategories(),
                fetchTables(),
                fetchStaff()
            ]).catch(() => {
                // Handle fetch errors silently
            });
        }
    }, [isAuthenticated, fetchMenuItems, fetchCategories, fetchTables, fetchStaff]);

    // Check if we're on mobile when component mounts
    useEffect(() => {
        const checkIfMobile = () => {
            const mobile = window.innerWidth < 1024; // Use lg breakpoint (1024px) instead of md
            setIsMobile(mobile);
            setIsSidebarOpen(false); // Keep sidebar closed by default on all devices
        };

        // Initial check
        checkIfMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkIfMobile);

        // Cleanup
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
                {/* Overlay - only visible when sidebar is open on mobile */}
                {isSidebarOpen && isMobile && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={toggleSidebar}
                    />
                )}

                {/* Sidebar - responsive width with independent scroll */}
                <div className={cn(
                    "flex-shrink-0 overflow-hidden bg-white dark:bg-gray-800",
                    "fixed lg:relative h-screen z-40 transition-all duration-300 ease-in-out",
                    isSidebarOpen
                        ? "lg:w-44 xl:w-52 w-[280px] translate-x-0 shadow-xl" // Visible when open
                        : "w-[280px] -translate-x-full lg:w-0 lg:translate-x-0" // Hidden on mobile, collapsed on desktop
                )}>
                    <Sidebar closeSidebar={toggleSidebar}/>
                </div>

                {/* Main content - scrolls independently */}
                <main className={cn(
                    "flex-1 overflow-y-auto transition-all duration-300 ease-in-out custom-scrollbar",
                    isSidebarOpen ? "" : "lg:pl-0", // Adjust padding when sidebar is closed
                    "pb-20 lg:pb-6" // Increased padding at the bottom for mobile nav to prevent overlap
                )}>
                    <div className={cn(
                        "mx-auto p-1 sm:p-2 lg:p-3",
                        isSidebarOpen ? "max-w-7xl" : "max-w-full" // Adjust max width based on sidebar state
                    )}>
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Navigation - only visible on mobile */}
            {isMobile && (
                <MobileNav/>
            )}
        </div>
    );
}
