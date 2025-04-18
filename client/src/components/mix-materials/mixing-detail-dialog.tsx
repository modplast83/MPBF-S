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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  mixingProcessId: z.number(),
  materialId: z.number(),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
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
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

  // Fetch existing detail for edit mode
  const {
    data: existingDetail,
    isLoading: isExistingDetailLoading,
  } = useQuery({
    queryKey: [`/api/mixing-details/${detailId}`],
    enabled: isEditMode && open,
  });

  // Fetch raw materials for the dropdown (with available stock)
  const { data: rawMaterials, isLoading: isRawMaterialsLoading } = useQuery({
    queryKey: ["/api/raw-materials"],
    enabled: open,
  });

  // Get the selected material's details
  const selectedMaterial = selectedMaterialId 
    ? rawMaterials?.find(m => m.id === selectedMaterialId) 
    : null;

  // Check if quantity exceeds available stock
  const [exceedsStock, setExceedsStock] = useState(false);
  const [qtyInput, setQtyInput] = useState<number>(0);

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
      setSelectedMaterialId(existingDetail.materialId);
      setQtyInput(existingDetail.quantity);
    } else {
      form.setValue("mixingProcessId", processId);
    }
  }, [isEditMode, existingDetail, form, processId]);

  // Check stock vs quantity when quantity or selected material changes
  useEffect(() => {
    if (selectedMaterial && selectedMaterial.quantity !== null && qtyInput > 0) {
      setExceedsStock(qtyInput > selectedMaterial.quantity);
    } else {
      setExceedsStock(false);
    }
  }, [selectedMaterial, qtyInput]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/mixing-details", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mixing-processes/${processId}/details`] });
      queryClient.invalidateQueries({ queryKey: [`/api/mixing-processes/${processId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      toast({
        title: "Success",
        description: "Material added to the mix",
      });
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
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      toast({
        title: "Success",
        description: "Material updated successfully",
      });
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
    if (exceedsStock) {
      toast({
        title: "Insufficient Stock",
        description: "The requested quantity exceeds the available stock",
        variant: "destructive",
      });
      return;
    }
    
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
                    onValueChange={(value) => {
                      const materialId = parseInt(value);
                      field.onChange(materialId);
                      setSelectedMaterialId(materialId);
                    }}
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
                          <div className="flex justify-between w-full">
                            <span>{material.name}</span>
                            <Badge variant={material.quantity > 0 ? "outline" : "destructive"} className="ml-2">
                              {material.quantity !== null ? `${material.quantity} ${material.unit}` : 'No stock'}
                            </Badge>
                          </div>
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

            {selectedMaterial && (
              <div className="rounded-md bg-muted p-3">
                <div className="text-sm">
                  <span className="font-medium">Selected Material: </span>
                  {selectedMaterial.name}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-medium">Available Stock: </span>
                  {selectedMaterial.quantity !== null 
                    ? `${selectedMaterial.quantity} ${selectedMaterial.unit}` 
                    : 'No stock information'}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-medium">Type: </span>
                  {selectedMaterial.type}
                </div>
              </div>
            )}

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
                      onChange={(e) => {
                        field.onChange(e);
                        setQtyInput(parseFloat(e.target.value) || 0);
                      }}
                      className={exceedsStock ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormDescription>
                    The weight of the material in kilograms
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {exceedsStock && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The quantity exceeds the available stock of {selectedMaterial?.quantity} {selectedMaterial?.unit}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || exceedsStock || !selectedMaterialId || qtyInput <= 0}
              >
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