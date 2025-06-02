import {Link, useLocation} from 'react-router-dom';
import {
    BarChart2,
    ChevronRight,
    ClipboardList,
    Coffee,
    LayoutDashboard,
    Receipt,
    Table2,
    Tags,
    UserCircle,
    Users,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAuthStore} from '@/lib/store/auth.store';

// Define navigation items with role-based access
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  onClick?: () => void;
}

const navigationWithRoles: NavigationItem[] = [
  { name: 'Tables', href: '/tables', icon: Table2, roles: ['admin', 'manager', 'server'] },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Orders', href: '/orders', icon: ClipboardList, roles: ['admin', 'manager', 'kitchen', 'server'] },
  { name: 'Menu', href: '/menu', icon: Coffee, roles: ['admin', 'manager', 'kitchen'] },
  { name: 'Categories', href: '/categories', icon: Tags, roles: ['admin', 'manager'] },
  { name: 'Staff', href: '/staff', icon: UserCircle, roles: ['admin'] },
  { name: 'Payments', href: '/payments', icon: Receipt, roles: ['admin', 'manager'] },
  { name: 'Analytics', href: '#', icon: BarChart2, roles: ['admin'], onClick: () => {
    window.open(import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:5174/', '_blank');
  }},
  { name: 'Access', href: '/user-management', icon: Users, roles: ['admin'] },
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
  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-y-auto overflow-x-hidden pt-0 md:pt-0">
      <div className="py-4 px-3 md:mt-0"> {/* Add top margin on mobile to account for navbar */}
        <nav className="space-y-3 px-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return item.onClick ? (
              <div
                key={item.name}
                onClick={() => {
                  // Execute custom onClick handler
                  item.onClick?.();
                  // Close sidebar on mobile when a link is clicked
                  if (window.innerWidth < 768 && closeSidebar) {
                    closeSidebar();
                  }
                }}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium transition-colors cursor-pointer",
                  "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn(
                      "mr-2 h-4 w-4",
                      "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.name}
                </div>
              </div>
            ) : (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  // Close sidebar on mobile when a link is clicked
                  if (window.innerWidth < 768 && closeSidebar) {
                    closeSidebar();
                  }
                }}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn(
                      "mr-2 h-4 w-4",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-3 w-3" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
