import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Award, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp,
  DollarSign,
  Clock,
  Users
} from "lucide-react";

const rankSchema = z.object({
  name: z.string().min(1, "Rank name is required"),
  level: z.number().min(1, "Level must be at least 1"),
  baseSalary: z.number().min(0, "Base salary must be non-negative"),
  overtimeRate: z.number().min(1, "Overtime rate must be at least 1.0"),
  maxOvertimeHours: z.number().min(0, "Max overtime hours must be non-negative"),
  benefits: z.string().optional(),
  description: z.string().optional()
});

type RankForm = z.infer<typeof rankSchema>;

export default function EmployeeRanks() {
  const { toast } = useToast();
  const [selectedRank, setSelectedRank] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch employee ranks
  const { data: ranks = [], isLoading } = useQuery({
    queryKey: ['/api/hr/employee-ranks'],
    queryFn: () => apiRequest('GET', '/api/hr/employee-ranks')
  });

  // Form setup
  const form = useForm<RankForm>({
    resolver: zodResolver(rankSchema),
    defaultValues: {
      overtimeRate: 1.5,
      maxOvertimeHours: 20,
      baseSalary: 0
    }
  });

  // Create rank mutation
  const createRankMutation = useMutation({
    mutationFn: (data: RankForm) => 
      apiRequest('POST', '/api/hr/employee-ranks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/employee-ranks'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Employee rank created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee rank",
        variant: "destructive"
      });
    }
  });

  // Update rank mutation
  const updateRankMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: RankForm }) =>
      apiRequest('PUT', `/api/hr/employee-ranks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/employee-ranks'] });
      setIsDialogOpen(false);
      setSelectedRank(null);
      form.reset();
      toast({
        title: "Success",
        description: "Employee rank updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee rank",
        variant: "destructive"
      });
    }
  });

  // Delete rank mutation
  const deleteRankMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/hr/employee-ranks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/employee-ranks'] });
      toast({
        title: "Success",
        description: "Employee rank deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee rank",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: RankForm) => {
    if (selectedRank) {
      updateRankMutation.mutate({ id: selectedRank.id, data });
    } else {
      createRankMutation.mutate(data);
    }
  };

  const handleEdit = (rank: any) => {
    setSelectedRank(rank);
    form.reset({
      name: rank.name,
      level: rank.level,
      baseSalary: rank.baseSalary || 0,
      overtimeRate: rank.overtimeRate || 1.5,
      maxOvertimeHours: rank.maxOvertimeHours || 20,
      benefits: rank.benefits || "",
      description: rank.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this rank? This action cannot be undone.")) {
      deleteRankMutation.mutate(id);
    }
  };

  const getLevelBadgeColor = (level: number) => {
    if (level <= 2) return "bg-gray-100 text-gray-800";
    if (level <= 4) return "bg-blue-100 text-blue-800";
    if (level <= 6) return "bg-green-100 text-green-800";
    if (level <= 8) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Ranks & Levels</h1>
          <p className="text-gray-600 mt-2">Manage employee hierarchies, salary scales, and overtime policies</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedRank(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rank
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedRank ? "Edit Employee Rank" : "Create New Employee Rank"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rank Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Senior Machine Operator" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="10" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="baseSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Salary (SAR/month)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="100" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overtimeRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overtime Rate (multiplier)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="3" 
                            step="0.1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 1.5)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxOvertimeHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Overtime Hours (per month)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="60" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="benefits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Benefits</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Health insurance, annual bonus, performance incentives..."
                          rows={3}
                        />
                      </FormControl>
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
                          {...field} 
                          placeholder="Role responsibilities and requirements..."
                          rows={3}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRankMutation.isPending || updateRankMutation.isPending}
                  >
                    {createRankMutation.isPending || updateRankMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ranks</p>
                <p className="text-3xl font-bold text-gray-900">{ranks.length}</p>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Base Salary</p>
                <p className="text-3xl font-bold text-gray-900">
                  {ranks.length > 0 
                    ? Math.round(ranks.reduce((sum: number, rank: any) => sum + (rank.baseSalary || 0), 0) / ranks.length).toLocaleString()
                    : "0"
                  } SAR
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Overtime Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {ranks.length > 0 
                    ? (ranks.reduce((sum: number, rank: any) => sum + (rank.overtimeRate || 1.5), 0) / ranks.length).toFixed(1)
                    : "1.5"
                  }x
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Max Level</p>
                <p className="text-3xl font-bold text-gray-900">
                  {ranks.length > 0 
                    ? Math.max(...ranks.map((rank: any) => rank.level))
                    : "0"
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Employee Ranks ({ranks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading ranks...</div>
          ) : ranks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employee ranks found. Create your first rank to establish the hierarchy system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Overtime Rate</TableHead>
                    <TableHead>Max OT Hours</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranks
                    .sort((a: any, b: any) => a.level - b.level)
                    .map((rank: any) => (
                      <TableRow key={rank.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rank.name}</div>
                            {rank.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {rank.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getLevelBadgeColor(rank.level)}>
                            Level {rank.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {rank.baseSalary ? `${rank.baseSalary.toLocaleString()} SAR` : "Not set"}
                          </div>
                          <div className="text-sm text-gray-500">per month</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{rank.overtimeRate || 1.5}x</div>
                          <div className="text-sm text-gray-500">hourly rate</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{rank.maxOvertimeHours || 20}h</div>
                          <div className="text-sm text-gray-500">per month</div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm">
                            {rank.benefits || "No benefits specified"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(rank)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(rank.id)}
                              disabled={deleteRankMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </div>
  );
}