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

interface UpdateRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roll: Roll;
}

const formSchema = z.object({
  cuttingQty: z.coerce.number().min(0, "Quantity must be non-negative"),
});

export function UpdateRollDialog({ open, onOpenChange, roll }: UpdateRollDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cuttingQty: roll.cuttingQty || 0,
    },
  });

  // Update form when roll changes
  useEffect(() => {
    if (roll) {
      form.reset({
        cuttingQty: roll.cuttingQty || 0,
      });
    }
  }, [roll, form]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    // This is just a view dialog for now
    console.log("Roll update submitted with values:", values);
    onOpenChange(false);
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
            Roll Details
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

              <div className="grid gap-1">
                <div className="text-sm font-medium">{getQuantityLabel()}</div>
                <div className="text-sm">{getQuantityValue()} kg</div>
              </div>

              {roll.currentStage === "printing" && (
                <div className="grid gap-1">
                  <div className="text-sm font-medium">Extrusion Quantity</div>
                  <div className="text-sm">{roll.extrudingQty} kg</div>
                </div>
              )}

              {roll.currentStage === "cutting" && (
                <>
                  <div className="grid gap-1">
                    <div className="text-sm font-medium">Extrusion Quantity</div>
                    <div className="text-sm">{roll.extrudingQty} kg</div>
                  </div>
                  <div className="grid gap-1">
                    <div className="text-sm font-medium">Printing Quantity</div>
                    <div className="text-sm">{roll.printingQty} kg</div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}