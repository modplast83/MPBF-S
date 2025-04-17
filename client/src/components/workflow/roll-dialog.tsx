import { useState } from "react";
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
  
  // Handler for form changes
  const handleChange = (field: keyof Roll, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
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
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRollMutation.mutate(formValues);
  };
  
  // Mapping of stage transitions
  const stageOptions = {
    extrusion: ["extrusion", "printing"],
    printing: ["printing", "cutting"],
    cutting: ["cutting", "completed"],
    completed: ["completed"],
  };

  const availableStages = stageOptions[formValues.currentStage as keyof typeof stageOptions] || [];
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Roll #{roll.serialNumber}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Current Stage */}
          <div className="space-y-2">
            <Label htmlFor="currentStage">Current Stage</Label>
            <Select
              value={formValues.currentStage}
              onValueChange={(value) => handleChange("currentStage", value)}
            >
              <SelectTrigger id="currentStage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Status */}
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
          
          {/* Extrusion Quantity */}
          {(formValues.currentStage === "extrusion" || 
            formValues.currentStage === "printing" || 
            formValues.currentStage === "cutting" || 
            formValues.currentStage === "completed") && (
            <div className="space-y-2">
              <Label htmlFor="extrudingQty">Extrusion Quantity (Kg)</Label>
              <Input
                id="extrudingQty"
                type="number"
                value={formValues.extrudingQty || 0}
                onChange={(e) => handleChange("extrudingQty", parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
          
          {/* Printing Quantity */}
          {(formValues.currentStage === "printing" || 
            formValues.currentStage === "cutting" || 
            formValues.currentStage === "completed") && (
            <div className="space-y-2">
              <Label htmlFor="printingQty">Printing Quantity (Kg)</Label>
              <Input
                id="printingQty"
                type="number"
                value={formValues.printingQty || 0}
                onChange={(e) => handleChange("printingQty", parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
          
          {/* Cutting Quantity */}
          {(formValues.currentStage === "cutting" || 
            formValues.currentStage === "completed") && (
            <div className="space-y-2">
              <Label htmlFor="cuttingQty">Cutting Quantity (Kg)</Label>
              <Input
                id="cuttingQty"
                type="number"
                value={formValues.cuttingQty || 0}
                onChange={(e) => handleChange("cuttingQty", parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={updateRollMutation.isPending}
            >
              Cancel
            </Button>
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