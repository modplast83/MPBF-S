import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { FinalProduct, JobOrder, CustomerProduct, Order, Customer } from "@shared/schema";

export default function FinalProducts() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<FinalProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<FinalProduct | null>(null);
  
  // Form state
  const [jobOrderId, setJobOrderId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState("in-stock");

  // Fetch final products and related data
  const { data: finalProducts, isLoading } = useQuery<FinalProduct[]>({
    queryKey: [API_ENDPOINTS.FINAL_PRODUCTS],
  });

  const { data: jobOrders } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  const { data: customerProducts } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { jobOrderId: number; quantity: number; status: string }) => {
      if (editProduct) {
        await apiRequest("PUT", `${API_ENDPOINTS.FINAL_PRODUCTS}/${editProduct.id}`, data);
      } else {
        await apiRequest("POST", API_ENDPOINTS.FINAL_PRODUCTS, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FINAL_PRODUCTS] });
      toast({
        title: `Final Product ${editProduct ? "Updated" : "Created"}`,
        description: `The final product has been ${editProduct ? "updated" : "created"} successfully.`,
      });
      handleCloseForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editProduct ? "update" : "create"} final product: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.FINAL_PRODUCTS}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FINAL_PRODUCTS] });
      toast({
        title: "Final Product Deleted",
        description: "The final product has been deleted successfully.",
      });
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete final product: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: FinalProduct) => {
    setEditProduct(product);
    setJobOrderId(product.jobOrderId);
    setQuantity(product.quantity);
    setStatus(product.status);
    setFormOpen(true);
  };

  const handleDelete = (product: FinalProduct) => {
    setDeletingProduct(product);
  };

  const handleSave = () => {
    if (jobOrderId <= 0 || quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({ jobOrderId, quantity, status });
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditProduct(null);
    setJobOrderId(0);
    setQuantity(0);
    setStatus("in-stock");
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
  };

  // Helper functions
  const getJobOrderDetails = (jobOrderId: number) => {
    const jobOrder = jobOrders?.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return { orderNumber: "Unknown", productName: "Unknown", customer: "Unknown" };
    
    const order = orders?.find(o => o.id === jobOrder.orderId);
    const product = customerProducts?.find(cp => cp.id === jobOrder.customerProductId);
    const customer = order ? customers?.find(c => c.id === order.customerId) : null;
    
    return {
      orderNumber: order?.id.toString() || "Unknown",
      productName: product?.itemId || "Unknown",
      customer: customer?.name || "Unknown"
    };
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Order",
      accessorKey: "jobOrderId",
      cell: (row: { jobOrderId: number }) => {
        const details = getJobOrderDetails(row.jobOrderId);
        return `#${details.orderNumber}`;
      },
    },
    {
      header: "Customer",
      accessorKey: "jobOrderId",
      cell: (row: { jobOrderId: number }) => {
        const details = getJobOrderDetails(row.jobOrderId);
        return details.customer;
      },
    },
    {
      header: "Product",
      accessorKey: "jobOrderId",
      cell: (row: { jobOrderId: number }) => {
        const details = getJobOrderDetails(row.jobOrderId);
        return details.productName;
      },
    },
    {
      header: "Quantity (Kg)",
      accessorKey: "quantity",
    },
    {
      header: "Completion Date",
      accessorKey: "completedDate",
      cell: (row: { completedDate: string }) => formatDateString(row.completedDate),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: { status: string }) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      cell: (row: FinalProduct) => (
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
      Add Final Product
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Final Products</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Final Products</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={finalProducts || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Final Product Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit Final Product" : "Add New Final Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jobOrder" className="text-right">
                Job Order
              </Label>
              <Select value={jobOrderId.toString()} onValueChange={(value) => setJobOrderId(parseInt(value))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a job order" />
                </SelectTrigger>
                <SelectContent>
                  {jobOrders?.map((jo) => {
                    const details = getJobOrderDetails(jo.id);
                    return (
                      <SelectItem key={jo.id} value={jo.id.toString()}>
                        Order #{details.orderNumber} - {details.productName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity (Kg)
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? editProduct ? "Updating..." : "Creating..."
                : editProduct ? "Update" : "Create"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this final product entry.
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
