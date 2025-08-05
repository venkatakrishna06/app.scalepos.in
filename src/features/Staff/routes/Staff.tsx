import {Clock, Edit2, Filter, Phone, Plus, Search, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

import {useStaffPage} from '@/hooks/useStaffPage';
import {ConfirmationDialog} from '@/components/composed/ConfirmationDialog';
import {StaffSkeleton} from "@/components/composed/staff-skeleton.tsx";
import {StaffForm} from "@/components/composed/staff-form.tsx";

export default function Staff() {
    const {
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
    } = useStaffPage();

    if (isLoading) {
        return <StaffSkeleton/>;
    }

    if (isError) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-red-600">{error?.message}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold">Staff Management</h1>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 w-full sm:w-auto">
                                    <Filter className="mr-2 h-4 w-4"/>
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
                        <Button
                            onClick={openNewDialog}
                            disabled={createStaffMutation.isLoading || updateStaffMutation.isLoading || deleteStaffMutation.isLoading}
                            className="h-10 w-full sm:w-auto"
                        >
                            <Plus className="mr-2 h-4 w-4"/>
                            Add Staff
                        </Button>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                        <input
                            type="text"
                            placeholder="Search by name, role, or phone..."
                            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStaff.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No staff members found. Add a new staff member to get started.
                    </div>
                ) : (
                    filteredStaff.map((member) => (
                        <div
                            key={member.id}
                            className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/50"
                        >
                            <div className={`absolute right-0 top-0 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white 
                ${member.role === 'admin' ? 'bg-red-500' :
                                member.role === 'manager' ? 'bg-blue-500' :
                                    member.role === 'kitchen' ? 'bg-amber-500' : 'bg-green-500'}`}>
                                {member.role}
                            </div>

                            <div className="p-4 sm:p-6">
                                <div
                                    className="flex flex-col sm:flex-row items-center text-center sm:text-left sm:items-start gap-4 mb-4">
                                    <div
                                        className="h-20 w-20 sm:h-16 sm:w-16 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40 text-primary text-xl sm:text-lg">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{member.name}</h3>
                                        <p className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {member.status?.charAt(0).toUpperCase() + member.status?.slice(1) || 'Active'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 border-t pt-3 mt-2">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-primary"/>
                                        <span className="text-muted-foreground">Phone:</span>
                                        <span className="font-medium">{member.phone}</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-primary"/>
                                        <span className="text-muted-foreground">Shift:</span>
                                        <span className="font-medium">{member.shift}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-10 border-primary/30 hover:bg-primary/5"
                                        onClick={() => openEditDialog(member)}
                                        disabled={createStaffMutation.isLoading || updateStaffMutation.isLoading || deleteStaffMutation.isLoading}
                                    >
                                        <Edit2 className="mr-2 h-4 w-4"/>
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1 h-10 opacity-80 hover:opacity-100"
                                        onClick={() => openDeleteDialog(member.id)}
                                        disabled={createStaffMutation.isLoading || updateStaffMutation.isLoading || deleteStaffMutation.isLoading}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog
                open={showDialog}
            >
                <DialogContent
                    size="lg"
                    onClose={() => {
                        if (createStaffMutation.isLoading || updateStaffMutation.isLoading) return;
                        setShowDialog(false);
                        setEditingStaff(null);
                    }}
                >
                    <DialogHeader className="mb-1">
                        <DialogTitle className="text-lg">
                            {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                            {editingStaff
                                ? 'Update the staff members information below.'
                                : 'Fill in the details to add a new staff member.'}
                        </DialogDescription>
                    </DialogHeader>
                    <StaffForm
                        onSubmit={handleSubmit}
                        initialData={editingStaff || undefined}
                        isSubmitting={createStaffMutation.isLoading || updateStaffMutation.isLoading}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDelete}
                title="Delete Staff Member"
                description="Are you sure you want to delete this staff member? This action cannot be undone."
                confirmText="Yes, Delete"
                isLoading={deleteStaffMutation.isLoading}
            />
        </div>
    );
}
