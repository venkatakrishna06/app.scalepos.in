import {BarChart2, Bell, ClipboardList, LogOut, Menu, PlusCircle, Settings, ShoppingBag, Table2} from 'lucide-react';
import {Button} from './ui/button';
import {PropsWithChildren} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '@/lib/store/auth.store';
import {useOrderStore} from '@/lib/store';
import {ThemeToggle} from './theme/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps extends PropsWithChildren {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { orders } = useOrderStore();

  // Count active orders by type
  const activeOrders = orders.filter(order => order.status !== 'paid' && order.status !== 'cancelled');
  const dineInCount = activeOrders.filter(order => order.order_type === 'dine-in').length;
  const takeawayCount = activeOrders.filter(order => order.order_type === 'takeaway').length;
  const totalActiveCount = activeOrders.length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Mobile menu button - only visible on mobile */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Logo with increased left margin */}
              <div className="ml-4 flex items-center">
                <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-8 w-auto"
                    onClick={() => navigate('/dashboard')}
                    style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Order type buttons - hidden on small screens, visible on medium and larger screens */}
              <div className="hidden md:flex ml-4 lg:ml-12 items-center gap-1 sm:gap-2 rounded-full bg-muted p-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/tables')}
                    className="rounded-full text-xs sm:text-sm px-2 sm:px-4 h-8 relative"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>New Order</span>
                  {/*{dineInCount > 0 && (*/}
                  {/*  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">*/}
                  {/*    {dineInCount}*/}
                  {/*  </span>*/}
                  {/*)}*/}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/takeaway')}
                    className="rounded-full text-xs sm:text-sm px-2 sm:px-4 h-8 relative"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>Takeaway</span>
                  {/*{takeawayCount > 0 && (*/}
                  {/*  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">*/}
                  {/*    {takeawayCount}*/}
                  {/*  </span>*/}
                  {/*)}*/}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/orders')}
                    className="rounded-full text-xs sm:text-sm px-2 sm:px-4 h-8 relative"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>Orders</span>
                  {/*{totalActiveCount > 0 && (*/}
                  {/*  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">*/}
                  {/*    {totalActiveCount}*/}
                  {/*  </span>*/}
                  {/*)}*/}
                </Button>
              </div>

              {/* Order type dropdown - visible on small screens, hidden on medium and larger screens */}
              <div className="md:hidden ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 relative">
                      <Menu className="mr-2 h-4 w-4" />
                      <span>Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => navigate('/tables')}>
                      <div className="flex items-center">
                        <Table2 className="mr-2 h-4 w-4" />
                        <span>Dine In</span>
                        {dineInCount > 0 && (
                          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            {dineInCount}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/takeaway')}>
                      <div className="flex items-center">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>Takeaway</span>
                        {takeawayCount > 0 && (
                          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            {takeawayCount}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <div className="flex items-center">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>Orders</span>
                        {totalActiveCount > 0 && (
                          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            {totalActiveCount}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notifications - hidden on very small screens */}
              <Button variant="ghost" size="icon" className="hidden sm:flex relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>

              {/* Settings - hidden on very small screens */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="hidden sm:flex"
              >
                <Settings className="h-5 w-5" />
              </Button>

              {/* Theme toggle - hidden on very small screens */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* User dropdown - always visible */}
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
                  {/* Show settings in dropdown on small screens */}
                  <DropdownMenuItem onClick={() => navigate('/analytics')}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile
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
