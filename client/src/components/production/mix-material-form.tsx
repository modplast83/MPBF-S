import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { insertMixMaterialSchema, RawMaterial, Machine } from "@shared/schema";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Create a form schema based on the Drizzle schema with additional validations
const formSchema = insertMixMaterialSchema
  .extend({
    machineId: z.string().nullable(),
    orderId: z.number().nullable(),
  })
  .refine(
    (data) => {
      // At least one field must be filled
      return data.mixPerson.trim() !== "";
    },
    {
      message: "Operator name is required",
      path: ["mixPerson"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface MixMaterialFormProps {
  rawMaterials: RawMaterial[];
  machines: Machine[];
  onSuccess?: () => void;
}

export function MixMaterialForm({ rawMaterials, machines, onSuccess }: MixMaterialFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRawMaterialForm, setShowRawMaterialForm] = useState(false);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<number | null>(null);
  const [rawMaterialQuantity, setRawMaterialQuantity] = useState("");

  // Get the default form values
  const defaultValues: FormValues = {
    mixPerson: "",
    machineId: null,
    orderId: null,
  };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Create mix material mutation
  const createMixMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest(API_ENDPOINTS.MIX_MATERIALS, {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MIX_MATERIALS] });
      toast({
        title: "Success",
        description: "Mix material created successfully!",
        variant: "success",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create mix material",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createMixMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FormField
            control={form.control}
            name="mixPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operator Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter operator name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="machineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machine (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a machine" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The machine used for this mix (if applicable)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.reset(defaultValues)}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={createMixMutation.isPending}
            >
              {createMixMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Creating...
                </>
              ) : (
                "Create Mix"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-center text-sm text-secondary-500 pt-4">
        <p>After creating the mix, you will be able to add raw materials to it.</p>
      </div>
    </div>
  );
}