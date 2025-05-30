import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  TrendingUp,
  Factory,
  Bell,
  Settings,
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BottleneckAlert {
  id: number;
  alertType: string;
  severity: string;
  sectionId: string;
  machineId: string | null;
  title: string;
  description: string;
  affectedJobOrders: number[] | null;
  estimatedDelay: number | null;
  suggestedActions: string[] | null;
  status: string;
  detectedAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

interface DashboardData {
  activeAlerts: number;
  alertsBySeverity: Record<string, number>;
  overallEfficiency: number;
  metricsCount: number;
  criticalAlerts: number;
  topBottlenecks: BottleneckAlert[];
}

const severityColors = {
  critical: "bg-red-500",
  high: "bg-orange-500", 
  medium: "bg-yellow-500",
  low: "bg-blue-500"
};

const severityTextColors = {
  critical: "text-red-700",
  high: "text-orange-700",
  medium: "text-yellow-700", 
  low: "text-blue-700"
};

export default function BottleneckDashboard() {
  const queryClient = useQueryClient();

  // Fetch dashboard overview data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/bottleneck/dashboard"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch active alerts
  const { data: activeAlerts, isLoading: alertsLoading } = useQuery<BottleneckAlert[]>({
    queryKey: ["/api/bottleneck/alerts", "active"],
    queryFn: () => apiRequest("GET", "/api/bottleneck/alerts?status=active"),
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: number) => 
      apiRequest("PUT", `/api/bottleneck/alerts/${alertId}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bottleneck/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bottleneck/dashboard"] });
    }
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: ({ alertId, notes }: { alertId: number; notes?: string }) =>
      apiRequest("PUT", `/api/bottleneck/alerts/${alertId}/resolve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bottleneck/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bottleneck/dashboard"] });
    }
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  if (dashboardLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Bottleneck Monitor</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and smart notifications for production bottlenecks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{dashboardData?.activeAlerts || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData?.criticalAlerts || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Efficiency</p>
                <p className="text-2xl font-bold">{dashboardData?.overallEfficiency?.toFixed(1) || 0}%</p>
              </div>
              {(dashboardData?.overallEfficiency || 0) >= 80 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
            <div className="mt-2">
              <Progress value={dashboardData?.overallEfficiency || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Metrics Today</p>
                <p className="text-2xl font-bold">{dashboardData?.metricsCount || 0}</p>
              </div>
              <Factory className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts by Severity */}
      {dashboardData?.alertsBySeverity && Object.keys(dashboardData.alertsBySeverity).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alerts by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {Object.entries(dashboardData.alertsBySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${severityColors[severity as keyof typeof severityColors]}`}></div>
                  <span className="text-sm font-medium capitalize">{severity}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active-alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active-alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="top-bottlenecks">Top Bottlenecks</TabsTrigger>
          <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="active-alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Production Alerts</CardTitle>
              <CardDescription>
                Current bottlenecks and issues requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : !activeAlerts || activeAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground">All production lines are operating normally</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <Alert key={alert.id} className="relative">
                      <div className="flex items-start gap-4">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTitle className="text-sm font-semibold">
                              {alert.title}
                            </AlertTitle>
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline">
                              {alert.sectionId}{alert.machineId ? ` - ${alert.machineId}` : ''}
                            </Badge>
                          </div>
                          <AlertDescription className="text-sm text-muted-foreground mb-3">
                            {alert.description}
                          </AlertDescription>
                          {alert.estimatedDelay && (
                            <p className="text-sm text-orange-600 mb-2">
                              Estimated delay: {alert.estimatedDelay} hours
                            </p>
                          )}
                          {alert.suggestedActions && alert.suggestedActions.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Suggested Actions:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {alert.suggestedActions.slice(0, 3).map((action, index) => (
                                  <li key={index}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Detected {formatTimeAgo(alert.detectedAt)}
                            </p>
                            <div className="flex gap-2">
                              {alert.status === 'active' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                                    disabled={acknowledgeAlertMutation.isPending}
                                  >
                                    Acknowledge
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => resolveAlertMutation.mutate({ alertId: alert.id })}
                                    disabled={resolveAlertMutation.isPending}
                                  >
                                    Resolve
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-bottlenecks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Production Bottlenecks</CardTitle>
              <CardDescription>
                Most critical issues affecting production flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.topBottlenecks && dashboardData.topBottlenecks.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.topBottlenecks.map((bottleneck, index) => (
                    <div key={bottleneck.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{bottleneck.title}</h4>
                          <Badge variant={bottleneck.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {bottleneck.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{bottleneck.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {bottleneck.sectionId}{bottleneck.machineId ? ` - ${bottleneck.machineId}` : ''}
                        </p>
                      </div>
                      {bottleneck.estimatedDelay && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-600">
                            {bottleneck.estimatedDelay}h delay
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Factory className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Critical Bottlenecks</h3>
                  <p className="text-muted-foreground">Production flow is optimized</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest alerts and system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
                <p className="text-muted-foreground">Recent system activities will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}