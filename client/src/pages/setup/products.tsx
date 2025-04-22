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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Products() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<CustomerProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<CustomerProduct | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch products and related data
  const { data: allProducts, isLoading } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });
  
  // Filter customers by search query
  const filteredCustomers = customers?.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter products by selected customer
  const products = selectedCustomerId 
    ? allProducts?.filter(product => product.customerId === selectedCustomerId)
    : [];

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
  
  // Pre-select customer for new product
  const handleAddProduct = () => {
    setEditProduct(null);
    setFormOpen(true);
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

  // Define columns with proper typing
  const columns = [
    {
      header: "S/N",
      id: "index",
      cell: (_row: CustomerProduct, index?: number) => (index !== undefined ? index + 1 : 0)
    },
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: "Category",
      id: "categoryName",
      cell: (row: CustomerProduct) => getCategoryName(row.categoryId)
    },
    {
      header: "Item",
      id: "itemName",
      cell: (row: CustomerProduct) => getItemName(row.itemId)
    },
    {
      header: "Size Caption",
      id: "sizeCaption",
      cell: (row: CustomerProduct) => row.sizeCaption || "-"
    },
    {
      header: "Thickness",
      id: "thickness",
      cell: (row: CustomerProduct) => row.thickness ? `${row.thickness}` : "-"
    },
    {
      header: "Length (cm)",
      id: "lengthCm",
      cell: (row: CustomerProduct) => row.lengthCm ? `${row.lengthCm}` : "-"
    },
    {
      header: "Actions",
      id: "actions",
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
    <Button onClick={handleAddProduct}>
      <span className="material-icons text-sm mr-1">add</span>
      Add Product
    </Button>
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Products</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 relative">
              <Input
                placeholder="Search customer by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            <Select 
              value={selectedCustomerId} 
              onValueChange={setSelectedCustomerId}
              disabled={customersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {filteredCustomers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>
              {selectedCustomerId 
                ? `Products for ${getCustomerName(selectedCustomerId)}`
                : "Select a customer to view products"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCustomerId ? (
            <DataTable 
              data={products || []}
              columns={columns}
              isLoading={isLoading}
              actions={selectedCustomerId ? tableActions : undefined}
              pagination={true}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="material-icons text-4xl mb-2">people</span>
              <p>Please select a customer to view their products</p>
            </div>
          )}
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
            preSelectedCustomerId={selectedCustomerId}
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
