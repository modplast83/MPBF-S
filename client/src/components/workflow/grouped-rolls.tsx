import { useState } from "react";
import { Roll, JobOrder, CustomerProduct, Customer, Item } from "@shared/schema";
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

interface GroupedRollsProps {
  rolls: Roll[];
  stage: 'printing' | 'cutting';
}

export function GroupedRolls({ rolls, stage }: GroupedRollsProps) {
  const { t } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);

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

  // Group rolls by job order ID
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

  // Sort by job order ID
  groupArray.sort((a, b) => a.jobOrderId - b.jobOrderId);

  if (groupArray.length === 0) {
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
      value={expandedGroups.map(String)}
      className="space-y-3"
    >
      {groupArray.map(({ jobOrderId, rolls }) => {
        const isExpanded = expandedGroups.includes(jobOrderId);
        
        return (
          <AccordionItem
            key={jobOrderId}
            value={String(jobOrderId)}
            className="bg-white rounded-lg border border-secondary-200 overflow-hidden"
          >
            <AccordionTrigger 
              onClick={(e) => {
                e.preventDefault();
                toggleExpandGroup(jobOrderId);
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
                      <span className="text-error-600">JO #{jobOrderId}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-secondary-500 truncate max-w-[200px] sm:max-w-none">
                      {getCustomerName(jobOrderId)}
                      {getCustomerNameAr(jobOrderId) && 
                        <span className="mr-1 pr-1"> - {getCustomerNameAr(jobOrderId)}</span>
                      }
                    </p>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-secondary-500 truncate">
                  <p>{getProductDetails(jobOrderId)}</p>
                  <p className="text-right">Roll Count: {rolls.length}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 px-4">
              <div className="space-y-3 pt-2">
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
  );
}