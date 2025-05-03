import { PropsWithChildren, useState } from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps extends PropsWithChildren {
  orderType: 'dine-in' | 'takeaway' | 'orders';
  onOrderTypeChange: (type: 'dine-in' | 'takeaway' | 'orders') => void;
}

export default function Layout({ children, orderType, onOrderTypeChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar orderType={orderType} onOrderTypeChange={onOrderTypeChange}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-4"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </Navbar>
      <div className="flex">
        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0'
          }`}
        >
          <Sidebar isOpen={sidebarOpen} />
        </div>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}