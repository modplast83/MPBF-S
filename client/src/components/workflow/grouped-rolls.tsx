import { useState } from "react";
import { Roll, JobOrder, CustomerProduct, Customer, Item, Order } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { RollCard } from "@/components/workflow/roll-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface GroupedRollsProps {
  rolls: Roll[];
  stage: 'printing' | 'cutting';
}

export function GroupedRolls({ rolls, stage }: GroupedRollsProps) {
  const { t } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);

  // Fetch customer products to get more details
  const { data: customerProducts = [] } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  // Fetch job orders
  const { data: jobOrders = [] } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  // Fetch orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  // Fetch items
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
  });

  // Toggle expanded state for a group
  const toggleExpandGroup = (jobOrderId: number) => {
    setExpandedGroups(prevState => 
      prevState.includes(jobOrderId)
        ? prevState.filter(id => id !== jobOrderId)
        : [...prevState, jobOrderId]
    );
  };
  
  // Toggle expanded state for an order
  const toggleExpandOrder = (orderId: number) => {
    setExpandedOrderIds(prevState => 
      prevState.includes(orderId)
        ? prevState.filter(id => id !== orderId)
        : [...prevState, orderId]
    );
  };

  // Get customer for a job order
  const getCustomer = (jobOrderId: number): Customer | undefined => {
    const jobOrder = jobOrders.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return undefined;

    // First check if customerId is directly on the job order
    if (jobOrder.customerId && customers) {
      const customer = customers.find(c => c.id === jobOrder.customerId);
      if (customer) return customer;
    }

    // Otherwise, try to get customer through customer product relation
    if (customerProducts && customers) {
      const customerProduct = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
      if (customerProduct) {
        const customer = customers.find(c => c.id === customerProduct.customerId);
        if (customer) return customer;
      }
    }

    return undefined;
  };
  
  // Get customer name for a job order
  const getCustomerName = (jobOrderId: number): string => {
    const customer = getCustomer(jobOrderId);
    return customer ? customer.name : t("common.unknown_customer");
  };
  
  // Get customer Arabic name for a job order
  const getCustomerNameAr = (jobOrderId: number): string => {
    const customer = getCustomer(jobOrderId);
    return customer?.nameAr || "";
  };

  // Get product details for a job order
  const getProductDetails = (jobOrderId: number): string => {
    const jobOrder = jobOrders.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return t("common.unknown_product");
    
    if (!customerProducts.length) return t("common.loading");
    
    const product = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
    if (!product) return t("common.unknown_product");
    
    const item = items.find(i => i.id === product.itemId);
    const itemName = item ? item.name : '';
    
    return `${itemName} ${product.sizeCaption || ""} ${product.thickness ? product.thickness + 'μm' : ""}`;
  };

  // Group rolls by job order ID first
  const groupedRolls = rolls.reduce((acc, roll) => {
    const jobOrderId = roll.jobOrderId;
    if (!acc[jobOrderId]) {
      acc[jobOrderId] = [];
    }
    acc[jobOrderId].push(roll);
    return acc;
  }, {} as { [key: number]: Roll[] });

  // Convert to array for mapping
  let groupArray = Object.entries(groupedRolls).map(([jobOrderId, rolls]) => ({
    jobOrderId: parseInt(jobOrderId, 10),
    rolls
  }));

  // Filter out job orders based on stage requirements
  groupArray = groupArray.filter(({ jobOrderId, rolls }) => {
    // For printing stage: don't display job order if all rolls are completed for printing
    if (stage === 'printing') {
      // Check if all rolls have printing completed
      const allPrintingCompleted = rolls.every(roll => 
        roll.currentStage !== 'printing' || roll.status === 'completed'
      );
      // Only keep job orders that still have printing work to do
      return !allPrintingCompleted;
    }
    
    // For cutting stage: don't display job order if all rolls are completed for cutting
    if (stage === 'cutting') {
      // Check if all rolls have cutting completed
      const allCuttingCompleted = rolls.every(roll => 
        roll.currentStage !== 'cutting' || roll.status === 'completed'
      );
      // Only keep job orders that still have cutting work to do
      return !allCuttingCompleted;
    }
    
    return true;
  });

  // Now group job orders by order ID (similar to extrusion stage)
  const jobOrdersByOrder: Record<number, { 
    orderId: number, 
    jobOrders: { jobOrderId: number, rolls: Roll[] }[]
  }> = {};

  // Group job orders by order ID
  groupArray.forEach(jobOrderGroup => {
    const jobOrder = jobOrders.find(jo => jo.id === jobOrderGroup.jobOrderId);
    if (jobOrder) {
      const orderId = jobOrder.orderId;
      if (!jobOrdersByOrder[orderId]) {
        jobOrdersByOrder[orderId] = {
          orderId,
          jobOrders: []
        };
      }
      jobOrdersByOrder[orderId].jobOrders.push(jobOrderGroup);
    }
  });

  // Convert to array for rendering
  const orderGroups = Object.values(jobOrdersByOrder);
  
  // Sort by order ID
  orderGroups.sort((a, b) => a.orderId - b.orderId);

  if (orderGroups.length === 0) {
    return (
      <div className="py-6 text-center text-secondary-400 bg-white rounded-lg border border-dashed border-secondary-200">
        <span className="material-icons text-3xl mb-2">hourglass_empty</span>
        <p className="text-sm">{t(`production.roll_management.no_rolls_${stage}`)}</p>
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      value={expandedOrderIds.map(String)}
      className="space-y-3"
    >
      {orderGroups.map(({ orderId, jobOrders }) => {
        const isExpanded = expandedOrderIds.includes(orderId);
        const order = orders.find(o => o.id === orderId);
        const customer = order ? customers.find(c => c.id === order.customerId) : undefined;
        const totalRolls = jobOrders.reduce((acc, jo) => acc + jo.rolls.length, 0);
        
        return (
          <AccordionItem
            key={orderId}
            value={String(orderId)}
            className="bg-white rounded-lg border border-secondary-200 overflow-hidden"
          >
            <AccordionTrigger 
              onClick={(e) => {
                e.preventDefault();
                toggleExpandOrder(orderId);
              }}
              className="px-4 py-3 hover:bg-secondary-50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-0">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <span className="material-icons text-primary-600 text-sm sm:text-base">inventory_2</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-sm sm:text-base">
                      <span className="text-primary-600">Order #{orderId}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {jobOrders.length} JO{jobOrders.length > 1 ? 's' : ''}
                      </Badge>
                    </h4>
                    <p className="text-xs sm:text-sm text-secondary-500 truncate max-w-[200px] sm:max-w-none">
                      {customer?.name}
                      {customer?.nameAr && 
                        <span className="mr-1 pr-1 font-semibold"> - {customer?.nameAr}</span>
                      }
                    </p>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-secondary-500">
                  <p>Total Rolls: {totalRolls}</p>
                  <p>Date: {order?.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="py-2 px-4">
              <Accordion
                type="multiple"
                value={expandedGroups.map(String)}
                className="space-y-2"
              >
                {jobOrders.map(({ jobOrderId, rolls }) => {
                  const isJoExpanded = expandedGroups.includes(jobOrderId);
                  
                  return (
                    <AccordionItem
                      key={jobOrderId}
                      value={String(jobOrderId)}
                      className="bg-white rounded-lg border border-secondary-100 overflow-hidden"
                    >
                      <AccordionTrigger 
                        onClick={(e) => {
                          e.preventDefault();
                          toggleExpandGroup(jobOrderId);
                        }}
                        className="px-3 py-2 hover:bg-secondary-50"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-0">
                          <div className="flex items-center space-x-2">
                            <div className="flex h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary-100">
                              <span className="material-icons text-secondary-600 text-xs sm:text-sm">description</span>
                            </div>
                            <div className="text-left">
                              <h5 className="font-medium text-xs sm:text-sm">
                                <span className="text-error-600">JO #{jobOrderId}</span>
                              </h5>
                              <p className="text-xs text-secondary-500 truncate max-w-[180px] sm:max-w-none">
                                {getProductDetails(jobOrderId)}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-secondary-500">
                            <p className="text-right">Roll Count: {rolls.length}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 px-3">
                        <div className="space-y-2 pt-1">
                          {rolls
                            .filter(roll => stage === "cutting" ? roll.status !== "completed" : true)
                            .sort((a, b) => a.id.localeCompare(b.id))
                            .map(roll => (
                              <RollCard key={roll.id} roll={roll} />
                            ))
                          }
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}