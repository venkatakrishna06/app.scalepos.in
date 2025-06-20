import {useEffect, useState} from 'react';
import {
    AlertCircle,
    CheckCircle,
    Edit2,
    FileText,
    LayoutGrid,
    LayoutList,
    MoreVertical,
    Plus,
    Search,
    Tag,
    Trash2,
    XCircle
} from 'lucide-react';
import {MenuSkeleton} from '@/components/skeletons/menu-skeleton';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {FilterDropdownContainer} from '@/components/FilterDropdownContainer';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {MenuItemForm} from '@/components/forms/menu-item-form';
import {useErrorHandler} from '@/lib/hooks/useErrorHandler';
import {MenuItem} from '@/types';
import {toast} from '@/lib/toast';
import {cn} from '@/lib/utils';
import {useMenu} from '@/lib/hooks/useMenu';

type SortField = 'name' | 'price' | 'category';
type ViewMode = 'grid' | 'list';

export default function Menu() {
  const { handleError } = useErrorHandler();

  // Use React Query hooks instead of Zustand store
  const { 
    useMenuItemsQuery, 
    useCategoriesQuery,
    createItem,
    updateItem,
    deleteItem,
    updateItem: toggleAvailability
  } = useMenu();

  const { 
    data: menuItems = [], 
    isLoading: menuItemsLoading, 
    error: menuItemsError 
  } = useMenuItemsQuery();

  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    error: categoriesError
  } = useCategoriesQuery();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  // Log React Query data to console (this ensures the queries are active for DevTools)
  useEffect(() => {




  }, [menuItems, menuItemsLoading, categories, categoriesLoading]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category.name === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.category.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = availabilityFilter === 'all' || 
                             (availabilityFilter === 'available' && item.available) ||
                             (availabilityFilter === 'unavailable' && !item.available);
    return matchesCategory && matchesSearch && matchesAvailability;
  })

  const handleSubmit = async (data: Omit<MenuItem, 'id' | 'available'>) => {
    try {
      setIsSubmitting(true);
      if (editingItem) {
        updateItem({ id: editingItem.id, item: data });
        toast.success('Menu item updated successfully');
        setEditingItem(null);
      } else {
        createItem({ ...data, available: true });
      }
      setShowAddDialog(false);
    } catch (err) {

      toast.error('Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsSubmitting(true);
      deleteItem(id);
    } catch (err) {
      toast.error('Failed to delete menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (id: number) => {
    try {
      setIsSubmitting(true);
      const item = menuItems.find(item => item.id === id);
      if (item) {
        toggleAvailability({ 
          id, 
          item: { available: !item.available } 
        });
      }
    } catch (err) {
      handleError(err);
      toast.error('Failed to update item availability');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (menuItemsLoading || categoriesLoading) {
    return <MenuSkeleton />;
  }

  const error = menuItemsError || categoriesError;
  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-4 text-lg font-semibold text-destructive">
            {error instanceof Error ? error.message : 'An error occurred while loading data'}
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-4"
            onClick={() => {
              window.location.reload();
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
      {/* Page header with title and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menu Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your restaurant's menu items and categories
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <LayoutList className="mr-2 h-4 w-4" />
            ) : (
              <LayoutGrid className="mr-2 h-4 w-4" />
            )}
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>

          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Improved filtering and search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <FilterDropdownContainer>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[130px] sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  category.parent_category_id && (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>

            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-[130px] sm:w-[180px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </FilterDropdownContainer>
        </div>

      </div>

      <div className="mt-6">
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}>
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className="overflow-hidden group transition-all duration-200 hover:shadow-md hover:border-primary/20"
            >
              <div className="relative">
                {/* Larger, more prominent image */}
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=No+Image";
                    }}
                  />
                  {/* Price tag overlay */}
                  <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border">
                    <p className="text-base font-bold">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Availability badge and actions - positioned on top of image */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    item.available 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300" 
                      : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                  )}>
                    {item.available ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Available</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Unavailable</span>
                      </>
                    )}
                  </div>

                  {/* 3-dots action menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
                        disabled={isSubmitting}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleToggleAvailability(item.id)}
                        disabled={isSubmitting}
                      >
                        {item.available ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Unavailable</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Available</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditingItem(item);
                          setShowAddDialog(true);
                        }}
                        disabled={isSubmitting}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(item.id)}
                        disabled={isSubmitting}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardHeader className="pb-2 pt-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold line-clamp-1">{item.name}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2 mt-1 text-sm">
                  {item.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-4 pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>{item.category.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Menu Items Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or search criteria
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
          )}
        </div>
      </div>

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
