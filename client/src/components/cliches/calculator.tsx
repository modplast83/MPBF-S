import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";

// UI Components
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// Import typography components
import Typography from "@/components/ui/typography";
const { H3, H4 } = Typography;
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

// Define the form schema
const calculatorSchema = z.object({
  width: z.string().min(1, "Width is required").transform(val => parseFloat(val)),
  height: z.string().min(1, "Height is required").transform(val => parseFloat(val)),
  colors: z.string().min(1, "Number of colors is required").transform(val => parseInt(val)),
  plateType: z.string().min(1, "Plate type is required"),
  thickness: z.string().transform(val => val ? parseFloat(val) : undefined),
  customerId: z.string().optional(),
  customerDiscount: z.string().transform(val => val ? parseFloat(val) : undefined),
  notes: z.string().optional(),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

export default function Calculator() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [calculation, setCalculation] = useState<any>(null);

  // Form setup
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      width: "",
      height: "",
      colors: "1",
      plateType: "standard",
      thickness: "",
      customerId: "",
      customerDiscount: "",
      notes: "",
    },
  });

  // Fetch customers for the dropdown
  const { data: customers } = useQuery({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
    enabled: true,
  });

  // Calculate price mutation
  const calculateMutation = useMutation({
    mutationFn: async (data: CalculatorFormValues) => {
      return apiRequest(`${API_ENDPOINTS.CALCULATE_PLATE_PRICE}`, {
        method: "POST",
        data,
      });
    },
    onSuccess: (data) => {
      setCalculation(data);
      toast({
        title: t("cliches.calculationSuccess"),
        description: t("cliches.calculationComplete"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("cliches.calculationError"),
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Save calculation mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`${API_ENDPOINTS.PLATE_CALCULATIONS}`, {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: t("cliches.saveSuccess"),
        description: t("cliches.calculationSaved"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("cliches.saveError"),
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: CalculatorFormValues) => {
    calculateMutation.mutate(values);
  };

  // Save calculation
  const handleSave = () => {
    if (!calculation) return;

    const saveData = {
      ...form.getValues(),
      area: calculation.area,
      calculatedPrice: calculation.calculatedPrice,
      basePricePerUnit: calculation.basePricePerUnit,
      colorMultiplier: calculation.colorMultiplier,
      thicknessMultiplier: calculation.thicknessMultiplier,
      customerDiscount: calculation.customerDiscount || 0,
    };

    saveMutation.mutate(saveData);
  };

  // Render the calculator
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Input form */}
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Width */}
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.width")} (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.1" 
                          min="0.1"
                          placeholder="0.0" 
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
                          {...field} 
                          type="number" 
                          step="0.1" 
                          min="0.1"
                          placeholder="0.0" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Number of Colors */}
                <FormField
                  control={form.control}
                  name="colors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.numberOfColors")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of colors" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          {...field} 
                          type="number" 
                          step="0.1" 
                          min="0.5"
                          placeholder="1.14" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plate Type */}
                <FormField
                  control={form.control}
                  name="plateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.type")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plate type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="digital">Digital</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Customer */}
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.customer")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
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
                              {isRTL && customer.nameAr ? customer.nameAr : customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Discount */}
              <FormField
                control={form.control}
                name="customerDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cliches.discount")} (%)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="0" 
                      />
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
                    <FormLabel>{t("cliches.notes")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder={t("cliches.notes")}
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={calculateMutation.isPending}
              >
                {calculateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("cliches.calculate")
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Calculation Results */}
      <Card>
        <CardContent className="pt-6">
          <H3 className="mb-4">{t("cliches.calculationResults")}</H3>
          
          {calculation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("cliches.dimensions")}</p>
                  <p className="font-medium">
                    {form.getValues("width")} × {form.getValues("height")} cm
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("cliches.area")}</p>
                  <p className="font-medium">
                    {calculation.area.toFixed(2)} cm²
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("cliches.colors")}</p>
                  <p className="font-medium">
                    {form.getValues("colors")}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("cliches.appliedDiscount")}</p>
                  <p className="font-medium">
                    {calculation.customerDiscount || 0}%
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <H4>{t("cliches.pricingFactors")}</H4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("cliches.basePrice")}</p>
                  <p className="font-medium">
                    ${calculation.basePricePerUnit}/cm²
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("cliches.colorFactor")}</p>
                  <p className="font-medium">
                    {calculation.colorMultiplier.toFixed(2)}x
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("cliches.thicknessFactor")}</p>
                  <p className="font-medium">
                    {calculation.thicknessMultiplier.toFixed(2)}x
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-lg font-semibold">{t("cliches.price")}</p>
                <p className="text-3xl font-bold text-primary">
                  ${calculation.calculatedPrice.toFixed(2)}
                </p>
              </div>
              
              <Button 
                onClick={handleSave} 
                variant="outline" 
                className="w-full"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("cliches.save")
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
              <div className="text-6xl mb-4">📐</div>
              <H4 className="mb-2">{t("cliches.calculatorTitle")}</H4>
              <p className="text-muted-foreground mb-6">
                Enter plate dimensions and specifications to calculate the price.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}