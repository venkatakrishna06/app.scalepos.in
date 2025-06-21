import {useLocation, useNavigate} from 'react-router-dom';
import {
  ClipboardList, 
  Coffee, 
  LayoutDashboard, 
  Menu as MenuIcon, 
  ShoppingBag, 
  Table2, 
  X
} from 'lucide-react';
import {usePermissions} from '@/hooks/usePermissions';
import {cn} from '@/lib/utils';

interface MobileNavProps {
  toggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

export function MobileNav({ toggleSidebar, isSidebarOpen }: MobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canManageTables, canCreateOrders, canViewOrders, isAdmin } = usePermissions();

  // Check if a route is active
  const isRouteActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
      <div className="flex h-16 items-center justify-around">
        <NavButton 
          icon={<Table2 className="h-6 w-6" />} 
          label="Tables" 
          onClick={() => navigate('/tables')}
          disabled={!canManageTables}
          isActive={isRouteActive('/tables')}
        />

        <NavButton 
          icon={<ShoppingBag className="h-6 w-6" />} 
          label="Takeaway" 
          onClick={() => navigate('/takeaway')}
          disabled={!canCreateOrders}
          isActive={isRouteActive('/takeaway')}
        />

        {isAdmin && (
          <NavButton 
            icon={<LayoutDashboard className="h-6 w-6" />} 
            label="Dashboard" 
            onClick={() => navigate('/dashboard')}
            isActive={isRouteActive('/dashboard')}
          />
        )}

        <NavButton 
          icon={<ClipboardList className="h-6 w-6" />} 
          label="Orders" 
          onClick={() => navigate('/orders')}
          disabled={!canViewOrders}
          isActive={isRouteActive('/orders')}
        />

        <NavButton 
          icon={<Coffee className="h-6 w-6" />} 
          label="Menu" 
          onClick={() => navigate('/menu')}
          isActive={isRouteActive('/menu')}
        />

        <NavButton 
          icon={isSidebarOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />} 
          label="More" 
          onClick={toggleSidebar}
          isActive={isSidebarOpen}
        />
      </div>
    </div>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

function NavButton({ icon, label, onClick, disabled = false, isActive = false }: NavButtonProps) {
  return (
    <button
      className={cn(
        "flex flex-1 flex-col items-center justify-center h-full relative",
        "transition-colors duration-200 ease-in-out",
        isActive 
          ? "text-primary" 
          : "text-foreground hover:text-primary/80",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="relative">
        {icon}
        {isActive && (
          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </div>
      <span className="mt-1 text-xs font-medium">{label}</span>
    </button>
  );
}
