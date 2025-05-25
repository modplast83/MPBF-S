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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertCircle, 
  Edit, 
  Trash2, 
  Plus, 
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  CheckCircle2
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

// Custom badge variants for success/warning states
const badgeVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground",
  success: "bg-green-500 text-white hover:bg-green-600",
  warning: "bg-yellow-500 text-white hover:bg-yellow-600"
};

export function QualityChecksManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResult, setFilterResult] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<any>(null);
  const [formData, setFormData] = useState({
    checkTypeId: "",
    rollId: "",
    jobOrderId: "",
    performedBy: "",
    checkDate: new Date().toISOString().split('T')[0],
    passed: true,
    notes: ""
  });

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

  // Fetch users - first get just the current user, then wrap in array
  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    }
  });
  
  // Create a users array from the userData to prevent the map error
  const users = userData ? (Array.isArray(userData) ? userData : [userData]) : [];

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
      rollId: "",
      jobOrderId: "",
      performedBy: "",
      checkDate: new Date().toISOString().split('T')[0],
      passed: true,
      notes: ""
    });
    setCurrentCheck(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert passed boolean to status string for the database
    const dataToSubmit = {
      ...formData,
      status: formData.passed ? 'passed' : 'failed'
    };
    createMutation.mutate(dataToSubmit);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCheck) {
      // Convert passed boolean to status string for the database
      const dataToSubmit = {
        ...formData,
        status: formData.passed ? 'passed' : 'failed'
      };
      updateMutation.mutate({ id: currentCheck.id, data: dataToSubmit });
    }
  };

  const handleDeleteConfirm = () => {
    if (currentCheck) {
      deleteMutation.mutate(currentCheck.id);
    }
  };

  const handleEditClick = (check: any) => {
    setCurrentCheck(check);
    setFormData({
      checkTypeId: check.checkTypeId ? String(check.checkTypeId) : "",
      rollId: check.rollId || "",
      jobOrderId: check.jobOrderId ? String(check.jobOrderId) : "",
      performedBy: check.performedBy || "",
      checkDate: check.checkDate ? new Date(check.checkDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      passed: check.passed || false,
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
      (filterResult === "passed" && check.passed) || 
      (filterResult === "failed" && !check.passed);
    
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

  const getRollById = (id: string) => {
    const roll = rolls.find((roll: any) => roll.id === id);
    if (roll) {
      return roll;
    }
    return null;
  };

  const getJobOrderById = (id: number) => {
    const jo = jobOrders.find((jo: any) => jo.id === id);
    if (jo) {
      return jo;
    }
    return null;
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
                  
                  <div>
                    <Label htmlFor="rollId">{t("quality.related_roll")}</Label>
                    <Select 
                      value={formData.rollId} 
                      onValueChange={(value) => setFormData({...formData, rollId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("quality.select_roll")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("common.none")}</SelectItem>
                        {rolls.map((roll: any) => (
                          <SelectItem key={roll.id} value={roll.id}>
                            {roll.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="jobOrderId">{t("quality.related_job_order")}</Label>
                    <Select 
                      value={formData.jobOrderId} 
                      onValueChange={(value) => setFormData({...formData, jobOrderId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("quality.select_job_order")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("common.none")}</SelectItem>
                        {jobOrders.map((jo: any) => (
                          <SelectItem key={jo.id} value={jo.id.toString()}>
                            JO #{jo.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="performedBy">{t("quality.performed_by")} *</Label>
                    <Select 
                      value={formData.performedBy} 
                      onValueChange={(value) => setFormData({...formData, performedBy: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("quality.select_user")} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="checkDate">{t("quality.check_date")} *</Label>
                    <Input 
                      id="checkDate" 
                      type="date" 
                      value={formData.checkDate}
                      onChange={(e) => setFormData({...formData, checkDate: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 py-2">
                    <Checkbox 
                      id="passed" 
                      checked={formData.passed}
                      onCheckedChange={(checked) => 
                        setFormData({...formData, passed: checked === true})
                      }
                    />
                    <label
                      htmlFor="passed"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t("quality.passed_check")}
                    </label>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">{t("quality.check_notes")}</Label>
                    <Textarea 
                      id="notes" 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || !formData.checkTypeId || !formData.performedBy}>
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
      ) : filteredChecks.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-muted-foreground">{t("quality.no_checks_found")}</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-230px)] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>{t("common.id")}</TableHead>
                <TableHead>{t("quality.check_type")}</TableHead>
                <TableHead>{t("quality.result")}</TableHead>
                <TableHead>{t("quality.date")}</TableHead>
                <TableHead>{t("quality.performed_by")}</TableHead>
                <TableHead>{t("quality.related_items")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.map((check: any) => {
                return (
                  <TableRow key={check.id}>
                    <TableCell>#{check.id}</TableCell>
                    <TableCell>
                      {getCheckTypeName(check.checkTypeId)}
                    </TableCell>
                    <TableCell>
                      {check.passed ? (
                        <Badge className={badgeVariants.success}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t("quality.passed")}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          {t("quality.failed")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {check.checkDate ? format(new Date(check.checkDate), 'MMM d, yyyy') : ""}
                    </TableCell>
                    <TableCell>
                      {getUserById(check.performedBy)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {check.rollId && (
                          <div className="text-xs">
                            <span className="font-medium">{t("quality.roll")}:</span> {check.rollId}
                          </div>
                        )}
                        {check.jobOrderId && (
                          <div className="text-xs">
                            <span className="font-medium">JO:</span> #{check.jobOrderId}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleViewClick(check)}
                          title={t("quality.view_check")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleEditClick(check)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDeleteClick(check)}
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
      
      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {t("quality.check_details")} #{currentCheck?.id}
            </DialogTitle>
          </DialogHeader>
          {currentCheck && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    {t("quality.check_type")}
                  </h3>
                  <p>{getCheckTypeName(currentCheck.checkTypeId)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    {t("quality.result")}
                  </h3>
                  <div>
                    {currentCheck.passed ? (
                      <Badge className={badgeVariants.success}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t("quality.passed")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        {t("quality.failed")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    {t("quality.check_date")}
                  </h3>
                  <p>{currentCheck.checkDate ? format(new Date(currentCheck.checkDate), 'MMMM d, yyyy') : ""}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    {t("quality.performed_by")}
                  </h3>
                  <p>{getUserById(currentCheck.performedBy)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    {t("quality.roll")}
                  </h3>
                  <p>{currentCheck.rollId || t("common.not_available")}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    {t("quality.job_order")}
                  </h3>
                  <p>{currentCheck.jobOrderId ? `#${currentCheck.jobOrderId}` : t("common.not_available")}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                  {t("quality.check_notes")}
                </h3>
                <p className="whitespace-pre-line">{currentCheck.notes || t("common.not_available")}</p>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setShowViewDialog(false)}>
                  {t("common.close")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("quality.edit_quality_check")}</DialogTitle>
            <DialogDescription>{t("quality.edit_quality_check_description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="space-y-4 py-4">
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
              
              <div>
                <Label htmlFor="rollId">{t("quality.related_roll")}</Label>
                <Select 
                  value={formData.rollId} 
                  onValueChange={(value) => setFormData({...formData, rollId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quality.select_roll")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {rolls.map((roll: any) => (
                      <SelectItem key={roll.id} value={roll.id}>
                        {roll.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="jobOrderId">{t("quality.related_job_order")}</Label>
                <Select 
                  value={formData.jobOrderId} 
                  onValueChange={(value) => setFormData({...formData, jobOrderId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quality.select_job_order")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {jobOrders.map((jo: any) => (
                      <SelectItem key={jo.id} value={jo.id.toString()}>
                        JO #{jo.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="performedBy">{t("quality.performed_by")} *</Label>
                <Select 
                  value={formData.performedBy} 
                  onValueChange={(value) => setFormData({...formData, performedBy: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("quality.select_user")} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="checkDate">{t("quality.check_date")} *</Label>
                <Input 
                  id="checkDate" 
                  type="date" 
                  value={formData.checkDate}
                  onChange={(e) => setFormData({...formData, checkDate: e.target.value})}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2 py-2">
                <Checkbox 
                  id="passed" 
                  checked={formData.passed}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, passed: checked === true})
                  }
                />
                <label
                  htmlFor="passed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("quality.passed_check")}
                </label>
              </div>
              
              <div>
                <Label htmlFor="notes">{t("quality.check_notes")}</Label>
                <Textarea 
                  id="notes" 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !formData.checkTypeId || !formData.performedBy}>
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
              {t("quality.delete_check_confirmation", { id: currentCheck?.id })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-destructive flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {t("quality.delete_check_warning")}
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