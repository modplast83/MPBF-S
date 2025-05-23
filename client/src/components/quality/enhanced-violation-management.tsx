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
  DialogTrigger,
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
const violationFormSchema = z.object({
  qualityCheckId: z.string().min(1, { message: "Quality check is required" }),
  severity: z.string().min(1, { message: "Severity is required" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  reportedBy: z.string().min(1, { message: "Reporter is required" }),
  status: z.string().min(1, { message: "Status is required" }),
});

export function QualityViolations() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<any>(null);

  // Fetch violations data
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

  // Fetch quality checks for reference
  const { data: qualityChecks, isLoading: checksLoading } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    }
  });

  // Fetch users for the reporter dropdown
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
  const form = useForm<z.infer<typeof violationFormSchema>>({
    resolver: zodResolver(violationFormSchema),
    defaultValues: {
      qualityCheckId: "",
      severity: "Low",
      description: "",
      reportedBy: "",
      status: "Open",
    },
  });

  // Create new violation
  const createViolation = useMutation({
    mutationFn: async (data: z.infer<typeof violationFormSchema>) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/quality-violations"] });
      toast({
        title: t("quality.violation_created"),
        description: t("quality.violation_created_successfully"),
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

  // Update violation 
  const updateViolation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof violationFormSchema> }) => {
      const response = await fetch(`/api/quality-violations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update violation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-violations"] });
      toast({
        title: t("quality.violation_updated"),
        description: t("quality.violation_updated_successfully"),
      });
      setSelectedViolation(null);
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
  const onSubmit = (data: z.infer<typeof violationFormSchema>) => {
    if (selectedViolation) {
      updateViolation.mutate({ id: selectedViolation.id, data });
    } else {
      createViolation.mutate(data);
    }
  };

  // Open dialog for editing
  const handleEdit = (violation: any) => {
    setSelectedViolation(violation);
    form.reset({
      qualityCheckId: violation.qualityCheckId.toString(),
      severity: violation.severity,
      description: violation.description,
      reportedBy: violation.reportedBy,
      status: violation.status,
    });
    setIsDialogOpen(true);
  };

  // Open dialog for new violation
  const handleAddNew = () => {
    setSelectedViolation(null);
    form.reset({
      qualityCheckId: "",
      severity: "Low",
      description: "",
      reportedBy: "",
      status: "Open",
    });
    setIsDialogOpen(true);
  };

  // Determine badge color based on severity
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "High":
        return "destructive";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  // Determine badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return "destructive";
      case "In Progress":
        return "secondary";
      case "Resolved":
        return "outline";
      case "Closed":
        return "outline";
      default:
        return "outline";
    }
  };

  const isLoading = violationsLoading || checksLoading || usersLoading;

  if (isLoading) {
    return <div className="text-center py-4">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("quality.quality_violations")}</h3>
        <Button onClick={handleAddNew}>{t("common.add_new")}</Button>
      </div>

      {/* Violations Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("quality.id")}</TableHead>
                <TableHead>{t("quality.severity")}</TableHead>
                <TableHead>{t("quality.status")}</TableHead>
                <TableHead>{t("quality.description")}</TableHead>
                <TableHead>{t("quality.reported_by")}</TableHead>
                <TableHead>{t("quality.reported_date")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations && violations.length > 0 ? (
                violations.map((violation: any) => (
                  <TableRow key={violation.id}>
                    <TableCell className="font-medium">{violation.id}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadge(violation.severity) as any}>
                        {violation.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(violation.status) as any}>
                        {violation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{violation.description}</TableCell>
                    <TableCell>{violation.reportedBy}</TableCell>
                    <TableCell>
                      {violation.reportedDate
                        ? format(new Date(violation.reportedDate), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(violation)}>
                        {t("common.edit")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t("quality.no_violations")}
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
              {selectedViolation
                ? t("quality.edit_violation")
                : t("quality.report_violation")}
            </DialogTitle>
            <DialogDescription>
              {selectedViolation
                ? t("quality.edit_violation_description")
                : t("quality.report_violation_description")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="qualityCheckId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.quality_check")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_check")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {qualityChecks?.map((check: any) => (
                          <SelectItem key={check.id} value={check.id.toString()}>
                            {`Check #${check.id} - ${check.passed ? t("quality.passed") : t("quality.failed")}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("quality.check_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.severity")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_severity")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">{t("quality.low")}</SelectItem>
                        <SelectItem value="Medium">{t("quality.medium")}</SelectItem>
                        <SelectItem value="High">{t("quality.high")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("quality.severity_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("quality.describe_violation")}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{t("quality.description_help")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reportedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.reported_by")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_reporter")} />
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
                        <SelectItem value="Open">{t("quality.open")}</SelectItem>
                        <SelectItem value="In Progress">{t("quality.in_progress")}</SelectItem>
                        <SelectItem value="Resolved">{t("quality.resolved")}</SelectItem>
                        <SelectItem value="Closed">{t("quality.closed")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("quality.status_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createViolation.isPending || updateViolation.isPending}>
                  {(createViolation.isPending || updateViolation.isPending)
                    ? t("common.saving")
                    : selectedViolation
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