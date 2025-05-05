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
import { insertCustomerSchema, Customer, User } from "@shared/schema";

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!customer;
  
  // Fetch users (for sales person)
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });
  
  // Set up the form
  const form = useForm<z.infer<typeof insertCustomerSchema>>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      id: customer?.id || "",
      code: customer?.code || "",
      name: customer?.name || "",
      nameAr: customer?.nameAr || "",
      userId: customer?.userId || null,
      plateDrawerCode: customer?.plateDrawerCode || "",
    },
  });
  
  // Create mutation for adding/updating customer
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertCustomerSchema>) => {
      if (isEditing) {
        await apiRequest("PUT", `${API_ENDPOINTS.CUSTOMERS}/${customer.id}`, values);
      } else {
        await apiRequest("POST", API_ENDPOINTS.CUSTOMERS, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CUSTOMERS] });
      toast({
        title: `Customer ${isEditing ? "Updated" : "Created"}`,
        description: `The customer has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} customer: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof insertCustomerSchema>) => {
    // If not editing and no ID provided, generate a new customer ID
    if (!isEditing && !values.id) {
      // Generate a new customer ID using "CID" prefix and 3 random digits
      const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
      values.id = `CID${randomNum}`;
    }
    
    // If not editing and no code provided, use the ID as the code
    if (!isEditing && !values.code) {
      values.code = values.id;
    }
    
    console.log("Submitting customer form with values:", values);
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
                <FormLabel>
                  Customer ID {!isEditing && <span className="text-muted-foreground text-xs font-normal">(generated automatically if empty)</span>}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={isEditing ? "Customer ID" : "Leave empty for auto-generation"} 
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Customer Code {!isEditing && <span className="text-muted-foreground text-xs font-normal">(uses ID if empty)</span>}
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="nameAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic Name (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter Arabic name" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || "")}
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
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sales Person</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                  value={field.value || "null"}
                  disabled={usersLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales person" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
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
            name="plateDrawerCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plate Drawer Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter plate drawer code" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || "")}
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
              : isEditing ? "Update Customer" : "Create Customer"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
