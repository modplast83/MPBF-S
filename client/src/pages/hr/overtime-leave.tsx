import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Clock, 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Edit,
  AlertTriangle,
  Users,
  TrendingUp,
  FileText,
  CalendarDays
} from "lucide-react";

const overtimeRequestSchema = z.object({
  userId: z.string().min(1, "User is required"),
  date: z.string().min(1, "Date is required"),
  requestedHours: z.number().min(0.5, "Minimum 0.5 hours required").max(12, "Maximum 12 hours allowed"),
  reason: z.string().min(10, "Please provide detailed reason (minimum 10 characters)")
});

const leaveRequestSchema = z.object({
  userId: z.string().min(1, "User is required"),
  leaveType: z.enum(["sick", "vacation", "personal", "emergency", "maternity", "paternity"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  totalDays: z.number().min(0.5, "Minimum 0.5 days required"),
  reason: z.string().min(10, "Please provide detailed reason (minimum 10 characters)")
});

type OvertimeRequestForm = z.infer<typeof overtimeRequestSchema>;
type LeaveRequestForm = z.infer<typeof leaveRequestSchema>;

export default function OvertimeLeave() {
  const { toast } = useToast();
  const [selectedOvertimeRequest, setSelectedOvertimeRequest] = useState<any>(null);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<any>(null);
  const [isOvertimeDialogOpen, setIsOvertimeDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest('GET', '/api/user')
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users')
  });

  // Fetch employee ranks for overtime limits
  const { data: ranks = [] } = useQuery({
    queryKey: ['/api/hr/employee-ranks'],
    queryFn: () => apiRequest('GET', '/api/hr/employee-ranks')
  });

  // Fetch employee profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ['/api/hr/employee-profiles'],
    queryFn: () => apiRequest('GET', '/api/hr/employee-profiles')
  });

  // Fetch overtime requests
  const { data: overtimeRequests = [], isLoading: loadingOvertime } = useQuery({
    queryKey: ['/api/hr/overtime-requests'],
    queryFn: () => apiRequest('GET', '/api/hr/overtime-requests')
  });

  // Fetch leave requests
  const { data: leaveRequests = [], isLoading: loadingLeave } = useQuery({
    queryKey: ['/api/hr/leave-requests'],
    queryFn: () => apiRequest('GET', '/api/hr/leave-requests')
  });

  // Form setups
  const overtimeForm = useForm<OvertimeRequestForm>({
    resolver: zodResolver(overtimeRequestSchema),
    defaultValues: {
      userId: currentUser?.id || "",
      requestedHours: 2
    }
  });

  const leaveForm = useForm<LeaveRequestForm>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      userId: currentUser?.id || "",
      leaveType: "vacation",
      totalDays: 1
    }
  });

  // Create overtime request mutation
  const createOvertimeMutation = useMutation({
    mutationFn: (data: OvertimeRequestForm) => 
      apiRequest('POST', '/api/hr/overtime-requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/overtime-requests'] });
      setIsOvertimeDialogOpen(false);
      overtimeForm.reset();
      toast({
        title: "Success",
        description: "Overtime request submitted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit overtime request",
        variant: "destructive"
      });
    }
  });

  // Create leave request mutation
  const createLeaveMutation = useMutation({
    mutationFn: (data: LeaveRequestForm) => 
      apiRequest('POST', '/api/hr/leave-requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/leave-requests'] });
      setIsLeaveDialogOpen(false);
      leaveForm.reset();
      toast({
        title: "Success",
        description: "Leave request submitted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive"
      });
    }
  });

  // Approve/Reject overtime mutation
  const updateOvertimeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) =>
      apiRequest('PUT', `/api/hr/overtime-requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/overtime-requests'] });
      toast({
        title: "Success",
        description: "Overtime request updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update overtime request",
        variant: "destructive"
      });
    }
  });

  // Approve/Reject leave mutation
  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) =>
      apiRequest('PUT', `/api/hr/leave-requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/leave-requests'] });
      toast({
        title: "Success",
        description: "Leave request updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update leave request",
        variant: "destructive"
      });
    }
  });

  const handleOvertimeSubmit = (data: OvertimeRequestForm) => {
    // Check overtime limits
    const userProfile = profiles.find((p: any) => p.userId === data.userId);
    const userRank = ranks.find((r: any) => r.id === userProfile?.rankId);
    
    if (userRank && data.requestedHours > userRank.maxOvertimeHours) {
      toast({
        title: "Overtime Limit Exceeded",
        description: `Your rank allows maximum ${userRank.maxOvertimeHours} hours overtime per month`,
        variant: "destructive"
      });
      return;
    }

    createOvertimeMutation.mutate(data);
  };

  const handleLeaveSubmit = (data: LeaveRequestForm) => {
    // Calculate total days
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    createLeaveMutation.mutate({
      ...data,
      totalDays: daysDiff
    });
  };

  const handleApproveOvertime = (id: number, approvedHours: number) => {
    updateOvertimeMutation.mutate({
      id,
      data: {
        status: 'approved',
        approvedBy: currentUser?.id,
        approvedHours,
        approvedAt: new Date().toISOString()
      }
    });
  };

  const handleRejectOvertime = (id: number, reason: string) => {
    updateOvertimeMutation.mutate({
      id,
      data: {
        status: 'rejected',
        approvedBy: currentUser?.id,
        rejectionReason: reason,
        approvedAt: new Date().toISOString()
      }
    });
  };

  const handleApproveLeave = (id: number) => {
    updateLeaveMutation.mutate({
      id,
      data: {
        status: 'approved',
        approvedBy: currentUser?.id,
        approvedAt: new Date().toISOString()
      }
    });
  };

  const handleRejectLeave = (id: number, reason: string) => {
    updateLeaveMutation.mutate({
      id,
      data: {
        status: 'rejected',
        approvedBy: currentUser?.id,
        rejectionReason: reason,
        approvedAt: new Date().toISOString()
      }
    });
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown User';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return variants[status] || "bg-gray-100 text-gray-800";
  };

  const getLeaveTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      sick: "bg-red-100 text-red-800",
      vacation: "bg-blue-100 text-blue-800",
      personal: "bg-purple-100 text-purple-800",
      emergency: "bg-orange-100 text-orange-800",
      maternity: "bg-pink-100 text-pink-800",
      paternity: "bg-indigo-100 text-indigo-800"
    };
    return variants[type] || "bg-gray-100 text-gray-800";
  };

  // Calculate statistics
  const overtimeStats = {
    totalRequests: overtimeRequests.length,
    pending: overtimeRequests.filter((r: any) => r.status === 'pending').length,
    approved: overtimeRequests.filter((r: any) => r.status === 'approved').length,
    totalHours: overtimeRequests.filter((r: any) => r.status === 'approved').reduce((sum: number, r: any) => sum + (r.approvedHours || 0), 0)
  };

  const leaveStats = {
    totalRequests: leaveRequests.length,
    pending: leaveRequests.filter((r: any) => r.status === 'pending').length,
    approved: leaveRequests.filter((r: any) => r.status === 'approved').length,
    totalDays: leaveRequests.filter((r: any) => r.status === 'approved').reduce((sum: number, r: any) => sum + r.totalDays, 0)
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Overtime & Leave Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage overtime requests and leave applications with automatic approval workflows</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overtime Requests</p>
                <p className="text-3xl font-bold text-gray-900">{overtimeStats.totalRequests}</p>
                <p className="text-sm text-gray-500">{overtimeStats.pending} pending</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leave Requests</p>
                <p className="text-3xl font-bold text-gray-900">{leaveStats.totalRequests}</p>
                <p className="text-sm text-gray-500">{leaveStats.pending} pending</p>
              </div>
              <CalendarDays className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved OT Hours</p>
                <p className="text-3xl font-bold text-gray-900">{overtimeStats.totalHours.toFixed(1)}</p>
                <p className="text-sm text-gray-500">this month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Leave Days</p>
                <p className="text-3xl font-bold text-gray-900">{leaveStats.totalDays}</p>
                <p className="text-sm text-gray-500">this month</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overtime" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overtime">Overtime Requests</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
        </TabsList>

        {/* Overtime Tab */}
        <TabsContent value="overtime">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Overtime Requests ({overtimeRequests.length})
                </CardTitle>
                
                <Dialog open={isOvertimeDialogOpen} onOpenChange={setIsOvertimeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setSelectedOvertimeRequest(null);
                      overtimeForm.reset({ userId: currentUser?.id || "" });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Overtime
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Overtime</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...overtimeForm}>
                      <form onSubmit={overtimeForm.handleSubmit(handleOvertimeSubmit)} className="space-y-6">
                        <FormField
                          control={overtimeForm.control}
                          name="userId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {users.map((user: any) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {getUserName(user.id)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={overtimeForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={overtimeForm.control}
                          name="requestedHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Requested Hours</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.5" 
                                  min="0.5" 
                                  max="12" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={overtimeForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Please provide detailed reason for overtime request..."
                                  rows={3}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsOvertimeDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createOvertimeMutation.isPending}
                          >
                            {createOvertimeMutation.isPending ? "Submitting..." : "Submit Request"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingOvertime ? (
                <div className="text-center py-8">Loading overtime requests...</div>
              ) : overtimeRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No overtime requests found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Requested Hours</TableHead>
                        <TableHead>Approved Hours</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overtimeRequests.map((request: any) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {getUserName(request.userId)}
                          </TableCell>
                          <TableCell>
                            {new Date(request.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{request.requestedHours}h</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {request.approvedHours ? `${request.approvedHours}h` : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">{request.reason}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(request.status)}>
                              {request.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && currentUser?.isAdmin && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveOvertime(request.id, request.requestedHours)}
                                  disabled={updateOvertimeMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const reason = prompt("Rejection reason:");
                                    if (reason) handleRejectOvertime(request.id, reason);
                                  }}
                                  disabled={updateOvertimeMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Leave Requests ({leaveRequests.length})
                </CardTitle>
                
                <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setSelectedLeaveRequest(null);
                      leaveForm.reset({ userId: currentUser?.id || "" });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Leave
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Leave</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...leaveForm}>
                      <form onSubmit={leaveForm.handleSubmit(handleLeaveSubmit)} className="space-y-6">
                        <FormField
                          control={leaveForm.control}
                          name="userId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {users.map((user: any) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {getUserName(user.id)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={leaveForm.control}
                          name="leaveType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Leave Type</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sick">Sick Leave</SelectItem>
                                    <SelectItem value="vacation">Vacation</SelectItem>
                                    <SelectItem value="personal">Personal Leave</SelectItem>
                                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                                    <SelectItem value="paternity">Paternity Leave</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={leaveForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={leaveForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={leaveForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Please provide detailed reason for leave request..."
                                  rows={3}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsLeaveDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createLeaveMutation.isPending}
                          >
                            {createLeaveMutation.isPending ? "Submitting..." : "Submit Request"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLeave ? (
                <div className="text-center py-8">Loading leave requests...</div>
              ) : leaveRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No leave requests found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Total Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRequests.map((request: any) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {getUserName(request.userId)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getLeaveTypeBadge(request.leaveType)}>
                              {request.leaveType.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(request.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(request.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{request.totalDays} days</div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">{request.reason}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(request.status)}>
                              {request.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && currentUser?.isAdmin && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveLeave(request.id)}
                                  disabled={updateLeaveMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const reason = prompt("Rejection reason:");
                                    if (reason) handleRejectLeave(request.id, reason);
                                  }}
                                  disabled={updateLeaveMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
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