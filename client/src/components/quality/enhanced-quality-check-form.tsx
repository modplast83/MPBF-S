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
import { 
  Edit, 
  Trash2, 
  Plus, 
  Filter,
  Search,
  Eye,
  CheckCircle2,
  Printer
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth-v2";

// Badge variants for success/warning states
const badgeVariants = {
  success: "bg-green-500 text-white hover:bg-green-600",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80"
};

export function QualityChecksManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResult, setFilterResult] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<any>(null);
  const [filteredRolls, setFilteredRolls] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    checkTypeId: "",
    rollId: "none",
    jobOrderId: "none",
    performedBy: "",
    checkDate: new Date().toISOString().split('T')[0],
    passed: true,
    notes: ""
  });

  // Auto-set performedBy when user is available
  useEffect(() => {
    if (user && !formData.performedBy) {
      setFormData(prev => ({
        ...prev,
        performedBy: user.id
      }));
    }
  }, [user, formData.performedBy]);

  // Fetch quality checks
  const { data: checks = [], isLoading: checksLoading, refetch: refetchChecks } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    }
  });

  // Fetch check types
  const { data: checkTypes = [], isLoading: checkTypesLoading } = useQuery({
    queryKey: ["/api/quality-check-types"],
    queryFn: async () => {
      const response = await fetch("/api/quality-check-types");
      if (!response.ok) {
        throw new Error("Failed to fetch check types");
      }
      return response.json();
    }
  });

  // Fetch rolls
  const { data: rolls = [], isLoading: rollsLoading } = useQuery({
    queryKey: ["/api/rolls"],
    queryFn: async () => {
      const response = await fetch("/api/rolls");
      if (!response.ok) {
        throw new Error("Failed to fetch rolls");
      }
      return response.json();
    }
  });

  // Fetch job orders
  const { data: jobOrders = [], isLoading: jobOrdersLoading } = useQuery({
    queryKey: ["/api/job-orders"],
    queryFn: async () => {
      const response = await fetch("/api/job-orders");
      if (!response.ok) {
        throw new Error("Failed to fetch job orders");
      }
      return response.json();
    }
  });

  // Fetch users for dropdown selection
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

  // Fetch customers for better job order display
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      return response.json();
    }
  });

  // Fetch customer products for better job order display
  const { data: customerProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/customer-products"],
    queryFn: async () => {
      const response = await fetch("/api/customer-products");
      if (!response.ok) {
        throw new Error("Failed to fetch customer products");
      }
      return response.json();
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/quality-checks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create quality check");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.check_created_success"),
      });
      setShowAddDialog(false);
      resetForm();
      refetchChecks();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
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
      const response = await fetch(`/api/quality-checks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update quality check");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.check_updated_success"),
      });
      setShowEditDialog(false);
      resetForm();
      refetchChecks();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
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
      const response = await fetch(`/api/quality-checks/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete quality check");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.check_deleted_success"),
      });
      setShowDeleteDialog(false);
      refetchChecks();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
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
      checkTypeId: "",
      rollId: "none",
      jobOrderId: "none",
      performedBy: user?.id || "",
      checkDate: new Date().toISOString().split('T')[0],
      passed: true,
      notes: ""
    });
    setFilteredRolls([]);
    setCurrentCheck(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Map form data to proper database fields
    const dataToSubmit = {
      checkTypeId: formData.checkTypeId,
      rollId: formData.rollId === "none" ? null : formData.rollId,
      jobOrderId: formData.jobOrderId === "none" ? null : parseInt(formData.jobOrderId),
      performedBy: formData.performedBy,
      status: formData.passed ? 'passed' : 'failed',
      notes: formData.notes,
      timestamp: new Date().toISOString()
    };
    
    console.log("Submitting quality check data:", dataToSubmit);
    createMutation.mutate(dataToSubmit);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCheck) {
      // Map form data to proper database fields for update
      const dataToSubmit = {
        checkTypeId: formData.checkTypeId,
        rollId: formData.rollId === "none" ? null : formData.rollId,
        jobOrderId: formData.jobOrderId === "none" ? null : parseInt(formData.jobOrderId),
        performedBy: formData.performedBy,
        status: formData.passed ? 'passed' : 'failed',
        notes: formData.notes
      };
      
      console.log("Updating quality check data:", dataToSubmit);
      updateMutation.mutate({ id: currentCheck.id, data: dataToSubmit });
    }
  };

  const handleDeleteConfirm = () => {
    if (currentCheck) {
      deleteMutation.mutate(currentCheck.id);
    }
  };

  const handlePrintClick = (check: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const checkType = checkTypes.find(ct => ct.id === check.checkTypeId);
    const jobOrder = jobOrders.find(jo => jo.id === check.jobOrderId);
    const customer = jobOrder ? customers.find(c => c.id === jobOrder.customerId) : null;
    const product = jobOrder ? customerProducts.find(p => p.id === jobOrder.customerProductId) : null;
    const performer = users.find(u => u.id === check.performedBy);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quality Check Report - ${check.id}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #007bff; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
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
              color: #007bff;
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
            .status-passed { 
              color: #28a745; 
              font-weight: bold; 
            }
            .status-failed { 
              color: #dc3545; 
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
            <div class="report-title">Quality Check Report</div>
          </div>

          <div class="section">
            <div class="section-title">Check Information</div>
            <div class="detail-row">
              <div class="detail-label">Check ID:</div>
              <div class="detail-value">#${check.id}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Check Type:</div>
              <div class="detail-value">${checkType?.name || 'Unknown'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Status:</div>
              <div class="detail-value">
                <span class="${check.status === 'passed' ? 'status-passed' : 'status-failed'}">
                  ${check.status === 'passed' ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Date & Time:</div>
              <div class="detail-value">${format(new Date(check.timestamp || check.checkDate), 'MMM dd, yyyy - HH:mm')}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Production Details</div>
            <div class="detail-row">
              <div class="detail-label">Job Order:</div>
              <div class="detail-value">${jobOrder ? `JO #${jobOrder.id}` : 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Customer:</div>
              <div class="detail-value">${customer?.name || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Product:</div>
              <div class="detail-value">${product?.name || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Roll ID:</div>
              <div class="detail-value">${check.rollId || 'Not specified'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Quality Control</div>
            <div class="detail-row">
              <div class="detail-label">Performed By:</div>
              <div class="detail-value">${performer ? `${performer.firstName} ${performer.lastName}` : 'Unknown'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Notes:</div>
              <div class="detail-value">${check.notes || 'No additional notes'}</div>
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

  const handleEditClick = (check: any) => {
    setCurrentCheck(check);
    
    // When editing, filter rolls for the selected job order
    if (check.jobOrderId) {
      const jobOrderId = parseInt(check.jobOrderId.toString());
      const relatedRolls = rolls.filter((roll: any) => roll.jobOrderId === jobOrderId);
      setFilteredRolls(relatedRolls);
    }
    
    setFormData({
      checkTypeId: check.checkTypeId ? String(check.checkTypeId) : "",
      rollId: check.rollId || "none",
      jobOrderId: check.jobOrderId ? String(check.jobOrderId) : "none",
      performedBy: check.performedBy || "",
      checkDate: check.checkDate ? new Date(check.checkDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      passed: check.status === 'passed',
      notes: check.notes || ""
    });
    setShowEditDialog(true);
  };

  const handleViewClick = (check: any) => {
    setCurrentCheck(check);
    setShowViewDialog(true);
  };

  const handleDeleteClick = (check: any) => {
    setCurrentCheck(check);
    setShowDeleteDialog(true);
  };

  // Filter and search functionality
  const filteredChecks = checks.filter((check: any) => {
    const matchesSearch = searchQuery === "" || 
      (check.notes && check.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesResult = filterResult === "all" || 
      (filterResult === "passed" && check.status === 'passed') || 
      (filterResult === "failed" && check.status === 'failed');
    
    const matchesType = filterType === "all" || check.checkTypeId === filterType;
    
    return matchesSearch && matchesResult && matchesType;
  });

  const getCheckTypeName = (typeId: string) => {
    const type = checkTypes.find((t: any) => t.id === typeId);
    if (type) {
      return type.name;
    }
    return typeId || t("common.unknown");
  };

  const getUserById = (id: string) => {
    const user = users.find((user: any) => user.id === id);
    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`;
    }
    return id || t("common.unknown");
  };

  const isLoading = checksLoading || checkTypesLoading || rollsLoading || jobOrdersLoading || usersLoading;

  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <Select 
              value={filterResult} 
              onValueChange={setFilterResult}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t("quality.result")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="passed">{t("quality.passed")}</SelectItem>
                <SelectItem value="failed">{t("quality.failed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
            <Select 
              value={filterType} 
              onValueChange={setFilterType}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("quality.check_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {checkTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> {t("quality.add_check")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t("quality.add_quality_check")}</DialogTitle>
                <DialogDescription>{t("quality.add_quality_check_description")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4 py-4">
                  {/* Check Type Selection */}
                  <div>
                    <Label htmlFor="checkTypeId">{t("quality.check_type")} *</Label>
                    <Select 
                      value={formData.checkTypeId} 
                      onValueChange={(value) => setFormData({...formData, checkTypeId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("quality.select_check_type")} />
                      </SelectTrigger>
                      <SelectContent>
                        {checkTypes.map((type: any) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Job Order Selection - comes first */}
                  <div>
                    <Label htmlFor="jobOrderId">{t("quality.related_job_order")}</Label>
                    <Select 
                      value={formData.jobOrderId} 
                      onValueChange={(value) => {
                        // Reset roll selection when job order changes
                        setFormData({...formData, jobOrderId: value, rollId: "none"});
                        
                        // Filter rolls based on selected job order
                        if (value && value !== "none") {
                          const jobOrderId = parseInt(value);
                          const relatedRolls = rolls.filter((roll: any) => roll.jobOrderId === jobOrderId);
                          setFilteredRolls(relatedRolls);
                        } else {
                          setFilteredRolls([]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("quality.select_job_order")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("common.none")}</SelectItem>
                        {jobOrders.map((jo: any) => {
                          const customer = customers.find(c => c.id === jo.customerId);
                          const product = customerProducts.find(p => p.id === jo.customerProductId);
                          return (
                            <SelectItem key={jo.id} value={jo.id.toString()}>
                              JO #{jo.id} - {customer?.name || "Unknown Customer"} - {product?.name || "Unknown Item"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Roll Selection - depends on job order */}
                  <div>
                    <Label htmlFor="rollId">{t("quality.related_roll")}</Label>
                    <Select 
                      value={formData.rollId} 
                      onValueChange={(value) => setFormData({...formData, rollId: value})}
                      disabled={formData.jobOrderId === "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.jobOrderId !== "none" ? 
                          t("quality.select_roll") : t("quality.select_job_order_first") || "Select job order first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("common.none")}</SelectItem>
                        {(filteredRolls.length > 0 ? filteredRolls : []).map((roll: any) => (
                          <SelectItem key={roll.id} value={roll.id}>
                            {roll.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* User Selection - Auto-selected for current user */}
                  <div>
                    <Label htmlFor="performedBy">{t("quality.performed_by")} *</Label>
                    <Select 
                      value={formData.performedBy} 
                      onValueChange={(value) => setFormData({...formData, performedBy: value})}
                      disabled={true}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("quality.select_user")} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((userItem: any) => (
                          <SelectItem key={userItem.id} value={userItem.id}>
                            {userItem.firstName} {userItem.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Check Date */}
                  <div>
                    <Label htmlFor="checkDate">{t("quality.check_date")} *</Label>
                    <Input
                      type="date"
                      id="checkDate"
                      value={formData.checkDate}
                      onChange={(e) => setFormData({...formData, checkDate: e.target.value})}
                    />
                  </div>
                  
                  {/* Passed/Failed Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="passed"
                      checked={formData.passed}
                      onCheckedChange={(checked) => 
                        setFormData({...formData, passed: checked === true})
                      }
                    />
                    <Label htmlFor="passed">{t("quality.passed")}</Label>
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">{t("quality.notes")}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder={t("quality.notes_placeholder")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={!formData.checkTypeId || !formData.performedBy}>
                    {t("common.save")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quality Checks Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Check Type</TableHead>
              <TableHead>Job Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            ) : filteredChecks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  {t("quality.no_checks_found")}
                </TableCell>
              </TableRow>
            ) : (
              filteredChecks.map((check: any) => (
                <TableRow key={check.id}>
                  <TableCell className="font-medium">{check.id}</TableCell>
                  <TableCell>{getCheckTypeName(check.checkTypeId)}</TableCell>
                  <TableCell>
                    {check.jobOrderId ? (
                      `JO #${check.jobOrderId}`
                    ) : (
                      <span className="text-muted-foreground italic">{t("common.none")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={check.status === 'passed' ? badgeVariants.success : badgeVariants.destructive}>
                      {check.status === 'passed' ? "Passed" : t("quality.failed")}
                    </Badge>
                  </TableCell>
                  <TableCell>{getUserById(check.performedBy)}</TableCell>
                  <TableCell>
                    {
                      check.checkDate ? format(new Date(check.checkDate), 'MMM dd, yyyy') :
                      check.timestamp ? format(new Date(check.timestamp), 'MMM dd, yyyy') :
                      check.checkedAt ? format(new Date(check.checkedAt), 'MMM dd, yyyy') :
                      t("common.not_available")
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewClick(check)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handlePrintClick(check)}
                        title="Print Quality Check"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditClick(check)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteClick(check)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Quality Check Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("quality.view_quality_check")}</DialogTitle>
          </DialogHeader>
          {currentCheck && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Check Type</h4>
                  <p>{getCheckTypeName(currentCheck.checkTypeId)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <Badge className={currentCheck.status === 'passed' ? badgeVariants.success : badgeVariants.destructive}>
                    {currentCheck.status === 'passed' ? "Passed" : t("quality.failed")}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">{t("quality.related_job_order")}</h4>
                  <p>{currentCheck.jobOrderId ? `JO #${currentCheck.jobOrderId}` : t("common.none")}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">{t("quality.related_roll")}</h4>
                  <p>{currentCheck.rollId || t("common.none")}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">{t("quality.performed_by")}</h4>
                  <p>{getUserById(currentCheck.performedBy)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">{t("quality.check_date")}</h4>
                  <p>{
                    currentCheck.checkDate ? format(new Date(currentCheck.checkDate), 'MMM dd, yyyy') :
                    currentCheck.timestamp ? format(new Date(currentCheck.timestamp), 'MMM dd, yyyy') :
                    currentCheck.checkedAt ? format(new Date(currentCheck.checkedAt), 'MMM dd, yyyy') :
                    t("common.unknown")
                  }</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm mt-1">{currentCheck.notes || t("common.none")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quality Check Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("quality.edit_quality_check")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="space-y-4 py-4">
              {/* Check Type Selection */}
              <div>
                <Label htmlFor="checkTypeId">{t("quality.check_type")} *</Label>
                <Select 
                  value={formData.checkTypeId} 
                  onValueChange={(value) => setFormData({...formData, checkTypeId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quality.select_check_type")} />
                  </SelectTrigger>
                  <SelectContent>
                    {checkTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Job Order Selection - comes first */}
              <div>
                <Label htmlFor="jobOrderId">{t("quality.related_job_order")}</Label>
                <Select 
                  value={formData.jobOrderId} 
                  onValueChange={(value) => {
                    // Reset roll selection when job order changes
                    setFormData({...formData, jobOrderId: value, rollId: "none"});
                    
                    // Filter rolls based on selected job order
                    if (value && value !== "none") {
                      const jobOrderId = parseInt(value);
                      const relatedRolls = rolls.filter((roll: any) => roll.jobOrderId === jobOrderId);
                      setFilteredRolls(relatedRolls);
                    } else {
                      setFilteredRolls([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quality.select_job_order")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {jobOrders.map((jo: any) => {
                      const customer = customers.find(c => c.id === jo.customerId);
                      const product = customerProducts.find(p => p.id === jo.customerProductId);
                      return (
                        <SelectItem key={jo.id} value={jo.id.toString()}>
                          JO #{jo.id} - {customer?.name || "Unknown Customer"} - {product?.name || "Unknown Item"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Roll Selection - depends on job order */}
              <div>
                <Label htmlFor="rollId">{t("quality.related_roll")}</Label>
                <Select 
                  value={formData.rollId} 
                  onValueChange={(value) => setFormData({...formData, rollId: value})}
                  disabled={formData.jobOrderId === "none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.jobOrderId !== "none" ? 
                      t("quality.select_roll") : t("quality.select_job_order_first") || "Select job order first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {(filteredRolls.length > 0 ? filteredRolls : []).map((roll: any) => (
                      <SelectItem key={roll.id} value={roll.id}>
                        {roll.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* User Selection - Auto-selected for current user */}
              <div>
                <Label htmlFor="performedBy">{t("quality.performed_by")} *</Label>
                <Select 
                  value={formData.performedBy} 
                  onValueChange={(value) => setFormData({...formData, performedBy: value})}
                  disabled={true}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quality.select_user")} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((userItem: any) => (
                      <SelectItem key={userItem.id} value={userItem.id}>
                        {userItem.firstName} {userItem.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Check Date */}
              <div>
                <Label htmlFor="checkDate">{t("quality.check_date")} *</Label>
                <Input
                  type="date"
                  id="checkDate"
                  value={formData.checkDate}
                  onChange={(e) => setFormData({...formData, checkDate: e.target.value})}
                />
              </div>
              
              {/* Passed/Failed Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="passed"
                  checked={formData.passed}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, passed: checked === true})
                  }
                />
                <Label htmlFor="passed">{t("quality.passed")}</Label>
              </div>
              
              {/* Notes */}
              <div>
                <Label htmlFor="notes">{t("quality.notes")}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder={t("quality.notes_placeholder")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!formData.checkTypeId || !formData.performedBy}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Quality Check Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("quality.delete_quality_check")}</DialogTitle>
            <DialogDescription>
              {t("quality.delete_check_confirmation", {
                id: currentCheck?.id
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}