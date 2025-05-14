import {useEffect, useState} from 'react';
import {useToast} from '@/components/ui/use-toast';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {ChevronDown, Loader2} from 'lucide-react';
import {menuService} from '@/lib/api/services';
import {Category} from '@/types';

interface CategoryGstSettingsProps {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
}

export function CategoryGstSettings({ categories, onUpdate }: CategoryGstSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [originalCategories, setOriginalCategories] = useState<Category[]>(categories);
  const [error, setError] = useState<string | null>(null);

  // Group categories by parent/child relationship
  const mainCategories = localCategories.filter(cat => !cat.parent_category_id);
  const subCategoriesByParent = localCategories.reduce((acc, cat) => {
    if (cat.parent_category_id) {
      if (!acc[cat.parent_category_id]) {
        acc[cat.parent_category_id] = [];
      }
      acc[cat.parent_category_id].push(cat);
    }
    return acc;
  }, {} as Record<number, Category[]>);

  // Initialize all categories as expanded by default
  const initialExpandedState = mainCategories.reduce((acc, category) => {
    if (subCategoriesByParent[category.id]) {
      acc[category.id] = true;
    }
    return acc;
  }, {} as Record<number, boolean>);

  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>(initialExpandedState);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Update original categories when props change
  useEffect(() => {
    setLocalCategories(categories);
    setOriginalCategories(categories);

    // Reset expanded state when categories change
    const newInitialExpandedState = categories
      .filter(cat => !cat.parent_category_id)
      .reduce((acc, category) => {
        const hasChildren = categories.some(c => c.parent_category_id === category.id);
        if (hasChildren) {
          acc[category.id] = true;
        }
        return acc;
      }, {} as Record<number, boolean>);

    setExpandedCategories(newInitialExpandedState);
  }, [categories]);

  // Handle category checkbox change
  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    // Helper function to find all descendant category IDs (children, grandchildren, etc.)
    const findAllDescendants = (parentId: number): number[] => {
      const directChildren = localCategories
        .filter(cat => cat.parent_category_id === parentId)
        .map(cat => cat.id);

      const allDescendants = [...directChildren];

      // Recursively find descendants of each child
      directChildren.forEach(childId => {
        allDescendants.push(...findAllDescendants(childId));
      });

      return allDescendants;
    };

    // Get all descendant categories that need to be updated
    const descendantIds = findAllDescendants(categoryId);

    setLocalCategories(
      localCategories.map((category) => {
        // Update the clicked category
        if (category.id === categoryId) {
          return { ...category, include_in_gst: checked };
        }

        // Update all descendant categories
        if (descendantIds.includes(category.id)) {
          return { ...category, include_in_gst: checked };
        }

        return category;
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Find categories that have changed
      const changedCategories = localCategories.filter(
        (category) => {
          const original = originalCategories.find(c => c.id === category.id);
          return original && original.include_in_gst !== category.include_in_gst;
        }
      );

      // Only update categories that have changed
      const categoryPromises = changedCategories.map((category) =>
        menuService.updateCategory(category.id, { include_in_gst: category.include_in_gst })
      );

      await Promise.all(categoryPromises);
      onUpdate(localCategories);

      // Update original categories after successful save
      setOriginalCategories(localCategories);

      toast({
        title: 'Success',
        description: `Category GST settings updated successfully (${changedCategories.length} items changed)`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save category GST settings';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        <p className="mb-4 text-sm text-muted-foreground">
          Select which menu categories should be included in GST calculations
        </p>

        <div className="space-y-4">
          {/* Main Categories with Expandable Subcategories */}
          {mainCategories.map((category) => (
            <div key={category.id} className="category-group">
              <div className="flex items-center">
                {subCategoriesByParent[category.id] && (
                  <button 
                    onClick={() => toggleCategory(category.id)}
                    className="p-1 mr-1 rounded hover:bg-accent"
                    type="button"
                  >
                    <ChevronDown 
                      className={`h-3 w-3 transition-transform ${expandedCategories[category.id] ? 'transform rotate-180' : ''}`} 
                    />
                  </button>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={category.include_in_gst}
                    onCheckedChange={(checked) => handleCategoryChange(category.id, !!checked)}
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category.name}
                  </label>
                </div>
              </div>

              {/* Subcategories section */}
              {expandedCategories[category.id] && subCategoriesByParent[category.id] && (
                <div className="ml-5 mt-2 space-y-2 border-l-2 border-muted-foreground/20 pl-2">
                  {subCategoriesByParent[category.id].map(subCategory => (
                    <div key={subCategory.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${subCategory.id}`}
                        checked={subCategory.include_in_gst}
                        onCheckedChange={(checked) => handleCategoryChange(subCategory.id, !!checked)}
                      />
                      <label
                        htmlFor={`category-${subCategory.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {subCategory.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Category Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
