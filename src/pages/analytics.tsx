import {useEffect, useState} from 'react';
import {useAnalyticsStore} from '@/lib/store/analytics.store';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {DatePickerWithRange} from '@/components/ui/date-range-picker';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {FilterDropdownContainer} from '@/components/FilterDropdownContainer';
import {Button} from '@/components/ui/button';
import {Loader2, RefreshCw} from 'lucide-react';
import {format} from 'date-fns';
import {BarChart, LineChart, PieChart} from '@/components/charts';
import {AnalyticsParams} from '@/types/analytics';
import {toast} from '@/lib/toast';

export default function Analytics() {
  const {
    salesAnalytics,
    menuItemAnalytics,
    staffAnalytics,
    tableAnalytics,
    paymentMethodAnalytics,
    hourlySalesAnalytics,
    customerAnalytics,
    loading,
    error,
    fetchSalesAnalytics,
    fetchMenuItemAnalytics,
    fetchStaffAnalytics,
    fetchTableAnalytics,
    fetchPaymentMethodAnalytics,
    fetchHourlySalesAnalytics,
    fetchCustomerAnalytics,
  } = useAnalyticsStore();

  // State for filters
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  // These state variables are defined for future UI enhancements
  // They will be used to add filter controls for each analytics tab
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [limit, setLimit] = useState(10);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortBy, setSortBy] = useState('total_sales');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [staffId, setStaffId] = useState<number | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [staffRole, setStaffRole] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tableId, setTableId] = useState<number | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined);

  // Function to get common params
  const getCommonParams = (): AnalyticsParams => ({
    start_date: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    end_date: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });

  // Function to fetch data based on active tab
  const fetchData = async () => {
    try {
      const commonParams = getCommonParams();

      switch (activeTab) {
        case 'sales':
          // For sales tab, fetch both sales analytics and hourly sales analytics
          await Promise.all([
            fetchSalesAnalytics({
              ...commonParams,
              group_by: groupBy,
            }),
            fetchHourlySalesAnalytics({
              ...commonParams,
              day_of_week: dayOfWeek,
            })
          ]);
          break;
        case 'menu-items':
          await fetchMenuItemAnalytics({
            ...commonParams,
            category_id: categoryId,
            limit,
            sort_by: sortBy,
            order: sortOrder,
          });
          break;
        case 'staff':
          await fetchStaffAnalytics({
            ...commonParams,
            staff_id: staffId,
            role: staffRole,
          });
          break;
        case 'tables':
          await fetchTableAnalytics({
            ...commonParams,
            table_id: tableId,
          });
          break;
        case 'payment-methods':
          await fetchPaymentMethodAnalytics(commonParams);
          break;
        case 'hourly-sales':
          await fetchHourlySalesAnalytics({
            ...commonParams,
            day_of_week: dayOfWeek,
          });
          break;
        case 'customers':
          await fetchCustomerAnalytics({
            ...commonParams,
            limit,
            sort_by: sortBy,
            order: sortOrder,
          });
          break;
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      toast.error('Failed to fetch analytics data');
    }
  };

  // Fetch data when tab or filters change
  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange, groupBy]);

  // Function to handle refresh
  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 p-4 rounded-md flex items-center gap-2 text-destructive">
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            className="ml-auto"
          >
            Try Again
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <FilterDropdownContainer>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />

          {activeTab === 'sales' && (
            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as 'day' | 'week' | 'month')}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Select grouping" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FilterDropdownContainer>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex min-w-full md:grid md:grid-cols-7 md:w-full">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="menu-items">Menu Items</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="hourly-sales">Hourly Sales</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
        </div>

        {/* Sales Analytics Tab */}
        <TabsContent value="sales" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Sales Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-16">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : salesAnalytics.length === 0 ? (
                  <div className="text-2xl font-bold">₹0.00</div>
                ) : (
                  <div className="text-2xl font-bold">
                    ₹{salesAnalytics.reduce((sum, item) => sum + item.total_sales, 0).toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Orders Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-16">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : salesAnalytics.length === 0 ? (
                  <div className="text-2xl font-bold">0</div>
                ) : (
                  <div className="text-2xl font-bold">
                    {salesAnalytics.reduce((sum, item) => sum + item.total_orders, 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Average Order Value Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-16">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : salesAnalytics.length === 0 ? (
                  <div className="text-2xl font-bold">₹0.00</div>
                ) : (
                  <div className="text-2xl font-bold">
                    ₹{(salesAnalytics.reduce((sum, item) => sum + item.avg_order_value, 0) / salesAnalytics.length).toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Tax Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-16">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : salesAnalytics.length === 0 ? (
                  <div className="text-2xl font-bold">₹0.00</div>
                ) : (
                  <div className="text-2xl font-bold">
                    ₹{salesAnalytics.reduce((sum, item) => sum + item.total_tax, 0).toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sales Overview Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                View your sales performance over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : salesAnalytics.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No sales data available for the selected period
                </div>
              ) : (
                <LineChart 
                  data={salesAnalytics.map(item => ({
                    name: item.date,
                    "Total Sales": item.total_sales,
                    "Dine In": item.dine_in_sales,
                    "Takeaway": item.takeaway_sales,
                  }))}
                  xAxisKey="name"
                  series={["Total Sales", "Dine In", "Takeaway"]}
                />
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {/* Orders by Type Card */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Type</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : salesAnalytics.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No order data available for the selected period
                  </div>
                ) : (
                  <PieChart 
                    data={[
                      { name: 'Dine In', value: salesAnalytics.reduce((sum, item) => sum + item.dine_in_orders, 0) },
                      { name: 'Takeaway', value: salesAnalytics.reduce((sum, item) => sum + item.takeaway_orders, 0) },
                      { name: 'Cancelled', value: salesAnalytics.reduce((sum, item) => sum + item.cancelled_orders, 0) },
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            {/* Sales by Type Card */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Type</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : salesAnalytics.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No sales data available for the selected period
                  </div>
                ) : (
                  <PieChart 
                    data={[
                      { name: 'Dine In', value: salesAnalytics.reduce((sum, item) => sum + item.dine_in_sales, 0) },
                      { name: 'Takeaway', value: salesAnalytics.reduce((sum, item) => sum + item.takeaway_sales, 0) },
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            {/* Peak Hour Card */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Hour Information</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : hourlySalesAnalytics.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No hourly sales data available for the selected period
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const peakSalesHour = [...hourlySalesAnalytics].sort((a, b) => b.total_sales - a.total_sales)[0];
                      const peakOrdersHour = [...hourlySalesAnalytics].sort((a, b) => b.total_orders - a.total_orders)[0];

                      return (
                        <>
                          <div>
                            <p className="text-sm font-medium mb-1">Peak Sales Hour</p>
                            <p className="text-xl font-bold">{peakSalesHour.hour}:00</p>
                            <p className="text-sm text-muted-foreground">₹{peakSalesHour.total_sales.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Peak Orders Hour</p>
                            <p className="text-xl font-bold">{peakOrdersHour.hour}:00</p>
                            <p className="text-sm text-muted-foreground">{peakOrdersHour.total_orders} orders</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Menu Items Analytics Tab */}
        <TabsContent value="menu-items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Menu Items</CardTitle>
              <CardDescription>
                View your best-selling menu items
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : menuItemAnalytics.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No menu item data available for the selected period
                </div>
              ) : (
                <BarChart 
                  data={menuItemAnalytics.map(item => ({
                    name: item.menu_item_name,
                    "Quantity Sold": item.quantity_sold,
                    "Total Sales": item.total_sales,
                  }))}
                  xAxisKey="name"
                  series={["Quantity Sold", "Total Sales"]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Analytics Tab */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
              <CardDescription>
                View performance metrics for your staff
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : staffAnalytics.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No staff data available for the selected period
                </div>
              ) : (
                <BarChart 
                  data={staffAnalytics.map(item => ({
                    name: item.staff_name,
                    "Orders Processed": item.orders_processed,
                    "Total Sales": item.total_sales,
                  }))}
                  xAxisKey="name"
                  series={["Orders Processed", "Total Sales"]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tables Analytics Tab */}
        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Table Performance</CardTitle>
              <CardDescription>
                View performance metrics for your tables
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : tableAnalytics.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No table data available for the selected period
                </div>
              ) : (
                <BarChart 
                  data={tableAnalytics.map(item => ({
                    name: `Table ${item.table_number}`,
                    "Total Orders": item.total_orders,
                    "Total Sales": item.total_sales,
                    "Turnover Rate": item.turnover_rate,
                  }))}
                  xAxisKey="name"
                  series={["Total Orders", "Total Sales", "Turnover Rate"]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Analytics Tab */}
        <TabsContent value="payment-methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                View payment method distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : paymentMethodAnalytics.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No payment method data available for the selected period
                </div>
              ) : (
                <PieChart 
                  data={paymentMethodAnalytics.map(item => ({
                    name: item.payment_method,
                    value: item.total_amount,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hourly Sales Analytics Tab */}
        <TabsContent value="hourly-sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales</CardTitle>
              <CardDescription>
                View sales distribution by hour
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : hourlySalesAnalytics.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hourly sales data available for the selected period
                </div>
              ) : (
                <LineChart 
                  data={hourlySalesAnalytics.map(item => ({
                    name: `${item.hour}:00`,
                    "Total Sales": item.total_sales,
                    "Total Orders": item.total_orders,
                  }))}
                  xAxisKey="name"
                  series={["Total Sales", "Total Orders"]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Analytics Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>
                View your most valuable customers
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : customerAnalytics.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No customer data available for the selected period
                </div>
              ) : (
                <BarChart 
                  data={customerAnalytics.map(item => ({
                    name: item.customer_name,
                    "Total Visits": item.total_visits,
                    "Total Spent": item.total_spent,
                  }))}
                  xAxisKey="name"
                  series={["Total Visits", "Total Spent"]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
