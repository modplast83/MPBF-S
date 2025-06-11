import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Roll, CustomerProduct, JobOrder, User } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth-v2";

interface UpdateRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roll: Roll;
}

const formSchema = z.object({
  cuttingQty: z.coerce.number()
    .min(0, "Quantity must be non-negative")
    .refine(val => val !== undefined, {
      message: "Cutting quantity is required",
    }),
});

export function UpdateRollDialog({ open, onOpenChange, roll }: UpdateRollDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [wasteQty, setWasteQty] = useState(0);
  const [wastePercentage, setWastePercentage] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  
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
  
  // Fetch user data for the creator, printer, and cutter
  const { data: creator } = useQuery<User>({
    queryKey: [roll.createdById ? `${API_ENDPOINTS.USERS}/${roll.createdById}` : null],
    enabled: !!roll.createdById,
  });
  
  const { data: printer } = useQuery<User>({
    queryKey: [roll.printedById ? `${API_ENDPOINTS.USERS}/${roll.printedById}` : null],
    enabled: !!roll.printedById,
  });
  
  const { data: cutter } = useQuery<User>({
    queryKey: [roll.cutById ? `${API_ENDPOINTS.USERS}/${roll.cutById}` : null],
    enabled: !!roll.cutById,
  });
  
  // Get the maximum available quantity for cutting (from printing stage)
  const maxQuantity = roll.printingQty || 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cuttingQty: roll.cuttingQty || 0,
    },
  });

  // Recalculate waste when form values change
  const watchCuttingQty = form.watch("cuttingQty");
  
  useEffect(() => {
    // Calculate waste quantity as the difference between printing and cutting quantities
    const wastage = Math.max(0, maxQuantity - watchCuttingQty);
    setWasteQty(wastage);
    
    // Calculate waste percentage
    const wastePercent = maxQuantity > 0 ? (wastage / maxQuantity) * 100 : 0;
    setWastePercentage(parseFloat(wastePercent.toFixed(2)));
  }, [watchCuttingQty, maxQuantity]);

  // Check if the current user has permission to edit this roll
  const hasEditPermission = () => {
    if (!user) return false;
    
    // Admin and Supervisor roles always have permission
    if (user.role === "administrator" || user.role === "supervisor") return true;
    
    // Only the user who started cutting can complete cutting
    if (roll.currentStage === "cutting" && roll.status === "processing") {
      return roll.cutById === user.id;
    }
    
    return false;
  };

  // Update form when roll changes
  useEffect(() => {
    if (roll) {
      form.reset({
        cuttingQty: roll.cuttingQty || 0,
      });
      
      // Automatically enter editing mode if we're in the cutting stage with "processing" status
      // AND the current user is the one who started cutting
      if (roll.currentStage === "cutting" && roll.status === "processing" && hasEditPermission()) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    }
  }, [roll, form, user]);

  // Mutation for updating roll
  const updateRollMutation = useMutation({
    mutationFn: (data: Partial<Roll>) => {
      return apiRequest("PUT", `${API_ENDPOINTS.ROLLS}/${roll.id}`, data);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.JOB_ORDERS}/${roll.jobOrderId}/rolls`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/printing`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/cutting`] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ROLLS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.JOB_ORDERS] }); // Also invalidate job orders
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FINAL_PRODUCTS] }); // Invalidate final products

      // Show success toast
      toast({
        title: t("production.roll_management.roll_updated"),
        description: t("production.roll_management.roll_updated_success"),
        variant: "default",
      });
      
      setIsEditing(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("production.roll_management.roll_update_failed", { error }),
        variant: "destructive",
      });
    },
  });

  // Create final product mutation
  const createFinalProductMutation = useMutation({
    mutationFn: async (data: { jobOrderId: number; quantity: number; status: string }) => {
      return apiRequest("POST", API_ENDPOINTS.FINAL_PRODUCTS, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FINAL_PRODUCTS] });
      toast({
        title: t("warehouse.final_product_created"),
        description: t("warehouse.final_product_created_success", { jobOrderId: roll.jobOrderId }),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("warehouse.final_product_creation_failed", { error }),
        variant: "destructive",
      });
    }
  });

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    // Update roll with new cutting quantity and mark it as completed
    const updatedRoll: Partial<Roll> = {
      cuttingQty: values.cuttingQty,
      status: "completed",
      // Add waste information to roll data
      wasteQty, 
      wastePercentage
    };
    
    // First update the roll
    updateRollMutation.mutate(updatedRoll, {
      onSuccess: () => {
        // Then create a final product entry in warehouse
        if (roll.currentStage === "cutting") {
          createFinalProductMutation.mutate({
            jobOrderId: roll.jobOrderId,
            quantity: values.cuttingQty,
            status: "in-stock"
          });
        }
      }
    });
  };

  const getQuantityLabel = () => {
    if (roll.currentStage === "extrusion") return t("rolls.extruding_qty");
    if (roll.currentStage === "printing") return t("rolls.printing_qty");
    if (roll.currentStage === "cutting") return t("rolls.cutting_qty");
    return t("orders.quantity");
  };

  const getQuantityValue = () => {
    if (roll.currentStage === "extrusion") return roll.extrudingQty;
    if (roll.currentStage === "printing") return roll.printingQty;
    if (roll.currentStage === "cutting") return roll.cuttingQty;
    return 0;
  };

  const stageLabel = 
    roll.currentStage === "extrusion" ? t("rolls.extrusion") :
    roll.currentStage === "printing" ? t("rolls.printing") :
    roll.currentStage === "cutting" ? t("rolls.cutting") : t("common.unknown");
    
  // Function to print the label
  const handlePrintLabel = () => {
    setIsPrinting(true);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: t("common.error"),
        description: t("production.roll_management.popup_blocked"),
        variant: "destructive",
      });
      setIsPrinting(false);
      return;
    }
    
    // Format date to display on label
    const formattedDate = roll.createdAt 
      ? new Date(roll.createdAt).toLocaleDateString() 
      : new Date().toLocaleDateString();
    
    // Set the content of the print window with CSS for a 3" x 5" label
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Roll Label - ${roll.id}</title>
        <style>
          @page {
            size: 3in 5in;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0.25in;
            width: 3in;
            height: 5in;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }
          .label-container {
            border: 1px solid #ccc;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 0.15in;
            box-sizing: border-box;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #000;
            padding-bottom: 0.1in;
            margin-bottom: 0.1in;
          }
          .roll-id {
            font-size: 16pt;
            font-weight: bold;
          }
          .info-row {
            margin: 0.05in 0;
            display: flex;
          }
          .info-label {
            font-weight: bold;
            width: 1in;
          }
          .info-value {
            flex: 1;
          }
          .barcode {
            margin-top: 0.1in;
            height: 0.5in;
            border: 1px solid #000;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .footer {
            margin-top: auto;
            font-size: 8pt;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 0.1in;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <div class="roll-id">${roll.id}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Customer:</div>
            <div class="info-value">${customer?.name || 'N/A'}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Product:</div>
            <div class="info-value">${item?.name || customerProduct?.itemId || 'N/A'}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Size:</div>
            <div class="info-value">${customerProduct?.sizeCaption || 'N/A'}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Order #:</div>
            <div class="info-value">${jobOrder?.orderId || 'N/A'}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Job Order #:</div>
            <div class="info-value">${roll.jobOrderId}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Date:</div>
            <div class="info-value">${formattedDate}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Weight:</div>
            <div class="info-value">${getQuantityValue()} kg</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Status:</div>
            <div class="info-value">${roll.status} - ${roll.currentStage}</div>
          </div>
          
          <div class="barcode">
            Barcode: ${roll.id}
          </div>
          
          <div class="footer">
            Printed on ${new Date().toLocaleString()}<br>
            Created by: ${creator?.firstName || roll.createdById || 'System User'}
            ${roll.printedById ? `<br>Printed by: ${printer?.firstName || roll.printedById}` : ''}
            ${roll.cutById ? `<br>Cut by: ${cutter?.firstName || roll.cutById}` : ''}
          </div>
        </div>
      </body>
      </html>
    `);
    
    // Execute print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
        setIsPrinting(false);
      };
    }, 500);
    
    // Fallback in case onafterprint doesn't trigger
    setTimeout(() => {
      setIsPrinting(false);
    }, 5000);
    
    toast({
      title: t("production.roll_management.printing_label"),
      description: t("production.roll_management.label_sent_to_printer", { rollId: roll.id }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {roll.currentStage === "cutting" && roll.status === "processing" 
              ? t("production.roll_management.update_cutting_qty") 
              : t("production.roll_management.roll_details")}
            <Badge variant="outline" className="ml-2">
              <span className="flex items-center">
                <span className="material-icons text-sm mr-1">info</span>
                {stageLabel}
              </span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {t("common.roll_information", "Roll information and processing details")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid gap-4 py-2">
              <div className="grid gap-1">
                <div className="text-sm font-medium">{t("rolls.roll_id")}</div>
                <div className="text-sm">{roll.id}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-medium">{t("orders.order_id")}</div>
                <div className="text-sm">#{jobOrder?.orderId}</div>
              </div>
              
              <div className="grid gap-1">
                <div className="text-sm font-medium">{t("orders.customer")}</div>
                <div className="text-sm">{customer?.name || t("production.roll_management.loading")}</div>
              </div>
              
              <div className="grid gap-1">
                <div className="text-sm font-medium">{t("orders.product")}</div>
                <div className="text-sm">{item?.name || customerProduct?.itemId} ({customerProduct?.sizeCaption})</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-medium">{t("job_orders.job_order_id")}</div>
                <div className="text-sm">#{roll.jobOrderId}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-medium">{t("rolls.status")}</div>
                <div className="text-sm">{roll.status}</div>
              </div>

              {!isEditing && (
                <div className="grid gap-1">
                  <div className="text-sm font-medium">{getQuantityLabel()}</div>
                  <div className="text-sm">{getQuantityValue()} kg</div>
                </div>
              )}

              {roll.currentStage === "printing" && (
                <div className="grid gap-1">
                  <div className="text-sm font-medium">{t("rolls.extruding_qty")}</div>
                  <div className="text-sm">{roll.extrudingQty} kg</div>
                </div>
              )}

              {roll.currentStage === "cutting" && !isEditing && (
                <>
                  <div className="grid gap-1">
                    <div className="text-sm font-medium">{t("rolls.extruding_qty")}</div>
                    <div className="text-sm">{roll.extrudingQty} kg</div>
                  </div>
                  <div className="grid gap-1">
                    <div className="text-sm font-medium">{t("rolls.printing_qty")}</div>
                    <div className="text-sm">{roll.printingQty} kg</div>
                  </div>
                  
                  {roll.wasteQty && roll.wasteQty > 0 && (
                    <div className="grid gap-1">
                      <div className="text-sm font-medium">{t("rolls.waste_qty")}</div>
                      <div className="text-sm">{roll.wasteQty} kg ({roll.wastePercentage}%)</div>
                    </div>
                  )}
                </>
              )}
              
              {/* User Tracking Information */}
              {!isEditing && (
                <Card className="p-2 bg-secondary-50">
                  <div className="grid gap-1">
                    <div className="text-sm font-medium">{t("production.roll_management.processing_info")}</div>
                    <div className="grid gap-1">
                      {roll.createdById && (
                        <div className="flex justify-between text-xs">
                          <span className="text-secondary-500">{t("production.roll_management.created_by")}</span>
                          <span className="font-medium">{creator?.firstName || roll.createdById}</span>
                        </div>
                      )}
                      
                      {roll.printedById && roll.currentStage !== "extrusion" && (
                        <div className="flex justify-between text-xs">
                          <span className="text-secondary-500">{t("production.roll_management.printed_by")}</span>
                          <span className="font-medium">{printer?.firstName || roll.printedById}</span>
                        </div>
                      )}
                      
                      {roll.cutById && roll.currentStage === "completed" && (
                        <div className="flex justify-between text-xs">
                          <span className="text-secondary-500">{t("production.roll_management.cut_by")}</span>
                          <span className="font-medium">{cutter?.firstName || roll.cutById}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {(isEditing || (roll.currentStage === "cutting" && roll.status === "processing")) && (
                <>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium">{t("production.roll_management.printing_qty_source")}</div>
                    <div className="text-sm font-medium">{maxQuantity} kg</div>
                  </div>

                  <FormField
                    control={form.control}
                    name="cuttingQty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("rolls.cutting_qty")} (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={maxQuantity}
                            placeholder={t("production.roll_management.enter_final_qty")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Card className="p-3 bg-secondary-50">
                    <div className="grid gap-2">
                      <div className="text-sm font-medium">{t("production.roll_management.waste_calculation")}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-secondary-500">{t("rolls.waste_qty")}</div>
                          <div className="text-sm font-medium">{wasteQty} kg</div>
                        </div>
                        <div>
                          <div className="text-xs text-secondary-500">{t("rolls.waste_percentage")}</div>
                          <div className="text-sm font-medium">{wastePercentage}%</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>

            <DialogFooter>
              {/* Show edit button only in specific conditions and when user has permission */}
              {!isEditing && 
               roll.currentStage === "cutting" && 
               roll.status === "processing" && 
               hasEditPermission() && (
                <Button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center"
                >
                  <span className="material-icons text-sm mr-1">edit</span>
                  {t("production.roll_management.update_cutting_qty")}
                </Button>
              )}
              
              {/* Show unauthorized message if user doesn't have permission */}
              {!isEditing && 
               roll.currentStage === "cutting" && 
               roll.status === "processing" && 
               !hasEditPermission() && (
                <div className="text-sm text-destructive">
                  {t("production.roll_management.cannot_complete_stage")}
                </div>
              )}
              
              {/* Display action buttons when in editing mode or processing status */}
              {(isEditing || (roll.currentStage === "cutting" && roll.status === "processing" && hasEditPermission())) && 
               roll.currentStage === "cutting" && (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      if (roll.status === "processing") {
                        onOpenChange(false);
                      } else {
                        setIsEditing(false);
                      }
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateRollMutation.isPending}
                  >
                    {updateRollMutation.isPending ? t("common.saving") : t("common.save")}
                  </Button>
                </>
              )}
              
              {(!isEditing && !(roll.currentStage === "cutting" && roll.status === "processing")) && (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    {t("common.close")}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="secondary"
                    className="flex items-center"
                    onClick={handlePrintLabel}
                    disabled={isPrinting}
                  >
                    <span className="material-icons text-sm mr-1">print</span>
                    {t(isPrinting ? "production.roll_management.printing" : "production.roll_management.print_label")}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}