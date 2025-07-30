import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Coffee, ShoppingBag, Table2, Tags, Users} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {ActionButton} from './ActionButton';

export function QuickActions() {
    const navigate = useNavigate();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>
                    Common tasks and shortcuts
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    <ActionButton
                        icon={<Table2 className="h-6 w-6"/>}
                        label="Tables"
                        onClick={() => navigate('/tables')}
                    />
                    <ActionButton
                        icon={<ShoppingBag className="h-6 w-6"/>}
                        label="Takeaway"
                        onClick={() => navigate('/takeaway')}
                    />
                    <ActionButton
                        icon={<Coffee className="h-6 w-6"/>}
                        label="Menu"
                        onClick={() => navigate('/menu')}
                    />
                    <ActionButton
                        icon={<Tags className="h-6 w-6"/>}
                        label="Categories"
                        onClick={() => navigate('/categories')}
                    />
                    <ActionButton
                        icon={<Users className="h-6 w-6"/>}
                        label="Staff"
                        onClick={() => navigate('/staff')}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
