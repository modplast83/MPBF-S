import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth-v2";

// UI Components
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import {
  CalendarIcon,
  CheckCircle2,
  Clock,
  FileCheck,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  XCircle,
  Eye,
  TimerReset,
  ListTodo
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Define types for corrective actions and quality checks
interface CorrectiveAction {
  id: number;
  qualityCheckId: number | null;
  assignedTo: string;
  action: string;
  status: string;
  dueDate?: Date | null;
  createdAt: string | null;
  completedAt: string | null;
  completedBy: string | null;
  priority: string;
  notes: string | null;
  verifiedBy: string | null;
  verificationDate: string | null;
  verificationNotes: string | null;
}

interface QualityCheck {
  id: number;
  checkTypeId: string;
  rollId: string | null;
  jobOrderId: number | null;
  performedBy: string | null;
  timestamp: string | null;
  result: string;
  status: string;
  issueSeverity: string | null;
  notes: string | null;
}

// Enhanced corrective action form schema
const correctiveActionSchema = z.object({
  qualityCheckId: z.number().nullable(),
  assignedTo: z.string().min(1, "An assignee must be selected"),
  action: z.string().min(5, "Action description must be at least 5 characters"),
  status: z.enum(["pending", "in_progress", "completed", "verified", "cancelled"]).default("pending"),
  dueDate: z.date().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  notes: z.string().optional().nullable(),
});

export type CorrectiveActionFormValues = z.infer<typeof correctiveActionSchema>;

interface EnhancedCorrectiveActionsProps {
  onActionCreated?: () => void;
}

export function EnhancedCorrectiveActions({ onActionCreated }: EnhancedCorrectiveActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State for filters, dialogs and selected action
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [currentTab, setCurrentTab] = useState("pending");
  
  // Initialize create form
  const form = useForm<CorrectiveActionFormValues>({
    resolver: zodResolver(correctiveActionSchema),
    defaultValues: {
      qualityCheckId: null,
      assignedTo: "",
      action: "",
      status: "pending",
      dueDate: null,
      priority: "medium",
      notes: null,
    },
  });
  
  // Initialize edit form
  const editForm = useForm<CorrectiveActionFormValues>({
    resolver: zodResolver(correctiveActionSchema),
    defaultValues: {
      qualityCheckId: null,
      assignedTo: "",
      action: "",
      status: "pending",
      dueDate: null,
      priority: "medium",
      notes: null,
    },
  });
  
  // Initialize completion form
  const completeForm = useForm<{ notes: string }>({
    resolver: zodResolver(z.object({ notes: z.string().optional().nullable() })),
    defaultValues: {
      notes: "",
    },
  });
  
  // Initialize verification form
  const verifyForm = useForm<{ verificationNotes: string }>({
    resolver: zodResolver(z.object({ verificationNotes: z.string().optional().nullable() })),
    defaultValues: {
      verificationNotes: "",
    },
  });
  
  // Fetch corrective actions
  const { data: correctiveActions, isLoading } = useQuery({
    queryKey: ["/api/corrective-actions"],
    queryFn: async () => {
      const response = await fetch("/api/corrective-actions");
      if (!response.ok) {
        throw new Error("Failed to fetch corrective actions");
      }
      return response.json() as Promise<CorrectiveAction[]>;
    },
  });
  
  // Fetch quality checks for reference
  const { data: qualityChecks } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json() as Promise<QualityCheck[]>;
    },
  });
  
  // Fetch users for assignedTo dropdown
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });
  
  // Create corrective action mutation
  const createAction = useMutation({
    mutationFn: async (values: CorrectiveActionFormValues) => {
      const response = await fetch("/api/corrective-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          createdAt: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create corrective action");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Action Created",
        description: "The corrective action has been successfully created.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/corrective-actions"],
      });
      form.reset();
      setIsFormOpen(false);
      if (onActionCreated) onActionCreated();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update corrective action mutation
  const updateAction = useMutation({
    mutationFn: async (data: { id: number; values: Partial<CorrectiveAction> }) => {
      const response = await fetch(`/api/corrective-actions/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update corrective action");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Action Updated",
        description: "The corrective action has been successfully updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/corrective-actions"],
      });
      editForm.reset();
      completeForm.reset();
      verifyForm.reset();
      setIsEditOpen(false);
      setIsCompleteOpen(false);
      setIsVerifyOpen(false);
      setSelectedAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete corrective action mutation
  const deleteAction = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/corrective-actions/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete corrective action");
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Action Deleted",
        description: "The corrective action has been successfully deleted.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/corrective-actions"],
      });
      setIsDeleteOpen(false);
      setSelectedAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: CorrectiveActionFormValues) => {
    createAction.mutate(values);
  };
  
  // Handle edit form submission
  const onEditSubmit = (values: CorrectiveActionFormValues) => {
    if (selectedAction) {
      updateAction.mutate({ id: selectedAction.id, values });
    }
  };
  
  // Handle complete form submission
  const onCompleteSubmit = (values: { notes: string }) => {
    if (selectedAction) {
      updateAction.mutate({
        id: selectedAction.id,
        values: {
          status: "completed",
          completedAt: new Date().toISOString(),
          completedBy: user?.id,
          notes: values.notes || selectedAction.notes,
        },
      });
    }
  };
  
  // Handle verify form submission
  const onVerifySubmit = (values: { verificationNotes: string }) => {
    if (selectedAction) {
      updateAction.mutate({
        id: selectedAction.id,
        values: {
          status: "verified",
          verifiedBy: user?.id,
          verificationDate: new Date().toISOString(),
          verificationNotes: values.verificationNotes || null,
        },
      });
    }
  };
  
  // Handle cancel action
  const handleCancelAction = () => {
    if (selectedAction) {
      updateAction.mutate({
        id: selectedAction.id,
        values: {
          status: "cancelled",
        },
      });
      setIsViewOpen(false);
    }
  };
  
  // Handle view details
  const handleViewDetails = (action: CorrectiveAction) => {
    setSelectedAction(action);
    setIsViewOpen(true);
  };
  
  // Handle edit action
  const handleEditAction = (action: CorrectiveAction) => {
    setSelectedAction(action);
    
    // Set edit form values
    editForm.reset({
      qualityCheckId: action.qualityCheckId,
      assignedTo: action.assignedTo,
      action: action.action,
      status: action.status as "pending" | "in_progress" | "completed" | "verified" | "cancelled",
      dueDate: action.dueDate ? new Date(action.dueDate) : null,
      priority: action.priority as "low" | "medium" | "high" | "critical",
      notes: action.notes,
    });
    
    setIsEditOpen(true);
  };
  
  // Handle complete action
  const handleCompleteAction = (action: CorrectiveAction) => {
    setSelectedAction(action);
    completeForm.reset({ notes: action.notes || "" });
    setIsCompleteOpen(true);
  };
  
  // Handle verify action
  const handleVerifyAction = (action: CorrectiveAction) => {
    setSelectedAction(action);
    verifyForm.reset({ verificationNotes: "" });
    setIsVerifyOpen(true);
  };
  
  // Handle delete action
  const handleDeleteAction = (action: CorrectiveAction) => {
    setSelectedAction(action);
    setIsDeleteOpen(true);
  };
  
  // Filter and sort corrective actions
  const filteredActions = correctiveActions?.filter((action) => {
    // Tab filter
    if (currentTab !== "all") {
      if (currentTab === "pending" && action.status !== "pending") return false;
      if (currentTab === "in_progress" && action.status !== "in_progress") return false;
      if (currentTab === "completed" && action.status !== "completed") return false;
      if (currentTab === "verified" && action.status !== "verified") return false;
      if (currentTab === "cancelled" && action.status !== "cancelled") return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && action.status !== statusFilter) {
      return false;
    }
    
    // Priority filter
    if (priorityFilter !== "all" && action.priority !== priorityFilter) {
      return false;
    }
    
    // Search term
    if (searchTerm && !action.action.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by priority (high to low) and then by due date (sooner first)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 4;
    const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 4;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    return 0;
  }) || [];
  
  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("quality.corrective_actions.status.pending")}
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
            <TimerReset className="h-3 w-3" />
            {t("quality.corrective_actions.status.in_progress")}
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t("quality.corrective_actions.status.completed")}
          </Badge>
        );
      case "verified":
        return (
          <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" />
            {t("quality.corrective_actions.status.verified")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t("quality.corrective_actions.status.cancelled")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
            {status}
          </Badge>
        );
    }
  };
  
  // Priority badge component
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
            {t("quality.corrective_actions.priority.low")}
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
            {t("quality.corrective_actions.priority.medium")}
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
            {t("quality.corrective_actions.priority.high")}
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
            {t("quality.corrective_actions.priority.critical")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
            {priority}
          </Badge>
        );
    }
  };
  
  // Get quality check details
  const getQualityCheckDetails = (checkId: number | null) => {
    if (!checkId || !qualityChecks) return null;
    return qualityChecks.find(check => check.id === checkId);
  };
  
  // Get user name by ID
  const getUserName = (userId: string | null) => {
    if (!userId || !users) return "Unknown";
    const user = users.find(u => u.id === userId);
    return user ? user.username : userId;
  };
  
  // Format date display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };
  
  // Check if action is overdue
  const isOverdue = (action: CorrectiveAction) => {
    if (!action.dueDate || action.status === "completed" || action.status === "verified" || action.status === "cancelled") {
      return false;
    }
    
    const dueDate = new Date(action.dueDate);
    const today = new Date();
    
    return dueDate < today;
  };

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("quality.corrective_actions.search_actions")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder={t("quality.corrective_actions.filter_priority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all_priorities")}</SelectItem>
              <SelectItem value="critical">{t("quality.corrective_actions.priority.critical")}</SelectItem>
              <SelectItem value="high">{t("quality.corrective_actions.priority.high")}</SelectItem>
              <SelectItem value="medium">{t("quality.corrective_actions.priority.medium")}</SelectItem>
              <SelectItem value="low">{t("quality.corrective_actions.priority.low")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> {t("quality.corrective_actions.create_action")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" /> {t("quality.corrective_actions.create_action")}
              </DialogTitle>
              <DialogDescription>
                {t("quality.corrective_actions.create_description")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="qualityCheckId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.corrective_actions.related_check")}</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          defaultValue={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.corrective_actions.select_check")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">{t("common.none")}</SelectItem>
                            {qualityChecks?.filter(check => check.result === "fail").map((check) => (
                              <SelectItem key={check.id} value={check.id.toString()}>
                                #{check.id} - {check.checkTypeId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("quality.corrective_actions.check_optional")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.corrective_actions.assign_to")} <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.corrective_actions.select_assignee")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users?.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.corrective_actions.action_description")} <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.corrective_actions.action_placeholder")}
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t("quality.corrective_actions.action_help")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.corrective_actions.priority.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.corrective_actions.select_priority")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t("quality.corrective_actions.priority.low")}</SelectItem>
                              <SelectItem value="medium">{t("quality.corrective_actions.priority.medium")}</SelectItem>
                              <SelectItem value="high">{t("quality.corrective_actions.priority.high")}</SelectItem>
                              <SelectItem value="critical">{t("quality.corrective_actions.priority.critical")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.corrective_actions.status.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.corrective_actions.select_status")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">{t("quality.corrective_actions.status.pending")}</SelectItem>
                              <SelectItem value="in_progress">{t("quality.corrective_actions.status.in_progress")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("quality.corrective_actions.due_date")}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>{t("common.pick_a_date")}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          {t("quality.corrective_actions.due_date_help")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.corrective_actions.notes")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.corrective_actions.notes_placeholder")}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsFormOpen(false)} 
                    className="md:mr-2"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createAction.isPending}>
                    {createAction.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.creating")}
                      </>
                    ) : (
                      t("quality.corrective_actions.create")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tabs and Table */}
      <Tabs defaultValue="pending" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
          <TabsTrigger value="pending">{t("quality.corrective_actions.status.pending")}</TabsTrigger>
          <TabsTrigger value="in_progress">{t("quality.corrective_actions.status.in_progress")}</TabsTrigger>
          <TabsTrigger value="completed">{t("quality.corrective_actions.status.completed")}</TabsTrigger>
          <TabsTrigger value="verified">{t("quality.corrective_actions.status.verified")}</TabsTrigger>
          <TabsTrigger value="cancelled">{t("quality.corrective_actions.status.cancelled")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value={currentTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredActions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <ListTodo className="h-12 w-12 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">{t("quality.corrective_actions.no_actions_found")}</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-md">
                    {t("quality.corrective_actions.no_actions_description")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead className="min-w-[250px]">{t("quality.corrective_actions.action")}</TableHead>
                        <TableHead>{t("quality.corrective_actions.assigned_to")}</TableHead>
                        <TableHead>{t("quality.corrective_actions.priority.label")}</TableHead>
                        <TableHead>{t("quality.corrective_actions.due_date")}</TableHead>
                        <TableHead>{t("quality.corrective_actions.status.label")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActions.map((action) => (
                        <TableRow 
                          key={action.id}
                          className={isOverdue(action) ? "bg-red-50" : ""}
                        >
                          <TableCell className="font-medium">#{action.id}</TableCell>
                          <TableCell className="max-w-[250px] truncate">
                            {action.action}
                          </TableCell>
                          <TableCell>{getUserName(action.assignedTo)}</TableCell>
                          <TableCell>{getPriorityBadge(action.priority)}</TableCell>
                          <TableCell>
                            {action.dueDate ? (
                              <span className={isOverdue(action) ? "text-red-700 font-medium" : ""}>
                                {format(new Date(action.dueDate), "MMM d, yyyy")}
                                {isOverdue(action) && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-800 py-0.5 px-1.5 rounded">
                                    {t("quality.corrective_actions.overdue")}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">{t("quality.corrective_actions.no_due_date")}</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(action.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(action)}
                                title={t("common.view_details")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {(action.status === "pending" || action.status === "in_progress") && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditAction(action)}
                                    title={t("common.edit")}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCompleteAction(action)}
                                    title={t("quality.corrective_actions.mark_complete")}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              {action.status === "completed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleVerifyAction(action)}
                                  title={t("quality.corrective_actions.verify")}
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {(action.status === "pending" || action.status === "in_progress") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteAction(action)}
                                  title={t("common.delete")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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
        </TabsContent>
      </Tabs>
      
      {/* View Dialog */}
      {selectedAction && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" /> 
                {t("quality.corrective_actions.action_details")} #{selectedAction.id}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("quality.corrective_actions.status.label")}</p>
                  {getStatusBadge(selectedAction.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("quality.corrective_actions.priority.label")}</p>
                  {getPriorityBadge(selectedAction.priority)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("quality.corrective_actions.created_at")}</p>
                  <p className="text-sm font-medium">
                    {formatDate(selectedAction.createdAt)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">{t("quality.corrective_actions.action_description")}</h3>
                <p className="text-sm">{selectedAction.action}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">{t("quality.corrective_actions.assigned_to")}</h3>
                  <p className="text-sm">{getUserName(selectedAction.assignedTo)}</p>
                </div>
                <div>
                  <h3 className="font-medium">{t("quality.corrective_actions.due_date")}</h3>
                  <p className="text-sm">
                    {selectedAction.dueDate ? format(new Date(selectedAction.dueDate), "PPP") : t("quality.corrective_actions.no_due_date")}
                  </p>
                </div>
              </div>
              
              {selectedAction.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t("quality.corrective_actions.notes")}</h3>
                  <p className="text-sm">{selectedAction.notes}</p>
                </div>
              )}
              
              {selectedAction.completedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">{t("quality.corrective_actions.completed_by")}</h3>
                    <p className="text-sm">{getUserName(selectedAction.completedBy)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">{t("quality.corrective_actions.completed_at")}</h3>
                    <p className="text-sm">{formatDate(selectedAction.completedAt)}</p>
                  </div>
                </div>
              )}
              
              {selectedAction.verifiedBy && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">{t("quality.corrective_actions.verified_by")}</h3>
                    <p className="text-sm">{getUserName(selectedAction.verifiedBy)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">{t("quality.corrective_actions.verification_date")}</h3>
                    <p className="text-sm">{formatDate(selectedAction.verificationDate)}</p>
                  </div>
                </div>
              )}
              
              {selectedAction.verificationNotes && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t("quality.corrective_actions.verification_notes")}</h3>
                  <p className="text-sm">{selectedAction.verificationNotes}</p>
                </div>
              )}
              
              {selectedAction.qualityCheckId && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t("quality.corrective_actions.related_check")}</h3>
                  {(() => {
                    const check = getQualityCheckDetails(selectedAction.qualityCheckId);
                    
                    if (!check) {
                      return <p className="text-sm italic text-gray-500">{t("quality.corrective_actions.check_not_found")}</p>;
                    }
                    
                    return (
                      <div className="border rounded-md p-4">
                        <div className="flex justify-between">
                          <p className="font-medium">#{check.id} - {check.checkTypeId}</p>
                          <Badge variant={check.result === "pass" ? "success" : "destructive"}>
                            {check.result === "pass" ? t("quality.pass") : t("quality.fail")}
                          </Badge>
                        </div>
                        {check.notes && <p className="mt-1 text-sm">{check.notes}</p>}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <DialogFooter>
              {(selectedAction.status === "pending" || selectedAction.status === "in_progress") && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelAction}
                    className="md:mr-auto"
                  >
                    {t("quality.corrective_actions.cancel_action")}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsViewOpen(false);
                      handleEditAction(selectedAction);
                    }}
                    className="md:mr-2"
                  >
                    {t("common.edit")}
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsViewOpen(false);
                      handleCompleteAction(selectedAction);
                    }}
                  >
                    {t("quality.corrective_actions.mark_complete")}
                  </Button>
                </>
              )}
              
              {selectedAction.status === "completed" && (
                <Button 
                  onClick={() => {
                    setIsViewOpen(false);
                    handleVerifyAction(selectedAction);
                  }}
                >
                  {t("quality.corrective_actions.verify")}
                </Button>
              )}
              
              {(selectedAction.status === "verified" || selectedAction.status === "cancelled") && (
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                  {t("common.close")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Dialog */}
      {selectedAction && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" /> 
                {t("quality.corrective_actions.edit_action")} #{selectedAction.id}
              </DialogTitle>
              <DialogDescription>
                {t("quality.corrective_actions.edit_description")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.corrective_actions.assign_to")} <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.corrective_actions.select_assignee")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users?.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.corrective_actions.action_description")} <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.corrective_actions.action_placeholder")}
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.corrective_actions.priority.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.corrective_actions.select_priority")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t("quality.corrective_actions.priority.low")}</SelectItem>
                              <SelectItem value="medium">{t("quality.corrective_actions.priority.medium")}</SelectItem>
                              <SelectItem value="high">{t("quality.corrective_actions.priority.high")}</SelectItem>
                              <SelectItem value="critical">{t("quality.corrective_actions.priority.critical")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.corrective_actions.status.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.corrective_actions.select_status")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">{t("quality.corrective_actions.status.pending")}</SelectItem>
                              <SelectItem value="in_progress">{t("quality.corrective_actions.status.in_progress")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("quality.corrective_actions.due_date")}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>{t("common.pick_a_date")}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.corrective_actions.notes")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.corrective_actions.notes_placeholder")}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditOpen(false)} 
                    className="md:mr-2"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={updateAction.isPending}>
                    {updateAction.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.updating")}
                      </>
                    ) : (
                      t("common.save_changes")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Complete Dialog */}
      {selectedAction && (
        <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" /> 
                {t("quality.corrective_actions.mark_complete")}
              </DialogTitle>
              <DialogDescription>
                {t("quality.corrective_actions.complete_description")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...completeForm}>
              <form onSubmit={completeForm.handleSubmit(onCompleteSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="rounded-md border p-4 bg-secondary-50">
                    <p className="font-medium">#{selectedAction.id}: {selectedAction.action}</p>
                  </div>
                  
                  <FormField
                    control={completeForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.corrective_actions.completion_notes")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.corrective_actions.completion_notes_placeholder")}
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("quality.corrective_actions.completion_notes_help")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCompleteOpen(false)} 
                    className="md:mr-2"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={updateAction.isPending}>
                    {updateAction.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.updating")}
                      </>
                    ) : (
                      t("quality.corrective_actions.complete")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Verify Dialog */}
      {selectedAction && (
        <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-purple-600" /> 
                {t("quality.corrective_actions.verify_action")}
              </DialogTitle>
              <DialogDescription>
                {t("quality.corrective_actions.verify_description")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="rounded-md border p-4 bg-secondary-50">
                    <p className="font-medium">#{selectedAction.id}: {selectedAction.action}</p>
                    <p className="text-sm mt-2">
                      {t("quality.corrective_actions.completed_by")}: {getUserName(selectedAction.completedBy)}
                    </p>
                    <p className="text-sm">
                      {t("quality.corrective_actions.completed_at")}: {formatDate(selectedAction.completedAt)}
                    </p>
                  </div>
                  
                  <FormField
                    control={verifyForm.control}
                    name="verificationNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.corrective_actions.verification_notes")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.corrective_actions.verification_notes_placeholder")}
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("quality.corrective_actions.verification_notes_help")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsVerifyOpen(false)} 
                    className="md:mr-2"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={updateAction.isPending}>
                    {updateAction.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.updating")}
                      </>
                    ) : (
                      t("quality.corrective_actions.verify")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      {selectedAction && (
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">{t("quality.corrective_actions.confirm_delete")}</DialogTitle>
              <DialogDescription>
                {t("quality.corrective_actions.delete_confirmation_text")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-3">
              <p className="font-medium">{t("quality.corrective_actions.action")} #{selectedAction.id}</p>
              <p className="text-sm text-gray-500">{selectedAction.action.substring(0, 100)}{selectedAction.action.length > 100 ? '...' : ''}</p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteAction.mutate(selectedAction.id)}
                disabled={deleteAction.isPending}
              >
                {deleteAction.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.deleting")}
                  </>
                ) : (
                  t("common.delete")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}