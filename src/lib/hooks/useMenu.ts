import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {menuService} from '@/lib/api/services/menu.service';
import {Category, MenuItem} from '@/types';
import {toast} from '@/lib/toast';

export const useMenu = () => {
  const queryClient = useQueryClient();

  // Query to get all menu items
  const useMenuItemsQuery = () => {
    return useQuery({
      queryKey: ['menu', 'items'],
      queryFn: () => menuService.getItems(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Query to get all categories
  const useCategoriesQuery = () => {
    return useQuery({
      queryKey: ['menu', 'categories'],
      queryFn: () => menuService.getCategories(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Mutation to create a menu item
  const createItemMutation = useMutation({
    mutationFn: (item: Omit<MenuItem, 'id'>) => menuService.createItem(item),
    onSuccess: () => {
      // Invalidate menu items query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      toast.success('Menu item created successfully');
    },
    onError: (error) => {

      toast.error('Failed to create menu item');
    },
  });

  // Mutation to update a menu item
  const updateItemMutation = useMutation({
    mutationFn: ({ id, item }: { id: number; item: Partial<MenuItem> }) => 
      menuService.updateItem(id, item),
    onSuccess: () => {
      // Invalidate menu items query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      toast.success('Menu item updated successfully');
    },
    onError: (error) => {

      toast.error('Failed to update menu item');
    },
  });

  // Mutation to delete a menu item
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => menuService.deleteItem(id),
    onSuccess: () => {
      // Invalidate menu items query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      toast.success('Menu item deleted successfully');
    },
    onError: (error) => {

      toast.error('Failed to delete menu item');
    },
  });

  // Mutation to create a category
  const createCategoryMutation = useMutation({
    mutationFn: (category: Omit<Category, 'id'>) => menuService.createCategory(category),
    onSuccess: () => {
      // Invalidate categories query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['menu', 'categories'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {

      toast.error('Failed to create category');
    },
  });

  // Mutation to update a category
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, category }: { id: number; category: Partial<Category> }) => 
      menuService.updateCategory(id, category),
    onSuccess: () => {
      // Invalidate categories query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['menu', 'categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {

      toast.error('Failed to update category');
    },
  });

  // Mutation to delete a category
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => menuService.deleteCategory(id),
    onSuccess: () => {
      // Invalidate categories query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['menu', 'categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {

      toast.error('Failed to delete category');
    },
  });

  return {
    // Queries
    useMenuItemsQuery,
    useCategoriesQuery,
    
    // Menu Item Mutations
    createItem: createItemMutation.mutate,
    isCreatingItem: createItemMutation.isPending,
    createItemError: createItemMutation.error,
    
    updateItem: updateItemMutation.mutate,
    isUpdatingItem: updateItemMutation.isPending,
    updateItemError: updateItemMutation.error,
    
    deleteItem: deleteItemMutation.mutate,
    isDeletingItem: deleteItemMutation.isPending,
    deleteItemError: deleteItemMutation.error,
    
    // Category Mutations
    createCategory: createCategoryMutation.mutate,
    isCreatingCategory: createCategoryMutation.isPending,
    createCategoryError: createCategoryMutation.error,
    
    updateCategory: updateCategoryMutation.mutate,
    isUpdatingCategory: updateCategoryMutation.isPending,
    updateCategoryError: updateCategoryMutation.error,
    
    deleteCategory: deleteCategoryMutation.mutate,
    isDeletingCategory: deleteCategoryMutation.isPending,
    deleteCategoryError: deleteCategoryMutation.error,
  };
};