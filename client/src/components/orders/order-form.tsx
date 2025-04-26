import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Fuse from 'fuse.js';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { insertOrderSchema, Customer, CustomerProduct, Item, Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

// Extended schema for the form
const orderFormSchema = insertOrderSchema.extend({
  jobOrders: z.array(
    z.object({
      customerProductId: z.number(),
      quantity: z.number().positive("Quantity must be positive"),
    })
  ),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export function OrderForm() {
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  // State to track selected customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Setup fuzzy search with Fuse.js
  const fuseRef = useRef<Fuse<Customer> | null>(null);
  
  // When customers data is loaded, initialize Fuse
  useEffect(() => {
    if (customers && customers.length > 0) {
      fuseRef.current = new Fuse(customers, {
        keys: ['name', 'code'], // Search in both name and code fields
        threshold: 0.3, // Lower threshold = more strict matching
        includeScore: true
      });
    }
  }, [customers]);
  
  // Get filtered customers based on search query
  const getFilteredCustomers = () => {
    if (!customers) return [];
    if (!searchQuery.trim() || !fuseRef.current) return customers;
    
    const results = fuseRef.current.search(searchQuery);
    return results.map(result => result.item);
  };
  
  // Fetch customer products when a customer is selected
  const { data: customerProducts = [] } = useQuery<CustomerProduct[]>({
    queryKey: [`${API_ENDPOINTS.CUSTOMERS}/${selectedCustomerId}/products`],
    enabled: !!selectedCustomerId,
  });
  
  // Fetch all items to have their names available
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
    enabled: !!selectedCustomerId,
  });
  
  // Fetch all categories to display category names
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
    enabled: !!selectedCustomerId,
  });
  
  // Define form with default values
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerId: "",
      note: "",
      jobOrders: [{ customerProductId: 0, quantity: 0 }],
    },
  });
  
  // Setup field array for job orders
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "jobOrders",
  });
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      // First create the order
      const order = await apiRequest("POST", API_ENDPOINTS.ORDERS, {
        customerId: data.customerId,
        note: data.note,
      });
      const orderResponse = await order.json();
      
      // Then create job orders
      for (const jobOrder of data.jobOrders) {
        await apiRequest("POST", API_ENDPOINTS.JOB_ORDERS, {
          orderId: orderResponse.id,
          ...jobOrder,
        });
      }
      
      return orderResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ORDERS] });
      toast({
        title: "Order Created",
        description: `Order #${data.id} has been created successfully.`,
      });
      navigate("/orders");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create order: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: OrderFormValues) => {
    createOrderMutation.mutate(data);
  };
  
  // Update customer ID when selected
  const handleCustomerChange = (value: string) => {
    setSelectedCustomerId(value);
    form.setValue("customerId", value);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Order</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Customer Selection with Fuzzy Search */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Customer</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                          disabled={customersLoading}
                        >
                          {field.value
                            ? customers?.find((customer) => customer.id === field.value)?.name || "Select customer"
                            : "Select customer"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search customer..." 
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No customer found.</CommandEmpty>
                          <CommandGroup>
                            {getFilteredCustomers().map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.id}
                                onSelect={(currentValue) => {
                                  handleCustomerChange(currentValue);
                                  setOpen(false);
                                  setSearchQuery("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === customer.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{customer.name}</span>
                                  {customer.code && (
                                    <span className="text-xs text-muted-foreground">Code: {customer.code}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Order Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Note</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter additional notes for this order"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Job Orders */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Order Products</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ customerProductId: 0, quantity: 0 })}
                  disabled={!selectedCustomerId}
                >
                  <span className="material-icons text-sm mr-1">add</span>
                  Add Product
                </Button>
              </div>
              
              {selectedCustomerId ? (
                fields.length > 0 ? (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-end border p-4 rounded-md">
                        <FormField
                          control={form.control}
                          name={`jobOrders.${index}.customerProductId`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Product</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value.toString()}
                                disabled={productsLoading}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {customerProducts?.map((product) => {
                                    // Find the corresponding item to get its name
                                    const item = items?.find(item => item.id === product.itemId);
                                    // Find the corresponding category to get its name
                                    const category = categories?.find(cat => cat.id === product.categoryId);
                                    return (
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {category?.name} - {item?.name} {product.sizeCaption ? `(${product.sizeCaption})` : ''}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`jobOrders.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
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
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="mb-2 text-error-500 hover:text-error-700"
                        >
                          <span className="material-icons">delete</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-secondary-400 border border-dashed rounded-md">
                    <span className="material-icons text-3xl mb-2">inventory</span>
                    <p>Add products to this order</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-secondary-400 border border-dashed rounded-md">
                  <span className="material-icons text-3xl mb-2">person</span>
                  <p>Select a customer first</p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/orders")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
