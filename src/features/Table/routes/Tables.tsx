import {Merge, Plus, Search} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {FilterDropdownContainer} from '@/components/composed/FilterDropdownContainer';
import {TableCard} from '@/components/composed/tableCard';
import {useTablesPage} from '@/hooks/useTablesPage';
import {CreateOrderDialog} from '@/components/composed/table/dialogs/CreateOrderDialog';
import {PaymentDialog} from '@/components/composed/table/dialogs/PaymentDialog';
import {TableManagementDialog} from '@/components/composed/table/dialogs/TableManagementDialog';
import {ViewOrdersDialog} from '@/components/composed/table/dialogs/ViewOrdersDialog';
import {TableReservationDialog} from '@/components/composed/table/dialogs/TableReservationDialog';
import {TablesSkeleton} from "@/components/composed/tables-skeleton.tsx";

export default function Tables() {
    const {
        tables,
        isLoadingTables,
        isErrorTables,
        tablesErrorMessage,
        isLoadingOrders,
        isErrorOrders,
        ordersErrorMessage,
        selectedTableId,
        selectedOrder,
        isNewOrder,
        showOrderDialog,
        setShowOrderDialog,
        showPaymentDialog,
        setShowPaymentDialog,
        showOrdersDialog,
        setShowOrdersDialog,
        tableManagementAction,
        setTableManagementAction,
        filterStatus,
        setFilterStatus,
        filterCapacity,
        setFilterCapacity,
        searchQuery,
        setSearchQuery,
        showReservationDialog,
        setShowReservationDialog,
        tableForReservation,
        setTableForReservation,
        filteredTables,
        getStatusColor,
        handleNewOrder,
        handlePayment,
        handleDeleteTable,
        handleStatusChange,
        handleViewOrders,
        handleOrderPayment,
    } = useTablesPage();


    if (isLoadingTables || isLoadingOrders) {
        return <TablesSkeleton/>;
    }

    if (isErrorTables || isErrorOrders) {
        return (
            <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                    <p className="text-muted-foreground">{tablesErrorMessage?.message || ordersErrorMessage?.message}</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/*<div className="flex items-center justify-between">*/}
            {/*    <div className="flex items-center gap-4">*/}
            {/*        <Button variant="outline" onClick={() => setTableManagementAction('merge')}>*/}
            {/*            <Merge className="mr-2 h-4 w-4"/>*/}
            {/*            Merge Tables*/}
            {/*        </Button>*/}
            {/*    </div>*/}
            {/*</div>*/}

            <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">

                <div className="relative w-full md:w-auto flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        placeholder="Search tables..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-full"
                    />
                </div>
                <FilterDropdownContainer>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[130px] sm:w-[180px]">
                            <SelectValue placeholder="Filter by status"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="reserved">Reserved</SelectItem>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterCapacity} onValueChange={setFilterCapacity}>
                        <SelectTrigger className="w-[130px] sm:w-[180px]">
                            <SelectValue placeholder="Filter by capacity"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Capacities</SelectItem>
                            <SelectItem value="small">Small (1-4)</SelectItem>
                            <SelectItem value="medium">Medium (5-8)</SelectItem>
                            <SelectItem value="large">Large (8+)</SelectItem>
                        </SelectContent>
                    </Select>
                </FilterDropdownContainer>
                <Button onClick={() => setTableManagementAction('add')}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Add Table
                </Button>

            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTables.map((table) => (
                    <TableCard
                        key={table.id}
                        table={table}
                        getStatusColor={getStatusColor}
                        onDelete={handleDeleteTable}
                        onNewOrder={handleNewOrder}
                        onViewOrders={handleViewOrders}
                        onPayment={handlePayment}
                        onStatusChange={handleStatusChange}
                        onSplit={() => setTableManagementAction('split')}
                    />
                ))}
            </div>

            {tables.length === 0 && (
                <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
                    <div className="text-center">
                        <p className="text-muted-foreground">No tables found</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setTableManagementAction('add')}
                        >
                            <Plus className="mr-2 h-4 w-4"/>
                            Add Table
                        </Button>
                    </div>
                </div>
            )}

            <CreateOrderDialog
                open={showOrderDialog}
                onClose={() => {
                    setShowOrderDialog(false);

                }}
                table_id={selectedTableId || 0}
                existingOrder={!isNewOrder ? selectedOrder : undefined}
            />

            {selectedOrder && (
                <PaymentDialog
                    key={`payment-dialog-${selectedOrder.id}`}
                    open={showPaymentDialog}
                    onClose={() => {
                        setShowPaymentDialog(false);
                    }}
                    order={selectedOrder}
                />
            )}

            {selectedTableId && (
                <ViewOrdersDialog
                    open={showOrdersDialog}
                    onClose={() => {
                        setShowOrdersDialog(false);
                    }}
                    tableId={selectedTableId}
                    onPayment={handleOrderPayment}
                />
            )}

            {tableManagementAction && (
                <TableManagementDialog
                    open={tableManagementAction !== null}
                    onClose={() => setTableManagementAction(null)}
                    action={tableManagementAction}
                    selectedTable={
                        tableManagementAction === 'split'
                            ? tables.find((t) => t.status === 'available')
                            : undefined
                    }
                />
            )}

            {tableForReservation && (
                <TableReservationDialog
                    open={showReservationDialog}
                    onClose={() => {
                        setShowReservationDialog(false);
                        setTableForReservation(null);
                    }}
                    table={tableForReservation}
                />
            )}
        </div>
    );
}
