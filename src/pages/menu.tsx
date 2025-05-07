import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { MenuItemForm } from '@/components/forms/menu-item-form';
import { useMenuStore } from '@/lib/store';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { MenuItem } from '@/types';

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

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchMenuItems(), fetchCategories()]);
      } catch (err) {
        handleError(err);
      }
    };
    loadData();
  }, [fetchMenuItems, fetchCategories, handleError]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category.name === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = async (data: Omit<MenuItem, 'id' | 'available'>) => {
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, data);
        setEditingItem(null);
      } else {
        await addMenuItem({ ...data, available: true });
      }
      setShowAddDialog(false);
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMenuItem(id);
    } catch (err) {
      handleError(err);
    }
  };

  const handleToggleAvailability = async (id: number) => {
    try {
      await toggleItemAvailability(id);
    } catch (err) {
      handleError(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading menu items...</span>
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
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menu Management</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border bg-card shadow-sm"
          >
            <div className="relative">
              <img
                src={item.image}
                alt={item.name}
                className="h-48 w-full rounded-t-lg object-cover"
              />
              {!item.available && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                    Unavailable
                  </span>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category.name}</p>
                </div>
                <p className="font-semibold">₹{item.price.toFixed(2)}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant={item.available ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => handleToggleAvailability(item.id)}
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
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
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
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No Items found
          </div>
      )}

      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
      >
        <div className="p-6">
          <MenuItemForm
            onSubmit={handleSubmit}
            initialData={editingItem || undefined}
          />
        </div>
      </Dialog>
    </div>
  );
}