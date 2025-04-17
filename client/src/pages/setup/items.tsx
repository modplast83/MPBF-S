import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ItemForm } from "@/components/setup/item-form";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Item, Category } from "@shared/schema";

export default function Items() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  // Fetch items and categories
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.ITEMS}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ITEMS] });
      toast({
        title: "Item Deleted",
        description: "The item has been deleted successfully.",
      });
      setDeletingItem(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: Item) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleDelete = (item: Item) => {
    setDeletingItem(item);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditItem(null);
  };

  // Helper function to get category name
  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || "Unknown";
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
      header: "Full Name",
      accessorKey: "fullName",
    },
    {
      header: "Category",
      accessorKey: "categoryId",
      cell: (row: { categoryId: string }) => getCategoryName(row.categoryId),
    },
    {
      header: "Actions",
      cell: (row: Item) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)} className="text-primary-500 hover:text-primary-700">
            <span className="material-icons text-sm">edit</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} className="text-error-500 hover:text-error-700">
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const tableActions = (
    <Button onClick={() => setFormOpen(true)}>
      <span className="material-icons text-sm mr-1">add</span>
      Add Item
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Items</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={items || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Item Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>
          <ItemForm 
            item={editItem || undefined}
            onSuccess={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the item{' '}
              <span className="font-semibold">"{deletingItem?.name}"</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-error-500 hover:bg-error-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
