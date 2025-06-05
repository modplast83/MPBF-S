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
import { formatDateString, formatNumber, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { JobOrder, CustomerProduct, Order, Customer, Roll, Item, Category } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth-v2";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid, parseISO } from "date-fns";

export default function FinalProducts() {
  const queryClient = useQueryClient();
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [printLabelDialogOpen, setPrintLabelDialogOpen] = useState(false);
  const [batchPrintDialogOpen, setBatchPrintDialogOpen] = useState(false);
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [finishedQty, setFinishedQty] = useState<number>(0);
  const [receivingQty, setReceivingQty] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [jobOrdersToPrint, setJobOrdersToPrint] = useState<JobOrder[]>([]);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
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
    mutationFn: async (data: { id: number; status: string; finishedQty: number; receivedQty: number }) => {
      await apiRequest("PUT", `${API_ENDPOINTS.JOB_ORDERS}/${data.id}`, {
        status: data.status,
        finishedQty: data.finishedQty,
        receivedQty: data.receivedQty
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
      jo.status === "partially_received" || 
      jo.status === "extrusion_completed" ||
      jo.status === "in_progress"
    );
  }, [jobOrders]);

  const handleReceiveJobOrder = (jobOrder: JobOrder) => {
    setSelectedJobOrder(jobOrder);
    // Get total cutting quantity for this job order
    const totalCutQty = getTotalCuttingQty(jobOrder.id);
    
    // Set the default to the remaining amount to receive if there's already a partial receipt
    const alreadyReceived = jobOrder.receivedQty || 0;
    const remainingToReceive = totalCutQty - alreadyReceived;
    
    setFinishedQty(totalCutQty); // Still show the full finished quantity
    setReceivingQty(remainingToReceive > 0 ? remainingToReceive : totalCutQty);
    setReceiveDialogOpen(true);
  };

  // Function to check if all job orders for an order are received
  const checkAndUpdateOrderStatus = async (orderId: number) => {
    const orderJobOrders = jobOrders.filter(jo => jo.orderId === orderId);
    
    // Check if ALL job orders are fully received
    const allFullyReceived = orderJobOrders.every(jo => 
      jo.status === "received" && 
      (jo.receivedQty || 0) >= (jo.finishedQty || 0)
    );
    
    // Check if ANY job orders are received (at least partially)
    const anyReceived = orderJobOrders.some(jo => 
      (jo.receivedQty || 0) > 0
    );
    
    try {
      if (allFullyReceived) {
        // All job orders are fully received - update order status to completed
        await apiRequest("PUT", `${API_ENDPOINTS.ORDERS}/${orderId}`, {
          status: "completed"
        });
        
        toast({
          title: "Order Status Updated",
          description: `Order #${orderId} status changed to Completed as all job orders are received.`,
        });
      } else if (anyReceived) {
        // Some job orders are received but not all - ensure status is "processing"
        const order = orders.find(o => o.id === orderId);
        if (order && order.status !== "processing") {
          await apiRequest("PUT", `${API_ENDPOINTS.ORDERS}/${orderId}`, {
            status: "processing"
          });
          
          toast({
            title: "Order Status Updated",
            description: `Order #${orderId} status changed to Processing as some job orders are still pending.`,
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ORDERS] });
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReceive = () => {
    if (!selectedJobOrder) return;
    
    if (receivingQty <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid receiving quantity.",
        variant: "destructive",
      });
      return;
    }
    
    // Get total finished quantity
    const totalFinishedQty = selectedJobOrder.finishedQty || getTotalCuttingQty(selectedJobOrder.id);
    
    // Validate received quantity doesn't exceed finished quantity
    if (receivingQty > totalFinishedQty) {
      toast({
        title: "Validation Error",
        description: "Received quantity cannot exceed finished quantity.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate total received after this receipt
    const currentReceived = selectedJobOrder.receivedQty || 0;
    const totalReceived = currentReceived + receivingQty;
    
    // Determine if this is a partial or full receipt
    const isFullReceipt = totalReceived >= totalFinishedQty;
    const newStatus = isFullReceipt ? "received" : "partially_received";
    
    updateJobOrderMutation.mutate({
      id: selectedJobOrder.id,
      status: newStatus,
      finishedQty: totalFinishedQty,
      receivedQty: totalReceived,
      receiveDate: new Date().toISOString(),
      receivedBy: user?.id || undefined
    } as any,
    {
      onSuccess: () => {
        // Check if all job orders for this order are now received
        if (selectedJobOrder) {
          checkAndUpdateOrderStatus(selectedJobOrder.orderId);
        }
      }
    });
  };

  const handleCloseReceiveDialog = () => {
    setReceiveDialogOpen(false);
    setSelectedJobOrder(null);
    setFinishedQty(0);
    setReceivingQty(0);
    setNotes("");
  };

  // Handle print label function
  const handlePrintLabel = (jobOrder: JobOrder) => {
    setSelectedJobOrder(jobOrder);
    setPrintLabelDialogOpen(true);
  };

  // Function to prepare batch printing dialog
  const handleOpenBatchPrint = () => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        description: "You need to select a date to print job orders for a specific day.",
        variant: "destructive",
      });
      return;
    }

    // Filter job orders that have been received (based on receivedQty > 0)
    // Since we don't currently have a receiveDate field in our schema,
    // we'll just show all received job orders as a demonstration
    
    const filteredOrders = jobOrders.filter(order => {
      // Only include job orders that have been received (fully or partially)
      return order.receivedQty && order.receivedQty > 0 &&
             (order.status === 'received' || order.status === 'partially_received');
    });

    if (filteredOrders.length === 0) {
      toast({
        title: "No job orders found",
        description: `No job orders were received on ${format(selectedDate, 'MMMM dd, yyyy')}`,
        variant: "destructive",
      });
      return;
    }

    setJobOrdersToPrint(filteredOrders);
    setBatchPrintDialogOpen(true);
  };

  // Function to print multiple job order labels
  const printBatchLabels = () => {
    setIsPrinting(true);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: t("common.error"),
        description: t("common.popup_blocked"),
        variant: "destructive",
      });
      setIsPrinting(false);
      return;
    }
    
    // Group job orders by order number
    const groupedByOrder = jobOrdersToPrint.reduce((groups, jobOrder) => {
      const jobOrderDetails = getJobOrderDetails(jobOrder.id);
      const orderNumber = jobOrderDetails.orderNumber || 'N/A';
      
      if (!groups[orderNumber]) {
        groups[orderNumber] = [];
      }
      groups[orderNumber].push(jobOrder);
      return groups;
    }, {} as Record<string, JobOrder[]>);
    
    // Start building the HTML content for all labels
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Labels - Grouped by Order</title>
        <style>
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 12pt;
          }
          .page-break {
            page-break-after: always;
          }
          .order-group {
            margin-bottom: 1in;
            border: 2px solid #000;
            padding: 0.3in;
          }
          .order-header {
            background-color: #f0f0f0;
            padding: 0.2in;
            margin-bottom: 0.2in;
            border: 1px solid #333;
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
          }
          .job-orders-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0.2in;
          }
          .job-orders-table th,
          .job-orders-table td {
            border: 1px solid #333;
            padding: 0.1in;
            text-align: left;
            font-size: 10pt;
          }
          .job-orders-table th {
            background-color: #e0e0e0;
            font-weight: bold;
          }
          .group-footer {
            margin-top: 0.1in;
            font-size: 8pt;
            text-align: right;
            color: #666;
          }
        </style>
      </head>
      <body>
    `;
    
    const formattedDate = new Date().toLocaleDateString();
    let isFirstGroup = true;
    
    // Add each order group
    Object.entries(groupedByOrder).forEach(([orderNumber, jobOrders]) => {
      // Add page break between order groups except for the first one
      if (!isFirstGroup) {
        htmlContent += '<div class="page-break"></div>';
      }
      isFirstGroup = false;
      
      // Get customer name from first job order in the group (should be same for all)
      const firstJobOrderDetails = getJobOrderDetails(jobOrders[0].id);
      const customerName = firstJobOrderDetails.customer || 'N/A';
      
      htmlContent += `
        <div class="order-group">
          <div class="order-header">
            Order #${orderNumber} - ${customerName}
          </div>
          
          <table class="job-orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>JO #</th>
                <th>Customer Name</th>
                <th>Category Code</th>
                <th>Item Name</th>
                <th>Received Qty</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // Add each job order in this group
      jobOrders.forEach(jobOrder => {
        const jobOrderDetails = getJobOrderDetails(jobOrder.id);
        const categoryCode = jobOrderDetails.categoryCode || 'N/A';
        const itemName = jobOrderDetails.productName || 'N/A';
        const receivedQty = formatNumber(jobOrder.receivedQty || 0);
        
        htmlContent += `
          <tr>
            <td>${orderNumber}</td>
            <td>${jobOrder.id}</td>
            <td>${customerName}</td>
            <td>${categoryCode}</td>
            <td>${itemName}</td>
            <td>${receivedQty} kg</td>
          </tr>
        `;
      });
      
      htmlContent += `
            </tbody>
          </table>
          
          <div class="group-footer">
            Total Job Orders in Order #${orderNumber}: ${jobOrders.length} | Printed on: ${formattedDate}
          </div>
        </div>
      `;
    });
    
    // Close the HTML content
    htmlContent += `
      </body>
      </html>
    `;
    
    // Set the HTML content of the print window
    printWindow.document.write(htmlContent);
    
    // Wait for content to load, then print
    printWindow.document.addEventListener('load', function() {
      printWindow.print();
      printWindow.close();
      setIsPrinting(false);
      setBatchPrintDialogOpen(false);
    }, { once: true });
    
    // Fallback in case the load event doesn't fire
    setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
      } catch (e) {
        console.error("Error printing:", e);
      }
      setIsPrinting(false);
      setBatchPrintDialogOpen(false);
    }, 1000);
  };

  // Function to execute the actual printing of a single job order
  const printJobOrderLabel = () => {
    if (!selectedJobOrder) return;
    
    setIsPrinting(true);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: t("common.error"),
        description: t("common.popup_blocked"),
        variant: "destructive",
      });
      setIsPrinting(false);
      return;
    }
    
    // Get job order details
    const jobOrderDetails = getJobOrderDetails(selectedJobOrder.id);
    const productionQty = getTotalExtrusionQty(selectedJobOrder.id);
    const finishedQty = selectedJobOrder.finishedQty || 0;
    const wasteQty = Math.max(0, productionQty - finishedQty);
    
    // Format date to display on label
    const formattedDate = new Date().toLocaleDateString();
    
    // Set the content of the print window with CSS for a 3" x 5" label
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Job Order Label - ${selectedJobOrder.id}</title>
        <style>
          @page {
            size: 4in 6in;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0.25in;
            width: 3.5in;
            height: 5.5in;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
          }
          .label-container {
            border: 1px solid #ccc;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 0.15in;
            box-sizing: border-box;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #000;
            padding-bottom: 0.1in;
            margin-bottom: 0.1in;
          }
          .job-order-id {
            font-size: 16pt;
            font-weight: bold;
          }
          .info-row {
            margin: 0.05in 0;
            display: flex;
          }
          .info-label {
            font-weight: bold;
            width: 1in;
          }
          .info-value {
            flex: 1;
          }
          .qr-placeholder {
            margin-top: 0.1in;
            height: 1in;
            border: 1px dashed #000;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-size: 8pt;
          }
          .footer {
            margin-top: auto;
            font-size: 8pt;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 0.1in;
          }
          .receipt-status {
            font-weight: bold;
            margin-top: 0.1in;
            text-align: center;
            padding: 0.05in;
            border: 1px solid #000;
            border-radius: 0.1in;
          }
          .full-receipt {
            background-color: #d4edda;
            color: #155724;
          }
          .partial-receipt {
            background-color: #cce5ff;
            color: #004085;
          }
          .completed-status {
            background-color: #fff3cd;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <div class="job-order-id">JO #${selectedJobOrder.id}</div>
            <div>${formattedDate}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Customer:</div>
            <div class="info-value">${jobOrderDetails.customer || 'N/A'}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Product:</div>
            <div class="info-value">${jobOrderDetails.productName || 'N/A'}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Order #:</div>
            <div class="info-value">${jobOrderDetails.orderNumber || 'N/A'}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Ordered Qty:</div>
            <div class="info-value">${formatNumber(selectedJobOrder.quantity || 0)} kg</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Finished Qty:</div>
            <div class="info-value">${formatNumber(finishedQty)} kg</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Received Qty:</div>
            <div class="info-value">${formatNumber(selectedJobOrder.receivedQty || 0)} kg</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Waste Qty:</div>
            <div class="info-value">${formatNumber(wasteQty)} kg</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">Waste %:</div>
            <div class="info-value">${calculateWastePercentage(selectedJobOrder.id)}%</div>
          </div>
          
          <div class="receipt-status ${
            selectedJobOrder.status === 'partially_received' 
              ? 'partial-receipt' 
              : selectedJobOrder.status === 'completed' 
                ? 'completed-status' 
                : 'full-receipt'
          }">
            ${
              selectedJobOrder.status === 'partially_received' 
                ? 'PARTIALLY RECEIVED' 
                : selectedJobOrder.status === 'completed' 
                  ? 'COMPLETED - PENDING WAREHOUSE' 
                  : 'FULLY RECEIVED'
            }
          </div>
          
          <div class="qr-placeholder">
            Scan QR code to view detailed information<br>
            JO #${selectedJobOrder.id}
          </div>
          
          <div class="footer">
            ${
              selectedJobOrder.status === 'completed'
                ? 'Production Complete - Not Yet Received'
                : 'Received in Warehouse'
            } - ${formattedDate}
          </div>
        </div>
      </body>
      </html>
    `);
    
    // Print the window and close it after printing
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    // Cleanup after printing
    printWindow.onafterprint = () => {
      printWindow.close();
      setIsPrinting(false);
      setPrintLabelDialogOpen(false);
    };
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
  
  const getTotalExtrusionQty = (jobOrderId: number): number => {
    // Calculate total extruded quantity from all rolls for this job order
    const jobOrderRolls = rolls.filter(roll => 
      roll.jobOrderId === jobOrderId
    );
    return jobOrderRolls.reduce((total, roll) => total + (roll.extrudingQty || 0), 0);
  };
  
  // Calculate waste percentage for a job order
  const calculateWastePercentage = (jobOrderId: number): string => {
    const productionQty = getTotalExtrusionQty(jobOrderId);
    const jobOrder = jobOrders?.find(jo => jo.id === jobOrderId);
    
    if (!jobOrder || productionQty === 0) return "0.00";
    
    const finishedQty = jobOrder.finishedQty || 0;
    const wasteQty = Math.max(0, productionQty - finishedQty);
    const wastePercentage = (wasteQty / productionQty) * 100;
    
    return wastePercentage.toFixed(2);
  };
  
  const getJobOrderDetails = (jobOrderId: number) => {
    const jobOrder = jobOrders?.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return { 
      orderNumber: "Unknown", 
      productName: "Unknown", 
      customer: "Unknown",
      customerAr: "غير معروف",
      categoryCode: "Unknown",
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
    
    // Get the category code from the categories collection
    let categoryCode = "Unknown";
    if (product && product.categoryId) {
      const category = categories.find(c => c.id === product.categoryId);
      if (category) {
        categoryCode = category.code;
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
      customerAr: customer?.nameAr || "غير معروف",
      categoryCode: categoryCode,
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
    hidden?: boolean;
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
        return isRTL ? details.customerAr : details.customer;
      },
    },
    {
      header: t('warehouse.customer_arabic_name'),
      cell: (row) => {
        const details = getJobOrderDetails(row.id);
        return details.customerAr;
      },
      // Only show this column when not in RTL mode (since RTL mode already shows Arabic)
      hidden: isRTL,
    },
    {
      header: t('orders.product'),
      cell: (row) => {
        const details = getJobOrderDetails(row.id);
        return details.productName;
      },
    },
    {
      header: t('warehouse.ordered_qty') + " (Kg)",
      accessorKey: "quantity",
      cell: (row) => formatNumber(row.quantity)
    },
    {
      header: t('warehouse.production_qty') + " (Kg)",
      cell: (row) => {
        // Total extruded quantity (from all rolls)
        const productionQty = getTotalExtrusionQty(row.id);
        return formatNumber(productionQty);
      }
    },
    {
      header: t('warehouse.finished_qty') + " (Kg)",
      cell: (row) => {
        if (row.status === "received" || row.status === "partially_received") {
          return formatNumber(row.finishedQty || 0);
        } else {
          const details = getJobOrderDetails(row.id);
          return formatNumber(details.totalCutQty);
        }
      }
    },
    {
      header: "Received Quantity (Kg)",
      cell: (row) => {
        return formatNumber(row.receivedQty || 0);
      }
    },
    {
      header: t('warehouse.waste_qty') + " (Kg)",
      cell: (row) => {
        // Production quantity - Finished quantity
        const productionQty = getTotalExtrusionQty(row.id);
        const finishedQty = row.status === "received" || row.status === "partially_received" ? 
          (row.finishedQty || 0) : 
          getJobOrderDetails(row.id).totalCutQty;
        
        const wasteQty = Math.max(0, productionQty - finishedQty);
        return formatNumber(wasteQty);
      }
    },
    {
      header: "Waste %",
      cell: (row) => {
        return calculateWastePercentage(row.id) + "%";
      }
    },
    {
      header: "Completion",
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
        let variant: "default" | "outline" | "secondary" | "destructive" = "default";
        let statusText = row.status?.replace(/_/g, ' ') || '';
        
        // Map statuses to appropriate variant colors
        if (row.status === "pending") variant = "secondary";
        if (row.status === "in_progress") variant = "secondary";
        if (row.status === "extrusion_completed") variant = "secondary";
        if (row.status === "printing_completed") variant = "secondary";
        if (row.status === "cutting_completed") variant = "secondary";
        if (row.status === "completed") variant = "secondary";
        if (row.status === "received") variant = "default";
        if (row.status === "partially_received") variant = "default";
        
        // Apply additional styling based on status
        let className = "capitalize whitespace-nowrap ";
        if (row.status === "completed") className += "bg-amber-500 text-white hover:bg-amber-600";
        if (row.status === "received") className += "bg-green-500 text-white hover:bg-green-600";
        if (row.status === "partially_received") className += "bg-blue-500 text-white hover:bg-blue-600";
        
        return (
          <Badge variant={variant} className={className}>
            {statusText}
          </Badge>
        );
      }
    },
    {
      header: t('common.actions'),
      cell: (row) => (
        <div className={`flex ${isRTL ? "space-x-reverse" : "space-x-2"}`}>
          {(row.status !== "received" && row.status !== "partially_received") && (
            <div className={`flex ${isRTL ? "space-x-reverse" : "space-x-2"}`}>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleReceiveJobOrder(row)}
                className="whitespace-nowrap"
              >
                <span className="material-icons text-sm mr-1">inventory</span>
                {t('warehouse.receive')}
              </Button>
              {row.status === "completed" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePrintLabel(row)}
                  className="whitespace-nowrap"
                >
                  <span className="material-icons text-sm mr-1">print</span>
                  {t('warehouse.print_label')}
                </Button>
              )}
            </div>
          )}
          {(row.status === "partially_received") && (
            <div className={`flex ${isRTL ? "space-x-reverse" : "space-x-2"}`}>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleReceiveJobOrder(row)}
                className="whitespace-nowrap"
              >
                <span className="material-icons text-sm mr-1">inventory</span>
                {t('warehouse.receive')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePrintLabel(row)}
                className="whitespace-nowrap"
              >
                <span className="material-icons text-sm mr-1">print</span>
                {t('warehouse.print_label')}
              </Button>
            </div>
          )}
          {row.status === "received" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePrintLabel(row)}
              className="whitespace-nowrap"
            >
              <span className="material-icons text-sm mr-1">print</span>
              {t('warehouse.print_label')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">{t('warehouse.final_products')}</h1>
        
        {/* Mobile-friendly control buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  className={cn(
                    "justify-start text-left font-normal w-full sm:w-auto",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <span className="material-icons mr-2 text-sm">calendar_today</span>
                  <span className="truncate">
                    {selectedDate ? (
                      format(selectedDate, isMobile ? "MMM dd" : "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button
              onClick={handleOpenBatchPrint}
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              <span className="material-icons mr-2 text-sm">print</span>
              {isMobile ? "Print Labels" : "Print Daily Labels"}
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">
            {t('warehouse.manage_final_products')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('warehouse.receive_completed_products')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {isMobile ? (
            /* Mobile Card View */
            <div className="space-y-3">
              {isJobOrdersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-32" />
                ))
              ) : completedJobOrders && completedJobOrders.length > 0 ? (
                completedJobOrders.map((jobOrder) => {
                  const details = getJobOrderDetails(jobOrder.id);
                  const totalCutQty = getTotalCuttingQty(jobOrder.id);
                  const wasteQty = Math.max(0, getTotalExtrusionQty(jobOrder.id) - (jobOrder.finishedQty || 0));
                  
                  return (
                    <Card key={jobOrder.id} className="border border-gray-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-sm">JO #{jobOrder.id}</h3>
                            <p className="text-xs text-gray-600 truncate max-w-[200px]">
                              {details.customer}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              jobOrder.status === "completed" ? "secondary" :
                              jobOrder.status === "received" ? "default" :
                              jobOrder.status === "partially_received" ? "outline" : "secondary"
                            }
                            className="text-xs"
                          >
                            {jobOrder.status === "completed" && "Completed"}
                            {jobOrder.status === "received" && "Received"}
                            {jobOrder.status === "partially_received" && "Partial"}
                            {jobOrder.status === "in_progress" && "In Progress"}
                            {jobOrder.status === "extrusion_completed" && "Extr. Done"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-gray-500">Product:</span>
                            <p className="font-medium truncate" title={details.productName}>
                              {details.productName}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Ordered:</span>
                            <p className="font-medium">{formatNumber(jobOrder.quantity || 0)} kg</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Finished:</span>
                            <p className="font-medium">{formatNumber(totalCutQty)} kg</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Received:</span>
                            <p className="font-medium">{formatNumber(jobOrder.receivedQty || 0)} kg</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {(jobOrder.status === "completed" || 
                            jobOrder.status === "extrusion_completed" || 
                            jobOrder.status === "partially_received") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReceiveJobOrder(jobOrder)}
                              className="flex-1 text-xs py-2"
                            >
                              <span className="material-icons text-sm mr-1">download</span>
                              Receive
                            </Button>
                          )}
                          {(jobOrder.status === "received" || 
                            jobOrder.status === "partially_received" ||
                            jobOrder.status === "completed") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintLabel(jobOrder)}
                              className="flex-1 text-xs py-2"
                            >
                              <span className="material-icons text-sm mr-1">print</span>
                              Label
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="material-icons text-4xl mb-2 block">inventory_2</span>
                  <p className="text-sm">No final products available</p>
                </div>
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <DataTable 
              data={completedJobOrders || []}
              columns={columns}
              isLoading={isJobOrdersLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Receive Job Order Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className={cn(
          isRTL ? "rtl" : "",
          isMobile ? "max-w-[95vw] w-full max-h-[90vh] overflow-y-auto" : ""
        )}>
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
                  readOnly
                  disabled
                  className={isMobile ? "w-full" : "col-span-3 bg-secondary-50"}
                />
              </div>
              
              <div className={`grid ${isMobile ? "" : "grid-cols-4"} items-center gap-4`}>
                <Label htmlFor="receivingQty" className={isMobile ? "" : "text-right"}>
                  Received Quantity (Kg)
                </Label>
                <div className={isMobile ? "w-full" : "col-span-3"}>
                  <Input
                    id="receivingQty"
                    type="number"
                    value={receivingQty}
                    onChange={(e) => setReceivingQty(parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                  {selectedJobOrder && selectedJobOrder.receivedQty > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Already received: {formatNumber(selectedJobOrder.receivedQty)} kg
                    </p>
                  )}
                </div>
              </div>
              
              <div className={`grid ${isMobile ? "" : "grid-cols-4"} items-center gap-4`}>
                <Label className={isMobile ? "" : "text-right"}>
                  Receive Date
                </Label>
                <Input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  readOnly
                  disabled
                  className={isMobile ? "w-full" : "col-span-3 bg-secondary-50"}
                />
              </div>
              
              <div className={`grid ${isMobile ? "" : "grid-cols-4"} items-center gap-4`}>
                <Label className={isMobile ? "" : "text-right"}>
                  Received by
                </Label>
                <Input
                  type="text"
                  value={user?.username || 'Current User'}
                  readOnly
                  disabled
                  className={isMobile ? "w-full" : "col-span-3 bg-secondary-50"}
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
      
      {/* Print Label Dialog */}
      <Dialog open={printLabelDialogOpen} onOpenChange={setPrintLabelDialogOpen}>
        <DialogContent className={cn(
          isRTL ? "rtl" : "",
          isMobile ? "max-w-[95vw] w-full max-h-[90vh] overflow-y-auto" : ""
        )}>
          <DialogHeader>
            <DialogTitle>
              {t('warehouse.print_label')}
            </DialogTitle>
            <DialogDescription>
              {selectedJobOrder?.status === 'completed' 
                ? (t('warehouse.print_label_description_completed') || "Print a warehouse label for the completed job order that is pending warehouse receipt.")
                : (t('warehouse.print_label_description') || "Print a warehouse label for the received job order.")}
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
              
              <div className="border rounded-md p-4 bg-secondary-50">
                <p className="text-sm">
                  {t('warehouse.print_label_info') || "A 4″ × 6″ label will be generated with the following information:"}
                </p>
                <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                  <li>{t('job_orders.title')} #{selectedJobOrder.id}</li>
                  <li>{t('setup.customers.title')}: {getJobOrderDetails(selectedJobOrder.id).customer}</li>
                  <li>{t('orders.product')}: {getJobOrderDetails(selectedJobOrder.id).productName}</li>
                  <li>{t('warehouse.ordered_qty')}: {formatNumber(selectedJobOrder.quantity || 0)} kg</li>
                  <li>{t('warehouse.finished_qty')}: {formatNumber(selectedJobOrder.finishedQty || 0)} kg</li>
                  <li>Received Quantity: {formatNumber(selectedJobOrder.receivedQty || 0)} kg</li>
                  <li>{t('warehouse.waste_qty')}: {formatNumber(Math.max(0, getTotalExtrusionQty(selectedJobOrder.id) - (selectedJobOrder.finishedQty || 0)))} kg</li>
                  <li>Waste Percentage: {calculateWastePercentage(selectedJobOrder.id)}%</li>
                  <li>{t('common.status')}: {
                    selectedJobOrder.status === 'partially_received' 
                      ? 'Partially Received' 
                      : selectedJobOrder.status === 'completed' 
                        ? 'Completed - Pending Warehouse' 
                        : 'Fully Received'
                  }</li>
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter className={`${isMobile ? "flex flex-col space-y-2" : ""} ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button 
              variant="outline" 
              onClick={() => setPrintLabelDialogOpen(false)} 
              className={isMobile ? "w-full" : ""}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={printJobOrderLabel} 
              disabled={isPrinting}
              className={isMobile ? "w-full" : ""}
            >
              {isPrinting
                ? t('warehouse.printing_label') || "Printing Label..."
                : t('warehouse.print_label')
              }
              <span className="material-icons text-sm ml-1">print</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Print Dialog */}
      <Dialog open={batchPrintDialogOpen} onOpenChange={setBatchPrintDialogOpen}>
        <DialogContent className={cn(
          isRTL ? "rtl" : "",
          isMobile ? "max-w-[95vw] w-full max-h-[90vh] overflow-y-auto" : ""
        )}>
          <DialogHeader>
            <DialogTitle>
              {t('warehouse.batch_print_label') || "Print Multiple Labels"}
            </DialogTitle>
            <DialogDescription>
              {t('warehouse.batch_print_description', { 
                date: selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "the selected date" 
              })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid gap-4">
              <div className="border rounded-md p-4 bg-secondary-50">
                <p className="text-sm font-medium">{t('warehouse.batch_print_summary') || "Summary of job orders to print:"}</p>
                <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                  <li>{t('warehouse.orders_found', { count: jobOrdersToPrint.length }) || `${jobOrdersToPrint.length} job order(s) found`}</li>
                  <li>{t('warehouse.total_received_kg', { kg: jobOrdersToPrint.reduce((sum, jo) => sum + (jo.receivedQty || 0), 0).toFixed(2) }) || 
                      `Total received quantity: ${jobOrdersToPrint.reduce((sum, jo) => sum + (jo.receivedQty || 0), 0).toFixed(2)} kg`}</li>
                </ul>
              </div>
              
              {jobOrdersToPrint.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  <table className="w-full text-sm">
                    <thead className="font-medium border-b">
                      <tr>
                        <th className="text-left p-2">JO #</th>
                        <th className="text-left p-2">{t('setup.customers.title')}</th>
                        <th className="text-left p-2">{t('warehouse.received_qty')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobOrdersToPrint.map(jo => (
                        <tr key={jo.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                          <td className="p-2">#{jo.id}</td>
                          <td className="p-2">{getJobOrderDetails(jo.id).customer}</td>
                          <td className="p-2">{formatNumber(jo.receivedQty || 0)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className={`${isMobile ? "flex flex-col space-y-2" : ""} ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button 
              variant="outline" 
              onClick={() => setBatchPrintDialogOpen(false)} 
              className={isMobile ? "w-full" : ""}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={printBatchLabels} 
              disabled={isPrinting || jobOrdersToPrint.length === 0}
              className={isMobile ? "w-full" : ""}
            >
              {isPrinting
                ? t('warehouse.printing_batch_labels') || "Printing Labels..."
                : t('warehouse.print_batch_labels') || "Print All Labels"
              }
              <span className="material-icons text-sm ml-1">print</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
