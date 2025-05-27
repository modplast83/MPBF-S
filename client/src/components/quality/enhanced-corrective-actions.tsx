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
  CheckCheck
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
      return id || t("common.unknown");
    }
    const user = users.find((user: any) => user.id === id);
    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`;
    }
    return id || t("common.unknown");
  };

  const getCheckById = (id: number) => {
    if (!Array.isArray(checks)) {
      return null;
    }
    return checks.find((check: any) => check.id === id);
  };

  const isLoading = actionsLoading || checksLoading || usersLoading;

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
                            Check #{check.id} - {new Date(check.checkedAt || check.checkDate).toLocaleDateString()}
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
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.username || `User ${user.id}`}
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
                      <Label htmlFor="isVerified">{t("quality.is_verified")}</Label>
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
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              )) : null}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="verifiedDate">{t("quality.verification_date")} *</Label>
                          <Input 
                            id="verifiedDate" 
                            type="date" 
                            value={formData.verifiedDate}
                            onChange={(e) => setFormData({...formData, verifiedDate: e.target.value})}
                            required={!!formData.verifiedDate}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="verificationNotes">{t("quality.verification_notes")}</Label>
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
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || !formData.qualityCheckId || !formData.action || !formData.implementedBy || !formData.implementationDate || (!!formData.verifiedDate && !formData.verifiedBy)}>
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
      ) : filteredActions.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground">{t("quality.no_actions_found")}</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-230px)] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>{t("common.id")}</TableHead>
                <TableHead>{t("quality.related_check")}</TableHead>
                <TableHead>{t("quality.action_description")}</TableHead>
                <TableHead>{t("quality.implementation_details")}</TableHead>
                <TableHead>{t("quality.verification_status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                        <span className="text-muted-foreground">{t("common.not_available")}</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={action.action}>
                        {action.action}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{getUserById(action.implementedBy)}</div>
                        <div className="text-muted-foreground text-xs">
                          {action.implementationDate 
                            ? format(new Date(action.implementationDate), 'MMM d, yyyy') 
                            : ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {action.verifiedDate ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" />
                          {t("quality.verified")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          {t("quality.pending_verification")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
            <DialogTitle>{t("quality.edit_corrective_action")}</DialogTitle>
            <DialogDescription>{t("quality.edit_corrective_action_description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="qualityCheckId">{t("quality.related_check")} *</Label>
                <Select 
                  value={formData.qualityCheckId} 
                  onValueChange={(value) => setFormData({...formData, qualityCheckId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quality.select_check")} />
                  </SelectTrigger>
                  <SelectContent>
                    {checks.map((check: any) => (
                      <SelectItem key={check.id} value={String(check.id)}>
                        {t("quality.check")} #{check.id} - {new Date(check.checkDate).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="action">{t("quality.action_description")} *</Label>
                <Textarea 
                  id="action" 
                  value={formData.action}
                  onChange={(e) => setFormData({...formData, action: e.target.value})}
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="implementedBy">{t("quality.implemented_by")} *</Label>
                <Select 
                  value={formData.implementedBy} 
                  onValueChange={(value) => setFormData({...formData, implementedBy: value})}
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
                <Label htmlFor="implementationDate">{t("quality.implementation_date")} *</Label>
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
                  <Label htmlFor="isVerified">{t("quality.is_verified")}</Label>
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
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="verifiedDate">{t("quality.verification_date")} *</Label>
                      <Input 
                        id="verifiedDate" 
                        type="date" 
                        value={formData.verifiedDate}
                        onChange={(e) => setFormData({...formData, verifiedDate: e.target.value})}
                        required={!!formData.verifiedDate}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="verificationNotes">{t("quality.verification_notes")}</Label>
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
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !formData.qualityCheckId || !formData.action || !formData.implementedBy || !formData.implementationDate || (formData.verifiedDate && !formData.verifiedBy)}>
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
              {t("quality.delete_action_confirmation", { id: currentAction?.id })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-destructive flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {t("quality.delete_action_warning")}
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
    </div>
  );
}