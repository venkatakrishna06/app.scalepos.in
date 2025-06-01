import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '@/lib/api/services/analytics.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type DashboardTab = 'sales' | 'menu-items' | 'staff' | 'tables' | 'payment-methods' | 'hourly-sales' | 'customers';

const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'sales', label: 'Sales' },
  { id: 'menu-items', label: 'Menu Items' },
  { id: 'staff', label: 'Staff' },
  { id: 'tables', label: 'Tables' },
  { id: 'payment-methods', label: 'Payment Methods' },
  { id: 'hourly-sales', label: 'Hourly Sales' },
  { id: 'customers', label: 'Customers' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('sales');
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch embed URL when active tab changes
  useEffect(() => {
    const fetchEmbedUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Make API call to get embed URL for the selected dashboard
        const response = await analyticsService.getEmbedUrl(activeTab);
        
        if (response.success && response.embed_url) {
          setEmbedUrl(response.embed_url);
        } else {
          setError(response.error || 'Failed to load dashboard');
          toast.error(response.error || 'Failed to load dashboard');
        }
      } catch (err) {
        setError('An error occurred while loading the dashboard');
        toast.error('An error occurred while loading the dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchEmbedUrl();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Hello, {user?.name}! View detailed analytics for your restaurant.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none",
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="rounded-lg border bg-card shadow-sm min-h-[600px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading dashboard...</span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
            <p className="text-muted-foreground mt-2">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => setActiveTab(activeTab)} // Re-fetch the current tab
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="w-full h-[600px]">
            {embedUrl && (
              <iframe 
                src={embedUrl} 
                className="w-full h-full border-0" 
                title={`${activeTab} Dashboard`}
                allowFullScreen
              ></iframe>
            )}
          </div>
        )}
      </div>

      {/* Dashboard Description */}
      <div className="text-sm text-muted-foreground">
        <p>
          {activeTab === 'sales' && 'View your sales performance over time, including total revenue, order counts, and average order value.'}
          {activeTab === 'menu-items' && 'Analyze your best-selling menu items, their performance, and contribution to overall revenue.'}
          {activeTab === 'staff' && 'Track staff performance metrics including orders processed, sales generated, and service efficiency.'}
          {activeTab === 'tables' && 'Monitor table utilization, turnover rates, and revenue generation by table.'}
          {activeTab === 'payment-methods' && 'Analyze payment method distribution and preferences among your customers.'}
          {activeTab === 'hourly-sales' && 'View sales distribution by hour to identify peak times and optimize staffing.'}
          {activeTab === 'customers' && 'Understand your customer base, including visit frequency, spending patterns, and preferences.'}
        </p>
      </div>
    </div>
  );
}