import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, Filter, SortAsc, SortDesc, LayoutGrid, LayoutList, AlertCircle } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";
import { MenuItemForm } from '@/components/forms/menu-item-form';
import { useMenuStore } from '@/lib/store';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { MenuItem } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SortField = 'name' | 'price' | 'category';
type ViewMode = 'grid' | 'list';

export default function Menu() {
  const {
    menuItems,
    categories,
    loading,
    error,
    fetchMenuItems,
    fetchCategories,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability
  } = useMenuStore();
  const { handleError } = useErrorHandler();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Using a ref to prevent duplicate API calls in StrictMode
  const isDataFetchedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchMenuItems(), fetchCategories()]);
      } catch (err) {
        handleError(err);
      }
    };

    if (!isDataFetchedRef.current) {
      loadData();
      isDataFetchedRef.current = true;
    }
  }, [fetchMenuItems, fetchCategories, handleError]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category.name === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.category.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'name':
        return multiplier * a.name.localeCompare(b.name);
      case 'price':
        return multiplier * (a.price - b.price);
      case 'category':
        return multiplier * a.category.name.localeCompare(b.category.name);
      default:
        return 0;
    }
  });

  const handleSubmit = async (data: Omit<MenuItem, 'id' | 'available'>) => {
    try {
      setIsSubmitting(true);
      if (editingItem) {
        await updateMenuItem(editingItem.id, data);
        toast.success('Menu item updated successfully');
        setEditingItem(null);
      } else {
        await addMenuItem({ ...data, available: true });
        toast.success('Menu item added successfully');
      }
      setShowAddDialog(false);
    } catch (err) {
      handleError(err);
      toast.error('Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsSubmitting(true);
      await deleteMenuItem(id);
      toast.success('Menu item deleted successfully');
    } catch (err) {
      handleError(err);
      toast.error('Failed to delete menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (id: number) => {
    try {
      setIsSubmitting(true);
      await toggleItemAvailability(id);
      toast.success('Item availability updated');
    } catch (err) {
      handleError(err);
      toast.error('Failed to update item availability');
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin"/>
            <span>Loading menu items...</span>
          </div>
        </div>
    );
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
            onClick={() => {
              fetchMenuItems();
              fetchCategories();
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menu Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your restaurant's menu items and categories
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <LayoutList className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                category.parent_category_id && (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                )
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b pb-4">
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
          onClick={() => toggleSort('price')}
          className="gap-2"
        >
          Price
          {sortField === 'price' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSort('category')}
          className="gap-2"
        >
          Category
          {sortField === 'category' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg",
              viewMode === 'list' && "flex gap-6"
            )}
          >
            <div className={cn(
              "relative",
              viewMode === 'list' ? "w-48" : "w-full"
            )}>
              <img
                src={item.image}
                alt={item.name}
                className={cn(
                  "object-cover",
                  viewMode === 'list'
                    ? "h-full w-full rounded-l-lg"
                    : "aspect-[4/3] w-full rounded-t-lg"
                )}
              />
              {!item.available && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                    Unavailable
                  </span>
                </div>
              )}
            </div>
            <div className={cn(
              "flex flex-col",
              viewMode === 'list' ? "flex-1 py-4 pr-6" : "p-6"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category.name}</p>
                </div>
                <p className="font-semibold">₹{item.price.toFixed(2)}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              <div className="mt-4 flex gap-2">
                <Button 
                  variant={item.available ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => handleToggleAvailability(item.id)}
                  disabled={isSubmitting}
                >
                  {item.available ? 'Mark Unavailable' : 'Mark Available'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItem(item);
                    setShowAddDialog(true);
                  }}
                  disabled={isSubmitting}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <p className="text-muted-foreground">No menu items found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={showAddDialog}

      >
        <DialogContent className="sm:max-w-[600px]"  onClose={!isSubmitting ? () => {
          setShowAddDialog(false);
          setEditingItem(null);
        } : undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the menu item details below.'
                : 'Fill in the details to add a new menu item.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <MenuItemForm
              onSubmit={handleSubmit}
              initialData={editingItem || undefined}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
