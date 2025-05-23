import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// UI Components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { insertQualityCheckSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth-v2";
import { useTranslation } from "react-i18next";

// Enhanced quality check form schema with validation
const enhancedQualityCheckSchema = insertQualityCheckSchema.extend({
  checkTypeId: z.string().min(1, "A check type must be selected"),
  rollId: z.string().optional().nullable(),
  jobOrderId: z.number().optional().nullable(),
  parameters: z.record(z.string(), z.any()).optional(),
  checkDate: z.date().default(() => new Date()),
  issueSeverity: z.enum(["none", "low", "medium", "high", "critical"]).optional().nullable(),
  result: z.enum(["pass", "fail", "pending"]).default("pending"),
  notes: z.string().optional().nullable(),
  checklistItems: z.array(
    z.object({
      name: z.string(),
      passed: z.boolean().default(true),
      notes: z.string().optional().nullable(),
    })
  ).optional(),
});

export type EnhancedQualityCheckFormValues = z.infer<typeof enhancedQualityCheckSchema>;

interface EnhancedQualityCheckFormProps {
  initialData?: Partial<EnhancedQualityCheckFormValues>;
  checkTypes: any[];
  rolls?: any[];
  jobOrders?: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

export function EnhancedQualityCheckForm({
  initialData,
  checkTypes,
  rolls = [],
  jobOrders = [],
  onSuccess,
  onCancel,
  isEdit = false,
}: EnhancedQualityCheckFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checklistItems, setChecklistItems] = useState<{ id: string; name: string; checked: boolean }[]>([]);
  const [parameters, setParameters] = useState<{ name: string; value: string | number }[]>([]);
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Initialize the form with default values
  const form = useForm<EnhancedQualityCheckFormValues>({
    resolver: zodResolver(enhancedQualityCheckSchema),
    defaultValues: {
      ...(initialData || {}),
      checkDate: initialData?.checkDate ? new Date(initialData.checkDate) : new Date(),
    },
  });
  
  // Watch for changes to checkTypeId to load checklist items and parameters
  const watchCheckTypeId = form.watch("checkTypeId");
  const watchResult = form.watch("result");
  
  // Load checklist items and parameters when check type changes
  useEffect(() => {
    if (watchCheckTypeId) {
      const selectedCheckType = checkTypes.find(ct => ct.id === watchCheckTypeId);
      if (selectedCheckType) {
        // Initialize checklist items
        if (selectedCheckType.checklistItems && selectedCheckType.checklistItems.length > 0) {
          const newChecklistItems = selectedCheckType.checklistItems.map((item: string, index: number) => ({
            id: `checklist-${index}`,
            name: item,
            checked: true,
          }));
          setChecklistItems(newChecklistItems);
          
          // Update form values
          const formChecklistItems = newChecklistItems.map(item => ({
            name: item.name,
            passed: item.checked,
            notes: null,
          }));
          form.setValue("checklistItems", formChecklistItems);
        } else {
          setChecklistItems([]);
          form.setValue("checklistItems", []);
        }
        
        // Initialize parameters
        if (selectedCheckType.parameters && selectedCheckType.parameters.length > 0) {
          const newParameters = selectedCheckType.parameters.map((param: string, index: number) => ({
            name: param,
            value: "",
          }));
          setParameters(newParameters);
          
          // Update form values
          const formParameters: Record<string, any> = {};
          newParameters.forEach(param => {
            formParameters[param.name] = "";
          });
          form.setValue("parameters", formParameters);
        } else {
          setParameters([]);
          form.setValue("parameters", {});
        }
      }
    }
  }, [watchCheckTypeId, checkTypes, form]);
  
