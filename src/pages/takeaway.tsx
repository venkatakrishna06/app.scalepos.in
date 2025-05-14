import {memo} from 'react';
import {DashboardTakeaway} from '@/components/dashboard/DashboardTakeaway';

/**
 * Takeaway page component that renders the takeaway order view
 */
const Takeaway = memo(() => {
  return <DashboardTakeaway />;
});

Takeaway.displayName = 'Takeaway';

export default Takeaway;