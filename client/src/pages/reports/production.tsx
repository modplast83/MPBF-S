import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { API_ENDPOINTS } from "@/lib/constants";
import { formatDateString, formatNumber } from "@/lib/utils";
import { Customer } from "@shared/schema";

// Interface for production report data
interface ProductionReportItem {
  id: number;
  date: string;
  customer: {
    id: string;
    name: string;
  };
  products: {
    id: number;
    name: string;
    size: string;
    quantity: number;
  }[];
  metrics: {
    totalQuantity: number;
    completedQuantity: number;
    extrusionQuantity: number;
    printingQuantity: number;
    wastageQuantity: number;
    wastePercentage: number;
    efficiency: number;
  };
  status: string;
  jobOrders: {
    id: number;
    quantity: number;
    status: string;
    completedDate: Date | null;
  }[];
}

export default function ProductionReportsPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // State for filters
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    customerId: "",
    productId: "",
    status: ""
  });
  
  // Selected report for details
  const [selectedReport, setSelectedReport] = useState<ProductionReportItem | null>(null);
  
  // Fetch customers for filter dropdown
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  // Fetch products for filter dropdown (simplified here - in a real app you might want to get unique products from customer products)
  const { data: customerProducts } = useQuery({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });
  
  // Build the query parameters string for filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    
    if (filters.customerId) {
      params.append('customerId', filters.customerId);
    }
    
    if (filters.productId) {
      params.append('productId', filters.productId);
    }
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    return params.toString();
  };
  
  // Fetch production report data with filters
  const { 
    data: reportData, 
    isLoading: reportLoading, 
    refetch: refetchReport,
    isError: reportError
  } = useQuery<ProductionReportItem[]>({
    queryKey: [`/api/reports/production?${buildQueryParams()}`],
    enabled: true, // Always enabled to fetch initial data
  });
  
  // Effect to refetch when filters change
  useEffect(() => {
    refetchReport();
  }, [filters, refetchReport]);
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      customerId: "",
      productId: "",
      status: ""
    });
  };
  
  // Calculate summary metrics for the entire report
  const calculateSummaryMetrics = () => {
    if (!reportData || reportData.length === 0) {
      return {
        totalOrders: 0,
        totalQuantity: 0,
        completedQuantity: 0,
        wastePercentage: 0,
        avgEfficiency: 0
      };
    }
    
    const totalOrders = reportData.length;
    const totalQuantity = reportData.reduce((sum, report) => sum + report.metrics.totalQuantity, 0);
    const completedQuantity = reportData.reduce((sum, report) => sum + report.metrics.completedQuantity, 0);
    
    // Calculate overall waste
    const totalWaste = reportData.reduce((sum, report) => sum + report.metrics.wastageQuantity, 0);
    const totalExtrusion = reportData.reduce((sum, report) => sum + report.metrics.extrusionQuantity, 0);
    const wastePercentage = totalExtrusion > 0 ? (totalWaste / totalExtrusion) * 100 : 0;
    
    // Calculate average efficiency
    const totalEfficiency = reportData.reduce((sum, report) => sum + report.metrics.efficiency, 0);
    const avgEfficiency = totalOrders > 0 ? totalEfficiency / totalOrders : 0;
    
    return {
      totalOrders,
      totalQuantity,
      completedQuantity,
      wastePercentage,
      avgEfficiency
    };
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!reportData || reportData.length === 0) return [];
    
    // Sort by date
    const sortedData = [...reportData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Limit to last 10 for better visualization
    const recentData = sortedData.slice(-10);
    
    return recentData.map(report => ({
      date: format(new Date(report.date), 'MM/dd'),
      ordered: report.metrics.totalQuantity,
      completed: report.metrics.completedQuantity,
      efficiency: report.metrics.efficiency,
      waste: report.metrics.wastePercentage,
      id: report.id
    }));
  };
  
  // Prepare pie chart data for status breakdown
  const prepareStatusChartData = () => {
    if (!reportData || reportData.length === 0) return [];
    
    const statusCounts = reportData.reduce((acc: {[key: string]: number}, report) => {
      const status = report.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };
  
  // Prepare table columns
  const productionReportColumns = [
    { 
      header: t("reports.order_id"), 
      accessorKey: "id" 
    },
    { 
      header: t("reports.date"), 
      accessorKey: "date",
      cell: (row: any) => formatDateString(row.date)
    },
    { 
      header: t("reports.customer"), 
      accessorKey: "customer.name" 
    },
    { 
      header: t("reports.status"), 
      accessorKey: "status",
      cell: (row: any) => (
        <Badge className={
          row.status === "completed" ? "bg-green-100 text-green-800" :
          row.status === "processing" ? "bg-blue-100 text-blue-800" :
          "bg-gray-100 text-gray-800"
        }>
          {row.status}
        </Badge>
      )
    },
    { 
      header: t("reports.ordered_quantity"), 
      accessorKey: "metrics.totalQuantity",
      cell: (row: any) => formatNumber(row.metrics.totalQuantity, 1)
    },
    { 
      header: t("reports.completed_quantity"), 
      accessorKey: "metrics.completedQuantity",
      cell: (row: any) => formatNumber(row.metrics.completedQuantity, 1)
    },
    { 
      header: t("reports.waste"), 
      accessorKey: "metrics.wastePercentage",
      cell: (row: any) => `${formatNumber(row.metrics.wastePercentage, 1)}%`
    },
    { 
      header: t("reports.efficiency"), 
      accessorKey: "metrics.efficiency",
      cell: (row: any) => `${formatNumber(row.metrics.efficiency, 1)}%`
    }
  ];
  
  // Render loading state
  if (reportLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">
            {t("reports.production_report")}
          </h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.production_analytics")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full mb-4" />
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const summaryMetrics = calculateSummaryMetrics();
  const chartData = prepareChartData();
  const statusChartData = prepareStatusChartData();
  const STATUS_COLORS = ["#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#F44336"];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-700">
          {t("reports.production_report")}
        </h1>
      </div>
      
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.start_date")}</label>
              <DatePicker
                selected={filters.startDate}
                onSelect={(date) => setFilters({ ...filters, startDate: date })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.end_date")}</label>
              <DatePicker
                selected={filters.endDate}
                onSelect={(date) => setFilters({ ...filters, endDate: date })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.customer")}</label>
              <Select 
                value={filters.customerId || "all_customers"} 
                onValueChange={(value) => setFilters({ ...filters, customerId: value === "all_customers" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_customers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_customers">{t("reports.all_customers")}</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.status")}</label>
              <Select 
                value={filters.status || "all_statuses"} 
                onValueChange={(value) => setFilters({ ...filters, status: value === "all_statuses" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_statuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_statuses">{t("reports.all_statuses")}</SelectItem>
                  <SelectItem value="pending">{t("common.pending")}</SelectItem>
                  <SelectItem value="processing">{t("common.processing")}</SelectItem>
                  <SelectItem value="completed">{t("common.completed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end space-x-2">
              <Button className="flex-1" onClick={resetFilters} variant="outline">
                <span className="material-icons text-sm mr-1">refresh</span>
                {t("reports.reset")}
              </Button>
              <Button className="flex-1" onClick={() => refetchReport()}>
                <span className="material-icons text-sm mr-1">filter_alt</span>
                {t("reports.apply")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t("reports.total_orders")}</p>
                <h3 className="text-2xl font-bold">{summaryMetrics.totalOrders}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="material-icons text-blue-500">receipt</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t("reports.total_production")}</p>
                <h3 className="text-2xl font-bold">{formatNumber(summaryMetrics.totalQuantity, 1)} kg</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="material-icons text-green-500">inventory</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t("reports.waste_percentage")}</p>
                <h3 className="text-2xl font-bold">{formatNumber(summaryMetrics.wastePercentage, 1)}%</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="material-icons text-amber-500">delete</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t("reports.avg_efficiency")}</p>
                <h3 className="text-2xl font-bold">{formatNumber(summaryMetrics.avgEfficiency, 1)}%</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="material-icons text-purple-500">trending_up</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts and Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.production_analytics")}</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData && reportData.length > 0 ? (
            <>
              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="col-span-2">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">{t("reports.production_trends")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => [`${value} kg`, ""]} />
                          <Legend />
                          <Bar 
                            dataKey="ordered" 
                            name={t("reports.ordered_quantity")} 
                            fill="#8884d8" 
                          />
                          <Bar 
                            dataKey="completed" 
                            name={t("reports.completed_quantity")} 
                            fill="#82ca9d" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">{t("reports.order_status")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [value, ""]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Efficiency and Waste Trends */}
              <Card className="mb-8">
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">{t("reports.efficiency_waste_trends")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`${value}%`, ""]} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="efficiency" 
                          name={t("reports.efficiency")} 
                          stroke="#4caf50" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="waste" 
                          name={t("reports.waste")} 
                          stroke="#ff9800" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Production Report Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t("reports.production_report_data")}</h3>
                
                {reportError ? (
                  <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                    {t("common.error_loading_data")}
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="p-6 text-center">
                    <span className="material-icons text-4xl text-gray-300 mb-2">assignment</span>
                    <p className="text-gray-500">{t("reports.no_data_available")}</p>
                    <p className="text-sm text-gray-400 mt-1">{t("reports.try_different_filters")}</p>
                  </div>
                ) : (
                  <>
                    {isMobile ? (
                      <div className="space-y-4">
                        {reportData.map((report) => (
                          <Card key={report.id} className="overflow-hidden">
                            <CardHeader className="p-4 bg-gray-50">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-medium">#{report.id}</CardTitle>
                                <Badge className={
                                  report.status === "completed" ? "bg-green-100 text-green-800" :
                                  report.status === "processing" ? "bg-blue-100 text-blue-800" :
                                  "bg-gray-100 text-gray-800"
                                }>
                                  {report.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500">{t("reports.date")}</p>
                                  <p className="text-sm font-medium">{formatDateString(report.date)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">{t("reports.customer")}</p>
                                  <p className="text-sm font-medium truncate">{report.customer.name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">{t("reports.ordered_quantity")}</p>
                                  <p className="text-sm font-medium">{formatNumber(report.metrics.totalQuantity, 1)} kg</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">{t("reports.completed_quantity")}</p>
                                  <p className="text-sm font-medium">{formatNumber(report.metrics.completedQuantity, 1)} kg</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">{t("reports.waste")}</p>
                                  <p className="text-sm font-medium">{formatNumber(report.metrics.wastePercentage, 1)}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">{t("reports.efficiency")}</p>
                                  <p className="text-sm font-medium">{formatNumber(report.metrics.efficiency, 1)}%</p>
                                </div>
                              </div>
                              <Separator className="my-3" />
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => setSelectedReport(report)}
                              >
                                <span className="material-icons text-xs mr-1">visibility</span>
                                {t("reports.view_details")}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <DataTable
                        data={reportData}
                        columns={productionReportColumns as any}
                        onRowClick={(row) => setSelectedReport(row)}
                      />
                    )}
                  </>
                )}
              </div>
              
              {/* Export buttons */}
              <div className="flex justify-end mt-6 space-x-2">
                <Button variant="outline">
                  <span className="material-icons text-sm mr-1">download</span>
                  {t("reports.export_excel")}
                </Button>
                <Button variant="outline">
                  <span className="material-icons text-sm mr-1">print</span>
                  {t("reports.print_report")}
                </Button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <span className="material-icons text-4xl text-gray-300 mb-2">assignment</span>
              <p className="text-gray-500">{t("reports.no_data_available")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("reports.try_different_filters")}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Report Details Modal (In a full implementation, this would be a proper modal) */}
      {selectedReport && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("reports.order_details")} #{selectedReport.id}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
              <span className="material-icons">close</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">{t("reports.customer")}</h4>
                <p>{selectedReport.customer.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">{t("reports.date")}</h4>
                <p>{formatDateString(selectedReport.date)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">{t("reports.status")}</h4>
                <Badge className={
                  selectedReport.status === "completed" ? "bg-green-100 text-green-800" :
                  selectedReport.status === "processing" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"
                }>
                  {selectedReport.status}
                </Badge>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <h4 className="font-medium mb-3">{t("reports.products")}</h4>
            <div className="overflow-hidden rounded-md border mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 text-left font-medium">{t("reports.product_name")}</th>
                    <th className="py-2 px-4 text-left font-medium">{t("reports.size")}</th>
                    <th className="py-2 px-4 text-left font-medium">{t("reports.quantity")} (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.products.map((product, index) => (
                    <tr key={index} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                      <td className="py-2 px-4">{product.name}</td>
                      <td className="py-2 px-4">{product.size}</td>
                      <td className="py-2 px-4">{formatNumber(product.quantity, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <h4 className="font-medium mb-3">{t("reports.production_metrics")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">{t("reports.ordered_quantity")}</span>
                    <span className="text-lg font-semibold">{formatNumber(selectedReport.metrics.totalQuantity, 1)} kg</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">{t("reports.completed_quantity")}</span>
                    <span className="text-lg font-semibold">{formatNumber(selectedReport.metrics.completedQuantity, 1)} kg</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">{t("reports.efficiency")}</span>
                    <span className="text-lg font-semibold">{formatNumber(selectedReport.metrics.efficiency, 1)}%</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">{t("reports.extrusion_quantity")}</span>
                    <span className="text-lg font-semibold">{formatNumber(selectedReport.metrics.extrusionQuantity, 1)} kg</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">{t("reports.printing_quantity")}</span>
                    <span className="text-lg font-semibold">{formatNumber(selectedReport.metrics.printingQuantity, 1)} kg</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">{t("reports.waste")}</span>
                    <span className="text-lg font-semibold">{formatNumber(selectedReport.metrics.wastePercentage, 1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Separator className="my-4" />
            
            <h4 className="font-medium mb-3">{t("reports.job_orders")}</h4>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 text-left font-medium">{t("reports.job_order_id")}</th>
                    <th className="py-2 px-4 text-left font-medium">{t("reports.quantity")} (kg)</th>
                    <th className="py-2 px-4 text-left font-medium">{t("reports.status")}</th>
                    <th className="py-2 px-4 text-left font-medium">{t("reports.completed_date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.jobOrders.map((jobOrder, index) => (
                    <tr key={index} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                      <td className="py-2 px-4">{jobOrder.id}</td>
                      <td className="py-2 px-4">{formatNumber(jobOrder.quantity, 1)}</td>
                      <td className="py-2 px-4">
                        <Badge className={
                          jobOrder.status === "completed" ? "bg-green-100 text-green-800" :
                          jobOrder.status === "processing" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {jobOrder.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-4">
                        {jobOrder.completedDate ? formatDateString(jobOrder.completedDate.toString()) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}