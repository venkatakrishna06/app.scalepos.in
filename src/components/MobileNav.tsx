import {useNavigate} from 'react-router-dom';
import {ClipboardList, LayoutDashboard, Menu as MenuIcon, ShoppingBag, Table2} from 'lucide-react';
import {useOrderStore} from '@/lib/store';
import {usePermissions} from '@/hooks/usePermissions';

interface MobileNavProps {
  toggleSidebar: () => void;
}

export function MobileNav({ toggleSidebar }: MobileNavProps) {
  const navigate = useNavigate();
  const { orders } = useOrderStore();
  const { canManageTables, canCreateOrders, canViewOrders } = usePermissions();

  // Count active orders by type
  const activeOrders = orders.filter(order => order.status !== 'paid' && order.status !== 'cancelled');
  const dineInCount = activeOrders.filter(order => order.order_type === 'dine-in').length;
  const takeawayCount = activeOrders.filter(order => order.order_type === 'takeaway').length;
  const totalActiveCount = activeOrders.length;

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
            {dineInCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {dineInCount}
              </span>
            )}
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
            {takeawayCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {takeawayCount}
              </span>
            )}
          </div>
          <span className="mt-1 text-[10px]">Takeaway</span>
        </button>

        <button
          className="flex flex-1 flex-col items-center justify-center h-full"
          onClick={() => navigate('/dashboard')}
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
            {totalActiveCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {totalActiveCount}
              </span>
            )}
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
