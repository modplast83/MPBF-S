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
import { User, Section } from "@shared/schema";

// Interface for workflow report data
interface WorkflowReportData {
  sections: SectionData[];
  operators: OperatorData[];
  items: ItemData[];
}

interface SectionData {
  id: string;
  name: string;
  rollCount: number;
  totalQuantity: number;
  wasteQuantity: number;
  wastePercentage: number;
  efficiency: number;
  productionTime: number; // In hours
}

interface OperatorData {
  id: string;
  name: string;
  section: string;
  jobsCount: number;
  rollsProcessed: number;
  totalQuantity: number;
  productionTime: number; // In hours
  efficiency: number;
}

interface ItemData {
  id: number;
  name: string;
  category: string;
  jobsCount: number;
  totalQuantity: number;
  finishedQuantity: number;
  wasteQuantity: number;
  wastePercentage: number;
}

export default function WorkflowReportsPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("sections");
  
  // State for filters
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    sectionId: "",
    operatorId: "",
    itemId: ""
  });
  
  // Fetch users for operators filter dropdown
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });
  
  // Fetch sections for sections filter dropdown
  const { data: sections, isLoading: sectionsLoading } = useQuery<Section[]>({
    queryKey: [API_ENDPOINTS.SECTIONS],
  });
  
  // Fetch items for items filter dropdown
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ITEMS],
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
    
    if (filters.sectionId) {
      params.append('sectionId', filters.sectionId);
    }
    
    if (filters.operatorId) {
      params.append('operatorId', filters.operatorId);
    }
    
    if (filters.itemId) {
      params.append('itemId', filters.itemId);
    }
    
    return params.toString();
  };
  
  // Fetch workflow report data with filters
  const { 
    data: reportData, 
    isLoading: reportLoading, 
    refetch: refetchReport,
    isError: reportError
  } = useQuery<WorkflowReportData>({
    queryKey: [`/api/reports/workflow?${buildQueryParams()}`],
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
      sectionId: "",
      operatorId: "",
      itemId: ""
    });
  };
  
  // Prepare sections columns
  const sectionsColumns = [
    { 
      header: t("reports.section_id"), 
      accessorKey: "id" 
    },
    { 
      header: t("reports.section_name"), 
      accessorKey: "name" 
    },
    { 
      header: t("reports.rolls_count"), 
      accessorKey: "rollCount" 
    },
    { 
      header: t("reports.total_quantity"), 
      accessorKey: "totalQuantity",
      cell: (row: any) => `${formatNumber(row.totalQuantity, 1)} kg`
    },
    { 
      header: t("reports.waste_quantity"), 
      accessorKey: "wasteQuantity",
      cell: (row: any) => `${formatNumber(row.wasteQuantity, 1)} kg`
    },
    { 
      header: t("reports.waste_percentage"), 
      accessorKey: "wastePercentage",
      cell: (row: any) => `${formatNumber(row.wastePercentage, 1)}%`
    },
    { 
      header: t("reports.efficiency"), 
      accessorKey: "efficiency",
      cell: (row: any) => `${formatNumber(row.efficiency, 1)}%`
    },
    { 
      header: t("reports.production_time"), 
      accessorKey: "productionTime",
      cell: (row: any) => `${formatNumber(row.productionTime, 1)} ${t("performance.hours")}`
    }
  ];
  
  // Prepare operators columns
  const operatorsColumns = [
    { 
      header: t("reports.operator_id"), 
      accessorKey: "id" 
    },
    { 
      header: t("reports.operator_name"), 
      accessorKey: "name" 
    },
    { 
      header: t("reports.section"), 
      accessorKey: "section" 
    },
    { 
      header: t("reports.jobs_count"), 
      accessorKey: "jobsCount" 
    },
    { 
      header: t("reports.rolls_processed"), 
      accessorKey: "rollsProcessed" 
    },
    { 
      header: t("reports.total_quantity"), 
      accessorKey: "totalQuantity",
      cell: (row: any) => `${formatNumber(row.totalQuantity, 1)} kg`
    },
    { 
      header: t("reports.production_time"), 
      accessorKey: "productionTime",
      cell: (row: any) => `${formatNumber(row.productionTime, 1)} ${t("performance.hours")}`
    },
    { 
      header: t("reports.efficiency"), 
      accessorKey: "efficiency",
      cell: (row: any) => `${formatNumber(row.efficiency, 1)}%`
    }
  ];
  
  // Prepare items columns
  const itemsColumns = [
    { 
      header: t("reports.item_id"), 
      accessorKey: "id" 
    },
    { 
      header: t("reports.item_name"), 
      accessorKey: "name" 
    },
    { 
      header: t("reports.category"), 
      accessorKey: "category" 
    },
    { 
      header: t("reports.jobs_count"), 
      accessorKey: "jobsCount" 
    },
    { 
      header: t("reports.total_quantity"), 
      accessorKey: "totalQuantity",
      cell: (row: any) => `${formatNumber(row.totalQuantity, 1)} kg`
    },
    { 
      header: t("reports.finished_quantity"), 
      accessorKey: "finishedQuantity",
      cell: (row: any) => `${formatNumber(row.finishedQuantity, 1)} kg`
    },
    { 
      header: t("reports.waste_quantity"), 
      accessorKey: "wasteQuantity",
      cell: (row: any) => `${formatNumber(row.wasteQuantity, 1)} kg`
    },
    { 
      header: t("reports.waste_percentage"), 
      accessorKey: "wastePercentage",
      cell: (row: any) => `${formatNumber(row.wastePercentage, 1)}%`
    }
  ];
  
  // Prepare chart data for sections
  const prepareSectionsChartData = () => {
    if (!reportData || !reportData.sections || reportData.sections.length === 0) return [];
    return reportData.sections.map(section => ({
      name: section.name,
      totalQuantity: section.totalQuantity,
      wasteQuantity: section.wasteQuantity,
      efficiency: section.efficiency
    }));
  };
  
  // Prepare chart data for operators
  const prepareOperatorsChartData = () => {
    if (!reportData || !reportData.operators || reportData.operators.length === 0) return [];
    return reportData.operators.map(operator => ({
      name: operator.name,
      rollsProcessed: operator.rollsProcessed,
      totalQuantity: operator.totalQuantity,
      efficiency: operator.efficiency
    }));
  };
  
  // Prepare chart data for items
  const prepareItemsChartData = () => {
    if (!reportData || !reportData.items || reportData.items.length === 0) return [];
    return reportData.items.map(item => ({
      name: item.name,
      totalQuantity: item.totalQuantity,
      finishedQuantity: item.finishedQuantity,
      wasteQuantity: item.wasteQuantity
    }));
  };
  
  // Render loading state
  if (reportLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">
            {t("reports.workflow_report")}
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
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-60 w-full mb-4" />
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const sectionsChartData = prepareSectionsChartData();
  const operatorsChartData = prepareOperatorsChartData();
  const itemsChartData = prepareItemsChartData();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-700">
          {t("reports.workflow_report")}
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
              <label className="block text-sm font-medium mb-1">{t("reports.section")}</label>
              <Select 
                value={filters.sectionId || "all_sections"} 
                onValueChange={(value) => setFilters({ ...filters, sectionId: value === "all_sections" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_sections")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_sections">{t("reports.all_sections")}</SelectItem>
                  {sections?.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.operator")}</label>
              <Select 
                value={filters.operatorId || "all_operators"} 
                onValueChange={(value) => setFilters({ ...filters, operatorId: value === "all_operators" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_operators")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_operators">{t("reports.all_operators")}</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username}
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
      
      {/* Tabs for different report types */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.workflow_analytics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="sections" className="flex-1">
                <span className="material-icons text-sm mr-2">category</span>
                {t("reports.by_section")}
              </TabsTrigger>
              <TabsTrigger value="operators" className="flex-1">
                <span className="material-icons text-sm mr-2">person</span>
                {t("reports.by_operator")}
              </TabsTrigger>
              <TabsTrigger value="items" className="flex-1">
                <span className="material-icons text-sm mr-2">ballot</span>
                {t("reports.by_item")}
              </TabsTrigger>
            </TabsList>
            
            {/* Sections Tab */}
            <TabsContent value="sections" className="py-2">
              {reportData && reportData.sections && reportData.sections.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">{t("reports.section_performance")}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sectionsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalQuantity" name={t("reports.total_quantity")} fill="#2196F3" />
                        <Bar yAxisId="left" dataKey="wasteQuantity" name={t("reports.waste_quantity")} fill="#F44336" />
                        <Bar yAxisId="right" dataKey="efficiency" name={t("reports.efficiency")} fill="#4CAF50" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">{t("reports.section_details")}</h3>
                    <DataTable
                      data={reportData.sections}
                      columns={sectionsColumns as any}
                    />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <span className="material-icons text-4xl text-gray-300 mb-2">assignment</span>
                  <p className="text-gray-500">{t("reports.no_data_available")}</p>
                </div>
              )}
            </TabsContent>
            
            {/* Operators Tab */}
            <TabsContent value="operators" className="py-2">
              {reportData && reportData.operators && reportData.operators.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">{t("reports.operator_performance")}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={operatorsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalQuantity" name={t("reports.total_quantity")} fill="#2196F3" />
                        <Bar yAxisId="left" dataKey="rollsProcessed" name={t("reports.rolls_processed")} fill="#FF9800" />
                        <Bar yAxisId="right" dataKey="efficiency" name={t("reports.efficiency")} fill="#4CAF50" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">{t("reports.operator_details")}</h3>
                    <DataTable
                      data={reportData.operators}
                      columns={operatorsColumns as any}
                    />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <span className="material-icons text-4xl text-gray-300 mb-2">assignment</span>
                  <p className="text-gray-500">{t("reports.no_data_available")}</p>
                </div>
              )}
            </TabsContent>
            
            {/* Items Tab */}
            <TabsContent value="items" className="py-2">
              {reportData && reportData.items && reportData.items.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">{t("reports.item_performance")}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={itemsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalQuantity" name={t("reports.total_quantity")} fill="#2196F3" />
                        <Bar dataKey="finishedQuantity" name={t("reports.finished_quantity")} fill="#4CAF50" />
                        <Bar dataKey="wasteQuantity" name={t("reports.waste_quantity")} fill="#F44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">{t("reports.item_details")}</h3>
                    <DataTable
                      data={reportData.items}
                      columns={itemsColumns as any}
                    />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <span className="material-icons text-4xl text-gray-300 mb-2">assignment</span>
                  <p className="text-gray-500">{t("reports.no_data_available")}</p>
                </div>
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
        </CardContent>
      </Card>
    </div>
  );
}