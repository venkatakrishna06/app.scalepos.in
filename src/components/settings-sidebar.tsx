import {Link, useLocation} from 'react-router-dom';
import {
  ChevronRight, 
  Percent, 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Store, 
  HelpCircle
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAuthStore} from '@/lib/store/auth.store';

const settingsNavigation = [
  { 
    name: 'Profile', 
    href: '/settings/profile', 
    icon: User, 
    description: 'Manage your personal information',
    roles: ['admin', 'manager', 'kitchen', 'server', 'staff', 'user'] 
  },
  { 
    name: 'GST Settings', 
    href: '/settings/gst', 
    icon: Percent, 
    description: 'Configure tax rates and settings',
    roles: ['admin'] 
  },
  // These are placeholder items that could be implemented in the future
  // {
  //   name: 'Security',
  //   href: '/settings/security',
  //   icon: Shield,
  //   description: 'Manage account security settings',
  //   roles: ['admin', 'manager', 'kitchen', 'server', 'staff', 'user'],
  //   disabled: true
  // },
  // {
  //   name: 'Notifications',
  //   href: '/settings/notifications',
  //   icon: Bell,
  //   description: 'Configure notification preferences',
  //   roles: ['admin', 'manager', 'kitchen', 'server', 'staff', 'user'],
  //   disabled: true
  // },
  // {
  //   name: 'Billing',
  //   href: '/settings/billing',
  //   icon: CreditCard,
  //   description: 'Manage billing and subscription',
  //   roles: ['admin'],
  //   disabled: true
  // },
  // {
  //   name: 'Restaurant',
  //   href: '/settings/restaurant',
  //   icon: Store,
  //   description: 'Update restaurant information',
  //   roles: ['admin'],
  //   disabled: true
  // },
  // {
  //   name: 'Help & Support',
  //   href: '/settings/support',
  //   icon: HelpCircle,
  //   description: 'Get help with your account',
  //   roles: ['admin', 'manager', 'kitchen', 'server', 'staff', 'user'],
  //   disabled: true
  // },
];

export default function SettingsSidebar() {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <nav className="p-4 space-y-1">
        {settingsNavigation
          .filter(item => item.roles.includes(user?.role || ''))
          .map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.disabled ? '#' : item.href}
                className={cn(
                  "group flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted hover:text-foreground",
                  item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
                onClick={e => item.disabled && e.preventDefault()}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn(
                      "mr-3 h-4.5 w-4.5",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <div>
                    <div>{item.name}</div>
                    {isActive && (
                      <div className="text-xs font-normal mt-0.5 opacity-90">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
