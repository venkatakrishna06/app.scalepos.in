import { PropsWithChildren, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './sidebar';
import Navbar from './navbar';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface LayoutProps extends PropsWithChildren {
  orderType: 'dine-in' | 'takeaway' | 'orders';
  onOrderTypeChange: (type: 'dine-in' | 'takeaway' | 'orders') => void;
}

export default function Layout({ children, orderType, onOrderTypeChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Handle responsive sidebar
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      setSidebarOpen(window.innerWidth >= 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar orderType={orderType} onOrderTypeChange={onOrderTypeChange}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </Navbar>
      
      <div className="flex">
        {/* Sidebar with overlay for mobile */}
        <div
          className={cn(
            "fixed inset-0 z-20 bg-black/50 lg:hidden",
            sidebarOpen ? "block" : "hidden"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition-transform duration-200 ease-in-out lg:static lg:transform-none dark:bg-gray-800",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar isOpen={true} />
        </div>

        {/* Main content */}
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-200 ease-in-out",
            sidebarOpen ? "lg:ml-64" : "ml-0",
            "p-4 lg:p-8"
          )}
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}