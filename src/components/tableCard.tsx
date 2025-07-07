import React from 'react';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    ClipboardList,
    Coffee,
    CreditCard,
    RefreshCw,
    Settings2,
    Split,
    Trash2,
    Users
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {Table} from '@/types';
import {cn} from '@/lib/utils';

type TableCardProps = {
    table: Table;
    getStatusColor: (status: Table['status']) => string;
    onDelete: (id: number) => void;
    onNewOrder: (id: number, isNew?: boolean) => void;
    onViewOrders: (id: number) => void;
    onPayment: (table: Table) => void;
    onStatusChange: (id: number, status: Table['status']) => void;
    onSplit: () => void;
    onReserve?: (id: number) => void;
};

export const TableCard = React.memo(({
                                         table,
                                         getStatusColor,
                                         onDelete,
                                         onNewOrder,
                                         onViewOrders,
                                         onPayment,
                                         onStatusChange,
                                         onSplit,
                                     }: TableCardProps) => {

    // Get status icon based on table status
    const getStatusIcon = (status: Table['status']) => {
        switch (status) {
            case 'available':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'occupied':
                return <Coffee className="h-4 w-4 text-orange-500" />;
            case 'reserved':
                return <Calendar className="h-4 w-4 text-blue-500" />;
            case 'cleaning':
                return <RefreshCw className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className={cn(
            "rounded-lg border bg-card shadow transition-all hover:shadow-md",
            table.status === 'occupied' && "border-l-4 border-l-orange-500",
            table.status === 'available' && "border-l-4 border-l-green-500",
            table.status === 'reserved' && "border-l-4 border-l-blue-500",
            table.status === 'cleaning' && "border-l-4 border-l-yellow-500"
        )}>
            {/* Header section */}
            <div className="p-4 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">Table {table.table_number}</h2>
                        <div className="flex items-center gap-1">
                            {getStatusIcon(table.status)}
                            <span className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                getStatusColor(table.status)
                            )}>
                                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                            </span>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        {table.status !== 'occupied' &&
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onStatusChange(table.id, 'available')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                Mark Available
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(table.id, 'reserved')}>
                                <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                                Mark Reserved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(table.id, 'cleaning')}>
                                <RefreshCw className="mr-2 h-4 w-4 text-yellow-500" />
                                Mark Cleaning
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {table.status === 'available' && (
                                <DropdownMenuItem onClick={onSplit}>
                                    <Split className="mr-2 h-4 w-4" />
                                    Split Table
                                </DropdownMenuItem>
                            )}
                            {table.status === 'available' && (
                                <DropdownMenuItem onClick={() => onDelete(table.id)}>
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                    Delete Table
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                        }
                    </DropdownMenu>
                </div>

                {/* Info section */}
                <div className="mt-2 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Capacity: {table.capacity} seats</span>
                    </div>

                </div>

                {table.merged_with && table.merged_with.length > 0 && (
                    <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
                        <span className="font-medium">Merged with:</span> Tables {table.merged_with.join(', ')}
                    </div>
                )}

                {/*{table.current_order_id && (*/}
                {/*    <div className="mt-2 rounded-md bg-muted/50 p-2">*/}
                {/*        <div className="flex items-center gap-2 text-sm">*/}
                {/*            <Coffee className="h-4 w-4 text-orange-500" />*/}
                {/*            /!*<span className="font-medium">Active Order #{table.current_order_id}</span>*!/*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>

            {/* Action buttons section */}
            <div className="border-t p-3 bg-muted/30">
                <div className="flex items-center justify-center ">
                    {table.status === 'available' && (
                        <>
                            {/*<Button variant="outline" size="sm" className="h-8" onClick={() => onDelete(table.id)}>*/}
                            {/*    <Trash2 className="h-3.5 w-3.5" />*/}
                            {/*</Button>*/}
                            {/*<Button variant="outline" size="sm" className="h-8" onClick={onSplit}>*/}
                            {/*    <Split className="h-3.5 w-3.5" />*/}
                            {/*    Split*/}
                            {/*</Button>*/}

                            <Button size="lg" className="h-8" onClick={() => onNewOrder(table.id)}>
                                New Order
                            </Button>
                        </>
                    )}
                    {table.status === 'occupied' && (
                        <>
                            <Button variant="outline" size="sm" className="h-8" onClick={() => onViewOrders(table.id)}>
                                <ClipboardList className="h-3.5 w-3.5" />
                                View
                            </Button>
                            <Button variant="outline" size="sm" className="h-8" onClick={() => onNewOrder(table.id, false)}>
                                Add Items
                            </Button>
                            <Button size="sm" className="h-8" onClick={() => onPayment(table)}>
                                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                Pay
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});
