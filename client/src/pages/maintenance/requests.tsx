import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "wouter";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircleIcon, CheckCircleIcon, Clock3Icon, FilterIcon, PlusIcon, SearchIcon, WrenchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-v2";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// Form schema for adding/editing maintenance requests
const maintenanceRequestSchema = z.object({
  machineId: z.string().min(1, { message: "Machine is required" }),
  description: z.string().min(5, { message: "Description is required" }),
  priority: z.string().default("medium"),
  notes: z.string().optional(),
});

export default function MaintenanceRequests() {
  const { t } = useTranslation();
  const [, navigate] = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for dialog visibility and search
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // Form setup
  const form = useForm({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      machineId: "",
      description: "",
      priority: "medium",
      notes: "",
    },
  });
  
  // Query for fetching maintenance requests
  const { data: requests, isLoading, isError } = useQuery({
    queryKey: ["/api/maintenance/requests"],
    queryFn: () => apiRequest("/api/maintenance/requests"),
  });
  
  // Query for fetching machines for dropdown
  const { data: machines } = useQuery({
    queryKey: ["/api/machines"],
    queryFn: () => apiRequest("/api/machines"),
  });
  
  // Mutation for creating maintenance requests
  const createRequestMutation = useMutation({
    mutationFn: (data) => apiRequest("/api/maintenance/requests", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance/requests"] });
      toast({
        title: "Maintenance request created",
        description: "The maintenance request has been created successfully.",
      });
      setIsRequestDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create maintenance request. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating maintenance requests
  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => apiRequest(`/api/maintenance/requests/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance/requests"] });
      toast({
        title: "Maintenance request updated",
        description: "The maintenance request has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update maintenance request. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data) => {
    createRequestMutation.mutate(data);
  };
  
  // Handle viewing a request
  const handleViewRequest = (request) => {
    setCurrentRequest(request);
    setIsViewDialogOpen(true);
  };
  
  // Filter requests based on search query and filters
  const filteredRequests = requests ? requests.filter(request => {
    const matchesSearch = searchQuery === "" || 
                        request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        request.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) : [];
  
  // Organize requests by status for tabs
  const requestsByStatus = {
    new: filteredRequests.filter(r => r.status === "new"),
    under_maintenance: filteredRequests.filter(r => r.status === "under_maintenance"),
    fixed: filteredRequests.filter(r => r.status === "fixed"),
    rejected: filteredRequests.filter(r => r.status === "rejected"),
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case "new":
        return <AlertCircleIcon className="h-5 w-5 text-blue-500" />;
      case "under_maintenance":
        return <Clock3Icon className="h-5 w-5 text-yellow-500" />;
      case "fixed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Get machine name by ID
  const getMachineName = (machineId) => {
    if (!machines) return machineId;
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : machineId;
  };
  
  return (
    <>
      <Helmet>
        <title>Maintenance Requests</title>
      </Helmet>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('Maintenance Requests')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('Track and manage all maintenance requests for machines')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setIsRequestDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              {t('New Request')}
            </Button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search by request number or description...')}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-row gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('Filter by status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Statuses')}</SelectItem>
                <SelectItem value="new">{t('New')}</SelectItem>
                <SelectItem value="under_maintenance">{t('Under Maintenance')}</SelectItem>
                <SelectItem value="fixed">{t('Fixed')}</SelectItem>
                <SelectItem value="rejected">{t('Rejected')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('Filter by priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Priorities')}</SelectItem>
                <SelectItem value="low">{t('Low')}</SelectItem>
                <SelectItem value="medium">{t('Medium')}</SelectItem>
                <SelectItem value="high">{t('High')}</SelectItem>
                <SelectItem value="critical">{t('Critical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Loading/error states */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {isError && (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive text-center">
            {t('Error loading maintenance requests. Please try again.')}
          </div>
        )}
        
        {/* Maintenance requests list - tabbed by status */}
        {!isLoading && !isError && (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="all">{t('All')} ({filteredRequests.length})</TabsTrigger>
              <TabsTrigger value="new">{t('New')} ({requestsByStatus.new.length})</TabsTrigger>
              <TabsTrigger value="under_maintenance">{t('In Progress')} ({requestsByStatus.under_maintenance.length})</TabsTrigger>
              <TabsTrigger value="fixed">{t('Fixed')} ({requestsByStatus.fixed.length})</TabsTrigger>
              <TabsTrigger value="rejected">{t('Rejected')} ({requestsByStatus.rejected.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <RequestsTable 
                requests={filteredRequests} 
                getMachineName={getMachineName} 
                getStatusIcon={getStatusIcon} 
                handleViewRequest={handleViewRequest}
              />
            </TabsContent>
            
            <TabsContent value="new">
              <RequestsTable 
                requests={requestsByStatus.new} 
                getMachineName={getMachineName} 
                getStatusIcon={getStatusIcon} 
                handleViewRequest={handleViewRequest}
              />
            </TabsContent>
            
            <TabsContent value="under_maintenance">
              <RequestsTable 
                requests={requestsByStatus.under_maintenance} 
                getMachineName={getMachineName} 
                getStatusIcon={getStatusIcon} 
                handleViewRequest={handleViewRequest}
              />
            </TabsContent>
            
            <TabsContent value="fixed">
              <RequestsTable 
                requests={requestsByStatus.fixed} 
                getMachineName={getMachineName} 
                getStatusIcon={getStatusIcon} 
                handleViewRequest={handleViewRequest}
              />
            </TabsContent>
            
            <TabsContent value="rejected">
              <RequestsTable 
                requests={requestsByStatus.rejected} 
                getMachineName={getMachineName} 
                getStatusIcon={getStatusIcon} 
                handleViewRequest={handleViewRequest}
              />
            </TabsContent>
          </Tabs>
        )}
        
        {/* Create request dialog */}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('Create Maintenance Request')}</DialogTitle>
              <DialogDescription>
                {t('Submit a new maintenance request for a machine')}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="machineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Machine')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('Select a machine')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {machines && machines.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id}>
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('Describe the issue with the machine')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Priority')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('Select priority')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">{t('Low')}</SelectItem>
                          <SelectItem value="medium">{t('Medium')}</SelectItem>
                          <SelectItem value="high">{t('High')}</SelectItem>
                          <SelectItem value="critical">{t('Critical')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Additional Notes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('Additional information (optional)')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                    {t('Cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></span>
                        {t('Submitting...')}
                      </div>
                    ) : t('Submit Request')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* View request dialog */}
        {currentRequest && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{currentRequest.requestNumber}</DialogTitle>
                <div className="flex items-center mt-2">
                  <Badge className={statusColors[currentRequest.status]}>
                    {t(currentRequest.status.replace('_', ' ')).toUpperCase()}
                  </Badge>
                  <Badge className={`ml-2 ${priorityColors[currentRequest.priority]}`}>
                    {t(currentRequest.priority).toUpperCase()}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('Machine')}</h4>
                  <p>{getMachineName(currentRequest.machineId)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('Description')}</h4>
                  <p>{currentRequest.description}</p>
                </div>
                
                {currentRequest.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('Notes')}</h4>
                    <p>{currentRequest.notes}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('Requested By')}</h4>
                  <p>{currentRequest.requestedBy}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{t('Date Requested')}</h4>
                  <p>{format(new Date(currentRequest.createdAt), 'PPp')}</p>
                </div>
                
                {currentRequest.assignedTo && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('Assigned To')}</h4>
                    <p>{currentRequest.assignedTo}</p>
                  </div>
                )}
                
                {currentRequest.completedAt && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('Completed At')}</h4>
                    <p>{format(new Date(currentRequest.completedAt), 'PPp')}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter className="mt-6">
                {currentRequest.status === "new" && (
                  <Button 
                    onClick={() => {
                      updateRequestMutation.mutate({
                        id: currentRequest.id,
                        data: { 
                          status: "under_maintenance",
                          assignedTo: user.username
                        }
                      });
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <WrenchIcon className="h-4 w-4 mr-2" />
                    {t('Start Maintenance')}
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  {t('Close')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}

// Helper component for requests table
function RequestsTable({ requests, getMachineName, getStatusIcon, handleViewRequest }) {
  const { t } = useTranslation();
  
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">{t('No maintenance requests found')}</p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Request #')}</TableHead>
            <TableHead>{t('Machine')}</TableHead>
            <TableHead>{t('Priority')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead>{t('Requested By')}</TableHead>
            <TableHead>{t('Date')}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="cursor-pointer" onClick={() => handleViewRequest(request)}>
              <TableCell className="font-medium">{request.requestNumber}</TableCell>
              <TableCell>{getMachineName(request.machineId)}</TableCell>
              <TableCell>
                <Badge className={priorityColors[request.priority]}>
                  {t(request.priority).toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <Badge className={statusColors[request.status]}>
                    {t(request.status.replace('_', ' ')).toUpperCase()}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{request.requestedBy}</TableCell>
              <TableCell>{format(new Date(request.createdAt), 'PP')}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  {t('View')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}