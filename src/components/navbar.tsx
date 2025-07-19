import {BarChart2, ClipboardList, LogOut, Menu, PlusCircle, Receipt, Settings, ShoppingBag, X} from 'lucide-react';
import {Button} from './ui/button';
import {PropsWithChildren, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuthStore} from '@/lib/store/auth.store';
import {useRestaurantStore} from '@/lib/store/restaurant.store';
import {usePermissions} from '@/hooks/usePermissions';
import {ThemeToggle} from './theme/theme-toggle';
import {NotificationDropdown} from './notification-dropdown';
import {cn} from '@/lib/utils';
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
    isSidebarOpen?: boolean;
}

export default function Navbar({toggleSidebar, isSidebarOpen}: NavbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const {user, logout} = useAuthStore();
    const {isAdmin, canCreateOrders, canViewOrders} = usePermissions();
    const {restaurant, fetchRestaurant} = useRestaurantStore();

    // Fetch restaurant information when component mounts
    useEffect(() => {
        fetchRestaurant();
    }, [fetchRestaurant]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Check if a route is active
    const isRouteActive = (path: string) => location.pathname === path;

    return (
        <nav
            className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <div className="container flex h-14 sm:h-16 items-center px-2 sm:px-4 lg:px-6">
                <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
                        {/* Mobile menu button - only visible on mobile */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden h-8 w-8 sm:h-9 sm:w-9"
                            onClick={toggleSidebar}
                            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            {isSidebarOpen ? (
                                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
                            ) : (
                                <Menu className="h-4 w-4 sm:h-5 sm:w-5"/>
                            )}
                        </Button>

                        {/* Desktop menu button - only visible on desktop */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden lg:flex h-8 w-8 sm:h-9 sm:w-9"
                            onClick={toggleSidebar}
                            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            {isSidebarOpen ? (
                                <Menu className="h-4 w-4 sm:h-5 sm:w-5 rotate-90"/>
                            ) : (
                                <Menu className="h-4 w-4 sm:h-5 sm:w-5"/>
                            )}
                        </Button>

                        {/* Restaurant name */}
                        <div
                            className="flex items-center"
                            onClick={() => navigate(isAdmin ? '/dashboard' : '/tables')}
                            style={{cursor: 'pointer'}}
                        >
                            <h1 className="text-base sm:text-lg font-semibold truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">
                                {restaurant?.name || 'Restaurant'}
                            </h1>
                        </div>

                        {/* Quick action buttons - responsive visibility */}
                        <div className="hidden md:flex items-center gap-1 sm:gap-2 rounded-lg bg-muted p-1">
                            {canCreateOrders && (
                                <>
                                    <Button
                                        variant={isRouteActive('/tables') ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => navigate('/tables')}
                                        className="rounded-md text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 relative"
                                    >
                                        <PlusCircle className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"/>
                                        <span className="hidden sm:inline">New Order</span>
                                        <span className="sm:hidden">Order</span>
                                    </Button>
                                    <Button
                                        variant={isRouteActive('/takeaway') ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => navigate('/takeaway')}
                                        className="rounded-md text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 relative"
                                    >
                                        <ShoppingBag className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"/>
                                        <span>Takeaway</span>
                                    </Button>
                                    <Button
                                        variant={isRouteActive('/quick-bill') ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => navigate('/quick-bill')}
                                        className="rounded-md text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 relative"
                                    >
                                        <Receipt className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/>
                                        <span className="hidden sm:inline">Quick Bill</span>
                                        <span className="sm:hidden">Bill</span>
                                    </Button>
                                </>
                            )}
                            {canViewOrders && (
                                <Button
                                    variant={isRouteActive('/orders') ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => navigate('/orders')}
                                    className="rounded-md text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 relative"
                                >
                                    <ClipboardList className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"/>
                                    <span>Orders</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 lg:gap-3">
                        {/* Notifications - visible on all screen sizes */}
                        <div className="flex relative">
                            <NotificationDropdown/>
                        </div>

                        {/* Settings - hidden on very small screens */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/settings')}
                            className="hidden xs:flex h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Settings"
                        >
                            <Settings className="h-4 w-4 sm:h-5 sm:w-5"/>
                        </Button>

                        {/* Theme toggle - hidden on very small screens */}

                        <ThemeToggle/>


                        {/* User dropdown - always visible */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className={cn(
                                    "relative rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                    "h-8 w-8 sm:h-9 sm:w-9"
                                )}>
                                    <div
                                        className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="text-xs sm:text-sm font-semibold">
                      {user?.staff.name?.charAt(0).toUpperCase()}
                    </span>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.staff.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator/>
                                {isAdmin && (
                                    <DropdownMenuItem onClick={() => {
                                        const analyticsUrl = import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:5174/';
                                        const absoluteUrl = analyticsUrl.startsWith('http://') || analyticsUrl.startsWith('https://')
                                            ? analyticsUrl
                                            : `https://${analyticsUrl}`;
                                        window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
                                    }}>
                                        <BarChart2 className="mr-2 h-4 w-4"/>
                                        Analytics
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => navigate('/settings')}>
                                    <Settings className="mr-2 h-4 w-4"/>
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/profile')}>
                                    <Settings className="mr-2 h-4 w-4"/>
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onClick={handleLogout}
                                                  className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4"/>
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
