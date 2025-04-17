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
import { insertSectionSchema, Section } from "@shared/schema";

interface SectionFormProps {
  section?: Section;
  onSuccess?: () => void;
}

export function SectionForm({ section, onSuccess }: SectionFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!section;
  
  // Set up the form
  const form = useForm<z.infer<typeof insertSectionSchema>>({
    resolver: zodResolver(insertSectionSchema),
    defaultValues: {
      id: section?.id || "",
      name: section?.name || "",
    },
  });
  
  // Create mutation for adding/updating section
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertSectionSchema>) => {
      if (isEditing) {
        await apiRequest("PUT", `${API_ENDPOINTS.SECTIONS}/${section.id}`, values);
      } else {
        await apiRequest("POST", API_ENDPOINTS.SECTIONS, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.SECTIONS] });
      toast({
        title: `Section ${isEditing ? "Updated" : "Created"}`,
        description: `The section has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} section: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof insertSectionSchema>) => {
    mutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter section ID" 
                  {...field} 
                  disabled={isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter section name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
              : isEditing ? "Update Section" : "Create Section"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