  // Update form when result changes
  useEffect(() => {
    if (watchResult === "fail") {
      form.setValue("issueSeverity", "medium");
    } else if (watchResult === "pass") {
      form.setValue("issueSeverity", null);
    }
  }, [watchResult, form]);
  
  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (values: EnhancedQualityCheckFormValues) => {
      const url = isEdit && initialData?.id 
        ? `/api/quality-checks/${initialData.id}` 
        : "/api/quality-checks";
      
      const method = isEdit ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          performedBy: user?.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save quality check");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Check Updated" : "Check Created",
        description: isEdit 
          ? "The quality check has been successfully updated."
          : "The quality check has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: EnhancedQualityCheckFormValues) => {
    // Process checklist items
    if (checklistItems.length > 0) {
      const formattedChecklistItems = checklistItems.map(item => ({
        name: item.name,
        passed: item.checked,
        notes: null,
      }));
      values.checklistItems = formattedChecklistItems;
    }
    
    // Process parameters
    if (parameters.length > 0) {
      const formattedParameters: Record<string, any> = {};
      parameters.forEach(param => {
        formattedParameters[param.name] = param.value;
      });
      values.parameters = formattedParameters;
    }
    
    mutation.mutate(values);
  };
  
  // Handle checklist item toggle
  const handleChecklistToggle = (id: string, checked: boolean) => {
    const updatedItems = checklistItems.map(item => 
      item.id === id ? { ...item, checked } : item
    );
    setChecklistItems(updatedItems);
    
    // Update form values
    const formChecklistItems = updatedItems.map(item => ({
      name: item.name,
      passed: item.checked,
      notes: null,
    }));
    form.setValue("checklistItems", formChecklistItems);
    
    // If any item fails, set result to fail
    if (updatedItems.some(item => !item.checked)) {
      form.setValue("result", "fail");
    } else if (updatedItems.every(item => item.checked)) {
      form.setValue("result", "pass");
    }
  };
  
  // Handle parameter change
  const handleParameterChange = (name: string, value: string | number) => {
    const updatedParameters = parameters.map(param => 
      param.name === name ? { ...param, value } : param
    );
    setParameters(updatedParameters);
    
    // Update form values
    const formParameters: Record<string, any> = { ...(form.getValues("parameters") || {}) };
    formParameters[name] = value;
    form.setValue("parameters", formParameters);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField
                control={form.control}
                name="checkTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.check_type")} <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_check_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {checkTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("quality.check_type_description")}
                    </FormDescription>
                    <FormMessage />
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
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t("common.pick_a_date")}</span>
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField
                control={form.control}
                name="rollId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.roll")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_roll")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t("common.none")}</SelectItem>
                        {rolls.map((roll) => (
                          <SelectItem key={roll.id} value={roll.id}>
                            {roll.id} - {roll.serialNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("quality.roll_description")}
                    </FormDescription>
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
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_job_order")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t("common.none")}</SelectItem>
                        {jobOrders.map((jo) => (
                          <SelectItem key={jo.id} value={jo.id.toString()}>
                            JO #{jo.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("quality.job_order_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Checklist Items */}
            {checklistItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">{t("quality.checklist_items")}</h3>
                <div className="border rounded-md p-4 space-y-3">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={item.id} 
                          checked={item.checked}
                          onCheckedChange={(checked) => 
                            handleChecklistToggle(item.id, checked as boolean)
                          }
                        />
                        <label 
                          htmlFor={item.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Parameters */}
            {parameters.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">{t("quality.parameters")}</h3>
                <div className="border rounded-md p-4 space-y-3">
                  {parameters.map((param) => (
                    <div key={param.name} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium">{param.name}</label>
                      </div>
                      <div className="flex-1">
                        <Input
                          value={param.value.toString()}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quality.result")} <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quality.select_result")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pass">{t("quality.pass")}</SelectItem>
                        <SelectItem value="fail">{t("quality.fail")}</SelectItem>
                        <SelectItem value="pending">{t("quality.pending")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {watchResult === "fail" && (
                <FormField
                  control={form.control}
                  name="issueSeverity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quality.issue_severity")} <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("quality.select_severity")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">{t("quality.severity.low")}</SelectItem>
                          <SelectItem value="medium">{t("quality.severity.medium")}</SelectItem>
                          <SelectItem value="high">{t("quality.severity.high")}</SelectItem>
                          <SelectItem value="critical">{t("quality.severity.critical")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("quality.notes")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("quality.notes_placeholder")}
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("quality.notes_description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-4">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} type="button">
                {t("common.cancel")}
              </Button>
            )}
            <Button type="submit" disabled={mutation.isPending} className="ml-auto">
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? t("common.updating") : t("common.saving")}
                </>
              ) : (
                isEdit ? t("common.update") : t("common.save")
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}