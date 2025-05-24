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
  AlertCircle, 
  Edit, 
  Trash2, 
  Plus, 
  Filter,
  Search,
  Printer,
  DollarSign
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export function QualityPenaltiesManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState<any>(null);
  const [formData, setFormData] = useState({
    violationId: "",
    penaltyType: "Financial",
    penaltyAmount: "",
    assignedTo: "",
    assignedDate: new Date().toISOString().split('T')[0],
    status: "Pending",
    description: ""
  });

  // Fetch penalties
  const { data: penalties = [], isLoading: penaltiesLoading, refetch: refetchPenalties } = useQuery({
    queryKey: ["/api/quality-penalties"],
    queryFn: async () => {
      const response = await fetch("/api/quality-penalties");
      if (!response.ok) {
        throw new Error("Failed to fetch quality penalties");
      }
      return response.json();
    }
  });

  // Fetch violations for reference
  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        throw new Error("Failed to fetch quality violations");
      }
      return response.json();
    }
  });

  // Fetch users for user selection
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      // If response is a single user object, wrap it in an array
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/quality-penalties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create quality penalty");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.penalty_created_success"),
      });
      setShowAddDialog(false);
      resetForm();
      refetchPenalties();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-penalties"] });
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
      const response = await fetch(`/api/quality-penalties/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update quality penalty");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.penalty_updated_success"),
      });
      setShowEditDialog(false);
      resetForm();
      refetchPenalties();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-penalties"] });
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
      const response = await fetch(`/api/quality-penalties/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete quality penalty");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.penalty_deleted_success"),
      });
      setShowDeleteDialog(false);
      refetchPenalties();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-penalties"] });
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
      violationId: "",
      penaltyType: "Financial",
      penaltyAmount: "",
      assignedTo: "",
      assignedDate: new Date().toISOString().split('T')[0],
      status: "Pending",
      description: ""
    });
    setCurrentPenalty(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert penaltyAmount to number if it's a financial penalty
    const processedData = {
      ...formData,
      penaltyAmount: formData.penaltyType === "Financial" ? parseFloat(formData.penaltyAmount as string) : null
    };
    createMutation.mutate(processedData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPenalty) {
      // Convert penaltyAmount to number if it's a financial penalty
      const processedData = {
        ...formData,
        penaltyAmount: formData.penaltyType === "Financial" ? parseFloat(formData.penaltyAmount as string) : null
      };
      updateMutation.mutate({ id: currentPenalty.id, data: processedData });
    }
  };

  const handleDeleteConfirm = () => {
    if (currentPenalty) {
      deleteMutation.mutate(currentPenalty.id);
    }
  };

  const handleEditClick = (penalty: any) => {
    setCurrentPenalty(penalty);
    setFormData({
      violationId: penalty.violationId ? String(penalty.violationId) : "",
      penaltyType: penalty.penaltyType || "Financial",
      penaltyAmount: penalty.penaltyAmount !== null ? String(penalty.penaltyAmount) : "",
      assignedTo: penalty.assignedTo || "",
      assignedDate: penalty.assignedDate ? new Date(penalty.assignedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: penalty.status || "Pending",
      description: penalty.description || ""
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (penalty: any) => {
    setCurrentPenalty(penalty);
    setShowDeleteDialog(true);
  };

  const handlePrintClick = (penalty: any) => {
    setCurrentPenalty(penalty);
    setShowPrintDialog(true);
  };

  const handlePrint = () => {
    if (!currentPenalty) return;
    
    // Create a printable version in a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: t("common.error"),
        description: t("common.popup_blocked"),
        variant: "destructive",
      });
      return;
    }
    
    const assignedUser = Array.isArray(users) 
      ? users.find((u: any) => u.id === currentPenalty.assignedTo)
      : null;
    const assignedUserName = assignedUser 
      ? `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`
      : currentPenalty.assignedTo || t("common.unknown");
    
    const violation = Array.isArray(violations) 
      ? violations.find((v: any) => v.id === currentPenalty.violationId)
      : null;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t("quality.penalty_document")} #${currentPenalty.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          h1 {
            margin: 0;
            color: #333;
          }
          .document-id {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #555;
          }
          .field {
            margin-bottom: 10px;
          }
          .label {
            font-weight: bold;
            min-width: 150px;
            display: inline-block;
          }
          .value {
            display: inline-block;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
          }
          .signature-area {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          .signature-box {
            border-top: 1px solid #000;
            width: 200px;
            padding-top: 5px;
            text-align: center;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t("quality.quality_penalty_notice")}</h1>
          <div class="document-id">${t("quality.document_id")}: PEN-${currentPenalty.id}</div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("quality.penalty_information")}</div>
          <div class="field">
            <span class="label">${t("quality.penalty_type")}:</span>
            <span class="value">${currentPenalty.penaltyType}</span>
          </div>
          <div class="field">
            <span class="label">${t("common.status")}:</span>
            <span class="value">${currentPenalty.status}</span>
          </div>
          <div class="field">
            <span class="label">${t("quality.issue_date")}:</span>
            <span class="value">${currentPenalty.assignedDate ? format(new Date(currentPenalty.assignedDate), 'MMMM d, yyyy') : t("common.not_available")}</span>
          </div>
        </div>
        
        ${currentPenalty.penaltyType === 'Financial' ? `
          <div class="amount">
            ${t("quality.amount")}: $${parseFloat(currentPenalty.penaltyAmount).toFixed(2)}
          </div>
        ` : ''}
        
        <div class="section">
          <div class="section-title">${t("quality.assigned_to")}</div>
          <div class="field">
            <span class="label">${t("common.name")}:</span>
            <span class="value">${assignedUserName}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("quality.violation_information")}</div>
          <div class="field">
            <span class="label">${t("quality.violation_id")}:</span>
            <span class="value">#${currentPenalty.violationId || t("common.not_available")}</span>
          </div>
          ${violation ? `
            <div class="field">
              <span class="label">${t("quality.violation_description")}:</span>
              <span class="value">${violation.description || t("common.not_available")}</span>
            </div>
            <div class="field">
              <span class="label">${t("quality.violation_severity")}:</span>
              <span class="value">${violation.severity || t("common.not_available")}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">${t("common.description")}</div>
          <p>${currentPenalty.description || t("common.not_available")}</p>
        </div>
        
        <div class="signature-area">
          <div class="signature-box">
            ${t("quality.manager_signature")}
          </div>
          <div class="signature-box">
            ${t("quality.employee_signature")}
          </div>
        </div>
        
        <div class="footer">
          <p>${t("quality.document_footer")}</p>
        </div>
        
        <script>
          // Auto print
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setShowPrintDialog(false);
  };

  // Filter and search functionality
  const filteredPenalties = penalties.filter((penalty: any) => {
    const matchesSearch = searchQuery === "" || 
      (penalty.description && penalty.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === "all" || penalty.status === filterStatus;
    const matchesType = filterType === "all" || penalty.penaltyType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getUserById = (id: string) => {
    if (!Array.isArray(users)) {
      return id || t("common.unknown");
    }
    const user = users.find((user: any) => user.id === id);
    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`;
    }
    return id || t("common.unknown");
  };

  const getViolationById = (id: number) => {
    if (!Array.isArray(violations)) return null;
    return violations.find((violation: any) => violation.id === id);
  };

  const getPenaltyTypeBadge = (type: string) => {
    switch (type) {
      case "Financial":
        return <Badge className="bg-yellow-500">{type}</Badge>;
      case "Warning":
        return <Badge variant="warning">{type}</Badge>;
      case "Training":
        return <Badge variant="outline" className="text-blue-500 border-blue-500">{type}</Badge>;
      case "Suspension":
        return <Badge variant="destructive">{type}</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="warning">{status}</Badge>;
      case "Active":
        return <Badge variant="destructive">{status}</Badge>;
      case "Completed":
        return <Badge variant="success" className="bg-green-500">{status}</Badge>;
      case "Dismissed":
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const isLoading = penaltiesLoading || violationsLoading || usersLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm h-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <Select 
              value={filterStatus} 
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[110px] sm:w-[140px] text-xs sm:text-sm h-9">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="Pending">{t("quality.status_pending")}</SelectItem>
                <SelectItem value="Active">{t("quality.status_active")}</SelectItem>
                <SelectItem value="Completed">{t("quality.status_completed")}</SelectItem>
                <SelectItem value="Dismissed">{t("quality.status_dismissed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
            <Select 
              value={filterType} 
              onValueChange={setFilterType}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("quality.penalty_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="Financial">{t("quality.type_financial")}</SelectItem>
                <SelectItem value="Warning">{t("quality.type_warning")}</SelectItem>
                <SelectItem value="Training">{t("quality.type_training")}</SelectItem>
                <SelectItem value="Suspension">{t("quality.type_suspension")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> {t("quality.add_penalty")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t("quality.add_penalty")}</DialogTitle>
                <DialogDescription>{t("quality.add_penalty_description")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="violationId">{t("quality.violation")} *</Label>
                    <Select 
                      value={formData.violationId} 
                      onValueChange={(value) => setFormData({...formData, violationId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("quality.select_violation")} />
                      </SelectTrigger>
                      <SelectContent>
                        {violations.map((violation: any) => (
                          <SelectItem key={violation.id} value={String(violation.id)}>
                            #{violation.id} - {violation.description?.substring(0, 35)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="penaltyType">{t("quality.penalty_type")} *</Label>
                      <Select 
                        value={formData.penaltyType} 
                        onValueChange={(value) => setFormData({...formData, penaltyType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_type")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Financial">{t("quality.type_financial")}</SelectItem>
                          <SelectItem value="Warning">{t("quality.type_warning")}</SelectItem>
                          <SelectItem value="Training">{t("quality.type_training")}</SelectItem>
                          <SelectItem value="Suspension">{t("quality.type_suspension")}</SelectItem>
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
                          <SelectValue placeholder={t("quality.select_status")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">{t("quality.status_pending")}</SelectItem>
                          <SelectItem value="Active">{t("quality.status_active")}</SelectItem>
                          <SelectItem value="Completed">{t("quality.status_completed")}</SelectItem>
                          <SelectItem value="Dismissed">{t("quality.status_dismissed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {formData.penaltyType === "Financial" && (
                    <div>
                      <Label htmlFor="penaltyAmount">{t("quality.penalty_amount")} *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2">$</span>
                        <Input 
                          id="penaltyAmount" 
                          type="number" 
                          value={formData.penaltyAmount}
                          onChange={(e) => setFormData({...formData, penaltyAmount: e.target.value})}
                          className="pl-8"
                          min="0"
                          step="0.01"
                          required={formData.penaltyType === "Financial"}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="assignedTo">{t("quality.assigned_to")} *</Label>
                    <Select 
                      value={formData.assignedTo} 
                      onValueChange={(value) => setFormData({...formData, assignedTo: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("quality.select_user")} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(users) ? users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="assignedDate">{t("quality.assigned_date")} *</Label>
                    <Input 
                      id="assignedDate" 
                      type="date" 
                      value={formData.assignedDate}
                      onChange={(e) => setFormData({...formData, assignedDate: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">{t("common.description")} *</Label>
                    <Textarea 
                      id="description" 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || !formData.violationId || !formData.assignedTo || (formData.penaltyType === "Financial" && !formData.penaltyAmount) || !formData.description}>
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
      ) : filteredPenalties.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground">{t("quality.no_penalties_found")}</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-230px)] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>{t("common.id")}</TableHead>
                <TableHead>{t("quality.penalty_type")}</TableHead>
                <TableHead>{t("quality.violation")}</TableHead>
                <TableHead>{t("quality.assigned_to")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("quality.details")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPenalties.map((penalty: any) => {
                return (
                  <TableRow key={penalty.id}>
                    <TableCell>#{penalty.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getPenaltyTypeBadge(penalty.penaltyType)}
                        {penalty.penaltyType === "Financial" && penalty.penaltyAmount && (
                          <span className="text-xs text-muted-foreground">
                            ${parseFloat(penalty.penaltyAmount).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {penalty.violationId ? (
                        <span>#{penalty.violationId}</span>
                      ) : (
                        <span className="text-muted-foreground">{t("common.not_available")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getUserById(penalty.assignedTo)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(penalty.status)}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={penalty.description}>
                        {penalty.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handlePrintClick(penalty)}
                          title={t("quality.print_penalty")}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleEditClick(penalty)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDeleteClick(penalty)}
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
      )}
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("quality.edit_penalty")}</DialogTitle>
            <DialogDescription>{t("quality.edit_penalty_description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="violationId">{t("quality.violation")} *</Label>
                <Select 
                  value={formData.violationId} 
                  onValueChange={(value) => setFormData({...formData, violationId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quality.select_violation")} />
                  </SelectTrigger>
                  <SelectContent>
                    {violations.map((violation: any) => (
                      <SelectItem key={violation.id} value={String(violation.id)}>
                        #{violation.id} - {violation.description?.substring(0, 35)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="penaltyType">{t("quality.penalty_type")} *</Label>
                  <Select 
                    value={formData.penaltyType} 
                    onValueChange={(value) => setFormData({...formData, penaltyType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("quality.select_type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financial">{t("quality.type_financial")}</SelectItem>
                      <SelectItem value="Warning">{t("quality.type_warning")}</SelectItem>
                      <SelectItem value="Training">{t("quality.type_training")}</SelectItem>
                      <SelectItem value="Suspension">{t("quality.type_suspension")}</SelectItem>
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
                      <SelectValue placeholder={t("quality.select_status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">{t("quality.status_pending")}</SelectItem>
                      <SelectItem value="Active">{t("quality.status_active")}</SelectItem>
                      <SelectItem value="Completed">{t("quality.status_completed")}</SelectItem>
                      <SelectItem value="Dismissed">{t("quality.status_dismissed")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {formData.penaltyType === "Financial" && (
                <div>
                  <Label htmlFor="penaltyAmount">{t("quality.penalty_amount")} *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2">$</span>
                    <Input 
                      id="penaltyAmount" 
                      type="number" 
                      value={formData.penaltyAmount}
                      onChange={(e) => setFormData({...formData, penaltyAmount: e.target.value})}
                      className="pl-8"
                      min="0"
                      step="0.01"
                      required={formData.penaltyType === "Financial"}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="assignedTo">{t("quality.assigned_to")} *</Label>
                <Select 
                  value={formData.assignedTo} 
                  onValueChange={(value) => setFormData({...formData, assignedTo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quality.select_user")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(users) ? users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="assignedDate">{t("quality.assigned_date")} *</Label>
                <Input 
                  id="assignedDate" 
                  type="date" 
                  value={formData.assignedDate}
                  onChange={(e) => setFormData({...formData, assignedDate: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">{t("common.description")} *</Label>
                <Textarea 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !formData.violationId || !formData.assignedTo || (formData.penaltyType === "Financial" && !formData.penaltyAmount) || !formData.description}>
                {updateMutation.isPending ? t("common.updating") : t("common.update")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("common.delete_confirmation")}</DialogTitle>
            <DialogDescription>
              {t("quality.delete_penalty_confirmation", { id: currentPenalty?.id })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-destructive flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {t("quality.delete_penalty_warning")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Print Preview Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("quality.print_penalty")}</DialogTitle>
            <DialogDescription>{t("quality.print_penalty_description")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>{t("quality.print_confirmation")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              {t("common.print")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}