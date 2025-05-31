import {create} from 'zustand';
import {Category, MenuItem} from '@/types';
import {menuService} from '@/lib/api/services/menu.service';
import {toast} from '@/lib/toast';

interface MenuState {
  // State
  menuItems: MenuItem[];
  categories: Category[];
  loading: boolean;
  error: string | null;

  // API Actions
  fetchMenuItems: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: number, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: number) => Promise<void>;
  toggleItemAvailability: (id: number) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: number, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // Selectors
  getMenuItemsByCategory: (categoryId: number | 'all') => MenuItem[];
  getAvailableMenuItems: () => MenuItem[];
  getMenuItemById: (id: number) => MenuItem | undefined;
  getMainCategories: () => Category[];
  getSubcategories: (parentId: number) => Category[];
  getCategoryById: (id: number) => Category | undefined;
  searchMenuItems: (query: string) => MenuItem[];
}

/**
 * Store for managing menu items and categories
 * 
 * This store handles:
 * - Fetching menu items and categories from the API
 * - Adding, updating, and deleting menu items and categories
 * - Toggling menu item availability
 */
export const useMenuStore = create<MenuState>((set, get) => ({
  // State
  menuItems: [],
  categories: [],
  loading: false,
  error: null,

  fetchMenuItems: async () => {
    try {
      set({ loading: true, error: null });

      // Fetch from API directly (no caching)
      const items = await menuService.getItems();
      set({ menuItems: items });
    } catch (err) {

      const errorMessage = 'Failed to fetch menu items';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });

      // Fetch from API directly (no caching)
      const categories = await menuService.getCategories();
      set({ categories });
    } catch (err) {

      const errorMessage = 'Failed to fetch categories';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  addMenuItem: async (item) => {
    try {
      set({ loading: true, error: null });
      const newItem = await menuService.createItem(item);
     // set(state => ({ menuItems: [...state.menuItems, newItem] }));
      if(newItem){
        toast.success('Menu item added successfully');
      }

    } catch (err) {

      const errorMessage = 'Failed to add menu item';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  updateMenuItem: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedItem = await menuService.updateItem(id, updates);
      set(state => ({
        menuItems: state.menuItems.map(item =>
          item.id === id ? updatedItem : item
        ),
      }));
      toast.success('Menu item updated successfully');
    } catch (err) {

      const errorMessage = 'Failed to update menu item';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  deleteMenuItem: async (id) => {
    try {
      set({ loading: true, error: null });
      await menuService.deleteItem(id);
      set(state => ({
        menuItems: state.menuItems.filter(item => item.id !== id),
      }));
      toast.success('Menu item deleted successfully');
    } catch (err) {

      const errorMessage = 'Failed to delete menu item';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  toggleItemAvailability: async (id) => {
    const item = get().menuItems.find(item => item.id === id);
    if (item) {
      try {
        await get().updateMenuItem(id, { available: !item.available });
        toast.success(`${item.name} is now ${!item.available ? 'available' : 'unavailable'}`);
      } catch (err) {

        // Error is already handled in updateMenuItem
      }
    }
  },

  addCategory: async (category) => {
    try {
      set({ loading: true, error: null });
      const newCategory = await menuService.createCategory(category);
      set(state => ({ categories: [...state.categories, newCategory] }));
      toast.success('Category added successfully');
    } catch (err) {

      const errorMessage = 'Failed to add category';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  updateCategory: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedCategory = await menuService.updateCategory(id, updates);
      set(state => ({
        categories: state.categories.map(category =>
          category.id === id ? updatedCategory : category
        ),
      }));
      toast.success('Category updated successfully');
    } catch (err) {

      const errorMessage = 'Failed to update category';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  deleteCategory: async (id) => {
    try {
      set({ loading: true, error: null });
      await menuService.deleteCategory(id);
      set(state => ({
        categories: state.categories.filter(category => category.id !== id),
        // Also filter out menu items that belong to this category
        menuItems: state.menuItems.filter(
          item => item.category_id !== id
        ),
      }));
      toast.success('Category deleted successfully');
    } catch (err) {

      const errorMessage = 'Failed to delete category';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  // Selectors
  getMenuItemsByCategory: (categoryId) => {
    const { menuItems } = get();
    if (categoryId === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category_id === categoryId);
  },

  getAvailableMenuItems: () => {
    const { menuItems } = get();
    return menuItems.filter(item => item.available);
  },

  getMenuItemById: (id) => {
    const { menuItems } = get();
    return menuItems.find(item => item.id === id);
  },

  getMainCategories: () => {
    const { categories } = get();
    return categories.filter(category => !category.parent_category_id);
  },

  getSubcategories: (parentId) => {
    const { categories } = get();
    return categories.filter(category => category.parent_category_id === parentId);
  },

  getCategoryById: (id) => {
    const { categories } = get();
    return categories.find(category => category.id === id);
  },

  searchMenuItems: (query) => {
    const { menuItems } = get();
    const lowerQuery = query.toLowerCase();
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      (item.description && item.description.toLowerCase().includes(lowerQuery))
    );
  },
}));
