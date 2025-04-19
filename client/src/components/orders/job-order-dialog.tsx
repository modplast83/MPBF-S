import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_ENDPOINTS } from "@/lib/constants";
import { CustomerProduct, JobOrder, Order, insertJobOrderSchema } from "@shared/schema";

interface JobOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  jobOrder?: JobOrder | null;
  orderId: number;
}

// Create a job order form schema based on the insert schema
const jobOrderFormSchema = insertJobOrderSchema.extend({
  // You can add additional validations here if needed
  quantity: z.number().positive("Quantity must be positive")
});

export function JobOrderDialog({
  open,
  onOpenChange,
  onSubmit,
  jobOrder,
  orderId
}: JobOrderDialogProps) {
  const isEditMode = !!jobOrder;

  // Fetch customer products for the dropdown
  const { data: customerProducts, isLoading: customerProductsLoading } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS]
  });

  // Initialize form with default values or job order values for editing
  const form = useForm<z.infer<typeof jobOrderFormSchema>>({
    resolver: zodResolver(jobOrderFormSchema),
    defaultValues: {
      orderId: orderId,
      customerProductId: jobOrder?.customerProductId || 0,
      quantity: jobOrder?.quantity || 0,
      status: jobOrder?.status || "pending"
    }
  });

  // Update form when job order changes (for editing)
  useEffect(() => {
    if (jobOrder) {
      form.reset({
        orderId: orderId,
        customerProductId: jobOrder.customerProductId,
        quantity: jobOrder.quantity,
        status: jobOrder.status
      });
    } else {
      form.reset({
        orderId: orderId,
        customerProductId: 0,
        quantity: 0,
        status: "pending"
      });
    }
  }, [jobOrder, orderId, form]);

  const handleSubmit = (data: z.infer<typeof jobOrderFormSchema>) => {
    onSubmit(data);
  };

  // Get order's customer ID
  const { data: order } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId
  });

  // Filter customer products to get only those for this order's customer
  const getFilteredCustomerProducts = () => {
    if (!customerProducts || !order) return [];
    // Filter to only show products from the order's customer
    return customerProducts.filter(product => product.customerId === order.customerId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Job Order" : "Add New Job Order"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update the details of this job order." 
              : "Create a new job order for this customer order."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerProductId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                    disabled={customerProductsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getFilteredCustomerProducts().map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.sizeCaption} {product.thickness}mm {product.rawMaterial || ""}
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditMode && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="extrusion_completed">Extrusion Completed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Save Changes" : "Add Job Order"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}