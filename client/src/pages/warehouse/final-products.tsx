import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { FinalProduct, JobOrder, CustomerProduct, Order, Customer, Roll, User } from "@shared/schema";

type CompletedJobOrder = JobOrder & {
  rolls: Roll[];
  totalCuttingQty: number;
  isConfirmed: boolean;
};

export default function FinalProducts() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("current");
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<FinalProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<FinalProduct | null>(null);
  
  // Form state
  const [jobOrderId, setJobOrderId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState("in-stock");

  // Job Order Confirmation state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [currentJobOrder, setCurrentJobOrder] = useState<CompletedJobOrder | null>(null);
  const [productionQty, setProductionQty] = useState<number>(0);
  
  // Batch confirmation state
  const [selectedJobOrders, setSelectedJobOrders] = useState<number[]>([]);
  const [batchConfirmDialogOpen, setBatchConfirmDialogOpen] = useState(false);
  const [jobOrderQuantities, setJobOrderQuantities] = useState<Record<number, number>>({});

  // Fetch final products and related data
  const { data: finalProducts, isLoading: finalProductsLoading } = useQuery<FinalProduct[]>({
    queryKey: [API_ENDPOINTS.FINAL_PRODUCTS],
  });
  
  // Fetch completed job orders
  const { data: completedJobOrders, isLoading: jobOrdersLoading } = useQuery<CompletedJobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS_COMPLETED],
    enabled: activeTab === "confirm"
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

  // Confirm job order mutation
  const confirmJobOrderMutation = useMutation({
    mutationFn: async (data: { id: number, productionQty: number }) => {
      return await apiRequest("POST", `${API_ENDPOINTS.JOB_ORDERS}/${data.id}/confirm-production`, {
        productionQty: data.productionQty
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.JOB_ORDERS_COMPLETED] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FINAL_PRODUCTS] });
      toast({
        title: "Job Order Confirmed",
        description: "The job order has been confirmed with production quantity.",
      });
      setConfirmDialogOpen(false);
      setCurrentJobOrder(null);
      setProductionQty(0);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to confirm job order: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Batch confirm job orders mutation
  const batchConfirmMutation = useMutation({
    mutationFn: async (data: { jobOrders: { id: number, productionQty: number }[] }) => {
      return await apiRequest("POST", `${API_ENDPOINTS.JOB_ORDERS}/confirm-batch`, {
        jobOrders: data.jobOrders
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.JOB_ORDERS_COMPLETED] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FINAL_PRODUCTS] });
      toast({
        title: "Job Orders Confirmed",
        description: "The selected job orders have been confirmed with production quantities.",
      });
      setBatchConfirmDialogOpen(false);
      setSelectedJobOrders([]);
      setJobOrderQuantities({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to confirm job orders: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Handle job order selection for batch confirmation
  const handleJobOrderSelection = (jobOrderId: number, checked: boolean) => {
    if (checked) {
      setSelectedJobOrders(prev => [...prev, jobOrderId]);
      
      // Initialize with suggested quantity if available
      const jobOrder = completedJobOrders?.find(jo => jo.id === jobOrderId);
      if (jobOrder) {
        setJobOrderQuantities(prev => ({
          ...prev,
          [jobOrderId]: jobOrder.totalCuttingQty
        }));
      }
    } else {
      setSelectedJobOrders(prev => prev.filter(id => id !== jobOrderId));
      
      // Remove from quantities mapping
      const newQuantities = { ...jobOrderQuantities };
      delete newQuantities[jobOrderId];
      setJobOrderQuantities(newQuantities);
    }
  };

  // Update quantity for a job order in batch confirmation
  const updateJobOrderQuantity = (jobOrderId: number, quantity: number) => {
    setJobOrderQuantities(prev => ({
      ...prev,
      [jobOrderId]: quantity
    }));
  };

  // Handle confirmation of a single job order
  const handleConfirmJobOrder = (jobOrder: CompletedJobOrder) => {
    setCurrentJobOrder(jobOrder);
    setProductionQty(jobOrder.totalCuttingQty); // Suggest the calculated quantity
    setConfirmDialogOpen(true);
  };

  // Save the job order confirmation
  const confirmJobOrder = () => {
    if (!currentJobOrder || productionQty <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid production quantity.",
        variant: "destructive",
      });
      return;
    }

    confirmJobOrderMutation.mutate({
      id: currentJobOrder.id,
      productionQty
    });
  };

  // Submit batch confirmation
  const submitBatchConfirmation = () => {
    // Validate all quantities
    const jobOrdersToConfirm = selectedJobOrders.map(id => ({
      id,
      productionQty: jobOrderQuantities[id] || 0
    }));

    // Check if any quantities are invalid
    const invalidOrders = jobOrdersToConfirm.filter(jo => jo.productionQty <= 0);
    if (invalidOrders.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid production quantities for all selected job orders.",
        variant: "destructive",
      });
      return;
    }

    batchConfirmMutation.mutate({ jobOrders: jobOrdersToConfirm });
  };

  // Toggle all job orders for batch confirmation
  const toggleAllJobOrders = (checked: boolean) => {
    if (checked && completedJobOrders) {
      const unconfirmedJobOrderIds = completedJobOrders
        .filter(jo => !jo.isConfirmed)
        .map(jo => jo.id);
      
      setSelectedJobOrders(unconfirmedJobOrderIds);
      
      // Initialize quantities
      const quantities: Record<number, number> = {};
      unconfirmedJobOrderIds.forEach(id => {
        const jobOrder = completedJobOrders.find(jo => jo.id === id);
        if (jobOrder) {
          quantities[id] = jobOrder.totalCuttingQty;
        }
      });
      
      setJobOrderQuantities(quantities);
    } else {
      setSelectedJobOrders([]);
      setJobOrderQuantities({});
    }
  };

  // Generate completed job orders table columns
  const completedJobOrderColumns = [
    {
      header: !isMobile ? "Select" : "",
      accessorKey: "select",
      cell: (row: CompletedJobOrder) => (
        <Checkbox
          checked={selectedJobOrders.includes(row.id)}
          onCheckedChange={(checked) => handleJobOrderSelection(row.id, !!checked)}
          disabled={row.isConfirmed}
        />
      ),
    },
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Order",
      accessorKey: "orderId",
    },
    {
      header: "Product",
      accessorKey: "customerProductId",
      cell: (row: JobOrder) => {
        const product = customerProducts?.find(cp => cp.id === row.customerProductId);
        return product?.sizeCaption || product?.itemId || "Unknown";
      },
    },
    {
      header: "Total Rolls",
      accessorKey: "rolls",
      cell: (row: CompletedJobOrder) => row.rolls.length,
    },
    {
      header: "Total Qty (kg)",
      accessorKey: "totalCuttingQty",
    },
    {
      header: "Status",
      accessorKey: "isConfirmed",
      cell: (row: CompletedJobOrder) => (
        <StatusBadge status={row.isConfirmed ? "confirmed" : "unconfirmed"} />
      ),
    },
    {
      header: "Actions",
      cell: (row: CompletedJobOrder) => (
        <div className="flex space-x-2">
          {!row.isConfirmed ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleConfirmJobOrder(row)}
              className="text-primary-500 hover:text-primary-700"
            >
              <span className="material-icons text-sm mr-1">check_circle</span>
              Confirm
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-success-500"
              disabled
            >
              <span className="material-icons text-sm mr-1">done_all</span>
              Confirmed
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Mobile card view for completed job orders
  const CompletedJobOrderCard = ({ jobOrder }: { jobOrder: CompletedJobOrder }) => {
    const product = customerProducts?.find(cp => cp.id === jobOrder.customerProductId);
    const order = orders?.find(o => o.id === jobOrder.orderId);
    const customer = order ? customers?.find(c => c.id === order.customerId) : null;

    return (
      <Card className={cn(
        "mb-4",
        jobOrder.isConfirmed ? "border-l-4 border-l-success-500" : "border-l-4 border-l-warning-500"
      )}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Job Order #{jobOrder.id}</CardTitle>
            <Checkbox
              checked={selectedJobOrders.includes(jobOrder.id)}
              onCheckedChange={(checked) => handleJobOrderSelection(jobOrder.id, !!checked)}
              disabled={jobOrder.isConfirmed}
            />
          </div>
          <CardDescription>
            Order #{order?.id} - {customer?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">Product:</span>
              <span>{product?.sizeCaption || product?.itemId || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Rolls:</span>
              <span>{jobOrder.rolls.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Quantity:</span>
              <span>{jobOrder.totalCuttingQty} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <StatusBadge status={jobOrder.isConfirmed ? "confirmed" : "unconfirmed"} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          {!jobOrder.isConfirmed ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleConfirmJobOrder(jobOrder)}
              className="w-full"
            >
              <span className="material-icons text-sm mr-1">check_circle</span>
              Confirm Production
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-success-500"
              disabled
            >
              <span className="material-icons text-sm mr-1">done_all</span>
              Confirmed
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const tableActions = (
    <Button onClick={() => setFormOpen(true)}>
      <span className="material-icons text-sm mr-1">add</span>
      Add Final Product
    </Button>
  );

  const confirmTableActions = (
    <Button 
      onClick={() => setBatchConfirmDialogOpen(true)} 
      disabled={selectedJobOrders.length === 0}
    >
      <span className="material-icons text-sm mr-1">check_circle</span>
      Confirm Selected ({selectedJobOrders.length})
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Final Products</h1>
      </div>

      <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Inventory</TabsTrigger>
          <TabsTrigger value="confirm">Confirm Production</TabsTrigger>
        </TabsList>
        
        {/* Job Order Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Production Quantity</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {currentJobOrder && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Job Order</Label>
                    <div className="col-span-3">#{currentJobOrder.id}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Total Rolls</Label>
                    <div className="col-span-3">{currentJobOrder.rolls.length}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Calculated Qty</Label>
                    <div className="col-span-3">{currentJobOrder.totalCuttingQty} kg</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="productionQty" className="text-right">
                      Final Production Qty (kg)
                    </Label>
                    <Input
                      id="productionQty"
                      type="number"
                      value={productionQty}
                      onChange={(e) => setProductionQty(parseFloat(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmJobOrder} 
                disabled={confirmJobOrderMutation.isPending}
              >
                {confirmJobOrderMutation.isPending ? "Confirming..." : "Confirm Production"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Batch Confirmation Dialog */}
        <Dialog open={batchConfirmDialogOpen} onOpenChange={setBatchConfirmDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Batch Confirm Production Quantities</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Order</th>
                      <th className="px-4 py-2 text-left">Rolls</th>
                      <th className="px-4 py-2 text-left">Suggested Qty</th>
                      <th className="px-4 py-2 text-left">Production Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedJobOrders.map(jobOrderId => {
                      const jobOrder = completedJobOrders?.find(jo => jo.id === jobOrderId);
                      if (!jobOrder) return null;
                      
                      const order = orders?.find(o => o.id === jobOrder.orderId);
                      
                      return (
                        <tr key={jobOrder.id} className="border-b">
                          <td className="px-4 py-2">#{jobOrder.id}</td>
                          <td className="px-4 py-2">#{order?.id || "Unknown"}</td>
                          <td className="px-4 py-2">{jobOrder.rolls.length}</td>
                          <td className="px-4 py-2">{jobOrder.totalCuttingQty} kg</td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              value={jobOrderQuantities[jobOrder.id] || 0}
                              onChange={(e) => updateJobOrderQuantity(jobOrder.id, parseFloat(e.target.value))}
                              className="w-24"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBatchConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitBatchConfirmation} 
                disabled={batchConfirmMutation.isPending || selectedJobOrders.length === 0}
              >
                {batchConfirmMutation.isPending 
                  ? "Confirming..." 
                  : `Confirm ${selectedJobOrders.length} Job Order${selectedJobOrders.length > 1 ? 's' : ''}`
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Manage Final Products</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={finalProducts || []}
                columns={columns as any}
                isLoading={finalProductsLoading}
                actions={tableActions}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="confirm">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Confirm Completed Job Orders</span>
              </CardTitle>
              <CardDescription>
                Verify and confirm production quantities for completed job orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                // Mobile card view
                <>
                  {jobOrdersLoading && <div className="text-center py-4">Loading job orders...</div>}
                  {!jobOrdersLoading && completedJobOrders?.length === 0 && (
                    <div className="text-center py-4">No completed job orders found</div>
                  )}
                  {!jobOrdersLoading && completedJobOrders && completedJobOrders.length > 0 && (
                    <div>
                      <div className="flex justify-between mb-4">
                        <Label htmlFor="select-all" className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox 
                            id="select-all"
                            onCheckedChange={(checked) => toggleAllJobOrders(!!checked)}
                            checked={selectedJobOrders.length > 0 && 
                              selectedJobOrders.length === 
                              completedJobOrders.filter(jo => !jo.isConfirmed).length}
                          />
                          <span>Select All Unconfirmed</span>
                        </Label>
                        
                        {selectedJobOrders.length > 0 && (
                          <Button size="sm" onClick={() => setBatchConfirmDialogOpen(true)}>
                            <span className="material-icons text-sm mr-1">check_circle</span>
                            Confirm ({selectedJobOrders.length})
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {completedJobOrders.map((jobOrder) => (
                          <CompletedJobOrderCard key={jobOrder.id} jobOrder={jobOrder} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Desktop table view
                <DataTable
                  data={completedJobOrders || []}
                  columns={completedJobOrderColumns as any}
                  isLoading={jobOrdersLoading}
                  actions={confirmTableActions}
                  selectionHeading={
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all"
                        onCheckedChange={(checked) => toggleAllJobOrders(!!checked)}
                        checked={selectedJobOrders.length > 0 && 
                          selectedJobOrders.length === 
                          completedJobOrders?.filter(jo => !jo.isConfirmed).length}
                      />
                      <Label htmlFor="select-all">Select All Unconfirmed</Label>
                    </div>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
