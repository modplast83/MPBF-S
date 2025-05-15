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
import { useAuth } from "@/hooks/use-auth-v2";

interface RollCardProps {
  roll: Roll;
}

export function RollCard({ roll }: RollCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
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
  
  // Fetch creator, printer, and cutter user data
  const { data: creator } = useQuery<any>({
    queryKey: [roll.createdById ? `${API_ENDPOINTS.USERS}/${roll.createdById}` : null],
    enabled: !!roll.createdById,
  });
  
  const { data: printer } = useQuery<any>({
    queryKey: [roll.printedById ? `${API_ENDPOINTS.USERS}/${roll.printedById}` : null],
    enabled: !!roll.printedById,
  });
  
  const { data: cutter } = useQuery<any>({
    queryKey: [roll.cutById ? `${API_ENDPOINTS.USERS}/${roll.cutById}` : null],
    enabled: !!roll.cutById,
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
  
  // Function to check if the current user has permission to complete this stage
  const canCompleteStage = () => {
    // If there's no authenticated user or no roll data, deny permission
    if (!user || !roll) return false;
    
    // Admin and Supervisor roles always have permission
    if (user.role === "administrator" || user.role === "supervisor") return true;
    
    // For specific stages, check if the current user matches the stage's owner
    if (roll.currentStage === "extrusion") {
      // Only the user who created the roll can complete extrusion
      return roll.createdById === user.id;
    } else if (roll.currentStage === "printing") {
      // Only the user who started printing can complete printing
      return roll.printedById === user.id;
    } else if (roll.currentStage === "cutting") {
      // Only the user who started cutting can complete cutting
      return roll.cutById === user.id;
    }
    
    // Default case
    return false;
  };
  
  // Function to check if current user can start this stage
  const canStartStage = () => {
    // If there's no authenticated user or no roll data, deny permission
    if (!user || !roll) return false;
    
    // Admin and Supervisor roles always have permission
    if (user.role === "administrator" || user.role === "supervisor") return true;
    
    // For specific stages, check permissions
    if (roll.currentStage === "extrusion") {
      // Only the user who created the roll can start extrusion
      return roll.createdById === user.id;
    } else if (roll.currentStage === "printing") {
      // In this case, we allow the user to claim the printing stage when they start it
      return true; 
    } else if (roll.currentStage === "cutting") {
      // In this case, we allow the user to claim the cutting stage when they start it
      return true;
    }
    
    // Default case
    return false;
  };

  const handleComplete = async () => {
    // Define next stage based on current stage
    let nextStage = roll.currentStage;
    let nextStatus = "completed";
    
    // Get the current user ID from auth context
    const currentUserId = user?.id;
    
    // If there's no user ID, show an error and return
    if (!currentUserId) {
      toast({
        title: t("common.error"),
        description: t("production.roll_management.auth_required"),
        variant: "destructive",
      });
      return;
    }
    
    // Check if the user has permission to complete this stage
    if (!canCompleteStage()) {
      toast({
        title: t("common.unauthorized"),
        description: t("production.roll_management.cannot_complete_stage"),
        variant: "destructive",
      });
      return;
    }
    
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
        printingQty: roll.extrudingQty
        // Do not set printedById here - it should be set when printing actually starts
      });
      
    } else if (roll.currentStage === "printing") {
      nextStage = "cutting";
      nextStatus = "pending";
      
      updateRollMutation.mutate({
        status: nextStatus,
        currentStage: nextStage
        // Do not set cutById here - it should be set when cutting actually starts
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
    // Check if the user has permission to start this stage
    if (!canStartStage()) {
      toast({
        title: t("common.unauthorized"),
        description: t("production.roll_management.cannot_start_stage"),
        variant: "destructive",
      });
      return;
    }
    
    // Get the current user ID from auth context
    const currentUserId = user?.id;
    
    // If there's no user ID, show an error and return
    if (!currentUserId) {
      toast({
        title: t("common.error"),
        description: t("production.roll_management.auth_required"),
        variant: "destructive",
      });
      return;
    }
    
    const updateData: Partial<Roll> = { status: "processing" };
    
    // If this is the printing stage, always set the current user as the printer
    if (roll.currentStage === "printing") {
      updateData.printedById = currentUserId;
      // Also set the printedAt timestamp to now
      updateData.printedAt = new Date();
    }
    
    // If this is the cutting stage, always set the current user as the cutter
    if (roll.currentStage === "cutting") {
      updateData.cutById = currentUserId;
      // Also set the cutAt timestamp to now
      updateData.cutAt = new Date();
    }
    
    updateRollMutation.mutate(updateData);
    
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
            {/* Operator information section */}
            <div className="text-secondary-500 text-xs pt-1 space-y-0.5">
              {/* Extrusion operator (creator) */}
              <p>
                {t("production.roll_management.created_by")}: {creator?.firstName || roll.createdById || t("common.unknown")}
              </p>
              
              {/* Printing operator - show only when the printing has been started (printedAt is set) */}
              {roll.printedAt && roll.printedById && (
                <p>
                  {t("production.roll_management.printed_by")}: {printer?.firstName || roll.printedById}
                </p>
              )}
              
              {/* Cutting operator - show when cutting has been started (cutAt is set) */}
              {roll.cutAt && roll.cutById && (
                <p>
                  {t("production.roll_management.cut_by")}: {cutter?.firstName || roll.cutById}
                </p>
              )}
            </div>
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
