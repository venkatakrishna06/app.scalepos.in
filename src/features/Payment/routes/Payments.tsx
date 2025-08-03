import {Calendar, CreditCard, Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {formatDateISO} from '@/lib/date-utils';
import {usePaymentsPage} from '@/hooks/usePaymentsPage';
import {PaymentsSkeleton} from "@/components/composed/payments-skeleton.tsx";

export default function Payments() {
    const {
        paymentsLoading,
        paymentsError,
        paymentsErrorMessage,
        ordersLoading,
        ordersError,
        ordersErrorMessage,
        searchQuery,
        setSearchQuery,
        getOrderDetails,
        filteredPayments
    } = usePaymentsPage();


    if (paymentsLoading || ordersLoading) {
        return <PaymentsSkeleton/>;
    }

    if (paymentsError || ordersError) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-red-600">{paymentsErrorMessage?.message || ordersErrorMessage?.message}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Payment History</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                        <input
                            type="text"
                            placeholder="Search by order, table, method..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4"/>
                        Filter by Date
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border bg-card shadow">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Order ID</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Table</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Method</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredPayments.map((payment) => {
                            const order = getOrderDetails(payment.order_id);
                            return (
                                <tr key={payment.id} className="border-b">
                                    <td className="px-6 py-4 font-medium">Order #{payment.order_id}</td>
                                    <td className="px-6 py-4 font-medium">
                                        {order?.order_type === 'dine-in' ? `Table ${order.table?.table_number}` : order?.order_type === 'takeaway' ? 'Takeaway' : 'Quick Bill'}
                                    </td>
                                    <td className="px-6 py-4 font-medium">₹{payment.amount_paid.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-muted-foreground"/>
                                            {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {formatDateISO(payment.paid_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                            <span
                                                className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || 'Completed'}
                                            </span>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
