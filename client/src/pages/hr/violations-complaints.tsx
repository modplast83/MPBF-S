import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Printer,
  Search,
  Filter,
  FileText,
  Users,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserX,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-v2";
import type { HrViolation, HrComplaint, User } from "@shared/schema";

// Professional violation types configuration
const VIOLATION_TYPES = {
  attendance: {
    label: "Attendance Issues",
    subtypes: [
      "absent_without_notice",
      "excessive_lateness",
      "early_departure",
      "extended_breaks",
      "unauthorized_leave"
    ],
    icon: Clock,
    color: "bg-orange-100 text-orange-800"
  },
  production: {
    label: "Production Violations",
    subtypes: [
      "quality_defects",
      "production_targets_missed",
      "wrong_specifications",
      "material_waste",
      "process_deviation"
    ],
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800"
  },
  conduct: {
    label: "Conduct Issues",
    subtypes: [
      "insubordination",
      "harassment",
      "unprofessional_behavior",
      "conflict_with_colleagues",
      "inappropriate_language"
    ],
    icon: UserX,
    color: "bg-purple-100 text-purple-800"
  },
  safety: {
    label: "Safety Violations",
    subtypes: [
      "ppe_non_compliance",
      "unsafe_work_practices",
      "ignoring_safety_protocols",
      "equipment_misuse",
      "creating_hazards"
    ],
    icon: AlertCircle,
    color: "bg-yellow-100 text-yellow-800"
  },
  policy: {
    label: "Policy Violations",
    subtypes: [
      "dress_code",
      "mobile_phone_usage",
      "smoking_violations",
      "unauthorized_areas",
      "data_privacy_breach"
    ],
    icon: FileText,
    color: "bg-blue-100 text-blue-800"
  },
  damage: {
    label: "Equipment/Property Damage",
    subtypes: [
      "equipment_damage",
      "product_damage",
      "facility_damage",
      "vehicle_damage",
      "negligent_handling"
    ],
    icon: DollarSign,
    color: "bg-gray-100 text-gray-800"
  }
};

const ACTION_TYPES = [
  { value: "warning", label: "Verbal Warning" },
  { value: "written_warning", label: "Written Warning" },
  { value: "suspension", label: "Suspension" },
  { value: "termination", label: "Termination" },
  { value: "training", label: "Additional Training" },
  { value: "counseling", label: "Counseling" }
];

const SEVERITY_LEVELS = [
  { value: "minor", label: "Minor", color: "bg-green-100 text-green-800" },
  { value: "major", label: "Major", color: "bg-yellow-100 text-yellow-800" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" }
];

const violationFormSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  violationType: z.string().min(1, "Violation type is required"),
  violationSubtype: z.string().min(1, "Violation subtype is required"),
  severity: z.string().min(1, "Severity is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  actionTaken: z.string().min(1, "Action taken is required"),
  actionDetails: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  incidentDate: z.string().min(1, "Incident date is required"),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional()
});

type ViolationFormData = z.infer<typeof violationFormSchema>;

