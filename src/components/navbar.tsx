import { Bell, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/auth.store';
import { ThemeToggle } from './theme/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps extends PropsWithChildren {
  orderType: 'dine-in' | 'takeaway' | 'orders';
  onOrderTypeChange: (type: 'dine-in' | 'takeaway' | 'orders') => void;
}

export default function Navbar({ children, orderType, onOrderTypeChange }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleOrderTypeChange = (type: 'dine-in' | 'takeaway' | 'orders') => {
    onOrderTypeChange(type);
    if(type === 'dine-in') {
        navigate('/tables');
        return
    }
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-4">
            {children}
            <div className="ml-10 hidden  items-center gap-2 rounded-full bg-muted p-1 lg:flex">
              <Button
                variant={orderType === 'dine-in' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleOrderTypeChange('dine-in')}
                className="rounded-full text-l px-4"
              >
                Dine In
              </Button>
              <Button
                variant={orderType === 'takeaway' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleOrderTypeChange('takeaway')}
                className="rounded-full px-4"
              >
                Takeaway
              </Button>
              <Button
                variant={orderType === 'orders' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleOrderTypeChange('orders')}
                className="rounded-full px-4"
              >
                Orders
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>
            
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <span className="text-sm font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}