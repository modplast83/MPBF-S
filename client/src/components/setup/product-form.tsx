import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { insertCustomerProductSchema, CustomerProduct } from "@shared/schema";

interface ProductFormProps {
  product?: CustomerProduct;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!product;
  
  // Fetch required data
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });
  
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ITEMS],
  });
  
  const { data: masterBatches, isLoading: masterBatchesLoading } = useQuery({
    queryKey: [API_ENDPOINTS.MASTER_BATCHES],
  });
  
  // Create a simplified schema for the form
  const formSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    categoryId: z.string().min(1, "Category is required"),
    itemId: z.string().min(1, "Item is required"),
    sizeCaption: z.string().min(1, "Size caption is required"),
    width: z.number().optional(),
    leftF: z.number().optional(),
    rightF: z.number().optional(),
    thickness: z.number().optional(),
    thicknessOne: z.number().optional(),
    printingCylinder: z.number().optional(),
    lengthCm: z.number().optional(),
    cuttingLength: z.number().optional(),
    rawMaterial: z.string().optional(),
    masterBatchId: z.string().optional(),
    printed: z.string().optional(),
    cuttingUnit: z.string().optional(),
    unitWeight: z.number().optional(),
    packing: z.string().optional(),
    punching: z.string().optional(),
    cover: z.string().optional(),
    volum: z.string().nullable().optional(),
    knife: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  });
  
  // Set up the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: product?.customerId || "",
      categoryId: product?.categoryId || "",
      itemId: product?.itemId || "",
      sizeCaption: product?.sizeCaption || "",
      width: product?.width || undefined,
      leftF: product?.leftF || undefined,
      rightF: product?.rightF || undefined,
      thickness: product?.thickness || undefined,
      thicknessOne: product?.thicknessOne || undefined,
      printingCylinder: product?.printingCylinder || undefined,
      lengthCm: product?.lengthCm || undefined,
      cuttingLength: product?.cuttingLength || undefined,
      rawMaterial: product?.rawMaterial || "",
      masterBatchId: product?.masterBatchId || "none",
      printed: product?.printed || "",
      cuttingUnit: product?.cuttingUnit || "",
      unitWeight: product?.unitWeight || undefined,
      packing: product?.packing || "",
      punching: product?.punching || "",
      cover: product?.cover || "",
      volum: product?.volum || null,
      knife: product?.knife || null,
      notes: product?.notes || null,
    },
  });
  
  // Create mutation for adding/updating product
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Convert string numbers to actual numbers
      const payload = {
        ...values,
        width: values.width ? Number(values.width) : null,
        leftF: values.leftF ? Number(values.leftF) : null,
        rightF: values.rightF ? Number(values.rightF) : null,
        thickness: values.thickness ? Number(values.thickness) : null,
        thicknessOne: values.thicknessOne ? Number(values.thicknessOne) : null,
        printingCylinder: values.printingCylinder ? Number(values.printingCylinder) : null,
        lengthCm: values.lengthCm ? Number(values.lengthCm) : null,
        cuttingLength: values.cuttingLength ? Number(values.cuttingLength) : null,
        unitWeight: values.unitWeight ? Number(values.unitWeight) : null,
        masterBatchId: values.masterBatchId === "none" ? "" : values.masterBatchId,
      };
      
      if (isEditing && product) {
        await apiRequest("PUT", `${API_ENDPOINTS.CUSTOMER_PRODUCTS}/${product.id}`, payload);
      } else {
        await apiRequest("POST", API_ENDPOINTS.CUSTOMER_PRODUCTS, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS] });
      toast({
        title: `Product ${isEditing ? "Updated" : "Created"}`,
        description: `The product has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} product: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };
  
  const isLoading = customersLoading || categoriesLoading || itemsLoading || masterBatchesLoading;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {items?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sizeCaption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size Caption</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 9×9+28" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="rightF"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Right F</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Right F" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Width" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="leftF"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Left F</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Left F" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="thickness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thickness</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Thickness" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="thicknessOne"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thickness One</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Thickness One" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="printingCylinder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Printing Cylinder (Inch)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Printing Cylinder" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="lengthCm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (cm)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Length" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cuttingLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cutting Length (cm)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Cutting Length" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="rawMaterial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Raw Material</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. HDPE" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="masterBatchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Master Batch</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select master batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {masterBatches?.map((mb) => (
                      <SelectItem key={mb.id} value={mb.id}>
                        {mb.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="printed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Printed</FormLabel>
                <FormControl>
                  <Input placeholder="Printed" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="cuttingUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cutting Unit</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Kg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="unitWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Weight (Kg)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Unit Weight" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="packing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Packing</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 20K/Bag" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="punching"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punching</FormLabel>
                <FormControl>
                  <Input placeholder="Punching" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cover"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover</FormLabel>
                <FormControl>
                  <Input placeholder="Cover" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="volum"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volume</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Volume" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="knife"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Knife</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Knife" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Notes" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          {onSuccess && (
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? isEditing ? "Updating..." : "Creating..."
              : isEditing ? "Update Product" : "Create Product"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
