import React from 'react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {CheckCircle2, Loader2, Minus, Plus, XCircle} from 'lucide-react';
import {OrderItem as OrderItemType} from '@/types';
import {useRestaurant} from '@/api/restaurant';
import {usePermissions} from '@/hooks/usePermissions';
import {PERMISSIONS} from '@/lib/auth/roles';

interface OrderItemProps {
    item: OrderItemType;
    orderId: number;
    processingItemId: number | null;
    getStatusBadgeClass: (status: string) => string;
    handleQuantityChange: (orderId: number, itemId: number, delta: number, currentQuantity: number) => Promise<void>;
    handleItemStatusChange: (orderId: number, itemId: number, newStatus: string) => Promise<void>;
    handleCancelItem: (orderId: number, itemId: number) => Promise<void>;
}

export const OrderItemRow: React.FC<OrderItemProps> = ({
                                                           item,
                                                           orderId,
                                                           processingItemId,
                                                           getStatusBadgeClass,
                                                           handleQuantityChange,
                                                           handleItemStatusChange,
                                                           handleCancelItem
                                                       }) => {
    const {data: restaurant} = useRestaurant();
    const {hasPermission, isServer} = usePermissions();
    const isTrackingEnabled = restaurant?.enable_order_status_tracking || false;
    const showStatusBadge = isTrackingEnabled || item.status === 'cancelled';

    return (
        <tr key={item.id} className="border-b border-muted last:border-0">
            <td className="py-3">{item.name}</td>
            <td className="py-3">
                {item.status === 'placed' && hasPermission(PERMISSIONS.UPDATE_ORDER) ? (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(orderId, item.id, -1, item.quantity)}
                            disabled={processingItemId === item.id}
                        >
                            {processingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin"/>
                            ) : (
                                <Minus className="h-3 w-3"/>
                            )}
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(orderId, item.id, 1, item.quantity)}
                            disabled={processingItemId === item.id}
                        >
                            {processingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin"/>
                            ) : (
                                <Plus className="h-3 w-3"/>
                            )}
                        </Button>
                    </div>
                ) : (
                    item.quantity
                )}
            </td>
            <td className="py-3">₹{item?.price?.toFixed(2)}</td>
            <td className="py-3">₹{(item.quantity * item?.price)?.toFixed(2)}</td>
            <td className="py-3">
                {showStatusBadge && (
                    <Badge className={getStatusBadgeClass(item.status)}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                )}
            </td>
            <td className="py-3">
                {hasPermission(PERMISSIONS.UPDATE_ORDER) && item.status === 'placed' && (
                    <div className="flex items-center gap-2">
                        {!isServer() && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelItem(orderId, item.id)}
                                disabled={processingItemId === item.id || (item.allowed_next_states && !item.allowed_next_states.includes('cancelled'))}
                            >
                                {processingItemId === item.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                                ) : (
                                    <XCircle className="h-3 w-3 mr-1"/>
                                )}
                                Cancel
                            </Button>
                        )}
                        {isTrackingEnabled && hasPermission(PERMISSIONS.PREPARE_ORDER) && (
                            <Button
                                size="sm"
                                onClick={() => handleItemStatusChange(orderId, item.id, 'preparing')}
                                disabled={processingItemId === item.id || (item.allowed_next_states && !item.allowed_next_states.includes('preparing'))}
                            >
                                {processingItemId === item.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                                ) : (
                                    "Prepare"
                                )}
                            </Button>
                        )}
                    </div>
                )}
                {hasPermission(PERMISSIONS.PREPARE_ORDER) && isTrackingEnabled && item.status === 'preparing' && (
                    <Button
                        size="sm"
                        onClick={() => handleItemStatusChange(orderId, item.id, 'ready')}
                        disabled={processingItemId === item.id || (item.allowed_next_states && !item.allowed_next_states.includes('ready'))}
                    >
                        {processingItemId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                        ) : (
                            <CheckCircle2 className="h-3 w-3 mr-1"/>
                        )}
                        Mark Ready
                    </Button>
                )}
                {hasPermission(PERMISSIONS.SERVE_ORDER) && isTrackingEnabled && item.status === 'ready' && (
                    <Button
                        size="sm"
                        onClick={() => handleItemStatusChange(orderId, item.id, 'served')}
                        disabled={processingItemId === item.id || (item.allowed_next_states && !item.allowed_next_states.includes('served'))}
                    >
                        {processingItemId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                        ) : (
                            <CheckCircle2 className="h-3 w-3 mr-1"/>
                        )}
                        Mark Served
                    </Button>
                )}
            </td>
        </tr>
    );
};

