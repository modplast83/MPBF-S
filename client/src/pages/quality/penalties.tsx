import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle,
  Calendar,
  CheckCircle2, 
  CircleDollarSign, 
  Clock,
  FileWarning, 
  Gavel,
  Plus, 
  UserMinus,
  XCircle
} from "lucide-react";
import { QualityPenalty, QualityViolation } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { insertQualityPenaltySchema } from "@shared/schema";
import { z } from "zod";

// Create form schema with validation
const penaltyFormSchema = insertQualityPenaltySchema.extend({
  violationId: z.number().min(1, "A violation must be selected"),
  assignedTo: z.string().min(1, "An assignee must be selected"),
  penaltyType: z.enum(["warning", "training", "suspension", "financial", "other"]),
  amount: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["pending", "active", "completed", "appealed", "cancelled"]).default("pending"),
  startDate: z.date().default(() => new Date()),
  endDate: z.date().optional().nullable(),
});

type PenaltyFormValues = z.infer<typeof penaltyFormSchema>;

export default function QualityPenalties() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  // Fetch penalties
  const { data: penalties, isLoading } = useQuery({
    queryKey: ["/api/quality-penalties"],
    queryFn: async () => {
      const response = await fetch("/api/quality-penalties");
      if (!response.ok) {
        throw new Error("Failed to fetch penalties");
      }
      return response.json() as Promise<QualityPenalty[]>;
    }
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
    }
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
    }
  });

  // Create form
  const form = useForm<PenaltyFormValues>({
    resolver: zodResolver(penaltyFormSchema),
    defaultValues: {
      description: "",
      penaltyType: "warning",
      amount: null,
      currency: null,
      status: "pending",
      startDate: new Date(),
      endDate: null,
      assignedTo: "",
    },
  });

  // Reset amount field when penalty type changes
  const watchPenaltyType = form.watch("penaltyType");
  
  // Create penalty mutation
  const createPenalty = useMutation({
    mutationFn: async (data: PenaltyFormValues) => {
      // Make sure we have assignedBy field - will be set by server with current user 
      // if not provided
      const response = await fetch("/api/quality-penalties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
      setShowForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: PenaltyFormValues) => {
    createPenalty.mutate(data);
  };

  // Filter and sort penalties
  const filteredPenalties = penalties?.filter((penalty) => {
    // Status filter
    if (statusFilter !== "all" && penalty.status !== statusFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== "all" && penalty.penaltyType !== typeFilter) {
      return false;
    }

    // Search term filter
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
            Pending
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
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
            Warning
          </Badge>
        );
      case "training":
        return (
          <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 flex items-center gap-1">
            <FileWarning className="h-3 w-3" />
            Training
          </Badge>
        );
      case "suspension":
        return (
          <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 flex items-center gap-1">
            <UserMinus className="h-3 w-3" />
            Suspension
          </Badge>
        );
      case "financial":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 flex items-center gap-1">
            <CircleDollarSign className="h-3 w-3" />
            Financial
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

  return (
    <div className="container mx-auto py-6">
      <PageHeader heading="Quality Penalties" text="Assign and track penalties for quality violations" />
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6 mt-6">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search penalties..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder="Penalty Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="suspension">Suspension</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Assign Penalty
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-red-600" /> Assign Quality Penalty
              </DialogTitle>
              <DialogDescription>
                Create a penalty for a quality violation that occurred during production.
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
                        <FormLabel>Related Violation <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select related violation" />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="penaltyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penalty Type <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select penalty type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="training">Training</SelectItem>
                              <SelectItem value="suspension">Suspension</SelectItem>
                              <SelectItem value="financial">Financial</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchPenaltyType === "financial" && (
                      <>
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Enter penalty amount"
                                  {...field}
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
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="USD">USD</SelectItem>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                  <SelectItem value="SAR">SAR</SelectItem>
                                  <SelectItem value="AED">AED</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned To <span className="text-red-500">*</span></FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users?.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName || user.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchPenaltyType === "suspension" && (
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormDescription>
                              When the suspension period ends
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {watchPenaltyType === "training" && (
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                {...field}
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} 
                              />
                            </FormControl>
                            <FormDescription>
                              When the training must be completed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
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
                        <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed description of the penalty..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide details about the penalty, including reasons, expectations, and any special conditions.
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
                        <FormLabel>Assigned To <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users?.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The employee who will receive this penalty
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPenalty.isPending}>
                    {createPenalty.isPending ? "Submitting..." : "Assign Penalty"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending" className="text-yellow-600">Pending</TabsTrigger>
          <TabsTrigger value="active" className="text-blue-600">Active</TabsTrigger>
          <TabsTrigger value="completed" className="text-green-600">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-slate-600">Cancelled</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <PenaltyTable 
            penalties={filteredPenalties} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
          />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          <PenaltyTable 
            penalties={penalties?.filter(p => p.status === "pending").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
          />
        </TabsContent>
        
        <TabsContent value="active" className="mt-4">
          <PenaltyTable 
            penalties={penalties?.filter(p => p.status === "active").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          <PenaltyTable 
            penalties={penalties?.filter(p => p.status === "completed").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
          />
        </TabsContent>
        
        <TabsContent value="cancelled" className="mt-4">
          <PenaltyTable 
            penalties={penalties?.filter(p => p.status === "cancelled").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Penalty Table Component
function PenaltyTable({ 
  penalties, 
  isLoading,
  getStatusBadge,
  getTypeBadge
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <Clock className="h-8 w-8 text-muted-foreground animate-pulse" />
            <span className="ml-2 text-lg text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!penalties.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col justify-center items-center h-32">
            <Gavel className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No penalties found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[120px]">Start Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              {/* Show amount column for financial penalties */}
              <TableHead className="w-[100px]">Amount</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">End Date</TableHead>
              <TableHead className="w-[120px]">Assigned To</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {penalties.map((penalty) => (
              <TableRow key={penalty.id}>
                <TableCell className="font-medium">#{penalty.id}</TableCell>
                <TableCell>{format(new Date(penalty.startDate), "MMM d, yyyy")}</TableCell>
                <TableCell className="max-w-xs truncate">{penalty.description}</TableCell>
                <TableCell>{getTypeBadge(penalty.penaltyType)}</TableCell>
                <TableCell>
                  {penalty.amount ? (
                    <span className="font-medium">
                      {penalty.amount.toFixed(2)} {penalty.currency || ''}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(penalty.status)}</TableCell>
                <TableCell>
                  {penalty.endDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(penalty.endDate), "MMM d, yyyy")}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{penalty.assignedTo}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}