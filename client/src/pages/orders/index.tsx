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
import { QuickActions } from "@/components/ui/quick-actions";
import { Filter, Search, Plus, Download, RefreshCw, Eye } from "lucide-react";

export default function OrdersIndex() {
  const queryClient = useQueryClient();
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();

  // Fetch orders and customers
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });
  
  // Filter orders based on active tab and sort by order ID descending
  const filteredOrders = orders
    ?.filter(order => {
      if (activeTab === "all") return true;
      
      // Special case for "processing" tab - show both "processing" and "For Production" status orders
      if (activeTab === "processing") {
        return order.status === "processing" || order.status === "For Production";
      }
      
      // Match the status with the tab value for other tabs
      return order.status === activeTab;
    })
    // Sort by order ID in descending order
    .sort((a, b) => b.id - a.id);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
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
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Show success message first
      let statusLabel = variables.status;
      if (variables.status === "processing") statusLabel = "For Production";
      if (variables.status === "hold") statusLabel = "On Hold";
      
      toast({
        title: "Order Status Updated",
        description: `Order #${variables.id} status changed to ${statusLabel}`,
      });
      
      // Update the orders data in the cache directly instead of invalidating
      queryClient.setQueryData([API_ENDPOINTS.ORDERS], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((order: any) => 
          order.id === variables.id 
            ? { ...order, status: variables.status }
            : order
        );
      });
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
    console.log("Status change initiated:", { orderId: order.id, newStatus });
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

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      const results = await Promise.allSettled(
        orderIds.map(async (id) => {
          const response = await fetch(`${API_ENDPOINTS.ORDERS}/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(`Order #${id}: ${data.message || 'Failed to delete'}`);
          }
          
          return { id, success: true };
        })
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');
      
      return { successful, failed, total: orderIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ORDERS] });
      
      const { successful, failed, total } = data;
      
      if (failed.length === 0) {
        toast({
          title: "Orders Deleted",
          description: `Successfully deleted ${successful} order${successful > 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Deleted ${successful}/${total} orders. ${failed.length} failed.`,
          variant: "destructive",
        });
      }
      
      setSelectedOrders([]);
      setShowBulkDeleteDialog(false);
    },
    onError: (error: any) => {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete selected orders",
        variant: "destructive",
      });
    },
  });

  // Selection helper functions
  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders?.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders?.map(order => order.id) || []);
    }
  };

  const isAllSelected = selectedOrders.length > 0 && selectedOrders.length === filteredOrders?.length;

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
      header: (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleSelectAll}
            className="rounded border-gray-300"
          />
        </div>
      ),
      accessorKey: "select",
      cell: (row: Order) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedOrders.includes(row.id)}
            onChange={() => handleSelectOrder(row.id)}
            className="rounded border-gray-300"
          />
        </div>
      ),
    },
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
                {t("status.pending")}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange(row, "processing")}
                disabled={row.status === "processing"}
                className={row.status === "processing" ? "bg-secondary-100" : ""}
              >
                <span className="w-3 h-3 rounded-full bg-primary-300 mr-2"></span>
                {t("status.processing")}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange(row, "hold")}
                disabled={row.status === "hold"}
                className={row.status === "hold" ? "bg-secondary-100" : ""}
              >
                <span className="w-3 h-3 rounded-full bg-warning-300 mr-2"></span>
                {t("orders.hold")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700">
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const quickActions = [
    {
      id: "new-order",
      label: t("orders.new_order"),
      icon: Plus,
      onClick: () => window.location.href = "/orders/new",
      variant: "default" as const
    },
    {
      id: "refresh",
      label: "Refresh",
      icon: RefreshCw,
      onClick: () => {
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ORDERS] });
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      },
      variant: "outline" as const
    },
    {
      id: "all-tab",
      label: "All Orders",
      icon: Eye,
      onClick: () => setActiveTab("all"),
      variant: activeTab === "all" ? "default" : "outline"
    },
    {
      id: "pending-tab",
      label: "Pending",
      icon: Filter,
      onClick: () => setActiveTab("pending"),
      variant: activeTab === "pending" ? "default" : "outline"
    }
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
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-primary-500">
            <div className="relative">
              <div 
                className="absolute top-3 left-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => handleSelectOrder(order.id)}
                  className="rounded border-gray-300 w-4 h-4"
                />
              </div>
              <Link href={`/orders/${order.id}`}>
                <CardHeader className="p-4 pb-3 flex flex-row justify-between items-start bg-gradient-to-r from-gray-50 to-white pl-12">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-sm text-primary-500">receipt_long</span>
                      <CardTitle className="text-base font-bold text-gray-900">#{order.id}</CardTitle>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{formatDateString(order.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={order.status} />
                  </div>
                </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{t("orders.customer")}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {getCustomerName(order.customerId).length > 32 
                        ? getCustomerName(order.customerId).substring(0, 32) + '...' 
                        : getCustomerName(order.customerId)}
                    </p>
                  </div>
                  
                  {getCustomerNameAr(order.customerId) !== "-" && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{t("orders.customer_ar")}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{getCustomerNameAr(order.customerId)}</p>
                    </div>
                  )}
                  
                  {getCustomerPlateDrawerCode(order.customerId) !== "-" && (
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium">{t("orders.plate_drawer_code")}</p>
                      <p className="text-sm font-bold text-primary-600">{getCustomerPlateDrawerCode(order.customerId)}</p>
                    </div>
                  )}
                  
                  {order.note && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">{t("orders.note")}</p>
                      <p className="text-sm mt-1 text-blue-800 line-clamp-2">{order.note}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <span className="text-primary-600 text-sm flex items-center font-medium">
                  {t("common.view")} Details
                  <span className="material-icons text-sm ml-1">arrow_forward</span>
                </span>
                <div className="flex space-x-2">
                  {/* Status Change Dropdown for Mobile */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="h-8 px-3 text-xs font-medium border-gray-300 hover:bg-gray-100"
                      >
                        <span className="material-icons text-sm mr-1">swap_horiz</span>
                        Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(order, "pending");
                        }}
                        disabled={order.status === "pending"}
                        className={`text-xs py-1 ${order.status === "pending" ? "bg-secondary-100" : ""}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-secondary-300 mr-2"></span>
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(order, "processing");
                        }}
                        disabled={order.status === "processing"}
                        className={`text-xs py-1 ${order.status === "processing" ? "bg-secondary-100" : ""}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-primary-300 mr-2"></span>
                        Production
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(order, "hold");
                        }}
                        disabled={order.status === "hold"}
                        className={`text-xs py-1 ${order.status === "hold" ? "bg-secondary-100" : ""}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-warning-300 mr-2"></span>
                        Hold
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(order);
                    }} 
                    className="h-8 px-3 text-xs font-medium border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    <span className="material-icons text-sm mr-1">delete</span>
                    Delete
                  </Button>
                </div>
              </CardFooter>
              </Link>
            </div>
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
    <div className={`container mx-auto ${isMobile ? "p-3" : "p-6"}`}>
      <QuickActions
        title="Quick Actions"
        actions={quickActions}
        columns={2}
      />

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

      {/* Bulk Actions Toolbar */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className={`flex items-center ${isMobile ? "flex-col gap-2" : "justify-between"}`}>
            <div className="flex items-center gap-3">
              <span className="text-blue-700 font-medium text-sm">
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className={`flex items-center gap-2 ${isMobile ? "w-full" : ""}`}>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "sm"}
                onClick={() => setSelectedOrders([])}
                className={isMobile ? "flex-1" : ""}
              >
                {isMobile ? "Clear" : "Clear Selection"}
              </Button>
              <Button
                variant="destructive"
                size={isMobile ? "sm" : "sm"}
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={bulkDeleteMutation.isPending}
                className={isMobile ? "flex-1" : ""}
              >
                <span className="material-icons text-sm mr-1">delete</span>
                {isMobile ? "Delete" : "Delete Selected"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className={isMobile ? "pb-3" : ""}>
          <CardTitle className="flex justify-between items-center">
            <span className={isMobile ? "text-lg" : ""}>{t("orders.active_production_orders")}</span>
            {!isMobile && (
              <Link href="/orders/new">
                <Button>
                  <span className="material-icons text-sm mr-1">add</span>
                  {t("orders.new_order")}
                </Button>
              </Link>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? "px-3" : ""}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`mb-4 ${isMobile ? "grid grid-cols-3 w-full h-auto" : ""}`}>
              <TabsTrigger 
                value="all" 
                className={isMobile ? "text-xs py-2 px-1" : ""}
              >
                {isMobile ? "All" : t("orders.all_orders")}
              </TabsTrigger>
              <TabsTrigger 
                value="processing" 
                className={isMobile ? "text-xs py-2 px-1" : ""}
              >
                {isMobile ? "Production" : t("orders.for_production")}
              </TabsTrigger>
              <TabsTrigger 
                value="hold" 
                className={isMobile ? "text-xs py-2 px-1" : ""}
              >
                {isMobile ? "Hold" : t("orders.on_hold")}
              </TabsTrigger>
              {!isMobile && (
                <>
                  <TabsTrigger value="pending">{t("orders.pending")}</TabsTrigger>
                  <TabsTrigger value="completed">{t("orders.completed")}</TabsTrigger>
                </>
              )}
            </TabsList>
            
            {/* Mobile secondary tabs for remaining statuses */}
            {isMobile && (
              <div className="flex gap-2 mb-4 overflow-x-auto">
                <Button
                  variant={activeTab === "pending" ? "default" : "outline"}
                  size="sm"
                  className="text-xs whitespace-nowrap"
                  onClick={() => setActiveTab("pending")}
                >
                  {t("orders.pending")}
                </Button>
                <Button
                  variant={activeTab === "completed" ? "default" : "outline"}
                  size="sm"
                  className="text-xs whitespace-nowrap"
                  onClick={() => setActiveTab("completed")}
                >
                  {t("orders.completed")}
                </Button>
              </div>
            )}
            
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
                  onRowClick={(row) => {
                    // Use wouter's navigation to stay within the app
                    window.history.pushState({}, '', `/orders/${row.id}`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
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
              className="bg-red-500 hover:bg-red-600"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedOrders.length} selected order{selectedOrders.length > 1 ? 's' : ''}? This will permanently delete:
              <br />- Job orders
              <br />- Rolls
              <br />- Final products
              <br />- Quality checks
              <br />- SMS messages
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => bulkDeleteMutation.mutate(selectedOrders)}
              className="bg-red-500 hover:bg-red-600"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
