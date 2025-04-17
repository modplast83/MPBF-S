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
    const updateData: Partial<Roll> = {
      status: nextStatus,
      currentStage: nextStage,
    };
    
    // Hard-coded current user ID for demo - in real app, this would come from auth context
    const currentUserId = "USER001"; // This should be replaced with actual authenticated user
    
    if (roll.currentStage === "extrusion") {
      nextStage = "printing";
      nextStatus = "pending";
      // Set printing quantity equal to extrusion quantity
      updateData.printingQty = roll.extrudingQty;
      // Record user who completed extrusion
      updateData.printedById = currentUserId;
      updateData.printedAt = new Date();
    } else if (roll.currentStage === "printing") {
      nextStage = "cutting";
      nextStatus = "pending";
      // Record user who completed printing
      updateData.cutById = currentUserId;
      updateData.cutAt = new Date();
    } else if (roll.currentStage === "cutting") {
      nextStage = "completed";
      nextStatus = "completed";
    }
    
    updateData.status = nextStatus;
    updateData.currentStage = nextStage;
    
    // Add toast notification for better feedback
    toast({
      title: `${roll.currentStage.charAt(0).toUpperCase() + roll.currentStage.slice(1)} Completed`,
      description: `Roll #${roll.serialNumber} has moved to ${nextStage} stage.`,
    });
    
    updateRollMutation.mutate(updateData);
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
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Roll #{roll.serialNumber}</span>
            <StatusBadge status={roll.status} />
          </div>
          <div className="text-sm text-secondary-600">
            <p>Order: #{jobOrder?.orderId}</p>
            <p>Product: {customerProduct?.itemId} ({customerProduct?.sizeCaption})</p>
            <p>
              Quantity: {
                roll.currentStage === "extrusion" 
                  ? roll.extrudingQty 
                  : roll.currentStage === "printing" 
                    ? roll.printingQty 
                    : roll.cuttingQty
              } Kg
            </p>
          </div>
          <div className="mt-3 flex justify-end">
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
