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
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

// Simple line chart component
function LineChart({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <div className={`${isMobile ? 'h-60' : 'h-80'} flex items-center justify-center bg-secondary-50 rounded border border-dashed border-secondary-200`}>
      <div className="text-center px-4">
        <span className="material-icons text-4xl text-secondary-300">insert_chart</span>
        <p className={`mt-2 text-secondary-500 ${isMobile ? 'text-sm' : ''}`}>
          Production report chart shows here
        </p>
        <p className="text-xs text-secondary-400 mt-1">
          This would be a real chart in production
        </p>
      </div>
    </div>
  );
}

export default function ReportsIndex() {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
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

  // Report columns for desktop view
  const productionColumns = [
    { header: "Order ID", accessorKey: "id" },
    { header: "Date", accessorKey: "date" },
    { header: "Customer", accessorKey: "customer" },
    { header: "Product", accessorKey: "product" },
    { header: "Size", accessorKey: "size" },
    { 
      header: "Ordered (Kg)", 
      accessorKey: "ordered",
      cell: (row: any) => formatNumber(row.ordered, 1),
    },
    { 
      header: "Completed (Kg)", 
      accessorKey: "completed",
      cell: (row: any) => formatNumber(row.completed, 1),
    },
    { header: "Efficiency", accessorKey: "efficiency" },
    { header: "Status", accessorKey: "status" },
  ];
  
  // Mobile card view for report data
  const renderMobileReportCards = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">No data available for the selected criteria.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {reportData.map((row, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium">Order #{row.id}</CardTitle>
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{row.status}</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium">{row.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm font-medium truncate">{row.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Product</p>
                  <p className="text-sm font-medium truncate">{row.product}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Size</p>
                  <p className="text-sm font-medium">{row.size}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ordered</p>
                  <p className="text-sm font-medium">{formatNumber(row.ordered, 1)} Kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-sm font-medium">{formatNumber(row.completed, 1)} Kg</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Efficiency</span>
                  <span className="text-sm font-medium">{row.efficiency}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Reports</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/reports/performance" className="block no-underline text-current">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("performance.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 bg-blue-50 rounded mb-3">
                <span className="material-icons text-4xl text-blue-400">insights</span>
              </div>
              <p className="text-sm text-gray-600">
                {t("performance.production_efficiency")}
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/reports/production" className="block no-underline text-current">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("reports.production_report")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 bg-orange-50 rounded mb-3">
                <span className="material-icons text-4xl text-orange-400">precision_manufacturing</span>
              </div>
              <p className="text-sm text-gray-600">
                {t("reports.comprehensive_production_data")}
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/reports/warehouse" className="block no-underline text-current">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("reports.warehouse_reports")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 bg-green-50 rounded mb-3">
                <span className="material-icons text-4xl text-green-400">inventory_2</span>
              </div>
              <p className="text-sm text-gray-600">
                {t("reports.track_inventory")}
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/reports/quality" className="block no-underline text-current">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("reports.quality_report")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 bg-purple-50 rounded mb-3">
                <span className="material-icons text-4xl text-purple-400">verified</span>
              </div>
              <p className="text-sm text-gray-600">
                {t("reports.analyze_quality")}
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("reports.efficiency_report")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 bg-cyan-50 rounded mb-3">
              <span className="material-icons text-4xl text-cyan-400">show_chart</span>
            </div>
            <p className="text-sm text-gray-600">
              {t("reports.analyze_manufacturing_efficiency")}
            </p>
          </CardContent>
        </Card>
        
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("reports.cost_analysis")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 bg-amber-50 rounded mb-3">
              <span className="material-icons text-4xl text-amber-400">attach_money</span>
            </div>
            <p className="text-sm text-gray-600">
              {t("reports.production_cost_analysis")}
            </p>
          </CardContent>
        </Card>
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
            <LineChart isMobile={isMobile} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">
              {reportType === "production" 
                ? "Production Summary" 
                : reportType === "inventory" 
                  ? "Inventory Summary" 
                  : "Efficiency Summary"}
            </h3>
            
            {isMobile ? (
              renderMobileReportCards()
            ) : (
              <DataTable 
                data={reportData}
                columns={productionColumns as any}
              />
            )}
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-end'} mt-6`}>
            <Button 
              variant="outline" 
              className={`flex items-center justify-center ${isMobile ? 'w-full' : ''}`}
            >
              <span className="material-icons text-sm mr-1">download</span>
              Export to Excel
            </Button>
            <Button 
              variant="outline" 
              className={`flex items-center justify-center ${isMobile ? 'w-full' : 'ml-2'}`}
            >
              <span className="material-icons text-sm mr-1">print</span>
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
