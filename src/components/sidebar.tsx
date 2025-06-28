import {Link, useLocation} from 'react-router-dom';
import {
    BarChart2,
    ChevronRight,
    ClipboardList,
    Coffee,
    LayoutDashboard,
    Receipt,
    Settings,
    ShoppingBag,
    Table2,
    Tags,
    UserCircle,
    Users,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAuthStore} from '@/lib/store/auth.store';
import {Separator} from './ui/separator';

// Define navigation items with role-based access and categories
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  category: 'operations' | 'management' | 'admin';
  onClick?: () => void;
}

const navigationWithRoles: NavigationItem[] = [
  // Operations category
  { name: 'Tables', href: '/tables', icon: Table2, roles: ['admin', 'manager', 'server'], category: 'operations' },
  { name: 'Takeaway', href: '/takeaway', icon: ShoppingBag, roles: ['admin', 'manager', 'server'], category: 'operations' },
  { name: 'QuikBill', href: '/quick-bill', icon: Receipt, roles: ['admin', 'manager', 'server'], category: 'operations' },
  { name: 'Orders', href: '/orders', icon: ClipboardList, roles: ['admin', 'manager', 'kitchen', 'server'], category: 'operations' },

  // Management category
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin'], category: 'management' },
  { name: 'Menu', href: '/menu', icon: Coffee, roles: ['admin', 'manager', 'kitchen'], category: 'management' },
  { name: 'Categories', href: '/categories', icon: Tags, roles: ['admin', 'manager'], category: 'management' },
  { name: 'Payments', href: '/payments', icon: Receipt, roles: ['admin', 'manager'], category: 'management' },

  // Admin category
  { name: 'Staff', href: '/staff', icon: UserCircle, roles: ['admin'], category: 'admin' },
  { name: 'User Access', href: '/user-management', icon: Users, roles: ['admin'], category: 'admin' },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'manager'], category: 'admin' },
  { name: 'Analytics', href: '#', icon: BarChart2, roles: ['admin'], category: 'admin', onClick: () => {
    const analyticsUrl = import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:5174/';
    // Ensure the URL is absolute by checking if it starts with http:// or https://
    const absoluteUrl = analyticsUrl.startsWith('http://') || analyticsUrl.startsWith('https://') 
      ? analyticsUrl 
      : `https://${analyticsUrl}`;
    window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
  }},
];

interface SidebarProps {
  closeSidebar?: () => void;
}

export default function Sidebar({ closeSidebar }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();

  // Filter navigation items based on user role
  const filteredNavigation = navigationWithRoles.filter(
    item => item.roles.includes(user?.role || '')
  );

  // Group navigation items by category
  const operationsItems = filteredNavigation.filter(item => item.category === 'operations');
  const managementItems = filteredNavigation.filter(item => item.category === 'management');
  const adminItems = filteredNavigation.filter(item => item.category === 'admin');

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-y-auto overflow-x-hidden pt-0 custom-scrollbar">
      <div className="py-2 px-4">
        {/* Restaurant logo or name could go here */}
        <div className="mb-6 px-2">
          <h2 className="text-lg font-semibold text-foreground">Quick Quick</h2>
          <p className="text-xs text-muted-foreground">Restaurant Management</p>
        </div>

        <nav className="space-y-6">
          {/* Operations Section */}
          {operationsItems.length > 0 && (
            <div>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Operations
              </h3>
              <div className="space-y-1">
                {operationsItems.map((item) => (
                  <NavItem 
                    key={item.name}
                    item={item}
                    isActive={location.pathname === item.href}
                    closeSidebar={closeSidebar}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Management Section */}
          {managementItems.length > 0 && (
            <div>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Management
              </h3>
              <div className="space-y-1">
                {managementItems.map((item) => (
                  <NavItem 
                    key={item.name}
                    item={item}
                    isActive={location.pathname === item.href}
                    closeSidebar={closeSidebar}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Admin Section */}
          {adminItems.length > 0 && (
            <div>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administration
              </h3>
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <NavItem 
                    key={item.name}
                    item={item}
                    isActive={location.pathname === item.href}
                    closeSidebar={closeSidebar}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User info at bottom */}
        <div className="mt-auto pt-6">
          <Separator className="mb-4" />
          <div className="px-2 flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground mr-3">
              <span className="text-sm font-semibold">
                {user?.staff?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium">{user?.staff.name}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// NavItem component for better code organization
interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  closeSidebar?: () => void;
}

function NavItem({ item, isActive, closeSidebar }: NavItemProps) {
  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
    }

    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 1024 && closeSidebar) {
      closeSidebar();
    }
  };

  const content = (
    <div className="flex items-center w-full">
      <item.icon
        className={cn(
          "mr-3 h-5 w-5",
          isActive
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="truncate">{item.name}</span>
    </div>
  );

  const className = cn(
    "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors w-full",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-foreground hover:bg-muted hover:text-foreground"
  );

  if (item.onClick) {
    return (
      <button
        onClick={handleClick}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={item.href}
      onClick={handleClick}
      className={className}
    >
      {content}
      {isActive && <ChevronRight className="h-4 w-4 ml-2 opacity-70" />}
    </Link>
  );
}
