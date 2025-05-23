import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth-v2";

// UI Components
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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import {
  AlertTriangle,
  FileWarning,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Filter,
  Calendar,
  HelpCircle,
  Printer,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Info
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQualityViolationSchema } from "@shared/schema";
import { QualityViolation } from "@shared/schema";

// Enhanced violation form schema
const enhancedViolationSchema = insertQualityViolationSchema.extend({
  qualityCheckId: z.number().optional().nullable(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  violationType: z.string().min(1, "Violation type is required"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  affectedArea: z.string().min(1, "Affected area is required"),
  status: z.enum(["open", "investigating", "resolved", "dismissed"]).default("open"),
  reportDate: z.date().default(() => new Date()),
  rootCause: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).optional(),
});

export type EnhancedViolationFormValues = z.infer<typeof enhancedViolationSchema>;

interface EnhancedViolationManagementProps {
  onViolationCreated?: () => void;
}

export function EnhancedViolationManagement({ onViolationCreated }: EnhancedViolationManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State for filters, dialogs, and selected violation
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<QualityViolation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");
  
  // Initialize form
  const form = useForm<EnhancedViolationFormValues>({
    resolver: zodResolver(enhancedViolationSchema),
    defaultValues: {
      qualityCheckId: null,
      description: "",
      violationType: "process",
      severity: "medium",
      affectedArea: "",
      status: "open",
      reportDate: new Date(),
      rootCause: null,
      notes: null,
      imageUrls: [],
    },
  });
  
  // Init edit form
  const editForm = useForm<EnhancedViolationFormValues>({
    resolver: zodResolver(enhancedViolationSchema),
    defaultValues: {
      qualityCheckId: null,
      description: "",
      violationType: "process",
      severity: "medium",
      affectedArea: "",
      status: "open",
      reportDate: new Date(),
      rootCause: null,
      notes: null,
      imageUrls: [],
    },
  });
  
  // Fetch violations
  const { data: violations, isLoading } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        throw new Error("Failed to fetch violations");
      }
      return response.json() as Promise<QualityViolation[]>;
    },
  });
  
  // Fetch quality checks
  const { data: qualityChecks } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    },
  });
  
  // Create violation mutation
  const createViolation = useMutation({
    mutationFn: async (data: EnhancedViolationFormValues) => {
      const response = await fetch("/api/quality-violations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          reportedBy: user?.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create violation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Violation Reported",
        description: "The quality violation has been successfully reported.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/quality-violations"],
      });
      form.reset();
      setIsFormOpen(false);
      if (onViolationCreated) onViolationCreated();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update violation mutation
  const updateViolation = useMutation({
    mutationFn: async (data: { id: number; values: EnhancedViolationFormValues }) => {
      const response = await fetch(`/api/quality-violations/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update violation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Violation Updated",
        description: "The quality violation has been successfully updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/quality-violations"],
      });
      editForm.reset();
      setIsEditDialogOpen(false);
      setSelectedViolation(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete violation mutation
  const deleteViolation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/quality-violations/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete violation");
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Violation Deleted",
        description: "The quality violation has been successfully deleted.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/quality-violations"],
      });
      setIsDeleteDialogOpen(false);
      setSelectedViolation(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: EnhancedViolationFormValues) => {
    createViolation.mutate(data);
  };
  
  // Handle edit form submission
  const onEditSubmit = (data: EnhancedViolationFormValues) => {
    if (selectedViolation) {
      updateViolation.mutate({ id: selectedViolation.id, values: data });
    }
  };
  
  // Handle view details
  const handleViewDetails = (violation: QualityViolation) => {
    setSelectedViolation(violation);
    setIsViewDialogOpen(true);
  };
  
  // Handle edit
  const handleEdit = (violation: QualityViolation) => {
    setSelectedViolation(violation);
    
    // Set edit form values
    editForm.reset({
      description: violation.description,
      violationType: violation.violationType,
      severity: violation.severity as "low" | "medium" | "high" | "critical",
      status: violation.status as "open" | "investigating" | "resolved" | "dismissed",
      affectedArea: violation.affectedArea,
      reportedBy: violation.reportedBy || "",
      reportDate: new Date(violation.reportDate),
      qualityCheckId: violation.qualityCheckId || null,
      rootCause: violation.rootCause || null,
      notes: violation.notes || null,
      imageUrls: violation.imageUrls || [],
    });
    
    setIsEditDialogOpen(true);
  };
  
  // Handle delete
  const handleDelete = (violation: QualityViolation) => {
    setSelectedViolation(violation);
    setIsDeleteDialogOpen(true);
  };
  
  // Filter violations based on search term, status and severity
  const filteredViolations = violations?.filter((violation) => {
    // Tab filter
    if (currentTab !== "all") {
      if (currentTab === "open" && violation.status !== "open") return false;
      if (currentTab === "investigating" && violation.status !== "investigating") return false;
      if (currentTab === "resolved" && violation.status !== "resolved") return false;
      if (currentTab === "dismissed" && violation.status !== "dismissed") return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && violation.status !== statusFilter) {
      return false;
    }
    
    // Severity filter
    if (severityFilter !== "all" && violation.severity !== severityFilter) {
      return false;
    }
    
    // Search term
    if (searchTerm && !violation.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by date (newest first)
    return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
  }) || [];
  
  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t("quality.status.open")}
          </Badge>
        );
      case "investigating":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
            <Search className="h-3 w-3" />
            {t("quality.status.investigating")}
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t("quality.status.resolved")}
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t("quality.status.dismissed")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
            {status}
          </Badge>
        );
    }
  };
  
  // Severity badge component
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
            {t("quality.severity.low")}
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
            {t("quality.severity.medium")}
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
            {t("quality.severity.high")}
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
            {t("quality.severity.critical")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
            {severity}
          </Badge>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("quality.search_violations")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder={t("quality.severity.label")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all_severities")}</SelectItem>
              <SelectItem value="low">{t("quality.severity.low")}</SelectItem>
              <SelectItem value="medium">{t("quality.severity.medium")}</SelectItem>
              <SelectItem value="high">{t("quality.severity.high")}</SelectItem>
              <SelectItem value="critical">{t("quality.severity.critical")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> {t("quality.report_violation")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-orange-600" /> {t("quality.report_violation")}
              </DialogTitle>
              <DialogDescription>
                {t("quality.report_violation_description")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="qualityCheckId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.related_check")}</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          defaultValue={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.select_related_check")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">{t("common.none")}</SelectItem>
                            {qualityChecks?.map((check) => (
                              <SelectItem key={check.id} value={check.id.toString()}>
                                #{check.id} - {check.checkTypeId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("quality.related_check_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.description")} <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.description_placeholder")}
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t("quality.description_help")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="violationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.violation_type")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.select_violation_type")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="process">{t("quality.violation_type_process")}</SelectItem>
                              <SelectItem value="material">{t("quality.violation_type_material")}</SelectItem>
                              <SelectItem value="machine">{t("quality.violation_type_machine")}</SelectItem>
                              <SelectItem value="human">{t("quality.violation_type_human")}</SelectItem>
                              <SelectItem value="environmental">{t("quality.violation_type_environmental")}</SelectItem>
                              <SelectItem value="other">{t("quality.violation_type_other")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.severity.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.select_severity")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t("quality.severity.low")}</SelectItem>
                              <SelectItem value="medium">{t("quality.severity.medium")}</SelectItem>
                              <SelectItem value="high">{t("quality.severity.high")}</SelectItem>
                              <SelectItem value="critical">{t("quality.severity.critical")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="affectedArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.affected_area")} <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder={t("quality.affected_area_placeholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.status.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.select_status")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="open">{t("quality.status.open")}</SelectItem>
                              <SelectItem value="investigating">{t("quality.status.investigating")}</SelectItem>
                              <SelectItem value="resolved">{t("quality.status.resolved")}</SelectItem>
                              <SelectItem value="dismissed">{t("quality.status.dismissed")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="rootCause"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.root_cause")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.root_cause_placeholder")}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("quality.root_cause_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsFormOpen(false)} 
                    className="md:mr-2"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createViolation.isPending}>
                    {createViolation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.submitting")}
                      </>
                    ) : (
                      t("quality.submit_violation")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tabs and Table */}
      <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
          <TabsTrigger value="open">{t("quality.status.open")}</TabsTrigger>
          <TabsTrigger value="investigating">{t("quality.status.investigating")}</TabsTrigger>
          <TabsTrigger value="resolved">{t("quality.status.resolved")}</TabsTrigger>
          <TabsTrigger value="dismissed">{t("quality.status.dismissed")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value={currentTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredViolations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <FileWarning className="h-12 w-12 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">{t("quality.no_violations_found")}</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-md">
                    {t("quality.no_violations_description")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead className="min-w-[250px]">{t("quality.description")}</TableHead>
                        <TableHead>{t("quality.affected_area")}</TableHead>
                        <TableHead>{t("quality.severity.label")}</TableHead>
                        <TableHead>{t("quality.status.label")}</TableHead>
                        <TableHead>{t("quality.report_date")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredViolations.map((violation) => (
                        <TableRow key={violation.id}>
                          <TableCell className="font-medium">#{violation.id}</TableCell>
                          <TableCell className="max-w-[250px] truncate">
                            {violation.description}
                          </TableCell>
                          <TableCell>{violation.affectedArea}</TableCell>
                          <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                          <TableCell>{getStatusBadge(violation.status)}</TableCell>
                          <TableCell>
                            {format(new Date(violation.reportDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(violation)}
                                title={t("common.view_details")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(violation)}
                                title={t("common.edit")}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(violation)}
                                title={t("common.delete")}
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
        </TabsContent>
      </Tabs>
      
      {/* View Dialog */}
      {selectedViolation && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-orange-600" /> 
                {t("quality.violation_details")} #{selectedViolation.id}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("quality.status.label")}</p>
                  {getStatusBadge(selectedViolation.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("quality.severity.label")}</p>
                  {getSeverityBadge(selectedViolation.severity)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("quality.report_date")}</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedViolation.reportDate), "PPP")}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">{t("quality.description")}</h3>
                <p className="text-sm">{selectedViolation.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">{t("quality.violation_type")}</h3>
                  <p className="text-sm">{selectedViolation.violationType}</p>
                </div>
                <div>
                  <h3 className="font-medium">{t("quality.affected_area")}</h3>
                  <p className="text-sm">{selectedViolation.affectedArea}</p>
                </div>
              </div>
              
              {selectedViolation.rootCause && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t("quality.root_cause")}</h3>
                  <p className="text-sm">{selectedViolation.rootCause}</p>
                </div>
              )}
              
              {selectedViolation.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t("quality.notes")}</h3>
                  <p className="text-sm">{selectedViolation.notes}</p>
                </div>
              )}
              
              {selectedViolation.resolution && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t("quality.resolution")}</h3>
                  <p className="text-sm">{selectedViolation.resolution}</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                {t("common.close")}
              </Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleEdit(selectedViolation);
              }}>
                {t("common.edit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Dialog */}
      {selectedViolation && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" /> 
                {t("quality.edit_violation")} #{selectedViolation.id}
              </DialogTitle>
              <DialogDescription>
                {t("quality.edit_violation_description")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.description")} <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.description_placeholder")}
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="violationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.violation_type")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.select_violation_type")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="process">{t("quality.violation_type_process")}</SelectItem>
                              <SelectItem value="material">{t("quality.violation_type_material")}</SelectItem>
                              <SelectItem value="machine">{t("quality.violation_type_machine")}</SelectItem>
                              <SelectItem value="human">{t("quality.violation_type_human")}</SelectItem>
                              <SelectItem value="environmental">{t("quality.violation_type_environmental")}</SelectItem>
                              <SelectItem value="other">{t("quality.violation_type_other")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.severity.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.select_severity")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t("quality.severity.low")}</SelectItem>
                              <SelectItem value="medium">{t("quality.severity.medium")}</SelectItem>
                              <SelectItem value="high">{t("quality.severity.high")}</SelectItem>
                              <SelectItem value="critical">{t("quality.severity.critical")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="affectedArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.affected_area")} <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder={t("quality.affected_area_placeholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.status.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.select_status")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="open">{t("quality.status.open")}</SelectItem>
                              <SelectItem value="investigating">{t("quality.status.investigating")}</SelectItem>
                              <SelectItem value="resolved">{t("quality.status.resolved")}</SelectItem>
                              <SelectItem value="dismissed">{t("quality.status.dismissed")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="rootCause"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.root_cause")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.root_cause_placeholder")}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.notes")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.notes_placeholder")}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)} 
                    className="md:mr-2"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={updateViolation.isPending}>
                    {updateViolation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.updating")}
                      </>
                    ) : (
                      t("common.save_changes")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      {selectedViolation && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">{t("quality.confirm_delete")}</DialogTitle>
              <DialogDescription>
                {t("quality.delete_confirmation_text")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-3">
              <p className="font-medium">{t("quality.violation")} #{selectedViolation.id}</p>
              <p className="text-sm text-gray-500">{selectedViolation.description}</p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteViolation.mutate(selectedViolation.id)}
                disabled={deleteViolation.isPending}
              >
                {deleteViolation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.deleting")}
                  </>
                ) : (
                  t("common.delete")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}