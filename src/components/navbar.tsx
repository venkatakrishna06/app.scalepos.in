import { Bell, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps extends PropsWithChildren {
  orderType: 'dine-in' | 'takeaway' | 'orders';
  onOrderTypeChange: (type: 'dine-in' | 'takeaway' | 'orders') => void;
}

export default function Navbar({ children, orderType, onOrderTypeChange }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleOrderTypeChange = (type: 'dine-in' | 'takeaway' | 'orders') => {
    onOrderTypeChange(type);
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  };

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-4">
            {children}
            <div className="flex items-center gap-2">
              <Button
                variant={orderType === 'dine-in' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleOrderTypeChange('dine-in')}
              >
                Dine In
              </Button>
              <Button
                variant={orderType === 'takeaway' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleOrderTypeChange('takeaway')}
              >
                Takeaway
              </Button>
              <Button
                variant={orderType === 'orders' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleOrderTypeChange('orders')}
              >
                Orders
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="ml-4 flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}