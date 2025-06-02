import {BarChart2, ClipboardList, LogOut, Menu, PlusCircle, Settings, ShoppingBag} from 'lucide-react';
import {Button} from './ui/button';
import {PropsWithChildren, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '@/lib/store/auth.store';
import {useRestaurantStore} from '@/lib/store/restaurant.store';
import {usePermissions} from '@/hooks/usePermissions';
import {ThemeToggle} from './theme/theme-toggle';
import {NotificationDropdown} from './notification-dropdown';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps extends PropsWithChildren {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isAdmin } = usePermissions();
  const { restaurant, fetchRestaurant } = useRestaurantStore();

  // Fetch restaurant information when component mounts
  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);



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

              {/* Restaurant name with increased left margin */}
              <div 
                className="ml-4 flex items-center"
                onClick={() => navigate(isAdmin ? '/dashboard' : '/tables')}
                style={{ cursor: 'pointer' }}
              >
                <h1 className="text-lg font-semibold">
                  {restaurant?.name || 'Restaurant'}
                </h1>
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

            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notifications - visible on all screen sizes */}
              <div className="flex relative">
                <NotificationDropdown />
              </div>

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
                  <Button  className="relative h-8 w-8 rounded-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full">
                      <span className="text-sm font-semibold">
                        {user?.staff.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/*<DropdownMenuLabel>*/}
                  {/*  <div className="flex flex-col space-y-1">*/}
                  {/*    <p className="text-sm font-medium leading-none">{user?.name}</p>*/}
                  {/*    <p className="text-xs leading-none text-muted-foreground">*/}
                  {/*      {user?.email}*/}
                  {/*    </p>*/}
                  {/*  </div>*/}
                  {/*</DropdownMenuLabel>*/}
                  {/*<DropdownMenuSeparator />*/}
                  {/* Show settings in dropdown on small screens */}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => {
                      window.open(import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:5174/', '_blank');
                    }}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Analytics
                    </DropdownMenuItem>
                  )}
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
