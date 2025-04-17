import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, FileText, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
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
}

interface JobOrder {
  id: number;
  orderId: number;
  customerProductId: number;
}

interface User {
  id: string;
  name: string;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  
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

  const { data: checks, isLoading } = useQuery({
    queryKey: ["/api/quality-checks"],
    refetchOnWindowFocus: false,
  });

  const { data: checkTypes } = useQuery({
    queryKey: ["/api/quality-check-types"],
    refetchOnWindowFocus: false,
  });

  const { data: rolls } = useQuery({
    queryKey: ["/api/rolls"],
    refetchOnWindowFocus: false,
  });

  const { data: jobOrders } = useQuery({
    queryKey: ["/api/job-orders"],
    refetchOnWindowFocus: false,
  });

  const { data: users } = useQuery({
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
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
    return user ? user.name : id;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader heading="Quality Checks" text="Record and track quality inspections across production stages" />
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
                    name="rollId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll ID</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                          defaultValue={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a roll" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {rolls && rolls.map((roll: Roll) => (
                              <SelectItem key={roll.id} value={roll.id}>
                                {roll.id} - {roll.currentStage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Optional - select if checking a specific roll</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jobOrderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Order ID</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
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
                              {user.name}
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
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full">View Details</Button>
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
    </div>
  );
}