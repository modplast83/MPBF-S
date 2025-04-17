import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable } from "@/components/ui/data-table";
import { API_ENDPOINTS } from "@/lib/constants";
import { formatDateString, formatNumber } from "@/lib/utils";
import { Order, JobOrder, Roll, CustomerProduct, Customer } from "@shared/schema";

// Simple line chart component
function LineChart() {
  return (
    <div className="h-80 flex items-center justify-center bg-secondary-50 rounded border border-dashed border-secondary-200">
      <div className="text-center">
        <span className="material-icons text-4xl text-secondary-300">insert_chart</span>
        <p className="mt-2 text-secondary-500">Production report chart shows here</p>
        <p className="text-xs text-secondary-400 mt-1">This would be a real chart in production</p>
      </div>
    </div>
  );
}

export default function ReportsIndex() {
  const [reportType, setReportType] = useState("production");
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined,
  });

  // Fetch data
  const { data: orders } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: jobOrders } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  const { data: rolls } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });

  const { data: customerProducts } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  // Filter and prepare report data
  const filterByDateRange = (date: string) => {
    if (!dateRange.start && !dateRange.end) return true;
    
    const itemDate = new Date(date);
    const startDate = dateRange.start;
    const endDate = dateRange.end;
    
    if (startDate && endDate) {
      return itemDate >= startDate && itemDate <= endDate;
    } else if (startDate) {
      return itemDate >= startDate;
    } else if (endDate) {
      return itemDate <= endDate;
    }
    
    return true;
  };

  // Get products for order summary
  const getProductData = (jobOrderId: number) => {
    const jobOrder = jobOrders?.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return { name: "Unknown", size: "Unknown" };
    
    const product = customerProducts?.find(cp => cp.id === jobOrder.customerProductId);
    if (!product) return { name: "Unknown", size: "Unknown" };
    
    return {
      name: product.itemId,
      size: product.sizeCaption || "N/A",
    };
  };

  // Get customer for order
  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || "Unknown";
  };

  // Generate production report data
  const getProductionReportData = () => {
    const filteredOrders = orders?.filter(order => filterByDateRange(order.date)) || [];
    
    return filteredOrders.map(order => {
      const orderJobOrders = jobOrders?.filter(jo => jo.orderId === order.id) || [];
      const totalQuantity = orderJobOrders.reduce((sum, jo) => sum + jo.quantity, 0);
      
      // Calculate completed quantity from rolls
      const orderRolls = rolls?.filter(roll => 
        orderJobOrders.some(jo => jo.id === roll.jobOrderId)
      ) || [];
      
      const completedQuantity = orderRolls
        .filter(roll => roll.status === "completed")
        .reduce((sum, roll) => sum + roll.cuttingQty, 0);
      
      // Get first product for display (in real app would handle multiple products better)
      const firstJobOrder = orderJobOrders[0];
      const productData = firstJobOrder ? getProductData(firstJobOrder.id) : { name: "N/A", size: "N/A" };
      
      return {
        id: order.id,
        date: formatDateString(order.date),
        customer: getCustomerName(order.customerId),
        product: productData.name,
        size: productData.size,
        ordered: totalQuantity,
        completed: completedQuantity,
        efficiency: totalQuantity > 0 ? (completedQuantity / totalQuantity * 100).toFixed(1) + '%' : "0%",
        status: order.status,
      };
    });
  };

  // Prepare report data based on type
  const reportData = reportType === "production" 
    ? getProductionReportData()
    : []; // For now only production report is implemented

  // Report columns
  const productionColumns = [
    { header: "Order ID", accessorKey: "id" },
    { header: "Date", accessorKey: "date" },
    { header: "Customer", accessorKey: "customer" },
    { header: "Product", accessorKey: "product" },
    { header: "Size", accessorKey: "size" },
    { 
      header: "Ordered (Kg)", 
      accessorKey: "ordered",
      cell: (row: { ordered: number }) => formatNumber(row.ordered, 1),
    },
    { 
      header: "Completed (Kg)", 
      accessorKey: "completed",
      cell: (row: { completed: number }) => formatNumber(row.completed, 1),
    },
    { header: "Efficiency", accessorKey: "efficiency" },
    { header: "Status", accessorKey: "status" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Reports</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium mb-1">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="efficiency">Efficiency Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <DatePicker
                selected={dateRange.start}
                onSelect={(date) => setDateRange({ ...dateRange, start: date })}
              />
            </div>
            
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <DatePicker
                selected={dateRange.end}
                onSelect={(date) => setDateRange({ ...dateRange, end: date })}
              />
            </div>
            
            <div className="w-full md:w-1/4 flex items-end">
              <Button className="w-full">
                <span className="material-icons text-sm mr-1">search</span>
                Generate Report
              </Button>
            </div>
          </div>
          
          <div className="mb-6">
            <LineChart />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">
              {reportType === "production" 
                ? "Production Summary" 
                : reportType === "inventory" 
                  ? "Inventory Summary" 
                  : "Efficiency Summary"}
            </h3>
            
            <DataTable 
              data={reportData}
              columns={productionColumns}
            />
          </div>
          
          <div className="flex justify-end mt-6">
            <Button variant="outline" className="flex items-center">
              <span className="material-icons text-sm mr-1">download</span>
              Export to Excel
            </Button>
            <Button variant="outline" className="flex items-center ml-2">
              <span className="material-icons text-sm mr-1">print</span>
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
