import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Filter,
  Search,
  Eye,
  CheckCircle2,
  Printer,
  ClipboardList,
  AlertCircle,
  Calendar,
  User,
  Package,
  FileText
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth-v2";

// Types
interface QualityCheckType {
  id: string;
  name: string;
  description: string;
  targetStage: string;
  checklistItems: string[];
  parameters: string[];
  isActive: boolean;
}

interface QualityCheck {
  id: number;
  checkTypeId: string;
  rollId?: string;
  jobOrderId?: number;
  performedBy: string;
  timestamp: string;
  status: string;
  notes?: string;
  checklistResults: string[];
  parameterValues: string[];
  issueSeverity?: string;
  imageUrls?: string[];
}

interface CheckFormData {
  checkTypeId: string;
  rollId?: string;
  jobOrderId?: number;
  performedBy: string;
  timestamp: string;
  status: string;
  notes: string;
  checklistResults: Record<string, boolean>;
  parameterValues: Record<string, string>;
  issueSeverity?: string;
}

export function IntegratedQualityChecksManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<QualityCheck | null>(null);
  const [selectedCheckType, setSelectedCheckType] = useState<QualityCheckType | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CheckFormData>({
    checkTypeId: "",
    rollId: undefined,
    jobOrderId: undefined,
    performedBy: user?.id || "",
    timestamp: new Date().toISOString().split('T')[0],
    status: "pending",
    notes: "",
    checklistResults: {},
    parameterValues: {},
    issueSeverity: undefined
  });

  // Auto-set performedBy when user is available
  useEffect(() => {
    if (user && !formData.performedBy) {
      setFormData(prev => ({ ...prev, performedBy: user.id }));
    }
  }, [user, formData.performedBy]);

  // Data fetching
  const { data: checks = [], isLoading: checksLoading } = useQuery<QualityCheck[]>({
    queryKey: ["/api/quality-checks"]
  });

  const { data: checkTypes = [], isLoading: checkTypesLoading } = useQuery<QualityCheckType[]>({
    queryKey: ["/api/quality-check-types"]
  });

  const { data: rolls = [], isLoading: rollsLoading } = useQuery<any[]>({
    queryKey: ["/api/rolls"]
  });

  const { data: jobOrders = [], isLoading: jobOrdersLoading } = useQuery<any[]>({
    queryKey: ["/api/job-orders"]
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"]
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"]
  });

  const { data: customerProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/customer-products"]
  });

  const { data: items = [] } = useQuery<any[]>({
    queryKey: ["/api/items"]
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"]
  });

  // Handle check type selection
  const handleCheckTypeChange = (checkTypeId: string) => {
    const checkType = checkTypes.find(ct => ct.id === checkTypeId);
    setSelectedCheckType(checkType || null);
    
    if (checkType) {
      // Initialize checklist results and parameter values
      const checklistResults: Record<string, boolean> = {};
      const parameterValues: Record<string, string> = {};
      
      checkType.checklistItems?.forEach(item => {
        checklistResults[item] = false;
      });
      
      checkType.parameters?.forEach(param => {
        parameterValues[param] = "";
      });
      
      setFormData(prev => ({
        ...prev,
        checkTypeId,
        checklistResults,
        parameterValues
      }));
    }
  };

  // Handle checklist item toggle
  const handleChecklistChange = (item: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      checklistResults: {
        ...prev.checklistResults,
        [item]: checked
      }
    }));
  };

  // Handle parameter value change
  const handleParameterChange = (param: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      parameterValues: {
        ...prev.parameterValues,
        [param]: value
      }
    }));
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CheckFormData) => {
      const submitData = {
        ...data,
        checklistResults: Object.entries(data.checklistResults)
          .filter(([_, checked]) => checked)
          .map(([item, _]) => item),
        parameterValues: Object.entries(data.parameterValues)
          .filter(([_, value]) => value.trim() !== "")
          .map(([param, value]) => `${param}: ${value}`)
      };
      
      return apiRequest("POST", "/api/quality-checks", submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
      toast({ 
        title: t("quality.check_created_success", "Quality check created successfully") 
      });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: t("quality.check_created_error", "Failed to create quality check"), 
        variant: "destructive" 
      });
      console.error("Error creating quality check:", error);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CheckFormData & { id: number }) => {
      const { id, ...updateData } = data;
      const submitData = {
        ...updateData,
        checklistResults: Object.entries(updateData.checklistResults)
          .filter(([_, checked]) => checked)
          .map(([item, _]) => item),
        parameterValues: Object.entries(updateData.parameterValues)
          .filter(([_, value]) => value.trim() !== "")
          .map(([param, value]) => `${param}: ${value}`)
      };
      
      return apiRequest("PATCH", `/api/quality-checks/${id}`, submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
      toast({ 
        title: t("quality.check_updated_success", "Quality check updated successfully") 
      });
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: t("quality.check_updated_error", "Failed to update quality check"), 
        variant: "destructive" 
      });
      console.error("Error updating quality check:", error);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/quality-checks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
      toast({ 
        title: t("quality.check_deleted_success", "Quality check deleted successfully") 
      });
    },
    onError: (error) => {
      toast({ 
        title: t("quality.check_deleted_error", "Failed to delete quality check"), 
        variant: "destructive" 
      });
      console.error("Error deleting quality check:", error);
    }
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      checkTypeId: "",
      rollId: undefined,
      jobOrderId: undefined,
      performedBy: user?.id || "",
      timestamp: new Date().toISOString().split('T')[0],
      status: "pending",
      notes: "",
      checklistResults: {},
      parameterValues: {},
      issueSeverity: undefined
    });
    setSelectedCheckType(null);
    setCurrentCheck(null);
  };

  // Handle edit
  const handleEdit = (check: QualityCheck) => {
    setCurrentCheck(check);
    const checkType = checkTypes.find(ct => ct.id === check.checkTypeId);
    setSelectedCheckType(checkType || null);
    
    // Convert arrays back to objects
    const checklistResults: Record<string, boolean> = {};
    const parameterValues: Record<string, string> = {};
    
    if (checkType) {
      checkType.checklistItems?.forEach(item => {
        checklistResults[item] = check.checklistResults?.includes(item) || false;
      });
      
      check.parameterValues?.forEach(paramValue => {
        const [param, value] = paramValue.split(': ');
        if (param && value) {
          parameterValues[param] = value;
        }
      });
    }
    
    setFormData({
      checkTypeId: check.checkTypeId,
      rollId: check.rollId,
      jobOrderId: check.jobOrderId,
      performedBy: check.performedBy,
      timestamp: check.timestamp.split('T')[0],
      status: check.status,
      notes: check.notes || "",
      checklistResults,
      parameterValues,
      issueSeverity: check.issueSeverity
    });
    
    setShowEditDialog(true);
  };

  // Handle view
  const handleView = (check: QualityCheck) => {
    setCurrentCheck(check);
    const checkType = checkTypes.find(ct => ct.id === check.checkTypeId);
    setSelectedCheckType(checkType || null);
    setShowViewDialog(true);
  };

  // Get helper functions
  const getCheckTypeName = (checkTypeId: string) => {
    const checkType = checkTypes.find(ct => ct.id === checkTypeId);
    return checkType?.name || checkTypeId;
  };

  const getRollName = (rollId: string) => {
    const roll = Array.isArray(rolls) ? rolls.find((r: any) => r.id === rollId) : null;
    return roll ? `${roll.id} (${roll.serialNumber || 'N/A'})` : rollId;
  };

  const getJobOrderName = (jobOrderId: number) => {
    const jobOrder = Array.isArray(jobOrders) ? jobOrders.find((jo: any) => jo.id === jobOrderId) : null;
    if (!jobOrder) return `JO-${jobOrderId}`;
    
    const order = Array.isArray(orders) ? orders.find((o: any) => o.id === jobOrder.orderId) : null;
    const customer = Array.isArray(customers) ? customers.find((c: any) => c.id === order?.customerId) : null;
    const customerProduct = Array.isArray(customerProducts) ? customerProducts.find((cp: any) => cp.id === jobOrder.customerProductId) : null;
    const item = Array.isArray(items) ? items.find((i: any) => i.id === customerProduct?.itemId) : null;
    
    return `JO-${jobOrderId} (${customer?.name || 'Unknown'} - ${item?.name || 'Unknown'})`;
  };

  const getUserName = (userId: string) => {
    const user = Array.isArray(users) ? users.find((u: any) => u.id === userId) : null;
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : userId;
  };

  // Filter checks
  const filteredChecks = checks.filter(check => {
    const matchesSearch = getCheckTypeName(check.checkTypeId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (check.rollId && getRollName(check.rollId).toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (check.notes && check.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === "all" || check.status === filterStatus;
    
    const checkType = checkTypes.find(ct => ct.id === check.checkTypeId);
    const matchesStage = filterStage === "all" || (checkType && checkType.targetStage === filterStage);
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  // Get unique stages for filter
  const uniqueStages = [...new Set(checkTypes.map(ct => ct.targetStage))];

  const isLoading = checksLoading || checkTypesLoading || rollsLoading || jobOrdersLoading || usersLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("quality.quality_checks", "Quality Checks")}
          </h2>
          <p className="text-muted-foreground">
            {t("quality.quality_checks_desc", "Perform and track quality inspections using defined check types")}
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              {t("quality.add_check", "Add Quality Check")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("quality.add_check", "Add Quality Check")}</DialogTitle>
              <DialogDescription>
                {t("quality.add_check_desc", "Create a new quality check using predefined check types")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t("quality.basic_information", "Basic Information")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="checkType">{t("quality.check_type", "Check Type")} *</Label>
                      <Select value={formData.checkTypeId} onValueChange={handleCheckTypeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_check_type", "Select check type")} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(checkTypes) && checkTypes.filter(ct => ct.isActive).map(checkType => (
                            <SelectItem key={checkType.id} value={checkType.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{checkType.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {checkType.targetStage} • {checkType.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="performedBy">{t("quality.performed_by", "Performed By")} *</Label>
                      <Select value={formData.performedBy} onValueChange={(value) => setFormData(prev => ({ ...prev, performedBy: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_user", "Select user")} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(users) && users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {getUserName(user.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="timestamp">{t("quality.check_date", "Check Date")} *</Label>
                      <Input
                        type="date"
                        value={formData.timestamp}
                        onChange={(e) => setFormData(prev => ({ ...prev, timestamp: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status">{t("quality.status", "Status")} *</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t("quality.pending", "Pending")}</SelectItem>
                          <SelectItem value="passed">{t("quality.passed", "Passed")}</SelectItem>
                          <SelectItem value="failed">{t("quality.failed", "Failed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rollId">{t("quality.roll", "Roll")} ({t("common.optional", "Optional")})</Label>
                      <Select value={formData.rollId || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, rollId: value === "none" ? undefined : value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_roll", "Select roll")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("quality.no_roll", "No Roll")}</SelectItem>
                          {Array.isArray(rolls) && rolls.map((roll: any) => (
                            <SelectItem key={roll.id} value={roll.id}>
                              {getRollName(roll.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="jobOrderId">{t("quality.job_order", "Job Order")} ({t("common.optional", "Optional")})</Label>
                      <Select value={formData.jobOrderId?.toString() || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, jobOrderId: value === "none" ? undefined : parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_job_order", "Select job order")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("quality.no_job_order", "No Job Order")}</SelectItem>
                          {Array.isArray(jobOrders) && jobOrders
                            .filter(jobOrder => {
                              // Only show job orders that have associated rolls
                              return Array.isArray(rolls) && rolls.some(roll => roll.jobOrderId === jobOrder.id);
                            })
                            .map((jobOrder: any) => (
                              <SelectItem key={jobOrder.id} value={jobOrder.id.toString()}>
                                {getJobOrderName(jobOrder.id)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Dynamic Checklist */}
              {selectedCheckType && selectedCheckType.checklistItems && selectedCheckType.checklistItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      {t("quality.checklist_items", "Checklist Items")}
                    </CardTitle>
                    <CardDescription>
                      {t("quality.checklist_desc", "Mark completed items from the quality check type")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedCheckType.checklistItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`checklist-${index}`}
                            checked={formData.checklistResults[item] || false}
                            onCheckedChange={(checked) => handleChecklistChange(item, checked as boolean)}
                          />
                          <Label htmlFor={`checklist-${index}`} className="text-sm font-medium">
                            {item}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Dynamic Parameters */}
              {selectedCheckType && selectedCheckType.parameters && selectedCheckType.parameters.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {t("quality.parameters", "Parameters")}
                    </CardTitle>
                    <CardDescription>
                      {t("quality.parameters_desc", "Enter values for quality parameters")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCheckType.parameters.map((param, index) => (
                        <div key={index}>
                          <Label htmlFor={`param-${index}`}>{param}</Label>
                          <Input
                            id={`param-${index}`}
                            value={formData.parameterValues[param] || ""}
                            onChange={(e) => handleParameterChange(param, e.target.value)}
                            placeholder={t("quality.enter_value", "Enter value")}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Issue Severity and Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("quality.additional_info", "Additional Information")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.status === "failed" && (
                    <div>
                      <Label>{t("quality.issue_severity", "Issue Severity")}</Label>
                      <RadioGroup value={formData.issueSeverity || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, issueSeverity: value }))}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="minor" id="minor" />
                          <Label htmlFor="minor">{t("quality.minor", "Minor")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="major" id="major" />
                          <Label htmlFor="major">{t("quality.major", "Major")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="critical" id="critical" />
                          <Label htmlFor="critical">{t("quality.critical", "Critical")}</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="notes">{t("quality.notes", "Notes")}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder={t("quality.enter_notes", "Enter any additional notes or observations")}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button 
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.checkTypeId || !formData.performedBy || createMutation.isPending}
              >
                {createMutation.isPending ? t("common.creating", "Creating...") : t("common.create", "Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("quality.search_checks", "Search quality checks...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("quality.all_status", "All Status")}</SelectItem>
              <SelectItem value="pending">{t("quality.pending", "Pending")}</SelectItem>
              <SelectItem value="passed">{t("quality.passed", "Passed")}</SelectItem>
              <SelectItem value="failed">{t("quality.failed", "Failed")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("quality.all_stages", "All Stages")}</SelectItem>
              {uniqueStages.map(stage => (
                <SelectItem key={stage} value={stage}>
                  {t(`quality.stage_${stage}`, stage)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Checks Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("quality.check_type", "Check Type")}</TableHead>
                  <TableHead>{t("quality.target_stage", "Stage")}</TableHead>
                  <TableHead>{t("quality.status", "Status")}</TableHead>
                  <TableHead>{t("quality.performed_by", "Performed By")}</TableHead>
                  <TableHead>{t("quality.date", "Date")}</TableHead>
                  <TableHead>{t("quality.roll", "Roll")}</TableHead>
                  <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChecks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                      {t("quality.no_checks", "No quality checks found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChecks.map((check) => {
                    const checkType = checkTypes.find(ct => ct.id === check.checkTypeId);
                    return (
                      <TableRow key={check.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{getCheckTypeName(check.checkTypeId)}</span>
                            {checkType?.description && (
                              <span className="text-xs text-muted-foreground">{checkType.description}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{checkType?.targetStage || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            check.status === "passed" ? "default" : 
                            check.status === "failed" ? "destructive" : "secondary"
                          }>
                            {t(`quality.${check.status}`, check.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getUserName(check.performedBy)}</TableCell>
                        <TableCell>{format(new Date(check.timestamp), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {check.rollId ? (
                            <Badge variant="outline">{getRollName(check.rollId)}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleView(check)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(check)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteMutation.mutate(check.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("quality.view_check", "View Quality Check")}</DialogTitle>
          </DialogHeader>
          
          {currentCheck && selectedCheckType && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("quality.check_type", "Check Type")}
                  </Label>
                  <p className="font-medium">{selectedCheckType.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("quality.status", "Status")}
                  </Label>
                  <Badge variant={
                    currentCheck.status === "passed" ? "default" : 
                    currentCheck.status === "failed" ? "destructive" : "secondary"
                  }>
                    {t(`quality.${currentCheck.status}`, currentCheck.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("quality.performed_by", "Performed By")}
                  </Label>
                  <p>{getUserName(currentCheck.performedBy)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("quality.date", "Date")}
                  </Label>
                  <p>{format(new Date(currentCheck.timestamp), "MMM dd, yyyy")}</p>
                </div>
              </div>
              
              {currentCheck.checklistResults && currentCheck.checklistResults.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("quality.completed_items", "Completed Checklist Items")}
                  </Label>
                  <div className="mt-2 space-y-1">
                    {currentCheck.checklistResults.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {currentCheck.parameterValues && currentCheck.parameterValues.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("quality.parameter_values", "Parameter Values")}
                  </Label>
                  <div className="mt-2 space-y-1">
                    {currentCheck.parameterValues.map((paramValue, index) => (
                      <div key={index} className="text-sm">
                        {paramValue}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {currentCheck.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("quality.notes", "Notes")}
                  </Label>
                  <p className="text-sm mt-1">{currentCheck.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}