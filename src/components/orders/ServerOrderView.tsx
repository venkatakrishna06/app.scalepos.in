import React, {useState} from 'react';
import {Check, CreditCard, FileText, Printer, Search, User} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {format, isToday, isYesterday} from 'date-fns';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';
import {Order} from '@/types';

interface ServerOrderViewProps {
    orders: Order[];
    currentServer: string;
    onMarkItemAsServed: (orderId: number, itemId: number) => void;
    onMarkOrderAsPaid: (orderId: number) => void;
    onPrintBill: (orderId: number) => void;
}

export const ServerOrderView: React.FC<ServerOrderViewProps> = ({
                                                                    orders,
                                                                    currentServer,
                                                                    onMarkItemAsServed,
                                                                    onMarkOrderAsPaid,
                                                                    onPrintBill
                                                                }) => {
    // State for filter parameters
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<string>('active');

    // Helper function to get status badge styling
    const getStatusBadgeStyles = (status: string) => {
        switch (status) {
            case 'placed':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'preparing':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'ready':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'served':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'paid':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    // Format currency
    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return '₹0.00';
        return `₹${amount.toFixed(2)}`;
    };

    // Get order date display
    const getOrderDateDisplay = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return `Today, ${format(date, 'h:mm a')}`;
        } else if (isYesterday(date)) {
            return `Yesterday, ${format(date, 'h:mm a')}`;
        } else {
            return format(date, 'MMM d, h:mm a');
        }
    };

    // Filter orders assigned to the current server
    const serverOrders = orders.filter(order => order.server === currentServer);

    // Filter and sort orders
    const filteredOrders = serverOrders
        .filter((order) => {
            // Tab filter
            let matchesTab = true;
            if (activeTab === 'active') {
                matchesTab = ['placed', 'preparing', 'served'].includes(order.status);
            } else if (activeTab === 'completed') {
                matchesTab = order.status === 'paid';
            }

            // Search filter
            const customerName = order.customer || '';
            const tableText = `Table ${order.table?.table_number || 'Unknown'}`;
            const tokenNumberText = order.token_number ? String(order.token_number) : '';

            const matchesSearch = searchQuery === '' || (
                String(order.id).includes(searchQuery) ||
                customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tableText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tokenNumberText.toLowerCase().includes(searchQuery.toLowerCase())
            );

            return matchesTab && matchesSearch;
        })
        .sort((a, b) => {
            // Sort by order time, newest first
            return new Date(b.order_time).getTime() - new Date(a.order_time).getTime();
        });

    return (
        <div className="space-y-6">
            {/* Page header with title */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold tracking-tight text-green-800 dark:text-green-300">My Orders</h1>
            </div>

            {/* Tabs for active vs completed orders */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <TabsTrigger value="active"
                                 className="data-[state=active]:bg-green-200 data-[state=active]:text-green-800">Active
                        Orders</TabsTrigger>
                    <TabsTrigger value="completed"
                                 className="data-[state=active]:bg-green-200 data-[state=active]:text-green-800">Completed
                        Orders</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* Search */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                <Input
                                    placeholder="Search by order #, table, customer..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 border-green-200 focus-visible:ring-green-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <TabsContent value="active" className="mt-4">
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredOrders.map((order) => (
                            <Card key={order.id} className="overflow-hidden border-green-200 hover:shadow-md">
                                <CardHeader className="pb-3 bg-green-50 dark:bg-green-950 border-b border-green-100">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg text-green-800 dark:text-green-300">
                                                    {order.order_type === 'takeaway'
                                                        ? 'Takeaway'
                                                        : order.order_type === 'quick-bill'
                                                            ? 'Quick Bill'
                                                            : `Table ${order.table?.table_number || 'Unknown'}`}
                                                </CardTitle>
                                                <Badge variant="outline"
                                                       className="border-green-300 text-green-700">#{order.id}</Badge>
                                            </div>
                                            <CardDescription className="mt-1">
                                                {getOrderDateDisplay(order.order_time)}
                                            </CardDescription>
                                        </div>
                                        <Badge className={cn(getStatusBadgeStyles(order.status))}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="pb-3">
                                    <div className="space-y-1">


                                        {order.payment_method && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <CreditCard className="h-4 w-4 text-green-600"/>
                                                <span>Payment: {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
                                            </div>
                                        )}

                                        {order.token_number && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <FileText className="h-4 w-4 text-green-600"/>
                                                <span>Token: {order.token_number}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 max-h-40 overflow-auto rounded-md border border-green-100">
                                        <table className="w-full">
                                            <thead className="bg-green-50 dark:bg-green-950 text-xs">
                                            <tr className="text-left">
                                                <th className="p-2 text-green-800">Item</th>
                                                <th className="p-2 text-green-800">Qty</th>
                                                <th className="p-2 text-green-800">Status</th>
                                                {/*<th className="p-2 text-green-800">Action</th>*/}
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-green-100 text-xs">
                                            {(order?.items || []).length > 0 ? (
                                                (order.items || []).map((item) => (
                                                    <tr key={item.id} className="hover:bg-green-50/50">
                                                        <td className="p-2">{item.name || 'Unknown Item'}</td>
                                                        <td className="p-2">{item.quantity || 0}</td>
                                                        <td className="p-2">
                                                            <Badge variant="outline"
                                                                   className={cn("px-1.5 py-0", getStatusBadgeStyles(item.status || 'unknown'))}>
                                                                {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2">
                                                            {item.status === 'ready' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-xs text-green-700 hover:bg-green-100"
                                                                    onClick={() => onMarkItemAsServed(order.id, item.id)}
                                                                    disabled={item.allowed_next_states && !item.allowed_next_states.includes('served')}
                                                                >
                                                                    <Check className="mr-1 h-3 w-3"/> Mark Served
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                                        No items in this order
                                                    </td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>

                                <CardFooter
                                    className="flex items-center justify-between border-t border-green-100 bg-green-50/50 dark:bg-green-950/50 pt-3">
                                    <div className="flex gap-2">
                                        {/*<Button*/}
                                        {/*  variant="outline"*/}
                                        {/*  size="sm"*/}
                                        {/*  onClick={() => onMarkOrderAsPaid(order.id)}*/}
                                        {/*  disabled={(order.status === 'paid' || order.status === 'cancelled') || */}
                                        {/*            (order.allowed_next_states && !order.allowed_next_states.includes('paid'))}*/}
                                        {/*  className="border-green-300 hover:bg-green-100 text-green-700"*/}
                                        {/*>*/}
                                        {/*  <Check className="mr-2 h-4 w-4" />*/}
                                        {/*  Mark as Paid*/}
                                        {/*</Button>*/}
                                        {/*<Button*/}
                                        {/*  variant="outline"*/}
                                        {/*  size="sm"*/}
                                        {/*  onClick={() => onPrintBill(order.id)}*/}
                                        {/*  className="border-green-300 hover:bg-green-100 text-green-700"*/}
                                        {/*>*/}
                                        {/*  <Printer className="mr-2 h-4 w-4" />*/}
                                        {/*  Print Bill*/}
                                        {/*</Button>*/}
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-green-600">Total Amount</p>
                                        <p className="text-base font-semibold text-green-800">
                                            {formatCurrency(order.total_amount)}
                                        </p>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}

                        {filteredOrders.length === 0 && (
                            <div
                                className="col-span-full rounded-lg border border-dashed border-green-200 p-8 text-center">
                                <FileText className="mx-auto h-8 w-8 text-green-400"/>
                                <h3 className="mt-2 text-lg font-semibold text-green-800">No Active Orders</h3>
                                <p className="mt-1 text-sm text-green-600">
                                    You don't have any active orders assigned to you
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredOrders.map((order) => (
                            <Card key={order.id}
                                  className="overflow-hidden border-green-200 hover:shadow-md opacity-80">
                                <CardHeader className="pb-3 bg-green-50 dark:bg-green-950 border-b border-green-100">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg text-green-800 dark:text-green-300">
                                                    {order.order_type === 'takeaway'
                                                        ? 'Takeaway'
                                                        : order.order_type === 'quick-bill'
                                                            ? 'Quick Bill'
                                                            : `Table ${order.table?.table_number || 'Unknown'}`}
                                                </CardTitle>
                                                <Badge variant="outline"
                                                       className="border-green-300 text-green-700">#{order.id}</Badge>
                                            </div>
                                            <CardDescription className="mt-1">
                                                {getOrderDateDisplay(order.order_time)}
                                            </CardDescription>
                                        </div>
                                        <Badge className={cn(getStatusBadgeStyles(order.status))}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="pb-3">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-green-600"/>
                                            <span>Customer: {order.customer || 'Walk-in'}</span>
                                        </div>

                                        {order.payment_method && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <CreditCard className="h-4 w-4 text-green-600"/>
                                                <span>Payment: {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 max-h-40 overflow-auto rounded-md border border-green-100">
                                        <table className="w-full">
                                            <thead className="bg-green-50 dark:bg-green-950 text-xs">
                                            <tr className="text-left">
                                                <th className="p-2 text-green-800">Item</th>
                                                <th className="p-2 text-green-800">Qty</th>
                                                <th className="p-2 text-green-800">Price</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-green-100 text-xs">
                                            {(order?.items || []).length > 0 ? (
                                                (order.items || []).map((item) => (
                                                    <tr key={item.id} className="hover:bg-green-50/50">
                                                        <td className="p-2">{item.name || 'Unknown Item'}</td>
                                                        <td className="p-2">{item.quantity || 0}</td>
                                                        <td className="p-2">{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                                        No items in this order
                                                    </td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>

                                <CardFooter
                                    className="flex items-center justify-between border-t border-green-100 bg-green-50/50 dark:bg-green-950/50 pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onPrintBill(order.id)}
                                        className="border-green-300 hover:bg-green-100 text-green-700"
                                    >
                                        <Printer className="mr-2 h-4 w-4"/>
                                        Print Bill
                                    </Button>

                                    <div className="text-right">
                                        <p className="text-xs text-green-600">Total Amount</p>
                                        <p className="text-base font-semibold text-green-800">
                                            {formatCurrency(order.total_amount)}
                                        </p>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}

                        {filteredOrders.length === 0 && (
                            <div
                                className="col-span-full rounded-lg border border-dashed border-green-200 p-8 text-center">
                                <FileText className="mx-auto h-8 w-8 text-green-400"/>
                                <h3 className="mt-2 text-lg font-semibold text-green-800">No Completed Orders</h3>
                                <p className="mt-1 text-sm text-green-600">
                                    You don't have any completed orders
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
