import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { Roll, JobOrder, CustomerProduct } from "@shared/schema";

interface RollCardProps {
  roll: Roll;
}

export function RollCard({ roll }: RollCardProps) {
  const queryClient = useQueryClient();
  
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
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ROLLS] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/${roll.id}`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/${roll.currentStage}`] });
    },
  });
  
  const handleComplete = async () => {
    // Define next stage based on current stage
    let nextStage = roll.currentStage;
    let nextStatus = "completed";
    
    if (roll.currentStage === "extrusion") {
      nextStage = "printing";
      nextStatus = "pending";
    } else if (roll.currentStage === "printing") {
      nextStage = "cutting";
      nextStatus = "pending";
    } else if (roll.currentStage === "cutting") {
      nextStage = "completed";
      nextStatus = "completed";
    }
    
    updateRollMutation.mutate({
      status: nextStatus,
      currentStage: nextStage,
    });
  };
  
  const handleStart = () => {
    updateRollMutation.mutate({ status: "processing" });
  };
  
  return (
    <Card className="bg-white p-3 rounded border border-secondary-200 shadow-sm">
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
              onClick={handleStart}
              disabled={updateRollMutation.isPending}
            >
              Start Process
            </Button>
          ) : roll.status === "processing" ? (
            <Button
              size="sm"
              variant="link"
              className="text-primary-500 hover:text-primary-700"
              onClick={handleComplete}
              disabled={updateRollMutation.isPending}
            >
              Complete Stage
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
