import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  BarChart4, 
  Calendar, 
  Clock,
  Download, 
  FileBarChart,
  FileText, 
  FilterX, 
  PieChart,
  Printer
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { QualityViolation, QualityPenalty } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function QualityReports() {
  const [period, setPeriod] = useState("thisMonth");
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  const [severityFilter, setSeverityFilter] = useState("all");
  const [reportType, setReportType] = useState("summary");

  // Update date range when period changes
  const updateDateRange = (periodValue) => {
    const today = new Date();
    
    switch (periodValue) {
      case "today":
        setDateRange({
          startDate: today,
          endDate: today
        });
        break;
      case "last7Days":
        setDateRange({
          startDate: subDays(today, 6),
          endDate: today
        });
        break;
      case "last30Days":
        setDateRange({
          startDate: subDays(today, 29),
          endDate: today
        });
        break;
      case "thisMonth":
        setDateRange({
          startDate: startOfMonth(today),
          endDate: endOfMonth(today)
        });
        break;
      case "custom":
        // Keep existing custom date range
        break;
      default:
        setDateRange({
          startDate: startOfMonth(today),
          endDate: endOfMonth(today)
        });
    }
  };

  // Handle period change
  const handlePeriodChange = (value) => {
    setPeriod(value);
    if (value !== "custom") {
      updateDateRange(value);
    }
  };

  // Fetch violations with the date range
  const { data: violations, isLoading: isLoadingViolations } = useQuery({
    queryKey: ["/api/quality-violations", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const startDate = format(dateRange.startDate, "yyyy-MM-dd");
      const endDate = format(dateRange.endDate, "yyyy-MM-dd");
      const response = await fetch(`/api/quality-violations?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Failed to fetch violations");
      }
      return response.json() as Promise<QualityViolation[]>;
    }
  });

  // Fetch penalties with the date range
  const { data: penalties, isLoading: isLoadingPenalties } = useQuery({
    queryKey: ["/api/quality-penalties", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const startDate = format(dateRange.startDate, "yyyy-MM-dd");
      const endDate = format(dateRange.endDate, "yyyy-MM-dd");
      const response = await fetch(`/api/quality-penalties?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Failed to fetch penalties");
      }
      return response.json() as Promise<QualityPenalty[]>;
    }
  });

  // Filter violations by severity
  const filteredViolations = violations?.filter(violation => {
    if (severityFilter === "all") return true;
    return violation.severity === severityFilter;
  }) || [];

  // Calculate summary statistics
  const summaryStats = {
    totalViolations: filteredViolations.length,
    bySeverity: {
      low: filteredViolations.filter(v => v.severity === "low").length,
      medium: filteredViolations.filter(v => v.severity === "medium").length,
      high: filteredViolations.filter(v => v.severity === "high").length,
      critical: filteredViolations.filter(v => v.severity === "critical").length
    },
    byStatus: {
      reported: filteredViolations.filter(v => v.status === "reported").length,
      investigating: filteredViolations.filter(v => v.status === "investigating").length,
      resolved: filteredViolations.filter(v => v.status === "resolved").length,
      dismissed: filteredViolations.filter(v => v.status === "dismissed").length
    },
    penalties: {
      total: penalties?.length || 0,
      byType: {
        warning: penalties?.filter(p => p.penaltyType === "warning").length || 0,
        training: penalties?.filter(p => p.penaltyType === "training").length || 0,
        suspension: penalties?.filter(p => p.penaltyType === "suspension").length || 0,
        financial: penalties?.filter(p => p.penaltyType === "financial").length || 0,
        other: penalties?.filter(p => p.penaltyType === "other").length || 0
      },
      totalFinancialAmount: penalties?.filter(p => p.penaltyType === "financial" && p.amount)
        .reduce((sum, penalty) => sum + (penalty.amount || 0), 0) || 0
    }
  };

  // Handle severity badge styling
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
            Low
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
            Medium
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
            High
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
            Critical
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
            {severity}
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader heading="Quality Violation Reports" text="Generate and analyze quality violation data across production" />
      
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Time Period</label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last7Days">Last 7 Days</SelectItem>
                  <SelectItem value="last30Days">Last 30 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {period === "custom" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <Input 
                    type="date" 
                    value={format(dateRange.startDate, "yyyy-MM-dd")}
                    onChange={(e) => setDateRange(prev => ({ 
                      ...prev, 
                      startDate: new Date(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <Input 
                    type="date"
                    value={format(dateRange.endDate, "yyyy-MM-dd")}
                    onChange={(e) => setDateRange(prev => ({ 
                      ...prev, 
                      endDate: new Date(e.target.value) 
                    }))}
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="text-sm font-medium mb-1 block">Severity Filter</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-6">
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 ml-auto"
              onClick={() => {
                setSeverityFilter("all");
                setPeriod("thisMonth");
                updateDateRange("thisMonth");
                setReportType("summary");
              }}
            >
              <FilterX className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoadingViolations || isLoadingPenalties ? (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-32">
              <Clock className="h-8 w-8 text-muted-foreground animate-pulse" />
              <span className="ml-2 text-lg text-muted-foreground">Loading report data...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="dashboard" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart4 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="violations" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Violations
            </TabsTrigger>
            <TabsTrigger value="penalties" className="flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              Penalties
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Violations</p>
                      <h3 className="text-2xl font-bold mt-1">{summaryStats.totalViolations}</h3>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(dateRange.startDate, "MMM d, yyyy")} - {format(dateRange.endDate, "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                      <h3 className="text-2xl font-bold mt-1">{summaryStats.bySeverity.critical}</h3>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {((summaryStats.bySeverity.critical / summaryStats.totalViolations) * 100 || 0).toFixed(1)}% of total violations
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Penalties</p>
                      <h3 className="text-2xl font-bold mt-1">{summaryStats.penalties.total}</h3>
                    </div>
                    <PieChart className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {((summaryStats.penalties.total / summaryStats.totalViolations) * 100 || 0).toFixed(1)}% violation to penalty ratio
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Financial Penalties</p>
                      <h3 className="text-2xl font-bold mt-1">${summaryStats.penalties.totalFinancialAmount.toFixed(2)}</h3>
                    </div>
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {summaryStats.penalties.byType.financial} financial penalties assigned
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Violations by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Low</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{summaryStats.bySeverity.low}</span>
                        <span className="text-muted-foreground text-sm">
                          ({((summaryStats.bySeverity.low / summaryStats.totalViolations) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Medium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{summaryStats.bySeverity.medium}</span>
                        <span className="text-muted-foreground text-sm">
                          ({((summaryStats.bySeverity.medium / summaryStats.totalViolations) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>High</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{summaryStats.bySeverity.high}</span>
                        <span className="text-muted-foreground text-sm">
                          ({((summaryStats.bySeverity.high / summaryStats.totalViolations) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Critical</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{summaryStats.bySeverity.critical}</span>
                        <span className="text-muted-foreground text-sm">
                          ({((summaryStats.bySeverity.critical / summaryStats.totalViolations) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between font-medium">
                        <span>Total</span>
                        <span>{summaryStats.totalViolations}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Violation Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Reported</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{summaryStats.byStatus.reported}</span>
                        <span className="text-muted-foreground text-sm">
                          ({((summaryStats.byStatus.reported / summaryStats.totalViolations) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Investigating</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{summaryStats.byStatus.investigating}</span>
                        <span className="text-muted-foreground text-sm">
                          ({((summaryStats.byStatus.investigating / summaryStats.totalViolations) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Resolved</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{summaryStats.byStatus.resolved}</span>
                        <span className="text-muted-foreground text-sm">
                          ({((summaryStats.byStatus.resolved / summaryStats.totalViolations) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                        <span>Dismissed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{summaryStats.byStatus.dismissed}</span>
                        <span className="text-muted-foreground text-sm">
                          ({((summaryStats.byStatus.dismissed / summaryStats.totalViolations) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between font-medium">
                        <span>Resolution Rate</span>
                        <span>
                          {(((summaryStats.byStatus.resolved + summaryStats.byStatus.dismissed) / summaryStats.totalViolations) * 100 || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="violations">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Violations List ({filteredViolations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredViolations.length === 0 ? (
                  <div className="p-6 text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No violations found for the selected criteria.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reported By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredViolations.map((violation) => (
                        <TableRow key={violation.id}>
                          <TableCell className="font-medium">#{violation.id}</TableCell>
                          <TableCell>{format(new Date(violation.reportDate), "MMM d, yyyy")}</TableCell>
                          <TableCell className="max-w-xs truncate">{violation.description}</TableCell>
                          <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{violation.status}</Badge>
                          </TableCell>
                          <TableCell>{violation.reportedBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="penalties">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-blue-500" />
                  Penalties Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium mb-3">Penalties by Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="text-lg font-semibold text-blue-700">{summaryStats.penalties.byType.warning}</div>
                          <div className="text-sm text-blue-600">Warnings</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-4">
                          <div className="text-lg font-semibold text-purple-700">{summaryStats.penalties.byType.training}</div>
                          <div className="text-sm text-purple-600">Training</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-4">
                          <div className="text-lg font-semibold text-orange-700">{summaryStats.penalties.byType.suspension}</div>
                          <div className="text-sm text-orange-600">Suspensions</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4">
                          <div className="text-lg font-semibold text-red-700">{summaryStats.penalties.byType.financial}</div>
                          <div className="text-sm text-red-600">Financial</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-4">
                          <div className="text-lg font-semibold text-gray-700">{summaryStats.penalties.byType.other}</div>
                          <div className="text-sm text-gray-600">Other</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Financial Impact</h3>
                    <div className="flex items-center gap-4 flex-wrap">
                      <Card className="flex-1 min-w-[200px]">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Total Financial Penalties</div>
                          <div className="text-2xl font-bold mt-1">${summaryStats.penalties.totalFinancialAmount.toFixed(2)}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="flex-1 min-w-[200px]">
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Average per Penalty</div>
                          <div className="text-2xl font-bold mt-1">
                            ${(summaryStats.penalties.byType.financial > 0 
                              ? summaryStats.penalties.totalFinancialAmount / summaryStats.penalties.byType.financial 
                              : 0).toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Penalties List</h3>
                    {penalties && penalties.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Assigned To</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {penalties.map((penalty) => (
                            <TableRow key={penalty.id}>
                              <TableCell className="font-medium">#{penalty.id}</TableCell>
                              <TableCell>{format(new Date(penalty.createdAt), "MMM d, yyyy")}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{penalty.penaltyType}</Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">{penalty.description}</TableCell>
                              <TableCell>
                                {penalty.amount ? (
                                  <span className="font-medium">${penalty.amount.toFixed(2)}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>{penalty.assignedTo}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-6 text-center">
                        <FileBarChart className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">No penalties found for the selected period.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}