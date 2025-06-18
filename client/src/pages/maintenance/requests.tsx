import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { QuickActions } from "@/components/ui/quick-actions";
import { Plus, RefreshCw, Filter, Search, AlertTriangle, Clock, CheckCircle, X, Eye, Trash2, Wrench, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { CelebrationScreen, useCelebration } from "@/components/maintenance/celebration-screen";
import { ProgressTracker } from "@/components/maintenance/progress-tracker";

const getDamageTypes = (t: any) => [
  t("maintenance.damage_types.motor"),
  t("maintenance.damage_types.bearing"),
  t("maintenance.damage_types.roller"),
  t("maintenance.damage_types.printing_roller"),
  t("maintenance.damage_types.gear"),
  t("maintenance.damage_types.fan"),
  t("maintenance.damage_types.fuse"),
  t("maintenance.damage_types.sealing"),
  t("maintenance.damage_types.knife"),
  t("maintenance.damage_types.heater"),
  t("maintenance.damage_types.inverter"),
  t("maintenance.damage_types.power_supply"),
  t("maintenance.damage_types.shaft"),
  t("maintenance.damage_types.take_up"),
  t("maintenance.damage_types.short"),
  t("maintenance.damage_types.other")
];

const getSeverityLevels = (t: any) => [
  { value: "High", label: t("maintenance.severity.high") },
  { value: "Normal", label: t("maintenance.severity.normal") },
  { value: "Low", label: t("maintenance.severity.low") }
];
const STATUS_OPTIONS = ["pending", "progress", "completed", "cancelled", "repaired", "waiting_for_parts"];

interface MaintenanceRequest {
  id: number;
  date: string;
  reportedBy: string;
  machineId: string;
  damageType: string;
  severity: string;
  description: string;
  notes?: string;
  status: string;
  priority: number;
  estimatedRepairTime?: number;
  actualRepairTime?: number;
  assignedTo?: string;
  completedAt?: string;
  createdAt: string;
}

interface Machine {
  id: string;
  name: string;
  sectionId: string;
}

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export default function MaintenanceRequestsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const damageTypes = getDamageTypes(t);
  const severityLevels = getSeverityLevels(t);
  const [location, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const { celebration, showCelebration, hideCelebration } = useCelebration();

  const [formData, setFormData] = useState({
    machineId: "",
    damageType: "",
    severity: "Normal",
    description: "",
  });

  // Fetch maintenance requests
  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: [API_ENDPOINTS.MAINTENANCE_REQUESTS],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.MAINTENANCE_REQUESTS)
  });

  // Fetch machines
  const { data: machines = [] } = useQuery({
    queryKey: ['/api/machines'],
    queryFn: () => apiRequest('GET', '/api/machines')
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users')
  });

  // Fetch maintenance actions to show action counts
  const { data: actions = [] } = useQuery({
    queryKey: [API_ENDPOINTS.MAINTENANCE_ACTIONS],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.MAINTENANCE_ACTIONS)
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', API_ENDPOINTS.MAINTENANCE_REQUESTS, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Maintenance request created successfully",
      });
      setIsDialogOpen(false);
      resetForm();
      refetchRequests();
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MAINTENANCE_REQUESTS] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create maintenance request",
        variant: "destructive",
      });
    },
  });

  // Update request mutation
  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `${API_ENDPOINTS.MAINTENANCE_REQUESTS}/${id}`, data),
    onSuccess: (result, variables) => {
      const wasCompleted = variables.data.status === 'completed';
      
      if (wasCompleted) {
        // Trigger celebration when task is completed
        const completedCount = requests?.filter((r: MaintenanceRequest) => r.status === 'completed').length || 0;
        
        showCelebration('task_completed', {
          title: 'Task Completed!',
          subtitle: 'Excellent Work',
          description: 'Another maintenance task successfully resolved!',
          stats: [
            { label: 'Tasks Completed', value: completedCount + 1 },
            { label: 'Status', value: 'Resolved' }
          ],
          achievementLevel: completedCount >= 10 ? 'gold' : completedCount >= 5 ? 'silver' : 'bronze'
        });
      }
      
      toast({
        title: "Success",
        description: wasCompleted ? "Maintenance task completed!" : "Maintenance request updated successfully",
      });
      refetchRequests();
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MAINTENANCE_REQUESTS] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update maintenance request",
        variant: "destructive",
      });
    },
  });

  // Delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `${API_ENDPOINTS.MAINTENANCE_REQUESTS}/${id}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Maintenance request deleted successfully",
      });
      refetchRequests();
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MAINTENANCE_REQUESTS] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete maintenance request",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      machineId: "",
      damageType: "",
      severity: "Normal",
      description: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.machineId || !formData.damageType || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      ...formData,
      priority: formData.severity === "High" ? 1 : formData.severity === "Normal" ? 2 : 3,
    };

    createRequestMutation.mutate(requestData);
  };

  const handleStatusUpdate = (requestId: number, newStatus: string) => {
    const updateData = { 
      status: newStatus,
      ...(newStatus === 'completed' && { completedAt: new Date().toISOString() })
    };
    updateRequestMutation.mutate({ id: requestId, data: updateData });
    setIsStatusDialogOpen(false);
  };

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleDeleteRequest = (requestId: number) => {
    if (window.confirm('Are you sure you want to delete this maintenance request?')) {
      deleteRequestMutation.mutate(requestId);
    }
  };

  const handleAddMaintenanceAction = (request: MaintenanceRequest) => {
    // Navigate to maintenance actions page with pre-filled request data
    setLocation(`/maintenance/actions?requestId=${request.id}`);
  };

  const handleChangeStatus = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsStatusDialogOpen(true);
  };

  // Filter requests
  const filteredRequests = requests.filter((request: MaintenanceRequest) => {
    const matchesSearch = searchQuery === "" || 
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.damageType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || request.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "High":
        return <Badge variant="destructive">{severity}</Badge>;
      case "Normal":
        return <Badge variant="secondary">{severity}</Badge>;
      case "Low":
        return <Badge variant="outline">{severity}</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>;
      case "progress":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
      case "completed":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case "cancelled":
        return <Badge variant="outline"><X className="w-3 h-3 mr-1" />{status}</Badge>;
      case "repaired":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Repaired</Badge>;
      case "waiting_for_parts":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Waiting For Parts</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMachineName = (machineId: string) => {
    const machine = machines.find((m: Machine) => m.id === machineId);
    return machine ? machine.name : machineId;
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : userId;
  };

  const getActionCount = (requestId: number) => {
    return actions.filter((action: any) => action.requestId === requestId).length;
  };

  // Calculate progress statistics
  const progressStats = {
    completedToday: requests?.filter((r: MaintenanceRequest) => r.status === 'completed' && 
      new Date(r.completedAt || '').toDateString() === new Date().toDateString()).length || 0,
    totalScheduled: requests?.length || 0,
    streak: 5, // This would be calculated from historical data
    efficiency: requests?.length > 0 ? Math.round((requests.filter((r: MaintenanceRequest) => r.status === 'completed').length / requests.length) * 100) : 0,
    upcomingDue: requests?.filter((r: MaintenanceRequest) => r.status === 'pending').length || 0,
    overdue: requests?.filter((r: MaintenanceRequest) => r.status === 'pending' && r.priority >= 3).length || 0
  };

  const handleMilestoneReached = (milestone: string, data: any) => {
    showCelebration(milestone as any, data);
  };

  const quickActions = [
    {
      id: "new-request",
      label: "New Request",
      icon: Plus,
      onClick: () => setIsDialogOpen(true),
      variant: "default"
    },
    {
      id: "refresh",
      label: "Refresh",
      icon: RefreshCw,
      onClick: () => {
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MAINTENANCE_REQUESTS] });
      },
      variant: "outline"
    },
    {
      id: "pending-filter",
      label: "Pending",
      icon: Filter,
      onClick: () => setStatusFilter("pending"),
      variant: statusFilter === "pending" ? "default" : "outline"
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      onClick: () => {
        const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (input) input.focus();
      },
      variant: "outline"
    }
  ];

  return (
    <div className="container mx-auto space-y-6 p-3 pl-[0.5px] pr-[0.5px]">
      <QuickActions
        title="Quick Actions"
        actions={quickActions}
        columns={2}
      />
      <PageHeader
        title={t("maintenance.requests.title")}
        description={t("maintenance.requests.description")}
      />
      {/* Progress Tracker */}
      <ProgressTracker 
        stats={progressStats} 
        onMilestoneReached={handleMilestoneReached}
      />
      {/* Celebration Screen */}
      <CelebrationScreen
        isVisible={celebration.isVisible}
        onClose={hideCelebration}
        type={celebration.type}
        data={celebration.data}
      />
      {/* Action Bar */}
      <div className={`flex gap-4 items-start justify-between ${isMobile ? "flex-col" : "flex-col sm:flex-row sm:items-center"}`}>
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("maintenance.requests.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("maintenance.requests.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("maintenance.requests.allStatus")}</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("maintenance.requests.filterBySeverity")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("maintenance.requests.allSeverity")}</SelectItem>
              {severityLevels.map((severity) => (
                <SelectItem key={severity.value} value={severity.value}>
                  {severity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("maintenance.requests.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("maintenance.requests.create")}</DialogTitle>
              <DialogDescription>
                {t("maintenance.requests.description")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="machineId">{t("maintenance.requests.machine")} *</Label>
                <Select 
                  value={formData.machineId} 
                  onValueChange={(value) => setFormData({...formData, machineId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("maintenance.requests.machine")} />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine: Machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="damageType">{t("maintenance.requests.damageType")} *</Label>
                <Select 
                  value={formData.damageType} 
                  onValueChange={(value) => setFormData({...formData, damageType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("maintenance.requests.damageType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">{t("maintenance.requests.severity")} *</Label>
                <Select 
                  value={formData.severity} 
                  onValueChange={(value) => setFormData({...formData, severity: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("maintenance.requests.severity")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">{t("maintenance.requests.description")} *</Label>
                <Textarea
                  id="description"
                  placeholder={t("maintenance.requests.description")}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createRequestMutation.isPending}>
                  {createRequestMutation.isPending ? t("common.creating") : t("maintenance.requests.create")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {/* Requests Table */}
      <Card>
        <CardHeader className="flex flex-col space-y-1.5 p-6 pl-[20px] pr-[20px]">
          <CardTitle>Maintenance Requests</CardTitle>
          <CardDescription>
            Follow All Maintenance Requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="text-center py-4">{t("common.loading")}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No maintenance Request found
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {filteredRequests.map((request: MaintenanceRequest) => (
                <Card key={request.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">#{request.id}</span>
                      {getSeverityBadge(request.severity)}
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Machine:</span>
                      <span className="font-medium">{getMachineName(request.machineId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{request.damageType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reported by:</span>
                      <span>{getUserName(request.reportedBy)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">Actions:</p>
                      <Badge variant="outline" className="text-xs">
                        {getActionCount(request.id)} action{getActionCount(request.id) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3" title={request.description}>
                      {request.description.length > 100 ? `${request.description.substring(0, 100)}...` : request.description}
                    </p>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewRequest(request)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChangeStatus(request)}
                        title="Change Status"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddMaintenanceAction(request)}
                        title="Add New Maintenance Action (Multiple actions allowed)"
                      >
                        <Wrench className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRequest(request.id)}
                        title="Delete Request"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Request ID</TableHead>
                    <TableHead className="text-center">{t("maintenance.requests.date")}</TableHead>
                    <TableHead className="text-center">{t("maintenance.requests.machine")}</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">{t("maintenance.requests.severity")}</TableHead>
                    <TableHead className="text-center">{t("maintenance.requests.status")}</TableHead>
                    <TableHead className="text-center">Reported By</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                    <TableHead className="text-center">{t("maintenance.requests.description")}</TableHead>
                    <TableHead className="text-center">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request: MaintenanceRequest) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">#{request.id}</TableCell>
                      <TableCell>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{getMachineName(request.machineId)}</TableCell>
                      <TableCell>{request.damageType}</TableCell>
                      <TableCell>{getSeverityBadge(request.severity)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{getUserName(request.reportedBy)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {getActionCount(request.id)} action{getActionCount(request.id) !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={request.description}>
                        {request.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewRequest(request)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeStatus(request)}
                            title="Change Status"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddMaintenanceAction(request)}
                            title="Add New Maintenance Action (Multiple actions allowed)"
                          >
                            <Wrench className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRequest(request.id)}
                            title="Delete Request"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maintenance Request Details</DialogTitle>
            <DialogDescription>
              View complete information about this maintenance request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Request ID:</Label>
                  <p>#{selectedRequest.id}</p>
                </div>
                <div>
                  <Label className="font-semibold">Date Created:</Label>
                  <p>{format(new Date(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="font-semibold">Machine:</Label>
                  <p>{getMachineName(selectedRequest.machineId)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Damage Type:</Label>
                  <p>{selectedRequest.damageType}</p>
                </div>
                <div>
                  <Label className="font-semibold">Severity:</Label>
                  <p>{getSeverityBadge(selectedRequest.severity)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status:</Label>
                  <p>{getStatusBadge(selectedRequest.status)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Reported By:</Label>
                  <p>{getUserName(selectedRequest.reportedBy)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Priority:</Label>
                  <p>{selectedRequest.priority === 1 ? 'High' : selectedRequest.priority === 2 ? 'Normal' : 'Low'}</p>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Description:</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded border">{selectedRequest.description}</p>
              </div>
              {selectedRequest.completedAt && (
                <div>
                  <Label className="font-semibold">Completed At:</Label>
                  <p>{format(new Date(selectedRequest.completedAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Request Status</DialogTitle>
            <DialogDescription>
              Update the status of this maintenance request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Current Status:</Label>
                <p className="mt-1">{getStatusBadge(selectedRequest.status)}</p>
              </div>
              <div>
                <Label className="font-semibold">Select New Status:</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'pending')}
                    className="justify-start"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Pending
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'progress')}
                    className="justify-start"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    In Progress
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'repaired')}
                    className="justify-start"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Repaired
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'waiting_for_parts')}
                    className="justify-start"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Waiting For Parts
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                    className="justify-start"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'cancelled')}
                    className="justify-start"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelled
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}