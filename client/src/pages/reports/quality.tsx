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
import { formatDateString } from "@/lib/utils";

// Interface for quality report data
interface QualityReportData {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  passRate: number;
  checks: {
    id: number;
    date: string;
    type: {
      id: string;
      name: string;
      stage: string;
    };
    roll: {
      id: string;
      serialNumber: string;
      status: string;
    } | null;
    jobOrder: {
      id: number;
      status: string;
    } | null;
    result: "Pass" | "Fail";
    notes: string | null;
    correctiveActions: {
      id: number;
      action: string;
      implementedBy: string;
      implementationDate: string;
    }[];
  }[];
}

export default function QualityReportsPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // State for filters
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    stage: "",
    rollId: "",
    jobOrderId: ""
  });
  
  // Selected quality check for details
  const [selectedCheck, setSelectedCheck] = useState<QualityReportData['checks'][0] | null>(null);
  
  // Build the query parameters string for filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    
    if (filters.stage) {
      params.append('stage', filters.stage);
    }
    
    if (filters.rollId) {
      params.append('rollId', filters.rollId);
    }
    
    if (filters.jobOrderId) {
      params.append('jobOrderId', filters.jobOrderId);
    }
    
    return params.toString();
  };
  
  // Fetch quality report data with filters
  const { 
    data: reportData, 
    isLoading: reportLoading, 
    refetch: refetchReport,
    isError: reportError
  } = useQuery<QualityReportData>({
    queryKey: [`/api/reports/quality?${buildQueryParams()}`],
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
      stage: "",
      rollId: "",
      jobOrderId: ""
    });
  };
  
  // Prepare data for quality checks by stage chart
  const prepareQualityByStageData = () => {
    if (!reportData) return [];
    
    const stageData = reportData.checks.reduce((acc: {[key: string]: {passed: number; failed: number}}, check) => {
      const stage = check.type.stage;
      
      if (!acc[stage]) {
        acc[stage] = { passed: 0, failed: 0 };
      }
      
      if (check.result === "Pass") {
        acc[stage].passed += 1;
      } else {
        acc[stage].failed += 1;
      }
      
      return acc;
    }, {});
    
    return Object.entries(stageData).map(([stage, counts]) => ({
      stage,
      passed: counts.passed,
      failed: counts.failed,
      total: counts.passed + counts.failed
    }));
  };
  
  // Prepare data for quality trend chart
  const prepareQualityTrendData = () => {
    if (!reportData) return [];
    
    // Group checks by date
    const checksByDate = reportData.checks.reduce((acc: {[key: string]: {passed: number; failed: number}}, check) => {
      const date = new Date(check.date).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = { passed: 0, failed: 0 };
      }
      
      if (check.result === "Pass") {
        acc[date].passed += 1;
      } else {
        acc[date].failed += 1;
      }
      
      return acc;
    }, {});
    
    // Convert to array format sorted by date
    return Object.entries(checksByDate)
      .map(([date, counts]) => {
        const total = counts.passed + counts.failed;
        const passRate = total > 0 ? (counts.passed / total) * 100 : 0;
        
        return {
          date: format(new Date(date), 'MM/dd'),
          passed: counts.passed,
          failed: counts.failed,
          passRate: parseFloat(passRate.toFixed(1))
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  };
  
  // Prepare table columns for quality checks
  const qualityColumns = [
    { 
      header: t("reports.id"), 
      accessorKey: "id" 
    },
    { 
      header: t("reports.date"), 
      accessorKey: "date",
      cell: (row: any) => formatDateString(row.date)
    },
    { 
      header: t("reports.check_type"), 
      accessorKey: "type.name" 
    },
    { 
      header: t("reports.stage"), 
      accessorKey: "type.stage" 
    },
    { 
      header: t("reports.roll"), 
      accessorKey: "roll.serialNumber",
      cell: (row: any) => row.roll ? row.roll.serialNumber : "-"
    },
    { 
      header: t("reports.result"), 
      accessorKey: "result",
      cell: (row: any) => (
        <Badge className={row.result === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          {row.result}
        </Badge>
      )
    },
    { 
      header: t("reports.corrective_actions"), 
      accessorKey: "correctiveActionsCount",
      cell: (row: any) => row.correctiveActions.length
    }
  ];
  
  // Render loading state
  if (reportLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">
            {t("reports.quality_report")}
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.quality_analysis")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full mb-4" />
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Colors for charts
  const QUALITY_COLORS = {
    pass: "#4caf50",
    fail: "#f44336",
    neutral: "#2196f3"
  };
  
  // Prepare chart data
  const qualityByStageData = prepareQualityByStageData();
  const qualityTrendData = prepareQualityTrendData();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-700">
          {t("reports.quality_report")}
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
              <label className="block text-sm font-medium mb-1">{t("reports.stage")}</label>
              <Select value={filters.stage} onValueChange={(value) => setFilters({ ...filters, stage: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_stages")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("reports.all_stages")}</SelectItem>
                  <SelectItem value="extrusion">{t("common.extrusion")}</SelectItem>
                  <SelectItem value="printing">{t("common.printing")}</SelectItem>
                  <SelectItem value="cutting">{t("common.cutting")}</SelectItem>
                  <SelectItem value="completed">{t("common.completed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.roll_id")}</label>
              <Select value={filters.rollId} onValueChange={(value) => setFilters({ ...filters, rollId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_rolls")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("reports.all_rolls")}</SelectItem>
                  {reportData && [...new Set(reportData.checks.filter(c => c.roll).map(c => c.roll?.id))].map((rollId) => (
                    rollId && <SelectItem key={rollId} value={rollId}>{rollId}</SelectItem>
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
      
      {reportData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{t("reports.total_checks")}</p>
                    <h3 className="text-2xl font-bold">{reportData.totalChecks}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="material-icons text-blue-500">checklist</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{t("reports.pass_rate")}</p>
                    <h3 className="text-2xl font-bold">{reportData.passRate.toFixed(1)}%</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="material-icons text-green-500">check_circle</span>
                  </div>
                </div>
                <Progress 
                  value={reportData.passRate} 
                  className="h-2 mt-4" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{t("reports.failed_checks")}</p>
                    <h3 className="text-2xl font-bold">{reportData.failedChecks}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="material-icons text-red-500">error</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts and Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t("reports.quality_analysis")}</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.checks.length > 0 ? (
                <>
                  {/* Charts Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                      <CardHeader className="pb-0">
                        <CardTitle className="text-base">{t("reports.quality_by_stage")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={qualityByStageData}
                              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="stage" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar 
                                dataKey="passed" 
                                name={t("reports.passed")} 
                                stackId="a" 
                                fill={QUALITY_COLORS.pass} 
                              />
                              <Bar 
                                dataKey="failed" 
                                name={t("reports.failed")} 
                                stackId="a" 
                                fill={QUALITY_COLORS.fail} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-0">
                        <CardTitle className="text-base">{t("reports.quality_trend")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={qualityTrendData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                              <Tooltip />
                              <Legend />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="passed" 
                                name={t("reports.passed")} 
                                stroke={QUALITY_COLORS.pass} 
                              />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="failed" 
                                name={t("reports.failed")} 
                                stroke={QUALITY_COLORS.fail} 
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="passRate" 
                                name={t("reports.pass_rate")} 
                                stroke={QUALITY_COLORS.neutral}
                                strokeDasharray="5 5" 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Pass/Fail Distribution */}
                  <Card className="mb-8">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base">{t("reports.pass_fail_distribution")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: t("reports.passed"), value: reportData.passedChecks },
                                  { name: t("reports.failed"), value: reportData.failedChecks }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill={QUALITY_COLORS.pass} />
                                <Cell fill={QUALITY_COLORS.fail} />
                              </Pie>
                              <Tooltip formatter={(value: any) => [value, ""]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 pl-8">
                          <div className="space-y-6">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {t("reports.passed")} ({reportData.passedChecks})
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  {((reportData.passedChecks / reportData.totalChecks) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={(reportData.passedChecks / reportData.totalChecks) * 100} 
                                className="h-2 bg-gray-100" 
                                indicatorClassName="bg-green-500"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {t("reports.failed")} ({reportData.failedChecks})
                                </span>
                                <span className="text-sm font-medium text-red-600">
                                  {((reportData.failedChecks / reportData.totalChecks) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={(reportData.failedChecks / reportData.totalChecks) * 100} 
                                className="h-2 bg-gray-100" 
                                indicatorClassName="bg-red-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Quality Checks Table */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t("reports.quality_checks")}</h3>
                    
                    {reportError ? (
                      <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        {t("common.error_loading_data")}
                      </div>
                    ) : reportData.checks.length === 0 ? (
                      <div className="p-6 text-center">
                        <span className="material-icons text-4xl text-gray-300 mb-2">assignment</span>
                        <p className="text-gray-500">{t("reports.no_data_available")}</p>
                        <p className="text-sm text-gray-400 mt-1">{t("reports.try_different_filters")}</p>
                      </div>
                    ) : (
                      <>
                        {isMobile ? (
                          <div className="space-y-4">
                            {reportData.checks.map((check) => (
                              <Card key={check.id} className="overflow-hidden">
                                <CardHeader className="p-4 bg-gray-50">
                                  <div className="flex justify-between items-center">
                                    <CardTitle className="text-base font-medium">#{check.id}</CardTitle>
                                    <Badge className={check.result === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                      {check.result}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs text-gray-500">{t("reports.date")}</p>
                                      <p className="text-sm font-medium">{formatDateString(check.date)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">{t("reports.check_type")}</p>
                                      <p className="text-sm font-medium truncate">{check.type.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">{t("reports.stage")}</p>
                                      <p className="text-sm font-medium">{check.type.stage}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">{t("reports.roll")}</p>
                                      <p className="text-sm font-medium">{check.roll ? check.roll.serialNumber : "-"}</p>
                                    </div>
                                  </div>
                                  <Separator className="my-3" />
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full mt-2"
                                    onClick={() => setSelectedCheck(check)}
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
                            data={reportData.checks}
                            columns={qualityColumns as any}
                            onRowClick={(row) => setSelectedCheck(row)}
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
                  <span className="material-icons text-4xl text-gray-300 mb-2">fact_check</span>
                  <p className="text-gray-500">{t("reports.no_data_available")}</p>
                  <p className="text-sm text-gray-400 mt-1">{t("reports.try_different_filters")}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Check Details Modal (In a full implementation, this would be a proper modal) */}
          {selectedCheck && (
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("reports.quality_check_details")} #{selectedCheck.id}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCheck(null)}>
                  <span className="material-icons">close</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t("reports.date")}</h4>
                    <p>{formatDateString(selectedCheck.date)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t("reports.check_type")}</h4>
                    <p>{selectedCheck.type.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t("reports.result")}</h4>
                    <Badge className={selectedCheck.result === "Pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {selectedCheck.result}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t("reports.stage")}</h4>
                    <p>{selectedCheck.type.stage}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t("reports.roll")}</h4>
                    <p>{selectedCheck.roll ? selectedCheck.roll.serialNumber : "-"}</p>
                  </div>
                </div>
                
                {selectedCheck.notes && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t("reports.notes")}</h4>
                    <p className="text-sm">{selectedCheck.notes}</p>
                  </div>
                )}
                
                <Separator className="my-6" />
                
                <h4 className="font-medium mb-3">{t("reports.corrective_actions")}</h4>
                {selectedCheck.correctiveActions.length === 0 ? (
                  <p className="text-sm text-gray-500">{t("reports.no_corrective_actions")}</p>
                ) : (
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-4 text-left font-medium">{t("reports.id")}</th>
                          <th className="py-2 px-4 text-left font-medium">{t("reports.action")}</th>
                          <th className="py-2 px-4 text-left font-medium">{t("reports.implemented_by")}</th>
                          <th className="py-2 px-4 text-left font-medium">{t("reports.implementation_date")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCheck.correctiveActions.map((action, index) => (
                          <tr key={action.id} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                            <td className="py-2 px-4">{action.id}</td>
                            <td className="py-2 px-4">{action.action}</td>
                            <td className="py-2 px-4">{action.implementedBy}</td>
                            <td className="py-2 px-4">{formatDateString(action.implementationDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="p-6 text-center">
          <span className="material-icons text-4xl text-gray-300 mb-2">fact_check</span>
          <p className="text-gray-500">{t("reports.no_data_available")}</p>
          <p className="text-sm text-gray-400 mt-1">{t("reports.try_different_filters")}</p>
        </div>
      )}
    </div>
  );
}