import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { Order, Customer } from "@shared/schema";

export default function OrdersIndex() {
  const queryClient = useQueryClient();
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();

  // Fetch orders and customers
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });
  
  // Filter orders based on active tab
  const filteredOrders = orders?.filter(order => {
    if (activeTab === "all") return true;
    
    // Match the status with the tab value
    return order.status === activeTab;
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      try {
        // Make direct API request with just the status change
        const response = await fetch(`${API_ENDPOINTS.ORDERS}/${id}/status`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update status");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error updating status:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ORDERS] });
      
      // Show success message
      let statusLabel = variables.status;
      if (variables.status === "processing") statusLabel = "For Production";
      if (variables.status === "hold") statusLabel = "On Hold";
      
      toast({
        title: "Order Status Updated",
        description: `Order #${variables.id} status changed to ${statusLabel}`,
      });
      
      // If we're on a status tab and the status changed to something else,
      // let's switch to the new status tab or stay on "all"
      if (activeTab !== "all" && activeTab !== variables.status) {
        setActiveTab(variables.status);
      }
    },
    onError: (error: any) => {
      console.error("Status update error:", error);
      const errorMessage = error?.message || "Failed to update order status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const handleStatusChange = (order: Order, newStatus: string) => {
    updateStatusMutation.mutate({ id: order.id, status: newStatus });
  };

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
          
          {/* Status Change Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-secondary-500 hover:text-secondary-700">
                <span className="material-icons text-sm">swap_horiz</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleStatusChange(row, "pending")}
                disabled={row.status === "pending"}
                className={row.status === "pending" ? "bg-secondary-100" : ""}
              >
                <span className="w-3 h-3 rounded-full bg-secondary-300 mr-2"></span>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange(row, "processing")}
                disabled={row.status === "processing"}
                className={row.status === "processing" ? "bg-secondary-100" : ""}
              >
                <span className="w-3 h-3 rounded-full bg-primary-300 mr-2"></span>
                For Production
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange(row, "hold")}
                disabled={row.status === "hold"}
                className={row.status === "hold" ? "bg-secondary-100" : ""}
              >
                <span className="w-3 h-3 rounded-full bg-warning-300 mr-2"></span>
                Hold
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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

  // Mobile card view for orders
  const renderMobileOrderList = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return (
        <div className="text-center py-8 px-4 bg-gray-50 rounded-md">
          <span className="material-icons text-gray-300 text-3xl mb-2">receipt_long</span>
          <p className="text-gray-500">
            {activeTab === "all" 
              ? t("orders.no_orders") 
              : `No ${activeTab === "processing" ? "For Production" : activeTab === "hold" ? "On Hold" : "Pending"} orders found`}
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="overflow-hidden hover:shadow-md transition-all">
            <Link href={`/orders/${order.id}`}>
              <CardHeader className="p-3 pb-2 flex flex-row justify-between items-start bg-gray-50">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-icons text-xs text-primary-500">receipt_long</span>
                    <CardTitle className="text-sm font-semibold">#{order.id}</CardTitle>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatDateString(order.date)}</p>
                </div>
                <StatusBadge status={order.status} />
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <p className="text-xs text-gray-500">{t("orders.customer")}</p>
                    <p className="text-sm font-medium truncate">{getCustomerName(order.customerId)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("orders.customer_ar")}</p>
                    <p className="text-sm font-medium truncate">{getCustomerNameAr(order.customerId)}</p>
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{t("orders.plate_drawer_code")}</p>
                    <p className="text-sm font-medium">{getCustomerPlateDrawerCode(order.customerId)}</p>
                  </div>
                  
                  {order.note && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">{t("orders.note")}</p>
                      <p className="text-sm mt-1 text-gray-700">{order.note}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-2 pt-0 flex justify-between items-center">
                <span className="text-primary-500 text-xs flex items-center">
                  {t("common.view")}
                  <span className="material-icons text-xs ml-1">arrow_forward</span>
                </span>
                <div className="flex space-x-1">
                  {/* Status Change Dropdown for Mobile */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="h-8 w-8 rounded-full text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50"
                      >
                        <span className="material-icons text-sm">swap_horiz</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(order, "pending");
                        }}
                        disabled={order.status === "pending"}
                        className={order.status === "pending" ? "bg-secondary-100" : ""}
                      >
                        <span className="w-3 h-3 rounded-full bg-secondary-300 mr-2"></span>
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(order, "processing");
                        }}
                        disabled={order.status === "processing"}
                        className={order.status === "processing" ? "bg-secondary-100" : ""}
                      >
                        <span className="w-3 h-3 rounded-full bg-primary-300 mr-2"></span>
                        For Production
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(order, "hold");
                        }}
                        disabled={order.status === "hold"}
                        className={order.status === "hold" ? "bg-secondary-100" : ""}
                      >
                        <span className="w-3 h-3 rounded-full bg-warning-300 mr-2"></span>
                        Hold
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(order);
                    }} 
                    className="h-8 w-8 rounded-full text-error-500 hover:text-error-700 hover:bg-error-50"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </Button>
                </div>
              </CardFooter>
            </Link>
          </Card>
        ))}
      </div>
    );
  };

  // Mobile view fallback and loading state
  const renderMobileLoadingState = () => {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t("orders.title")}</h1>
        {isMobile && (
          <Link href="/orders/new">
            <Button className="rounded-full h-10 w-10 p-0">
              <span className="material-icons text-base">add</span>
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t("orders.active_production_orders")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="processing">For Production</TabsTrigger>
              <TabsTrigger value="hold">On Hold</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                isMobile ? renderMobileLoadingState() : <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
              ) : isMobile ? (
                renderMobileOrderList()
              ) : (
                <DataTable 
                  data={filteredOrders || []}
                  columns={columns as any}
                  actions={tableActions}
                  onRowClick={(row) => window.location.href = `/orders/${row.id}`}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingOrder} onOpenChange={(open) => !open && setDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.logout_confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete order #{deletingOrder?.id} and all its associated data including:
              - Job orders
              - Rolls
              - Final products
              - Quality checks
              - SMS messages
              
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
