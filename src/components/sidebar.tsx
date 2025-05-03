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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Tables', href: '/tables', icon: Table2 },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: ClipboardList },
  { name: 'Menu', href: '/menu', icon: Coffee },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Reservations', href: '/reservations', icon: Calendar },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Staff', href: '/staff', icon: UserCircle },
  { name: 'Payments', href: '/payments', icon: Receipt },
];

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-64 flex-col border-r bg-white">
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center rounded-md px-2 py-2 text-sm font-medium',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-gray-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}