import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Roll } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

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
  const [isEditing, setIsEditing] = useState(false);
  const [wasteQty, setWasteQty] = useState(0);
  const [wastePercentage, setWastePercentage] = useState(0);
  
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

  // Update form when roll changes
  useEffect(() => {
    if (roll) {
      form.reset({
        cuttingQty: roll.cuttingQty || 0,
      });
    }
  }, [roll, form]);

  // Mutation for updating roll
  const updateRollMutation = useMutation({
    mutationFn: (data: Partial<Roll>) => {
      return apiRequest("PUT", `${API_ENDPOINTS.ROLLS}/${roll.id}`, data);
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.JOB_ORDERS}/${roll.jobOrderId}/rolls`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/printing`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/cutting`] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ROLLS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.JOB_ORDERS] }); // Also invalidate job orders
      
      // Show success toast
      toast({
        title: "Roll updated",
        description: "Roll has been updated successfully",
        variant: "default",
      });
      
      setIsEditing(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update roll: ${error}`,
        variant: "destructive",
      });
    },
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
    
    updateRollMutation.mutate(updatedRoll);
  };

  const getQuantityLabel = () => {
    if (roll.currentStage === "extrusion") return "Extrusion Quantity";
    if (roll.currentStage === "printing") return "Printing Quantity";
    if (roll.currentStage === "cutting") return "Cutting Quantity";
    return "Quantity";
  };

  const getQuantityValue = () => {
    if (roll.currentStage === "extrusion") return roll.extrudingQty;
    if (roll.currentStage === "printing") return roll.printingQty;
    if (roll.currentStage === "cutting") return roll.cuttingQty;
    return 0;
  };

  const stageLabel = 
    roll.currentStage === "extrusion" ? "Extrusion" :
    roll.currentStage === "printing" ? "Printing" :
    roll.currentStage === "cutting" ? "Cutting" : "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing && roll.currentStage === "cutting" ? "Update Cutting Quantity" : "Roll Details"}
            <Badge variant="outline" className="ml-2">
              <span className="flex items-center">
                <span className="material-icons text-sm mr-1">info</span>
                {stageLabel}
              </span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid gap-4 py-2">
              <div className="grid gap-1">
                <div className="text-sm font-medium">Roll ID</div>
                <div className="text-sm">{roll.id}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-medium">Job Order</div>
                <div className="text-sm">#{roll.jobOrderId}</div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-medium">Status</div>
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
                  <div className="text-sm font-medium">Extrusion Quantity</div>
                  <div className="text-sm">{roll.extrudingQty} kg</div>
                </div>
              )}

              {roll.currentStage === "cutting" && !isEditing && (
                <>
                  <div className="grid gap-1">
                    <div className="text-sm font-medium">Extrusion Quantity</div>
                    <div className="text-sm">{roll.extrudingQty} kg</div>
                  </div>
                  <div className="grid gap-1">
                    <div className="text-sm font-medium">Printing Quantity</div>
                    <div className="text-sm">{roll.printingQty} kg</div>
                  </div>
                  
                  {roll.wasteQty && roll.wasteQty > 0 && (
                    <div className="grid gap-1">
                      <div className="text-sm font-medium">Waste Quantity</div>
                      <div className="text-sm">{roll.wasteQty} kg ({roll.wastePercentage}%)</div>
                    </div>
                  )}
                </>
              )}
              
              {/* User Tracking Information */}
              {!isEditing && (
                <Card className="p-3 bg-secondary-50">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium">Processing Information</div>
                    <div className="grid gap-2">
                      {roll.createdById && (
                        <div>
                          <div className="text-xs text-secondary-500">Created by</div>
                          <div className="text-sm font-medium">{roll.createdById}</div>
                          {roll.createdAt && <div className="text-xs text-secondary-400">{new Date(roll.createdAt).toLocaleString()}</div>}
                        </div>
                      )}
                      
                      {roll.printedById && roll.currentStage !== "extrusion" && (
                        <div>
                          <div className="text-xs text-secondary-500">Printed by</div>
                          <div className="text-sm font-medium">{roll.printedById}</div>
                          {roll.printedAt && <div className="text-xs text-secondary-400">{new Date(roll.printedAt).toLocaleString()}</div>}
                        </div>
                      )}
                      
                      {roll.cutById && roll.currentStage === "completed" && (
                        <div>
                          <div className="text-xs text-secondary-500">Cut by</div>
                          <div className="text-sm font-medium">{roll.cutById}</div>
                          {roll.cutAt && <div className="text-xs text-secondary-400">{new Date(roll.cutAt).toLocaleString()}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {isEditing && roll.currentStage === "cutting" && (
                <>
                  <div className="grid gap-2">
                    <div className="text-sm font-medium">Printing Quantity (Source)</div>
                    <div className="text-sm font-medium">{maxQuantity} kg</div>
                  </div>

                  <FormField
                    control={form.control}
                    name="cuttingQty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cutting Quantity (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={maxQuantity}
                            placeholder="Enter final quantity"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Card className="p-3 bg-secondary-50">
                    <div className="grid gap-2">
                      <div className="text-sm font-medium">Waste Calculation</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-secondary-500">Waste Amount</div>
                          <div className="text-sm font-medium">{wasteQty} kg</div>
                        </div>
                        <div>
                          <div className="text-xs text-secondary-500">Waste Percentage</div>
                          <div className="text-sm font-medium">{wastePercentage}%</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>

            <DialogFooter>
              {!isEditing && roll.currentStage === "cutting" && roll.status !== "completed" && (
                <Button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center"
                >
                  <span className="material-icons text-sm mr-1">edit</span>
                  Update Cutting Quantity
                </Button>
              )}
              
              {isEditing && roll.currentStage === "cutting" && (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateRollMutation.isPending}
                  >
                    {updateRollMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
              
              {(!isEditing || roll.currentStage !== "cutting" || roll.status === "completed") && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}