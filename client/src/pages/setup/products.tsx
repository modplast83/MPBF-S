import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ProductForm } from "@/components/setup/product-form";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { CustomerProduct, Customer, Item, Category } from "@shared/schema";

export default function Products() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<CustomerProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<CustomerProduct | null>(null);

  // Fetch products and related data
  const { data: products, isLoading } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.CUSTOMER_PRODUCTS}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS] });
      toast({
        title: "Product Deleted",
        description: "The product has been deleted successfully.",
      });
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: CustomerProduct) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const handleDelete = (product: CustomerProduct) => {
    setDeletingProduct(product);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditProduct(null);
  };

  // Helper functions to get related data
  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || "Unknown";
  };

  const getItemName = (itemId: string) => {
    return items?.find(i => i.id === itemId)?.name || "Unknown";
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || "Unknown";
  };

  const columns = [
    {
      header: "Customer",
      accessorKey: (row: CustomerProduct) => getCustomerName(row.customerId),
    },
    {
      header: "Item",
      accessorKey: "itemId",
      cell: (row: { itemId: string }) => getItemName(row.itemId),
    },
    {
      header: "Category",
      accessorKey: "categoryId",
      cell: (row: { categoryId: string }) => getCategoryName(row.categoryId),
    },
    {
      header: "Size",
      accessorKey: "sizeCaption",
    },
    {
      header: "Material",
      accessorKey: "rawMaterial",
    },
    {
      header: "Actions",
      cell: (row: CustomerProduct) => (
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
      Add Product
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Products</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Customer Products</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={products || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm 
            product={editProduct || undefined}
            onSuccess={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product. This action cannot be undone.
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
