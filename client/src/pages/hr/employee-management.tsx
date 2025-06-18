import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Award, 
  Clock, 
  Calendar,
  TrendingUp,
  DollarSign,
  MapPin
} from "lucide-react";

const employeeProfileSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  rankId: z.number().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  hireDate: z.string().optional(),
  contractType: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
  workSchedule: z.object({
    startTime: z.string().default("08:00"),
    endTime: z.string().default("17:00"),
    workingDays: z.array(z.string()).default(["monday", "tuesday", "wednesday", "thursday", "friday"]),
    breakDuration: z.number().default(1) // hours
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional(),
  bankDetails: z.object({
    accountNumber: z.string(),
    bankName: z.string(),
    branchName: z.string()
  }).optional(),
  allowances: z.object({
    transport: z.number().default(0),
    housing: z.number().default(0),
    food: z.number().default(0),
    other: z.number().default(0)
  }).optional()
});

type EmployeeProfileForm = z.infer<typeof employeeProfileSchema>;

export default function EmployeeManagement() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch employee profiles
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['/api/hr/employee-profiles'],
    queryFn: () => apiRequest('GET', '/api/hr/employee-profiles')
  });

  // Fetch employee ranks
  const { data: ranks = [] } = useQuery({
    queryKey: ['/api/hr/employee-ranks'],
    queryFn: () => apiRequest('GET', '/api/hr/employee-ranks')
  });

  // Fetch users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users')
  });

  // Form setup
  const form = useForm<EmployeeProfileForm>({
    resolver: zodResolver(employeeProfileSchema),
    defaultValues: {
      contractType: "full_time",
      workSchedule: {
        startTime: "08:00",
        endTime: "17:00",
        workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        breakDuration: 1
      },
      allowances: {
        transport: 0,
        housing: 0,
        food: 0,
        other: 0
      }
    }
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeProfileForm) => 
      apiRequest('POST', '/api/hr/employee-profiles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/employee-profiles'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Employee profile created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee profile",
        variant: "destructive"
      });
    }
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<EmployeeProfileForm> }) =>
      apiRequest('PUT', `/api/hr/employee-profiles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/employee-profiles'] });
      setIsDialogOpen(false);
      setSelectedEmployee(null);
      form.reset();
      toast({
        title: "Success",
        description: "Employee profile updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee profile",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: EmployeeProfileForm) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    form.reset({
      userId: employee.userId,
      employeeId: employee.employeeId,
      rankId: employee.rankId,
      department: employee.department || "",
      position: employee.position || "",
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : "",
      contractType: employee.contractType || "full_time",
      workSchedule: employee.workSchedule || {
        startTime: "08:00",
        endTime: "17:00",
        workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        breakDuration: 1
      },
      emergencyContact: employee.emergencyContact,
      bankDetails: employee.bankDetails,
      allowances: employee.allowances || {
        transport: 0,
        housing: 0,
        food: 0,
        other: 0
      }
    });
    setIsDialogOpen(true);
  };

  const getRankName = (rankId: number) => {
    const rank = ranks.find((r: any) => r.id === rankId);
    return rank ? rank.name : "No Rank";
  };

  const getContractTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      full_time: "bg-green-100 text-green-800",
      part_time: "bg-blue-100 text-blue-800",
      contract: "bg-orange-100 text-orange-800",
      intern: "bg-purple-100 text-purple-800"
    };
    return variants[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("hr.employee_management.title")}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">{t("hr.employee_management.description")}</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedEmployee(null);
              form.reset();
            }} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              {t("hr.employee_management.add_employee")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEmployee ? t("hr.employee_management.edit_profile") : t("hr.employee_management.create_profile")}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t("hr.employee_management.basic_info")}</h3>
                    
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.user")}</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder={t("hr.employee_management.select_user")} />
                              </SelectTrigger>
                              <SelectContent>
                                {users.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.username})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="EMP001" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rankId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rank</FormLabel>
                          <FormControl>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rank" />
                              </SelectTrigger>
                              <SelectContent>
                                {ranks.map((rank: any) => (
                                  <SelectItem key={rank.id} value={rank.id.toString()}>
                                    {rank.name} (Level {rank.level})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Production" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Machine Operator" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hireDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hire Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Type</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full_time">Full Time</SelectItem>
                                <SelectItem value="part_time">Part Time</SelectItem>
                                <SelectItem value="contract">Contract</SelectItem>
                                <SelectItem value="intern">Intern</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Work Schedule and Allowances */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Work Schedule</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="workSchedule.startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="workSchedule.endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="workSchedule.breakDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Break Duration (hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.5" 
                              min="0" 
                              max="4" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <h3 className="text-lg font-semibold mt-6">Monthly Allowances (SAR)</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="allowances.transport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transport</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allowances.housing"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Housing</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allowances.food"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Food</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allowances.other"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Other</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                  >
                    {createEmployeeMutation.isPending || updateEmployeeMutation.isPending ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Profiles ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEmployees ? (
            <div className="text-center py-8">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employee profiles found. Create your first employee profile to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Contract Type</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee: any) => {
                    const user = users.find((u: any) => u.id === employee.userId);
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.employeeId}</TableCell>
                        <TableCell>
                          {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown User'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getRankName(employee.rankId)}
                          </Badge>
                        </TableCell>
                        <TableCell>{employee.department || '-'}</TableCell>
                        <TableCell>{employee.position || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getContractTypeBadge(employee.contractType)}>
                            {employee.contractType?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1 sm:space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(employee)}
                              className="p-1 sm:p-2"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
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
    </div>
  );
}