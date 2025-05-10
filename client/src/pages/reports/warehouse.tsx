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
import { Progress } from "@/components/ui/progress";
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

// Types for warehouse report data
interface WarehouseReportData {
  currentInventory: {
    id: number;
    name: string;
    type: string;
    quantity: number | null;
    unit: string;
    lastUpdated: Date;
  }[];
  inventoryHistory: {
    id: number;
    date: Date;
    user: {
      id: string;
      name: string;
    };
    notes: string | null;
    materials: {
      id: number;
      name: string;
      quantity: number;
      unit: string;
    }[];
  }[];
}

export default function WarehouseReportsPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // State for filters
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    materialType: "",
    materialId: ""
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
    
    if (filters.materialType) {
      params.append('materialType', filters.materialType);
    }
    
    if (filters.materialId) {
      params.append('materialId', filters.materialId);
    }
    
    return params.toString();
  };
  
  // Fetch warehouse report data with filters
  const { 
    data: reportData, 
    isLoading: reportLoading, 
    refetch: refetchReport,
    isError: reportError
  } = useQuery<WarehouseReportData>({
    queryKey: [`/api/reports/warehouse?${buildQueryParams()}`],
    enabled: true,
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
      materialType: "",
      materialId: ""
    });
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    if (!reportData) {
      return {
        totalMaterials: 0,
        totalQuantity: 0,
        materialTypes: 0,
        recentUpdates: 0
      };
    }

    const totalMaterials = reportData.currentInventory.length;
    const totalQuantity = reportData.currentInventory.reduce((sum, material) => 
      sum + (material.quantity || 0), 0);
    
    // Count unique material types
    const uniqueTypes = new Set(reportData.currentInventory.map(material => material.type));
    const materialTypes = uniqueTypes.size;
    
    // Count recent updates (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentUpdates = reportData.inventoryHistory.filter(update => 
      new Date(update.date) >= oneWeekAgo).length;
    
    return {
      totalMaterials,
      totalQuantity,
      materialTypes,
      recentUpdates
    };
  };

  // Prepare data for inventory by type chart
  const prepareInventoryTypeChartData = () => {
    if (!reportData) return [];
    
    const inventoryByType = reportData.currentInventory.reduce((acc: {[key: string]: number}, material) => {
      const type = material.type;
      acc[type] = (acc[type] || 0) + (material.quantity || 0);
      return acc;
    }, {});
    
    return Object.entries(inventoryByType).map(([type, quantity]) => ({
      name: type,
      value: quantity
    }));
  };

  // Prepare data for inventory history chart
  const prepareInventoryHistoryData = () => {
    if (!reportData) return [];
    
    // Group inventory history by date
    const historyByDate = reportData.inventoryHistory.reduce((acc: {[key: string]: number}, history) => {
      const dateStr = new Date(history.date).toISOString().split('T')[0];
      
      // Sum up the quantities of all materials in this input
      const totalQuantity = history.materials.reduce((sum, material) => sum + material.quantity, 0);
      
      acc[dateStr] = (acc[dateStr] || 0) + totalQuantity;
      return acc;
    }, {});
    
    // Convert to array format sorted by date
    return Object.entries(historyByDate)
      .map(([date, quantity]) => ({
        date: format(new Date(date), 'MM/dd'),
        quantity
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Prepare table columns for current inventory
  const inventoryColumns = [
    { 
      header: t("reports.material_id"), 
      accessorKey: "id" 
    },
    { 
      header: t("reports.material_name"), 
      accessorKey: "name" 
    },
    { 
      header: t("reports.material_type"), 
      accessorKey: "type" 
    },
    { 
      header: t("reports.quantity"), 
      accessorKey: "quantity",
      cell: (row: any) => `${formatNumber(row.quantity || 0, 1)} ${row.unit}`
    },
    { 
      header: t("reports.last_updated"), 
      accessorKey: "lastUpdated",
      cell: (row: any) => formatDateString(row.lastUpdated)
    }
  ];

  // Prepare table columns for inventory history
  const historyColumns = [
    { 
      header: t("reports.date"), 
      accessorKey: "date",
      cell: (row: any) => formatDateString(row.date)
    },
    { 
      header: t("reports.user"), 
      accessorKey: "user.name" 
    },
    { 
      header: t("reports.materials_count"), 
      accessorKey: "materialsCount",
      cell: (row: any) => row.materials.length
    },
    { 
      header: t("reports.total_quantity"), 
      accessorKey: "totalQuantity",
      cell: (row: any) => {
        const total = row.materials.reduce((sum: number, material: any) => sum + material.quantity, 0);
        return formatNumber(total, 1);
      }
    },
    { 
      header: t("reports.notes"), 
      accessorKey: "notes",
      cell: (row: any) => row.notes || "-"
    }
  ];

  // Render loading state
  if (reportLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">
            {t("reports.warehouse_reports")}
          </h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle>{t("reports.inventory_analysis")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full mb-4" />
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics and prepare chart data
  const summaryMetrics = calculateSummaryMetrics();
  const inventoryTypeChartData = prepareInventoryTypeChartData();
  const inventoryHistoryData = prepareInventoryHistoryData();
  
  // Define colors for charts
  const INVENTORY_COLORS = ["#3f51b5", "#2196f3", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-700">
          {t("reports.warehouse_reports")}
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
              <label className="block text-sm font-medium mb-1">{t("reports.material_type")}</label>
              <Select 
                value={filters.materialType || "all_types"} 
                onValueChange={(value) => setFilters({ ...filters, materialType: value === "all_types" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_types")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">{t("reports.all_types")}</SelectItem>
                  {reportData && Array.from(new Set(reportData.currentInventory.map(item => item.type))).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.material")}</label>
              <Select 
                value={filters.materialId || "all_materials"} 
                onValueChange={(value) => setFilters({ ...filters, materialId: value === "all_materials" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_materials")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_materials">{t("reports.all_materials")}</SelectItem>
                  {reportData && reportData.currentInventory.map((material) => (
                    <SelectItem key={material.id} value={material.id.toString()}>
                      {material.name}
                    </SelectItem>
                  ))}
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
                <p className="text-sm text-gray-500">{t("reports.total_materials")}</p>
                <h3 className="text-2xl font-bold">{summaryMetrics.totalMaterials}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="material-icons text-blue-500">inventory_2</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t("reports.total_inventory")}</p>
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
                <p className="text-sm text-gray-500">{t("reports.material_types")}</p>
                <h3 className="text-2xl font-bold">{summaryMetrics.materialTypes}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="material-icons text-purple-500">category</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t("reports.recent_updates")}</p>
                <h3 className="text-2xl font-bold">{summaryMetrics.recentUpdates}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="material-icons text-amber-500">update</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.inventory_analysis")}</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData ? (
            <>
              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">{t("reports.inventory_by_type")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={inventoryTypeChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {inventoryTypeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={INVENTORY_COLORS[index % INVENTORY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`${formatNumber(value, 1)} kg`, ""]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">{t("reports.inventory_history")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={inventoryHistoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => [`${formatNumber(value, 1)} kg`, ""]} />
                          <Bar 
                            dataKey="quantity" 
                            name={t("reports.quantity_added")} 
                            fill="#2196f3" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Inventory Tabs */}
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="current">{t("reports.current_inventory")}</TabsTrigger>
                  <TabsTrigger value="history">{t("reports.inventory_history")}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="current" className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">{t("reports.current_inventory")}</h3>
                  
                  {reportError ? (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                      {t("common.error_loading_data")}
                    </div>
                  ) : reportData.currentInventory.length === 0 ? (
                    <div className="p-6 text-center">
                      <span className="material-icons text-4xl text-gray-300 mb-2">inventory_2</span>
                      <p className="text-gray-500">{t("reports.no_inventory_data")}</p>
                    </div>
                  ) : (
                    <>
                      {isMobile ? (
                        <div className="space-y-4">
                          {reportData.currentInventory.map((material) => (
                            <Card key={material.id} className="overflow-hidden">
                              <CardHeader className="p-4 bg-gray-50">
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-base font-medium">{material.name}</CardTitle>
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                    {material.type}
                                  </span>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs text-gray-500">{t("reports.material_id")}</p>
                                    <p className="text-sm font-medium">{material.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">{t("reports.quantity")}</p>
                                    <p className="text-sm font-medium">{formatNumber(material.quantity || 0, 1)} {material.unit}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-500">{t("reports.last_updated")}</p>
                                    <p className="text-sm font-medium">{formatDateString(material.lastUpdated)}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <DataTable
                          data={reportData.currentInventory}
                          columns={inventoryColumns as any}
                        />
                      )}
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="history" className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">{t("reports.inventory_history")}</h3>
                  
                  {reportError ? (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                      {t("common.error_loading_data")}
                    </div>
                  ) : reportData.inventoryHistory.length === 0 ? (
                    <div className="p-6 text-center">
                      <span className="material-icons text-4xl text-gray-300 mb-2">history</span>
                      <p className="text-gray-500">{t("reports.no_history_data")}</p>
                    </div>
                  ) : (
                    <>
                      {isMobile ? (
                        <div className="space-y-4">
                          {reportData.inventoryHistory.map((history) => (
                            <Card key={history.id} className="overflow-hidden">
                              <CardHeader className="p-4 bg-gray-50">
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-base font-medium">
                                    {formatDateString(history.date)}
                                  </CardTitle>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs text-gray-500">{t("reports.user")}</p>
                                    <p className="text-sm font-medium">{history.user.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">{t("reports.materials")}</p>
                                    <div className="mt-1 space-y-1">
                                      {history.materials.map((material, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span>{material.name}</span>
                                          <span className="font-medium">{formatNumber(material.quantity, 1)} {material.unit}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {history.notes && (
                                    <div>
                                      <p className="text-xs text-gray-500">{t("reports.notes")}</p>
                                      <p className="text-sm">{history.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <DataTable
                          data={reportData.inventoryHistory}
                          columns={historyColumns as any}
                        />
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
              
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
              <span className="material-icons text-4xl text-gray-300 mb-2">inventory_2</span>
              <p className="text-gray-500">{t("reports.no_data_available")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("reports.try_different_filters")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}