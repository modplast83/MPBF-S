import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define the form schema
const formSchema = z.object({
  machines: z.array(z.string()).min(1, "Select at least one machine"),
  orders: z.array(z.number()).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MixingProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId?: number;
  onSuccess: () => void;
}

export default function MixingProcessDialog({
  open,
  onOpenChange,
  processId,
  onSuccess,
}: MixingProcessDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!processId;
  
  // For machine selection
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  // For order selection
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  // Fetch existing process for edit mode
  const {
    data: existingProcess,
    isLoading: isExistingProcessLoading,
  } = useQuery({
    queryKey: [`/api/mixing-processes/${processId}`],
    enabled: isEditMode && open,
  });

  // Fetch machines from extrusion section only
  const { data: machines, isLoading: isMachinesLoading } = useQuery({
    queryKey: ["/api/machines"],
    enabled: open,
    select: (machines) => 
      machines?.filter((machine) => machine.sectionId === "SEC001") || [] // Only Extrusion section
  });

  // Fetch active orders for the dropdown
  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: open,
    select: (orders) => 
      orders?.filter((order) => order.status !== "completed" && order.status !== "cancelled") || []
  });

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machines: [],
      orders: [],
      notes: "",
    },
  });

  // Set form values when editing an existing process
  useEffect(() => {
    if (isEditMode && existingProcess) {
      // Fetch associated machines and orders for this process
      const fetchRelatedData = async () => {
        try {
          const machinesRes = await fetch(`/api/mixing-processes/${processId}/machines`);
          const ordersRes = await fetch(`/api/mixing-processes/${processId}/orders`);
          
          if (machinesRes.ok && ordersRes.ok) {
            const machineData = await machinesRes.json();
            const orderData = await ordersRes.json();
            
            const machineIds = machineData.map((m: any) => m.machineId);
            const orderIds = orderData.map((o: any) => o.orderId);
            
            setSelectedMachines(machineIds);
            setSelectedOrders(orderIds);
            
            form.reset({
              machines: machineIds,
              orders: orderIds,
              notes: existingProcess.notes || "",
            });
          }
        } catch (error) {
          console.error("Failed to fetch related data:", error);
        }
      };
      
      fetchRelatedData();
    }
  }, [isEditMode, existingProcess, form, processId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset({
        machines: [],
        orders: [],
        notes: "",
      });
      setSelectedMachines([]);
      setSelectedOrders([]);
    }
  }, [open, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Add the current user ID
      const processData = {
        notes: data.notes,
      };
      
      const res = await apiRequest("POST", "/api/mixing-processes", processData);
      const processResult = await res.json();
      
      // Now add machines and orders associations
      if (processResult.id) {
        // Add machines
        for (const machineId of data.machines) {
          await apiRequest("POST", `/api/mixing-processes/${processResult.id}/machines`, { machineId });
        }
        
        // Add orders if any
        if (data.orders && data.orders.length > 0) {
          for (const orderId of data.orders) {
            await apiRequest("POST", `/api/mixing-processes/${processResult.id}/orders`, { orderId });
          }
        }
      }
      
      return processResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mixing-processes"] });
      toast({
        title: "Success",
        description: "Mixing process created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create mixing process",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // First update the basic process info
      const processData = {
        notes: data.notes,
      };
      
      await apiRequest("PUT", `/api/mixing-processes/${processId}`, processData);
      
      // Remove all existing machine associations and add new ones
      await apiRequest("DELETE", `/api/mixing-processes/${processId}/machines/all`);
      for (const machineId of data.machines) {
        await apiRequest("POST", `/api/mixing-processes/${processId}/machines`, { machineId });
      }
      
      // Remove all existing order associations and add new ones
      await apiRequest("DELETE", `/api/mixing-processes/${processId}/orders/all`);
      if (data.orders && data.orders.length > 0) {
        for (const orderId of data.orders) {
          await apiRequest("POST", `/api/mixing-processes/${processId}/orders`, { orderId });
        }
      }
      
      return { id: processId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mixing-processes"] });
      queryClient.invalidateQueries({ queryKey: [`/api/mixing-processes/${processId}`] });
      toast({
        title: "Success",
        description: "Mixing process updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update mixing process",
        variant: "destructive",
      });
    },
  });

  // Toggle machine selection
  const toggleMachine = (machineId: string) => {
    setSelectedMachines(prev => {
      if (prev.includes(machineId)) {
        const newSelection = prev.filter(id => id !== machineId);
        form.setValue("machines", newSelection);
        return newSelection;
      } else {
        const newSelection = [...prev, machineId];
        form.setValue("machines", newSelection);
        return newSelection;
      }
    });
  };

  // Toggle order selection
  const toggleOrder = (orderId: number) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        const newSelection = prev.filter(id => id !== orderId);
        form.setValue("orders", newSelection.length ? newSelection : []);
        return newSelection;
      } else {
        const newSelection = [...prev, orderId];
        form.setValue("orders", newSelection);
        return newSelection;
      }
    });
  };

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading =
    isExistingProcessLoading ||
    isMachinesLoading ||
    isOrdersLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Mixing Process" : "New Mixing Process"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of this mixing process"
              : "Create a new material mixing process"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* User info (read-only) */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium">Mixed By</h3>
              <p className="text-sm text-muted-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">The process will be associated with your account</p>
            </div>
            
            {/* Machine selection */}
            <FormField
              control={form.control}
              name="machines"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-1.5">
                    <FormLabel>Machines (Extrusion Section)</FormLabel>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {machines?.map((machine) => (
                        <div 
                          key={machine.id}
                          className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-accent"
                          onClick={() => toggleMachine(machine.id)}
                        >
                          <Checkbox 
                            checked={selectedMachines.includes(machine.id)}
                            onCheckedChange={() => toggleMachine(machine.id)}
                          />
                          <span className="text-sm">{machine.name}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedMachines.map(machineId => {
                        const machine = machines?.find(m => m.id === machineId);
                        return (
                          <Badge key={machineId} variant="secondary" className="gap-1">
                            {machine?.name}
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMachine(machineId);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    
                    <FormDescription>
                      Select one or more machines from the Extrusion section
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Order selection */}
            <FormField
              control={form.control}
              name="orders"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-1.5">
                    <FormLabel>Orders (Optional)</FormLabel>
                    
                    <ScrollArea className="h-40 border rounded-md p-2">
                      <div className="space-y-2">
                        {orders?.map((order) => (
                          <div 
                            key={order.id}
                            className="flex items-center space-x-2 p-1 rounded-md cursor-pointer hover:bg-accent"
                            onClick={() => toggleOrder(order.id)}
                          >
                            <Checkbox 
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={() => toggleOrder(order.id)}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm">Order #{order.id}</span>
                              <span className="text-xs text-muted-foreground">
                                Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {orders?.length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">No active orders available</p>
                        )}
                      </div>
                    </ScrollArea>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedOrders.map(orderId => {
                        return (
                          <Badge key={orderId} variant="secondary" className="gap-1">
                            Order #{orderId}
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrder(orderId);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    
                    <FormDescription>
                      Select one or more orders that this mixing process is for (optional)
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Notes field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any additional information about this mixing process
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}