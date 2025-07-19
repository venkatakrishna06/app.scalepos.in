import {useLocation, useNavigate} from 'react-router-dom';
import {ClipboardList, LayoutDashboard, Receipt, ShoppingBag, Table2} from 'lucide-react';
import {usePermissions} from '@/hooks/usePermissions';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';


export function MobileNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const {canManageTables, canCreateOrders, canViewOrders, isAdmin} = usePermissions();

    // Check if a route is active
    const isRouteActive = (path: string) => location.pathname === path;

    return (
        <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg"
            initial={{y: 100}}
            animate={{y: 0}}
            transition={{type: "spring", stiffness: 300, damping: 30}}
        >
            <div className="flex h-16 items-center justify-around px-1">
                <NavButton
                    icon={<Table2 className="h-5 w-5"/>}
                    label="Tables"
                    onClick={() => navigate('/tables')}
                    disabled={!canManageTables}
                    isActive={isRouteActive('/tables')}
                />

                <NavButton
                    icon={<ShoppingBag className="h-5 w-5"/>}
                    label="Takeaway"
                    onClick={() => navigate('/takeaway')}
                    disabled={!canCreateOrders}
                    isActive={isRouteActive('/takeaway')}
                />

                <NavButton
                    icon={<Receipt className="h-5 w-5"/>}
                    label="QuikBill"
                    onClick={() => navigate('/quick-bill')}
                    disabled={!canCreateOrders}
                    isActive={isRouteActive('/quick-bill')}
                />

                <NavButton
                    icon={<ClipboardList className="h-5 w-5"/>}
                    label="Orders"
                    onClick={() => navigate('/orders')}
                    disabled={!canViewOrders}
                    isActive={isRouteActive('/orders')}
                />

                {isAdmin && (
                    <NavButton
                        icon={<LayoutDashboard className="h-5 w-5"/>}
                        label="Dashboard"
                        onClick={() => navigate('/dashboard')}
                        isActive={isRouteActive('/dashboard')}
                    />
                )}

            </div>
        </motion.div>
    );
}

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    isActive?: boolean;
}

function NavButton({icon, label, onClick, disabled = false, isActive = false}: NavButtonProps) {
    return (
        <motion.button
            className={cn(
                "flex flex-1 flex-col items-center justify-center h-full relative",
                "transition-all duration-200 ease-in-out",
                isActive
                    ? "text-primary"
                    : "text-foreground hover:text-primary/80",
                disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={onClick}
            disabled={disabled}
            whileTap={{scale: 0.95}}
            whileHover={{y: -2}}
        >
            <div className="relative">
                <motion.div
                    initial={{scale: 1}}
                    animate={{scale: isActive ? 1.1 : 1}}
                    transition={{type: "spring", stiffness: 500, damping: 30}}
                >
                    {icon}
                </motion.div>
                {isActive && (
                    <motion.span
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                        layoutId="activeIndicator"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.2}}
                    />
                )}
            </div>
            <span className="mt-1 text-xs font-medium">{label}</span>
        </motion.button>
    );
}
