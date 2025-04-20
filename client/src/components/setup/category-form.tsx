import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { FormSuccess } from "@/components/ui/form-success";
import { FormError } from "@/components/ui/form-error";
import { FormTooltip } from "@/components/ui/form-tooltip";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { insertCategorySchema, Category } from "@shared/schema";
import { motion } from "framer-motion";
import { FiHelpCircle } from "react-icons/fi";

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
}

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!category;
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Create validation schema
  const formSchema = isEditing
    ? insertCategorySchema
    : insertCategorySchema.extend({
        id: z.string().min(1, "Category ID is required"),
      });
  
  // Set up the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: category?.id || "",
      name: category?.name || "",
      code: category?.code || "",
    },
    mode: "onChange" // Enable real-time validation
  });

  // Watch fields for validation status
  const idValue = form.watch("id");
  const nameValue = form.watch("name");
  const codeValue = form.watch("code");
  
  // Determine field status
  const getFieldStatus = (fieldName: string, value: string) => {
    if (!value) return "idle";
    const fieldState = form.getFieldState(fieldName);
    
    if (fieldState.isDirty) {
      return fieldState.invalid ? "invalid" : "valid";
    }
    return "idle";
  };

  // Create mutation for adding/updating category
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (isEditing) {
        await apiRequest("PUT", `${API_ENDPOINTS.CATEGORIES}/${category.id}`, values);
      } else {
        await apiRequest("POST", API_ENDPOINTS.CATEGORIES, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CATEGORIES] });
      
      // Show success message
      setFormSuccess(`Category ${isEditing ? "updated" : "created"} successfully!`);
      setFormError(null);
      
      toast({
        title: `Category ${isEditing ? "Updated" : "Created"}`,
        description: `The category has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      
      // Clear the form after a delay for better UX
      setTimeout(() => {
        form.reset();
        if (onSuccess) onSuccess();
      }, 1500);
    },
    onError: (error) => {
      setFormError(`Failed to ${isEditing ? "update" : "create"} category: ${error}`);
      setFormSuccess(null);
      
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} category: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Reset form messages when form changes
  useEffect(() => {
    if (form.formState.isDirty) {
      setFormSuccess(null);
      setFormError(null);
    }
  }, [form.formState.isDirty]);
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setFormSuccess(null);
    setFormError(null);
    mutation.mutate(values);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Form success and error messages */}
          {formSuccess && <FormSuccess message={formSuccess} className="mb-4" />}
          {formError && <FormError message={formError} className="mb-4" />}
          
          {!isEditing && (
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Category ID</FormLabel>
                    <FormTooltip tip="A unique identifier for the category. Once created, this cannot be changed.">
                      <FiHelpCircle className="h-4 w-4 text-muted-foreground" />
                    </FormTooltip>
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="Enter category ID" 
                      status={getFieldStatus("id", idValue)}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a unique ID for this category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Category Name</FormLabel>
                  <FormTooltip tip="The display name for this category.">
                    <FiHelpCircle className="h-4 w-4 text-muted-foreground" />
                  </FormTooltip>
                </div>
                <FormControl>
                  <Input 
                    placeholder="Enter category name" 
                    status={getFieldStatus("name", nameValue)}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Category Code</FormLabel>
                  <FormTooltip tip="A short code for referencing this category.">
                    <FiHelpCircle className="h-4 w-4 text-muted-foreground" />
                  </FormTooltip>
                </div>
                <FormControl>
                  <Input 
                    placeholder="Enter category code" 
                    status={getFieldStatus("code", codeValue)}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <motion.div 
            className="flex justify-end space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {onSuccess && (
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
              >
                Cancel
              </Button>
            )}
            <LoadingButton
              type="submit"
              isLoading={mutation.isPending}
              loadingText={isEditing ? "Updating..." : "Creating..."}
            >
              {isEditing ? "Update Category" : "Create Category"}
            </LoadingButton>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  );
}
