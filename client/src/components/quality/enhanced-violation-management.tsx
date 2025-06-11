import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  FileText, 
  Search,
  Filter,
  Printer,
  Eye
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export function QualityViolations() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentViolation, setCurrentViolation] = useState<any>(null);
  const [formData, setFormData] = useState({
    reportedBy: "",
    qualityCheckId: null as null | number,
    violationType: "material",
    description: "",
    severity: "Medium",
    status: "open",
    affectedArea: "extrusion",
    resolvedDate: "",
    resolutionNotes: ""
  });

  // Fetch quality violations
  const { data: violations = [], isLoading: violationsLoading, refetch: refetchViolations } = useQuery<any[]>({
    queryKey: ["/api/quality-violations"]
  });

  // Fetch quality checks
  const { data: checks = [], isLoading: checksLoading } = useQuery<any[]>({
    queryKey: ["/api/quality-checks"]
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"]
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/quality-violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create violation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.violation_created"),
      });
      setShowAddDialog(false);
      resetForm();
      refetchViolations();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-violations"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/quality-violations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update violation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.violation_updated"),
      });
      setShowEditDialog(false);
      resetForm();
      refetchViolations();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-violations"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/quality-violations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete violation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.violation_deleted"),
      });
      setShowDeleteDialog(false);
      resetForm();
      refetchViolations();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-violations"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      reportedBy: user?.id || "",
      qualityCheckId: null,
      violationType: "material",
      description: "",
      severity: "Medium",
      status: "open",
      affectedArea: "extrusion",
      resolvedDate: "",
      resolutionNotes: ""
    });
    setCurrentViolation(null);
  };

  // Auto-populate reportedBy when component mounts or user changes
  useEffect(() => {
    if (user?.id && !formData.reportedBy && !currentViolation) {
      setFormData(prev => ({
        ...prev,
        reportedBy: user.id
      }));
    }
  }, [user?.id, formData.reportedBy, currentViolation]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentViolation) {
      updateMutation.mutate({ id: currentViolation.id, data: formData });
    }
  };

  const handleDeleteConfirm = () => {
    if (currentViolation) {
      deleteMutation.mutate(currentViolation.id);
    }
  };

  const handleEditClick = (violation: any) => {
    setCurrentViolation(violation);
    setFormData({
      reportedBy: violation.reportedBy || "",
      qualityCheckId: violation.qualityCheckId || null,
      violationType: violation.violationType || "material",
      description: violation.description || "",
      severity: violation.severity || "Medium",
      status: violation.status || "open",
      affectedArea: violation.affectedArea || "extrusion",
      resolvedDate: violation.resolvedDate ? new Date(violation.resolvedDate).toISOString().split('T')[0] : "",
      resolutionNotes: violation.resolutionNotes || ""
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (violation: any) => {
    setCurrentViolation(violation);
    setShowDeleteDialog(true);
  };

  const handleViewClick = (violation: any) => {
    setCurrentViolation(violation);
    setShowViewDialog(true);
  };

  const handlePrintClick = (violation: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reporter = users.find((u: any) => u.id === violation.reportedBy);
    const qualityCheck = checks.find((c: any) => c.id === violation.qualityCheckId);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quality Violation Report - ${violation.id}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #dc3545; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #dc3545;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 18px;
              color: #666;
            }
            .section { 
              margin-bottom: 25px; 
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .section-title { 
              font-weight: bold; 
              font-size: 16px;
              color: #dc3545;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .detail-row { 
              display: flex; 
              margin-bottom: 8px; 
            }
            .detail-label { 
              font-weight: bold; 
              width: 150px; 
              color: #555;
            }
            .detail-value { 
              flex: 1; 
            }
            .severity-high { 
              color: #dc3545; 
              font-weight: bold; 
            }
            .severity-medium { 
              color: #ffc107; 
              font-weight: bold; 
            }
            .severity-low { 
              color: #17a2b8; 
              font-weight: bold; 
            }
            .status-open { 
              color: #dc3545; 
              font-weight: bold; 
            }
            .status-progress { 
              color: #ffc107; 
              font-weight: bold; 
            }
            .status-resolved { 
              color: #28a745; 
              font-weight: bold; 
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Production Management System</div>
            <div class="report-title">Quality Violation Report</div>
          </div>

          <div class="section">
            <div class="section-title">Violation Information</div>
            <div class="detail-row">
              <div class="detail-label">Violation ID:</div>
              <div class="detail-value">#${violation.id}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Type:</div>
              <div class="detail-value">${violation.violationType || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Severity:</div>
              <div class="detail-value">
                <span class="severity-${violation.severity?.toLowerCase()}">
                  ${violation.severity?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Status:</div>
              <div class="detail-value">
                <span class="status-${violation.status?.toLowerCase().replace(' ', '-')}">
                  ${violation.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Report Date:</div>
              <div class="detail-value">${violation.reportDate ? format(new Date(violation.reportDate), 'MMM dd, yyyy - HH:mm') : 'Not specified'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Details</div>
            <div class="detail-row">
              <div class="detail-label">Reported By:</div>
              <div class="detail-value">${reporter ? `${reporter.firstName} ${reporter.lastName}` : 'Unknown'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Quality Check:</div>
              <div class="detail-value">${qualityCheck ? `Check #${qualityCheck.id}` : 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Affected Area:</div>
              <div class="detail-value">${violation.affectedArea || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Description:</div>
              <div class="detail-value">${violation.description || 'No description provided'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Resolution Information</div>
            <div class="detail-row">
              <div class="detail-label">Root Cause:</div>
              <div class="detail-value">${violation.rootCause || 'Not identified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Resolution Date:</div>
              <div class="detail-value">${violation.resolutionDate ? format(new Date(violation.resolutionDate), 'MMM dd, yyyy - HH:mm') : 'Not resolved'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Notes:</div>
              <div class="detail-value">${violation.notes || 'No additional notes'}</div>
            </div>
          </div>

          <div class="footer">
            <p>Generated on ${format(new Date(), 'MMM dd, yyyy - HH:mm')} | Production Management System</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Filter and search functionality
  const filteredViolations = violations.filter((violation: any) => {
    const matchesSearch = searchQuery === "" || 
      violation.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.reportedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.violationType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.id?.toString().includes(searchQuery);
    
    const matchesStatus = filterStatus === "all" || violation.status === filterStatus;
    const matchesSeverity = filterSeverity === "all" || violation.severity === filterSeverity;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "High":
        return <Badge variant="destructive">{severity}</Badge>;
      case "Medium":
        return <Badge variant="warning">{severity}</Badge>;
      case "Low":
        return <Badge variant="outline">{severity}</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge variant="destructive">{status}</Badge>;
      case "In Progress":
        return <Badge variant="warning">{status}</Badge>;
      case "Resolved":
        return <Badge variant="success">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = violationsLoading || checksLoading || usersLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-1 sm:mr-2 text-muted-foreground" />
            <Select 
              value={filterStatus} 
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[110px] sm:w-[120px] text-xs sm:text-sm h-9">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="Open">{t("quality.status_open")}</SelectItem>
                <SelectItem value="In Progress">{t("quality.status_in_progress")}</SelectItem>
                <SelectItem value="Resolved">{t("quality.status_resolved")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 sm:mr-2 text-muted-foreground" />
            <Select 
              value={filterSeverity} 
              onValueChange={setFilterSeverity}
            >
              <SelectTrigger className="w-[110px] sm:w-[120px] text-xs sm:text-sm h-9">
                <SelectValue placeholder={t("quality.severity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="High">{t("quality.severity_high")}</SelectItem>
                <SelectItem value="Medium">{t("quality.severity_medium")}</SelectItem>
                <SelectItem value="Low">{t("quality.severity_low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 text-xs sm:text-sm px-2 sm:px-3">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {t("quality.add_violation")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-lg">{t("quality.add_violation")}</DialogTitle>
                  <DialogDescription className="text-sm">{t("quality.add_violation_description")}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="reportedBy">{t("quality.reported_by")} *</Label>
                      <Select 
                        value={formData.reportedBy} 
                        onValueChange={(value) => setFormData({...formData, reportedBy: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_reporter")} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(users) && users.length > 0 ? (
                            users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName || ''} {user.lastName || ''}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-users">{t("common.loading")}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="qualityCheckId">Quality Check (Optional)</Label>
                      <Select 
                        value={formData.qualityCheckId ? formData.qualityCheckId.toString() : "none"} 
                        onValueChange={(value) => setFormData({...formData, qualityCheckId: value === "none" ? null : parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality check (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No associated check</SelectItem>
                          {Array.isArray(checks) && checks.length > 0 ? (
                            checks.map((check: any) => (
                              <SelectItem key={check.id} value={check.id.toString()}>
                                Check #{check.id} - {check.checkTypeId}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-checks">{t("common.loading")}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="violationType">Violation Type *</Label>
                      <Select 
                        value={formData.violationType} 
                        onValueChange={(value) => setFormData({...formData, violationType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="process">Process</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                          <SelectItem value="environmental">Environmental</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="affectedArea">Affected Area *</Label>
                      <Select 
                        value={formData.affectedArea} 
                        onValueChange={(value) => setFormData({...formData, affectedArea: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="extrusion">Extrusion</SelectItem>
                          <SelectItem value="printing">Printing</SelectItem>
                          <SelectItem value="cutting">Cutting</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                          <SelectItem value="quality_control">Quality Control</SelectItem>
                          <SelectItem value="storage">Storage</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea 
                        id="description" 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="severity">{t("quality.severity")} *</Label>
                        <Select 
                          value={formData.severity} 
                          onValueChange={(value) => setFormData({...formData, severity: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">{t("common.status")} *</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value) => setFormData({...formData, status: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={() => setShowAddDialog(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? t("common.creating") : t("common.create")}
                  </Button>
                </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <p>{t("common.loading")}</p>
        </div>
      ) : filteredViolations.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground">{t("quality.no_violations_found")}</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <ScrollArea className="h-[400px] md:h-[500px] lg:h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-16 text-center">{t("common.id")}</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[120px]">{t("quality.reported_by")}</TableHead>
                  <TableHead className="min-w-[200px] max-w-[300px]">{t("common.description")}</TableHead>
                  <TableHead className="w-24 text-center">{t("quality.severity")}</TableHead>
                  <TableHead className="w-28 text-center">{t("common.status")}</TableHead>
                  <TableHead className="hidden lg:table-cell w-32">{t("quality.reported_date")}</TableHead>
                  <TableHead className="w-20 text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViolations.map((violation: any) => {
                  let reporterName = violation.reportedBy || t("common.unknown");
                  
                  if (Array.isArray(users)) {
                    const reporter = users.find((u: any) => u.id === violation.reportedBy);
                    if (reporter && reporter.firstName) {
                      reporterName = `${reporter.firstName || ''} ${reporter.lastName || ''}`;
                    }
                  }
                  
                  return (
                    <TableRow key={violation.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium text-sm">#{violation.id}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{reporterName}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="text-sm leading-relaxed" title={violation.description}>
                          <div className="line-clamp-2 md:line-clamp-3">
                            {violation.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{getSeverityBadge(violation.severity)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(violation.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {violation.reportDate 
                          ? format(new Date(violation.reportDate), 'MMM d, yyyy') 
                          : t("common.not_available")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewClick(violation)}
                            title={t("common.view")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePrintClick(violation)}
                            title={t("common.print")}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditClick(violation)}
                            title={t("common.edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                            onClick={() => handleDeleteClick(violation)}
                            title={t("common.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg">{t("common.delete_confirmation")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("quality.delete_violation_confirmation", { id: currentViolation?.id })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-destructive flex items-center text-xs sm:text-sm">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              {t("quality.delete_violation_warning")}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button 
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg">Quality Violation Details - #{currentViolation?.id}</DialogTitle>
          </DialogHeader>
          {currentViolation && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Violation ID</Label>
                  <p className="text-sm font-medium">#{currentViolation.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Report Date</Label>
                  <p className="text-sm">
                    {currentViolation.reportDate 
                      ? format(new Date(currentViolation.reportDate), 'MMM dd, yyyy - HH:mm') 
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reported By</Label>
                  <p className="text-sm">
                    {(() => {
                      const reporter = users.find((u: any) => u.id === currentViolation.reportedBy);
                      return reporter ? `${reporter.firstName} ${reporter.lastName}` : 'Unknown';
                    })()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quality Check</Label>
                  <p className="text-sm">
                    {(() => {
                      const qualityCheck = checks.find((c: any) => c.id === currentViolation.qualityCheckId);
                      return qualityCheck ? `Check #${qualityCheck.id}` : 'Not specified';
                    })()}
                  </p>
                </div>
              </div>

              {/* Status and Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <p className="text-sm font-medium">{currentViolation.violationType || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Severity</Label>
                  <div className="mt-1">{getSeverityBadge(currentViolation.severity)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(currentViolation.status)}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="text-sm leading-relaxed">
                    {currentViolation.description || 'No description provided'}
                  </p>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Affected Area</Label>
                  <p className="text-sm">{currentViolation.affectedArea || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Root Cause</Label>
                  <p className="text-sm">{currentViolation.rootCause || 'Not identified'}</p>
                </div>
              </div>

              {/* Resolution Information */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Resolution Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Resolution Date</Label>
                    <p className="text-sm">
                      {currentViolation.resolutionDate 
                        ? format(new Date(currentViolation.resolutionDate), 'MMM dd, yyyy - HH:mm')
                        : 'Not resolved'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <p className="text-sm leading-relaxed">
                        {currentViolation.notes || 'No additional notes'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none"
                onClick={() => handlePrintClick(currentViolation)}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none"
                onClick={() => setShowViewDialog(false)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg">Edit Quality Violation - #{currentViolation?.id}</DialogTitle>
            <DialogDescription className="text-sm">Update the violation details and status</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-reportedBy">{t("quality.reported_by")} *</Label>
                  <Select 
                    value={formData.reportedBy} 
                    onValueChange={(value) => setFormData({...formData, reportedBy: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("quality.select_reporter")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(users) && users.length > 0 ? (
                        users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName || ''} {user.lastName || ''}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users">{t("common.loading")}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-qualityCheckId">Quality Check</Label>
                  <Select 
                    value={formData.qualityCheckId ? formData.qualityCheckId.toString() : "none"} 
                    onValueChange={(value) => setFormData({...formData, qualityCheckId: value === "none" ? null : parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality check (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No associated check</SelectItem>
                      {Array.isArray(checks) && checks.length > 0 ? (
                        checks.map((check: any) => (
                          <SelectItem key={check.id} value={check.id.toString()}>
                            Check #{check.id} - {check.checkTypeId}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-checks">{t("common.loading")}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-violationType">Violation Type *</Label>
                  <Select 
                    value={formData.violationType} 
                    onValueChange={(value) => setFormData({...formData, violationType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="process">Process</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-description">Description *</Label>
                  <Textarea 
                    id="edit-description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-severity">{t("quality.severity")} *</Label>
                    <Select 
                      value={formData.severity} 
                      onValueChange={(value) => setFormData({...formData, severity: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-status">{t("common.status")} *</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData({...formData, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-affectedArea">Affected Area *</Label>
                  <Select 
                    value={formData.affectedArea} 
                    onValueChange={(value) => setFormData({...formData, affectedArea: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="extrusion">Extrusion</SelectItem>
                      <SelectItem value="printing">Printing</SelectItem>
                      <SelectItem value="cutting">Cutting</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="quality_control">Quality Control</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status === "Resolved" && (
                  <>
                    <div>
                      <Label htmlFor="edit-resolvedDate">Resolution Date</Label>
                      <Input
                        id="edit-resolvedDate"
                        type="datetime-local"
                        value={formData.resolvedDate}
                        onChange={(e) => setFormData({...formData, resolvedDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-resolutionNotes">Resolution Notes</Label>
                      <Textarea 
                        id="edit-resolutionNotes" 
                        value={formData.resolutionNotes}
                        onChange={(e) => setFormData({...formData, resolutionNotes: e.target.value})}
                        rows={2}
                        placeholder="Describe how the violation was resolved..."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => setShowEditDialog(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? t("common.updating") : t("common.update")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}