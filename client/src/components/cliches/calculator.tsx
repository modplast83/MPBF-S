import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader, Save, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { H3, H4 } from "@/components/ui/typography";

// Schema for calculation form
const plateCalculationSchema = z.object({
  width: z.coerce.number().min(1, { message: "Width is required and must be greater than 0" }),
  height: z.coerce.number().min(1, { message: "Height is required and must be greater than 0" }),
  colors: z.coerce.number().min(1, { message: "Number of colors must be at least 1" }),
  thickness: z.coerce.number().optional(),
  customerDiscount: z.coerce.number().min(0).max(100).optional(),
  customerId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional()
});

type PlateCalculationForm = z.infer<typeof plateCalculationSchema>;

export default function CalculatorComponent() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch customers for dropdown
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Form definition
  const form = useForm<PlateCalculationForm>({
    resolver: zodResolver(plateCalculationSchema),
    defaultValues: {
      width: 0,
      height: 0,
      colors: 1,
      thickness: 0,
      customerDiscount: 0,
      customerId: "",
      description: "",
      notes: ""
    }
  });

  // Calculate price without saving
  const handleCalculate = async (data: PlateCalculationForm) => {
    setIsCalculating(true);
    try {
      const result = await apiRequest('/api/plate-calculations/calculate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setCalculationResult(result);
      toast({
        title: t('cliches.calculationSuccess'),
        description: t('cliches.calculationComplete'),
      });
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: t('cliches.calculationError'),
        description: t('common.errorTryAgain'),
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Save calculation mutation
  const saveCalculation = useMutation({
    mutationFn: async (data: PlateCalculationForm) => {
      return await apiRequest('/api/plate-calculations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plate-calculations'] });
      toast({
        title: t('cliches.saveSuccess'),
        description: t('cliches.calculationSaved'),
      });
    },
    onError: () => {
      toast({
        title: t('cliches.saveError'),
        description: t('common.errorTryAgain'),
        variant: 'destructive'
      });
    }
  });

  // Handle save calculation
  const handleSave = () => {
    const values = form.getValues();
    saveCalculation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCalculate)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Width and Height */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.width')} (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.height')} (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Colors and Thickness */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="colors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.numberOfColors')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="thickness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.thickness')} (mm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer and Discount */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cliches.customer')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('cliches.selectCustomer')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">{t('cliches.noCustomer')}</SelectItem>
                      {customers?.map((customer: any) => (
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

            <FormField
              control={form.control}
              name="customerDiscount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cliches.discount')} (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cliches.description')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cliches.notes')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-start mt-6">
            <Button type="submit" disabled={isCalculating}>
              {isCalculating ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              {t('cliches.calculate')}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSave}
              disabled={!calculationResult || saveCalculation.isPending}
            >
              {saveCalculation.isPending ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('cliches.save')}
            </Button>
          </div>
        </form>
      </Form>

      {calculationResult && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <H3>{t('cliches.calculationResults')}</H3>
            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('cliches.area')}:</Label>
                <div className="font-medium">
                  {calculationResult.area.toFixed(2)} cm²
                </div>
              </div>
              
              <div>
                <Label>{t('cliches.price')}:</Label>
                <div className="text-xl font-bold text-primary">
                  ${calculationResult.calculatedPrice.toFixed(2)}
                </div>
              </div>
              
              <div>
                <Label>{t('cliches.dimensions')}:</Label>
                <div className="font-medium">
                  {calculationResult.width} × {calculationResult.height} cm
                </div>
              </div>
              
              <div>
                <Label>{t('cliches.colors')}:</Label>
                <div className="font-medium">
                  {calculationResult.colors}
                </div>
              </div>
              
              {calculationResult.thickness > 0 && (
                <div>
                  <Label>{t('cliches.thickness')}:</Label>
                  <div className="font-medium">
                    {calculationResult.thickness} mm
                  </div>
                </div>
              )}
              
              {calculationResult.customerDiscount > 0 && (
                <div>
                  <Label>{t('cliches.appliedDiscount')}:</Label>
                  <div className="font-medium">
                    {calculationResult.customerDiscount}%
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <H4>{t('cliches.pricingFactors')}</H4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('cliches.basePrice')}:</span> ${calculationResult.basePricePerUnit}/cm²
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('cliches.colorFactor')}:</span> {(calculationResult.colorMultiplier - 1) * 100}%
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('cliches.thicknessFactor')}:</span> {(calculationResult.thicknessMultiplier - 1) * 100}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}