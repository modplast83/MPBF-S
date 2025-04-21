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
import { useTranslation } from "react-i18next";
import { Order, Customer } from "@shared/schema";

export default function OrdersIndex() {
  const queryClient = useQueryClient();
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const { t } = useTranslation();

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
      // Use raw fetch instead of apiRequest for better error handling
      const response = await fetch(`${API_ENDPOINTS.ORDERS}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      // Parse the response
      const data = await response.json();
      
      // If response is not ok, throw an error with the message from the server
      if (!response.ok) {
        throw new Error(data.message || `Failed to delete order (${response.status})`);
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ORDERS] });
      
      // Use the message from the API response if available
      const message = data?.message || "Order and associated job orders deleted successfully";
      
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

  // Helper functions to get customer info
  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || "Unknown";
  };
  
  const getCustomerNameAr = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.nameAr || "-";
  };
  
  const getCustomerPlateDrawerCode = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.plateDrawerCode || "-";
  };

  const columns = [
    {
      header: t("orders.order_id"),
      accessorKey: "id",
    },
    {
      header: t("orders.date"),
      accessorKey: "date",
      cell: (row: { date: string }) => formatDateString(row.date),
    },
    {
      header: t("orders.customer"),
      accessorKey: "customerId",
      cell: (row: { customerId: string }) => getCustomerName(row.customerId),
    },
    {
      header: t("orders.customer_ar"),
      accessorKey: "customerId",
      cell: (row: { customerId: string }) => getCustomerNameAr(row.customerId),
    },
    {
      header: t("orders.plate_drawer_code"),
      accessorKey: "customerId",
      cell: (row: { customerId: string }) => getCustomerPlateDrawerCode(row.customerId),
    },
    {
      header: t("orders.status"),
      accessorKey: "status",
      cell: (row: { status: string }) => <StatusBadge status={row.status} />,
    },
    {
      header: t("orders.note"),
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
        {t("orders.new_order")}
      </Button>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t("orders.title")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t("orders.active_production_orders")}</span>
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
            <AlertDialogTitle>{t("common.logout_confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete order #{deletingOrder?.id} and all its associated job orders.
              Note: Orders with job orders that have rolls cannot be deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-error-500 hover:bg-error-600"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
