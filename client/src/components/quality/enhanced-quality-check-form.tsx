import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  Plus, 
  Filter,
  Search,
  Eye
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export function QualityCheckForm({ checkTypes = [], rolls = [], jobOrders = [] }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("view");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResult, setFilterResult] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<any>(null);
  const [formData, setFormData] = useState({
    checkTypeId: "",
    performedBy: "",
    checkDate: new Date().toISOString().split('T')[0],
    rollId: "",
    jobOrderId: null as number | null,
    passed: true,
    measurements: "",
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
      performedBy: "",
      checkDate: new Date().toISOString().split('T')[0],
      rollId: "",
      jobOrderId: null,
      passed: true,
      measurements: "",
      notes: ""
    });
    setCurrentCheck(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCheck) {
      updateMutation.mutate({ id: currentCheck.id, data: formData });
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
      checkTypeId: check.checkTypeId || "",
      performedBy: check.performedBy || "",
      checkDate: check.checkDate ? new Date(check.checkDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rollId: check.rollId || "",
      jobOrderId: check.jobOrderId || null,
      passed: check.passed === true || check.passed === "true",
      measurements: check.measurements || "",
      notes: check.notes || ""
    });
    setShowEditDialog(true);
  };

  const handleViewClick = (check: any) => {
    setCurrentCheck(check);
    setShowDetailDialog(true);
  };

  const handleDeleteClick = (check: any) => {
    setCurrentCheck(check);
    setShowDeleteDialog(true);
  };

  const handleRollChange = (rollId: string) => {
    const selectedRoll = rolls.find((roll: any) => roll.id === rollId);
    if (selectedRoll) {
      setFormData({
        ...formData,
        rollId,
        jobOrderId: selectedRoll.jobOrderId || null
      });
    } else {
      setFormData({
        ...formData,
        rollId,
        jobOrderId: null
      });
    }
  };

  // Filter and search functionality
  const filteredChecks = checks.filter((check: any) => {
    const matchesSearch = searchQuery === "" || 
      (check.notes && check.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (check.rollId && check.rollId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesResult = filterResult === "all" || 
      (filterResult === "passed" && check.passed) || 
      (filterResult === "failed" && !check.passed);
    
    return matchesSearch && matchesResult;
  });

  const getCheckTypeById = (id: string) => {
    return checkTypes.find((type: any) => type.id === id);
  };

  const getRollById = (id: string) => {
    return rolls.find((roll: any) => roll.id === id);
  };

  const getJobOrderById = (id: number) => {
    return jobOrders.find((jo: any) => jo.id === id);
  };

  const getUserById = (id: string) => {
    const user = users.find((user: any) => user.id === id);
    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`;
    }
    return id || t("common.unknown");
  };

  const isLoading = checksLoading || usersLoading;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:w-[400px]">
          <TabsTrigger value="view">{t("quality.view_checks")}</TabsTrigger>
          <TabsTrigger value="create">{t("quality.new_check")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="view" className="space-y-4">
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
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t("quality.result")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="passed">{t("quality.passed")}</SelectItem>
                    <SelectItem value="failed">{t("quality.failed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <ScrollArea className="h-[calc(100vh-350px)] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>{t("common.id")}</TableHead>
                    <TableHead>{t("quality.check_type")}</TableHead>
                    <TableHead>{t("quality.result")}</TableHead>
                    <TableHead>{t("quality.check_date")}</TableHead>
                    <TableHead>{t("quality.roll")}</TableHead>
                    <TableHead>{t("quality.job_order")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChecks.map((check: any) => {
                    const checkType = getCheckTypeById(check.checkTypeId);
                    return (
                      <TableRow key={check.id}>
                        <TableCell>#{check.id}</TableCell>
                        <TableCell>
                          {checkType ? checkType.name : check.checkTypeId}
                        </TableCell>
                        <TableCell>
                          {check.passed ? (
                            <Badge variant="success" className="bg-green-500">
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
                          {check.checkDate 
                            ? format(new Date(check.checkDate), 'MMM d, yyyy') 
                            : t("common.not_available")}
                        </TableCell>
                        <TableCell>
                          {check.rollId || t("common.not_available")}
                        </TableCell>
                        <TableCell>
                          {check.jobOrderId ? `#${check.jobOrderId}` : t("common.not_available")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleViewClick(check)}
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
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{t("quality.create_new_check")}</CardTitle>
              <CardDescription>{t("quality.create_new_check_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
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

                    <div>
                      <Label htmlFor="rollId">{t("quality.roll")} *</Label>
                      <Select 
                        value={formData.rollId} 
                        onValueChange={(value) => handleRollChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_roll")} />
                        </SelectTrigger>
                        <SelectContent>
                          {rolls.map((roll: any) => (
                            <SelectItem key={roll.id} value={roll.id}>
                              {roll.id} - {t(`quality.stage_${roll.stage.toLowerCase()}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="passed" 
                        checked={formData.passed}
                        onCheckedChange={(checked) => setFormData({...formData, passed: checked})}
                      />
                      <Label htmlFor="passed">{t("quality.passed_check")}</Label>
                    </div>

                    <div>
                      <Label htmlFor="measurements">{t("quality.measurements")}</Label>
                      <Input 
                        id="measurements" 
                        value={formData.measurements}
                        onChange={(e) => setFormData({...formData, measurements: e.target.value})}
                        placeholder={t("quality.measurements_placeholder")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">{t("quality.notes")}</Label>
                      <Textarea 
                        id="notes" 
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={4}
                        placeholder={t("quality.notes_placeholder")}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {t("common.reset")}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || !formData.checkTypeId || !formData.performedBy || !formData.rollId || !formData.checkDate}>
                    {createMutation.isPending ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* View Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("quality.check_details")}</DialogTitle>
          </DialogHeader>
          {currentCheck && (
            <div className="py-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("common.id")}</dt>
                  <dd className="mt-1 text-sm">#{currentCheck.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("quality.check_type")}</dt>
                  <dd className="mt-1 text-sm">
                    {getCheckTypeById(currentCheck.checkTypeId)?.name || currentCheck.checkTypeId}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("quality.result")}</dt>
                  <dd className="mt-1 text-sm">
                    {currentCheck.passed ? (
                      <Badge variant="success" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t("quality.passed")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        {t("quality.failed")}
                      </Badge>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("quality.check_date")}</dt>
                  <dd className="mt-1 text-sm">
                    {currentCheck.checkDate 
                      ? format(new Date(currentCheck.checkDate), 'MMMM d, yyyy') 
                      : t("common.not_available")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("quality.performed_by")}</dt>
                  <dd className="mt-1 text-sm">
                    {getUserById(currentCheck.performedBy)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("quality.roll")}</dt>
                  <dd className="mt-1 text-sm">
                    {currentCheck.rollId || t("common.not_available")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("quality.job_order")}</dt>
                  <dd className="mt-1 text-sm">
                    {currentCheck.jobOrderId ? `#${currentCheck.jobOrderId}` : t("common.not_available")}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">{t("quality.measurements")}</dt>
                  <dd className="mt-1 text-sm">
                    {currentCheck.measurements || t("common.not_available")}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">{t("quality.notes")}</dt>
                  <dd className="mt-1 text-sm whitespace-pre-line">
                    {currentCheck.notes || t("common.not_available")}
                  </dd>
                </div>
              </dl>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailDialog(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("quality.edit_check")}</DialogTitle>
            <DialogDescription>{t("quality.edit_check_description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
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

                <div>
                  <Label htmlFor="rollId">{t("quality.roll")} *</Label>
                  <Select 
                    value={formData.rollId} 
                    onValueChange={(value) => handleRollChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("quality.select_roll")} />
                    </SelectTrigger>
                    <SelectContent>
                      {rolls.map((roll: any) => (
                        <SelectItem key={roll.id} value={roll.id}>
                          {roll.id} - {t(`quality.stage_${roll.stage.toLowerCase()}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="passed" 
                    checked={formData.passed}
                    onCheckedChange={(checked) => setFormData({...formData, passed: checked})}
                  />
                  <Label htmlFor="passed">{t("quality.passed_check")}</Label>
                </div>

                <div>
                  <Label htmlFor="measurements">{t("quality.measurements")}</Label>
                  <Input 
                    id="measurements" 
                    value={formData.measurements}
                    onChange={(e) => setFormData({...formData, measurements: e.target.value})}
                    placeholder={t("quality.measurements_placeholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">{t("quality.notes")}</Label>
                  <Textarea 
                    id="notes" 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    placeholder={t("quality.notes_placeholder")}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !formData.checkTypeId || !formData.performedBy || !formData.rollId || !formData.checkDate}>
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
              <XCircle className="h-4 w-4 mr-2" />
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