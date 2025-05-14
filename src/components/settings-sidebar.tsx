import {Link, useLocation} from 'react-router-dom';
import {ChevronRight, Percent, User,} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAuthStore} from '@/lib/store/auth.store';

const settingsNavigation = [
  { name: 'Profile', href: '/settings/profile', icon: User, roles: ['admin', 'manager', 'kitchen', 'server', 'staff', 'user'] },
  { name: 'GST Settings', href: '/settings/gst', icon: Percent, roles: ['admin'] },
];

export default function SettingsSidebar() {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden border-r">
      <div className=" px-3">

        <nav className="space-y-2 px-1">
          {settingsNavigation
            .filter(item => item.roles.includes(user?.role || ''))
            .map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
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
