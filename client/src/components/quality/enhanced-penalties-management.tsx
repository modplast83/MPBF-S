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
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileWarning,
  Gavel,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  UserMinus,
  XCircle,
  Eye
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QualityPenalty, QualityViolation } from "@shared/schema";
import { insertQualityPenaltySchema } from "@shared/schema";
import { cn } from "@/lib/utils";

// Enhanced penalty form schema
const enhancedPenaltySchema = insertQualityPenaltySchema.extend({
  violationId: z.number().min(1, "A violation must be selected"),
  assignedTo: z.string().min(1, "An assignee must be selected"),
  penaltyType: z.enum(["warning", "training", "suspension", "financial", "other"]),
  amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["pending", "active", "completed", "appealed", "cancelled"]).default("pending"),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  comments: z.string().nullable().optional(),
  appealDetails: z.string().nullable().optional(),
});

export type EnhancedPenaltyFormValues = z.infer<typeof enhancedPenaltySchema>;

interface EnhancedPenaltiesManagementProps {
  onPenaltyCreated?: () => void;
}

export function EnhancedPenaltiesManagement({ onPenaltyCreated }: EnhancedPenaltiesManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State for filters, dialogs and selected penalty
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<QualityPenalty | null>(null);
  const [currentTab, setCurrentTab] = useState("all");
  
  // Initialize create form
  const form = useForm<EnhancedPenaltyFormValues>({
    resolver: zodResolver(enhancedPenaltySchema),
    defaultValues: {
      description: "",
      penaltyType: "warning",
      amount: null,
      currency: null,
      status: "pending",
      startDate: new Date(),
      endDate: null,
      assignedTo: "",
      comments: null,
      appealDetails: null,
    },
  });
  
  // Initialize edit form
  const editForm = useForm<EnhancedPenaltyFormValues>({
    resolver: zodResolver(enhancedPenaltySchema),
    defaultValues: {
      description: "",
      penaltyType: "warning",
      amount: null,
      currency: null,
      status: "pending",
      startDate: new Date(),
      endDate: null,
      assignedTo: "",
      comments: null,
      appealDetails: null,
    },
  });
  
  // Watch penalty type to show/hide amount and currency fields
  const watchPenaltyType = form.watch("penaltyType");
  const watchEditPenaltyType = editForm.watch("penaltyType");
  
  // Fetch penalties
  const { data: penalties, isLoading } = useQuery({
    queryKey: ["/api/quality-penalties"],
    queryFn: async () => {
      const response = await fetch("/api/quality-penalties");
      if (!response.ok) {
        throw new Error("Failed to fetch penalties");
      }
      return response.json() as Promise<QualityPenalty[]>;
    },
  });
  
  // Fetch violations for the form
  const { data: violations } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        throw new Error("Failed to fetch violations");
      }
      return response.json() as Promise<QualityViolation[]>;
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
  
  // Create penalty mutation
  const createPenalty = useMutation({
    mutationFn: async (values: EnhancedPenaltyFormValues) => {
      const response = await fetch("/api/quality-penalties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          assignedBy: user?.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create penalty");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Penalty Created",
        description: "The quality penalty has been successfully created.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/quality-penalties"],
      });
      form.reset();
      setIsFormOpen(false);
      if (onPenaltyCreated) onPenaltyCreated();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update penalty mutation
  const updatePenalty = useMutation({
    mutationFn: async (data: { id: number; values: EnhancedPenaltyFormValues }) => {
      const response = await fetch(`/api/quality-penalties/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update penalty");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Penalty Updated",
        description: "The quality penalty has been successfully updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/quality-penalties"],
      });
      editForm.reset();
      setIsEditOpen(false);
      setSelectedPenalty(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete penalty mutation
  const deletePenalty = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/quality-penalties/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete penalty");
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Penalty Deleted",
        description: "The quality penalty has been successfully deleted.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/quality-penalties"],
      });
      setIsDeleteOpen(false);
      setSelectedPenalty(null);
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
  const onSubmit = (values: EnhancedPenaltyFormValues) => {
    createPenalty.mutate(values);
  };
  
  // Handle edit form submission
  const onEditSubmit = (values: EnhancedPenaltyFormValues) => {
    if (selectedPenalty) {
      updatePenalty.mutate({ id: selectedPenalty.id, values });
    }
  };
  
  // Handle print penalty
  const handlePrintPenalty = (penalty: QualityPenalty) => {
    setSelectedPenalty(penalty);
    setIsPrintMode(true);
    
    // Use a timeout to ensure the printing component is rendered before printing
    setTimeout(() => {
      window.print();
      
      // Delay resetting the print state to ensure print rendering completes
      setTimeout(() => {
        setIsPrintMode(false);
        setSelectedPenalty(null);
      }, 500);
    }, 300);
  };
  
  // Handle view details
  const handleViewDetails = (penalty: QualityPenalty) => {
    setSelectedPenalty(penalty);
    setIsViewOpen(true);
  };
  
  // Handle edit penalty
  const handleEditPenalty = (penalty: QualityPenalty) => {
    setSelectedPenalty(penalty);
    
    // Set edit form values
    editForm.reset({
      ...penalty,
      startDate: new Date(penalty.startDate),
      endDate: penalty.endDate ? new Date(penalty.endDate) : null,
      amount: penalty.amount ?? null,
      currency: penalty.currency ?? null,
      comments: penalty.comments ?? null,
      appealDetails: penalty.appealDetails ?? null,
    });
    
    setIsEditOpen(true);
  };
  
  // Handle delete penalty
  const handleDeletePenalty = (penalty: QualityPenalty) => {
    setSelectedPenalty(penalty);
    setIsDeleteOpen(true);
  };
  
  // Filter and sort penalties
  const filteredPenalties = penalties?.filter((penalty) => {
    // Tab filter
    if (currentTab !== "all") {
      if (currentTab === "pending" && penalty.status !== "pending") return false;
      if (currentTab === "active" && penalty.status !== "active") return false;
      if (currentTab === "completed" && penalty.status !== "completed") return false;
      if (currentTab === "appealed" && penalty.status !== "appealed") return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && penalty.status !== statusFilter) {
      return false;
    }
    
    // Type filter
    if (typeFilter !== "all" && penalty.penaltyType !== typeFilter) {
      return false;
    }
    
    // Search term
    if (searchTerm && !penalty.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by start date (newest first)
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  }) || [];
  
  // Handle status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("quality.penalties.status.pending")}
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t("quality.penalties.status.active")}
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t("quality.penalties.status.completed")}
          </Badge>
        );
      case "appealed":
        return (
          <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 flex items-center gap-1">
            <Gavel className="h-3 w-3" />
            {t("quality.penalties.status.appealed")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t("quality.penalties.status.cancelled")}
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
  
  // Handle type badge styling
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warning":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t("quality.penalties.type.warning")}
          </Badge>
        );
      case "training":
        return (
          <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 flex items-center gap-1">
            <FileWarning className="h-3 w-3" />
            {t("quality.penalties.type.training")}
          </Badge>
        );
      case "suspension":
        return (
          <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 flex items-center gap-1">
            <UserMinus className="h-3 w-3" />
            {t("quality.penalties.type.suspension")}
          </Badge>
        );
      case "financial":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 flex items-center gap-1">
            <CircleDollarSign className="h-3 w-3" />
            {t("quality.penalties.type.financial")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
            {type}
          </Badge>
        );
    }
  };
  
  // Get violation details for a penalty
  const getViolationDetails = (violationId: number) => {
    if (!violations) return null;
    return violations.find(v => v.id === violationId);
  };
  
  // Get user name by ID
  const getUserName = (userId: string) => {
    if (!users) return userId;
    const user = users.find(u => u.id === userId);
    return user ? user.username : userId;
  };

  // Render print mode content
  if (isPrintMode && selectedPenalty) {
    const violation = getViolationDetails(selectedPenalty.violationId);
    
    return (
      <div className="p-8 print:p-4 max-w-3xl mx-auto bg-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("quality.penalties.penalty_document")}</h1>
            <p className="text-gray-500">{t("quality.penalties.issued_on")}: {format(new Date(selectedPenalty.startDate), "PPP")}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">{t("quality.penalties.id")}: {selectedPenalty.id}</p>
            <p>{getStatusBadge(selectedPenalty.status)}</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-500">{t("quality.penalties.assigned_to")}</h3>
            <p className="font-medium">{getUserName(selectedPenalty.assignedTo)}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-500">{t("quality.penalties.assigned_by")}</h3>
            <p className="font-medium">{getUserName(selectedPenalty.assignedBy)}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-500">{t("quality.penalties.type.label")}</h3>
            <p className="font-medium">{selectedPenalty.penaltyType}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-500">{t("quality.penalties.dates")}</h3>
            <p className="font-medium">
              {format(new Date(selectedPenalty.startDate), "PPP")}
              {selectedPenalty.endDate && ` - ${format(new Date(selectedPenalty.endDate), "PPP")}`}
            </p>
          </div>
        </div>
        
        {selectedPenalty.penaltyType === "financial" && selectedPenalty.amount && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-500">{t("quality.penalties.amount")}</h3>
            <p className="font-medium">{selectedPenalty.amount} {selectedPenalty.currency}</p>
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="font-medium text-gray-500">{t("quality.penalties.description")}</h3>
          <p className="mt-1">{selectedPenalty.description}</p>
        </div>
        
        <Separator className="my-6" />
        
        <div className="mt-4">
          <h3 className="font-medium text-gray-500">{t("quality.penalties.related_violation")}</h3>
          {violation ? (
            <div className="border rounded-md p-4 mt-2">
              <div className="flex justify-between">
                <p className="font-medium">#{violation.id} - {violation.violationType}</p>
                <div>{getSeverityBadge(violation.severity)}</div>
              </div>
              <p className="mt-2">{violation.description}</p>
            </div>
          ) : (
            <p className="italic text-gray-500 mt-2">{t("quality.penalties.violation_not_found")}</p>
          )}
        </div>
        
        {selectedPenalty.comments && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-500">{t("quality.penalties.comments")}</h3>
            <p className="mt-1">{selectedPenalty.comments}</p>
          </div>
        )}
        
        {selectedPenalty.appealDetails && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-500">{t("quality.penalties.appeal_details")}</h3>
            <p className="mt-1">{selectedPenalty.appealDetails}</p>
          </div>
        )}
        
        <div className="mt-12 grid grid-cols-2 gap-16">
          <div>
            <Separator className="mb-2" />
            <p className="text-center text-gray-500">{t("quality.penalties.assignee_signature")}</p>
          </div>
          <div>
            <Separator className="mb-2" />
            <p className="text-center text-gray-500">{t("quality.penalties.issuer_signature")}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("quality.penalties.search_penalties")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder={t("quality.penalties.filter_by_type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all_types")}</SelectItem>
              <SelectItem value="warning">{t("quality.penalties.type.warning")}</SelectItem>
              <SelectItem value="training">{t("quality.penalties.type.training")}</SelectItem>
              <SelectItem value="suspension">{t("quality.penalties.type.suspension")}</SelectItem>
              <SelectItem value="financial">{t("quality.penalties.type.financial")}</SelectItem>
              <SelectItem value="other">{t("quality.penalties.type.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> {t("quality.penalties.assign_penalty")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-red-600" /> {t("quality.penalties.assign_penalty")}
              </DialogTitle>
              <DialogDescription>
                {t("quality.penalties.assign_penalty_description")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="violationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.penalties.related_violation")} <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.penalties.select_violation")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {violations?.map((violation) => (
                              <SelectItem key={violation.id} value={violation.id.toString()}>
                                #{violation.id} - {violation.description.substring(0, 30)}...
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
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.penalties.assign_to")} <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.penalties.select_user")} />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="penaltyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.penalties.type.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.penalties.select_type")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="warning">{t("quality.penalties.type.warning")}</SelectItem>
                              <SelectItem value="training">{t("quality.penalties.type.training")}</SelectItem>
                              <SelectItem value="suspension">{t("quality.penalties.type.suspension")}</SelectItem>
                              <SelectItem value="financial">{t("quality.penalties.type.financial")}</SelectItem>
                              <SelectItem value="other">{t("quality.penalties.type.other")}</SelectItem>
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
                          <FormLabel>{t("quality.penalties.status.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.penalties.select_status")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">{t("quality.penalties.status.pending")}</SelectItem>
                              <SelectItem value="active">{t("quality.penalties.status.active")}</SelectItem>
                              <SelectItem value="completed">{t("quality.penalties.status.completed")}</SelectItem>
                              <SelectItem value="appealed">{t("quality.penalties.status.appealed")}</SelectItem>
                              <SelectItem value="cancelled">{t("quality.penalties.status.cancelled")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {watchPenaltyType === "financial" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("quality.penalties.amount")} <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field} 
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("quality.penalties.currency")} <span className="text-red-500">*</span></FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("quality.penalties.select_currency")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                                <SelectItem value="SAR">SAR</SelectItem>
                                <SelectItem value="AED">AED</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t("quality.penalties.start_date")} <span className="text-red-500">*</span></FormLabel>
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
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {(watchPenaltyType === "suspension" || watchPenaltyType === "training") && (
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>{t("quality.penalties.end_date")}</FormLabel>
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
                                  disabled={(date) => date < form.getValues("startDate")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.penalties.description")} <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.penalties.description_placeholder")}
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t("quality.penalties.description_help")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.penalties.comments")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.penalties.comments_placeholder")}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("quality.penalties.comments_help")}
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
                    onClick={() => setIsFormOpen(false)} 
                    className="md:mr-2"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createPenalty.isPending}>
                    {createPenalty.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.submitting")}
                      </>
                    ) : (
                      t("quality.penalties.assign")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tabs and Table */}
      <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
          <TabsTrigger value="pending">{t("quality.penalties.status.pending")}</TabsTrigger>
          <TabsTrigger value="active">{t("quality.penalties.status.active")}</TabsTrigger>
          <TabsTrigger value="completed">{t("quality.penalties.status.completed")}</TabsTrigger>
          <TabsTrigger value="appealed">{t("quality.penalties.status.appealed")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value={currentTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPenalties.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Gavel className="h-12 w-12 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">{t("quality.penalties.no_penalties_found")}</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-md">
                    {t("quality.penalties.no_penalties_description")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>{t("quality.penalties.violation")}</TableHead>
                        <TableHead>{t("quality.penalties.assigned_to")}</TableHead>
                        <TableHead>{t("quality.penalties.type.label")}</TableHead>
                        {typeFilter === "financial" && (
                          <TableHead>{t("quality.penalties.amount")}</TableHead>
                        )}
                        <TableHead>{t("quality.penalties.dates")}</TableHead>
                        <TableHead>{t("quality.penalties.status.label")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPenalties.map((penalty) => {
                        const violation = getViolationDetails(penalty.violationId);
                        
                        return (
                          <TableRow key={penalty.id}>
                            <TableCell className="font-medium">#{penalty.id}</TableCell>
                            <TableCell>
                              {violation ? (
                                <span className="text-sm">#{violation.id} - {violation.violationType}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">{t("quality.penalties.unknown_violation")}</span>
                              )}
                            </TableCell>
                            <TableCell>{getUserName(penalty.assignedTo)}</TableCell>
                            <TableCell>{getTypeBadge(penalty.penaltyType)}</TableCell>
                            {typeFilter === "financial" && (
                              <TableCell>
                                {penalty.amount && penalty.currency ? (
                                  <span>{penalty.amount} {penalty.currency}</span>
                                ) : (
                                  <span>-</span>
                                )}
                              </TableCell>
                            )}
                            <TableCell>
                              <span>{format(new Date(penalty.startDate), "MMM d, yyyy")}</span>
                              {penalty.endDate && (
                                <>
                                  <span className="mx-1">-</span>
                                  <span>{format(new Date(penalty.endDate), "MMM d, yyyy")}</span>
                                </>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(penalty.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetails(penalty)}
                                  title={t("common.view_details")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditPenalty(penalty)}
                                  title={t("common.edit")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePrintPenalty(penalty)}
                                  title={t("quality.penalties.print")}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePenalty(penalty)}
                                  title={t("common.delete")}
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* View Dialog */}
      {selectedPenalty && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-red-600" /> 
                {t("quality.penalties.penalty_details")} #{selectedPenalty.id}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("quality.penalties.status.label")}</p>
                  {getStatusBadge(selectedPenalty.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("quality.penalties.type.label")}</p>
                  {getTypeBadge(selectedPenalty.penaltyType)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("quality.penalties.date_issued")}</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedPenalty.startDate), "PPP")}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">{t("quality.penalties.assigned_to")}</h3>
                  <p className="text-sm">{getUserName(selectedPenalty.assignedTo)}</p>
                </div>
                <div>
                  <h3 className="font-medium">{t("quality.penalties.assigned_by")}</h3>
                  <p className="text-sm">{getUserName(selectedPenalty.assignedBy)}</p>
                </div>
              </div>
              
              {selectedPenalty.penaltyType === "financial" && selectedPenalty.amount && (
                <div>
                  <h3 className="font-medium">{t("quality.penalties.amount")}</h3>
                  <p className="text-sm">{selectedPenalty.amount} {selectedPenalty.currency}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="font-medium">{t("quality.penalties.description")}</h3>
                <p className="text-sm">{selectedPenalty.description}</p>
              </div>
              
              {selectedPenalty.comments && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t("quality.penalties.comments")}</h3>
                  <p className="text-sm">{selectedPenalty.comments}</p>
                </div>
              )}
              
              {selectedPenalty.appealDetails && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t("quality.penalties.appeal_details")}</h3>
                  <p className="text-sm">{selectedPenalty.appealDetails}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">{t("quality.penalties.related_violation")}</h3>
                {(() => {
                  const violation = getViolationDetails(selectedPenalty.violationId);
                  
                  if (!violation) {
                    return <p className="text-sm italic text-gray-500">{t("quality.penalties.violation_not_found")}</p>;
                  }
                  
                  return (
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between">
                        <p className="font-medium">#{violation.id}</p>
                        <div>{getSeverityBadge(violation.severity)}</div>
                      </div>
                      <p className="mt-1 text-sm">{violation.description}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                {t("common.close")}
              </Button>
              <Button onClick={() => {
                setIsViewOpen(false);
                handleEditPenalty(selectedPenalty);
              }}>
                {t("common.edit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Dialog */}
      {selectedPenalty && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" /> 
                {t("quality.penalties.edit_penalty")} #{selectedPenalty.id}
              </DialogTitle>
              <DialogDescription>
                {t("quality.penalties.edit_penalty_description")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="violationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.penalties.related_violation")} <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                          disabled
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.penalties.select_violation")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {violations?.map((violation) => (
                              <SelectItem key={violation.id} value={violation.id.toString()}>
                                #{violation.id} - {violation.description.substring(0, 30)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("quality.penalties.violation_id_cannot_be_changed")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.penalties.assign_to")} <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.penalties.select_user")} />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="penaltyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quality.penalties.type.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.penalties.select_type")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="warning">{t("quality.penalties.type.warning")}</SelectItem>
                              <SelectItem value="training">{t("quality.penalties.type.training")}</SelectItem>
                              <SelectItem value="suspension">{t("quality.penalties.type.suspension")}</SelectItem>
                              <SelectItem value="financial">{t("quality.penalties.type.financial")}</SelectItem>
                              <SelectItem value="other">{t("quality.penalties.type.other")}</SelectItem>
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
                          <FormLabel>{t("quality.penalties.status.label")} <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("quality.penalties.select_status")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">{t("quality.penalties.status.pending")}</SelectItem>
                              <SelectItem value="active">{t("quality.penalties.status.active")}</SelectItem>
                              <SelectItem value="completed">{t("quality.penalties.status.completed")}</SelectItem>
                              <SelectItem value="appealed">{t("quality.penalties.status.appealed")}</SelectItem>
                              <SelectItem value="cancelled">{t("quality.penalties.status.cancelled")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {watchEditPenaltyType === "financial" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("quality.penalties.amount")} <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field} 
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("quality.penalties.currency")} <span className="text-red-500">*</span></FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("quality.penalties.select_currency")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                                <SelectItem value="SAR">SAR</SelectItem>
                                <SelectItem value="AED">AED</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t("quality.penalties.start_date")} <span className="text-red-500">*</span></FormLabel>
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
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {(watchEditPenaltyType === "suspension" || watchEditPenaltyType === "training") && (
                      <FormField
                        control={editForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>{t("quality.penalties.end_date")}</FormLabel>
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
                                  disabled={(date) => date < editForm.getValues("startDate")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.penalties.description")} <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.penalties.description_placeholder")}
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.penalties.comments")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.penalties.comments_placeholder")}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="appealDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.penalties.appeal_details")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("quality.penalties.appeal_details_placeholder")}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("quality.penalties.appeal_details_help")}
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
                    onClick={() => setIsEditOpen(false)} 
                    className="md:mr-2"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={updatePenalty.isPending}>
                    {updatePenalty.isPending ? (
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
      
      {/* Delete Confirmation Dialog */}
      {selectedPenalty && (
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">{t("quality.penalties.confirm_delete")}</DialogTitle>
              <DialogDescription>
                {t("quality.penalties.delete_confirmation_text")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-3">
              <p className="font-medium">{t("quality.penalties.penalty")} #{selectedPenalty.id}</p>
              <p className="text-sm text-gray-500">{selectedPenalty.description.substring(0, 100)}{selectedPenalty.description.length > 100 ? '...' : ''}</p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deletePenalty.mutate(selectedPenalty.id)}
                disabled={deletePenalty.isPending}
              >
                {deletePenalty.isPending ? (
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