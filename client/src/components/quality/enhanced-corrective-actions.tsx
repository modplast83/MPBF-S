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
  Filter,
  Search,
  CheckCheck,
  Printer
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export function QualityCorrectiveActions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVerified, setFilterVerified] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<any>(null);
  const [formData, setFormData] = useState({
    qualityCheckId: "",
    action: "",
    implementedBy: "",
    implementationDate: new Date().toISOString().split('T')[0],
    verifiedBy: "",
    verifiedDate: "",
    verificationNotes: ""
  });

  // Fetch corrective actions
  const { data: actions = [], isLoading: actionsLoading, refetch: refetchActions } = useQuery({
    queryKey: ["/api/corrective-actions"],
    queryFn: async () => {
      const response = await fetch("/api/corrective-actions");
      if (!response.ok) {
        throw new Error("Failed to fetch corrective actions");
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

  // Fetch users for user selection
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/corrective-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create corrective action");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.action_created_success"),
      });
      setShowAddDialog(false);
      resetForm();
      refetchActions();
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
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
      const response = await fetch(`/api/corrective-actions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update corrective action");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.action_updated_success"),
      });
      setShowEditDialog(false);
      resetForm();
      refetchActions();
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
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
      const response = await fetch(`/api/corrective-actions/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete corrective action");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("quality.action_deleted_success"),
      });
      setShowDeleteDialog(false);
      refetchActions();
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
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
      qualityCheckId: "",
      action: "",
      implementedBy: "",
      implementationDate: new Date().toISOString().split('T')[0],
      verifiedBy: "",
      verifiedDate: "",
      verificationNotes: ""
    });
    setCurrentAction(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAction) {
      updateMutation.mutate({ id: currentAction.id, data: formData });
    }
  };

  const handleDeleteConfirm = () => {
    if (currentAction) {
      deleteMutation.mutate(currentAction.id);
    }
  };

  const handleEditClick = (action: any) => {
    setCurrentAction(action);
    setFormData({
      qualityCheckId: action.qualityCheckId ? String(action.qualityCheckId) : "",
      action: action.action || "",
      implementedBy: action.implementedBy || "",
      implementationDate: action.implementationDate ? new Date(action.implementationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      verifiedBy: action.verifiedBy || "",
      verifiedDate: action.verifiedDate ? new Date(action.verifiedDate).toISOString().split('T')[0] : "",
      verificationNotes: action.verificationNotes || ""
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (action: any) => {
    setCurrentAction(action);
    setShowDeleteDialog(true);
  };

  const handlePrintAction = (action: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const relatedCheck = getCheckById(action.qualityCheckId);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Corrective Action #${action.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .company-info { margin-bottom: 20px; }
            .action-details { margin-bottom: 30px; }
            .detail-row { display: flex; margin-bottom: 10px; }
            .detail-label { font-weight: bold; width: 150px; }
            .detail-value { flex: 1; }
            .section-header { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .status-verified { color: #16a34a; font-weight: bold; }
            .status-pending { color: #ea580c; font-weight: bold; }
            .print-date { text-align: right; margin-top: 30px; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
            .verification-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px; }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Corrective Action Report</h1>
            <div class="company-info">
              <h3>Quality Management System</h3>
              <p>Action ID: #${action.id}</p>
            </div>
          </div>
          
          <div class="section-header">Action Information</div>
          <div class="action-details">
            <div class="detail-row">
              <div class="detail-label">Action ID:</div>
              <div class="detail-value">#${action.id}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Related Quality Check:</div>
              <div class="detail-value">${action.qualityCheckId ? `#${action.qualityCheckId}` : 'Not Specified'}</div>
            </div>
            ${relatedCheck ? `
            <div class="detail-row">
              <div class="detail-label">Check Date:</div>
              <div class="detail-value">${format(new Date(relatedCheck.timestamp), 'MMM d, yyyy HH:mm')}</div>
            </div>
            ` : ''}
            <div class="detail-row">
              <div class="detail-label">Action Description:</div>
              <div class="detail-value">${action.action || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Implemented By:</div>
              <div class="detail-value">${getUserById(action.implementedBy) || 'Not assigned'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Implementation Date:</div>
              <div class="detail-value">${action.implementationDate ? format(new Date(action.implementationDate), 'MMM d, yyyy') : 'Not set'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Status:</div>
              <div class="detail-value">
                <span class="${action.verifiedDate ? 'status-verified' : 'status-pending'}">
                  ${action.verifiedDate ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>

          ${action.verifiedDate ? `
          <div class="section-header">Verification Information</div>
          <div class="verification-info">
            <div class="detail-row">
              <div class="detail-label">Verified By:</div>
              <div class="detail-value">${getUserById(action.verifiedBy) || 'Not specified'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Verification Date:</div>
              <div class="detail-value">${format(new Date(action.verifiedDate), 'MMM d, yyyy')}</div>
            </div>
            ${action.verificationNotes ? `
            <div class="detail-row">
              <div class="detail-label">Verification Notes:</div>
              <div class="detail-value">${action.verificationNotes}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="print-date">
            Report printed on ${new Date().toLocaleString()} by ${getUserById(action.implementedBy)}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Filter and search functionality
  const filteredActions = actions.filter((action: any) => {
    const matchesSearch = searchQuery === "" || 
      (action.action && action.action.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesVerified = filterVerified === "all" || 
      (filterVerified === "verified" && action.verifiedDate) || 
      (filterVerified === "pending" && !action.verifiedDate);
    
    return matchesSearch && matchesVerified;
  });

  const getUserById = (id: string) => {
    if (!Array.isArray(users)) {
      return id || "Unknown";
    }
    const user = users.find((user: any) => user.id === id);
    if (user) {
      // Prioritize firstName, fallback to username if no firstName
      return user.firstName || user.username || `User ${user.id}`;
    }
    return id || "Unknown";
  };

  const getCheckById = (id: number) => {
    if (!Array.isArray(checks)) {
      return null;
    }
    return checks.find((check: any) => check.id === id);
  };

  const isLoading = actionsLoading || checksLoading || usersLoading;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Corrective Actions Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .report-info { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .status-verified { color: #16a34a; font-weight: bold; }
            .status-pending { color: #ea580c; font-weight: bold; }
            .print-date { text-align: right; margin-top: 20px; font-size: 12px; }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Corrective Actions Report</h1>
            <div class="company-info">
              <h3>Quality Management System</h3>
            </div>
          </div>
          
          <div class="report-info">
            <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Actions:</strong> ${filteredActions.length}</p>
            <p><strong>Verified Actions:</strong> ${filteredActions.filter((a: any) => a.verifiedDate).length}</p>
            <p><strong>Pending Actions:</strong> ${filteredActions.filter((a: any) => !a.verifiedDate).length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Quality Check</th>
                <th>Action Description</th>
                <th>Implemented By</th>
                <th>Implementation Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredActions.map((action: any) => `
                <tr>
                  <td>#${action.id}</td>
                  <td>${action.qualityCheckId ? `#${action.qualityCheckId}` : 'N/A'}</td>
                  <td>${action.action || 'N/A'}</td>
                  <td>${getUserById(action.implementedBy)}</td>
                  <td>${action.implementationDate ? format(new Date(action.implementationDate), 'MMM d, yyyy') : 'N/A'}</td>
                  <td class="${action.verifiedDate ? 'status-verified' : 'status-pending'}">
                    ${action.verifiedDate ? 'Verified' : 'Pending Verification'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="print-date">
            Report printed on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search corrective actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-1 sm:mr-2 text-muted-foreground" />
            <Select 
              value={filterVerified} 
              onValueChange={setFilterVerified}
            >
              <SelectTrigger className="w-[120px] sm:w-[140px] text-xs sm:text-sm h-9">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handlePrint}
          >
            <Printer className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="text-xs sm:text-sm">Print Report</span>
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="h-9" onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}>
                <Plus className="mr-1 sm:mr-2 h-4 w-4" /> 
                <span className="text-xs sm:text-sm">Add Action</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
              <DialogHeader className="mb-2">
                <DialogTitle className="text-lg">Add Corrective Action</DialogTitle>
                <DialogDescription>Create a new corrective action for a quality check</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="qualityCheckId">Related Quality Check *</Label>
                    <Select 
                      value={formData.qualityCheckId} 
                      onValueChange={(value) => setFormData({...formData, qualityCheckId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a quality check" />
                      </SelectTrigger>
                      <SelectContent>
                        {checks.map((check: any) => (
                          <SelectItem key={check.id} value={String(check.id)}>
                            Check #{check.id} - {new Date(check.timestamp).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="action">Action Description *</Label>
                    <Textarea 
                      id="action" 
                      value={formData.action}
                      onChange={(e) => setFormData({...formData, action: e.target.value})}
                      placeholder="Describe the corrective action to be taken..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="implementedBy">Implemented By *</Label>
                    <Select 
                      value={formData.implementedBy} 
                      onValueChange={(value) => setFormData({...formData, implementedBy: value})}
                    >
                      <SelectTrigger className="text-xs sm:text-sm h-9">
                        <SelectValue placeholder="Select responsible person" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(users) && users.length > 0 ? users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName || user.username || `User ${user.id}`}
                          </SelectItem>
                        )) : (
                          <SelectItem value="no-users" disabled>No users available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="implementationDate">Implementation Date *</Label>
                    <Input 
                      id="implementationDate" 
                      type="date" 
                      value={formData.implementationDate}
                      onChange={(e) => setFormData({...formData, implementationDate: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="isVerified" 
                        className="mr-2" 
                        checked={!!formData.verifiedDate}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData, 
                              verifiedDate: new Date().toISOString().split('T')[0]
                            });
                          } else {
                            setFormData({
                              ...formData, 
                              verifiedDate: "",
                              verifiedBy: "",
                              verificationNotes: ""
                            });
                          }
                        }} 
                      />
                      <Label htmlFor="isVerified">Quality Verified</Label>
                    </div>
                    
                    {formData.verifiedDate && (
                      <>
                        <div>
                          <Label htmlFor="verifiedBy">{t("quality.verified_by")} *</Label>
                          <Select 
                            value={formData.verifiedBy} 
                            onValueChange={(value) => setFormData({...formData, verifiedBy: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.select_user")} />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(users) ? users.map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName || user.username || `User ${user.id}`}
                                </SelectItem>
                              )) : null}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="verifiedDate">Verification Date *</Label>
                          <Input 
                            id="verifiedDate" 
                            type="date" 
                            value={formData.verifiedDate}
                            onChange={(e) => setFormData({...formData, verifiedDate: e.target.value})}
                            required={!!formData.verifiedDate}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="verificationNotes">Notes</Label>
                          <Textarea 
                            id="verificationNotes" 
                            value={formData.verificationNotes}
                            onChange={(e) => setFormData({...formData, verificationNotes: e.target.value})}
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || !formData.qualityCheckId || !formData.action || !formData.implementedBy || !formData.implementationDate || (!!formData.verifiedDate && !formData.verifiedBy)}>
                    {createMutation.isPending ? "Saving..." : "Save"}
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
      ) : filteredActions.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground">No Corrective Actions Found</p>
          <p className="text-sm text-muted-foreground mt-2">Add a new corrective action to get started</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-230px)] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Quality Check</TableHead>
                <TableHead>Action Description</TableHead>
                <TableHead>Implementation Details</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActions.map((action: any) => {
                const relatedCheck = getCheckById(action.qualityCheckId);
                return (
                  <TableRow key={action.id}>
                    <TableCell>#{action.id}</TableCell>
                    <TableCell>
                      {action.qualityCheckId ? (
                        <span>#{action.qualityCheckId}</span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={action.action}>
                        {action.action}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="font-medium">
                          {getUserById(action.implementedBy) || "Not Assigned"}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {action.implementationDate 
                            ? format(new Date(action.implementationDate), 'MMM d, yyyy') 
                            : "No Date Set"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {action.verifiedDate ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          Pending Verification
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handlePrintAction(action)}
                          title="Print Action"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleEditClick(action)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDeleteClick(action)}
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
            <DialogTitle>Edit Corrective Action</DialogTitle>
            <DialogDescription>Update the corrective action details and verification status</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="qualityCheckId">Related Quality Check *</Label>
                <Select 
                  value={formData.qualityCheckId} 
                  onValueChange={(value) => setFormData({...formData, qualityCheckId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a quality check" />
                  </SelectTrigger>
                  <SelectContent>
                    {checks.map((check: any) => (
                      <SelectItem key={check.id} value={String(check.id)}>
                        Check #{check.id} - {new Date(check.timestamp).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="action">Action Description *</Label>
                <Textarea 
                  id="action" 
                  value={formData.action}
                  onChange={(e) => setFormData({...formData, action: e.target.value})}
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="implementedBy">Implemented By *</Label>
                <Select 
                  value={formData.implementedBy} 
                  onValueChange={(value) => setFormData({...formData, implementedBy: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(users) ? users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName || user.username || `User ${user.id}`}
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="implementationDate">Implementation Date *</Label>
                <Input 
                  id="implementationDate" 
                  type="date" 
                  value={formData.implementationDate}
                  onChange={(e) => setFormData({...formData, implementationDate: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="isVerified" 
                    className="mr-2" 
                    checked={!!formData.verifiedDate}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData, 
                          verifiedDate: new Date().toISOString().split('T')[0]
                        });
                      } else {
                        setFormData({
                          ...formData, 
                          verifiedDate: "",
                          verifiedBy: "",
                          verificationNotes: ""
                        });
                      }
                    }} 
                  />
                  <Label htmlFor="isVerified">Quality Verified</Label>
                </div>
                
                {formData.verifiedDate && (
                  <>
                    <div>
                      <Label htmlFor="verifiedBy">Verified By *</Label>
                      <Select 
                        value={formData.verifiedBy} 
                        onValueChange={(value) => setFormData({...formData, verifiedBy: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(users) ? users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName || user.username || `User ${user.id}`}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="verifiedDate">Verification Date *</Label>
                      <Input 
                        id="verifiedDate" 
                        type="date" 
                        value={formData.verifiedDate}
                        onChange={(e) => setFormData({...formData, verifiedDate: e.target.value})}
                        required={!!formData.verifiedDate}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="verificationNotes">Verification Notes</Label>
                      <Textarea 
                        id="verificationNotes" 
                        value={formData.verificationNotes}
                        onChange={(e) => setFormData({...formData, verificationNotes: e.target.value})}
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !formData.qualityCheckId || !formData.action || !formData.implementedBy || !formData.implementationDate || (formData.verifiedDate !== "" && !formData.verifiedBy)}>
                {updateMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete corrective action #{currentAction?.id}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-destructive flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              This action cannot be undone. The corrective action will be permanently removed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}