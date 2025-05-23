import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { 
  ClipboardCheck as ClipboardListIcon, 
  Wrench as WrenchIcon, 
  CheckCircle as CheckCircleIcon, 
  AlertCircle as AlertCircleIcon, 
  Clock as TimeIcon,
  Hammer as ToolIcon,
  Plus as PlusIcon,
  ChevronRight,
  Search,
  Users,
  BarChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth-v2";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

// Status badge colors
const statusColors = {
  new: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  under_maintenance: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  fixed: "bg-green-100 text-green-800 hover:bg-green-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100"
};

// Priority badge colors
const priorityColors = {
  low: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  high: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  critical: "bg-red-100 text-red-800 hover:bg-red-100"
};

export default function MaintenanceDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Query for fetching maintenance requests
  const { data: requests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/maintenance/requests"],
    queryFn: () => apiRequest("/api/maintenance/requests"),
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  // Query for fetching maintenance stats
  const { data: maintenanceStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/maintenance/stats"],
    queryFn: () => apiRequest("/api/maintenance/stats"),
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  // Query for fetching machines with most maintenance issues
  const { data: machineStats, isLoading: isLoadingMachineStats } = useQuery({
    queryKey: ["/api/maintenance/machines/stats"],
    queryFn: () => apiRequest("/api/maintenance/machines/stats"),
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case "new":
        return <AlertCircleIcon className="h-5 w-5 text-blue-500" />;
      case "under_maintenance":
        return <TimeIcon className="h-5 w-5 text-yellow-500" />;
      case "fixed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Filter requests by search query
  const filteredRequests = requests ? requests.filter(request => 
    request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];
  
  // Get requests by status
  const requestsByStatus = {
    new: filteredRequests.filter(r => r.status === "new"),
    under_maintenance: filteredRequests.filter(r => r.status === "under_maintenance"),
    fixed: filteredRequests.filter(r => r.status === "fixed"),
    rejected: filteredRequests.filter(r => r.status === "rejected")
  };
  
  // Get critical and high priority requests
  const priorityRequests = filteredRequests.filter(r => 
    r.priority === "critical" || r.priority === "high"
  ).slice(0, 5);
  
  return (
    <>
      <Helmet>
        <title>Maintenance Dashboard</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('Maintenance Dashboard')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('Overview of maintenance requests and machine status')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/maintenance/requests">
              <Button variant="default" className="flex items-center gap-2">
                <ClipboardListIcon className="h-4 w-4" />
                {t('All Requests')}
              </Button>
            </Link>
            <Link href="/maintenance/requests">
              <Button variant="outline" className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                {t('New Request')}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Stats overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Total Requests')}
              </CardTitle>
              <CardDescription className="text-2xl font-bold">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
                ) : (
                  maintenanceStats?.totalRequests || 0
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <ClipboardListIcon className="h-4 w-4 mr-1" />
                {t('All maintenance issues')}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Pending Requests')}
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-yellow-600">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
                ) : (
                  (maintenanceStats?.newRequests || 0) + (maintenanceStats?.inProgressRequests || 0)
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TimeIcon className="h-4 w-4 mr-1" />
                {t('Needs attention')}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Completed')}
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-green-600">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
                ) : (
                  maintenanceStats?.fixedRequests || 0
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                {t('Resolved issues')}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Critical Issues')}
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-red-600">
                {isLoadingStats ? (
                  <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
                ) : (
                  maintenanceStats?.criticalRequests || 0
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <AlertCircleIcon className="h-4 w-4 mr-1" />
                {t('High priority issues')}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Priority maintenance requests */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('Priority Maintenance Requests')}</CardTitle>
              <CardDescription>
                {t('Critical and high priority issues that need immediate attention')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative flex items-center mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search by request number or description...')}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {isLoadingRequests ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              ) : priorityRequests.length > 0 ? (
                <div className="space-y-3">
                  {priorityRequests.map((request) => (
                    <Link key={request.id} href={`/maintenance/requests/${request.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                            <WrenchIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{request.requestNumber}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {request.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={priorityColors[request.priority]}>
                            {t(request.priority).toUpperCase()}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircleIcon className="h-10 w-10 text-green-500 mb-2" />
                  <p className="text-muted-foreground">{t('No critical or high priority issues')}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Link href="/maintenance/requests">
                <Button variant="outline" size="sm">
                  {t('View All Requests')}
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          {/* Request status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Request Status')}</CardTitle>
              <CardDescription>
                {t('Breakdown of maintenance requests by status')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="animate-pulse space-y-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <div className="h-4 w-1/3 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{t('New')}</div>
                      <div className="text-sm text-muted-foreground">
                        {requestsByStatus.new.length} / {filteredRequests.length}
                      </div>
                    </div>
                    <Progress 
                      value={(requestsByStatus.new.length / (filteredRequests.length || 1)) * 100} 
                      className="h-2 bg-muted"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{t('Under Maintenance')}</div>
                      <div className="text-sm text-muted-foreground">
                        {requestsByStatus.under_maintenance.length} / {filteredRequests.length}
                      </div>
                    </div>
                    <Progress 
                      value={(requestsByStatus.under_maintenance.length / (filteredRequests.length || 1)) * 100} 
                      className="h-2 bg-muted"
                      indicatorClassName="bg-yellow-500"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{t('Fixed')}</div>
                      <div className="text-sm text-muted-foreground">
                        {requestsByStatus.fixed.length} / {filteredRequests.length}
                      </div>
                    </div>
                    <Progress 
                      value={(requestsByStatus.fixed.length / (filteredRequests.length || 1)) * 100} 
                      className="h-2 bg-muted"
                      indicatorClassName="bg-green-500"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{t('Rejected')}</div>
                      <div className="text-sm text-muted-foreground">
                        {requestsByStatus.rejected.length} / {filteredRequests.length}
                      </div>
                    </div>
                    <Progress 
                      value={(requestsByStatus.rejected.length / (filteredRequests.length || 1)) * 100} 
                      className="h-2 bg-muted"
                      indicatorClassName="bg-red-500"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Machines with most issues */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('Machines with Most Maintenance Issues')}</CardTitle>
              <CardDescription>
                {t('Machines that require frequent maintenance attention')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMachineStats ? (
                <div className="animate-pulse">
                  <div className="h-40 bg-muted rounded"></div>
                </div>
              ) : machineStats && machineStats.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Machine')}</TableHead>
                        <TableHead>{t('Section')}</TableHead>
                        <TableHead>{t('Issues')}</TableHead>
                        <TableHead>{t('Last Issue')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {machineStats.slice(0, 5).map((machine) => (
                        <TableRow key={machine.id}>
                          <TableCell className="font-medium">{machine.name}</TableCell>
                          <TableCell>{machine.section}</TableCell>
                          <TableCell>{machine.issueCount}</TableCell>
                          <TableCell>{format(new Date(machine.lastIssueDate), 'PP')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ToolIcon className="h-10 w-10 text-primary/60 mb-2" />
                  <p className="text-muted-foreground">{t('No machine statistics available')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Maintenance Team Workload */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Maintenance Team Workload')}</CardTitle>
              <CardDescription>
                {t('Current assignment distribution')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-muted rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : maintenanceStats?.teamWorkload ? (
                <div className="space-y-4">
                  {maintenanceStats.teamWorkload.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.assignedCount} issues</p>
                        </div>
                        <Progress 
                          value={(member.assignedCount / (maintenanceStats.maxAssignedCount || 1)) * 100} 
                          className="h-2 mt-1 bg-muted"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-10 w-10 text-primary/60 mb-2" />
                  <p className="text-muted-foreground">{t('No team workload data available')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}