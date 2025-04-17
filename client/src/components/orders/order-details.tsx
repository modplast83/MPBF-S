import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString, calculateProgress } from "@/lib/utils";
import { Order, Customer, JobOrder, CustomerProduct, Roll } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

interface OrderDetailsProps {
  orderId: number;
}

export function OrderDetails({ orderId }: OrderDetailsProps) {
  const queryClient = useQueryClient();
  const [rollDialogOpen, setRollDialogOpen] = useState(false);
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [rollSerial, setRollSerial] = useState("");
  const [rollQuantity, setRollQuantity] = useState(0);
  
  // Fetch order and related data
  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: [`${API_ENDPOINTS.ORDERS}/${orderId}`],
  });
  
  const { data: customer } = useQuery<Customer>({
    queryKey: [`${API_ENDPOINTS.CUSTOMERS}/${order?.customerId}`],
    enabled: !!order?.customerId,
  });
  
  const { data: jobOrders } = useQuery<JobOrder[]>({
    queryKey: [`${API_ENDPOINTS.ORDERS}/${orderId}/job-orders`],
    enabled: !!orderId,
  });
  
  const { data: customerProducts } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });
  
  const { data: rolls } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });
  
  // Mutation to update order status
  const updateOrderMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PUT", `${API_ENDPOINTS.ORDERS}/${orderId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ORDERS] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ORDERS}/${orderId}`] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
  });
  
  // Mutation to create a new roll
  const createRollMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJobOrder) return;
      
      await apiRequest("POST", API_ENDPOINTS.ROLLS, {
        id: `EX-${rollSerial}`,
        jobOrderId: selectedJobOrder.id,
        serialNumber: rollSerial,
        extrudingQty: rollQuantity,
        printingQty: 0,
        cuttingQty: 0,
        currentStage: "extrusion",
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ROLLS] });
      setRollDialogOpen(false);
      setRollSerial("");
      setRollQuantity(0);
      toast({
        title: "Roll Created",
        description: "New roll has been created successfully.",
      });
    },
  });
  
  if (orderLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-8 bg-secondary-100 rounded w-1/3"></div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-40 bg-secondary-50 rounded"></div>
          <div className="h-80 bg-secondary-50 rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (!order) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <h3 className="text-xl font-medium text-secondary-800 mb-2">Order Not Found</h3>
          <p className="text-secondary-600 mb-6">
            The order you're looking for does not exist or has been deleted.
          </p>
          <Link href="/orders">
            <Button>Return to Orders</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  
  // Find customer product for a job order
  const getCustomerProduct = (jobOrder: JobOrder) => {
    return customerProducts?.find(cp => cp.id === jobOrder.customerProductId);
  };
  
  // Calculate production progress
  const calculateOrderProgress = (stage: string) => {
    if (!jobOrders || jobOrders.length === 0) return { current: 0, total: 0, percentage: 0 };
    
    let currentQuantity = 0;
    let totalQuantity = 0;
    
    jobOrders.forEach(jobOrder => {
      // Get rolls for this job order
      const jobOrderRolls = rolls?.filter(roll => roll.jobOrderId === jobOrder.id) || [];
      
      // Add to total quantity
      totalQuantity += jobOrder.quantity;
      
      // Add to current quantity based on stage
      if (stage === "extrusion") {
        currentQuantity += jobOrderRolls.reduce((sum, roll) => sum + roll.extrudingQty, 0);
      } else if (stage === "printing") {
        currentQuantity += jobOrderRolls.reduce((sum, roll) => sum + roll.printingQty, 0);
      } else if (stage === "cutting") {
        currentQuantity += jobOrderRolls.reduce((sum, roll) => sum + roll.cuttingQty, 0);
      }
    });
    
    const percentage = calculateProgress(currentQuantity, totalQuantity);
    
    return { current: currentQuantity, total: totalQuantity, percentage };
  };
  
  // Get rolls for this order
  const getOrderRolls = () => {
    if (!jobOrders || !rolls) return [];
    
    const orderJobOrderIds = jobOrders.map(jo => jo.id);
    return rolls.filter(roll => orderJobOrderIds.includes(roll.jobOrderId));
  };
  
  const extrusionProgress = calculateOrderProgress("extrusion");
  const printingProgress = calculateOrderProgress("printing");
  const cuttingProgress = calculateOrderProgress("cutting");
  const orderRolls = getOrderRolls();
  
  const handleOpenRollDialog = (jobOrder: JobOrder) => {
    setSelectedJobOrder(jobOrder);
    setRollDialogOpen(true);
  };
  
  const handleCreateRoll = () => {
    if (!rollSerial || rollQuantity <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid roll serial number and quantity.",
        variant: "destructive",
      });
      return;
    }
    
    createRollMutation.mutate();
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Order Details #{order.id}</span>
            <StatusBadge status={order.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-secondary-50 p-4 rounded">
              <h4 className="font-medium text-secondary-700 mb-2">Order Information</h4>
              <div className="text-sm">
                <p className="flex justify-between py-1.5 border-b border-secondary-100">
                  <span className="text-secondary-500">Order ID:</span>
                  <span className="font-medium">{order.id}</span>
                </p>
                <p className="flex justify-between py-1.5 border-b border-secondary-100">
                  <span className="text-secondary-500">Customer:</span>
                  <span className="font-medium">{customer?.name}</span>
                </p>
                <p className="flex justify-between py-1.5 border-b border-secondary-100">
                  <span className="text-secondary-500">Date:</span>
                  <span className="font-medium">{formatDateString(order.date)}</span>
                </p>
                <p className="flex justify-between py-1.5 border-b border-secondary-100">
                  <span className="text-secondary-500">Plate Drawer Code:</span>
                  <span className="font-medium">{customer?.plateDrawerCode || "N/A"}</span>
                </p>
                <p className="flex justify-between py-1.5">
                  <span className="text-secondary-500">Status:</span>
                  <StatusBadge status={order.status} />
                </p>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-secondary-50 p-4 rounded">
              <h4 className="font-medium text-secondary-700 mb-2">Production Progress</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Extrusion: {extrusionProgress.percentage}%</span>
                    <span>
                      {extrusionProgress.current} / {extrusionProgress.total} Kg
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary-500 h-2.5 rounded-full" 
                      style={{ width: `${extrusionProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Printing: {printingProgress.percentage}%</span>
                    <span>
                      {printingProgress.current} / {printingProgress.total} Kg
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary-500 h-2.5 rounded-full" 
                      style={{ width: `${printingProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Cutting: {cuttingProgress.percentage}%</span>
                    <span>
                      {cuttingProgress.current} / {cuttingProgress.total} Kg
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary-500 h-2.5 rounded-full" 
                      style={{ width: `${cuttingProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Products */}
          <div>
            <h4 className="font-medium text-lg mb-4">Order Products</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary-50 text-secondary-600 border-b border-secondary-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Product</th>
                    <th className="py-3 px-4 text-left">Size</th>
                    <th className="py-3 px-4 text-left">Thickness</th>
                    <th className="py-3 px-4 text-left">Material</th>
                    <th className="py-3 px-4 text-left">Batch</th>
                    <th className="py-3 px-4 text-left">Qty (Kg)</th>
                    <th className="py-3 px-4 text-left">Printed</th>
                    <th className="py-3 px-4 text-left">Cylinder (Inch)</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-secondary-800">
                  {jobOrders?.map(jobOrder => {
                    const product = getCustomerProduct(jobOrder);
                    return (
                      <tr key={jobOrder.id} className="border-b border-secondary-100">
                        <td className="py-3 px-4">{product?.itemId || "N/A"}</td>
                        <td className="py-3 px-4">{product?.sizeCaption || "N/A"}</td>
                        <td className="py-3 px-4">{product?.thickness || "N/A"}</td>
                        <td className="py-3 px-4">{product?.rawMaterial || "N/A"}</td>
                        <td className="py-3 px-4">{product?.masterBatchId || "N/A"}</td>
                        <td className="py-3 px-4">{jobOrder.quantity}</td>
                        <td className="py-3 px-4">{product?.printed || "N/A"}</td>
                        <td className="py-3 px-4">{product?.printingCylinder || "0"}</td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRollDialog(jobOrder)}
                          >
                            <span className="material-icons text-sm mr-1">add</span>
                            Add Roll
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Rolls */}
          <div>
            <h4 className="font-medium text-lg mb-4">Roll Status</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary-50 text-secondary-600 border-b border-secondary-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Roll ID</th>
                    <th className="py-3 px-4 text-left">Product</th>
                    <th className="py-3 px-4 text-left">Extrusion Qty</th>
                    <th className="py-3 px-4 text-left">Printing Qty</th>
                    <th className="py-3 px-4 text-left">Cutting Qty</th>
                    <th className="py-3 px-4 text-left">Current Stage</th>
                    <th className="py-3 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="text-secondary-800">
                  {orderRolls.length > 0 ? (
                    orderRolls.map(roll => {
                      const jobOrder = jobOrders?.find(jo => jo.id === roll.jobOrderId);
                      const product = jobOrder 
                        ? getCustomerProduct(jobOrder)
                        : null;
                      
                      return (
                        <tr key={roll.id} className="border-b border-secondary-100">
                          <td className="py-3 px-4">{roll.id}</td>
                          <td className="py-3 px-4">{product?.itemId || "N/A"}</td>
                          <td className="py-3 px-4">{roll.extrudingQty}</td>
                          <td className="py-3 px-4">{roll.printingQty}</td>
                          <td className="py-3 px-4">{roll.cuttingQty}</td>
                          <td className="py-3 px-4">
                            <StatusBadge status={roll.currentStage} />
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={roll.status} />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-secondary-500">
                        No rolls created for this order yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-3">
          <Button variant="outline">
            Print Order
          </Button>
          <Button
            variant="outline"
            onClick={() => updateOrderMutation.mutate("completed")}
            disabled={updateOrderMutation.isPending || order.status === "completed"}
          >
            Mark as Completed
          </Button>
          <Link href="/orders">
            <Button variant="outline">
              Back to Orders
            </Button>
          </Link>
        </CardFooter>
      </Card>
      
      {/* Add Roll Dialog */}
      <Dialog open={rollDialogOpen} onOpenChange={setRollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Roll</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Roll Serial Number</label>
              <input
                type="text"
                value={rollSerial}
                onChange={(e) => setRollSerial(e.target.value)}
                placeholder="Enter roll serial number"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity (Kg)</label>
              <input
                type="number"
                value={rollQuantity}
                onChange={(e) => setRollQuantity(parseFloat(e.target.value))}
                placeholder="Enter quantity"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRollDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoll}
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
