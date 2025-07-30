import {AlertCircle, Edit2, FolderTree, Loader2, Plus, Search, Trash2} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Card, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Badge} from '@/components/ui/badge';
import {useCategoriesPage} from '@/hooks/useCategoriesPage';
import {CategoriesSkeleton} from "@/components/composed/categories-skeleton.tsx";

export default function Categories() {
    const {
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
    } = useCategoriesPage();

    if (isLoading) {
        return <CategoriesSkeleton/>;
    }

    if (isError) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-destructive"/>
                    <p className="mt-4 text-lg font-semibold text-destructive">{error?.message || 'An error occurred'}</p>
                    <Button
                        variant="outline"
                        size="lg"
                        className="mt-4"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Manage your menu categories
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => openNewDialog()}>
                        <Plus className="mr-2 h-4 w-4"/>
                        Add Category
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
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
                        <SelectValue placeholder="Category Type"/>
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
                            <FolderTree className="mx-auto h-8 w-8 text-muted-foreground"/>
                            <h3 className="mt-2 text-lg font-semibold">No Categories Found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {categoryTypeFilter === 'main' ? 'No main categories found.' :
                                    categoryTypeFilter === 'sub' ? 'No sub-categories found.' :
                                        'Add a new category to get started.'}
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => openNewDialog()}
                            >
                                <Plus className="mr-2 h-4 w-4"/>
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
                                            onClick={() => openEditDialog(category)}
                                            disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading || deleteCategoryMutation.isLoading}
                                        >
                                            <Edit2 className="mr-2 h-4 w-4"/>
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(category.id)}
                                            disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading || deleteCategoryMutation.isLoading}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4"/>
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
                <DialogContent onClose={() => {
                    setShowDialog(false);
                    setEditingCategory(null);
                    form.reset();
                }}>
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
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter category name" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="parent_category_id"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Main Category</FormLabel>
                                        <FormControl>
                                            <select
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                {...field}
                                                value={field.value ?? ''}
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
                                        <FormMessage/>
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
                                    disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit"
                                        disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}>
                                    {createCategoryMutation.isLoading || updateCategoryMutation.isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
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

