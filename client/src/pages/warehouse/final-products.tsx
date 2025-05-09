import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString, formatNumber } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { JobOrder, CustomerProduct, Order, Customer, Roll, Item } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

export default function FinalProducts() {
  const queryClient = useQueryClient();
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [finishedQty, setFinishedQty] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  
  // Fetch job orders data
  const { data: jobOrders = [], isLoading: isJobOrdersLoading } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  const { data: customerProducts = [] } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
  });
  
  // Fetch all rolls to calculate cutting quantities
  const { data: rolls = [] } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });

  // Update job order mutation
  const updateJobOrderMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; finishedQty: number }) => {
      await apiRequest("PUT", `${API_ENDPOINTS.JOB_ORDERS}/${data.id}`, {
        status: data.status,
        finishedQty: data.finishedQty
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.JOB_ORDERS] });
      toast({
        title: "Product Received",
        description: "The job order has been successfully received into warehouse.",
      });
      handleCloseReceiveDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update job order status: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Check job orders and filter to show only ones with relevant statuses
  useEffect(() => {
    if (jobOrders && jobOrders.length > 0) {
      // Log available statuses for debugging
      const statusMap: Record<string, boolean> = {};
      jobOrders.forEach(jo => {
        if (jo.status) {
          statusMap[jo.status] = true;
        }
      });
      console.log("Available job order statuses:", Object.keys(statusMap));
    }
  }, [jobOrders]);

  // Filter job orders with completed status values including "completed", "received", etc.
  const completedJobOrders = React.useMemo(() => {
    if (!jobOrders || jobOrders.length === 0) return [];
    
    return jobOrders.filter(jo => 
      jo.status === "completed" || 
      jo.status === "received" || 
      jo.status === "extrusion_completed" ||
      jo.status === "in_progress"
    );
  }, [jobOrders]);

  const handleReceiveJobOrder = (jobOrder: JobOrder) => {
    setSelectedJobOrder(jobOrder);
    // Get total cutting quantity for this job order
    const totalCutQty = getTotalCuttingQty(jobOrder.id);
    setFinishedQty(totalCutQty);
    setReceiveDialogOpen(true);
  };

  const handleSubmitReceive = () => {
    if (!selectedJobOrder) return;
    
    if (finishedQty <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid finished quantity.",
        variant: "destructive",
      });
      return;
    }

    updateJobOrderMutation.mutate({
      id: selectedJobOrder.id,
      status: "received",
      finishedQty: finishedQty
    });
  };

  const handleCloseReceiveDialog = () => {
    setReceiveDialogOpen(false);
    setSelectedJobOrder(null);
    setFinishedQty(0);
    setNotes("");
  };

  // Helper functions
  const getTotalCuttingQty = (jobOrderId: number): number => {
    // Calculate total cut quantity from all completed rolls for this job order
    const jobOrderRolls = rolls.filter(roll => 
      roll.jobOrderId === jobOrderId && 
      roll.currentStage === "cutting" && 
      roll.status === "completed"
    );
    return jobOrderRolls.reduce((total, roll) => total + (roll.cuttingQty || 0), 0);
  };
  
  const getJobOrderDetails = (jobOrderId: number) => {
    const jobOrder = jobOrders?.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return { 
      orderNumber: "Unknown", 
      productName: "Unknown", 
      customer: "Unknown",
      totalCutQty: 0,
      finishedQty: 0,
      totalRequiredQty: 0,
      completionPercentage: 0
    };
    
    const order = orders?.find(o => o.id === jobOrder.orderId);
    const product = customerProducts?.find(cp => cp.id === jobOrder.customerProductId);
    const customer = order ? customers?.find(c => c.id === order.customerId) : null;
    
    // Get the actual item name from the items collection
    let itemName = "Unknown";
    if (product && product.itemId) {
      const item = items.find(i => i.id === product.itemId);
      if (item) {
        itemName = item.name;
      }
    }
    
    // Calculate total cut quantity
    const totalCutQty = getTotalCuttingQty(jobOrderId);
    
    // Get finished quantity from job order or calculate it
    const finishedQty = jobOrder.finishedQty || 0;
    
    // Calculate completion percentage
    const totalRequiredQty = jobOrder.quantity || 0;
    const completionPercentage = totalRequiredQty > 0 
      ? Math.min(100, Math.round((totalCutQty / totalRequiredQty) * 100)) 
      : 0;
    
    return {
      orderNumber: order?.id.toString() || "Unknown",
      productName: itemName,
      customer: customer?.name || "Unknown",
      totalCutQty: totalCutQty,
      finishedQty: finishedQty,
      totalRequiredQty: totalRequiredQty,
      completionPercentage: completionPercentage
    };
  };

  // Define column types for job orders
  type JobOrderColumnDef = {
    header: string;
    accessorKey?: keyof JobOrder;
    cell?: (row: JobOrder) => React.ReactNode;
  };

  // Create columns definition for job orders table
  const columns: JobOrderColumnDef[] = [
    {
      header: t('job_orders.title'),
      accessorKey: "id",
      cell: (row) => `JO #${row.id}`,
    },
    {
      header: t('orders.title'),
      accessorKey: "orderId",
      cell: (row) => `#${row.orderId}`,
    },
    {
      header: t('setup.customers.title'),
      cell: (row) => {
        const details = getJobOrderDetails(row.id);
        return details.customer;
      },
    },
    {
      header: t('orders.product'),
      cell: (row) => {
        const details = getJobOrderDetails(row.id);
        return details.productName;
      },
    },
    {
      header: t('warehouse.quantity') + " (Kg)",
      accessorKey: "quantity",
      cell: (row) => formatNumber(row.quantity)
    },
    {
      header: t('warehouse.finished_qty') + " (Kg)",
      cell: (row) => {
        if (row.status === "received") {
          return formatNumber(row.finishedQty || 0);
        } else {
          const details = getJobOrderDetails(row.id);
          return formatNumber(details.totalCutQty);
        }
      }
    },
    {
      header: t('common.completion'),
      cell: (row) => {
        const details = getJobOrderDetails(row.id);
        return (
          <div className="w-full flex items-center gap-2">
            <Progress value={details.completionPercentage} className="h-2" />
            <span className="text-xs whitespace-nowrap">
              {details.completionPercentage}%
            </span>
          </div>
        );
      }
    },
    {
      header: t('common.status'),
      accessorKey: "status",
      cell: (row) => {
        // Custom status badge with appropriate color based on status
        let variant: "default" | "outline" | "secondary" | "destructive" | "success" | "warning" = "default";
        let statusText = row.status?.replace(/_/g, ' ') || '';
        
        // Map statuses to appropriate variant colors
        if (row.status === "pending") variant = "secondary";
        if (row.status === "in_progress") variant = "warning";
        if (row.status === "extrusion_completed") variant = "warning";
        if (row.status === "printing_completed") variant = "warning";
        if (row.status === "cutting_completed") variant = "warning";
        if (row.status === "completed") variant = "warning";
        if (row.status === "received") variant = "success";
        
        return (
          <Badge variant={variant} className="capitalize whitespace-nowrap">
            {statusText}
          </Badge>
        );
      }
    },
    {
      header: t('common.actions'),
      cell: (row) => (
        <div className={`flex ${isRTL ? "space-x-reverse" : "space-x-2"}`}>
          {row.status !== "received" && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleReceiveJobOrder(row)}
              className="whitespace-nowrap"
            >
              <span className="material-icons text-sm mr-1">inventory</span>
              {t('warehouse.receive')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t('warehouse.final_products')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('warehouse.manage_final_products')}
          </CardTitle>
          <CardDescription>
            {t('warehouse.receive_completed_products')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={completedJobOrders || []}
            columns={columns}
            isLoading={isJobOrdersLoading}
          />
        </CardContent>
      </Card>

      {/* Receive Job Order Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className={isRTL ? "rtl" : ""}>
          <DialogHeader>
            <DialogTitle>
              {t('warehouse.receive_job_order')}
            </DialogTitle>
            <DialogDescription>
              {t('warehouse.receive_job_order_description')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedJobOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <h3 className="text-lg font-medium">
                  {t('job_orders.title')} #{selectedJobOrder.id}
                </h3>
                <p className="text-sm text-secondary-500">
                  {getJobOrderDetails(selectedJobOrder.id).customer} - {getJobOrderDetails(selectedJobOrder.id).productName}
                </p>
              </div>
              
              <div className={`grid ${isMobile ? "" : "grid-cols-4"} items-center gap-4`}>
                <Label htmlFor="finishedQty" className={isMobile ? "" : "text-right"}>
                  {t('warehouse.finished_qty')} (Kg)
                </Label>
                <Input
                  id="finishedQty"
                  type="number"
                  value={finishedQty}
                  onChange={(e) => setFinishedQty(parseFloat(e.target.value) || 0)}
                  className={isMobile ? "w-full" : "col-span-3"}
                />
              </div>
              
              <div className={`grid ${isMobile ? "" : "grid-cols-4"} items-start gap-4`}>
                <Label htmlFor="notes" className={isMobile ? "" : "text-right pt-2"}>
                  {t('common.notes')}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('warehouse.notes_placeholder')}
                  className={isMobile ? "w-full" : "col-span-3"}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className={`${isMobile ? "flex flex-col space-y-2" : ""} ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button variant="outline" onClick={handleCloseReceiveDialog} className={isMobile ? "w-full" : ""}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSubmitReceive} 
              disabled={updateJobOrderMutation.isPending}
              className={isMobile ? "w-full" : ""}
            >
              {updateJobOrderMutation.isPending
                ? t('common.receiving')
                : t('warehouse.receive')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
