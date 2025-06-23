import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  FileWarning,
  Search,
  Eye,
  Pencil,
  Loader2,
  Plus,
  FilePlus
} from "lucide-react";
import { QualityBadge } from "./quality-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface QualityViolation {
  id: number;
  description: string;
  reportedBy: string | null;
  qualityCheckId: number | null;
  severity: 'Critical' | 'Major' | 'Minor';
  status: 'Open' | 'In Progress' | 'Resolved';
  notes: string | null;
  imageUrls: string[] | null;
  violationType: string;
  reportDate: Date;
  resolutionDate: Date | null;
  affectedArea: string;
  rootCause: string | null;
  jobOrderId?: number | null;
  rollId?: string | null;
}

interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  fullName?: string;
}

interface QualityCheck {
  id: number;
  rollId: string | null;
  jobOrderId: number | null;
  performedBy: string | null;
}

interface JobOrder {
  id: number;
  orderId: number;
}

interface Roll {
  id: string;
  serialNumber: string;
  jobOrderId: number;
}

interface ViolationFilterState {
  severity: string;
  status: string;
  dateRange: string;
  searchTerm: string;
}

export function QualityViolationsManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentViolation, setCurrentViolation] = useState<QualityViolation | null>(null);
  const [formData, setFormData] = useState<Partial<QualityViolation>>({
    description: "",
    severity: "Major",
    status: "Open",
    violationType: "Process",
    affectedArea: "Machine",
    notes: ""
  });
  const [filters, setFilters] = useState<ViolationFilterState>({
    severity: "all",
    status: "all",
    dateRange: "all",
    searchTerm: ""
  });

  // Fetch violation data
  const { data: violations = [], isLoading } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/quality-violations");
        if (!response.ok) {
          throw new Error("Failed to fetch violations");
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching violations:", error);
        return [];
      }
    }
  });

  // Fetch users data for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        return data.map((user: User) => ({
          ...user,
          fullName: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.username
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    }
  });

  // Fetch quality checks
  const { data: qualityChecks = [] } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/quality-checks");
        if (!response.ok) {
          throw new Error("Failed to fetch quality checks");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching quality checks:", error);
        return [];
      }
    }
  });

  // Fetch job orders
  const { data: jobOrders = [] } = useQuery({
    queryKey: ["/api/job-orders"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/job-orders");
        if (!response.ok) {
          throw new Error("Failed to fetch job orders");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching job orders:", error);
        return [];
      }
    }
  });

  // Fetch rolls
  const { data: rolls = [] } = useQuery({
    queryKey: ["/api/rolls"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/rolls");
        if (!response.ok) {
          throw new Error("Failed to fetch rolls");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching rolls:", error);
        return [];
      }
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<QualityViolation>) => {
      return apiRequest("/api/quality-violations", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-violations"] });
      toast({
        title: t("common.success"),
        description: t("common.item_created", { item: t("quality.violations") }),
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("common.something_went_wrong"),
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<QualityViolation>) => {
      return apiRequest(`/api/quality-violations/${currentViolation?.id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-violations"] });
      toast({
        title: t("common.success"),
        description: t("common.item_updated", { item: t("quality.violations") }),
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("common.something_went_wrong"),
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      description: "",
      severity: "Major",
      status: "Open",
      violationType: "Process",
      affectedArea: "Machine",
      notes: "",
      qualityCheckId: qualityChecks && qualityChecks.length > 0 ? qualityChecks[0].id : undefined
    });
    setCurrentViolation(null);
  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "qualityCheckId") {
      // Convert string to number for qualityCheckId, or set to undefined if empty
      const numericValue = value && value !== "" ? parseInt(value) : undefined;
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateOrUpdate = () => {
    // Validate required fields
    if (!formData.description || !formData.severity || !formData.status || !formData.violationType || !formData.affectedArea) {
      toast({
        title: t("common.validation_error"),
        description: t("common.required_fields"),
        variant: "destructive",
      });
      return;
    }

    if (currentViolation) {
      updateMutation.mutate(formData);
    } else {
      // For new violations, we need to provide a qualityCheckId
      // If no specific quality check is selected, use the first available one
      let qualityCheckId = formData.qualityCheckId;
      
      if (!qualityCheckId && qualityChecks && qualityChecks.length > 0) {
        qualityCheckId = qualityChecks[0].id;
      }
      
      if (!qualityCheckId) {
        toast({
          title: t("common.validation_error"),
          description: "Please select a quality check or ensure quality checks exist in the system",
          variant: "destructive",
        });
        return;
      }

      createMutation.mutate({
        ...formData,
        qualityCheckId: typeof qualityCheckId === 'number' ? qualityCheckId : parseInt(qualityCheckId.toString()),
        reportDate: new Date(),
        reportedBy: users[0]?.id || "Unknown",
      });
    }
  };

  const handleEditClick = (violation: QualityViolation) => {
    setCurrentViolation(violation);
    setFormData({
      description: violation.description,
      severity: violation.severity,
      status: violation.status,
      violationType: violation.violationType,
      affectedArea: violation.affectedArea,
      notes: violation.notes || "",
      rootCause: violation.rootCause || "",
      qualityCheckId: violation.qualityCheckId,
      jobOrderId: violation.jobOrderId,
      rollId: violation.rollId
    });
    setIsDialogOpen(true);
  };

  const handleViewClick = (violation: QualityViolation) => {
    setCurrentViolation(violation);
    setIsViewDialogOpen(true);
  };

  // Apply filters
  const filteredViolations = violations.filter((violation: QualityViolation) => {
    let match = true;
    
    // Filter by severity
    if (filters.severity !== "all" && violation.severity !== filters.severity) {
      match = false;
    }
    
    // Filter by status
    if (filters.status !== "all" && violation.status !== filters.status) {
      match = false;
    }
    
    // Filter by date range
    if (filters.dateRange !== "all") {
      const today = new Date();
      const violationDate = new Date(violation.reportDate);
      const daysDiff = Math.floor((today.getTime() - violationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (
        (filters.dateRange === "week" && daysDiff > 7) ||
        (filters.dateRange === "month" && daysDiff > 30) ||
        (filters.dateRange === "quarter" && daysDiff > 90)
      ) {
        match = false;
      }
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const descMatch = violation.description?.toLowerCase().includes(searchLower) || false;
      const notesMatch = violation.notes?.toLowerCase().includes(searchLower) || false;
      const areaMatch = violation.affectedArea?.toLowerCase().includes(searchLower) || false;
      
      if (!descMatch && !notesMatch && !areaMatch) {
        match = false;
      }
    }
    
    return match;
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>{t("quality.violations")}</CardTitle>
              <CardDescription>{t("quality.violations_description")}</CardDescription>
            </div>
            <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              {t("common.add_new", { item: t("quality.violations") })}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="bg-muted/20 p-4 rounded-lg mb-4">
            <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  value={filters.searchTerm}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Select
                    value={filters.severity}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger className="h-9 w-[130px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("common.severity")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.all")}</SelectItem>
                      <SelectItem value="Critical">{t("quality.severity_critical")}</SelectItem>
                      <SelectItem value="Major">{t("quality.severity_major")}</SelectItem>
                      <SelectItem value="Minor">{t("quality.severity_minor")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-9 w-[130px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("common.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.all")}</SelectItem>
                      <SelectItem value="Open">{t("quality.open")}</SelectItem>
                      <SelectItem value="In Progress">{t("common.in_progress")}</SelectItem>
                      <SelectItem value="Resolved">{t("quality.resolved")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger className="h-9 w-[130px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("common.date_range")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.all_time")}</SelectItem>
                      <SelectItem value="week">{t("common.past_week")}</SelectItem>
                      <SelectItem value="month">{t("common.past_month")}</SelectItem>
                      <SelectItem value="quarter">{t("common.past_quarter")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileWarning className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("common.no_items_found", { items: t("quality.violations") })}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">{t("common.id")}</TableHead>
                    <TableHead>{t("common.description")}</TableHead>
                    <TableHead>{t("common.severity")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("common.area")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredViolations.map((violation: QualityViolation) => (
                    <TableRow key={violation.id}>
                      <TableCell>{violation.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {violation.description}
                      </TableCell>
                      <TableCell>
                        <QualityBadge 
                          variant={
                            violation.severity === "Critical" ? "destructive" :
                            violation.severity === "Major" ? "warning" : "info"
                          }
                        >
                          {violation.severity}
                        </QualityBadge>
                      </TableCell>
                      <TableCell>
                        <QualityBadge 
                          variant={
                            violation.status === "Open" ? "destructive" :
                            violation.status === "In Progress" ? "warning" : "success"
                          }
                        >
                          {violation.status}
                        </QualityBadge>
                      </TableCell>
                      <TableCell>{violation.affectedArea}</TableCell>
                      <TableCell>
                        {format(new Date(violation.reportDate), "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClick(violation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(violation)}
                          >
                            <Pencil className="h-4 w-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentViolation 
                ? t("common.edit_item", { item: t("quality.violations") }) 
                : t("common.add_new", { item: t("quality.violations") })}
            </DialogTitle>
            <DialogDescription>
              {currentViolation ? "Edit the quality violation details and status." : "Create a new quality violation record to track and manage quality issues."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="required">
                  {t("common.description")}
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder={t("common.enter_description")}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="severity" className="required">
                    {t("common.severity")}
                  </Label>
                  <Select
                    value={formData.severity as string}
                    onValueChange={(value) => handleSelectChange("severity", value)}
                  >
                    <SelectTrigger id="severity">
                      <SelectValue placeholder={t("common.select_severity")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">{t("quality.severity_critical")}</SelectItem>
                      <SelectItem value="Major">{t("quality.severity_major")}</SelectItem>
                      <SelectItem value="Minor">{t("quality.severity_minor")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="required">
                    {t("common.status")}
                  </Label>
                  <Select
                    value={formData.status as string}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder={t("common.select_status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">{t("quality.open")}</SelectItem>
                      <SelectItem value="In Progress">{t("common.in_progress")}</SelectItem>
                      <SelectItem value="Resolved">{t("quality.resolved")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="violationType" className="required">
                  {t("common.type")}
                </Label>
                <Select
                  value={formData.violationType as string}
                  onValueChange={(value) => handleSelectChange("violationType", value)}
                >
                  <SelectTrigger id="violationType">
                    <SelectValue placeholder={t("common.select_type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Process">{t("common.process")}</SelectItem>
                    <SelectItem value="Product">{t("common.product")}</SelectItem>
                    <SelectItem value="Material">{t("common.material")}</SelectItem>
                    <SelectItem value="Machine">{t("common.machine")}</SelectItem>
                    <SelectItem value="Operator">{t("common.operator")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="affectedArea" className="required">
                  {t("common.affected_area")}
                </Label>
                <Select
                  value={formData.affectedArea as string}
                  onValueChange={(value) => handleSelectChange("affectedArea", value)}
                >
                  <SelectTrigger id="affectedArea">
                    <SelectValue placeholder={t("common.select_area")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Machine">{t("common.machine")}</SelectItem>
                    <SelectItem value="Extrusion">{t("workflow.extrusion")}</SelectItem>
                    <SelectItem value="Printing">{t("workflow.printing")}</SelectItem>
                    <SelectItem value="Cutting">{t("workflow.cutting")}</SelectItem>
                    <SelectItem value="Quality">{t("quality.title")}</SelectItem>
                    <SelectItem value="Warehouse">{t("warehouse.title")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualityCheckId" className="required">
                  {t("quality.quality_check")}
                </Label>
                <Select
                  value={formData.qualityCheckId?.toString() || ""}
                  onValueChange={(value) => handleSelectChange("qualityCheckId", value)}
                >
                  <SelectTrigger id="qualityCheckId">
                    <SelectValue placeholder={t("common.select_if_applicable")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("common.none")}</SelectItem>
                    {qualityChecks.map((check: QualityCheck) => (
                      <SelectItem key={check.id} value={check.id.toString()}>
                        ID: {check.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rootCause">
                  {t("common.root_cause")}
                </Label>
                <Input
                  id="rootCause"
                  name="rootCause"
                  value={formData.rootCause || ""}
                  onChange={handleInputChange}
                  placeholder={t("common.enter_if_known")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">
                {t("common.notes")}
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                rows={3}
                placeholder={t("common.enter_additional_notes")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={handleCreateOrUpdate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {currentViolation ? t("common.update") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("quality.violations")} #{currentViolation?.id}
            </DialogTitle>
            <DialogDescription>
              View detailed information about this quality violation including status, severity, and resolution notes.
            </DialogDescription>
          </DialogHeader>
          {currentViolation && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t("common.description")}
                    </h3>
                    <p>{currentViolation.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t("common.type")}
                    </h3>
                    <p>{currentViolation.violationType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t("common.affected_area")}
                    </h3>
                    <p>{currentViolation.affectedArea}</p>
                  </div>
                  {currentViolation.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("common.notes")}
                      </h3>
                      <p>{currentViolation.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("common.severity")}
                      </h3>
                      <QualityBadge
                        variant={
                          currentViolation.severity === "Critical" ? "destructive" :
                          currentViolation.severity === "Major" ? "warning" : "info"
                        }
                      >
                        {currentViolation.severity}
                      </QualityBadge>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("common.status")}
                      </h3>
                      <QualityBadge
                        variant={
                          currentViolation.status === "Open" ? "destructive" :
                          currentViolation.status === "In Progress" ? "warning" : "success"
                        }
                      >
                        {currentViolation.status}
                      </QualityBadge>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t("common.report_date")}
                    </h3>
                    <p>{format(new Date(currentViolation.reportDate), "yyyy-MM-dd HH:mm")}</p>
                  </div>
                  {currentViolation.resolutionDate && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("common.resolution_date")}
                      </h3>
                      <p>{format(new Date(currentViolation.resolutionDate), "yyyy-MM-dd HH:mm")}</p>
                    </div>
                  )}
                  {currentViolation.rootCause && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("common.root_cause")}
                      </h3>
                      <p>{currentViolation.rootCause}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-2">{t("common.related_information")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentViolation.qualityCheckId && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">
                        {t("quality.quality_check")}
                      </h4>
                      <p>ID: {currentViolation.qualityCheckId}</p>
                    </div>
                  )}
                  {currentViolation.jobOrderId && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">
                        {t("common.job_order")}
                      </h4>
                      <p>JO #{currentViolation.jobOrderId}</p>
                    </div>
                  )}
                  {currentViolation.rollId && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">
                        {t("common.roll")}
                      </h4>
                      <p>ID: {currentViolation.rollId}</p>
                    </div>
                  )}
                  {currentViolation.reportedBy && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">
                        {t("common.reported_by")}
                      </h4>
                      <p>
                        {users.find(u => u.id === currentViolation.reportedBy)?.fullName || 
                          currentViolation.reportedBy}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t("common.close")}
            </Button>
            <Button 
              onClick={() => {
                setIsViewDialogOpen(false);
                if (currentViolation) {
                  handleEditClick(currentViolation);
                }
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}