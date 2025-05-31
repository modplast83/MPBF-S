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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
    console.log('Customers data:', customers);
    if (customers && customers.length > 0) {
      // Simplified Fuse.js configuration for debugging
      fuseRef.current = new Fuse(customers, {
        keys: ['name'],
        threshold: 0.6, // Very lenient matching
        includeScore: true,
        ignoreLocation: true,
      });
    }
  }, [customers]);
  
  // Advanced search function to handle both Arabic and English inputs
  const getFilteredCustomers = (): Customer[] => {
    if (!customers || !customers.length) {
      console.log('No customers available');
      return [];
    }
    
    // If no search query, return all customers
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      console.log('No search query, showing all customers:', customers.length);
      return customers;
    }
    
    console.log('Search query:', trimmedQuery);
    
    try {
      // Special cases: very short search terms might produce too many results
      // For single characters, be more restrictive to avoid showing too many results
      if (trimmedQuery.length === 1) {
        // For single character searches, only match start of words
        const char = trimmedQuery.toLowerCase();
        const filteredCustomers = customers.filter(customer => {
          if (!customer) return false;
          
          // Match start of name words
          const nameStartsWithMatch = customer.name && 
            (customer.name.toLowerCase().startsWith(char) || 
             customer.name.toLowerCase().split(' ').some(word => word.startsWith(char)));
          
          // Match code
          const codeMatch = customer.code && 
            customer.code.toLowerCase().startsWith(char);
            
          return nameStartsWithMatch || codeMatch;
        });
        
        return filteredCustomers;
      }
      
      // For normal searches, normalize query and split into terms
      const searchTerms = trimmedQuery.split(/\s+/);
      
      // Enhanced multi-term search approach
      const filteredCustomers = customers.filter(customer => {
        if (!customer) return false;
        
        // Check each search term separately to improve matching
        for (const term of searchTerms) {
          const termLower = term.toLowerCase();
          
          // Skip very short terms unless they are numbers
          if (termLower.length < 2 && !/^\d+$/.test(termLower)) {
            continue;
          }
          
          // Check if name contains term (case insensitive)
          const nameMatch = customer.name && 
            customer.name.toLowerCase().includes(termLower);
          
          // For Arabic names, try different matching approaches
          // 1. Direct match
          const directArMatch = customer.nameAr && 
            customer.nameAr.includes(term);
            
          // 2. Match without whitespace (for connected Arabic words)
          const noSpaceArMatch = customer.nameAr && term.length > 1 && 
            customer.nameAr.replace(/\s+/g, '').includes(term);
            
          // 3. Check if customer code contains the term
          const codeMatch = customer.code && 
            customer.code.toLowerCase().includes(termLower);
            
          // If any term matches, include this customer
          if (nameMatch || directArMatch || noSpaceArMatch || codeMatch) {
            return true;
          }
        }
        
        return false;
      });
      
      // Log results
      console.log('Filtered customers:', filteredCustomers.length);
      
      // If there are too many results, limit them for better performance
      const MAX_RESULTS = 100;
      if (filteredCustomers.length > MAX_RESULTS) {
        console.log(`Showing only the first ${MAX_RESULTS} results`);
        return filteredCustomers.slice(0, MAX_RESULTS);
      }
      
      return filteredCustomers;
    } catch (error) {
      console.error('Error in customer filtering:', error);
      return customers;
    }
  };
  
  // Fetch customer products when a customer is selected
  const { data: customerProducts = [], isLoading: productsLoading } = useQuery<CustomerProduct[]>({
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
      const orderResponse = await apiRequest("POST", API_ENDPOINTS.ORDERS, {
        customerId: data.customerId,
        note: data.note,
      });
      
      // Then create job orders with adjusted quantities based on category
      for (const jobOrder of data.jobOrders) {
        // Find the customer product to get its category
        const customerProduct = customerProducts?.find(cp => cp.id === jobOrder.customerProductId);
        
        if (customerProduct) {
          // Get the category
          const category = categories?.find(cat => cat.id === customerProduct.categoryId);
          
          // Calculate adjusted quantity based on category
          let adjustedQuantity = jobOrder.quantity;
          
          if (category) {
            if (category.name === "T-Shirt Bag") {
              // Add 20% to quantity for T-Shirt Bags
              adjustedQuantity = jobOrder.quantity * 1.2;
            } else if (category.name === "Calendar Bag") {
              // Add 10% to quantity for Calendar Bags
              adjustedQuantity = jobOrder.quantity * 1.1;
            } else {
              // Add 5% to quantity for all other categories
              adjustedQuantity = jobOrder.quantity * 1.05;
            }
          }
          
          // Create job order with adjusted quantity
          await apiRequest("POST", API_ENDPOINTS.JOB_ORDERS, {
            orderId: orderResponse.id,
            customerProductId: jobOrder.customerProductId,
            quantity: adjustedQuantity,
          });
        } else {
          // Fallback if customer product is not found
          await apiRequest("POST", API_ENDPOINTS.JOB_ORDERS, {
            orderId: orderResponse.id,
            ...jobOrder,
          });
        }
      }
      
      return orderResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ORDERS] });
      toast({
        title: t("orders.order_created"),
        description: t("orders.order_created_success", { id: data.id }),
      });
      navigate("/orders");
    },
    onError: (error) => {
      toast({
        title: t("orders.error"),
        description: t("orders.order_creation_failed", { error }),
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
  
  // Get filtered customers directly
  const filteredCustomers = getFilteredCustomers();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("orders.create_new_order")}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Customer Selection with Search */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("orders.customer")}</FormLabel>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                      disabled={customersLoading}
                      onClick={() => setOpen(!open)}
                    >
                      {field.value
                        ? customers?.find((customer) => customer.id === field.value)?.name || t("orders.select_customer")
                        : t("orders.select_customer")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    
                    {open && (
                      <div className="absolute z-50 top-full left-0 right-0 w-full bg-popover shadow-md rounded-md border mt-1 overflow-hidden">
                        <div className="p-2 border-b">
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            placeholder={t("orders.search_customer_placeholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                          />
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto">
                          {filteredCustomers.length === 0 ? (
                            <div className="py-6 text-center">
                              <span className="material-icons mb-2 text-muted-foreground">search_off</span>
                              <p>{t("orders.no_matching_customer")}</p>
                              <p className="text-xs text-muted-foreground mt-1">{t("orders.try_different_search")}</p>
                            </div>
                          ) : (
                            <div className="p-1">
                              {filteredCustomers.map((customer) => (
                                <div
                                  key={customer.id}
                                  className={`py-3 px-3 cursor-pointer hover:bg-accent rounded-md ${
                                    field.value === customer.id ? 'bg-accent' : ''
                                  }`}
                                  onClick={() => {
                                    handleCustomerChange(customer.id);
                                    setOpen(false);
                                    setSearchQuery("");
                                  }}
                                >
                                  <div className="flex items-center">
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === customer.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col w-full">
                                      <div className="flex items-center justify-between">
                                        <span className="text-base font-medium" dir="auto">{customer.name}</span>
                                        {customer.code && (
                                          <span className="text-xs bg-muted px-2 py-1 rounded-md ml-2">#{customer.code}</span>
                                        )}
                                      </div>
                                      {customer.nameAr && (
                                        <div className="border-t mt-2 pt-1 border-dashed border-muted">
                                          <span className="text-sm block text-right" dir="rtl">{customer.nameAr}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                  <FormLabel>{t("orders.order_note")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("orders.order_note_placeholder")}
                      onChange={field.onChange}
                      value={field.value || ""}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Job Orders */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t("orders.add_products")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ customerProductId: 0, quantity: 0 })}
                  disabled={!selectedCustomerId}
                >
                  <span className="material-icons text-sm mr-1">add</span>
                  {t("orders.add_product")}
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
                              <FormLabel>{t("orders.product")}</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value.toString()}
                                disabled={productsLoading}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("orders.select_product")} />
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
                                        {category?.name} - {item?.name} {product.sizeCaption ? `(${product.sizeCaption})` : ''} {product.lengthCm ? `- ${product.lengthCm}cm` : ''}
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
                              <FormLabel>{t("orders.quantity")} (كجم)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder={t("orders.enter_quantity")}
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
                    <p>{t("orders.add_products_to_order")}</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-secondary-400 border border-dashed rounded-md">
                  <span className="material-icons text-3xl mb-2">person</span>
                  <p>{t("orders.select_customer_first")}</p>
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
              {t("orders.cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? t("orders.creating") : t("orders.create_order")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
