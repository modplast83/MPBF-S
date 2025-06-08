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
import { Plus, RefreshCw, Filter, Search, AlertTriangle, Clock, CheckCircle, X } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { CelebrationScreen, useCelebration } from "@/components/maintenance/celebration-screen";
import { ProgressTracker } from "@/components/maintenance/progress-tracker";

const DAMAGE_TYPES = [
  "Motor", "Bearing", "Roller", "Printing Roller", "Gear", "Fan", 
  "Fuse", "Sealing", "Knife", "Heater", "Inverter", "Power Supply", 
  "Shaft", "Take up", "Short", "Other"
];

const SEVERITY_LEVELS = ["High", "Normal", "Low"];
const STATUS_OPTIONS = ["pending", "progress", "completed", "cancelled"];

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const { celebration, showCelebration, hideCelebration } = useCelebration();

  const [formData, setFormData] = useState({
    machineId: "",
    damageType: "",
    severity: "Normal",
    description: "",
    notes: "",
    estimatedRepairTime: "",
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

  const resetForm = () => {
    setFormData({
      machineId: "",
      damageType: "",
      severity: "Normal",
      description: "",
      notes: "",
      estimatedRepairTime: "",
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
      estimatedRepairTime: formData.estimatedRepairTime ? parseInt(formData.estimatedRepairTime) : null,
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
              {SEVERITY_LEVELS.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {severity}
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

              <div>
                <Label htmlFor="estimatedRepairTime">{t("maintenance.requests.estimatedRepairTime")}</Label>
                <Input
                  id="estimatedRepairTime"
                  type="number"
                  placeholder="Enter estimated hours"
                  value={formData.estimatedRepairTime}
                  onChange={(e) => setFormData({...formData, estimatedRepairTime: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="notes">{t("maintenance.requests.notes")}</Label>
                <Textarea
                  id="notes"
                  placeholder={t("maintenance.requests.notes")}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={2}
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
                    <p className="text-sm text-gray-700 mb-3" title={request.description}>
                      {request.description.length > 100 ? `${request.description.substring(0, 100)}...` : request.description}
                    </p>
                    
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                        >
                          {t("common.start")}
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleStatusUpdate(request.id, 'completed')}
                        >
                          {t("common.complete")}
                        </Button>
                      )}
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
                    <TableHead className="text-center">{t("maintenance.requests.description")}</TableHead>
                    <TableHead className="text-center">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request: MaintenanceRequest) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium text-center">#{request.id}</TableCell>
                      <TableCell className="text-center">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-center">{getMachineName(request.machineId)}</TableCell>
                      <TableCell className="text-center">{request.damageType}</TableCell>
                      <TableCell className="text-center">{getSeverityBadge(request.severity)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-center">{getUserName(request.reportedBy)}</TableCell>
                      <TableCell className="max-w-xs truncate text-center" title={request.description}>
                        {request.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex space-x-1 justify-center">
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                            >
                              {t("common.start")}
                            </Button>
                          )}
                          {request.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(request.id, 'completed')}
                            >
                              {t("common.complete")}
                            </Button>
                          )}
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
    </div>
  );
}