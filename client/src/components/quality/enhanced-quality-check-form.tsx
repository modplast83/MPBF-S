import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Checkbox
} from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Define form schema
const checkFormSchema = z.object({
  checkTypeId: z.string().min(1, { message: "Check type is required" }),
  performedBy: z.string().min(1, { message: "Performer is required" }),
  rollId: z.string().min(1, { message: "Roll is required" }),
  jobOrderId: z.string().min(1, { message: "Job order is required" }),
  checkDate: z.date({
    required_error: "Check date is required",
  }),
  passed: z.boolean({
    required_error: "Pass/fail status is required",
  }),
  notes: z.string().optional(),
});

export function QualityCheckForm({ checkTypes, rolls, jobOrders }: { 
  checkTypes: any[],
  rolls: any[],
  jobOrders: any[]
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [checkDetails, setCheckDetails] = useState<any>(null);

  // Fetch quality checks data
  const { data: checks, isLoading: checksLoading } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    }
  });

  // Fetch users for the performer dropdown
  const { data: users, isLoading: usersLoading } = useQuery({
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
  const form = useForm<z.infer<typeof checkFormSchema>>({
    resolver: zodResolver(checkFormSchema),
    defaultValues: {
      checkTypeId: "",
      performedBy: "",
      rollId: "",
      jobOrderId: "",
      checkDate: new Date(),
      passed: false,
      notes: "",
    },
  });

  // Create new quality check
  const createCheck = useMutation({
    mutationFn: async (data: z.infer<typeof checkFormSchema>) => {
      const response = await fetch("/api/quality-checks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create quality check");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
      toast({
        title: t("quality.check_created"),
        description: t("quality.check_created_successfully"),
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update quality check 
  const updateCheck = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof checkFormSchema> }) => {
      const response = await fetch(`/api/quality-checks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update quality check");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
      toast({
        title: t("quality.check_updated"),
        description: t("quality.check_updated_successfully"),
      });
      setSelectedCheck(null);
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof checkFormSchema>) => {
    if (selectedCheck) {
      updateCheck.mutate({ id: selectedCheck.id, data });
    } else {
      createCheck.mutate(data);
    }
  };

  // Open dialog for editing
  const handleEdit = (check: any) => {
    setSelectedCheck(check);
    form.reset({
      checkTypeId: check.checkTypeId.toString(),
      performedBy: check.performedBy,
      rollId: check.rollId,
      jobOrderId: check.jobOrderId.toString(),
      checkDate: check.checkDate ? new Date(check.checkDate) : new Date(),
      passed: check.passed,
      notes: check.notes || "",
    });
    setIsDialogOpen(true);
  };

  // Open dialog for new check
  const handleAddNew = () => {
    setSelectedCheck(null);
    form.reset({
      checkTypeId: "",
      performedBy: "",
      rollId: "",
      jobOrderId: "",
      checkDate: new Date(),
      passed: false,
      notes: "",
    });
    setIsDialogOpen(true);
  };

  // View check details
  const handleViewDetails = (check: any) => {
    setCheckDetails(check);
    setViewDetailsOpen(true);
  };

  // Get check type name by ID
  const getCheckTypeName = (id: string) => {
    const checkType = checkTypes.find(type => type.id === id);
    return checkType ? checkType.name : id;
  };

  // Get roll info by ID
  const getRollInfo = (id: string) => {
    const roll = rolls.find(roll => roll.id === id);
    return roll ? `${roll.id} (${roll.serialNumber || 'No SN'})` : id;
  };

  // Get job order info by ID
  const getJobOrderInfo = (id: number) => {
    const jobOrder = jobOrders.find(jo => jo.id === id);
    return jobOrder ? `JO #${jobOrder.id}` : `JO #${id}`;
  };

  // Get user name by ID
  const getUserName = (id: string) => {
    const user = users?.find(user => user.id === id);
    return user ? user.username : id;
  };

  const isLoading = checksLoading || usersLoading;

  if (isLoading) {
    return <div className="text-center py-4">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("quality.quality_checks")}</h3>
        <Button onClick={handleAddNew}>{t("common.add_new")}</Button>
      </div>

      {/* Checks Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("quality.id")}</TableHead>
                <TableHead>{t("quality.check_type")}</TableHead>
                <TableHead>{t("quality.result")}</TableHead>
                <TableHead>{t("quality.roll")}</TableHead>
                <TableHead>{t("quality.performed_by")}</TableHead>
                <TableHead>{t("quality.date")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks && checks.length > 0 ? (
                checks.map((check: any) => (
                  <TableRow key={check.id}>
                    <TableCell className="font-medium">{check.id}</TableCell>
                    <TableCell>
                      {getCheckTypeName(check.checkTypeId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={check.passed ? "outline" : "destructive"}>
                        {check.passed ? t("quality.passed") : t("quality.failed")}
                      </Badge>
                    </TableCell>
                    <TableCell>{getRollInfo(check.rollId)}</TableCell>
                    <TableCell>{getUserName(check.performedBy)}</TableCell>
                    <TableCell>
                      {check.checkDate
                        ? format(new Date(check.checkDate), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(check)}>
                          {t("common.details")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(check)}>
                          {t("common.edit")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t("quality.no_checks")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCheck
                ? t("quality.edit_check")
                : t("quality.create_check")}
            </DialogTitle>
            <DialogDescription>
              {selectedCheck
                ? t("quality.edit_check_description")
                : t("quality.create_check_description")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="checkTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.check_type")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_check_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {checkTypes?.map((type: any) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("quality.check_type_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("quality.passed")}</FormLabel>
                      <FormDescription>
                        {t("quality.passed_description")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("quality.check_date")}</FormLabel>
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
                              <span>{t("quality.pick_a_date")}</span>
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>{t("quality.check_date_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="performedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.performed_by")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_performer")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((user: any) => (
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

              <FormField
                control={form.control}
                name="rollId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.roll")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_roll")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rolls?.map((roll: any) => (
                          <SelectItem key={roll.id} value={roll.id}>
                            {roll.id} ({roll.serialNumber || 'No SN'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("quality.roll_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.job_order")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_job_order")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobOrders?.map((jo: any) => (
                          <SelectItem key={jo.id} value={jo.id.toString()}>
                            JO #{jo.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("quality.job_order_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("quality.check_notes_placeholder")}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{t("quality.notes_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createCheck.isPending || updateCheck.isPending}>
                  {(createCheck.isPending || updateCheck.isPending)
                    ? t("common.saving")
                    : selectedCheck
                      ? t("common.update")
                      : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("quality.check_details")}</DialogTitle>
            <DialogDescription>
              {t("quality.check_id")}: {checkDetails?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">{t("quality.status")}:</h4>
                <Badge variant={checkDetails?.passed ? "outline" : "destructive"}>
                  {checkDetails?.passed ? t("quality.passed") : t("quality.failed")}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium">{t("quality.check_type")}:</h4>
                <p className="text-sm">{checkDetails ? getCheckTypeName(checkDetails.checkTypeId) : ''}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">{t("quality.performed_by")}:</h4>
                <p className="text-sm">{checkDetails ? getUserName(checkDetails.performedBy) : ''}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">{t("quality.check_date")}:</h4>
                <p className="text-sm">
                  {checkDetails?.checkDate
                    ? format(new Date(checkDetails.checkDate), "PPP")
                    : '-'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">{t("quality.job_order")}:</h4>
                <p className="text-sm">{checkDetails ? getJobOrderInfo(checkDetails.jobOrderId) : ''}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">{t("quality.roll")}:</h4>
                <p className="text-sm">{checkDetails ? getRollInfo(checkDetails.rollId) : ''}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium">{t("quality.notes")}:</h4>
              <p className="text-sm">{checkDetails?.notes || t("quality.no_notes")}</p>
            </div>

            <DialogFooter>
              <Button onClick={() => handleEdit(checkDetails)} size="sm">
                {t("common.edit")}
              </Button>
              <Button onClick={() => setViewDetailsOpen(false)} variant="outline" size="sm">
                {t("common.close")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}