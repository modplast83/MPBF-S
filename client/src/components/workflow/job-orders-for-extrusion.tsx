import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RollDialog } from "@/components/workflow/roll-dialog";
import { JobOrder, Roll, CustomerProduct, Customer, CreateRoll } from "@shared/schema";
import { API_ENDPOINTS } from "@/lib/constants";

export function JobOrdersForExtrusion() {
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [isRollDialogOpen, setIsRollDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all job orders
  const { data: jobOrders, isLoading: jobOrdersLoading } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  // Fetch all customer products
  const { data: customerProducts, isLoading: customerProductsLoading } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  // Fetch all customers
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  // Hooks must be called at the top level, not in a function
  // For each job order, create a separate query
  const rollsQueries = useMemo(() => {
    if (!jobOrders) return {};
    
    return jobOrders.reduce<Record<number, ReturnType<typeof useQuery<Roll[]>>>>(
      (acc, jobOrder) => {
        acc[jobOrder.id] = useQuery<Roll[]>({
          queryKey: [`${API_ENDPOINTS.JOB_ORDERS}/${jobOrder.id}/rolls`],
          enabled: expandedOrders.includes(jobOrder.id),
        });
        return acc;
      },
      {}
    );
  }, [jobOrders, expandedOrders]);

  // Mutation for creating a roll
  const createRollMutation = useMutation({
    mutationFn: (data: CreateRoll) => {
      return apiRequest(API_ENDPOINTS.ROLLS, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.JOB_ORDERS}/${variables.jobOrderId}/rolls`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`] });
      
      // Show success toast
      toast({
        title: "Roll created",
        description: "Roll has been created successfully",
        variant: "default",
      });
      
      // Update job order status if needed
      checkAndUpdateJobOrderStatus(variables.jobOrderId);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create roll: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating job order status
  const updateJobOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`${API_ENDPOINTS.JOB_ORDERS}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.JOB_ORDERS] });
    },
  });

  // Toggle the expanded state of a job order
  const toggleExpandOrder = (jobOrderId: number) => {
    setExpandedOrders(prevState => 
      prevState.includes(jobOrderId)
        ? prevState.filter(id => id !== jobOrderId)
        : [...prevState, jobOrderId]
    );
  };

  // Handle creating a new roll for a job order
  const handleCreateRoll = (jobOrder: JobOrder) => {
    setSelectedJobOrder(jobOrder);
    setIsRollDialogOpen(true);
  };
  
  // Handle roll dialog submission
  const handleRollDialogSubmit = (data: CreateRoll) => {
    createRollMutation.mutate(data);
    setIsRollDialogOpen(false);
    
    // Update job order status to in_progress if it's pending
    if (selectedJobOrder && selectedJobOrder.status === "pending") {
      updateJobOrderStatusMutation.mutate({
        id: selectedJobOrder.id,
        status: "in_progress",
      });
    }
  };

  // Check if all rolls for a job order meet the total quantity requirement
  const isJobOrderFullyExtruded = (jobOrder: JobOrder): boolean => {
    const query = rollsQueries[jobOrder.id];
    if (!query || !query.data || query.data.length === 0) return false;
    
    const totalExtrudedQty = query.data.reduce((total, roll) => total + (roll.extrudingQty || 0), 0);
    return totalExtrudedQty >= jobOrder.quantity;
  };

  // Calculate the progress percentage for a job order
  const calculateProgress = (jobOrder: JobOrder): number => {
    const query = rollsQueries[jobOrder.id];
    if (!query || !query.data || query.data.length === 0) return 0;
    
    const totalExtrudedQty = query.data.reduce((total, roll) => total + (roll.extrudingQty || 0), 0);
    return Math.min(Math.round((totalExtrudedQty / jobOrder.quantity) * 100), 100);
  };

  // Check and update job order status based on roll quantities
  const checkAndUpdateJobOrderStatus = (jobOrderId: number) => {
    const jobOrder = jobOrders?.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return;

    const query = rollsQueries[jobOrderId];
    if (!query || !query.data || query.data.length === 0) return;
    
    const totalExtrudedQty = query.data.reduce((total, roll) => total + (roll.extrudingQty || 0), 0);
    
    // If job order is fully extruded, update status
    if (totalExtrudedQty >= jobOrder.quantity && jobOrder.status !== "extrusion_completed") {
      updateJobOrderStatusMutation.mutate({
        id: jobOrderId,
        status: "extrusion_completed",
      });
    }
  };

  // Get customer name for a job order
  const getCustomerName = (jobOrder: JobOrder): string => {
    // First check if customerId is directly on the job order
    if (jobOrder.customerId && customers) {
      const customer = customers.find(c => c.id === jobOrder.customerId);
      if (customer) return customer.name;
    }

    // Otherwise, try to get customer through customer product relation
    if (customerProducts && customers) {
      const customerProduct = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
      if (customerProduct) {
        const customer = customers.find(c => c.id === customerProduct.customerId);
        if (customer) return customer.name;
      }
    }

    return "Unknown Customer";
  };

  // Get product details for a job order
  const getProductDetails = (jobOrder: JobOrder): string => {
    if (!customerProducts) return "Loading...";
    
    const product = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
    if (!product) return "Unknown Product";
    
    return `${product.sizeCaption || ""} ${product.thickness ? product.thickness + 'μm' : ""}`;
  };

  // Filter job orders for the extrusion stage (pending or in_progress)
  const getJobOrdersForExtrusion = (): JobOrder[] => {
    if (!jobOrders) return [];
    
    return jobOrders.filter(job => 
      job.status === "pending" || 
      job.status === "in_progress"
    );
  };

  if (jobOrdersLoading || customerProductsLoading || customersLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-secondary-100 h-40 rounded-lg"></div>
        <div className="animate-pulse bg-secondary-100 h-40 rounded-lg"></div>
      </div>
    );
  }

  const jobOrdersForExtrusion = getJobOrdersForExtrusion();

  return (
    <div className="space-y-4">
      {/* Roll Creation Dialog */}
      <RollDialog
        open={isRollDialogOpen}
        onOpenChange={setIsRollDialogOpen}
        jobOrder={selectedJobOrder}
        onSubmit={handleRollDialogSubmit}
        isLoading={createRollMutation.isPending}
      />
      
      {jobOrdersForExtrusion.length === 0 ? (
        <Card className="bg-white border border-dashed border-secondary-200">
          <CardContent className="py-6 text-center">
            <span className="material-icons text-3xl text-secondary-400 mb-2">assignment</span>
            <p className="text-secondary-500">No active job orders for extrusion</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="multiple"
          value={expandedOrders.map(String)}
          className="space-y-3"
        >
          {jobOrdersForExtrusion.map((jobOrder) => {
            const query = rollsQueries[jobOrder.id] || { data: [], isLoading: false };
            const { data: rolls = [], isLoading: rollsLoading } = query;
            const isExpanded = expandedOrders.includes(jobOrder.id);
            const progressPercentage = calculateProgress(jobOrder);
            const isComplete = isJobOrderFullyExtruded(jobOrder);
            
            return (
              <AccordionItem
                key={jobOrder.id}
                value={String(jobOrder.id)}
                className="bg-white rounded-lg border border-secondary-200 overflow-hidden"
              >
                <AccordionTrigger 
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpandOrder(jobOrder.id);
                  }}
                  className="px-4 py-3 hover:bg-secondary-50"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                        <span className="material-icons text-primary-600">description</span>
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium">Job Order #{jobOrder.id}</h4>
                        <p className="text-sm text-secondary-500">{getCustomerName(jobOrder)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={jobOrder.status === "pending" ? "outline" : "default"}>
                        {jobOrder.status === "pending" && "Pending"}
                        {jobOrder.status === "in_progress" && "In Progress"}
                        {jobOrder.status === "extrusion_completed" && "Extrusion Completed"}
                        {jobOrder.status === "completed" && "Completed"}
                        {jobOrder.status === "cancelled" && "Cancelled"}
                      </Badge>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {progressPercentage}% Complete
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="p-0">
                  <div className="px-4 py-3 bg-secondary-50">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium">Details</h5>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-secondary-500">Product</p>
                        <p className="font-medium">{getProductDetails(jobOrder)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Required Quantity</p>
                        <p className="font-medium">{jobOrder.quantity} kg</p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="mb-4">
                      <h5 className="font-medium mb-2">Rolls</h5>
                      {rollsLoading ? (
                        <div className="animate-pulse bg-white h-20 rounded-lg"></div>
                      ) : !rolls || rolls.length === 0 ? (
                        <p className="text-sm text-secondary-500 py-2">No rolls created yet</p>
                      ) : (
                        <div className="space-y-2">
                          {rolls.map((roll) => (
                            <div 
                              key={roll.id} 
                              className="bg-white p-3 rounded-lg border border-secondary-200 flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium">{roll.id}</p>
                                <p className="text-sm text-secondary-500">
                                  Quantity: {roll.extrudingQty} kg
                                </p>
                              </div>
                              <Badge variant={
                                roll.status === "pending" ? "outline" : 
                                roll.status === "processing" ? "secondary" : 
                                "default"
                              }>
                                {roll.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleCreateRoll(jobOrder)}
                        disabled={isComplete || createRollMutation.isPending}
                        className="flex items-center"
                      >
                        <span className="material-icons text-sm mr-1">add</span>
                        Create Roll
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}