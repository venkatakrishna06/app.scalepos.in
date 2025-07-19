import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {Settings as SettingsIcon} from 'lucide-react';
import SettingsSidebar from '@/components/settings-sidebar';
import {Card, CardContent} from '@/components/ui/card';

export default function Settings() {
    const location = useLocation();

    if (location.pathname === '/settings') {
        return <Navigate to="/settings/profile" replace/>;
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-full">
                    <SettingsIcon className="h-6 w-6 text-primary"/>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            </div>

            {/* Main content with sidebar and outlet */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                <Card className="lg:col-span-1 h-fit shadow-sm">
                    <CardContent className="p-0">
                        <SettingsSidebar/>
                    </CardContent>
                </Card>

                <div className="lg:col-span-3">
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <Outlet/>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
