import {memo} from 'react';
import {DashboardTakeaway} from '@/components/dashboard/DashboardTakeaway';

/**
 * Takeaway page component that renders the takeaway order view
 */
const Takeaway = memo(() => {
    return <DashboardTakeaway type={'takeaway'}/>;
});

Takeaway.displayName = 'Takeaway';

export default Takeaway;