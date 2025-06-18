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
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { insertItemSchema, Item } from "@shared/schema";

const itemFormSchema = z.object({
  id: z.string().min(1, "ID is required"),
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  fullName: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

interface ItemFormProps {
  item?: Item;
  onSuccess?: () => void;
}

export function ItemForm({ item, onSuccess }: ItemFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = !!item;
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });
  
  // Set up the form
  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      id: item?.id || "",
      categoryId: item?.categoryId || "",
      name: item?.name || "",
      fullName: item?.fullName || "",
    },
  });
  
  // Create mutation for adding/updating item
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof insertItemSchema>) => {
      if (isEditing) {
        await apiRequest("PUT", `${API_ENDPOINTS.ITEMS}/${item.id}`, values);
      } else {
        await apiRequest("POST", API_ENDPOINTS.ITEMS, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ITEMS] });
      toast({
        title: `Item ${isEditing ? "Updated" : "Created"}`,
        description: `The item has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} item: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof insertItemSchema>) => {
    mutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={"id" as keyof ItemFormData}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.id")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t("common.enter_id")} 
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
            name={"categoryId" as keyof ItemFormData}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.category")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={categoriesLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.select_category")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories && Array.isArray(categories) && categories.map((category: any) => (
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={"name" as keyof ItemFormData}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("setup.items.name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("setup.items.name_placeholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name={"fullName" as keyof ItemFormData}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("setup.items.full_name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("setup.items.full_name_placeholder")} {...field} />
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
              {t("common.cancel")}
            </Button>
          )}
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? isEditing ? "Updating..." : "Creating..."
              : isEditing ? "Update Item" : "Create Item"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
