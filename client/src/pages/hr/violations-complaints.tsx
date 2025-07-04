import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, MessageSquare, Plus, Filter, Search, Eye, Printer, Edit3, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth-v2";
import { useToast } from "@/hooks/use-toast";
import type { HrViolation, HrComplaint, User } from "@shared/schema";

const violationSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  violationType: z.string().min(1, "Violation type is required"),
  severity: z.string().min(1, "Severity is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  actionTaken: z.string().optional(),
  penaltyType: z.string().optional(),
  penaltyAmount: z.number().optional(),
  notes: z.string().optional()
});

const complaintSchema = z.object({
  againstUserId: z.string().optional(),
  complaintType: z.string().min(1, "Complaint type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.string().min(1, "Priority is required"),
  isAnonymous: z.boolean().default(false),
  notes: z.string().optional()
});

const statusChangeSchema = z.object({
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional()
});

type ViolationForm = z.infer<typeof violationSchema>;
type ComplaintForm = z.infer<typeof complaintSchema>;
type StatusChangeForm = z.infer<typeof statusChangeSchema>;

export default function ViolationsComplaintsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isViolationDialogOpen, setIsViolationDialogOpen] = useState(false);
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedViolation, setSelectedViolation] = useState<HrViolation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const violationForm = useForm<ViolationForm>({
    resolver: zodResolver(violationSchema),
    defaultValues: {
      severity: "minor",
      violationType: "conduct"
    }
  });

  const complaintForm = useForm<ComplaintForm>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      priority: "medium",
      complaintType: "work_environment",
      isAnonymous: false
    }
  });

  const statusChangeForm = useForm<StatusChangeForm>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      status: ""
    }
  });

  // Get violations
  const { data: violations, isLoading: violationsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.HR_VIOLATIONS],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.HR_VIOLATIONS)
  });

  // Get complaints
  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.HR_COMPLAINTS],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.HR_COMPLAINTS)
  });

  // Get users for selection
  const { data: users } = useQuery({
    queryKey: [API_ENDPOINTS.USERS],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.USERS)
  });

  // Create violation mutation
  const createViolationMutation = useMutation({
    mutationFn: (data: ViolationForm) => apiRequest('POST', API_ENDPOINTS.HR_VIOLATIONS, {
      ...data,
      reportedBy: user?.id?.toString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.HR_VIOLATIONS] });
      toast({
        title: t("hr.common.success"),
        description: "Violation reported successfully"
      });
      setIsViolationDialogOpen(false);
      violationForm.reset();
    }
  });

  // Create complaint mutation
  const createComplaintMutation = useMutation({
    mutationFn: (data: ComplaintForm) => apiRequest('POST', API_ENDPOINTS.HR_COMPLAINTS, {
      ...data,
      complainantId: user?.id?.toString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.HR_COMPLAINTS] });
      toast({
        title: t("hr.common.success"),
        description: "Complaint filed successfully"
      });
      setIsComplaintDialogOpen(false);
      complaintForm.reset();
    }
  });

  // Update violation status mutation
  const updateViolationStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: StatusChangeForm }) => 
      apiRequest('PATCH', `${API_ENDPOINTS.HR_VIOLATIONS}/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.HR_VIOLATIONS] });
      toast({
        title: "Success",
        description: "Violation status updated successfully"
      });
      setIsStatusDialogOpen(false);
      statusChangeForm.reset();
    }
  });

  const onViolationSubmit = (data: ViolationForm) => {
    createViolationMutation.mutate(data);
  };

  const onComplaintSubmit = (data: ComplaintForm) => {
    createComplaintMutation.mutate(data);
  };

  const onStatusChangeSubmit = (data: StatusChangeForm) => {
    if (selectedViolation) {
      updateViolationStatusMutation.mutate({ id: selectedViolation.id, data });
    }
  };

  const handleViewViolation = (violation: HrViolation) => {
    setSelectedViolation(violation);
    setIsViewDialogOpen(true);
  };

  const handlePrintViolation = (violation: HrViolation) => {
    const printContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">Violation Report</h2>
        <div style="margin: 20px 0;">
          <p><strong>ID:</strong> ${violation.id}</p>
          <p><strong>Title:</strong> ${violation.title}</p>
          <p><strong>Employee ID:</strong> ${violation.userId}</p>
          <p><strong>Violation Type:</strong> ${violation.violationType}</p>
          <p><strong>Severity:</strong> ${violation.severity}</p>
          <p><strong>Status:</strong> ${violation.status}</p>
          <p><strong>Reported By:</strong> ${violation.reportedBy}</p>
          <p><strong>Report Date:</strong> ${format(new Date(violation.reportDate), 'MMM dd, yyyy HH:mm')}</p>
          <p><strong>Description:</strong></p>
          <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0;">${violation.description}</div>
          ${violation.actionTaken ? `<p><strong>Action Taken:</strong></p><div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0;">${violation.actionTaken}</div>` : ''}
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleChangeStatus = (violation: HrViolation) => {
    setSelectedViolation(violation);
    statusChangeForm.setValue('status', violation.status);
    setIsStatusDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      open: "bg-red-100 text-red-800",
      investigating: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      dismissed: "bg-gray-100 text-gray-800",
      closed: "bg-blue-100 text-blue-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const getSeverityBadge = (severity: string) => {
    const severityColors = {
      minor: "bg-green-100 text-green-800",
      major: "bg-yellow-100 text-yellow-800",
      critical: "bg-red-100 text-red-800"
    };
    return severityColors[severity as keyof typeof severityColors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    return priorityColors[priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-800";
  };

  const filteredViolations = violations?.filter((violation: HrViolation) => {
    const matchesStatus = statusFilter === "all" || violation.status === statusFilter;
    const matchesSearch = (violation.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (violation.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredComplaints = complaints?.filter((complaint: HrComplaint) => {
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesSearch = (complaint.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (complaint.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Helper function to get user name by ID
  const getUserName = (userId: string) => {
    const user = users?.find((u: User) => u.id === userId);
    return user ? user.firstName || user.username : userId;
  };

  return (
    <div className={`container mx-auto ${isMobile ? "p-3" : "p-3 sm:p-6"}`}>
      <div className={isMobile ? "mb-4" : "mb-6 sm:mb-8"}>
        <div className={`flex gap-4 ${isMobile ? "flex-col" : "flex-col sm:flex-row sm:justify-between sm:items-center"}`}>
          <div>
            <h1 className={`font-bold text-gray-900 dark:text-gray-100 ${isMobile ? "text-xl" : "text-2xl sm:text-3xl"}`}>
              {t("hr.violations_complaints.title")}
            </h1>
            <p className={`text-gray-600 dark:text-gray-400 mt-2 ${isMobile ? "text-sm" : "text-sm sm:text-base"}`}>
              {t("hr.violations_complaints.investigation_notes")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
            <Dialog open={isViolationDialogOpen} onOpenChange={setIsViolationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{t("hr.violations_complaints.report_violation")}</span>
                  <span className="sm:hidden">Report Violation</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t("hr.violations_complaints.report_violation")}</DialogTitle>
                  <DialogDescription>
                    Report a workplace violation or policy breach
                  </DialogDescription>
                </DialogHeader>
                <Form {...violationForm}>
                  <form onSubmit={violationForm.handleSubmit(onViolationSubmit)} className="space-y-4">
                    <FormField
                      control={violationForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.common.employee")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users?.map((user: User) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName} ({user.username})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={violationForm.control}
                        name="violationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("hr.violations_complaints.violation_type")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="attendance">{t("hr.violations_complaints.attendance")}</SelectItem>
                                <SelectItem value="conduct">{t("hr.violations_complaints.conduct")}</SelectItem>
                                <SelectItem value="safety">{t("hr.violations_complaints.safety")}</SelectItem>
                                <SelectItem value="performance">{t("hr.violations_complaints.performance")}</SelectItem>
                                <SelectItem value="policy">{t("hr.violations_complaints.policy")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={violationForm.control}
                        name="severity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("hr.violations_complaints.severity")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="minor">{t("hr.violations_complaints.minor")}</SelectItem>
                                <SelectItem value="major">{t("hr.violations_complaints.major")}</SelectItem>
                                <SelectItem value="critical">{t("hr.violations_complaints.critical")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={violationForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={violationForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.violations_complaints.description")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={violationForm.control}
                      name="actionTaken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.violations_complaints.action_taken")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createViolationMutation.isPending}
                      >
                        {createViolationMutation.isPending ? t("common.loading") : t("common.submit")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isComplaintDialogOpen} onOpenChange={setIsComplaintDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{t("hr.violations_complaints.file_complaint")}</span>
                  <span className="sm:hidden">File Complaint</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t("hr.violations_complaints.file_complaint")}</DialogTitle>
                  <DialogDescription>
                    File a workplace complaint or concern
                  </DialogDescription>
                </DialogHeader>
                <Form {...complaintForm}>
                  <form onSubmit={complaintForm.handleSubmit(onComplaintSubmit)} className="space-y-4">
                    <FormField
                      control={complaintForm.control}
                      name="againstUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.violations_complaints.against_user")} (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employee (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users?.map((user: User) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName} ({user.username})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={complaintForm.control}
                        name="complaintType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("hr.violations_complaints.complaint_type")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="harassment">{t("hr.violations_complaints.harassment")}</SelectItem>
                                <SelectItem value="discrimination">{t("hr.violations_complaints.discrimination")}</SelectItem>
                                <SelectItem value="work_environment">{t("hr.violations_complaints.work_environment")}</SelectItem>
                                <SelectItem value="management">{t("hr.violations_complaints.management")}</SelectItem>
                                <SelectItem value="safety">{t("hr.violations_complaints.safety")}</SelectItem>
                                <SelectItem value="other">{t("hr.violations_complaints.other")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={complaintForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("hr.violations_complaints.priority")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">{t("hr.violations_complaints.low")}</SelectItem>
                                <SelectItem value="medium">{t("hr.violations_complaints.medium")}</SelectItem>
                                <SelectItem value="high">{t("hr.violations_complaints.high")}</SelectItem>
                                <SelectItem value="urgent">{t("hr.violations_complaints.urgent")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={complaintForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={complaintForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.violations_complaints.description")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createComplaintMutation.isPending}
                      >
                        {createComplaintMutation.isPending ? t("common.loading") : t("common.submit")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <Select onValueChange={setStatusFilter} defaultValue={statusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">{t("hr.violations_complaints.open")}</SelectItem>
              <SelectItem value="investigating">{t("hr.violations_complaints.investigating")}</SelectItem>
              <SelectItem value="resolved">{t("hr.violations_complaints.resolved")}</SelectItem>
              <SelectItem value="dismissed">{t("hr.violations_complaints.dismissed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4" />
          <Input
            placeholder={t("hr.common.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[250px]"
          />
        </div>
      </div>

      {/* Tabs for Violations and Complaints */}
      <Tabs defaultValue="violations" className="w-full">
        <TabsList>
          <TabsTrigger value="violations" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{t("hr.violations_complaints.violations")}</span>
          </TabsTrigger>
          <TabsTrigger value="complaints" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>{t("hr.violations_complaints.complaints")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <CardTitle>{t("hr.violations_complaints.violations")}</CardTitle>
              <CardDescription>
                Workplace violations and policy breaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {violationsLoading ? (
                <div className="text-center py-4">{t("hr.common.loading")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>{t("hr.common.employee")}</TableHead>
                      <TableHead>{t("hr.violations_complaints.violation_type")}</TableHead>
                      <TableHead>{t("hr.violations_complaints.severity")}</TableHead>
                      <TableHead>{t("hr.violations_complaints.reported_by")}</TableHead>
                      <TableHead>{t("hr.violations_complaints.report_date")}</TableHead>
                      <TableHead>{t("hr.common.status")}</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredViolations?.map((violation: HrViolation) => (
                      <TableRow key={violation.id}>
                        <TableCell className="font-medium">{violation.title}</TableCell>
                        <TableCell>{getUserName(violation.userId)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`hr.violations_complaints.${violation.violationType}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityBadge(violation.severity)}>
                            {t(`hr.violations_complaints.${violation.severity}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getUserName(violation.reportedBy)}</TableCell>
                        <TableCell>{format(new Date(violation.reportDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(violation.status)}>
                            {t(`hr.violations_complaints.${violation.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewViolation(violation)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintViolation(violation)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeStatus(violation)}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Change Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredViolations || filteredViolations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          {t("hr.common.no_data")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints">
          <Card>
            <CardHeader>
              <CardTitle>{t("hr.violations_complaints.complaints")}</CardTitle>
              <CardDescription>
                Employee complaints and workplace concerns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {complaintsLoading ? (
                <div className="text-center py-4">{t("hr.common.loading")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>{t("hr.violations_complaints.complainant")}</TableHead>
                      <TableHead>{t("hr.violations_complaints.complaint_type")}</TableHead>
                      <TableHead>{t("hr.violations_complaints.priority")}</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>{t("hr.common.status")}</TableHead>
                      <TableHead>{t("hr.violations_complaints.assigned_to")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComplaints?.map((complaint: HrComplaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-medium">{complaint.title}</TableCell>
                        <TableCell>
                          {complaint.isAnonymous ? t("hr.violations_complaints.anonymous") : complaint.complainantId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`hr.violations_complaints.${complaint.complaintType}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityBadge(complaint.priority)}>
                            {t(`hr.violations_complaints.${complaint.priority}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(complaint.submittedDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(complaint.status)}>
                            {t(`hr.violations_complaints.${complaint.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{complaint.assignedTo || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!filteredComplaints || filteredComplaints.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          {t("hr.common.no_data")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Violation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Violation Details</DialogTitle>
            <DialogDescription>
              Complete information about the violation
            </DialogDescription>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Violation ID</label>
                  <p className="text-sm">{selectedViolation.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee</label>
                  <p className="text-sm">{getUserName(selectedViolation.userId)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Title</label>
                <p className="text-sm font-medium">{selectedViolation.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Violation Type</label>
                  <Badge variant="outline" className="mt-1">
                    {t(`hr.violations_complaints.${selectedViolation.violationType}`)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Severity</label>
                  <Badge className={`mt-1 ${getSeverityBadge(selectedViolation.severity)}`}>
                    {t(`hr.violations_complaints.${selectedViolation.severity}`)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={`mt-1 ${getStatusBadge(selectedViolation.status)}`}>
                    {t(`hr.violations_complaints.${selectedViolation.status}`)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Report Date</label>
                  <p className="text-sm">{format(new Date(selectedViolation.reportDate), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Reported By</label>
                <p className="text-sm">{getUserName(selectedViolation.reportedBy)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <div className="mt-1 p-3 border rounded-md bg-gray-50 text-sm">
                  {selectedViolation.description}
                </div>
              </div>

              {selectedViolation.actionTaken && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Action Taken</label>
                  <div className="mt-1 p-3 border rounded-md bg-gray-50 text-sm">
                    {selectedViolation.actionTaken}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Violation Status</DialogTitle>
            <DialogDescription>
              Update the status of this violation
            </DialogDescription>
          </DialogHeader>
          <Form {...statusChangeForm}>
            <form onSubmit={statusChangeForm.handleSubmit(onStatusChangeSubmit)} className="space-y-4">
              <FormField
                control={statusChangeForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={statusChangeForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Add notes about the status change..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateViolationStatusMutation.isPending}
                >
                  {updateViolationStatusMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}