import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { Roll, JobOrder, CustomerProduct } from "@shared/schema";
import { UpdateRollDialog } from "./update-roll-dialog";
import { useToast } from "@/hooks/use-toast";

interface RollCardProps {
  roll: Roll;
}

export function RollCard({ roll }: RollCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch related data
  const { data: jobOrder } = useQuery<JobOrder>({
    queryKey: [`${API_ENDPOINTS.JOB_ORDERS}/${roll.jobOrderId}`],
  });
  
  const { data: customerProduct } = useQuery<CustomerProduct>({
    queryKey: [
      `${API_ENDPOINTS.CUSTOMER_PRODUCTS}/${jobOrder?.customerProductId}`,
    ],
    enabled: !!jobOrder?.customerProductId,
  });
  
  // Fetch order and customer data
  const { data: order } = useQuery<any>({
    queryKey: [jobOrder ? `${API_ENDPOINTS.ORDERS}/${jobOrder.orderId}` : null],
    enabled: !!jobOrder?.orderId,
  });
  
  const { data: customer } = useQuery<any>({
    queryKey: [order ? `${API_ENDPOINTS.CUSTOMERS}/${order.customerId}` : null],
    enabled: !!order?.customerId,
  });
  
  // Fetch item data for the product
  const { data: item } = useQuery<any>({
    queryKey: [customerProduct ? `${API_ENDPOINTS.ITEMS}/${customerProduct.itemId}` : null],
    enabled: !!customerProduct?.itemId,
  });
  
  // Mutations for updating roll status
  const updateRollMutation = useMutation({
    mutationFn: async (updateData: Partial<Roll>) => {
      await apiRequest("PUT", `${API_ENDPOINTS.ROLLS}/${roll.id}`, updateData);
    },
    onSuccess: () => {
      // Invalidate all necessary queries to keep data consistent
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ROLLS] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/${roll.id}`] });
      
      // Invalidate all stage queries to ensure progress is calculated properly
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/printing`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/cutting`] });
      
      // Also invalidate job order rolls to update calculations
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.JOB_ORDERS}/${roll.jobOrderId}/rolls`] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.JOB_ORDERS] });
    },
  });
  
  const handleComplete = async () => {
    // Define next stage based on current stage
    let nextStage = roll.currentStage;
    let nextStatus = "completed";
    
    // Create basic update data with only the required fields
    const updateData: Partial<Roll> = {};
    
    // Hard-coded current user ID for demo - in real app, this would come from auth context
    const currentUserId = "00U1"; // Admin user ID from the database
    
    if (roll.currentStage === "extrusion") {
      nextStage = "printing";
      nextStatus = "pending";
      
      // Only including the necessary fields for the stage change
      updateData.currentStage = nextStage;
      updateData.status = nextStatus;
      updateData.printingQty = roll.extrudingQty;
      updateData.printedById = currentUserId;
      
      // Convert Date to ISO string to avoid serialization issues
      const currentTime = new Date().toISOString();
      console.log("Moving roll to printing stage with data:", {
        currentStage: nextStage,
        status: nextStatus,
        printingQty: roll.extrudingQty,
        printedById: currentUserId,
        currentTime
      });
      
      // Use string value instead of Date object
      updateRollMutation.mutate({
        status: nextStatus,
        currentStage: nextStage,
        printingQty: roll.extrudingQty,
        printedById: currentUserId
      });
      
    } else if (roll.currentStage === "printing") {
      nextStage = "cutting";
      nextStatus = "pending";
      
      // For printing to cutting stage
      updateData.currentStage = nextStage;
      updateData.status = nextStatus;
      updateData.cutById = currentUserId;
      
      updateRollMutation.mutate({
        status: nextStatus,
        currentStage: nextStage,
        cutById: currentUserId
      });
      
    } else if (roll.currentStage === "cutting") {
      nextStage = "completed";
      nextStatus = "completed";
      
      updateRollMutation.mutate({
        status: nextStatus,
        currentStage: nextStage
      });
    } else {
      // Default case - just update status
      updateRollMutation.mutate({
        status: nextStatus,
        currentStage: nextStage
      });
      return; // Skip the toast
    }
    
    // Add toast notification for better feedback
    toast({
      title: `${roll.currentStage.charAt(0).toUpperCase() + roll.currentStage.slice(1)} Completed`,
      description: `Roll #${roll.serialNumber} has moved to ${nextStage} stage.`,
    });
  };
  
  const handleStart = () => {
    updateRollMutation.mutate({ status: "processing" });
    
    toast({
      title: `Started ${roll.currentStage.charAt(0).toUpperCase() + roll.currentStage.slice(1)}`,
      description: `Roll #${roll.serialNumber} processing has begun.`,
    });
  };
  
  const openEditDialog = () => {
    setIsDialogOpen(true);
  };
  
  return (
    <>
      <Card 
        className="bg-white p-3 rounded border border-secondary-200 shadow-sm cursor-pointer transition-shadow hover:shadow-md"
        onClick={openEditDialog}
      >
        <CardContent className="p-0">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-lg">Roll #{roll.serialNumber}</span>
            <StatusBadge status={roll.status} />
          </div>
          <div className="text-sm text-secondary-700 space-y-1.5">
            <p><span className="font-medium">Order:</span> #{jobOrder?.orderId}</p>
            <p><span className="font-medium">Customer:</span> {customer?.name || 'Loading...'}</p>
            <p><span className="font-medium">Product:</span> {item?.name || customerProduct?.itemId} ({customerProduct?.sizeCaption})</p>
            <p><span className="font-medium">Quantity:</span> {
                roll.currentStage === "extrusion" 
                  ? roll.extrudingQty 
                  : roll.currentStage === "printing" 
                    ? roll.printingQty 
                    : roll.cuttingQty
              } Kg
            </p>
            {roll.currentStage === "printing" && customerProduct?.printingCylinder && (
              <p><span className="font-medium">Printing Cylinder:</span> {customerProduct.printingCylinder} Inch</p>
            )}
          </div>
          <div className="mt-4 flex justify-end border-t pt-3 border-secondary-100">
            {roll.status === "pending" ? (
              <Button
                size="sm"
                variant="link"
                className="text-primary-500 hover:text-primary-700"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleStart();
                }}
                disabled={updateRollMutation.isPending}
              >
                Start Process
              </Button>
            ) : roll.status === "processing" ? (
              <Button
                size="sm"
                variant="link"
                className="text-primary-500 hover:text-primary-700"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleComplete();
                }}
                disabled={updateRollMutation.isPending}
              >
                Complete Stage
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      
      <UpdateRollDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        roll={roll}
      />
    </>
  );
}
