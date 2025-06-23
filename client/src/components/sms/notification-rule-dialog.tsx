import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Loader2, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SmsTemplate, SmsNotificationRule } from "shared/schema";

const notificationRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  triggerEvent: z.string().min(1, "Trigger event is required"),
  conditions: z.any().optional(),
  templateId: z.string().optional(),
  recipientRoles: z.array(z.string()).default([]),
  recipientUsers: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  cooldownMinutes: z.number().min(0).default(0),
  workingHoursOnly: z.boolean().default(false),
});

type NotificationRuleFormValues = z.infer<typeof notificationRuleSchema>;

interface NotificationRuleDialogProps {
  children: React.ReactNode;
  rule?: SmsNotificationRule;
  templates: SmsTemplate[];
  onSuccess?: () => void;
}

const triggerEvents = [
  { value: "order_created", label: "Order Created" },
  { value: "order_completed", label: "Order Completed" },
  { value: "order_delayed", label: "Order Delayed" },
  { value: "bottleneck_detected", label: "Bottleneck Detected" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "maintenance_required", label: "Maintenance Required" },
  { value: "machine_breakdown", label: "Machine Breakdown" },
  { value: "shift_change", label: "Shift Change" },
  { value: "target_missed", label: "Target Missed" },
  { value: "custom_alert", label: "Custom Alert" },
];

const userRoles = [
  { value: "administrator", label: "Administrator" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operator", label: "Operator" },
  { value: "quality_inspector", label: "Quality Inspector" },
  { value: "maintenance_tech", label: "Maintenance Tech" },
  { value: "hr_manager", label: "HR Manager" },
];

export function NotificationRuleDialog({ children, rule, templates, onSuccess }: NotificationRuleDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<NotificationRuleFormValues>({
    resolver: zodResolver(notificationRuleSchema),
    defaultValues: {
      name: rule?.name || "",
      triggerEvent: rule?.triggerEvent || "",
      conditions: rule?.conditions || {},
      templateId: rule?.templateId || "",
      recipientRoles: rule?.recipientRoles || [],
      recipientUsers: rule?.recipientUsers || [],
      isActive: rule?.isActive ?? true,
      priority: rule?.priority as any || "normal",
      cooldownMinutes: rule?.cooldownMinutes || 0,
      workingHoursOnly: rule?.workingHoursOnly || false,
    },
  });

  const saveRuleMutation = useMutation({
    mutationFn: async (data: NotificationRuleFormValues) => {
      const method = rule ? "PUT" : "POST";
      const url = rule ? `/api/sms-notification-rules/${rule.id}` : "/api/sms-notification-rules";
      await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-notification-rules"] });
      toast({
        title: rule ? "Rule Updated" : "Rule Created",
        description: `Notification rule has been ${rule ? "updated" : "created"} successfully.`
      });
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save notification rule.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: NotificationRuleFormValues) => {
    saveRuleMutation.mutate(data);
  };

  const selectedRoles = form.watch("recipientRoles");
  const selectedTemplate = templates.find(t => t.id === form.watch("templateId"));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? "Edit Notification Rule" : "Create Notification Rule"}
          </DialogTitle>
          <DialogDescription>
            {rule ? "Modify the automated notification rule settings and conditions." : "Set up automated SMS notifications based on system events and conditions."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter rule name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="triggerEvent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Event *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger event" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {triggerEvents.map((event) => (
                          <SelectItem key={event.value} value={event.value}>
                            {event.label}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Template Selection */}
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMS Template</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No template</SelectItem>
                      {templates.filter(t => t.isActive).map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedTemplate && (
              <div className="p-3 border rounded-md bg-gray-50">
                <Label className="text-sm font-medium">Template Preview:</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedTemplate.template}</p>
              </div>
            )}

            {/* Recipient Roles */}
            <FormField
              control={form.control}
              name="recipientRoles"
              render={() => (
                <FormItem>
                  <FormLabel>Recipient Roles</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {userRoles.map((role) => (
                      <FormField
                        key={role.value}
                        control={form.control}
                        name="recipientRoles"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role.value)}
                                onCheckedChange={(checked) => {
                                  const currentRoles = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentRoles, role.value]);
                                  } else {
                                    field.onChange(currentRoles.filter(r => r !== role.value));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">
                              {role.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Roles Display */}
            {selectedRoles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Roles:</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {userRoles.find(r => r.value === role)?.label || role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Rule Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cooldownMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cooldown (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500">
                      Prevent duplicate notifications for this duration
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="workingHoursOnly"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">
                      Send only during working hours (9 AM - 6 PM)
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">
                      Active rule (will trigger notifications)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveRuleMutation.isPending}>
                {saveRuleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {rule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}