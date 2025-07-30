import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {ChevronDown, Loader2, Search, XCircle} from 'lucide-react';
import {Category} from '@/types';
import {toast} from '@/lib/toast';
import {Input} from '@/components/ui/input';
import {useUpdateCategory} from '@/api/menu';

interface CategoryGstSettingsProps {
    categories: Category[];
    onUpdate: (categories: Category[]) => void;
    onMenuItemsRefresh?: () => void;
}

export function CategoryGstSettings({categories, onUpdate, onMenuItemsRefresh}: CategoryGstSettingsProps) {
    const updateCategoryMutation = useUpdateCategory();
    const [localCategories, setLocalCategories] = useState<Category[]>(categories);
    const [originalCategories, setOriginalCategories] = useState<Category[]>(categories);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredCategories = searchQuery
        ? localCategories.filter(category =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : localCategories;

    const mainCategories = filteredCategories.filter(cat => !cat.parent_category_id);
    const subCategoriesByParent = filteredCategories.reduce((acc, cat) => {
        if (cat.parent_category_id) {
            if (!acc[cat.parent_category_id]) {
                acc[cat.parent_category_id] = [];
            }
            acc[cat.parent_category_id].push(cat);
        }
        return acc;
    }, {} as Record<number, Category[]>);

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

    useEffect(() => {
        setLocalCategories(categories);
        setOriginalCategories(categories);
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

    const handleCategoryChange = (categoryId: number, checked: boolean) => {
        const findAllDescendants = (parentId: number): number[] => {
            const directChildren = localCategories
                .filter(cat => cat.parent_category_id === parentId)
                .map(cat => cat.id);
            const allDescendants = [...directChildren];
            directChildren.forEach(childId => {
                allDescendants.push(...findAllDescendants(childId));
            });
            return allDescendants;
        };
        const descendantIds = findAllDescendants(categoryId);
        setLocalCategories(
            localCategories.map((category) => {
                if (category.id === categoryId) {
                    return {...category, include_in_gst: checked};
                }
                if (descendantIds.includes(category.id)) {
                    return {...category, include_in_gst: checked};
                }
                return category;
            })
        );
    };

    const handleSave = async () => {
        try {
            setError(null);
            const changedCategories = localCategories.filter(
                (category) => {
                    const original = originalCategories.find(c => c.id === category.id);
                    return original && original.include_in_gst !== category.include_in_gst;
                }
            );

            const categoryPromises = changedCategories.map((category) =>
                updateCategoryMutation.mutateAsync({
                    id: category.id,
                    category: {include_in_gst: category.include_in_gst}
                })
            );

            await Promise.all(categoryPromises);
            onUpdate(localCategories);
            setOriginalCategories(localCategories);

            if (onMenuItemsRefresh) {
                onMenuItemsRefresh();
            }
            toast.success(`Category GST settings updated successfully (${changedCategories.length} items changed)`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save category GST settings';
            setError(errorMessage);
            toast.error(errorMessage);
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
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                        <Input
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full p-0"
                                onClick={() => setSearchQuery('')}
                            >
                                <XCircle className="h-4 w-4"/>
                                <span className="sr-only">Clear search</span>
                            </Button>
                        )}
                    </div>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                    Select which menu categories should be included in GST calculations
                </p>

                <div className="space-y-4">
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
                    <Button onClick={handleSave} disabled={updateCategoryMutation.isLoading}>
                        {updateCategoryMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Category Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