export default function ViolationsComplaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedViolation, setSelectedViolation] = useState<HrViolation | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Fetch violations
  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: ["/api/hr-violations"],
  });

  // Fetch users for employee selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Create violation mutation
  const createViolationMutation = useMutation({
    mutationFn: async (data: ViolationFormData) => {
      const response = await fetch("/api/hr-violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          reportedBy: user?.id,
          incidentDate: new Date(data.incidentDate),
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
          estimatedCost: data.estimatedCost || 0,
          actualCost: data.actualCost || 0
        }),
      });
      if (!response.ok) throw new Error("Failed to create violation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr-violations"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Violation created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create violation", variant: "destructive" });
    },
  });

  // Delete violation mutation
  const deleteViolationMutation = useMutation({
    mutationFn: async (violationId: number) => {
      const response = await fetch(`/api/hr-violations/${violationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete violation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr-violations"] });
      toast({ title: "Violation deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete violation", variant: "destructive" });
    },
  });

  const handleDeleteViolation = (violation: HrViolation) => {
    if (window.confirm(`Are you sure you want to delete violation ${violation.violationNumber || `VIO-${violation.id}`}? This action cannot be undone.`)) {
      deleteViolationMutation.mutate(violation.id);
    }
  };

  const form = useForm<ViolationFormData>({
    resolver: zodResolver(violationFormSchema),
    defaultValues: {
      followUpRequired: false,
      estimatedCost: 0,
      actualCost: 0
    },
  });

  const selectedViolationType = form.watch("violationType");

  // Filter violations
  const filteredViolations = violations.filter((violation: HrViolation) => {
    const matchesSearch = violation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         violation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         violation.violationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || violation.status === statusFilter;
    const matchesType = typeFilter === "all" || violation.violationType === typeFilter;
    const matchesSeverity = severityFilter === "all" || violation.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesSeverity;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: "Open", color: "bg-red-100 text-red-800", icon: XCircle },
      investigating: { label: "Investigating", color: "bg-yellow-100 text-yellow-800", icon: RefreshCw },
      resolved: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
      appealed: { label: "Appealed", color: "bg-purple-100 text-purple-800", icon: AlertCircle },
      dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-800", icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getViolationTypeBadge = (type: string) => {
    const typeConfig = VIOLATION_TYPES[type as keyof typeof VIOLATION_TYPES];
    if (!typeConfig) return <Badge>{type}</Badge>;
    
    const IconComponent = typeConfig.icon;
    return (
      <Badge className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 bg-blue-100 text-blue-800 text-center">
        <IconComponent className="w-3 h-3 mr-1" />
        {typeConfig.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = SEVERITY_LEVELS.find(s => s.value === severity) || SEVERITY_LEVELS[0];
    return <Badge className={severityConfig.color}>{severityConfig.label}</Badge>;
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find((u: User) => u.id === userId);
    return foundUser ? `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || foundUser.username : userId;
  };

  const handlePrintViolation = (violation: HrViolation) => {
    const printContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 800px;">
        <div style="text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">EMPLOYEE VIOLATION REPORT</h1>
          <h2 style="color: #666; margin: 10px 0; font-weight: normal;">${violation.violationNumber || `VIO-${violation.id}`}</h2>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Employee Information</h3>
            <p><strong>Employee:</strong> ${getUserName(violation.userId)}</p>
            <p><strong>Employee ID:</strong> ${violation.userId}</p>
            <p><strong>Reported By:</strong> ${getUserName(violation.reportedBy)}</p>
          </div>
          
          <div>
            <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Violation Details</h3>
            <p><strong>Type:</strong> ${VIOLATION_TYPES[violation.violationType as keyof typeof VIOLATION_TYPES]?.label || violation.violationType}</p>
            <p><strong>Subtype:</strong> ${violation.violationSubtype}</p>
            <p><strong>Severity:</strong> ${violation.severity}</p>
            <p><strong>Status:</strong> ${violation.status}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Incident Information</h3>
          <p><strong>Title:</strong> ${violation.title}</p>
          <p><strong>Incident Date:</strong> ${format(new Date(violation.incidentDate), 'PPP')}</p>
          <p><strong>Report Date:</strong> ${format(new Date(violation.reportDate), 'PPP')}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Description</h3>
          <div style="border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9; line-height: 1.6;">
            ${violation.description}
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Action Taken</h3>
          <p><strong>Action:</strong> ${ACTION_TYPES.find(a => a.value === violation.actionTaken)?.label || violation.actionTaken}</p>
          ${violation.actionDetails ? `<div style="border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9; margin-top: 10px;">${violation.actionDetails}</div>` : ''}
          ${violation.disciplinaryPoints ? `<p><strong>Disciplinary Points:</strong> ${violation.disciplinaryPoints}</p>` : ''}
        </div>

        ${violation.isRepeatOffense ? `
          <div style="margin-bottom: 30px; border: 2px solid #ff6b6b; padding: 15px; background-color: #ffe0e0;">
            <h3 style="color: #d63031; margin-top: 0;">⚠️ REPEAT OFFENSE</h3>
            <p><strong>Previous Violations:</strong> ${violation.previousViolationCount}</p>
            <p style="margin-bottom: 0;">This employee has committed similar violations before.</p>
          </div>
        ` : ''}

        ${(violation.estimatedCost > 0 || violation.actualCost > 0) ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Financial Impact</h3>
            ${violation.estimatedCost > 0 ? `<p><strong>Estimated Cost:</strong> $${violation.estimatedCost}</p>` : ''}
            ${violation.actualCost > 0 ? `<p><strong>Actual Cost:</strong> $${violation.actualCost}</p>` : ''}
            <p><strong>Cost Recovered:</strong> ${violation.costRecovered ? 'Yes' : 'No'}</p>
          </div>
        ` : ''}

        ${violation.resolutionNotes ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Resolution Notes</h3>
            <div style="border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9;">
              ${violation.resolutionNotes}
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
          <p>Generated on ${format(new Date(), 'PPP')} | Employee Violation Management System</p>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Violation Report - ${violation.violationNumber}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 1in; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const onSubmit = (data: ViolationFormData) => {
    createViolationMutation.mutate(data);
  };

  // Statistics cards
  const totalViolations = violations.length;
  const openViolations = violations.filter((v: HrViolation) => v.status === 'open').length;
  const repeatOffenses = violations.filter((v: HrViolation) => v.isRepeatOffense).length;
  const criticalViolations = violations.filter((v: HrViolation) => v.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Violations & Complaints</h1>
          <p className="text-muted-foreground mt-2">
            Professional employee violation management system with comprehensive tracking
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Violation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Employee Violation</DialogTitle>
              <DialogDescription>
                Document a professional violation with comprehensive details and tracking
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id}>
                                {getUserName(user.id)} ({user.username})
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
                    name="violationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Violation Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select violation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(VIOLATION_TYPES).map(([key, type]) => (
                              <SelectItem key={key} value={key}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedViolationType && (
                  <FormField
                    control={form.control}
                    name="violationSubtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Violation</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select specific violation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VIOLATION_TYPES[selectedViolationType as keyof typeof VIOLATION_TYPES]?.subtypes.map((subtype) => (
                              <SelectItem key={subtype} value={subtype}>
                                {subtype.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SEVERITY_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
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
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Violation Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the violation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide comprehensive details about the violation, including circumstances, witnesses, and evidence"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actionTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Taken</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action taken" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACTION_TYPES.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
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
                  name="actionDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Details (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional details about the action taken"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedViolationType === 'damage' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimatedCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Cost ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="actualCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Cost ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Follow-up Required
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("followUpRequired") && (
                  <FormField
                    control={form.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createViolationMutation.isPending}>
                    {createViolationMutation.isPending ? "Creating..." : "Create Violation"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViolations}</div>
            <p className="text-xs text-muted-foreground">All time violations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{openViolations}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Offenses</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{repeatOffenses}</div>
            <p className="text-xs text-muted-foreground">Multiple violations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{criticalViolations}</div>
            <p className="text-xs text-muted-foreground">High severity</p>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search violations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="min-w-[150px]">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="appealed">Appealed</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(VIOLATION_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Label>Severity</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  {SEVERITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Violations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Violation Records</CardTitle>
          <CardDescription>
            Comprehensive violation tracking with repeat offense monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {violationsLoading ? (
            <div className="text-center py-4">Loading violations...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-[31px] pr-[31px]">Violation #</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Incident Date</TableHead>
                  <TableHead>Repeat</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViolations.map((violation: HrViolation) => (
                  <TableRow key={violation.id}>
                    <TableCell className="font-medium">
                      {violation.violationNumber || `VIO-${violation.id}`}
                    </TableCell>
                    <TableCell>{getUserName(violation.userId)}</TableCell>
                    <TableCell>{getViolationTypeBadge(violation.violationType)}</TableCell>
                    <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                    <TableCell>{getStatusBadge(violation.status)}</TableCell>
                    <TableCell>{format(new Date(violation.incidentDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {violation.isRepeatOffense ? (
                        <Badge className="bg-red-100 text-red-800">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          {violation.previousViolationCount}x
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">First</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedViolation(violation);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintViolation(violation)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteViolation(violation)}
                          disabled={deleteViolationMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredViolations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No violations found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* View Violation Dialog */}
      {selectedViolation && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Violation Details - {selectedViolation.violationNumber || `VIO-${selectedViolation.id}`}</span>
                {selectedViolation.isRepeatOffense && (
                  <Badge className="bg-red-100 text-red-800">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Repeat Offense
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Comprehensive violation record and action details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Employee Information</h4>
                  <div className="space-y-2">
                    <p><strong>Employee:</strong> {getUserName(selectedViolation.userId)}</p>
                    <p><strong>Employee ID:</strong> {selectedViolation.userId}</p>
                    <p><strong>Reported By:</strong> {getUserName(selectedViolation.reportedBy)}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Violation Details</h4>
                  <div className="space-y-2">
                    <p><strong>Type:</strong> {getViolationTypeBadge(selectedViolation.violationType)}</p>
                    <p><strong>Subtype:</strong> {selectedViolation.violationSubtype}</p>
                    <p><strong>Severity:</strong> {getSeverityBadge(selectedViolation.severity)}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedViolation.status)}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Timeline</h4>
                  <div className="space-y-2">
                    <p><strong>Incident Date:</strong> {format(new Date(selectedViolation.incidentDate), 'PPP')}</p>
                    <p><strong>Report Date:</strong> {format(new Date(selectedViolation.reportDate), 'PPP')}</p>
                    {selectedViolation.resolutionDate && (
                      <p><strong>Resolution Date:</strong> {format(new Date(selectedViolation.resolutionDate), 'PPP')}</p>
                    )}
                  </div>
                </div>

                {selectedViolation.isRepeatOffense && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-lg mb-2 text-red-800">Repeat Offense Alert</h4>
                    <p><strong>Previous Violations:</strong> {selectedViolation.previousViolationCount}</p>
                    <p className="text-sm text-red-600 mt-1">
                      This employee has committed similar violations before. Consider escalated action.
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-lg mb-2">Incident Description</h4>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h5 className="font-medium mb-2">{selectedViolation.title}</h5>
                  <p className="text-sm leading-relaxed">{selectedViolation.description}</p>
                </div>
              </div>

              {/* Action Taken */}
              <div>
                <h4 className="font-semibold text-lg mb-2">Action Taken</h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p><strong>Action:</strong> {ACTION_TYPES.find(a => a.value === selectedViolation.actionTaken)?.label || selectedViolation.actionTaken}</p>
                  {selectedViolation.actionDetails && (
                    <div className="mt-2">
                      <strong>Details:</strong>
                      <p className="text-sm mt-1">{selectedViolation.actionDetails}</p>
                    </div>
                  )}
                  {selectedViolation.disciplinaryPoints > 0 && (
                    <p className="mt-2"><strong>Disciplinary Points:</strong> {selectedViolation.disciplinaryPoints}</p>
                  )}
                </div>
              </div>

              {/* Financial Impact */}
              {(selectedViolation.estimatedCost > 0 || selectedViolation.actualCost > 0) && (
                <div>
                  <h4 className="font-semibold text-lg mb-2">Financial Impact</h4>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    {selectedViolation.estimatedCost > 0 && (
                      <p><strong>Estimated Cost:</strong> ${selectedViolation.estimatedCost}</p>
                    )}
                    {selectedViolation.actualCost > 0 && (
                      <p><strong>Actual Cost:</strong> ${selectedViolation.actualCost}</p>
                    )}
                    <p><strong>Cost Recovered:</strong> {selectedViolation.costRecovered ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}

              {/* Resolution Notes */}
              {selectedViolation.resolutionNotes && (
                <div>
                  <h4 className="font-semibold text-lg mb-2">Resolution Notes</h4>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm">{selectedViolation.resolutionNotes}</p>
                  </div>
                </div>
              )}

              {/* Follow-up */}
              {selectedViolation.followUpRequired && (
                <div>
                  <h4 className="font-semibold text-lg mb-2">Follow-up Required</h4>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    {selectedViolation.followUpDate && (
                      <p><strong>Follow-up Date:</strong> {format(new Date(selectedViolation.followUpDate), 'PPP')}</p>
                    )}
                    {selectedViolation.followUpNotes && (
                      <p className="mt-2"><strong>Notes:</strong> {selectedViolation.followUpNotes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => handlePrintViolation(selectedViolation)}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}