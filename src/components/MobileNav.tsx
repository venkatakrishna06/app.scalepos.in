import {useNavigate} from 'react-router-dom';
import {ClipboardList, LayoutDashboard, Menu as MenuIcon, ShoppingBag, Table2} from 'lucide-react';
import {usePermissions} from '@/hooks/usePermissions';

interface MobileNavProps {
  toggleSidebar: () => void;
}

export function MobileNav({ toggleSidebar }: MobileNavProps) {
  const navigate = useNavigate();
  const { canManageTables, canCreateOrders, canViewOrders, isAdmin } = usePermissions();


  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        <button
          className="flex flex-1 flex-col items-center justify-center h-full"
          onClick={() => canManageTables && navigate('/tables')}
          disabled={!canManageTables}
        >
          <div className="relative">
            <Table2 className="h-5 w-5" />
          </div>
          <span className="mt-1 text-[10px]">Tables</span>
        </button>

        <button
          className="flex flex-1 flex-col items-center justify-center h-full"
          onClick={() => canCreateOrders && navigate('/takeaway')}
          disabled={!canCreateOrders}
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <span className="mt-1 text-[10px]">Takeaway</span>
        </button>

        <button
          className="flex flex-1 flex-col items-center justify-center h-full"
          onClick={() => isAdmin && navigate('/dashboard')}
          disabled={!isAdmin}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="mt-1 text-[10px]">Dashboard</span>
        </button>

        <button
          className="flex flex-1 flex-col items-center justify-center h-full"
          onClick={() => canViewOrders && navigate('/orders')}
          disabled={!canViewOrders}
        >
          <div className="relative">
            <ClipboardList className="h-5 w-5" />

          </div>
          <span className="mt-1 text-[10px]">Orders</span>
        </button>

        <button
          className="flex flex-1 flex-col items-center justify-center h-full text-muted-foreground"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-5 w-5" />
          <span className="mt-1 text-[10px]">Menu</span>
        </button>
      </div>
    </div>
  );
}
