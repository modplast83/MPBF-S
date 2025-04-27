import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { plateCalculationRequestSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/use-language";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { H2, H3, H4, P, Small } from "@/components/ui/typography";

type CalculatorFormValues = z.infer<typeof plateCalculationRequestSchema>;

export default function Calculator() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { isRTL } = useLanguage();
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Form setup
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(plateCalculationRequestSchema),
    defaultValues: {
      width: 0,
      height: 0,
      colors: 1,
      plateType: "standard",
      thickness: 1.14,
      customerDiscount: 0,
      notes: ""
    }
  });

  // Fetch customers for dropdown
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    refetchOnWindowFocus: false,
  });

  // Calculate price mutation
  const calculateMutation = useMutation({
    mutationFn: async (data: CalculatorFormValues) => {
      return await apiRequest('/api/cliches/calculate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setCalculationResult(data);
      toast({
        title: t("cliches.calculationSuccess"),
        description: t("cliches.calculationComplete"),
      });
    },
    onError: (error) => {
      console.error('Calculation error:', error);
      toast({
        title: t("cliches.calculationError"),
        description: error.message || 'Failed to calculate price',
        variant: 'destructive'
      });
    }
  });

  // Save calculation mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/cliches/save', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: t("cliches.saveSuccess"),
        description: t("cliches.calculationSaved"),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cliches/history'] });
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: t("cliches.saveError"),
        description: error.message || 'Failed to save calculation',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (values: CalculatorFormValues) => {
    calculateMutation.mutate(values);
  };

  const handleSaveCalculation = () => {
    if (calculationResult && form.getValues()) {
      saveMutation.mutate({
        ...form.getValues(),
        calculatedPrice: calculationResult.calculatedPrice,
        area: calculationResult.area,
        basePricePerUnit: calculationResult.basePricePerUnit,
        colorMultiplier: calculationResult.colorMultiplier,
        thicknessMultiplier: calculationResult.thicknessMultiplier,
      });
    }
  };

  return (
    <div className={`${isRTL ? 'rtl' : ''}`}>
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-2 gap-8'}`}>
        <Card className="p-6">
          <H3 className="mb-4">{t("cliches.dimensions")}</H3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Customer selection */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cliches.customer")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingCustomers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("cliches.selectCustomer")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t("cliches.noCustomer")}</SelectItem>
                        {customers && customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Width */}
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.width")} (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          inputMode="decimal"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Height */}
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.height")} (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          inputMode="decimal"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Colors */}
                <FormField
                  control={form.control}
                  name="colors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.numberOfColors")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          step="1" 
                          inputMode="numeric"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Thickness */}
                <FormField
                  control={form.control}
                  name="thickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.thickness")} (mm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          inputMode="decimal"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Plate Type */}
                <FormField
                  control={form.control}
                  name="plateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.type")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Standard" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="highResolution">High Resolution</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Discount */}
                <FormField
                  control={form.control}
                  name="customerDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.discount")} (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.5" 
                          inputMode="decimal"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cliches.notes")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3}
                        placeholder={t("cliches.description")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={calculateMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {calculateMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      {t("common.loading")}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="material-icons mr-1">calculate</span>
                      {t("cliches.calculate")}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        <Card className="p-6">
          <H3 className="mb-4">{t("cliches.calculationResults")}</H3>
          {calculationResult ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-secondary/30 rounded-md">
                <div className="text-lg font-semibold">{t("cliches.area")}</div>
                <div className="text-2xl font-bold">{calculationResult.area.toFixed(2)} cm²</div>
              </div>

              <div className="flex justify-between items-center p-4 bg-primary/10 rounded-md">
                <div className="text-lg font-semibold">{t("cliches.price")}</div>
                <div className="text-3xl font-bold text-primary">₺ {calculationResult.calculatedPrice.toFixed(2)}</div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <H4>{t("cliches.pricingFactors")}</H4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">{t("cliches.basePrice")}:</div>
                  <div className="text-sm font-medium text-right">₺ {calculationResult.basePricePerUnit.toFixed(2)} / cm²</div>
                  
                  <div className="text-sm">{t("cliches.colorFactor")}:</div>
                  <div className="text-sm font-medium text-right">× {calculationResult.colorMultiplier.toFixed(2)}</div>
                  
                  <div className="text-sm">{t("cliches.thicknessFactor")}:</div>
                  <div className="text-sm font-medium text-right">× {calculationResult.thicknessMultiplier.toFixed(2)}</div>
                  
                  {calculationResult.customerDiscount > 0 && (
                    <>
                      <div className="text-sm">{t("cliches.appliedDiscount")}:</div>
                      <div className="text-sm font-medium text-right">- {calculationResult.customerDiscount}%</div>
                    </>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setCalculationResult(null)}
                  className="w-full md:w-auto"
                >
                  <span className="material-icons mr-1">refresh</span>
                  {t("common.refresh")}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveCalculation}
                  disabled={saveMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {saveMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      {t("common.saving")}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="material-icons mr-1">save</span>
                      {t("cliches.save")}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
              <span className="material-icons text-4xl mb-2">calculate</span>
              <p>{t("cliches.calculatorTitle")}</p>
              <Small className="mt-2">{t("cliches.calculatorTitle")}</Small>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}