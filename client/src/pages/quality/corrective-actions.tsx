import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, CheckCircle2, ClockIcon, RotateCcw, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface CorrectiveAction {
  id: number;
  qualityCheckId: number;
  assignedTo: string;
  description: string;
  status: string;
  dueDate: string | null;
  completedDate: string | null;
  verifiedBy: string | null;
  notes: string | null;
}

interface QualityCheck {
  id: number;
  checkTypeId: string;
  rollId: string | null;
  jobOrderId: number | null;
  status: string;
  issueSeverity: string | null;
}

interface User {
  id: string;
  name: string;
}

const formSchema = z.object({
  qualityCheckId: z.number().min(1, "Quality check is required"),
  assignedTo: z.string().min(1, "Assignee is required"),
  description: z.string().min(1, "Description is required"),
  status: z.string().min(1, "Status is required"),
  dueDate: z.date().nullable(),
  notes: z.string().nullable(),
});

export default function CorrectiveActions() {
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qualityCheckId: 0,
      assignedTo: "",
      description: "",
      status: "open",
      dueDate: null,
      notes: "",
    }
  });

  const { data: actions, isLoading } = useQuery({
    queryKey: ["/api/corrective-actions"],
    refetchOnWindowFocus: false,
  });

  const { data: qualityChecks } = useQuery({
    queryKey: ["/api/quality-checks"],
    refetchOnWindowFocus: false,
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return await apiRequest("POST", "/api/corrective-actions", {
        ...values,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Corrective action created successfully",
      });
      setIsOpenCreate(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create corrective action",
        variant: "destructive",
      });
      console.error("Error creating corrective action:", error);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, verifiedBy }: { id: number, status: string, verifiedBy?: string }) => {
      return await apiRequest("PATCH", `/api/corrective-actions/${id}`, {
        status,
        verifiedBy,
        completedDate: status === 'completed' ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Corrective action status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update corrective action status",
        variant: "destructive",
      });
      console.error("Error updating corrective action status:", error);
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };

  const handleUpdateStatus = (id: number, newStatus: string, currentUserId: string) => {
    updateStatusMutation.mutate({
      id,
      status: newStatus,
      verifiedBy: newStatus === 'verified' ? currentUserId : undefined
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Open</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'verified':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Verified</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      case 'in-progress':
        return <RotateCcw className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'verified':
        return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const filteredActions = actions && actions.filter((action: CorrectiveAction) => {
    if (activeTab === 'all') return true;
    return action.status === activeTab;
  });

  const getQualityCheckInfo = (id: number) => {
    const check = qualityChecks?.find((check: QualityCheck) => check.id === id);
    if (!check) return `QC #${id}`;
    
    const severity = check.issueSeverity ? ` (${check.issueSeverity})` : '';
    return `QC #${id}${severity}`;
  };

  const getUserName = (id: string) => {
    const user = users?.find((u: User) => u.id === id);
    return user ? user.name : id;
  };

  // Using the first user as current user (for demo purposes)
  const currentUser = users && users.length > 0 ? users[0] : { id: "U0001" };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader heading="Corrective Actions" text="Track and manage actions to address quality issues" />
        <Dialog open={isOpenCreate} onOpenChange={setIsOpenCreate}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Corrective Action
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Corrective Action</DialogTitle>
              <DialogDescription>
                Define an action to address a quality issue
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="qualityCheckId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Check</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a quality check" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {qualityChecks && qualityChecks
                            .filter((check: QualityCheck) => check.status === 'failed')
                            .map((check: QualityCheck) => (
                              <SelectItem key={check.id} value={check.id.toString()}>
                                Check #{check.id} - {check.issueSeverity || 'Issue'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select a failed quality check to address</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the corrective action needed" 
                          {...field} 
                        />
                      </FormControl>
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
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select a date</span>
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
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Optional: Set a due date for this action</FormDescription>
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
                          placeholder="Additional notes or instructions" 
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
                    {createMutation.isPending ? "Creating..." : "Create Corrective Action"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 rounded-lg border">
          <TabsTrigger value="all">
            All Actions
          </TabsTrigger>
          <TabsTrigger value="open">
            Open
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-8">Loading corrective actions...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActions && filteredActions.length > 0 ? (
            filteredActions.map((action: CorrectiveAction) => (
              <Card key={action.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(action.status)}
                      Action #{action.id}
                    </CardTitle>
                    {getStatusBadge(action.status)}
                  </div>
                  <CardDescription>
                    {getQualityCheckInfo(action.qualityCheckId)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                      <p>{getUserName(action.assignedTo)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                      <p>{action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'Not set'}</p>
                    </div>
                  </div>
                  {action.verifiedBy && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Verified By</p>
                      <p>{getUserName(action.verifiedBy)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{action.description}</p>
                  </div>
                  {action.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-sm">{action.notes}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  {action.status === 'open' && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleUpdateStatus(action.id, 'in-progress', currentUser.id)}
                    >
                      Start Work
                    </Button>
                  )}
                  {action.status === 'in-progress' && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleUpdateStatus(action.id, 'completed', currentUser.id)}
                    >
                      Mark Completed
                    </Button>
                  )}
                  {action.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleUpdateStatus(action.id, 'verified', currentUser.id)}
                    >
                      Verify
                    </Button>
                  )}
                  {action.status === 'verified' && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      disabled
                    >
                      Completed & Verified
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 border rounded-md bg-gray-50">
              No corrective actions found. Create a new action to address quality issues.
            </div>
          )}
        </div>
      )}
    </div>
  );
}