import {memo} from 'react';
import {DashboardHome} from '@/components/DashboardHome';

/**
 * Dashboard component that renders the daily reports view
 *
 * This component has been updated to only show the dashboard home view with daily reports.
 * Takeaway and Orders now have their own dedicated routes.
 */
const Dashboard = memo(() => {
    return <DashboardHome/>;
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
