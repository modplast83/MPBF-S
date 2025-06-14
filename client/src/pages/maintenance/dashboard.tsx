import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "react-i18next";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  Users,
  BarChart3
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";

interface MaintenanceRequest {
  id: number;
  machineId: string;
  damageType: string;
  severity: string;
  description: string;
  status: string;
  reportedBy: string;
  assignedTo?: string;
  estimatedRepairTime?: number;
  actualRepairTime?: number;
  createdAt: string;
  completedAt?: string;
}

interface MaintenanceAction {
  id: number;
  requestId: number;
  machineId: string;
  actionsTaken: string;
  actionType: string;
  partsCost?: number;
  laborHours?: number;
  actionBy: string;
  actionDate: string;
}

interface Machine {
  id: string;
  name: string;
  sectionId: string;
}

export default function MaintenanceDashboard() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("30");

  // Calculate date range
  const endDate = new Date();
  const startDate = subDays(endDate, parseInt(timeRange));

  // Fetch maintenance requests
  const { data: requests = [] } = useQuery({
    queryKey: [API_ENDPOINTS.MAINTENANCE_REQUESTS],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.MAINTENANCE_REQUESTS)
  });

  // Fetch maintenance actions
  const { data: actions = [] } = useQuery({
    queryKey: [API_ENDPOINTS.MAINTENANCE_ACTIONS],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.MAINTENANCE_ACTIONS)
  });

  // Fetch machines
  const { data: machines = [] } = useQuery({
    queryKey: ['/api/machines'],
    queryFn: () => apiRequest('GET', '/api/machines')
  });

  // Filter data by time range with null checking
  const filteredRequests = (requests || []).filter((request: MaintenanceRequest) => {
    if (!request || !request.createdAt) return false;
    const requestDate = new Date(request.createdAt);
    return !isNaN(requestDate.getTime()) && requestDate >= startDate && requestDate <= endDate;
  });

  const filteredActions = (actions || []).filter((action: MaintenanceAction) => {
    if (!action || !action.actionDate) return false;
    const actionDate = new Date(action.actionDate);
    return !isNaN(actionDate.getTime()) && actionDate >= startDate && actionDate <= endDate;
  });

  // Calculate metrics
  const totalRequests = filteredRequests.length;
  const pendingRequests = filteredRequests.filter((r: MaintenanceRequest) => r.status === 'pending').length;
  const inProgressRequests = filteredRequests.filter((r: MaintenanceRequest) => r.status === 'in_progress').length;
  const completedRequests = filteredRequests.filter((r: MaintenanceRequest) => r.status === 'completed').length;
  const todayCompleted = filteredRequests.filter((r: MaintenanceRequest) => 
    r.status === 'completed' && 
    format(new Date(r.completedAt || ''), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  // Calculate costs
  const totalPartsCost = filteredActions.reduce((sum: number, action: MaintenanceAction) => 
    sum + (action.partsCost || 0), 0
  );

  const totalLaborHours = filteredActions.reduce((sum: number, action: MaintenanceAction) => 
    sum + (action.laborHours || 0), 0
  );

  const averageLaborCost = 25; // $25 per hour
  const totalLaborCost = totalLaborHours * averageLaborCost;
  const totalMaintenanceCost = totalPartsCost + totalLaborCost;

  // Calculate average repair time
  const completedRequestsWithTime = filteredRequests.filter((r: MaintenanceRequest) => 
    r.status === 'completed' && r.actualRepairTime
  );
  const averageRepairTime = completedRequestsWithTime.length > 0 
    ? completedRequestsWithTime.reduce((sum: number, r: MaintenanceRequest) => sum + (r.actualRepairTime || 0), 0) / completedRequestsWithTime.length
    : 0;

  // Calculate efficiency metrics
  const efficiencyRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;
  
  // Equipment uptime calculation (simplified)
  const totalMachines = machines.length;
  const machinesWithIssues = new Set(filteredRequests.map((r: MaintenanceRequest) => r.machineId)).size;
  const uptimeRate = totalMachines > 0 ? ((totalMachines - machinesWithIssues) / totalMachines) * 100 : 100;

  // Severity analysis
  const severityBreakdown = {
    high: filteredRequests.filter((r: MaintenanceRequest) => r.severity === 'high').length,
    normal: filteredRequests.filter((r: MaintenanceRequest) => r.severity === 'normal').length,
    low: filteredRequests.filter((r: MaintenanceRequest) => r.severity === 'low').length,
  };

  // Recent activity
  const recentRequests = requests
    .sort((a: MaintenanceRequest, b: MaintenanceRequest) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const recentActions = actions
    .sort((a: MaintenanceAction, b: MaintenanceAction) => 
      new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime()
    )
    .slice(0, 5);

  const getMachineName = (machineId: string) => {
    const machine = machines.find((m: Machine) => m.id === machineId);
    return machine ? machine.name : machineId;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">{t(`maintenance.severity.${severity}`)}</Badge>;
      case "normal":
        return <Badge variant="secondary">{t(`maintenance.severity.${severity}`)}</Badge>;
      case "low":
        return <Badge variant="outline">{t(`maintenance.severity.${severity}`)}</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">{t(`maintenance.status.${status}`)}</Badge>;
      case "in_progress":
        return <Badge variant="secondary">{t(`maintenance.status.${status}`)}</Badge>;
      case "completed":
        return <Badge variant="default">{t(`maintenance.status.${status}`)}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader
        title={t("maintenance.dashboard.title")}
        description={t("maintenance.dashboard.description")}
      />

      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Time Range:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("maintenance.dashboard.pendingRequests")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              {totalRequests > 0 ? `${((pendingRequests / totalRequests) * 100).toFixed(1)}% of total` : 'No requests'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("maintenance.dashboard.inProgress")}
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressRequests}</div>
            <p className="text-xs text-muted-foreground">
              {totalRequests > 0 ? `${((inProgressRequests / totalRequests) * 100).toFixed(1)}% of total` : 'No requests'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("maintenance.dashboard.completedToday")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {completedRequests} completed in period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("maintenance.dashboard.totalCost")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMaintenanceCost.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Parts: ${totalPartsCost.toFixed(0)} | Labor: ${totalLaborCost.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              {t("maintenance.dashboard.efficiency")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{efficiencyRate.toFixed(1)}%</div>
            <Progress value={efficiencyRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedRequests} of {totalRequests} requests completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t("maintenance.dashboard.uptime")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uptimeRate.toFixed(1)}%</div>
            <Progress value={uptimeRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {totalMachines - machinesWithIssues} of {totalMachines} machines operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {t("maintenance.dashboard.averageRepairTime")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRepairTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Based on {completedRequestsWithTime.length} completed repairs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Severity Breakdown
          </CardTitle>
          <CardDescription>
            Distribution of maintenance requests by severity level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{severityBreakdown.high}</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
              <Progress 
                value={totalRequests > 0 ? (severityBreakdown.high / totalRequests) * 100 : 0} 
                className="mt-2 h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{severityBreakdown.normal}</div>
              <div className="text-sm text-muted-foreground">Normal Priority</div>
              <Progress 
                value={totalRequests > 0 ? (severityBreakdown.normal / totalRequests) * 100 : 0} 
                className="mt-2 h-2" 
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{severityBreakdown.low}</div>
              <div className="text-sm text-muted-foreground">Low Priority</div>
              <Progress 
                value={totalRequests > 0 ? (severityBreakdown.low / totalRequests) * 100 : 0} 
                className="mt-2 h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance Requests</CardTitle>
            <CardDescription>
              Latest maintenance requests in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No recent maintenance requests
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request: MaintenanceRequest) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{getMachineName(request.machineId)}</div>
                      <div className="text-sm text-gray-600 truncate">{request.description}</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(request.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {getStatusBadge(request.status)}
                      {getSeverityBadge(request.severity)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance Actions</CardTitle>
            <CardDescription>
              Latest maintenance actions performed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No recent maintenance actions
              </div>
            ) : (
              <div className="space-y-3">
                {recentActions.map((action: MaintenanceAction) => (
                  <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{getMachineName(action.machineId)}</div>
                      <div className="text-sm text-gray-600 truncate">{action.actionsTaken}</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(action.actionDate), 'MMM dd, HH:mm')} by {action.actionBy}
                      </div>
                    </div>
                    <div className="text-right">
                      {action.partsCost && (
                        <div className="text-sm font-medium">${action.partsCost}</div>
                      )}
                      {action.laborHours && (
                        <div className="text-xs text-gray-500">{action.laborHours}h labor</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}