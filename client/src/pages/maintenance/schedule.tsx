import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays, addWeeks, addMonths, addYears, isPast } from "date-fns";
import { Plus, Calendar, AlertTriangle, CheckCircle, Clock, Search } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";

const FREQUENCY_OPTIONS = ["daily", "weekly", "monthly", "quarterly", "yearly"];
const MAINTENANCE_TYPES = ["preventive", "corrective", "predictive", "emergency"];

interface MaintenanceSchedule {
  id: number;
  machineId: string;
  maintenanceType: string;
  frequency: string;
  nextDue: string;
  lastPerformed?: string;
  description: string;
  assignedTo?: string;
  estimatedDuration: number;
  isActive: boolean;
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

export default function MaintenanceSchedulePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("upcoming");

  const [formData, setFormData] = useState({
    machineId: "",
    maintenanceType: "preventive",
    frequency: "monthly",
    nextDue: "",
    description: "",
    assignedTo: "",
    estimatedDuration: "",
  });

  // Fetch maintenance schedules
  const { data: schedules = [], isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
    queryKey: [API_ENDPOINTS.MAINTENANCE_SCHEDULE],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.MAINTENANCE_SCHEDULE)
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

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', API_ENDPOINTS.MAINTENANCE_SCHEDULE, data),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: "Maintenance schedule created successfully",
      });
      setIsDialogOpen(false);
      resetForm();
      refetchSchedules();
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MAINTENANCE_SCHEDULE] });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || "Failed to create maintenance schedule",
        variant: "destructive",
      });
    },
  });

  // Generate automatic schedules mutation
  const generateSchedulesMutation = useMutation({
    mutationFn: () => apiRequest('POST', `${API_ENDPOINTS.MAINTENANCE_SCHEDULE}/generate`, {}),
    onSuccess: (response: any) => {
      toast({
        title: "Success",
        description: response.message || "Maintenance schedules generated successfully",
      });
      refetchSchedules();
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MAINTENANCE_SCHEDULE] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate maintenance schedules",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      machineId: "",
      maintenanceType: "preventive",
      frequency: "monthly",
      nextDue: "",
      description: "",
      assignedTo: "",
      estimatedDuration: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.machineId || !formData.nextDue || !formData.description) {
      toast({
        title: t("maintenance.requests.validationError"),
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const scheduleData = {
      ...formData,
      estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
      isActive: true,
    };

    createScheduleMutation.mutate(scheduleData);
  };

  const getNextDueDate = (frequency: string, lastPerformed?: string) => {
    const baseDate = lastPerformed ? new Date(lastPerformed) : new Date();
    
    switch (frequency) {
      case "daily":
        return addDays(baseDate, 1);
      case "weekly":
        return addWeeks(baseDate, 1);
      case "monthly":
        return addMonths(baseDate, 1);
      case "quarterly":
        return addMonths(baseDate, 3);
      case "yearly":
        return addYears(baseDate, 1);
      default:
        return addMonths(baseDate, 1);
    }
  };

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule: MaintenanceSchedule) => {
    const matchesSearch = searchQuery === "" || 
      schedule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.maintenanceType.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch && schedule.isActive;
  });

  // Categorize schedules
  const upcomingSchedules = filteredSchedules.filter((schedule: MaintenanceSchedule) => 
    !isPast(new Date(schedule.nextDue))
  );
  
  const overdueSchedules = filteredSchedules.filter((schedule: MaintenanceSchedule) => 
    isPast(new Date(schedule.nextDue))
  );

  const getMachineName = (machineId: string) => {
    const machine = machines.find((m: Machine) => m.id === machineId);
    return machine ? machine.name : machineId;
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : userId;
  };

  const getMaintenanceTypeBadge = (type: string) => {
    switch (type) {
      case "preventive":
        return <Badge variant="default">{t(`maintenance.maintenanceTypes.${type}`)}</Badge>;
      case "corrective":
        return <Badge variant="secondary">{t(`maintenance.maintenanceTypes.${type}`)}</Badge>;
      case "predictive":
        return <Badge variant="outline">{t(`maintenance.maintenanceTypes.${type}`)}</Badge>;
      case "emergency":
        return <Badge variant="destructive">{t(`maintenance.maintenanceTypes.${type}`)}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (nextDue: string) => {
    const dueDate = new Date(nextDue);
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
    } else if (daysDiff <= 7) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Due Soon</Badge>;
    } else {
      return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" />Scheduled</Badge>;
    }
  };

  return (
    <div className={`container mx-auto space-y-6 ${isMobile ? "p-3" : "p-4"}`}>
      <PageHeader
        title={t("maintenance.schedule.title")}
        description={t("maintenance.schedule.description")}
      />

      {/* Action Bar */}
      <div className={`flex gap-4 items-start justify-between ${isMobile ? "flex-col" : "flex-col sm:flex-row sm:items-center"}`}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search schedules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => generateSchedulesMutation.mutate()}
            disabled={generateSchedulesMutation.isPending}
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {generateSchedulesMutation.isPending ? "Generating..." : "Generate Auto Schedules"}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("maintenance.schedule.scheduleMaintenance")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("maintenance.schedule.scheduleMaintenance")}</DialogTitle>
              <DialogDescription>
                Schedule preventive maintenance for equipment
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
                <Label htmlFor="maintenanceType">{t("maintenance.schedule.maintenanceType")}</Label>
                <Select 
                  value={formData.maintenanceType} 
                  onValueChange={(value) => setFormData({...formData, maintenanceType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`maintenance.maintenanceTypes.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">{t("maintenance.schedule.frequency")}</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value) => setFormData({...formData, frequency: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {t(`maintenance.schedule.${freq}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nextDue">{t("maintenance.schedule.nextDue")} *</Label>
                <Input
                  id="nextDue"
                  type="date"
                  value={formData.nextDue}
                  onChange={(e) => setFormData({...formData, nextDue: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="description">{t("maintenance.requests.description")} *</Label>
                <Input
                  id="description"
                  placeholder="Describe the maintenance task..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="assignedTo">{t("maintenance.requests.assignedTo")}</Label>
                <Select 
                  value={formData.assignedTo} 
                  onValueChange={(value) => setFormData({...formData, assignedTo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: User) => (
                      <SelectItem key={user.id} value={user.id}>
                        {getUserName(user.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  placeholder="Enter estimated hours"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createScheduleMutation.isPending}>
                  {createScheduleMutation.isPending ? "Scheduling..." : "Schedule"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedule Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            {t("maintenance.schedule.upcoming")} ({upcomingSchedules.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            {t("maintenance.schedule.overdue")} ({overdueSchedules.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Schedules ({filteredSchedules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>{t("maintenance.schedule.upcoming")}</CardTitle>
              <CardDescription>
                Scheduled maintenance tasks that are upcoming
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSchedules.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No upcoming maintenance scheduled
                </div>
              ) : isMobile ? (
                <div className="space-y-3">
                  {upcomingSchedules.map((schedule: MaintenanceSchedule) => (
                    <Card key={schedule.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{getMachineName(schedule.machineId)}</span>
                          {getMaintenanceTypeBadge(schedule.maintenanceType)}
                        </div>
                        {getStatusBadge(schedule.nextDue)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Due Date:</span>
                          <span className="font-medium">{format(new Date(schedule.nextDue), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          <span>{t(`maintenance.schedule.${schedule.frequency}`)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned To:</span>
                          <span>{schedule.assignedTo ? getUserName(schedule.assignedTo) : 'Unassigned'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Performed:</span>
                          <span>
                            {schedule.lastPerformed 
                              ? format(new Date(schedule.lastPerformed), 'MMM dd, yyyy')
                              : 'Never'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-700" title={schedule.description}>
                          {schedule.description.length > 80 ? `${schedule.description.substring(0, 80)}...` : schedule.description}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingSchedules.map((schedule: MaintenanceSchedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{getMachineName(schedule.machineId)}</TableCell>
                          <TableCell>{getMaintenanceTypeBadge(schedule.maintenanceType)}</TableCell>
                          <TableCell className="max-w-xs truncate" title={schedule.description}>
                            {schedule.description}
                          </TableCell>
                          <TableCell>{format(new Date(schedule.nextDue), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{t(`maintenance.schedule.${schedule.frequency}`)}</TableCell>
                          <TableCell>{schedule.assignedTo ? getUserName(schedule.assignedTo) : 'Unassigned'}</TableCell>
                          <TableCell>{getStatusBadge(schedule.nextDue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>{t("maintenance.schedule.overdue")}</CardTitle>
              <CardDescription>
                Maintenance tasks that are past their due date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overdueSchedules.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No overdue maintenance
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueSchedules.map((schedule: MaintenanceSchedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{getMachineName(schedule.machineId)}</TableCell>
                          <TableCell>{getMaintenanceTypeBadge(schedule.maintenanceType)}</TableCell>
                          <TableCell className="max-w-xs truncate" title={schedule.description}>
                            {schedule.description}
                          </TableCell>
                          <TableCell>{format(new Date(schedule.nextDue), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="text-red-600 font-semibold">
                            {Math.abs(Math.ceil((new Date(schedule.nextDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                          </TableCell>
                          <TableCell>{schedule.assignedTo ? getUserName(schedule.assignedTo) : 'Unassigned'}</TableCell>
                          <TableCell>{getStatusBadge(schedule.nextDue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Maintenance Schedules</CardTitle>
              <CardDescription>
                Complete list of all scheduled maintenance tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSchedules.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No maintenance schedules found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Last Performed</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchedules.map((schedule: MaintenanceSchedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{getMachineName(schedule.machineId)}</TableCell>
                          <TableCell>{getMaintenanceTypeBadge(schedule.maintenanceType)}</TableCell>
                          <TableCell className="max-w-xs truncate" title={schedule.description}>
                            {schedule.description}
                          </TableCell>
                          <TableCell>{format(new Date(schedule.nextDue), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{t(`maintenance.schedule.${schedule.frequency}`)}</TableCell>
                          <TableCell>
                            {schedule.lastPerformed 
                              ? format(new Date(schedule.lastPerformed), 'MMM dd, yyyy')
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>{schedule.assignedTo ? getUserName(schedule.assignedTo) : 'Unassigned'}</TableCell>
                          <TableCell>{getStatusBadge(schedule.nextDue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}