
import { useState, useMemo } from 'react';
import { useMenuItems, useCategories, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/api/menu';
import { MenuItem } from '@/types';
import { toast } from '@/lib/toast';

type SortField = 'name' | 'price' | 'category';
type ViewMode = 'grid' | 'list';

export const useMenuPage = () => {
    const { data: menuItems = [], isLoading: menuItemsLoading, isError: menuItemsError, error: menuItemsErrorMessage } = useMenuItems();
    const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError, error: categoriesErrorMessage } = useCategories();
    const createMenuItemMutation = useCreateMenuItem();
    const updateMenuItemMutation = useUpdateMenuItem();
    const deleteMenuItemMutation = useDeleteMenuItem();

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

    const filteredItems = useMemo(() => {
        return menuItems
            .filter((item) => {
                const matchesCategory = selectedCategory === 'all' || item.category.name === selectedCategory;
                const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.category.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesAvailability = availabilityFilter === 'all' ||
                    (availabilityFilter === 'available' && item.available) ||
                    (availabilityFilter === 'unavailable' && !item.available);
                return matchesCategory && matchesSearch && matchesAvailability;
            })
            .sort((a, b) => {
                const aValue = sortField === 'category' ? a.category.name : a[sortField];
                const bValue = sortField === 'category' ? b.category.name : b[sortField];
                if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
    }, [menuItems, selectedCategory, searchQuery, availabilityFilter, sortField, sortOrder]);

    const handleSubmit = async (data: Omit<MenuItem, 'id' | 'available' | 'category'> & { category_id: number }) => {
        try {
            if (editingItem) {
                await updateMenuItemMutation.mutateAsync({ id: editingItem.id, item: data });
                toast.success('Menu item updated successfully');
                setEditingItem(null);
            } else {
                await createMenuItemMutation.mutateAsync({ ...data, available: true });
                toast.success('Menu item created successfully');
            }
            setShowAddDialog(false);
        } catch (error) {
            toast.error('Failed to save menu item');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteMenuItemMutation.mutateAsync(id);
            toast.success('Menu item deleted successfully');
        } catch (error) {
            toast.error('Failed to delete menu item');
        }
    };

    const handleToggleAvailability = async (id: number) => {
        try {
            const item = menuItems.find(item => item.id === id);
            if (item) {
                await updateMenuItemMutation.mutateAsync({
                    id,
                    item: { available: !item.available }
                });
                toast.success('Item availability updated');
            }
        } catch (err) {
            toast.error('Failed to update item availability');
        }
    };

    const openEditDialog = (item: MenuItem) => {
        setEditingItem(item);
        setShowAddDialog(true);
    };

    const openNewDialog = () => {
        setEditingItem(null);
        setShowAddDialog(true);
    };

    return {
        menuItems,
        menuItemsLoading,
        menuItemsError,
        menuItemsErrorMessage,
        categories,
        categoriesLoading,
        categoriesError,
        categoriesErrorMessage,
        createMenuItemMutation,
        updateMenuItemMutation,
        deleteMenuItemMutation,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        showAddDialog,
        setShowAddDialog,
        editingItem,
        setEditingItem,
        sortField,
        setSortField,
        sortOrder,
        setSortOrder,
        viewMode,
        setViewMode,
        availabilityFilter,
        setAvailabilityFilter,
        filteredItems,
        handleSubmit,
        handleDelete,
        handleToggleAvailability,
        openEditDialog,
        openNewDialog
    };
};
