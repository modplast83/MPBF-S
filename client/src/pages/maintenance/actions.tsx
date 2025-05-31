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
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Plus, Search, Wrench, FileText, DollarSign } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";

const ACTION_TYPES = ["Repair", "Change Parts", "Workshop"];

interface MaintenanceAction {
  id: number;
  actionDate: string;
  requestId: number;
  machineId: string;
  performedBy: string;
  actionType: string;
  description: string;
  cost: number;
  hours: number;
  status: string;
  partReplaced?: string;
  partId?: number;
}

interface MaintenanceRequest {
  id: number;
  requestNumber: string;
  machineId: string;
  damageType: string;
  severity: string;
  description: string;
  status: string;
  createdAt?: string;
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

export default function MaintenanceActionsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    requestId: "",
    machineId: "",
    actionsTaken: [] as string[],
    description: "",
    partsCost: "",
    laborHours: "",
    notes: "",
  });

  // Fetch maintenance actions
  const { data: actions = [], isLoading: actionsLoading, refetch: refetchActions } = useQuery({
    queryKey: [API_ENDPOINTS.MAINTENANCE_ACTIONS],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.MAINTENANCE_ACTIONS)
  });

  // Fetch maintenance requests
  const { data: requests = [] } = useQuery({
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

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', API_ENDPOINTS.MAINTENANCE_ACTIONS, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Maintenance action recorded successfully",
      });
      setIsDialogOpen(false);
      resetForm();
      refetchActions();
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MAINTENANCE_ACTIONS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MAINTENANCE_REQUESTS] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record maintenance action",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      requestId: "",
      machineId: "",
      actionsTaken: [],
      description: "",
      partsCost: "",
      laborHours: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.requestId || !formData.machineId || formData.actionsTaken.length === 0 || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const actionData = {
      ...formData,
      requestId: parseInt(formData.requestId),
      partsCost: formData.partsCost ? parseFloat(formData.partsCost) : 0,
      laborHours: formData.laborHours ? parseFloat(formData.laborHours) : 0,
    };

    createActionMutation.mutate(actionData);
  };

  const handleActionTypeToggle = (actionType: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        actionsTaken: [...formData.actionsTaken, actionType]
      });
    } else {
      setFormData({
        ...formData,
        actionsTaken: formData.actionsTaken.filter(type => type !== actionType)
      });
    }
  };

  const handleRequestChange = (requestId: string) => {
    const request = requests.find((r: MaintenanceRequest) => r.id.toString() === requestId);
    if (request) {
      setFormData({
        ...formData,
        requestId,
        machineId: request.machineId,
      });
    }
  };

  // Filter actions
  const filteredActions = actions.filter((action: MaintenanceAction) => {
    const matchesSearch = searchQuery === "" || 
      action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.machineId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || action.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getMachineName = (machineId: string) => {
    const machine = machines.find((m: Machine) => m.id === machineId);
    return machine ? machine.name : machineId;
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : userId;
  };

  const getRequestInfo = (requestId: number) => {
    const request = requests.find((r: MaintenanceRequest) => r.id === requestId);
    return request ? `${request.requestNumber || '#' + request.id} - ${request.damageType}` : `#${requestId}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">{status}</Badge>;
      case "in_progress":
        return <Badge variant="secondary">{status}</Badge>;
      case "pending":
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get all maintenance requests for dropdown (sorted by most recent first)
  const availableRequests = requests.filter((r: MaintenanceRequest) => 
    r.status !== 'completed' && r.status !== 'cancelled'
  ).sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

  return (
    <div className={`container mx-auto space-y-6 ${isMobile ? "p-3" : "p-4"}`}>
      <PageHeader
        title={t("maintenance.actions.title")}
        description={t("maintenance.actions.description")}
      />

      {/* Action Bar */}
      <div className={`flex gap-4 items-start justify-between ${isMobile ? "flex-col" : "flex-col sm:flex-row sm:items-center"}`}>
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Action
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Maintenance Action</DialogTitle>
              <DialogDescription>
                Record the actions taken for a maintenance request
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="requestId">Maintenance Request *</Label>
                <Select 
                  value={formData.requestId} 
                  onValueChange={handleRequestChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance request" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRequests.map((request: MaintenanceRequest) => (
                      <SelectItem key={request.id} value={request.id.toString()}>
                        {request.requestNumber || '#' + request.id} - {getMachineName(request.machineId)} ({request.damageType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="machineId">Machine *</Label>
                <Select 
                  value={formData.machineId} 
                  onValueChange={(value) => setFormData({...formData, machineId: value})}
                  disabled={!!formData.requestId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine" />
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
                <Label>Actions Taken *</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {ACTION_TYPES.map((actionType) => (
                    <div key={actionType} className="flex items-center space-x-2">
                      <Checkbox
                        id={actionType}
                        checked={formData.actionsTaken.includes(actionType)}
                        onCheckedChange={(checked) => handleActionTypeToggle(actionType, checked as boolean)}
                      />
                      <Label htmlFor={actionType} className="cursor-pointer">
                        {actionType}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the actions taken..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partsCost">Parts Cost ($)</Label>
                  <Input
                    id="partsCost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.partsCost}
                    onChange={(e) => setFormData({...formData, partsCost: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="laborHours">Labor Hours</Label>
                  <Input
                    id="laborHours"
                    type="number"
                    step="0.5"
                    placeholder="0.0"
                    value={formData.laborHours}
                    onChange={(e) => setFormData({...formData, laborHours: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or observations..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createActionMutation.isPending}>
                  {createActionMutation.isPending ? "Recording..." : "Record Action"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Actions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("maintenance.actions.table_title", { count: filteredActions.length })}</CardTitle>
          <CardDescription>
            {t("maintenance.actions.table_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionsLoading ? (
            <div className="text-center py-4">{t("common.loading")}</div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {t("maintenance.actions.no_actions")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("maintenance.actions.id")}</TableHead>
                    <TableHead>{t("maintenance.actions.date")}</TableHead>
                    <TableHead>{t("maintenance.actions.request")}</TableHead>
                    <TableHead>{t("maintenance.actions.machine")}</TableHead>
                    <TableHead>{t("maintenance.actions.actionsTaken")}</TableHead>
                    <TableHead>{t("maintenance.actions.actionBy")}</TableHead>
                    <TableHead>{t("maintenance.actions.laborHours")}</TableHead>
                    <TableHead>{t("maintenance.actions.partsCost")}</TableHead>
                    <TableHead>{t("maintenance.actions.status")}</TableHead>
                    <TableHead>{t("maintenance.actions.description")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.map((action: MaintenanceAction) => (
                    <TableRow key={action.id}>
                      <TableCell className="font-medium">#{action.id}</TableCell>
                      <TableCell>{format(new Date(action.actionDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{getRequestInfo(action.requestId)}</TableCell>
                      <TableCell>{getMachineName(action.machineId)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {action.actionType}
                        </Badge>
                      </TableCell>
                      <TableCell>{getUserName(action.performedBy)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-1 text-gray-400" />
                          {action.hours}h
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                          ${action.cost.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(action.status)}</TableCell>
                      <TableCell className="max-w-xs truncate" title={action.description}>
                        {action.description}
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