import {useEffect, useState} from 'react';
import {useAuthStore} from '@/lib/store/auth.store';
import {Button} from '@/components/ui/button';
import {Dialog} from '@/components/ui/dialog';
import {Camera, Key, Loader2} from 'lucide-react';
import {toast} from "sonner";

export default function Profile() {
  const { user, loading, error, updateProfile, changePassword, clearError, initAuth, logout } = useAuthStore();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Initialize user data when component mounts or user changes
  useEffect(() => {
    if (!user) {
      initAuth();
    } else {
      setFormData({
        name: user.staff.name || '',
        email: user.username || '',
        phone: user.staff.phone || '',
      });
    }
  }, [user, initAuth]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    await changePassword(currentPassword, newPassword);
    if (!error) {
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password changed successfully');

    }
  };

  // Show loading state while fetching user data
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Show error state if user data couldn't be loaded
  if (!user && !loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Unable to load profile</h2>
            <p className="text-gray-600 mb-4">There was a problem loading your profile information.</p>
            <Button onClick={() => initAuth()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gray-200">
              {user?.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.staff.name}
                  className="h-full w-full rounded-full object-cover"
                />
              )}
            </div>
            <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.staff.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100"
            />
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                  });
                  clearError();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>

        <div className="mt-6 border-t pt-6">
          <Button
            variant="outline"
            onClick={() => setShowPasswordDialog(true)}
            className="flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            Change Password
          </Button>
        </div>
      </div>

      <Dialog
        open={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setCurrentPassword('');
          setNewPassword('');
          clearError();
        }}
        title="Change Password"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setCurrentPassword('');
                setNewPassword('');
                clearError();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
