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
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

interface RollCardProps {
  roll: Roll;
}

export function RollCard({ roll }: RollCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
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
  
  // Fetch creator user data
  const { data: creator } = useQuery<any>({
    queryKey: [roll.createdById ? `${API_ENDPOINTS.USERS}/${roll.createdById}` : null],
    enabled: !!roll.createdById,
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
    
    // Hard-coded current user ID for demo - in real app, this would come from auth context
    const currentUserId = "00U1"; // Admin user ID from the database
    
    // If we're in the cutting stage, just open the dialog to input cutting quantity
    if (roll.currentStage === "cutting") {
      setIsDialogOpen(true);
      return;
    }
    
    if (roll.currentStage === "extrusion") {
      nextStage = "printing";
      nextStatus = "pending";
      
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
      
      updateRollMutation.mutate({
        status: nextStatus,
        currentStage: nextStage,
        cutById: currentUserId
      });
      
    } else {
      // Default case - just update status
      updateRollMutation.mutate({
        status: nextStatus,
        currentStage: nextStage
      });
      return; // Skip the toast
    }
    
    // Get translated stage names
    const currentStageName = t(`rolls.${roll.currentStage}`);
    const nextStageName = t(`rolls.${nextStage}`);
    
    // Add toast notification for better feedback
    toast({
      title: t("production.roll_management.stage_completed", { stage: currentStageName }),
      description: t("production.roll_management.roll_moved", { 
        rollNumber: roll.serialNumber, 
        nextStage: nextStageName 
      }),
    });
  };
  
  const handleStart = () => {
    updateRollMutation.mutate({ status: "processing" });
    
    // Get translated stage name
    const stageName = t(`rolls.${roll.currentStage}`);
    
    toast({
      title: t("production.roll_management.started_stage", { stage: stageName }),
      description: t("production.roll_management.processing_begun", { rollNumber: roll.serialNumber }),
    });
  };
  
  const openEditDialog = () => {
    setIsDialogOpen(true);
  };
  
  return (
    <>
      <Card 
        className="bg-white p-2 md:p-3 rounded border border-secondary-200 shadow-sm cursor-pointer transition-shadow hover:shadow-md"
        onClick={openEditDialog}
      >
        <CardContent className="p-0">
          {/* Mobile-optimized header */}
          <div className="flex justify-between items-center mb-2 md:mb-3">
            <span className="font-medium text-base md:text-lg truncate max-w-[65%]">
              JO #{roll.jobOrderId}-{t("rolls.title")} #{roll.serialNumber}
            </span>
            <StatusBadge status={roll.status} />
          </div>
          
          {/* Mobile-optimized content with smaller text and tighter spacing */}
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-secondary-700 space-y-1 md:space-y-1.5`}>
            <p className="truncate"><span className="font-medium">{t("orders.title")}:</span> #{jobOrder?.orderId}</p>
            <p className="truncate"><span className="font-medium">{t("orders.customer")}:</span> {customer?.name || t("common.loading")}</p>
            <p className="truncate">
              <span className="font-medium">{t("orders.product")}:</span> 
              {item?.name || customerProduct?.itemId} 
              <span className="ml-1">({customerProduct?.sizeCaption})</span>
            </p>
            <p>
              <span className="font-medium">{t("orders.quantity")}:</span> {
                roll.currentStage === "extrusion" 
                  ? roll.extrudingQty 
                  : roll.currentStage === "printing" 
                    ? roll.printingQty 
                    : roll.cuttingQty
              } Kg
            </p>
            {roll.currentStage === "printing" && customerProduct?.printingCylinder && (
              <p><span className="font-medium">{t("production.printing_cylinder")}:</span> {customerProduct.printingCylinder} {t("common.inch")}</p>
            )}
            <p className="text-secondary-500 text-xs pt-1">
              {t("production.roll_management.created_by")}: {creator?.firstName || roll.createdById || t("common.unknown")}
            </p>
          </div>
          
          {/* Mobile-optimized action buttons */}
          <div className="mt-3 md:mt-4 flex justify-end border-t pt-2 md:pt-3 border-secondary-100">
            {roll.status === "pending" ? (
              <Button
                size={isMobile ? "sm" : "default"}
                variant="link"
                className="text-primary-500 hover:text-primary-700 text-xs md:text-sm py-1 h-auto"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleStart();
                }}
                disabled={updateRollMutation.isPending}
              >
                {t(isMobile ? "common.start" : "production.roll_management.start_process")}
              </Button>
            ) : roll.status === "processing" ? (
              <Button
                size={isMobile ? "sm" : "default"}
                variant="link"
                className="text-primary-500 hover:text-primary-700 text-xs md:text-sm py-1 h-auto"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleComplete();
                }}
                disabled={updateRollMutation.isPending}
              >
                {t(isMobile ? "common.complete" : "production.roll_management.complete_stage")}
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
