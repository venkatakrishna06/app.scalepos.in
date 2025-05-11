import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import SettingsSidebar from '@/components/settings-sidebar';

export default function Settings() {
  const location = useLocation();

  // If we're at the root settings page, redirect to profile
  if (location.pathname === '/settings') {
    return <Navigate to="/settings/profile" replace />;
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 ">
      <div className="mb-6 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        <div className="md:col-span-1">
          <SettingsSidebar />
        </div>
        <div className="md:col-span-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
