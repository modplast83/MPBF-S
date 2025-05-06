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
import { upsertUserSchema, User } from "@shared/schema";

interface UserFormProps {
  user?: User;
  onSuccess?: () => void;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!user;
  
  // Fetch sections
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.SECTIONS],
  });
  
  // Extended schema for the form
  const userFormSchema = upsertUserSchema.extend({
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    displayName: z.string().optional(),
  });
  
  // Set up the form
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      id: user?.id || "",
      username: user?.username || "",
      email: user?.email || null,
      firstName: user?.firstName || null,
      lastName: user?.lastName || null,
      bio: user?.bio || null,
      profileImageUrl: user?.profileImageUrl || null,
      role: user?.role || "user",
      phone: user?.phone || null,
      isActive: user?.isActive ?? true,
      sectionId: user?.sectionId || null,
      displayName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "",
    },
  });
  
  // Create mutation for adding/updating user
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof userFormSchema>) => {
      // Process name values
      const { displayName, ...userData } = values;
      
      // If displayName is provided, split it into firstName and lastName
      if (displayName && displayName.trim() !== '') {
        const nameParts = displayName.trim().split(' ');
        userData.firstName = nameParts[0];
        userData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      }
      
      if (isEditing && user) {
        await apiRequest("PUT", `${API_ENDPOINTS.USERS}/${user.id}`, userData);
      } else {
        await apiRequest("POST", API_ENDPOINTS.USERS, userData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.USERS] });
      toast({
        title: `User ${isEditing ? "Updated" : "Created"}`,
        description: `The user has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} user: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof userFormSchema>) => {
    mutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter display name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email address" 
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" 
                    {...field} 
                    value={field.value || ''}
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
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
        </div>
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-secondary-500">
                  Is this user currently active?
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
              : isEditing ? "Update User" : "Create User"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
