import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { Roll } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface RollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roll: Roll;
}

export function RollDialog({ isOpen, onClose, roll }: RollDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for form values
  const [formValues, setFormValues] = useState<Partial<Roll>>({
    status: roll.status,
    currentStage: roll.currentStage,
    extrudingQty: roll.extrudingQty,
    printingQty: roll.printingQty,
    cuttingQty: roll.cuttingQty,
  });

  // State for calculated waste
  const [waste, setWaste] = useState<number>(0);
  
  // Calculate waste when cutting quantity changes
  useEffect(() => {
    if (formValues.currentStage === "cutting" && formValues.printingQty && formValues.cuttingQty) {
      setWaste(formValues.printingQty - formValues.cuttingQty);
    }
  }, [formValues.cuttingQty, formValues.printingQty, formValues.currentStage]);
  
  // Handler for form changes
  const handleChange = (field: keyof Roll, value: any) => {
    setFormValues((prev) => {
      // If changing extrusion quantity, automatically update printing quantity to match
      if (field === "extrudingQty") {
        return {
          ...prev,
          [field]: value,
          printingQty: value, // Automatically set printing quantity equal to extrusion quantity
        };
      }
      
      return {
        ...prev,
        [field]: value,
      };
    });
  };
  
  // Handler for completing the current stage
  const handleCompleteStage = () => {
    let nextStage = roll.currentStage;
    let nextStatus = "completed";
    const updateData: Partial<Roll> = {
      status: nextStatus,
    };
    
    if (roll.currentStage === "extrusion") {
      nextStage = "printing";
      nextStatus = "pending";
      updateData.printingQty = formValues.extrudingQty; // Set printing quantity equal to extrusion quantity
    } else if (roll.currentStage === "printing") {
      nextStage = "cutting";
      nextStatus = "pending";
    } else if (roll.currentStage === "cutting") {
      nextStage = "completed";
      nextStatus = "completed";
    }
    
    updateData.status = nextStatus;
    updateData.currentStage = nextStage;
    
    updateRollMutation.mutate(updateData);
  };
  
  // Update roll mutation
  const updateRollMutation = useMutation({
    mutationFn: async (updateData: Partial<Roll>) => {
      await apiRequest("PUT", `${API_ENDPOINTS.ROLLS}/${roll.id}`, updateData);
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ROLLS] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/${roll.id}`] });
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ENDPOINTS.ROLLS}/stage/${roll.currentStage}`] 
      });
      
      // Show success toast
      toast({
        title: "Roll Updated",
        description: `Roll #${roll.serialNumber} has been updated successfully.`,
      });
      
      // Close dialog
      onClose();
    },
    onError: (error) => {
      console.error("Error updating roll:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the roll. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission for regular updates
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRollMutation.mutate(formValues);
  };
  
  // Determine if status can be changed based on stage
  const canChangeStatus = formValues.currentStage === "extrusion";
  
  // Check if the roll is in a stage that allows completion
  const showCompleteButton = roll.status === "processing";
  
  // Determine dialog title and action based on roll stage
  const getDialogTitle = () => {
    switch (roll.currentStage) {
      case "extrusion":
        return `Extrude Roll #${roll.serialNumber}`;
      case "printing":
        return `Print Roll #${roll.serialNumber}`;
      case "cutting":
        return `Cut Roll #${roll.serialNumber}`;
      default:
        return `View Roll #${roll.serialNumber}`;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Current Stage - Only shown for information, not editable */}
          <div className="space-y-2">
            <Label htmlFor="currentStage">Current Stage</Label>
            <div className="p-2 border rounded-md bg-gray-50">
              {roll.currentStage.charAt(0).toUpperCase() + roll.currentStage.slice(1)}
            </div>
          </div>
          
          {/* Status - Only editable in extrusion stage */}
          {canChangeStatus && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formValues.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Extrusion Quantity - Only editable in extrusion stage */}
          <div className="space-y-2">
            <Label htmlFor="extrudingQty">Extrusion Quantity (Kg)</Label>
            <Input
              id="extrudingQty"
              type="number"
              value={formValues.extrudingQty || 0}
              onChange={(e) => handleChange("extrudingQty", parseFloat(e.target.value) || 0)}
              disabled={roll.currentStage !== "extrusion"} // Only editable in extrusion stage
              className={roll.currentStage !== "extrusion" ? "bg-gray-100" : ""}
            />
            {roll.currentStage !== "extrusion" && (
              <p className="text-xs text-muted-foreground">Extrusion quantity can only be modified in extrusion stage.</p>
            )}
          </div>
          
          {/* Printing Quantity - Always displayed but never editable */}
          {(roll.currentStage === "printing" || roll.currentStage === "cutting" || roll.currentStage === "completed") && (
            <div className="space-y-2">
              <Label htmlFor="printingQty">Printing Quantity (Kg)</Label>
              <Input
                id="printingQty"
                type="number"
                value={formValues.printingQty || 0}
                disabled={true}
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground">Printing quantity is automatically set to match extrusion quantity.</p>
            </div>
          )}
          
          {/* Cutting Quantity - Only editable in cutting stage */}
          {(roll.currentStage === "cutting" || roll.currentStage === "completed") && (
            <div className="space-y-2">
              <Label htmlFor="cuttingQty">Cutting Quantity (Kg)</Label>
              <Input
                id="cuttingQty"
                type="number"
                value={formValues.cuttingQty || 0}
                onChange={(e) => handleChange("cuttingQty", parseFloat(e.target.value) || 0)}
                disabled={roll.currentStage !== "cutting"} // Only editable in cutting stage
                className={roll.currentStage !== "cutting" ? "bg-gray-100" : ""}
              />
              {roll.currentStage === "cutting" && (
                <p className="text-xs text-muted-foreground">Enter the actual cut quantity. The difference will be calculated as waste.</p>
              )}
            </div>
          )}
          
          {/* Waste Calculation for cutting stage */}
          {(roll.currentStage === "cutting" && formValues.printingQty && formValues.cuttingQty) && (
            <div className="space-y-2 p-3 border rounded-md bg-amber-50">
              <Label className="font-medium">Waste Calculation</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span>Printing Quantity:</span>
                <span className="text-right">{formValues.printingQty} Kg</span>
                <span>Cutting Quantity:</span>
                <span className="text-right">{formValues.cuttingQty} Kg</span>
                <span className="font-medium">Waste:</span>
                <span className="text-right font-medium text-amber-700">
                  {waste > 0 ? waste.toFixed(2) : 0} Kg
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={updateRollMutation.isPending}
            >
              Cancel
            </Button>
            
            {showCompleteButton && (
              <Button 
                type="button"
                onClick={handleCompleteStage}
                disabled={updateRollMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {roll.currentStage === "cutting" ? "Complete Cutting" : 
                  roll.currentStage === "printing" ? "Complete Printing" : 
                  roll.currentStage === "extrusion" ? "Complete Extrusion" : "Complete"}
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={updateRollMutation.isPending}
            >
              {updateRollMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}