import {useCallback, useEffect, useState} from 'react';
import {AlertCircle, Edit2, FolderTree, Loader2, Plus, Search, Trash2} from 'lucide-react';
import {CategoriesSkeleton} from '@/components/skeletons/categories-skeleton';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from '@/components/ui/dialog';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {useMenuStore} from '@/lib/store';
import {useErrorHandler} from '@/lib/hooks/useErrorHandler';
import {Category} from '@/types';
import {toast} from '@/lib/toast';
import {Card, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Badge} from '@/components/ui/badge';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters'),
  parent_category_id: z.number().nullable().optional(), // Corrected to allow null or undefined
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function Categories() {
  const {
    categories,
    loading,
    error,
    fetchCategories: fetchCategoriesFromStore,
    addCategory,
    updateCategory,
    deleteCategory
  } = useMenuStore();
  const { handleError } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<string>('all');
  const mainCategories = categories.filter(category => category.parent_category_id === undefined);
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
    },
  });

  // Memoize the fetchCategories function to prevent it from changing on each render
  const fetchCategories = useCallback(async () => {
    try {
      await fetchCategoriesFromStore();
    } catch (err) {
      handleError(err);
    }
  }, [fetchCategoriesFromStore, handleError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        parent_category_id: editingCategory.parent_category_id ?? null, // Handle null or undefined
      });
    } else {
      form.reset({
        name: '',
        parent_category_id: null, // Default to null
      });
    }
  }, [editingCategory, form]);

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = categoryTypeFilter === 'all' || 
                      (categoryTypeFilter === 'main' && category.parent_category_id === undefined) ||
                      (categoryTypeFilter === 'sub' && category.parent_category_id !== undefined);
    return matchesSearch && matchesType;
  });

  // Function to find parent category name for badges
  const getParentCategoryName = (parentId?: number | null) => {
    if (parentId === undefined || parentId === null) return null;
    const parentCategory = categories.find(c => c.id === parentId);
    return parentCategory ? parentCategory.name : null;
  };

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success('Category updated successfully');
      } else {
        await addCategory(data);
      }
      setShowDialog(false);
      setEditingCategory(null);
      form.reset();
    } catch (err) {
      handleError(err);
      toast.error('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsSubmitting(true);
      await deleteCategory(id);
      toast.success('Category deleted successfully');
    } catch (err) {
      handleError(err);
      toast.error('Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <CategoriesSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-4 text-lg font-semibold text-destructive">{error}</p>
          <Button
            variant="outline"
            size="lg"
            className="mt-4"
            onClick={() => fetchCategories()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header with title and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your menu categories
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Improved filtering and search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select 
          value={categoryTypeFilter}
          onValueChange={setCategoryTypeFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="main">Main Categories</SelectItem>
            <SelectItem value="sub">Sub Categories</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
              <FolderTree className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Categories Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {categoryTypeFilter === 'main' ? 'No main categories found.' : 
                 categoryTypeFilter === 'sub' ? 'No sub-categories found.' : 
                 'Add a new category to get started.'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const parentCategoryName = getParentCategoryName(category.parent_category_id);
              return (
                <Card key={category.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      {parentCategoryName ? (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {parentCategoryName}
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-800">
                          Main
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {parentCategoryName ? 
                        `Sub-category of ${parentCategoryName}` : 
                        'Main category for menu items'}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="flex items-center justify-end gap-2 border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(category);
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
                      onClick={() => handleDelete(category.id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={showDialog}>
        <DialogContent onClose={!isSubmitting ? () => {
          setShowDialog(false);
          setEditingCategory(null);
          form.reset();
        } : undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details below.'
                : 'Fill in the details to add a new category.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Category</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...field}
                        value={field.value ?? ''} // Ensure proper handling of null or undefined
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      >
                        <option value="">None (This is a main category)</option>
                        {mainCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingCategory(null);
                    form.reset();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingCategory ? 'Update Category' : 'Add Category'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
