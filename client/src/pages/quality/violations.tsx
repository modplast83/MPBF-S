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
  FileWarning, 
  Plus, 
  Search,
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock
} from "lucide-react";
import { QualityViolation } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { insertQualityViolationSchema } from "@shared/schema";
import { z } from "zod";

// Create form schema with validation
const violationFormSchema = insertQualityViolationSchema.extend({
  qualityCheckId: z.number().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  impact: z.string().min(5, "Impact statement must be at least 5 characters"),
  status: z.enum(["reported", "investigating", "resolved", "dismissed"]).default("reported"),
});

type ViolationFormValues = z.infer<typeof violationFormSchema>;

export default function QualityViolations() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [violationToPrint, setViolationToPrint] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [violationToDelete, setViolationToDelete] = useState(null);

  // Fetch violations
  const { data: violations, isLoading } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        throw new Error("Failed to fetch violations");
      }
      return response.json() as Promise<QualityViolation[]>;
    }
  });

  // Fetch users for reportedBy dropdown
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

  // Fetch quality checks for reference
  const { data: qualityChecks } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    }
  });

  // Create form
  const form = useForm<ViolationFormValues>({
    resolver: zodResolver(violationFormSchema),
    defaultValues: {
      description: "",
      severity: "medium",
      impact: "",
      status: "reported",
    },
  });

  // Create violation mutation
  const createViolation = useMutation({
    mutationFn: async (data: ViolationFormValues) => {
      // Add reportDate if not already in the data
      if (!data.reportDate) {
        data.reportDate = new Date();
      }
      
      const response = await fetch("/api/quality-violations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create violation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Violation Reported",
        description: "The quality violation has been successfully reported.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/quality-violations"],
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
  
  // Delete violation mutation
  const deleteViolation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/quality-violations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete violation");
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Violation Deleted",
        description: "The quality violation has been successfully deleted.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/quality-violations"],
      });
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
  const onSubmit = (data: ViolationFormValues) => {
    createViolation.mutate(data);
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (id: number) => {
    setViolationToDelete(id);
    setShowDeleteDialog(true);
  };
  
  // Handle confirmed deletion
  const handleConfirmDelete = () => {
    if (violationToDelete) {
      deleteViolation.mutate(violationToDelete);
      setShowDeleteDialog(false);
      setViolationToDelete(null);
    }
  };
  
  // Handle print violation
  const handlePrintViolation = (violation) => {
    setViolationToPrint(violation);
    setTimeout(() => {
      window.print();
      setViolationToPrint(null);
    }, 100);
  };

  // Filter and sort violations
  const filteredViolations = violations?.filter((violation) => {
    // Status filter
    if (statusFilter !== "all" && violation.status !== statusFilter) {
      return false;
    }

    // Severity filter
    if (severityFilter !== "all" && violation.severity !== severityFilter) {
      return false;
    }

    // Search term filter
    if (searchTerm && !violation.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Sort by date (newest first)
    return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
  }) || [];

  // Handle status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reported":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Reported
          </Badge>
        );
      case "investigating":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
            <Search className="h-3 w-3" />
            Investigating
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Dismissed
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

  // Handle severity badge styling
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
            Low
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
            Medium
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
            High
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
            Critical
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
            {severity}
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader heading="Quality Violations" text="Report and track quality violations in the production process" />
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6 mt-6">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search violations..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Report Violation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-orange-600" /> Report Quality Violation
              </DialogTitle>
              <DialogDescription>
                Document a quality violation that occurred during production.
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
                        <FormLabel>Related Quality Check (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select related quality check" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {qualityChecks?.map((check) => (
                              <SelectItem key={check.id} value={check.id.toString()}>
                                ID: {check.id} - {check.checkType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link this violation to an existing quality check if applicable.
                        </FormDescription>
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
                            placeholder="Detailed description of the quality violation..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a clear description of the quality violation and how it was detected.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Severity <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select severity level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
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
                          <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="reported">Reported</SelectItem>
                              <SelectItem value="investigating">Investigating</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="dismissed">Dismissed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="impact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Impact <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the impact on production, quality, or customer satisfaction..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Explain how this violation affects the business, product quality, or customer satisfaction.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reportedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reported By</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reporter" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createViolation.isPending}>
                    {createViolation.isPending ? "Submitting..." : "Submit Report"}
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
          <TabsTrigger value="reported" className="text-yellow-600">Reported</TabsTrigger>
          <TabsTrigger value="investigating" className="text-blue-600">Investigating</TabsTrigger>
          <TabsTrigger value="resolved" className="text-green-600">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed" className="text-slate-600">Dismissed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <ViolationTable 
            violations={filteredViolations} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getSeverityBadge={getSeverityBadge}
            onDelete={handleDeleteClick}
            onPrint={handlePrintViolation}
          />
        </TabsContent>
        
        <TabsContent value="reported" className="mt-4">
          <ViolationTable 
            violations={violations?.filter(v => v.status === "reported").sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()) || []} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getSeverityBadge={getSeverityBadge}
            onDelete={handleDeleteClick}
            onPrint={handlePrintViolation}
          />
        </TabsContent>
        
        <TabsContent value="investigating" className="mt-4">
          <ViolationTable 
            violations={violations?.filter(v => v.status === "investigating").sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()) || []} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getSeverityBadge={getSeverityBadge}
            onDelete={handleDeleteClick}
            onPrint={handlePrintViolation}
          />
        </TabsContent>
        
        <TabsContent value="resolved" className="mt-4">
          <ViolationTable 
            violations={violations?.filter(v => v.status === "resolved").sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()) || []} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getSeverityBadge={getSeverityBadge}
            onDelete={handleDeleteClick}
            onPrint={handlePrintViolation}
          />
        </TabsContent>
        
        <TabsContent value="dismissed" className="mt-4">
          <ViolationTable 
            violations={violations?.filter(v => v.status === "dismissed").sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()) || []} 
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getSeverityBadge={getSeverityBadge}
            onDelete={handleDeleteClick}
            onPrint={handlePrintViolation}
          />
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quality violation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 pb-2">
            <p className="text-sm text-muted-foreground mb-4">
              Deleting this violation will permanently remove it from the system along with all associated records.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteViolation.isPending}
            >
              {deleteViolation.isPending ? "Deleting..." : "Delete Violation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Print View (Hidden unless printing) */}
      {violationToPrint && (
        <div className="hidden print:block p-6">
          <div className="max-w-4xl mx-auto border border-gray-200 p-6 rounded-md">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">Quality Violation Report</h1>
                <p className="text-sm text-gray-500">ID: #{violationToPrint.id}</p>
                <p className="text-sm text-gray-500">Date: {format(new Date(violationToPrint.reportDate), "MMMM d, yyyy")}</p>
              </div>
              <div className="text-right">
                <div className="inline-block mb-2">
                  {getSeverityBadge(violationToPrint.severity)}
                </div>
                <div className="inline-block ml-2">
                  {getStatusBadge(violationToPrint.status)}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-800 whitespace-pre-wrap">{violationToPrint.description}</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Business Impact</h2>
              <p className="text-gray-800 whitespace-pre-wrap">{violationToPrint.impact}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Details</h2>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 font-medium">Reported By:</td>
                      <td>{violationToPrint.reportedBy}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Type:</td>
                      <td>{violationToPrint.violationType}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Area:</td>
                      <td>{violationToPrint.affectedArea}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                {violationToPrint.rootCause && (
                  <>
                    <h2 className="text-lg font-semibold mb-2">Root Cause</h2>
                    <p className="text-gray-800 whitespace-pre-wrap">{violationToPrint.rootCause}</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
              <p>This is an official quality violation report generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
              <p>Modern Plastic Bag Factory Quality Management System</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Violation Table Component
function ViolationTable({ 
  violations, 
  isLoading,
  getStatusBadge,
  getSeverityBadge,
  onDelete,
  onPrint
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
  
  if (!violations.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col justify-center items-center h-32">
            <ShieldAlert className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No quality violations found.</p>
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
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Severity</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Reporter</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {violations.map((violation) => (
              <TableRow key={violation.id}>
                <TableCell className="font-medium">#{violation.id}</TableCell>
                <TableCell>{format(new Date(violation.reportDate), "MMM d, yyyy")}</TableCell>
                <TableCell className="max-w-md truncate">{violation.description}</TableCell>
                <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                <TableCell>{getStatusBadge(violation.status)}</TableCell>
                <TableCell>{violation.reportedBy}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title="Print violation details"
                      onClick={() => onPrint && onPrint(violation)}
                    >
                      <FileWarning className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete violation"
                      onClick={() => onDelete && onDelete(violation.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}