import {useMemo, useState} from 'react';
import {usePayments} from '@/api/payments';
import {useOrders} from '@/api/orders';
import {Order} from '@/types';

export const usePaymentsPage = () => {
    const {
        data: payments = [],
        isLoading: paymentsLoading,
        isError: paymentsError,
        error: paymentsErrorMessage
    } = usePayments();
    const {data: orders = [], isLoading: ordersLoading, isError: ordersError, error: ordersErrorMessage} = useOrders();
    const [searchQuery, setSearchQuery] = useState('');

    const ordersMap = useMemo(() => {
        const map = new Map<number, Order>();
        orders.forEach(order => map.set(order.id, order));
        return map;
    }, [orders]);

    const getOrderDetails = (orderId: number) => {
        return ordersMap.get(orderId);
    };

    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            const order = getOrderDetails(payment.order_id);
            if (!order) return false;
            return (
                order.id.toString().includes(searchQuery) ||
                payment.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.table?.table_number?.toString().includes(searchQuery)
            );
        });
    }, [payments, searchQuery, getOrderDetails]);

    return {
        payments,
        paymentsLoading,
        paymentsError,
        paymentsErrorMessage,
        orders,
        ordersLoading,
        ordersError,
        ordersErrorMessage,
        searchQuery,
        setSearchQuery,
        getOrderDetails,
        filteredPayments
    };
};
