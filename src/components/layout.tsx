import {ReactNode, useEffect, useState} from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import {MobileNav} from './MobileNav';
import {cn} from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if we're on mobile when component mounts
  useEffect(() => {
    const checkIfMobile = () => {
      setIsSidebarOpen(window.innerWidth >= 768); // 768px is the md breakpoint in Tailwind
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
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Overlay - only visible when sidebar is open on mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden" 
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar - fixed width with independent scroll */}
        <div className={cn(
          "flex-shrink-0 overflow-hidden bg-white dark:bg-gray-800",
          "fixed md:relative h-screen z-40 transition-all duration-300 ease-in-out",
          "md:w-40", // Width on desktop
          isSidebarOpen 
            ? "w-[240px] translate-x-0 shadow-xl" // Width on mobile when open with shadow
            : "w-[240px] -translate-x-full md:translate-x-0" // Width on mobile when closed
        )}>
          <Sidebar closeSidebar={toggleSidebar} />
        </div>

        {/* Main content - scrolls independently */}
        <main className={cn(
          "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-0" : "ml-0",
          "pb-16 md:pb-0" // Add padding at the bottom for mobile nav
        )}>
          <div className="mx-auto max-w-7xl p-4">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav 
        toggleSidebar={toggleSidebar} 
      />
    </div>
  );
}
