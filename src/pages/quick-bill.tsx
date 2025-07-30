import {memo} from 'react';
import {DashboardTakeaway} from '@/components/composed/DashboardTakeaway';

/**
 * Takeaway page component that renders the takeaway order view
 */
const QuickBill = memo(() => {
    return <DashboardTakeaway type={'quick-bill'}/>;
});

QuickBill.displayName = 'Quick Bill';

export default QuickBill;