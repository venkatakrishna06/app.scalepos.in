import { BarChart, LineChart, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Welcome to Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Hello, {user?.name}! This is a standalone analytics application that shares the same login UI as the main restaurant management system.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <BarChart className="h-10 w-10 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Sales Analytics</h3>
              <p className="text-sm text-muted-foreground">Track your sales performance</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <LineChart className="h-10 w-10 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Performance Metrics</h3>
              <p className="text-sm text-muted-foreground">Monitor key performance indicators</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <PieChart className="h-10 w-10 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Customer Insights</h3>
              <p className="text-sm text-muted-foreground">Understand your customer base</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">About This Application</h2>
        <p className="text-muted-foreground mb-4">
          This is a standalone analytics application that is completely independent from the main restaurant management system.
          It shares the same login UI for a consistent user experience but is deployed separately.
        </p>
        <p className="text-muted-foreground">
          In a real-world scenario, this application would connect to the same database as the main application
          but would focus exclusively on providing advanced analytics and reporting capabilities.
        </p>
      </div>
    </div>
  );
}