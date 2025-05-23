import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, FileText, AlertTriangle, CheckCircle2, AlertCircle, Pencil, Printer, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface QualityCheck {
  id: number;
  checkTypeId: string;
  rollId: string | null;
  jobOrderId: number | null;
  performedBy: string;
  timestamp: string;
  status: string;
  notes: string | null;
  checklistResults: string[];
  parameterValues: string[];
  issueSeverity: string | null;
  imageUrls: string[];
}

interface QualityCheckType {
  id: string;
  name: string;
  targetStage: string;
  isActive: boolean;
}

interface Roll {
  id: string;
  serialNumber: string;
  currentStage: string;
  jobOrderId: number;
}

interface JobOrder {
  id: number;
  orderId: number;
  customerProductId: number;
}

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

const formSchema = z.object({
  checkTypeId: z.string().min(1, "Check type is required"),
  rollId: z.string().nullable(),
  jobOrderId: z.number().nullable(),
  performedBy: z.string().min(1, "Performed by is required"),
  notes: z.string().nullable(),
  status: z.string().min(1, "Status is required"),
  issueSeverity: z.string().nullable(),
});

export default function QualityChecks() {
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedJobOrder, setSelectedJobOrder] = useState<number | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkTypeId: "",
      rollId: null,
      jobOrderId: null,
      performedBy: "",
      notes: "",
      status: "pending",
      issueSeverity: null,
    }
  });
  
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkTypeId: "",
      rollId: null,
      jobOrderId: null,
      performedBy: "",
      notes: "",
      status: "pending",
      issueSeverity: null,
    }
  });

  const { data: checks = [], isLoading } = useQuery<QualityCheck[]>({
    queryKey: ["/api/quality-checks"],
    refetchOnWindowFocus: false,
  });

  const { data: checkTypes = [] } = useQuery<QualityCheckType[]>({
    queryKey: ["/api/quality-check-types"],
    refetchOnWindowFocus: false,
  });

  const { data: rolls = [] } = useQuery<Roll[]>({
    queryKey: ["/api/rolls"],
    refetchOnWindowFocus: false,
  });

  const { data: jobOrders = [] } = useQuery<JobOrder[]>({
    queryKey: ["/api/job-orders"],
    refetchOnWindowFocus: false,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/quality-checks", values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quality check created successfully",
      });
      setIsOpenCreate(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create quality check",
        variant: "destructive",
      });
      console.error("Error creating quality check:", error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema> & { id: number }) => {
      const { id, ...updateData } = values;
      return await apiRequest("PATCH", `/api/quality-checks/${id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quality check updated successfully",
      });
      setIsOpenEdit(false);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update quality check",
        variant: "destructive",
      });
      console.error("Error updating quality check:", error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/quality-checks/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quality check deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete quality check",
        variant: "destructive",
      });
      console.error("Error deleting quality check:", error);
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };

  const onEditSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedCheck) {
      updateMutation.mutate({ ...values, id: selectedCheck.id });
    }
  };

  const handleEditClick = (check: QualityCheck) => {
    setSelectedCheck(check);
    editForm.reset({
      checkTypeId: check.checkTypeId,
      rollId: check.rollId,
      jobOrderId: check.jobOrderId,
      performedBy: check.performedBy || "",
      notes: check.notes || "",
      status: check.status,
      issueSeverity: check.issueSeverity
    });
    setIsOpenEdit(true);
  };

  const handleDeleteClick = (check: QualityCheck) => {
    setSelectedCheck(check);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCheck) {
      deleteMutation.mutate(selectedCheck.id);
    }
  };

  const handlePrint = (check: QualityCheck) => {
    setSelectedCheck(check);
    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast({
            title: "Warning",
            description: "Please allow popups to print quality check reports",
            variant: "destructive",
          });
          return;
        }
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Quality Check #${check.id} - Report</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .company { font-size: 24px; font-weight: bold; }
                .title { font-size: 18px; margin: 10px 0; }
                .section { margin-bottom: 20px; }
                .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .row { display: flex; margin-bottom: 8px; }
                .label { font-weight: bold; width: 200px; }
                .value { flex: 1; }
                .status-passed { color: green; font-weight: bold; }
                .status-failed { color: red; font-weight: bold; }
                .status-pending { color: orange; font-weight: bold; }
                .severity-minor { color: blue; }
                .severity-major { color: orange; }
                .severity-critical { color: red; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="company">Modern Plastic Bag Factory</div>
                <div class="title">Quality Check Report</div>
                <div>Report Date: ${new Date().toLocaleDateString()}</div>
              </div>

              <div class="section">
                <div class="section-title">Quality Check Information</div>
                <div class="row">
                  <div class="label">Check ID:</div>
                  <div class="value">#${check.id}</div>
                </div>
                <div class="row">
                  <div class="label">Check Type:</div>
                  <div class="value">${getCheckTypeName(check.checkTypeId)}</div>
                </div>
                <div class="row">
                  <div class="label">Status:</div>
                  <div class="value status-${check.status}">${check.status.toUpperCase()}</div>
                </div>
                <div class="row">
                  <div class="label">Date Performed:</div>
                  <div class="value">${new Date(check.timestamp).toLocaleString()}</div>
                </div>
                <div class="row">
                  <div class="label">Performed By:</div>
                  <div class="value">${getUserName(check.performedBy || '')}</div>
                </div>
                ${check.issueSeverity ? `
                <div class="row">
                  <div class="label">Issue Severity:</div>
                  <div class="value severity-${check.issueSeverity}">${check.issueSeverity.toUpperCase()}</div>
                </div>` : ''}
              </div>

              <div class="section">
                <div class="section-title">Item Information</div>
                <div class="row">
                  <div class="label">Roll:</div>
                  <div class="value">${getRollNumber(check.rollId)}</div>
                </div>
                <div class="row">
                  <div class="label">Job Order:</div>
                  <div class="value">${getJobOrderInfo(check.jobOrderId)}</div>
                </div>
              </div>

              ${check.notes ? `
              <div class="section">
                <div class="section-title">Notes</div>
                <p>${check.notes}</p>
              </div>` : ''}

              <div class="footer">
                <p>This is an automatically generated report. Please verify all information.</p>
                <p>Modern Plastic Bag Factory Quality Management System</p>
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }, 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'passed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Passed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string | null) => {
    if (!severity) return null;
    
    switch (severity) {
      case 'minor':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Minor</Badge>;
      case 'major':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Major</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Critical</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const filteredChecks = checks && checks.filter((check: QualityCheck) => {
    if (activeTab === 'all') return true;
    return check.status === activeTab;
  });

  const getCheckTypeName = (id: string) => {
    const checkType = checkTypes?.find((type: QualityCheckType) => type.id === id);
    return checkType ? checkType.name : id;
  };

  const getRollNumber = (id: string | null) => {
    if (!id) return 'N/A';
    const roll = rolls?.find((r: Roll) => r.id === id);
    return roll ? `#${roll.serialNumber}` : id;
  };

  const getJobOrderInfo = (id: number | null) => {
    if (!id) return 'N/A';
    const jobOrder = jobOrders?.find((jo: JobOrder) => jo.id === id);
    return jobOrder ? `#${jobOrder.id} (Order: ${jobOrder.orderId})` : `#${id}`;
  };

  const getUserName = (id: string) => {
    const user = users?.find((u: User) => u.id === id);
    return user ? user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || id : id;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Quality Checks" description="Record and track quality inspections across production stages" />
        <Dialog open={isOpenCreate} onOpenChange={setIsOpenCreate}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Quality Check
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Quality Check</DialogTitle>
              <DialogDescription>
                Perform a new quality inspection for a roll or job order
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="checkTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a check type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {checkTypes && checkTypes.map((type: QualityCheckType) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} ({type.targetStage})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="jobOrderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Order ID</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const jobOrderId = value === "none" ? null : parseInt(value);
                            field.onChange(jobOrderId);
                            setSelectedJobOrder(jobOrderId);
                            // Reset roll selection when job order changes
                            form.setValue("rollId", null);
                          }} 
                          defaultValue={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a job order" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {jobOrders && jobOrders.map((jobOrder: JobOrder) => (
                              <SelectItem key={jobOrder.id} value={jobOrder.id.toString()}>
                                Job Order #{jobOrder.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Optional - select if checking a job order</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rollId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll ID</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                          defaultValue={field.value || "none"}
                          disabled={!selectedJobOrder}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedJobOrder ? "Select a roll" : "Select a job order first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {rolls && rolls
                              .filter(roll => !selectedJobOrder || roll.jobOrderId === selectedJobOrder)
                              .map((roll: Roll) => (
                                <SelectItem key={roll.id} value={roll.id}>
                                  {roll.serialNumber} - {roll.currentStage}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {selectedJobOrder 
                            ? "Select a roll associated with this job order" 
                            : "Please select a job order first"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="performedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performed By</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users && users.map((user: User) => (
                            <SelectItem key={user.id} value={user.id}>
                              {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.id}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="passed">Passed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issueSeverity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Severity (if any)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                        defaultValue={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="major">Major</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Only applicable for failed checks</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any notes or observations" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Quality Check"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 rounded-lg border">
          <TabsTrigger value="all">
            All Checks
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-8">Loading quality checks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChecks && filteredChecks.length > 0 ? (
            filteredChecks.map((check: QualityCheck) => (
              <Card key={check.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(check.status)}
                      Check #{check.id}
                    </CardTitle>
                    {getStatusBadge(check.status)}
                  </div>
                  <CardDescription>
                    {getCheckTypeName(check.checkTypeId)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Roll</p>
                      <p>{getRollNumber(check.rollId)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Job Order</p>
                      <p>{getJobOrderInfo(check.jobOrderId)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Performed By</p>
                      <p>{getUserName(check.performedBy)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p>{new Date(check.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {check.issueSeverity && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Severity</p>
                      <div className="mt-1">{getSeverityBadge(check.issueSeverity)}</div>
                    </div>
                  )}
                  {check.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-sm">{check.notes}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditClick(check)}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePrint(check)}
                    >
                      <Printer className="h-4 w-4 mr-1" /> Print
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteClick(check)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 border rounded-md bg-gray-50">
              No quality checks found. Start by creating a new quality check.
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isOpenEdit} onOpenChange={setIsOpenEdit}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Quality Check</DialogTitle>
            <DialogDescription>
              Update quality check information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="checkTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a check type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {checkTypes && checkTypes.map((type: QualityCheckType) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.targetStage})
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="passed">Passed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="issueSeverity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Severity (if any)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                      defaultValue={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Only applicable for failed checks</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes or observations" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Quality Check"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this quality check?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quality check
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden Print Container */}
      <div ref={printRef} className="hidden"></div>
    </div>
  );
}