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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { insertMachineSchema, Machine } from "@shared/schema";

interface MachineFormProps {
  machine?: Machine;
  onSuccess?: () => void;
}

export function MachineForm({ machine, onSuccess }: MachineFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!machine;
  
  // Fetch sections
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.SECTIONS],
  });
  
  // Set up the form
  const form = useForm<z.infer<typeof insertMachineSchema>>({
    resolver: zodResolver(insertMachineSchema),
    defaultValues: {
      id: machine?.id || "",
      name: machine?.name || "",
      sectionId: machine?.sectionId || null,
      isActive: machine?.isActive ?? true,
    },
  });
  
  // Create mutation for adding/updating machine
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertMachineSchema>) => {
      if (isEditing) {
        await apiRequest("PUT", `${API_ENDPOINTS.MACHINES}/${machine.id}`, values);
      } else {
        await apiRequest("POST", API_ENDPOINTS.MACHINES, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MACHINES] });
      toast({
        title: `Machine ${isEditing ? "Updated" : "Created"}`,
        description: `The machine has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} machine: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof insertMachineSchema>) => {
    mutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machine ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter machine ID" 
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
                <FormLabel>Machine Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter machine name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sectionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value || null)}
                  value={field.value || ""}
                  disabled={sectionsLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {sections?.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
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
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                  <div className="text-sm text-secondary-500">
                    Is this machine currently active?
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
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
              : isEditing ? "Update Machine" : "Create Machine"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
