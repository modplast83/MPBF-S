import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Gauge, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

const productionMetricsSchema = z.object({
  sectionId: z.string().min(1, "Section is required"),
  machineId: z.string().optional(),
  jobOrderId: z.coerce.number().optional(),
  stage: z.string().min(1, "Stage is required"),
  targetRate: z.coerce.number().min(0, "Target rate must be positive"),
  actualRate: z.coerce.number().min(0, "Actual rate must be positive"),
  efficiency: z.coerce.number().min(0).max(100, "Efficiency must be between 0-100"),
  downtime: z.coerce.number().min(0, "Downtime must be positive").optional(),
  shift: z.string().min(1, "Shift is required"),
  operator: z.string().optional(),
  notes: z.string().optional()
});

type ProductionMetricsForm = z.infer<typeof productionMetricsSchema>;

export default function MetricsInputPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Fetch sections for dropdown
  const { data: sections } = useQuery({
    queryKey: ["/api/sections"]
  });

  // Fetch machines for dropdown
  const { data: machines } = useQuery({
    queryKey: ["/api/machines"]
  });

  // Fetch job orders for dropdown
  const { data: jobOrders } = useQuery({
    queryKey: ["/api/job-orders"]
  });

  const form = useForm<ProductionMetricsForm>({
    resolver: zodResolver(productionMetricsSchema),
    defaultValues: {
      sectionId: "",
      machineId: "",
      jobOrderId: undefined,
      stage: "",
      targetRate: 0,
      actualRate: 0,
      efficiency: 0,
      downtime: 0,
      shift: "day",
      operator: "",
      notes: ""
    }
  });

  const createMetricMutation = useMutation({
    mutationFn: (data: ProductionMetricsForm) => 
      apiRequest("/api/production/metrics", {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Production metrics recorded successfully"
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/production/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bottleneck/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bottleneck/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record metrics",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ProductionMetricsForm) => {
    // Calculate efficiency if not provided
    if (data.targetRate > 0 && data.actualRate > 0) {
      const calculatedEfficiency = (data.actualRate / data.targetRate) * 100;
      data.efficiency = Math.min(calculatedEfficiency, 100);
    }
    
    createMetricMutation.mutate(data);
  };

  const stages = [
    { value: "extruding", label: "Extruding" },
    { value: "printing", label: "Printing" },
    { value: "cutting", label: "Cutting" },
    { value: "mixing", label: "Mixing" }
  ];

  const shifts = [
    { value: "day", label: "Day Shift" },
    { value: "night", label: "Night Shift" },
    { value: "morning", label: "Morning Shift" }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Production Metrics Input</h1>
        <p className="text-muted-foreground">
          Record production metrics to monitor performance and detect bottlenecks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Record Production Metrics
              </CardTitle>
              <CardDescription>
                Enter current production data for real-time bottleneck analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sections?.map((section: any) => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.name}
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
                      name="machineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Machine (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select machine" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {machines?.map((machine: any) => (
                                <SelectItem key={machine.id} value={machine.id}>
                                  {machine.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Production Stage</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stages.map((stage) => (
                                <SelectItem key={stage.value} value={stage.value}>
                                  {stage.label}
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
                      name="jobOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Order (Optional)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select job order" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {jobOrders?.map((jobOrder: any) => (
                                <SelectItem key={jobOrder.id} value={jobOrder.id.toString()}>
                                  JO-{jobOrder.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="targetRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Rate (units/hr)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="actualRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Rate (units/hr)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="efficiency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Efficiency (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="downtime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Downtime (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shift"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shift</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select shift" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {shifts.map((shift) => (
                                <SelectItem key={shift.value} value={shift.value}>
                                  {shift.label}
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
                      name="operator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operator (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Operator name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Additional notes about production conditions..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createMetricMutation.isPending}
                  >
                    {createMetricMutation.isPending ? "Recording..." : "Record Metrics"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Smart Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">
                The system automatically analyzes your metrics and detects potential bottlenecks based on:
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Efficiency below targets</li>
                <li>• Production rate drops</li>
                <li>• Excessive downtime</li>
                <li>• Queue buildups</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Auto Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">
                Alerts are automatically generated when issues are detected and sent to relevant personnel via:
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Real-time dashboard updates</li>
                <li>• Email notifications</li>
                <li>• SMS alerts for critical issues</li>
                <li>• In-app notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-500" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">
                For best results:
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Record metrics regularly</li>
                <li>• Include accurate downtime data</li>
                <li>• Add notes for context</li>
                <li>• Monitor the dashboard for alerts</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}