export const OrderItemCard: React.FC<OrderItemProps> = ({
                                                            item,
                                                            orderId,
                                                            processingItemId,
                                                            getStatusBadgeClass,
                                                            handleQuantityChange,
                                                            handleItemStatusChange,
                                                            handleCancelItem
                                                        }) => {
    const {data: restaurant} = useRestaurant();
    const {hasPermission, isServer} = usePermissions();
    const isTrackingEnabled = restaurant?.enable_order_status_tracking || false;
    const showStatusBadge = isTrackingEnabled || item.status === 'cancelled';

    return (
        <Card key={item.id} className="overflow-hidden">
            <CardHeader className="p-3 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    {showStatusBadge && (
                        <Badge className={getStatusBadgeClass(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-sm">
                        {item.status === 'placed' && hasPermission(PERMISSIONS.UPDATE_ORDER) ? (
                            <div className="flex items-center gap-1 mt-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleQuantityChange(orderId, item.id, -1, item.quantity)}
                                    disabled={processingItemId === item.id}
                                >
                                    {processingItemId === item.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin"/>
                                    ) : (
                                        <Minus className="h-3 w-3"/>
                                    )}
                                </Button>
                                <span className="w-6 text-center">{item.quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleQuantityChange(orderId, item.id, 1, item.quantity)}
                                    disabled={processingItemId === item.id}
                                >
                                    {processingItemId === item.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin"/>
                                    ) : (
                                        <Plus className="h-3 w-3"/>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <span>Quantity: {item.quantity}</span>
                        )}
                    </div>
                    <div className="text-sm font-medium">
                        ₹{(item.quantity * item?.price)?.toFixed(2)}
                    </div>
                </div>

                {hasPermission(PERMISSIONS.UPDATE_ORDER) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {item.status === 'placed' && (
                            <>
                                {!isServer() && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCancelItem(orderId, item.id)}
                                        disabled={processingItemId === item.id || (item.allowed_next_states && !item.allowed_next_states.includes('cancelled'))}
                                    >
                                        {processingItemId === item.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                                        ) : (
                                            <XCircle className="h-3 w-3 mr-1"/>
                                        )}
                                        Cancel
                                    </Button>
                                )}
                                {isTrackingEnabled && hasPermission(PERMISSIONS.PREPARE_ORDER) && (
                                    <Button
                                        size="sm"
                                        onClick={() => handleItemStatusChange(orderId, item.id, 'preparing')}
                                        disabled={processingItemId === item.id || (item.allowed_next_states && !item.allowed_next_states.includes('preparing'))}
                                    >
                                        {processingItemId === item.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                                        ) : (
                                            "Prepare"
                                        )}
                                    </Button>
                                )}
                            </>
                        )}
                        {isTrackingEnabled && item.status === 'preparing' && hasPermission(PERMISSIONS.PREPARE_ORDER) && (
                            <Button
                                size="sm"
                                onClick={() => handleItemStatusChange(orderId, item.id, 'ready')}
                                disabled={processingItemId === item.id || (item.allowed_next_states && !item.allowed_next_states.includes('ready'))}
                            >
                                {processingItemId === item.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                                ) : (
                                    <CheckCircle2 className="h-3 w-3 mr-1"/>
                                )}
                                Mark Ready
                            </Button>
                        )}
                        {isTrackingEnabled && item.status === 'ready' && hasPermission(PERMISSIONS.SERVE_ORDER) && (
                            <Button
                                size="sm"
                                onClick={() => handleItemStatusChange(orderId, item.id, 'served')}
                                disabled={processingItemId === item.id || (item.allowed_next_states && !item.allowed_next_states.includes('served'))}
                            >
                                {processingItemId === item.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                                ) : (
                                    <CheckCircle2 className="h-3 w-3 mr-1"/>
                                )}
                                Mark Served
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
