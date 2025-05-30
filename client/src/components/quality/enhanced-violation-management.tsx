import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  Printer
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export function QualityViolations() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
  const { data: violations = [], isLoading: violationsLoading, refetch: refetchViolations } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        throw new Error("Failed to fetch quality violations");
      }
      return response.json();
    }
  });

  // Fetch quality checks for reference
  const { data: checks = [], isLoading: checksLoading } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    }
  });

  // Fetch users for reporter selection
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/quality-violations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create quality violation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.violation_created_success"),
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update quality violation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.violation_updated_success"),
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
      
      if (!response.ok) {
        throw new Error("Failed to delete quality violation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.violation_deleted_success"),
      });
      setShowDeleteDialog(false);
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
      reportedBy: "",
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filteredViolations = violations.filter((violation: any) => {
      const matchesSearch = searchQuery === "" || 
        violation.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        violation.id?.toString().includes(searchQuery) ||
        violation.violationType?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || violation.status === filterStatus;
      const matchesSeverity = filterSeverity === "all" || violation.severity === filterSeverity;
      return matchesSearch && matchesStatus && matchesSeverity;
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quality Violations Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin-bottom: 5px; }
            .header p { color: #666; margin: 0; }
            .summary { margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
            .summary h3 { margin-top: 0; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .severity-high { background-color: #fee; }
            .severity-medium { background-color: #fff3cd; }
            .severity-low { background-color: #d1ecf1; }
            .status-open { color: #dc3545; }
            .status-solved { color: #28a745; }
            .status-progress { color: #ffc107; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Quality Violations Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Violations:</strong> ${filteredViolations.length}</p>
            <p><strong>Open:</strong> ${filteredViolations.filter((v: any) => v.status === 'open').length}</p>
            <p><strong>In Progress:</strong> ${filteredViolations.filter((v: any) => v.status === 'investigating').length}</p>
            <p><strong>Resolved:</strong> ${filteredViolations.filter((v: any) => v.status === 'resolved').length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Affected Area</th>
                <th>Report Date</th>
                <th>Reported By</th>
              </tr>
            </thead>
            <tbody>
              ${filteredViolations.map((violation: any) => `
                <tr class="severity-${violation.severity?.toLowerCase()}">
                  <td>${violation.id}</td>
                  <td>${violation.description || 'N/A'}</td>
                  <td>${violation.severity || 'N/A'}</td>
                  <td class="status-${violation.status?.toLowerCase()}">${violation.status || 'N/A'}</td>
                  <td>${violation.affectedArea || 'N/A'}</td>
                  <td>${violation.reportDate ? new Date(violation.reportDate).toLocaleDateString() : 'N/A'}</td>
                  <td>${violation.reportedBy || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This report was generated automatically by the Production Management System</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
            <Button variant="outline" size="sm" className="h-9" onClick={handlePrint}>
              <Printer className="mr-1 sm:mr-2 h-4 w-4" /> 
              <span className="text-xs sm:text-sm">{t("common.print")}</span>
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="h-9" onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}>
                  <Plus className="mr-1 sm:mr-2 h-4 w-4" /> 
                  <span className="text-xs sm:text-sm">{t("quality.add_violation")}</span>
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
                            false ? (
                              <SelectItem value="none">
                                No user available
                              </SelectItem>
                            ) : (
                              <SelectItem value="no-users">{t("common.loading")}</SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="qualityCheckId">Related Check</Label>
                      <Select 
                        value={formData.qualityCheckId ? String(formData.qualityCheckId) : "none"} 
                        onValueChange={(value) => setFormData({...formData, qualityCheckId: value === "none" ? null : parseInt(value, 10)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_check")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("common.none")}</SelectItem>
                          {checks.map((check: any) => (
                            <SelectItem key={check.id} value={String(check.id)}>
                              Check #{check.id} - {
                                check.checkDate ? new Date(check.checkDate).toLocaleDateString() :
                                check.timestamp ? new Date(check.timestamp).toLocaleDateString() :
                                check.checkedAt ? new Date(check.checkedAt).toLocaleDateString() :
                                'No date'
                              }
                            </SelectItem>
                          ))}
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
                            <SelectItem value="Solved">Solved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {formData.status === "Solved" && (
                      <>
                        <div>
                          <Label htmlFor="resolvedDate">Solved Date *</Label>
                          <Input 
                            id="resolvedDate" 
                            type="date" 
                            value={formData.resolvedDate}
                            onChange={(e) => setFormData({...formData, resolvedDate: e.target.value})}
                            required={formData.status === "Solved"}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="resolutionNotes">Solution Notes *</Label>
                          <Textarea 
                            id="resolutionNotes" 
                            value={formData.resolutionNotes}
                            onChange={(e) => setFormData({...formData, resolutionNotes: e.target.value})}
                            rows={2}
                            required={formData.status === "Solved"}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t("common.saving") : t("common.save")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                // Handle reporter information whether users is array or single object
                let reporterName = violation.reportedBy || t("common.unknown");
                
                if (Array.isArray(users)) {
                  const reporter = users.find((u: any) => u.id === violation.reportedBy);
                  if (reporter && reporter.firstName) {
                    reporterName = `${reporter.firstName || ''} ${reporter.lastName || ''}`;
                  }
                }
                
                return (
                  <TableRow key={violation.id}>
                    <TableCell className="text-xs sm:text-sm font-medium">#{violation.id}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{reporterName}</TableCell>
                    <TableCell className="max-w-[150px] sm:max-w-[200px]">
                      <div className="truncate text-xs sm:text-sm" title={violation.description}>
                        {violation.description}
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                    <TableCell>{getStatusBadge(violation.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                      {violation.reportDate 
                        ? format(new Date(violation.reportDate), 'MMM d, yyyy') 
                        : t("common.not_available")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handleEditClick(violation)}
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handleDeleteClick(violation)}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg">{t("quality.edit_violation")}</DialogTitle>
            <DialogDescription className="text-sm">{t("quality.edit_violation_description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
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
                        <SelectItem value="loading">{t("common.loading")}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="qualityCheckId">Related Check</Label>
                  <Select 
                    value={formData.qualityCheckId ? String(formData.qualityCheckId) : "none"} 
                    onValueChange={(value) => setFormData({...formData, qualityCheckId: value === "none" ? null : parseInt(value, 10)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("quality.select_check")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("common.none")}</SelectItem>
                      {checks.map((check: any) => (
                        <SelectItem key={check.id} value={String(check.id)}>
                          Check #{check.id} - {
                            check.checkDate ? new Date(check.checkDate).toLocaleDateString() :
                            check.timestamp ? new Date(check.timestamp).toLocaleDateString() :
                            check.checkedAt ? new Date(check.checkedAt).toLocaleDateString() :
                            'No date'
                          }
                        </SelectItem>
                      ))}
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
                        <SelectItem value="Solved">Solved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {formData.status === "Solved" && (
                  <>
                    <div>
                      <Label htmlFor="resolvedDate">Solved Date *</Label>
                      <Input 
                        id="resolvedDate" 
                        type="date" 
                        value={formData.resolvedDate}
                        onChange={(e) => setFormData({...formData, resolvedDate: e.target.value})}
                        required={formData.status === "Solved"}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="resolutionNotes">Solution Notes *</Label>
                      <Textarea 
                        id="resolutionNotes" 
                        value={formData.resolutionNotes}
                        onChange={(e) => setFormData({...formData, resolutionNotes: e.target.value})}
                        rows={2}
                        required={formData.status === "Solved"}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t("common.updating") : t("common.update")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
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
      </div>
    </div>
  );
}