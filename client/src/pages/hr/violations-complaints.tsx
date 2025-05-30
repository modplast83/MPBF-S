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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, MessageSquare, Plus, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

type ViolationForm = z.infer<typeof violationSchema>;
type ComplaintForm = z.infer<typeof complaintSchema>;

export default function ViolationsComplaintsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isViolationDialogOpen, setIsViolationDialogOpen] = useState(false);
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  const onViolationSubmit = (data: ViolationForm) => {
    createViolationMutation.mutate(data);
  };

  const onComplaintSubmit = (data: ComplaintForm) => {
    createComplaintMutation.mutate(data);
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
    const matchesSearch = violation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         violation.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredComplaints = complaints?.filter((complaint: HrComplaint) => {
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t("hr.violations_complaints.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t("hr.violations_complaints.investigation_notes")}
            </p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isViolationDialogOpen} onOpenChange={setIsViolationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {t("hr.violations_complaints.report_violation")}
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
                        {createViolationMutation.isPending ? t("hr.common.loading") : t("hr.common.submit")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isComplaintDialogOpen} onOpenChange={setIsComplaintDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("hr.violations_complaints.file_complaint")}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredViolations?.map((violation: HrViolation) => (
                      <TableRow key={violation.id}>
                        <TableCell className="font-medium">{violation.title}</TableCell>
                        <TableCell>{violation.userId}</TableCell>
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
                        <TableCell>{violation.reportedBy}</TableCell>
                        <TableCell>{format(new Date(violation.reportDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(violation.status)}>
                            {t(`hr.violations_complaints.${violation.status}`)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredViolations || filteredViolations.length === 0) && (
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
    </div>
  );
}