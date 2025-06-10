import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/components/setup/category-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Category } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

export default function Categories() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.CATEGORIES}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CATEGORIES] });
      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully.",
      });
      setDeletingCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (category: Category) => {
    setEditCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
  };

  const confirmDelete = () => {
    if (deletingCategory) {
      deleteMutation.mutate(deletingCategory.id);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditCategory(null);
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Code",
      accessorKey: "code",
    },
    {
      header: "Actions",
      cell: (row: { id: string } & Category) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)} className="text-primary-500 hover:text-primary-700">
            <span className="material-icons text-sm">edit</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700">
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const tableActions = (
    <Button onClick={() => setFormOpen(true)}>
      <span className="material-icons text-sm mr-1">add</span>
      {isMobile ? "" : t('setup.categories.add')}
    </Button>
  );
  
  // Mobile card view for categories
  const renderMobileCards = () => {
    if (!categories || categories.length === 0) {
      return (
        <div className="text-center py-8 px-4 bg-gray-50 rounded-md">
          <span className="material-icons text-gray-300 text-3xl mb-2">category</span>
          <p className="text-gray-500">{t('setup.categories.no_categories')}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {categories?.map((category) => (
          <Card 
            key={category.id} 
            className="overflow-hidden hover:shadow-md transition-all"
          >
            <CardHeader className="p-3 pb-2 flex flex-row justify-between items-start bg-gray-50">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="material-icons text-xs text-primary-500">category</span>
                  {category.name}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">{t('setup.categories.id')}: {category.id}</p>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="mb-2">
                <p className="text-xs text-gray-500">{t('setup.categories.code')}</p>
                <p className="text-sm font-medium">{category.code}</p>
              </div>
              
              <div className="mt-3 pt-2 flex justify-end items-center space-x-2 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(category);
                  }}
                  className="h-8 w-8 rounded-full text-primary-500 hover:text-primary-700 hover:bg-primary-50"
                >
                  <span className="material-icons text-sm">edit</span>
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(category);
                  }}
                  className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <span className="material-icons text-sm">delete</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  // Mobile loading state
  const renderMobileLoadingState = () => {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t('setup.categories.title')}</h1>
        {isMobile && (
          <Button onClick={() => setFormOpen(true)}>
            <span className="material-icons text-sm">add</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t('setup.categories.title')}</span>
            {!isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CATEGORIES] })}
                className="ml-auto"
              >
                <span className="material-icons text-sm mr-1">refresh</span>
                {t('common.refresh')}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            isMobile ? renderMobileLoadingState() : <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
          ) : isMobile ? (
            renderMobileCards()
          ) : (
            <DataTable 
              data={categories || []}
              columns={columns as any}
              actions={tableActions}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Category Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className={isMobile ? "max-w-[95vw] p-4 sm:p-6" : "sm:max-w-[550px]"}>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? t('setup.categories.edit') : t('setup.categories.add')}
            </DialogTitle>
            <DialogDescription>
              {editCategory 
                ? t('setup.categories.edit_description') 
                : t('setup.categories.add_description')}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm 
            category={editCategory || undefined}
            onSuccess={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent className={isMobile ? "max-w-[95vw] p-4 sm:p-6" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete_confirmation')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.delete_confirmation_message', { item: deletingCategory?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isMobile ? "flex-col space-y-2" : ""}>
            <AlertDialogCancel className={isMobile ? "w-full mt-0" : ""}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className={`bg-red-500 hover:bg-red-600 ${isMobile ? "w-full" : ""}`}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
