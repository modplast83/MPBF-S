import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { JobOrder, CreateRoll } from "@shared/schema";

interface RollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOrder: JobOrder | null;
  onSubmit: (data: CreateRoll) => void;
  isLoading: boolean;
}

const formSchema = z.object({
  extrudingQty: z.coerce.number().positive("Quantity must be greater than 0"),
  jobOrderId: z.number().positive(),
});

export function RollDialog({ open, onOpenChange, jobOrder, onSubmit, isLoading }: RollDialogProps) {
  const [stage] = useState<string>("extrusion");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      extrudingQty: 0,
      jobOrderId: jobOrder?.id || 0,
    },
  });

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    const rollData: CreateRoll = {
      jobOrderId: values.jobOrderId,
      extrudingQty: values.extrudingQty,
      printingQty: values.extrudingQty, // Auto-set printing qty equal to extrusion qty
      cuttingQty: 0, // Will be filled in later at cutting stage
      currentStage: "extrusion",
      status: "pending",
    };
    onSubmit(rollData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Roll
            <Badge variant="outline" className="ml-2">
              {stage === "extrusion" && (
                <span className="flex items-center text-primary-500">
                  <span className="material-icons text-sm mr-1">merge_type</span>
                  Extrusion
                </span>
              )}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {jobOrder && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid gap-4 py-2">
                <div className="grid gap-1">
                  <div className="text-sm font-medium">Job Order</div>
                  <div className="text-sm">#{jobOrder.id}</div>
                </div>

                <FormField
                  control={form.control}
                  name="extrudingQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Enter quantity"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-1">
                  <div className="text-sm font-medium">Remaining for Job Order</div>
                  <div className="text-sm">{jobOrder.quantity} kg</div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Roll"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}