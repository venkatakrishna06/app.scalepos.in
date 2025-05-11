import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Coffee,
  ClipboardList,
  Calendar,
  Table2,
  UserCircle,
  Receipt,
  Tags,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth.store';

// Define navigation items with role-based access
const navigationWithRoles = [
  { name: 'Tables', href: '/tables', icon: Table2, roles: ['admin', 'manager', 'server'] },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'kitchen', 'server'] },
  { name: 'Orders', href: '/orders', icon: ClipboardList, roles: ['admin', 'manager', 'kitchen', 'server'] },
  { name: 'Menu', href: '/menu', icon: Coffee, roles: ['admin', 'manager', 'kitchen'] },
  { name: 'Categories', href: '/categories', icon: Tags, roles: ['admin', 'manager'] },
  { name: 'Reservations', href: '/reservations', icon: Calendar, roles: ['admin', 'manager'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['admin', 'manager'] },
  { name: 'Staff', href: '/staff', icon: UserCircle, roles: ['admin'] },
  { name: 'Payments', href: '/payments', icon: Receipt, roles: ['admin', 'manager'] },
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
      <div className="py-4 px-3 mt-16 md:mt-0"> {/* Add top margin on mobile to account for navbar */}
        <nav className="space-y-3 px-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
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
