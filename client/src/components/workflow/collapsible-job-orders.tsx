import React, { useState } from "react";
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
import { AuthProvider } from "@/hooks/useAuth";
import { JobOrder, Roll, CustomerProduct, Customer, CreateRoll, Item, MasterBatch, Order } from "@shared/schema";
import { API_ENDPOINTS } from "@/lib/constants";
import { useTranslation } from "react-i18next";

export function CollapsibleJobOrdersForExtrusion() {
  const { t } = useTranslation();
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [isRollDialogOpen, setIsRollDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all job orders
  const { data: jobOrders = [], isLoading: jobOrdersLoading } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  // Fetch all customer products
  const { data: customerProducts = [], isLoading: customerProductsLoading } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  // Fetch all customers
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  // Fetch all orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });
  
  // Fetch all items
  const { data: items = [], isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
  });
  
  // Fetch all master batches
  const { data: masterBatches = [], isLoading: masterBatchesLoading } = useQuery<MasterBatch[]>({
    queryKey: [API_ENDPOINTS.MASTER_BATCHES],
  });

  // Fetch rolls by stage
  const { data: extrusionRolls = [] } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`],
  });
  
  const { data: printingRolls = [] } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/printing`],
  });
  
  const { data: cuttingRolls = [] } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/cutting`],
  });
  
  // Combine all rolls for tracking progress across stages
  const allRolls = [...extrusionRolls, ...printingRolls, ...cuttingRolls];

  // Mutation for creating a roll
  const createRollMutation = useMutation({
    mutationFn: (data: CreateRoll) => {
      return apiRequest("POST", API_ENDPOINTS.ROLLS, data);
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.JOB_ORDERS}/${variables.jobOrderId}/rolls`] });
      // Invalidate rolls in all stages to ensure proper progress calculation
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/printing`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ROLLS}/stage/cutting`] });
      
      // Show success toast
      toast({
        title: t("production.roll_management.roll_created"),
        description: t("production.roll_management.roll_created_successfully"),
        variant: "default",
      });
      
      // Update job order status if needed
      checkAndUpdateJobOrderStatus(variables.jobOrderId);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("production.roll_management.roll_creation_failed", { error }),
        variant: "destructive",
      });
    },
  });

  // Mutation for updating job order status
  const updateJobOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PUT", `${API_ENDPOINTS.JOB_ORDERS}/${id}`, { status });
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

  // Calculate the progress percentage for a job order based ONLY on extruding quantity
  const calculateProgress = (jobOrder: JobOrder): number => {
    // Use all rolls to get the complete picture of extrusion progress
    const jobOrderRolls = allRolls.filter(roll => roll.jobOrderId === jobOrder.id);
    if (!jobOrderRolls.length) return 0;
    
    // Calculate total extruded quantity from all rolls regardless of their stage
    const totalExtrudedQty = jobOrderRolls.reduce((total, roll) => total + (roll.extrudingQty || 0), 0);
    
    // Cap the percentage at 100%
    return Math.min(Math.round((totalExtrudedQty / jobOrder.quantity) * 100), 100);
  };

  // Check if job order is fully extruded based ONLY on extruding quantity
  const isJobOrderFullyExtruded = (jobOrder: JobOrder): boolean => {
    // Use all rolls to check if extrusion is complete
    const jobOrderRolls = allRolls.filter(roll => roll.jobOrderId === jobOrder.id);
    if (!jobOrderRolls.length) return false;
    
    // Sum only the extrudingQty values since that's what determines extrusion completion
    const totalExtrudedQty = jobOrderRolls.reduce((total, roll) => total + (roll.extrudingQty || 0), 0);
    
    // Job order is fully extruded if the extruded quantity meets or exceeds the required quantity
    return totalExtrudedQty >= jobOrder.quantity;
  };

  // Check and update job order status based on roll quantities
  const checkAndUpdateJobOrderStatus = (jobOrderId: number) => {
    const jobOrder = jobOrders.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return;

    // Get all rolls for this job order, regardless of their current stage
    const jobOrderRolls = allRolls.filter(roll => roll.jobOrderId === jobOrderId);
    if (!jobOrderRolls.length) return;
    
    // Calculate total extruded quantity ONLY based on the extrudingQty field
    const totalExtrudedQty = jobOrderRolls.reduce((total, roll) => total + (roll.extrudingQty || 0), 0);
    
    // If job order is fully extruded (based on extrudingQty), update status to extrusion_completed
    if (totalExtrudedQty >= jobOrder.quantity && jobOrder.status !== "extrusion_completed") {
      console.log(`Job order ${jobOrderId} extruded quantity (${totalExtrudedQty}) meets or exceeds required quantity (${jobOrder.quantity}). Marking as extrusion_completed.`);
      
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

    return t("common.unknown_customer");
  };

  // Get item name for a job order
  const getItemName = (jobOrder: JobOrder): string => {
    if (!customerProducts.length || !items.length) return t("common.loading");
    
    const product = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
    if (!product) return t("common.unknown_product");
    
    const item = items.find(i => i.id === product.itemId);
    return item ? item.name : t("common.unknown_item");
  };
  
  // Get thickness for a job order
  const getThickness = (jobOrder: JobOrder): string => {
    if (!customerProducts.length) return t("common.loading");
    
    const product = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
    if (!product) return t("common.unknown");
    
    return product.thickness ? `${product.thickness} μm` : t("common.not_available");
  };
  
  // Get raw material for a job order
  const getRawMaterial = (jobOrder: JobOrder): string => {
    if (!customerProducts.length) return t("common.loading");
    
    const product = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
    if (!product) return t("common.unknown");
    
    return product.rawMaterial || t("common.not_available");
  };
  
  // Get master batch name for a job order
  const getMasterBatchName = (jobOrder: JobOrder): string => {
    if (!customerProducts.length || !masterBatches.length) return t("common.loading");
    
    const product = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
    if (!product || !product.masterBatchId) return t("production.no_master_batch");
    
    const masterBatch = masterBatches.find(mb => mb.id === product.masterBatchId);
    return masterBatch ? masterBatch.name : t("production.unknown_master_batch");
  };
  
  // Get product details for a job order
  const getProductDetails = (jobOrder: JobOrder): string => {
    if (!customerProducts.length) return t("common.loading");
    
    const product = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
    if (!product) return t("common.unknown_product");
    
    return `${product.sizeCaption || ""} ${product.thickness ? product.thickness + 'μm' : ""}`;
  };

  // Filter job orders for the extrusion stage
  // Only show job orders for orders with status "processing" or "For Production"
  // Also, remove job orders that are already fully extruded (100% progress)
  const filteredJobOrders = jobOrders.filter(job => {
    // Only include pending and in_progress job orders 
    if (job.status !== "pending" && job.status !== "in_progress") {
      return false;
    }
    
    // Check if job order is already fully extruded
    const isFullyExtruded = isJobOrderFullyExtruded(job);
    
    // Don't show fully extruded job orders
    if (isFullyExtruded) {
      return false;
    }
    
    // Check the parent order status - only include orders with "processing" or "For Production" status
    const parentOrder = orders.find(order => order.id === job.orderId);
    if (!parentOrder) {
      return false;
    }
    
    return parentOrder.status === "processing" || parentOrder.status === "For Production";
  });

  // Group job orders by order ID
  const groupedJobOrders = filteredJobOrders.reduce((acc, job) => {
    const orderId = job.orderId;
    if (!acc[orderId]) {
      acc[orderId] = [];
    }
    acc[orderId].push(job);
    return acc;
  }, {} as Record<number, JobOrder[]>);

  // Sort the groups: first by order ID
  const sortedGroupKeys = Object.keys(groupedJobOrders)
    .map(Number)
    .sort((a, b) => a - b);

  if (jobOrdersLoading || customerProductsLoading || customersLoading || itemsLoading || masterBatchesLoading || ordersLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-secondary-100 h-40 rounded-lg"></div>
        <div className="animate-pulse bg-secondary-100 h-40 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Roll Creation Dialog */}
      <AuthProvider>
        {(user) => (
          <RollDialog
            open={isRollDialogOpen}
            onOpenChange={setIsRollDialogOpen}
            jobOrder={selectedJobOrder}
            onSubmit={handleRollDialogSubmit}
            isLoading={createRollMutation.isPending}
          />
        )}
      </AuthProvider>
      
      {filteredJobOrders.length === 0 ? (
        <Card className="bg-white border border-dashed border-secondary-200">
          <CardContent className="py-6 text-center">
            <span className="material-icons text-3xl text-secondary-400 mb-2">assignment</span>
            <p className="text-secondary-500">{t("production.roll_management.no_job_orders_extrusion")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedGroupKeys.map(orderId => {
            const orderJobOrders = groupedJobOrders[orderId];
            const parentOrder = orders.find(order => order.id === orderId);
            const customerName = parentOrder ? 
              (customers.find(c => c.id === parentOrder.customerId)?.name || t("common.unknown_customer")) :
              t("common.unknown_customer");
            
            return (
              <div key={orderId} className="border border-secondary-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div 
                  className={`bg-primary-50 px-4 py-3 border-b cursor-pointer hover:bg-primary-100 transition-colors ${expandedOrderIds.includes(orderId) ? 'border-b-primary-200' : 'border-b-transparent'}`}
                  onClick={() => {
                    setExpandedOrderIds(prev => 
                      prev.includes(orderId) 
                        ? prev.filter(id => id !== orderId)
                        : [...prev, orderId]
                    );
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="rounded-full bg-primary-600 p-1.5 mr-3">
                        <span className="material-icons text-xs text-white">receipt_long</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-primary-700">O #{orderId}</h4>
                        <p className="text-xs text-secondary-600 truncate max-w-[200px] sm:max-w-[300px]">{customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-primary-100 text-primary-700 hover:bg-primary-200 text-xs mr-2">{orderJobOrders.length} JO Counts</Badge>
                      <span className="material-icons text-primary-600 text-sm transition-transform duration-200" style={{ transform: expandedOrderIds.includes(orderId) ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
                
                {expandedOrderIds.includes(orderId) && (
                  <Accordion
                    type="multiple"
                    value={expandedOrders.map(String)}
                    className="divide-y divide-secondary-100"
                  >
                    {orderJobOrders.map((jobOrder) => {
                      const isExpanded = expandedOrders.includes(jobOrder.id);
                      const progressPercentage = calculateProgress(jobOrder);
                      const isComplete = isJobOrderFullyExtruded(jobOrder);
                      
                      // Only get rolls when the job order is expanded
                      const jobOrderRolls = isExpanded 
                        ? extrusionRolls.filter(roll => roll.jobOrderId === jobOrder.id)
                        : [];
                      
                      return (
                        <AccordionItem
                          key={jobOrder.id}
                          value={String(jobOrder.id)}
                          className="bg-white overflow-hidden"
                        >
                          <AccordionTrigger 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleExpandOrder(jobOrder.id);
                            }}
                            className="px-4 py-3 hover:bg-secondary-50"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-0">
                              <div className="flex items-center space-x-3">
                                <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                                  <span className="material-icons text-primary-600 text-sm sm:text-base">description</span>
                                </div>
                                <div className="text-left">
                                  <h4 className="font-medium text-sm sm:text-base">
                                    <span className="text-error-600">JO #{jobOrder.id}</span>
                                  </h4>
                                  <p className="text-xs sm:text-sm text-secondary-500 truncate max-w-[200px] sm:max-w-none">{getItemName(jobOrder)}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-start sm:space-x-3 mt-2 sm:mt-0">
                                <Badge variant={jobOrder.status === "pending" ? "outline" : "default"} className="text-xs py-0.5">
                                  {jobOrder.status === "pending" && t("status.pending")}
                                  {jobOrder.status === "in_progress" && t("status.in_progress")}
                                  {jobOrder.status === "extrusion_completed" && t("status.extrusion_completed")}
                                  {jobOrder.status === "completed" && t("status.completed")}
                                  {jobOrder.status === "cancelled" && t("status.cancelled")}
                                </Badge>
                                <div className="text-right">
                                  <span className="text-xs sm:text-sm font-medium">
                                    {progressPercentage}% {t("common.complete")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          
                          <AccordionContent className="p-0">
                            <div className="px-4 py-3 bg-secondary-50">
                              <div className="flex justify-between items-center mb-2">
                                <h5 className="font-medium">{t("common.details")}</h5>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                                <div>
                                  <p className="text-xs sm:text-sm text-secondary-500">{t("items.item_name")}</p>
                                  <p className="font-medium text-sm">{getItemName(jobOrder)}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm text-secondary-500">{t("orders.required_quantity")}</p>
                                  <p className="font-medium text-sm">{jobOrder.quantity} kg</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm text-secondary-500">{t("products.thickness")}</p>
                                  <p className="font-medium text-sm">{getThickness(jobOrder)}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm text-secondary-500">{t("products.raw_material")}</p>
                                  <p className="font-medium text-sm">{getRawMaterial(jobOrder)}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm text-secondary-500">{t("products.master_batch")}</p>
                                  <p className="font-medium text-sm truncate">{getMasterBatchName(jobOrder)}</p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm text-secondary-500">{t("products.product_details")}</p>
                                  <p className="font-medium text-sm truncate">{getProductDetails(jobOrder)}</p>
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{t("common.progress")}</span>
                                  <span>{progressPercentage}%</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                              </div>
                              
                              <Separator className="my-4" />
                              
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">{t("production.roll_management.rolls")}</h5>
                                {!isExpanded ? (
                                  <p className="text-sm text-secondary-500 py-2">{t("production.roll_management.expand_to_view_rolls")}</p>
                                ) : jobOrderRolls.length === 0 ? (
                                  <p className="text-sm text-secondary-500 py-2">{t("production.roll_management.no_rolls_created")}</p>
                                ) : (
                                  <div className="space-y-2">
                                    {jobOrderRolls.map((roll) => (
                                      <div 
                                        key={roll.id} 
                                        className="bg-white p-3 rounded-lg border border-secondary-200 flex justify-between items-center"
                                      >
                                        <div>
                                          <p className="font-medium">{roll.id}</p>
                                          <p className="text-sm text-secondary-500">
                                            {t("production.roll_management.quantity")}: {roll.extrudingQty} kg
                                          </p>
                                        </div>
                                        <Badge variant={
                                          roll.status === "pending" ? "outline" : 
                                          roll.status === "processing" ? "secondary" : 
                                          "default"
                                        }>
                                          {t(`status.${roll.status}`)}
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
                                  className="flex items-center text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3 h-auto"
                                  size="sm"
                                >
                                  <span className="material-icons text-xs sm:text-sm mr-1">add</span>
                                  {t("production.roll_management.create_roll")}
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
          })}
        </div>
      )}
    </div>
  );
}