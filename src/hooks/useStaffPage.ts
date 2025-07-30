import {useMemo, useState} from 'react';
import {useCreateStaff, useDeleteStaff, useStaff, useUpdateStaff} from '@/api/staff';
import {StaffMember} from '@/types';
import {toast} from '@/lib/toast';

type SortField = 'name' | 'role' | 'status';
type SortOrder = 'asc' | 'desc';

export const useStaffPage = () => {
    const {data: staff = [], isLoading, isError, error} = useStaff();
    const createStaffMutation = useCreateStaff();
    const updateStaffMutation = useUpdateStaff();
    const deleteStaffMutation = useDeleteStaff();

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [showDialog, setShowDialog] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null);

    const filteredStaff = useMemo(() => {
        return staff
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
    }, [staff, searchQuery, roleFilter, sortField, sortOrder]);

    const handleSubmit = async (data: Omit<StaffMember, 'id'>) => {
        try {
            if (editingStaff) {
                await updateStaffMutation.mutateAsync({id: editingStaff.id, staff: data});
                toast.success('Staff member updated successfully');
            } else {
                await createStaffMutation.mutateAsync(data);
                toast.success('Staff member created successfully');
            }
            setShowDialog(false);
            setEditingStaff(null);
        } catch (err) {
            toast.error('Failed to save staff member');
        }
    };

    const handleDelete = async () => {
        if (!deletingStaffId) return;

        try {
            await deleteStaffMutation.mutateAsync(deletingStaffId);
            toast.success('Staff member deleted successfully');
            setIsDeleteDialogOpen(false);
            setDeletingStaffId(null);
        } catch (err) {
            toast.error('Failed to delete staff member');
        }
    };

    const openDeleteDialog = (id: number) => {
        setDeletingStaffId(id);
        setIsDeleteDialogOpen(true);
    };

    const openEditDialog = (staff: StaffMember) => {
        setEditingStaff(staff);
        setShowDialog(true);
    };

    const openNewDialog = () => {
        setEditingStaff(null);
        setShowDialog(true);
    };

    return {
        staff,
        isLoading,
        isError,
        error,
        createStaffMutation,
        updateStaffMutation,
        deleteStaffMutation,
        searchQuery,
        setSearchQuery,
        roleFilter,
        setRoleFilter,
        sortField,
        setSortField,
        sortOrder,
        setSortOrder,
        showDialog,
        setShowDialog,
        editingStaff,
        setEditingStaff,
        filteredStaff,
        handleSubmit,
        handleDelete,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        openDeleteDialog,
        openEditDialog,
        openNewDialog
    };
};
