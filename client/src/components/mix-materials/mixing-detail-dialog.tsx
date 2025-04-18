import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  mixingProcessId: z.number(),
  materialId: z.number(),
  quantity: z.coerce.number().positive(),
});

type FormValues = z.infer<typeof formSchema>;

interface MixingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: number;
  detailId?: number;
  onSuccess: () => void;
}

export default function MixingDetailDialog({
  open,
  onOpenChange,
  processId,
  detailId,
  onSuccess,
}: MixingDetailDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!detailId;

  // Fetch existing detail for edit mode
  const {
    data: existingDetail,
    isLoading: isExistingDetailLoading,
  } = useQuery({
    queryKey: [`/api/mixing-details/${detailId}`],
    enabled: isEditMode && open,
  });

  // Fetch raw materials for the dropdown
  const { data: rawMaterials, isLoading: isRawMaterialsLoading } = useQuery({
    queryKey: ["/api/raw-materials"],
    enabled: open,
  });

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mixingProcessId: processId,
      materialId: 0,
      quantity: 0,
    },
  });

  // Set form values when editing an existing detail
  useEffect(() => {
    if (isEditMode && existingDetail) {
      form.reset({
        mixingProcessId: existingDetail.mixingProcessId,
        materialId: existingDetail.materialId,
        quantity: existingDetail.quantity,
      });
    } else {
      form.setValue("mixingProcessId", processId);
    }
  }, [isEditMode, existingDetail, form, processId]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/mixing-details", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mixing-processes/${processId}/details`] });
      queryClient.invalidateQueries({ queryKey: [`/api/mixing-processes/${processId}`] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add material to mix",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PUT", `/api/mixing-details/${detailId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mixing-processes/${processId}/details`] });
      queryClient.invalidateQueries({ queryKey: [`/api/mixing-processes/${processId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/mixing-details/${detailId}`] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update mix material",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading =
    isExistingDetailLoading ||
    isRawMaterialsLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Material" : "Add Material to Mix"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the material details in this mix"
              : "Add a new material to this mixing process"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value ? field.value.toString() : undefined}
                    value={field.value ? field.value.toString() : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rawMaterials?.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the material to add to the mix
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter quantity in kg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The weight of the material in kilograms
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}