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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Save, Loader2, Template, Variable } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SmsTemplate } from "shared/schema";

const smsTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Template name is required"),
  category: z.enum(["production", "quality", "maintenance", "hr", "management", "custom"]),
  messageType: z.string().min(1, "Message type is required"),
  template: z.string().min(1, "Template content is required"),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type SmsTemplateFormValues = z.infer<typeof smsTemplateSchema>;

interface SmsTemplateDialogProps {
  children: React.ReactNode;
  template?: SmsTemplate;
  onSuccess?: () => void;
}

const commonVariables = [
  "{{customer_name}}",
  "{{order_id}}",
  "{{order_status}}",
  "{{job_order_id}}",
  "{{machine_name}}",
  "{{section_name}}",
  "{{user_name}}",
  "{{date}}",
  "{{time}}",
  "{{priority}}",
  "{{phone_number}}",
];

const templateExamples = {
  production: "Production Alert: {{machine_name}} in {{section_name}} requires attention. Please check immediately.",
  quality: "Quality Issue: Order #{{order_id}} for {{customer_name}} has failed quality check. Action required.",
  maintenance: "Maintenance Required: {{machine_name}} scheduled for maintenance on {{date}} at {{time}}.",
  hr: "HR Notice: {{user_name}}, please report to HR office regarding your request.",
  management: "Management Alert: Urgent attention required for {{section_name}} operations.",
  custom: "Custom message template for {{customer_name}}. Order #{{order_id}} status: {{order_status}}.",
};

export function SmsTemplateDialog({ children, template, onSuccess }: SmsTemplateDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState<string[]>(template?.variables || []);

  const form = useForm<SmsTemplateFormValues>({
    resolver: zodResolver(smsTemplateSchema),
    defaultValues: {
      id: template?.id || "",
      name: template?.name || "",
      category: template?.category as any || "custom",
      messageType: template?.messageType || "",
      template: template?.template || "",
      variables: template?.variables || [],
      isActive: template?.isActive ?? true,
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: SmsTemplateFormValues) => {
      const method = template ? "PUT" : "POST";
      const url = template ? `/api/sms-templates/${template.id}` : "/api/sms-templates";
      await apiRequest(method, url, {
        ...data,
        variables: selectedVariables,
        id: template ? template.id : data.name.toLowerCase().replace(/\s+/g, "_"),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({
        title: template ? "Template Updated" : "Template Created",
        description: `SMS template has been ${template ? "updated" : "created"} successfully.`
      });
      form.reset();
      setSelectedVariables([]);
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save template.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SmsTemplateFormValues) => {
    saveTemplateMutation.mutate(data);
  };

  const handleCategoryChange = (category: string) => {
    form.setValue("category", category as any);
    if (templateExamples[category as keyof typeof templateExamples]) {
      form.setValue("template", templateExamples[category as keyof typeof templateExamples]);
    }
  };

  const insertVariable = (variable: string) => {
    const currentTemplate = form.getValues("template");
    const newTemplate = currentTemplate + " " + variable;
    form.setValue("template", newTemplate);
    
    if (!selectedVariables.includes(variable)) {
      setSelectedVariables([...selectedVariables, variable]);
    }
  };

  const toggleVariable = (variable: string) => {
    if (selectedVariables.includes(variable)) {
      setSelectedVariables(selectedVariables.filter(v => v !== variable));
    } else {
      setSelectedVariables([...selectedVariables, variable]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit SMS Template" : "Create SMS Template"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter template name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select value={field.value} onValueChange={handleCategoryChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="messageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Type *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., order_notification, alert, reminder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Content */}
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Content *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your message template with variables..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-gray-500">
                    Use variables like {{customer_name}} to make templates dynamic
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Available Variables */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Variable className="h-4 w-4" />
                Available Variables
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonVariables.map((variable) => (
                  <div key={variable} className="flex items-center space-x-2">
                    <Checkbox
                      id={variable}
                      checked={selectedVariables.includes(variable)}
                      onCheckedChange={() => toggleVariable(variable)}
                    />
                    <Label
                      htmlFor={variable}
                      className="text-xs cursor-pointer hover:text-blue-600"
                      onClick={() => insertVariable(variable)}
                    >
                      {variable}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Variables Display */}
            {selectedVariables.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Variables:</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedVariables.map((variable) => (
                    <Badge key={variable} variant="secondary" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Template Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="p-3 border rounded-md bg-gray-50 text-sm">
                {form.watch("template") || "Template preview will appear here..."}
              </div>
            </div>

            {/* Active Status */}
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
                    Active template (available for use)
                  </FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveTemplateMutation.isPending}>
                {saveTemplateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {template ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}