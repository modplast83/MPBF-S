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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

// Define form schema
const penaltyFormSchema = z.object({
  violationId: z.string().min(1, { message: "Violation is required" }),
  penaltyType: z.string().min(1, { message: "Penalty type is required" }),
  penaltyAmount: z.string().optional(),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  assignedTo: z.string().min(1, { message: "Assignee is required" }),
  status: z.string().min(1, { message: "Status is required" }),
});

export function QualityPenaltiesManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<any>(null);

  // Fetch penalties data
  const { data: penalties, isLoading: penaltiesLoading } = useQuery({
    queryKey: ["/api/quality-penalties"],
    queryFn: async () => {
      const response = await fetch("/api/quality-penalties");
      if (!response.ok) {
        throw new Error("Failed to fetch penalties");
      }
      return response.json();
    }
  });

  // Fetch violations for reference
  const { data: violations, isLoading: violationsLoading } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        throw new Error("Failed to fetch violations");
      }
      return response.json();
    }
  });

  // Fetch users for the assignee dropdown
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
  const form = useForm<z.infer<typeof penaltyFormSchema>>({
    resolver: zodResolver(penaltyFormSchema),
    defaultValues: {
      violationId: "",
      penaltyType: "Financial",
      penaltyAmount: "",
      description: "",
      assignedTo: "",
      status: "Pending",
    },
  });

  // Create new penalty
  const createPenalty = useMutation({
    mutationFn: async (data: z.infer<typeof penaltyFormSchema>) => {
      const response = await fetch("/api/quality-penalties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          penaltyAmount: data.penaltyAmount ? Number(data.penaltyAmount) : null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create penalty");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-penalties"] });
      toast({
        title: t("quality.penalty_created"),
        description: t("quality.penalty_created_successfully"),
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

  // Update penalty 
  const updatePenalty = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof penaltyFormSchema> }) => {
      const response = await fetch(`/api/quality-penalties/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          penaltyAmount: data.penaltyAmount ? Number(data.penaltyAmount) : null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update penalty");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-penalties"] });
      toast({
        title: t("quality.penalty_updated"),
        description: t("quality.penalty_updated_successfully"),
      });
      setSelectedPenalty(null);
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
  const onSubmit = (data: z.infer<typeof penaltyFormSchema>) => {
    if (selectedPenalty) {
      updatePenalty.mutate({ id: selectedPenalty.id, data });
    } else {
      createPenalty.mutate(data);
    }
  };

  // Open dialog for editing
  const handleEdit = (penalty: any) => {
    setSelectedPenalty(penalty);
    form.reset({
      violationId: penalty.violationId?.toString() || "",
      penaltyType: penalty.penaltyType || "Financial",
      penaltyAmount: penalty.penaltyAmount?.toString() || "",
      description: penalty.description || "",
      assignedTo: penalty.assignedTo || "",
      status: penalty.status || "Pending",
    });
    setIsDialogOpen(true);
  };

  // Open dialog for new penalty
  const handleAddNew = () => {
    setSelectedPenalty(null);
    form.reset({
      violationId: "",
      penaltyType: "Financial",
      penaltyAmount: "",
      description: "",
      assignedTo: "",
      status: "Pending",
    });
    setIsDialogOpen(true);
  };

  // Determine badge color based on penalty type
  const getPenaltyTypeBadge = (type: string) => {
    switch (type) {
      case "Financial":
        return "destructive";
      case "Training":
        return "secondary";
      case "Warning":
        return "outline";
      case "Suspension":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Determine badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "Active":
        return "destructive";
      case "Completed":
        return "outline";
      case "Waived":
        return "outline";
      default:
        return "outline";
    }
  };

  // Format penalty amount
  const formatPenaltyAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const isLoading = penaltiesLoading || violationsLoading || usersLoading;

  if (isLoading) {
    return <div className="text-center py-4">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("quality.quality_penalties")}</h3>
        <Button onClick={handleAddNew}>{t("common.add_new")}</Button>
      </div>

      {/* Penalties Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("quality.id")}</TableHead>
                <TableHead>{t("quality.penalty_type")}</TableHead>
                <TableHead>{t("quality.amount")}</TableHead>
                <TableHead>{t("quality.status")}</TableHead>
                <TableHead>{t("quality.assigned_to")}</TableHead>
                <TableHead>{t("quality.issue_date")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penalties && penalties.length > 0 ? (
                penalties.map((penalty: any) => (
                  <TableRow key={penalty.id}>
                    <TableCell className="font-medium">{penalty.id}</TableCell>
                    <TableCell>
                      <Badge variant={getPenaltyTypeBadge(penalty.penaltyType) as any}>
                        {penalty.penaltyType}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPenaltyAmount(penalty.penaltyAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(penalty.status) as any}>
                        {penalty.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{penalty.assignedTo}</TableCell>
                    <TableCell>
                      {penalty.assignedDate
                        ? format(new Date(penalty.assignedDate), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(penalty)}>
                        {t("common.edit")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t("quality.no_penalties")}
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
              {selectedPenalty
                ? t("quality.edit_penalty")
                : t("quality.assign_penalty")}
            </DialogTitle>
            <DialogDescription>
              {selectedPenalty
                ? t("quality.edit_penalty_description")
                : t("quality.assign_penalty_description")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="violationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.violation")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_violation")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {violations?.map((violation: any) => (
                          <SelectItem key={violation.id} value={violation.id.toString()}>
                            {`#${violation.id} - ${violation.description.substring(0, 30)}${violation.description.length > 30 ? '...' : ''}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("quality.violation_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="penaltyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.penalty_type")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_penalty_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Financial">{t("quality.financial")}</SelectItem>
                        <SelectItem value="Training">{t("quality.training")}</SelectItem>
                        <SelectItem value="Warning">{t("quality.warning")}</SelectItem>
                        <SelectItem value="Suspension">{t("quality.suspension")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("quality.penalty_type_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("penaltyType") === "Financial" && (
                <FormField
                  control={form.control}
                  name="penaltyAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quality.penalty_amount")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>{t("quality.amount_description")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("quality.describe_penalty")}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{t("quality.penalty_description_help")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.assigned_to")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_assignee")} />
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.status")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">{t("quality.pending")}</SelectItem>
                        <SelectItem value="Active">{t("quality.active")}</SelectItem>
                        <SelectItem value="Completed">{t("quality.completed")}</SelectItem>
                        <SelectItem value="Waived">{t("quality.waived")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("quality.status_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createPenalty.isPending || updatePenalty.isPending}>
                  {(createPenalty.isPending || updatePenalty.isPending)
                    ? t("common.saving")
                    : selectedPenalty
                      ? t("common.update")
                      : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}