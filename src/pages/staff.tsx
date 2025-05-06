import { User, Phone, Clock, Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { StaffForm } from '@/components/forms/staff-form';
import { useStaffStore } from '@/lib/store';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { useState, useEffect } from 'react';
import { StaffMember } from '@/types';

export default function Staff() {
  const { staff, loading, error, fetchStaff, addStaff, updateStaff, deleteStaff } = useStaffStore();
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filteredStaff = staff.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (data: Omit<StaffMember, 'id'>) => {
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, data);
      } else {
        await addStaff(data);
      }
      setShowDialog(false);
      setEditingStaff(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteStaff(id);
    } catch (err) {
      handleError(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading staff...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => fetchStaff()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Staff Management</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search staff..."
              className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 p-2">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  member.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {member.status?.charAt(0).toUpperCase() + member.status?.slice(1) || 'Active'}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {member.phone}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {member.shift}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingStaff(member);
                  setShowDialog(true);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(member.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditingStaff(null);
        }}
        title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
      >
        <div className="p-6">
          <StaffForm
            onSubmit={handleSubmit}
            initialData={editingStaff || undefined}
          />
        </div>
      </Dialog>
    </div>
  );
}