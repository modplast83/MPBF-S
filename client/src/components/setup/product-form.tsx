import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect } from "react";
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
import { insertCustomerProductSchema, CustomerProduct, Customer, Category, Item } from "@shared/schema";

interface ProductFormProps {
  product?: CustomerProduct;
  onSuccess?: () => void;
  preSelectedCustomerId?: string;
  isDuplicate?: boolean;
}

export function ProductForm({ product, onSuccess, preSelectedCustomerId, isDuplicate = false }: ProductFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!product && !isDuplicate;
  
  // Fetch required data
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });
  
  const { data: items = [], isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
  });
  
  const { data: masterBatches = [], isLoading: masterBatchesLoading } = useQuery<any[]>({
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
    printed: z.boolean().optional(),
    cuttingUnit: z.string().optional(),
    unitWeight: z.number().optional(),
    unitQty: z.number().optional(),
    packageKg: z.number().optional(),
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
      customerId: product?.customerId || preSelectedCustomerId || "",
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
      printed: product?.printed === "Yes" || false,
      cuttingUnit: product?.cuttingUnit || "",
      unitWeight: product?.unitWeight || undefined,
      unitQty: product?.unitQty || undefined,
      packageKg: product?.packageKg || undefined,
      packing: product?.packing || "",
      punching: product?.punching || "",
      cover: product?.cover || "",
      volum: product?.volum || null,
      knife: product?.knife || null,
      notes: product?.notes || null,
    },
  });
  
  // Auto-calculate Thickness One when Thickness changes
  const watchedThickness = form.watch("thickness");
  
  useEffect(() => {
    if (watchedThickness !== undefined && watchedThickness > 0) {
      const calculatedThicknessOne = (watchedThickness / 4) * 10;
      form.setValue("thicknessOne", calculatedThicknessOne);
    }
  }, [watchedThickness, form]);

  // Auto-calculate Length (cm) when Printing Cylinder changes
  const watchedPrintingCylinder = form.watch("printingCylinder");
  
  useEffect(() => {
    if (watchedPrintingCylinder !== undefined && watchedPrintingCylinder > 0) {
      const calculatedLength = Math.round(watchedPrintingCylinder * 2.54);
      form.setValue("lengthCm", calculatedLength);
    }
  }, [watchedPrintingCylinder, form]);

  // Auto-calculate Size Caption when width, leftF, or rightF change
  const watchedRightF = form.watch("rightF");
  const watchedWidth = form.watch("width");
  const watchedLeftF = form.watch("leftF");
  const watchedLengthCm = form.watch("lengthCm");
  const watchedThicknessOne = form.watch("thicknessOne");

  useEffect(() => {
    const rightF = watchedRightF || 0;
    const leftF = watchedLeftF || 0;
    const width = watchedWidth;

    if (width !== undefined && width > 0) {
      let sizeCaption = "";
      
      // If both Right F and Left F are null or 0, size caption = Width
      if (rightF === 0 && leftF === 0) {
        sizeCaption = width.toString();
      } else {
        // Otherwise format as "rightF+width+leftF" (only include non-zero values)
        const parts = [];
        if (rightF > 0) parts.push(rightF.toString());
        parts.push(width.toString());
        if (leftF > 0) parts.push(leftF.toString());
        sizeCaption = parts.join("+");
      }
      
      form.setValue("sizeCaption", sizeCaption);
    }
  }, [watchedWidth, watchedLeftF, watchedRightF, form]);

  // Auto-calculate Package Kg when Unit Weight or Unit Qty change
  const watchedUnitWeight = form.watch("unitWeight");
  const watchedUnitQty = form.watch("unitQty");

  useEffect(() => {
    const unitWeight = watchedUnitWeight || 0;
    const unitQty = watchedUnitQty || 0;

    if (unitWeight > 0 && unitQty > 0) {
      const packageKg = unitWeight * unitQty;
      form.setValue("packageKg", packageKg);
    }
  }, [watchedUnitWeight, watchedUnitQty, form]);
  
  useEffect(() => {
    if (
      watchedRightF !== undefined && 
      watchedWidth !== undefined && 
      watchedLeftF !== undefined &&
      watchedLengthCm !== undefined && 
      watchedThicknessOne !== undefined &&
      watchedRightF > 0 && watchedWidth > 0 && watchedLeftF > 0 && 
      watchedLengthCm > 0 && watchedThicknessOne > 0
    ) {
      const calculatedVolume = ((watchedRightF + watchedWidth + watchedLeftF) * watchedLengthCm * 2 * watchedThicknessOne) / 1000;
      form.setValue("volum", calculatedVolume.toFixed(2));
    }
  }, [watchedRightF, watchedWidth, watchedLeftF, watchedLengthCm, watchedThicknessOne, form]);

  // Auto-calculate Size Caption when dimensions change
  useEffect(() => {
    if (
      watchedWidth !== undefined && 
      watchedLeftF !== undefined && 
      watchedRightF !== undefined &&
      watchedWidth > 0 && watchedLeftF > 0 && watchedRightF > 0
    ) {
      const calculatedSizeCaption = `${watchedWidth}+${watchedLeftF}+${watchedRightF}`;
      form.setValue("sizeCaption", calculatedSizeCaption);
    }
  }, [watchedWidth, watchedLeftF, watchedRightF, form]);

  // Filter items based on selected category
  const watchedCategoryId = form.watch("categoryId");
  const filteredItems = items?.filter(item => item.categoryId === watchedCategoryId) || [];
  
  // Create mutation for adding/updating product
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Handle all fields to ensure correct typing
      const payload = {
        ...values,
        // Convert number fields
        width: values.width !== undefined ? Number(values.width) : undefined,
        leftF: values.leftF !== undefined ? Number(values.leftF) : undefined,
        rightF: values.rightF !== undefined ? Number(values.rightF) : undefined,
        thickness: values.thickness !== undefined ? Number(values.thickness) : undefined,
        thicknessOne: values.thicknessOne !== undefined ? Number(values.thicknessOne) : undefined,
        printingCylinder: values.printingCylinder !== undefined ? Number(values.printingCylinder) : undefined,
        lengthCm: values.lengthCm !== undefined ? Number(values.lengthCm) : undefined,
        cuttingLength: values.cuttingLength !== undefined ? Number(values.cuttingLength) : undefined,
        unitWeight: values.unitWeight !== undefined ? Number(values.unitWeight) : undefined,
        
        // Handle masterBatchId correctly
        masterBatchId: values.masterBatchId === "none" ? undefined : values.masterBatchId,
        
        // Ensure text fields are never null or undefined
        sizeCaption: values.sizeCaption || "",
        rawMaterial: values.rawMaterial || "",
        printed: values.printed ? "Yes" : "No",
        cuttingUnit: values.cuttingUnit || "",
        packing: values.packing || "",
        punching: values.punching || "",
        cover: values.cover || "",
        volum: values.volum || "",
        knife: values.knife || "",
        notes: values.notes || "",
      };
      
      console.log("Submitting customer product with payload:", payload);
      
      try {
        if (isEditing && product && !isDuplicate) {
          // Only do an update if we're editing and not duplicating
          await apiRequest("PUT", `${API_ENDPOINTS.CUSTOMER_PRODUCTS}/${product.id}`, payload);
        } else {
          // For both new products and duplications, create a new record
          await apiRequest("POST", API_ENDPOINTS.CUSTOMER_PRODUCTS, payload);
        }
      } catch (error) {
        console.error("Error submitting customer product:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS] });
      
      // Determine the appropriate success message based on the operation type
      let actionTitle = "Created";
      let actionDescription = "created";
      
      if (isDuplicate) {
        actionTitle = "Duplicated";
        actionDescription = "duplicated";
      } else if (isEditing) {
        actionTitle = "Updated";
        actionDescription = "updated";
      }
      
      toast({
        title: `Product ${actionTitle}`,
        description: `The product has been ${actionDescription} successfully.`,
      });
      
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      // Determine the appropriate error message based on the operation type
      let actionType = "create";
      if (isDuplicate) {
        actionType = "duplicate";
      } else if (isEditing) {
        actionType = "update";
      }
      
      toast({
        title: "Error",
        description: `Failed to ${actionType} product: ${error}`,
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
                  disabled={isLoading || !watchedCategoryId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={watchedCategoryId ? "Select item" : "Select category first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredItems?.map((item) => (
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
                <FormLabel>Size Caption (Auto-calculated)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Auto-calculated from dimensions"
                    {...field}
                    value={field.value || ""}
                    readOnly
                    className="bg-gray-50"
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
                <FormLabel>Thickness One (Auto-calculated)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Auto-calculated from thickness"
                    {...field}
                    value={field.value || ""}
                    readOnly
                    className="bg-gray-50"
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
                <Select
                  onValueChange={(value) => field.onChange(parseFloat(value))}
                  value={field.value ? field.value.toString() : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cylinder size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 39].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <FormLabel>Length (cm) (Auto-calculated)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Auto-calculated from printing cylinder"
                    {...field}
                    value={field.value || ""}
                    readOnly
                    className="bg-gray-50"
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select raw material" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="HDPE">HDPE</SelectItem>
                    <SelectItem value="LLDPE">LLDPE</SelectItem>
                    <SelectItem value="Regrind">Regrind</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select
                  onValueChange={(value) => field.onChange(value === "true")}
                  value={field.value ? "true" : "false"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select printed status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">TRUE</SelectItem>
                    <SelectItem value="false">FALSE</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cutting unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Kg.">Kg.</SelectItem>
                    <SelectItem value="ROLL">ROLL</SelectItem>
                    <SelectItem value="PKT">PKT</SelectItem>
                    <SelectItem value="BOX">BOX</SelectItem>
                    <SelectItem value="Peace">Peace</SelectItem>
                  </SelectContent>
                </Select>
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
            name="unitQty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Qty</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Unit Quantity" 
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
            name="packageKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package Kg (Auto-calculated)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Auto-calculated from Unit Weight × Unit Qty"
                    {...field}
                    value={field.value || ""}
                    readOnly
                    className="bg-gray-50"
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select punching type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                    <SelectItem value="T-Shirt w/Hook">T-Shirt w/Hook</SelectItem>
                    <SelectItem value="Banana">Banana</SelectItem>
                  </SelectContent>
                </Select>
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
                <FormLabel>Volume (cm³) (Auto-calculated)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Auto-calculated from dimensions"
                    {...field}
                    value={field.value || ""}
                    readOnly
                    className="bg-gray-50"
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
              ? isEditing ? "Updating..." : isDuplicate ? "Duplicating..." : "Creating..."
              : isEditing ? "Update Product" : isDuplicate ? "Duplicate Product" : "Create Product"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
