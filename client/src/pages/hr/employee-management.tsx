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

const userSchema = z.object({
  id: z.string(),
  username: z.string().min(1, "Username is required"),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  sectionId: z.string().optional(),

  position: z.string().optional(),
  hireDate: z.string().optional(),
  contractType: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
  workSchedule: z.object({
    startTime: z.string().default("08:00"),
    endTime: z.string().default("17:00"),
    workingDays: z.array(z.string()).default(["monday", "tuesday", "wednesday", "thursday", "friday"]),
    breakDuration: z.number().default(1)
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

type UserForm = z.infer<typeof userSchema>;

export default function EmployeeManagement() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch users (employees)
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users')
  });



  // Fetch sections
  const { data: sections = [] } = useQuery({
    queryKey: ['/api/sections'],
    queryFn: () => apiRequest('GET', '/api/sections')
  });

  // Form setup
  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: "",
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      hireDate: new Date().toISOString().split('T')[0],
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

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<UserForm> }) =>
      apiRequest('PUT', `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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

  const handleSubmit = (data: UserForm) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, data });
    }
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    form.reset({
      id: employee.id || "",
      username: employee.username || "",
      email: employee.email || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      phone: employee.phone || "",
      sectionId: employee.sectionId || "",

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

  const getUserName = (employee: any) => {
    return `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.username;
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
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter username" disabled={!!selectedEmployee} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter first name" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter last name" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Enter email" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                              <SelectContent>
                                {sections?.map((section) => (
                                  <SelectItem key={section.id} value={section.id}>
                                    {section.name}
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
                    disabled={updateEmployeeMutation.isPending}
                  >
                    {updateEmployeeMutation.isPending ? t("common.saving") : t("common.save")}
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
                  {employees.filter((employee: any) => employee.employeeId).map((employee: any) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell>
                        {getUserName(employee)}
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