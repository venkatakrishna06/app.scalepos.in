import { User, Phone, Clock, Plus, Search, Edit2, Trash2, Loader2, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StaffForm } from '@/components/forms/staff-form';
import { useStaffStore } from '@/lib/store';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { useState, useEffect, useRef } from 'react';
import { StaffMember } from '@/types';
import { toast } from 'sonner';

type SortField = 'name' | 'role' | 'status';
type SortOrder = 'asc' | 'desc';

export default function Staff() {
  const { staff, loading, error, fetchStaff, addStaff, updateStaff, deleteStaff } = useStaffStore();
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showDialog, setShowDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Using a ref to prevent duplicate API calls in StrictMode
  const isDataFetchedRef = useRef(false);

  useEffect(() => {
    if (!isDataFetchedRef.current) {
      fetchStaff();
      isDataFetchedRef.current = true;
    }
  }, [fetchStaff]);

  const filteredStaff = staff
    .filter((member) => {
      const matchesSearch = 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const aValue = a[sortField].toLowerCase();
      const bValue = b[sortField].toLowerCase();
      const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
      return aValue.localeCompare(bValue) * sortMultiplier;
    });

  const handleSubmit = async (data: Omit<StaffMember, 'id'>) => {
    try {
      setIsSubmitting(true);
      if (editingStaff) {
        await updateStaff(editingStaff.id, data);
        toast.success('Staff member updated successfully');
      } else {
        await addStaff(data);
        toast.success('Staff member added successfully');
      }
      setShowDialog(false);
      setEditingStaff(null);
    } catch (err) {
      handleError(err);
      toast.error('Failed to save staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this staff member?');
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      await deleteStaff(id);
      toast.success('Staff member deleted successfully');
    } catch (err) {
      handleError(err);
      toast.error('Failed to delete staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {roleFilter === 'all' ? 'All Roles' : roleFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                All Roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('server')}>
                Server
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('manager')}>
                Manager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('kitchen')}>
                Kitchen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('admin')}>
                Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, role, or phone..."
              className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowDialog(true)} disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort('name')}
          className="gap-2"
        >
          Name
          {sortField === 'name' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort('role')}
          className="gap-2"
        >
          Role
          {sortField === 'role' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort('status')}
          className="gap-2"
        >
          Status
          {sortField === 'status' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className="group rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full ${
                  member.status === 'active' ? 'bg-primary/10' : 'bg-muted'
                } p-2 transition-colors group-hover:bg-primary/20`}>
                  <User className={`h-8 w-8 ${
                    member.status === 'active' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
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
                className="flex-1"
                onClick={() => {
                  setEditingStaff(member);
                  setShowDialog(true);
                }}
                disabled={isSubmitting}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => handleDelete(member.id)}
                disabled={isSubmitting}
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

      >
        <DialogContent onClose={() => {
          if (isSubmitting) return;
          setShowDialog(false);
          setEditingStaff(null);
        }}>
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff
                ? 'Update the staff member\'s information below.'
                : 'Fill in the details to add a new staff member.'}
            </DialogDescription>
          </DialogHeader>
          <div >
            <StaffForm
              onSubmit={handleSubmit}
              initialData={editingStaff || undefined}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
