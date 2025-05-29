import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Star, Award, TrendingUp, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmployeeOfMonth, User } from "@shared/schema";

const employeeOfMonthSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  obligationPoints: z.number().min(0),
  qualityScore: z.number().min(0).max(100),
  attendanceScore: z.number().min(0).max(100),
  productivityScore: z.number().min(0).max(100),
  reward: z.string().optional(),
  rewardAmount: z.number().optional(),
  notes: z.string().optional()
});

type EmployeeOfMonthForm = z.infer<typeof employeeOfMonthSchema>;

export default function EmployeeOfMonthPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<EmployeeOfMonthForm>({
    resolver: zodResolver(employeeOfMonthSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      obligationPoints: 0,
      qualityScore: 0,
      attendanceScore: 0,
      productivityScore: 0
    }
  });

  // Get employee of month records
  const { data: employeeRecords, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.EMPLOYEE_OF_MONTH, selectedYear],
    queryFn: () => apiRequest(`${API_ENDPOINTS.EMPLOYEE_OF_MONTH}/year/${selectedYear}`)
  });

  // Get users for selection
  const { data: users } = useQuery({
    queryKey: [API_ENDPOINTS.USERS],
    queryFn: () => apiRequest(API_ENDPOINTS.USERS)
  });

  // Create employee of month mutation
  const createEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeOfMonthForm) => {
      const totalScore = (data.qualityScore + data.attendanceScore + data.productivityScore) / 3;
      return apiRequest(API_ENDPOINTS.EMPLOYEE_OF_MONTH, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          totalScore
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.EMPLOYEE_OF_MONTH] });
      toast({
        title: t("hr.common.success"),
        description: "Employee of month record created successfully"
      });
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const onSubmit = (data: EmployeeOfMonthForm) => {
    createEmployeeMutation.mutate(data);
  };

  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1];
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    
    const rankColors = {
      1: "bg-yellow-100 text-yellow-800 border-yellow-300",
      2: "bg-gray-100 text-gray-800 border-gray-300",
      3: "bg-orange-100 text-orange-800 border-orange-300"
    };
    
    const color = rankColors[rank as keyof typeof rankColors] || "bg-blue-100 text-blue-800 border-blue-300";
    
    return (
      <Badge className={`${color} border`}>
        #{rank}
      </Badge>
    );
  };

  const topPerformers = employeeRecords?.slice(0, 3) || [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t("hr.employee_of_month.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t("hr.employee_of_month.performance_evaluation")}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("hr.employee_of_month.award_employee")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("hr.employee_of_month.performance_evaluation")}</DialogTitle>
                <DialogDescription>
                  Evaluate and award employee performance for the month
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("hr.common.employee")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users?.map((user: User) => (
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.employee_of_month.month")}</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  {getMonthName(i + 1)}
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
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.employee_of_month.year")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="obligationPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("hr.employee_of_month.obligation_points")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="qualityScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.employee_of_month.quality_score")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="attendanceScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.employee_of_month.attendance_score")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="productivityScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("hr.employee_of_month.productivity_score")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("hr.employee_of_month.reward")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rewardAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("hr.employee_of_month.reward_amount")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("hr.common.notes")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createEmployeeMutation.isPending}
                    >
                      {createEmployeeMutation.isPending ? t("hr.common.loading") : t("hr.common.save")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {topPerformers.map((employee: EmployeeOfMonth, index) => (
            <Card key={employee.id} className={index === 0 ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950" : ""}>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  {index === 0 ? (
                    <Trophy className="h-12 w-12 text-yellow-500" />
                  ) : index === 1 ? (
                    <Award className="h-12 w-12 text-gray-400" />
                  ) : (
                    <Star className="h-12 w-12 text-orange-500" />
                  )}
                </div>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <span>{employee.userId}</span>
                  {getRankBadge(index + 1)}
                </CardTitle>
                <CardDescription>
                  {getMonthName(employee.month)} {employee.year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t("hr.employee_of_month.total_score")}</span>
                    <span className="font-bold">{employee.totalScore?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("hr.employee_of_month.obligation_points")}</span>
                    <span>{employee.obligationPoints}</span>
                  </div>
                  {employee.reward && (
                    <div className="flex justify-between">
                      <span>{t("hr.employee_of_month.reward")}</span>
                      <span>{employee.reward}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Year Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5" />
          <Select onValueChange={(value) => setSelectedYear(parseInt(value))} defaultValue={selectedYear.toString()}>
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{t("hr.employee_of_month.performance_metrics")}</span>
          </CardTitle>
          <CardDescription>
            Employee performance records for {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">{t("hr.common.loading")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("hr.common.employee")}</TableHead>
                  <TableHead>{t("hr.employee_of_month.month")}</TableHead>
                  <TableHead>{t("hr.employee_of_month.obligation_points")}</TableHead>
                  <TableHead>{t("hr.employee_of_month.quality_score")}</TableHead>
                  <TableHead>{t("hr.employee_of_month.attendance_score")}</TableHead>
                  <TableHead>{t("hr.employee_of_month.productivity_score")}</TableHead>
                  <TableHead>{t("hr.employee_of_month.total_score")}</TableHead>
                  <TableHead>{t("hr.employee_of_month.rank")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeRecords?.map((record: EmployeeOfMonth) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.userId}</TableCell>
                    <TableCell>{getMonthName(record.month)}</TableCell>
                    <TableCell>{record.obligationPoints}</TableCell>
                    <TableCell>{record.qualityScore}</TableCell>
                    <TableCell>{record.attendanceScore}</TableCell>
                    <TableCell>{record.productivityScore}</TableCell>
                    <TableCell className="font-bold">{record.totalScore?.toFixed(1) || '0.0'}</TableCell>
                    <TableCell>{getRankBadge(record.rank)}</TableCell>
                  </TableRow>
                ))}
                {(!employeeRecords || employeeRecords.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      {t("hr.common.no_data")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}