import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Order, Customer } from "@shared/schema";

export default function OrdersIndex() {
  const queryClient = useQueryClient();
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  // Fetch orders and customers
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        // Modified to return the actual response from the API
        const response = await apiRequest("DELETE", `${API_ENDPOINTS.ORDERS}/${id}`, null);
        return response.json(); // Parse the JSON response
      } catch (err: any) {
        // Extract the error message from the server response
        if (err.message && err.message.includes('409')) {
          throw new Error("Cannot delete order with associated job orders");
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ORDERS] });
      
      // Use the message from the API response if available
      const message = data?.message || "Order deleted successfully";
      
      toast({
        title: "Order Deleted",
        description: message,
      });
      setDeletingOrder(null);
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      
      // Use the error message
      const errorMessage = error?.message || "Failed to delete order";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (order: Order) => {
    setDeletingOrder(order);
  };

  const confirmDelete = () => {
    if (deletingOrder) {
      deleteMutation.mutate(deletingOrder.id);
    }
  };

  // Helper function to get customer name
  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || "Unknown";
  };

  const columns = [
    {
      header: "Order ID",
      accessorKey: "id",
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (row: { date: string }) => formatDateString(row.date),
    },
    {
      header: "Customer",
      accessorKey: "customerId",
      cell: (row: { customerId: string }) => getCustomerName(row.customerId),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: { status: string }) => <StatusBadge status={row.status} />,
    },
    {
      header: "Note",
      accessorKey: "note",
      cell: (row: { note: string | null }) => row.note || "-",
    },
    {
      header: "Actions",
      cell: (row: Order) => (
        <div className="flex space-x-2">
          <Link href={`/orders/${row.id}`}>
            <Button variant="ghost" size="icon" className="text-primary-500 hover:text-primary-700">
              <span className="material-icons text-sm">visibility</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} className="text-error-500 hover:text-error-700">
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const tableActions = (
    <Link href="/orders/new">
      <Button>
        <span className="material-icons text-sm mr-1">add</span>
        New Order
      </Button>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Orders</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Production Orders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={orders || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
            onRowClick={(row) => window.location.href = `/orders/${row.id}`}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingOrder} onOpenChange={(open) => !open && setDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete order #{deletingOrder?.id}.
              Note: You cannot delete orders that have associated job orders.
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
