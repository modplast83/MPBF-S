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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { insertCategorySchema, Category } from "@shared/schema";

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
}

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!category;
  
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
  });
  
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
      toast({
        title: `Category ${isEditing ? "Updated" : "Created"}`,
        description: `The category has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} category: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isEditing && (
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter category ID" {...field} />
                </FormControl>
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
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} />
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
              <FormLabel>Category Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter category code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
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
              : isEditing ? "Update Category" : "Create Category"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
