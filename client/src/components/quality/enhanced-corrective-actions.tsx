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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Define form schema
const actionFormSchema = z.object({
  qualityCheckId: z.string().min(1, { message: "Quality check is required" }),
  action: z.string().min(5, { message: "Action must be at least 5 characters" }),
  implementedBy: z.string().min(1, { message: "Implementer is required" }),
  implementationDate: z.date({
    required_error: "Implementation date is required",
  }),
  verifiedDate: z.date().optional(),
});

export function QualityCorrectiveActions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);

  // Fetch corrective actions data
  const { data: actions, isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/corrective-actions"],
    queryFn: async () => {
      const response = await fetch("/api/corrective-actions");
      if (!response.ok) {
        throw new Error("Failed to fetch corrective actions");
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
  const form = useForm<z.infer<typeof actionFormSchema>>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      qualityCheckId: "",
      action: "",
      implementedBy: "",
      implementationDate: new Date(),
    },
  });

  // Create new corrective action
  const createAction = useMutation({
    mutationFn: async (data: z.infer<typeof actionFormSchema>) => {
      const response = await fetch("/api/corrective-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create corrective action");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
      toast({
        title: t("quality.action_created"),
        description: t("quality.action_created_successfully"),
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

  // Update corrective action 
  const updateAction = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof actionFormSchema> }) => {
      const response = await fetch(`/api/corrective-actions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update corrective action");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
      toast({
        title: t("quality.action_updated"),
        description: t("quality.action_updated_successfully"),
      });
      setSelectedAction(null);
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
  const onSubmit = (data: z.infer<typeof actionFormSchema>) => {
    if (selectedAction) {
      updateAction.mutate({ id: selectedAction.id, data });
    } else {
      createAction.mutate(data);
    }
  };

  // Open dialog for editing
  const handleEdit = (action: any) => {
    setSelectedAction(action);
    form.reset({
      qualityCheckId: action.qualityCheckId.toString(),
      action: action.action,
      implementedBy: action.implementedBy,
      implementationDate: action.implementationDate ? new Date(action.implementationDate) : new Date(),
      verifiedDate: action.verifiedDate ? new Date(action.verifiedDate) : undefined,
    });
    setIsDialogOpen(true);
  };

  // Open dialog for new action
  const handleAddNew = () => {
    setSelectedAction(null);
    form.reset({
      qualityCheckId: "",
      action: "",
      implementedBy: "",
      implementationDate: new Date(),
    });
    setIsDialogOpen(true);
  };

  // Verify the corrective action
  const verifyAction = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/corrective-actions/${id}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verifiedDate: new Date() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify corrective action");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
      toast({
        title: t("quality.action_verified"),
        description: t("quality.action_verified_successfully"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleVerify = (id: number) => {
    verifyAction.mutate(id);
  };

  const isLoading = actionsLoading || checksLoading || usersLoading;

  if (isLoading) {
    return <div className="text-center py-4">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("quality.corrective_actions")}</h3>
        <Button onClick={handleAddNew}>{t("common.add_new")}</Button>
      </div>

      {/* Actions Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("quality.id")}</TableHead>
                <TableHead>{t("quality.action")}</TableHead>
                <TableHead>{t("quality.implemented_by")}</TableHead>
                <TableHead>{t("quality.implementation_date")}</TableHead>
                <TableHead>{t("quality.verification_status")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions && actions.length > 0 ? (
                actions.map((action: any) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium">{action.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{action.action}</TableCell>
                    <TableCell>{action.implementedBy}</TableCell>
                    <TableCell>
                      {action.implementationDate
                        ? format(new Date(action.implementationDate), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {action.verifiedDate ? (
                        <Badge variant="outline">
                          {t("quality.verified")} ({format(new Date(action.verifiedDate), "MMM dd, yyyy")})
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("quality.pending_verification")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(action)}>
                          {t("common.edit")}
                        </Button>
                        {!action.verifiedDate && (
                          <Button size="sm" variant="outline" onClick={() => handleVerify(action.id)}>
                            {t("quality.verify")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t("quality.no_corrective_actions")}
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
              {selectedAction
                ? t("quality.edit_action")
                : t("quality.create_action")}
            </DialogTitle>
            <DialogDescription>
              {selectedAction
                ? t("quality.edit_action_description")
                : t("quality.create_action_description")}
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
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.action")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("quality.describe_action")}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{t("quality.action_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="implementedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.implemented_by")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_implementer")} />
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
                name="implementationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("quality.implementation_date")}</FormLabel>
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
                    <FormDescription>{t("quality.implementation_date_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedAction && (
                <FormField
                  control={form.control}
                  name="verifiedDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("quality.verification_date")}</FormLabel>
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
                                <span>{t("quality.not_verified")}</span>
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
                      <FormDescription>{t("quality.verification_date_description")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button type="submit" disabled={createAction.isPending || updateAction.isPending}>
                  {(createAction.isPending || updateAction.isPending)
                    ? t("common.saving")
                    : selectedAction
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