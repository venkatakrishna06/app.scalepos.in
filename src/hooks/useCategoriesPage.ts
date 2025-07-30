
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/api/menu';
import { Category } from '@/types';
import { toast } from '@/lib/toast';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters'),
  parent_category_id: z.number().nullable().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export const useCategoriesPage = () => {
  const { data: categories = [], isLoading, isError, error } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<string>('all');

  const mainCategories = useMemo(() => categories.filter(category => category.parent_category_id === undefined), [categories]);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      parent_category_id: null,
    },
  });

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = categoryTypeFilter === 'all' ||
        (categoryTypeFilter === 'main' && category.parent_category_id === undefined) ||
        (categoryTypeFilter === 'sub' && category.parent_category_id !== undefined);
      return matchesSearch && matchesType;
    });
  }, [categories, searchQuery, categoryTypeFilter]);

  const getParentCategoryName = useCallback((parentId?: number | null) => {
    if (parentId === undefined || parentId === null) return null;
    const parentCategory = categories.find(c => c.id === parentId);
    return parentCategory ? parentCategory.name : null;
  }, [categories]);

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, category: data });
        toast.success('Category updated successfully');
      } else {
        await createCategoryMutation.mutateAsync(data);
        toast.success('Category created successfully');
      }
      setShowDialog(false);
      setEditingCategory(null);
      form.reset();
    } catch (err) {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategoryMutation.mutateAsync(id);
      toast.success('Category deleted successfully');
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };
  
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    form.reset({
        name: category.name,
        parent_category_id: category.parent_category_id ?? null,
    });
    setShowDialog(true);
  };
  
  const openNewDialog = () => {
    setEditingCategory(null);
    form.reset({
        name: '',
        parent_category_id: null,
    });
    setShowDialog(true);
  };

  return {
    categories,
    isLoading,
    isError,
    error,
    searchQuery,
    setSearchQuery,
    showDialog,
    setShowDialog,
    editingCategory,
    setEditingCategory,
    categoryTypeFilter,
    setCategoryTypeFilter,
    mainCategories,
    form,
    filteredCategories,
    getParentCategoryName,
    handleSubmit,
    handleDelete,
    createCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
    openEditDialog,
    openNewDialog
  };
};
