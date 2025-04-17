import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { JobOrder, CustomerProduct, Customer, Order, Roll } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/ui/status-badge";

export function JobOrdersForExtrusion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [isRollDialogOpen, setIsRollDialogOpen] = useState(false);
  const [rollQuantity, setRollQuantity] = useState<number>(0);
  
  // Fetch all job orders
  const { data: jobOrders, isLoading: jobOrdersLoading } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });
  
  // Fetch customer products for looking up details
  const { data: customerProducts, isLoading: productsLoading } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });
  
  // Fetch customers for looking up details
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  // Fetch orders for looking up details
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });
  
  // Fetch all rolls to calculate progress
  const { data: rolls, isLoading: rollsLoading } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });
  
  // Mutation to create a new roll
  const createRollMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJobOrder) return;
      
      // Send only the necessary data - id and serialNumber will be generated on server
      await apiRequest("POST", API_ENDPOINTS.ROLLS, {
        jobOrderId: selectedJobOrder.id,
        extrudingQty: rollQuantity,
        printingQty: rollQuantity, // Set printing quantity equal to extrusion quantity
        cuttingQty: 0,
        currentStage: "extrusion",
        status: "pending",
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ROLLS] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`] });
      
      // Close dialog and reset form
      setIsRollDialogOpen(false);
      setRollQuantity(0);
      setSelectedJobOrder(null);
      
      // Show success notification
      toast({
        title: "Roll Created",
        description: "New roll has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating roll:", error);
      toast({
        title: "Error Creating Roll",
        description: "There was an error creating the roll. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to update job order status
  const updateJobOrderMutation = useMutation({
    mutationFn: async (jobOrderId: number) => {
      await apiRequest("PUT", `${API_ENDPOINTS.JOB_ORDERS}/${jobOrderId}`, {
        status: "extrusion_completed"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.JOB_ORDERS] });
      
      toast({
        title: "Job Order Updated",
        description: "Job order marked as completed for extrusion.",
      });
    },
  });
  
  // Handle opening the roll creation dialog
  const handleCreateRoll = (jobOrder: JobOrder) => {
    setSelectedJobOrder(jobOrder);
    setIsRollDialogOpen(true);
  };
  
  // Handle submitting the roll creation form
  const handleSubmitRoll = () => {
    if (rollQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a quantity greater than zero.",
        variant: "destructive",
      });
      return;
    }
    
    createRollMutation.mutate();
  };
  
  // Calculate total extruded quantity for a job order
  const getExtrudedQuantity = (jobOrderId: number): number => {
    if (!rolls) return 0;
    
    return rolls
      .filter(roll => roll.jobOrderId === jobOrderId)
      .reduce((total, roll) => total + (roll.extrudingQty || 0), 0);
  };
  
  // Check if job order is fully extruded (quantity requirement met)
  const isJobOrderFullyExtruded = (jobOrder: JobOrder): boolean => {
    const extrudedQuantity = getExtrudedQuantity(jobOrder.id);
    return extrudedQuantity >= (jobOrder.quantity || 0);
  };
  
  // Get customer name from customer ID
  const getCustomerName = (customerId: string): string => {
    if (!customers) return "";
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "";
  };
  
  // Get product details from customer product ID
  const getProductDetails = (customerProductId: number): { category: string, item: string, size: string } => {
    if (!customerProducts) return { category: "", item: "", size: "" };
    
    const product = customerProducts.find(p => p.id === customerProductId);
    return {
      category: product?.categoryId || "",
      item: product?.itemId || "",
      size: product?.sizeCaption || "",
    };
  };
  
  // Get order number from order ID
  const getOrderNumber = (orderId: number): number => {
    if (!orders) return 0;
    return orderId;
  };
  
  // Filter job orders that are still in production
  const activeJobOrders = jobOrders?.filter(jo => 
    jo.status !== "completed" && 
    jo.status !== "cancelled" && 
    jo.status !== "extrusion_completed"
  ) || [];
  
  // Calculate progress percentage for a job order
  const calculateProgress = (jobOrder: JobOrder): number => {
    if (!jobOrder.quantity) return 0;
    const extrudedQuantity = getExtrudedQuantity(jobOrder.id);
    return Math.min(Math.round((extrudedQuantity / jobOrder.quantity) * 100), 100);
  };
  
  // Check if any job order needs to be auto-completed
  // This will run whenever rolls or job orders change
  const checkAutoComplete = () => {
    if (!jobOrders || !rolls) return;
    
    jobOrders.forEach(jobOrder => {
      if (
        jobOrder.status !== "extrusion_completed" && 
        jobOrder.status !== "completed" && 
        jobOrder.status !== "cancelled" && 
        isJobOrderFullyExtruded(jobOrder)
      ) {
        // Auto-complete the job order for extrusion
        updateJobOrderMutation.mutate(jobOrder.id);
      }
    });
  };
  
  // Run the auto-complete check when data changes
  if (jobOrders && rolls) {
    checkAutoComplete();
  }
  
  if (jobOrdersLoading || productsLoading || customersLoading || ordersLoading || rollsLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-20"></div>
        <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-20"></div>
        <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-20"></div>
      </div>
    );
  }
  
  if (activeJobOrders.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-dashed border-secondary-200 text-center">
        <span className="material-icons text-secondary-400 text-3xl mb-2">assignment</span>
        <h3 className="text-lg font-medium text-secondary-700">No Active Job Orders</h3>
        <p className="text-secondary-500 mt-1">All job orders have been completed or there are no job orders.</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-3">
        {activeJobOrders.map((jobOrder) => {
          const productDetails = getProductDetails(jobOrder.customerProductId);
          const customerName = getCustomerName(jobOrder.customerId);
          const orderNumber = getOrderNumber(jobOrder.orderId);
          const extrudedQuantity = getExtrudedQuantity(jobOrder.id);
          const progress = calculateProgress(jobOrder);
          
          return (
            <Card key={jobOrder.id} className="bg-white border-secondary-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Job Order #{jobOrder.id}</h4>
                      <StatusBadge status={jobOrder.status || "pending"} />
                    </div>
                    <p className="text-sm text-secondary-700">
                      <span className="font-medium">Order:</span> #{orderNumber}
                    </p>
                    <p className="text-sm text-secondary-700">
                      <span className="font-medium">Customer:</span> {customerName}
                    </p>
                    <p className="text-sm text-secondary-700">
                      <span className="font-medium">Product:</span> {productDetails.category} - {productDetails.item} ({productDetails.size})
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-sm text-secondary-500">Ordered</span>
                        <span className="font-medium">{jobOrder.quantity || 0} Kg</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm text-secondary-500">Extruded</span>
                        <span className="font-medium">{extrudedQuantity} Kg</span>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={() => handleCreateRoll(jobOrder)}
                    >
                      Create Roll
                    </Button>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-primary-600">
                          {progress}% Complete
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-primary-100 mt-1">
                      <div 
                        style={{ width: `${progress}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Create Roll Dialog */}
      <Dialog open={isRollDialogOpen} onOpenChange={setIsRollDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Roll</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedJobOrder && (
              <div className="mb-4">
                <p className="text-sm text-secondary-700 mb-2">
                  <span className="font-medium">Job Order:</span> #{selectedJobOrder.id}
                </p>
                <p className="text-sm text-secondary-700 mb-2">
                  <span className="font-medium">Product:</span> {getProductDetails(selectedJobOrder.customerProductId).item}
                </p>
                <p className="text-sm text-secondary-700 mb-2">
                  <span className="font-medium">Size:</span> {getProductDetails(selectedJobOrder.customerProductId).size}
                </p>
                <p className="text-sm text-secondary-500 mt-4">
                  Roll serial number will be automatically generated in sequence for this job order.
                  Printing quantity will be automatically set to equal extrusion quantity.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">Extrusion Quantity (Kg)</Label>
              <Input
                id="quantity"
                type="number"
                value={rollQuantity || ""}
                onChange={(e) => setRollQuantity(parseFloat(e.target.value) || 0)}
                placeholder="Enter quantity"
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRollDialogOpen(false);
                setSelectedJobOrder(null);
              }}
              disabled={createRollMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRoll}
              disabled={createRollMutation.isPending}
            >
              {createRollMutation.isPending ? "Creating..." : "Create Roll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}