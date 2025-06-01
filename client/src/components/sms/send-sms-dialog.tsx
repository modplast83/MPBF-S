import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, User, Template, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Order, SmsTemplate } from "@/shared/schema";

const sendSmsSchema = z.object({
  recipientPhone: z.string().min(7, "Phone number is required"),
  recipientName: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  customerId: z.string().optional(),
  orderId: z.number().optional(),
  messageType: z.enum(["custom", "order_notification", "status_update", "bottleneck_alert", "quality_alert", "maintenance_alert", "hr_notification"]).default("custom"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  category: z.enum(["general", "production", "quality", "maintenance", "hr", "management"]).default("general"),
  templateId: z.string().optional(),
  scheduledFor: z.date().optional(),
  isScheduled: z.boolean().default(false),
});

type SendSmsFormValues = z.infer<typeof sendSmsSchema>;

interface SendSmsDialogProps {
  children: React.ReactNode;
  customers: Customer[];
  orders: Order[];
  templates: SmsTemplate[];
  onSuccess?: () => void;
  defaultCustomer?: Customer;
  defaultOrder?: Order;
}

export function SendSmsDialog({ 
  children, 
  customers, 
  orders, 
  templates, 
  onSuccess,
  defaultCustomer,
  defaultOrder 
}: SendSmsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);

  const form = useForm<SendSmsFormValues>({
    resolver: zodResolver(sendSmsSchema),
    defaultValues: {
      recipientPhone: "",
      recipientName: "",
      message: "",
      customerId: defaultCustomer?.id || "",
      orderId: defaultOrder?.id,
      messageType: "custom",
      priority: "normal",
      category: "general",
      isScheduled: false,
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (data: SendSmsFormValues) => {
      await apiRequest("POST", "/api/sms-messages", {
        ...data,
        scheduledFor: data.isScheduled ? data.scheduledFor : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-messages"] });
      toast({
        title: "SMS Sent",
        description: "Your message has been sent successfully."
      });
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send SMS",
        description: error.message || "There was an error sending your message.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SendSmsFormValues) => {
    sendSmsMutation.mutate(data);
  };

  const handleTemplateSelect = (template: SmsTemplate) => {
    setSelectedTemplate(template);
    form.setValue("message", template.template);
    form.setValue("messageType", template.messageType as any);
    form.setValue("category", template.category as any);
    form.setValue("templateId", template.id);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setValue("customerId", customerId);
      form.setValue("recipientName", customer.name);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === parseInt(orderId));
    if (order) {
      form.setValue("orderId", order.id);
      const customer = customers.find(c => c.id === order.customerId);
      if (customer) {
        handleCustomerSelect(customer.id);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send SMS Message</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Selection */}
            {templates.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Templates</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {templates.filter(t => t.isActive).slice(0, 4).map((template) => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id ? 'border-primary' : 'hover:border-gray-300'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          <Badge variant="outline" className="text-xs mr-1">
                            {template.category}
                          </Badge>
                          {template.messageType}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {template.template.substring(0, 100)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recipient Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (Optional)</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCustomerSelect(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No customer</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} ({customer.code})
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
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order (Optional)</FormLabel>
                    <Select 
                      value={field.value?.toString() || ""} 
                      onValueChange={(value) => {
                        field.onChange(value ? parseInt(value) : undefined);
                        if (value) handleOrderSelect(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No order</SelectItem>
                        {orders.slice(0, 50).map((order) => {
                          const customer = customers.find(c => c.id === order.customerId);
                          return (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              Order #{order.id} - {customer?.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Message Content */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your message here..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-gray-500">
                    {field.value?.length || 0}/160 characters
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message Settings */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
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

              <FormField
                control={form.control}
                name="messageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="order_notification">Order</SelectItem>
                        <SelectItem value="status_update">Status</SelectItem>
                        <SelectItem value="bottleneck_alert">Bottleneck</SelectItem>
                        <SelectItem value="quality_alert">Quality</SelectItem>
                        <SelectItem value="maintenance_alert">Maintenance</SelectItem>
                        <SelectItem value="hr_notification">HR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule Option */}
            <FormField
              control={form.control}
              name="isScheduled"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="text-sm">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Schedule for later
                  </FormLabel>
                </FormItem>
              )}
            />

            {form.watch("isScheduled") && (
              <FormField
                control={form.control}
                name="scheduledFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? field.value.toISOString().slice(0, 16) : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sendSmsMutation.isPending}>
                {sendSmsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {form.watch("isScheduled") ? "Schedule SMS" : "Send SMS"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}