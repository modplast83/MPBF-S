import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/hooks/use-language";

// Form schema with validation
const bagWeightSchema = z.object({
  bagType: z.string({ required_error: "Please select a bag type" }),
  width: z.coerce.number(),
  length: z.coerce.number(),
  thickness: z.coerce.number(),
  gusset: z.coerce.number().optional(),
  density: z.coerce.number(),
  units: z.enum(["cm", "inch"]),
  quantity: z.coerce.number().int(),
});

type BagWeightFormData = z.infer<typeof bagWeightSchema>;

export default function BagWeightCalculator() {
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const [results, setResults] = useState<{
    singleBagWeight: number;
    totalWeight: number;
    bagsPerKg: number;
    area: number;
    volume: number;
  } | null>(null);

  // Initialize form with default values
  const form = useForm<BagWeightFormData>({
    resolver: zodResolver(bagWeightSchema),
    defaultValues: {
      bagType: "flat",
      width: 30, // in cm (previously 300mm)
      length: 40, // in cm (previously 400mm)
      thickness: 40, // in microns
      gusset: 0, // in cm
      density: 0.92, // LDPE density in g/cm³
      units: "cm",
      quantity: 1000,
    },
  });

  // Calculate the bag weight based on dimensions and material properties
  const calculateBagWeight = (data: BagWeightFormData) => {
    let width = data.width;
    let length = data.length;
    let thickness = data.thickness; // microns
    let gusset = data.gusset || 0;
    const density = data.density; // g/cm³
    const quantity = data.quantity;

    // Convert inch to cm if needed
    if (data.units === "inch") {
      width = width * 2.54;
      length = length * 2.54;
      if (gusset) gusset = gusset * 2.54;
    }

    // Calculate area in cm²
    let area: number;
    if (data.bagType === "flat") {
      // Flat bag (width * length * 2)
      area = width * length * 2; // Already in cm²
    } else if (data.bagType === "gusset") {
      // Gusset bag (width + (2 * gusset)) * length * 2
      area = (width + (2 * gusset)) * length * 2;
    } else {
      // Default to flat bag calculation
      area = width * length * 2;
    }

    // Calculate volume (area * thickness) in cm³
    // Thickness is in microns, so divide by 10000 to convert to cm
    const volume = area * (thickness / 10000);

    // Calculate weight (volume * density) in grams
    const singleBagWeight = volume * density;
    
    // Calculate total weight for the given quantity
    const totalWeight = singleBagWeight * quantity / 1000; // in kg
    
    // Calculate bags per kg
    const bagsPerKg = 1000 / singleBagWeight; // 1000g = 1kg

    setResults({
      singleBagWeight,
      totalWeight,
      bagsPerKg,
      area,
      volume,
    });
  };

  return (
    <div className={`container mx-auto py-6 space-y-6 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <span className="material-icons text-xl">calculate</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("tools.bag_weight_calculator")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("tools.bag_weight_description")}
          </p>
        </div>
      </div>
      <Link href="/tools" className={`inline-flex items-center text-sm text-muted-foreground hover:text-primary ${isRTL ? 'flex-row-reverse' : ''}`}>
        <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
        {t("common.back_to_tools")}
      </Link>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className={isRTL ? 'text-right' : 'text-left'}>
              {t("tools.bag_specifications")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(calculateBagWeight)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="bagType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isRTL ? 'text-right' : 'text-left'}>
                        {t("tools.bag_type")}
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                            <SelectValue placeholder={t("tools.select_bag_type")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="flat">{t("tools.flat_bag")}</SelectItem>
                          <SelectItem value="gusset">{t("tools.gusset_bag")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isRTL ? 'text-right' : 'text-left'}>
                        {t("tools.measurement_units")}
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                            <SelectValue placeholder={t("tools.select_units")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cm">{t("tools.centimeters")}</SelectItem>
                          <SelectItem value="inch">{t("tools.inches")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isRTL ? 'text-right' : 'text-left'}>
                          Width
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.1" className={isRTL ? 'text-right' : 'text-left'} />
                        </FormControl>
                        <FormDescription className={isRTL ? 'text-right' : 'text-left'}>
                          {form.watch("units") === "cm" ? t("tools.cm") : t("tools.inches")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isRTL ? 'text-right' : 'text-left'}>
                          {t("common.length")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.1" className={isRTL ? 'text-right' : 'text-left'} />
                        </FormControl>
                        <FormDescription className={isRTL ? 'text-right' : 'text-left'}>
                          {form.watch("units") === "cm" ? t("tools.cm") : t("tools.inches")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("bagType") === "gusset" && (
                  <FormField
                    control={form.control}
                    name="gusset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isRTL ? 'text-right' : 'text-left'}>
                          {t("tools.gusset_depth")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.1" className={isRTL ? 'text-right' : 'text-left'} />
                        </FormControl>
                        <FormDescription className={isRTL ? 'text-right' : 'text-left'}>
                          {form.watch("units") === "cm" ? t("tools.cm") : t("tools.inches")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="thickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isRTL ? 'text-right' : 'text-left'}>
                        {t("common.thickness")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="0.1" className={isRTL ? 'text-right' : 'text-left'} />
                      </FormControl>
                      <FormDescription className={isRTL ? 'text-right' : 'text-left'}>
                        {t("tools.microns")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="density"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isRTL ? 'text-right' : 'text-left'}>
                        {t("tools.material_density")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0.1" step="0.01" className={isRTL ? 'text-right' : 'text-left'} />
                      </FormControl>
                      <FormDescription className={isRTL ? 'text-right' : 'text-left'}>
                        {t("tools.density_units")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isRTL ? 'text-right' : 'text-left'}>
                        {t("common.quantity")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" className={isRTL ? 'text-right' : 'text-left'} />
                      </FormControl>
                      <FormDescription className={isRTL ? 'text-right' : 'text-left'}>
                        {t("tools.number_of_bags")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  {t("tools.calculate_weight")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className={isRTL ? 'text-right' : 'text-left'}>
              {t("tools.calculation_results")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {t("tools.single_bag_weight")}
                    </h3>
                    <p className="text-2xl font-bold">
                      {results.singleBagWeight.toFixed(3)} {t("tools.grams")}
                    </p>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {t("tools.total_weight")}
                    </h3>
                    <p className="text-2xl font-bold">
                      {results.totalWeight.toFixed(2)} {t("tools.kg")}
                    </p>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {t("tools.bags_per_kg")}
                    </h3>
                    <p className="text-2xl font-bold">
                      {results.bagsPerKg.toFixed(0)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t("tools.calculation_details")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("tools.material")}:</span>
                      <span>
                        {
                          form.getValues("density") === 0.92 ? "LDPE" :
                          form.getValues("density") === 0.95 ? "HDPE" :
                          form.getValues("density") === 0.90 ? "PP" :
                          t("tools.custom_material")
                        }
                      </span>
                    </div>
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("tools.density")}:</span>
                      <span>{form.getValues("density")} g/cm³</span>
                    </div>
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("tools.surface_area")}:</span>
                      <span>{results.area.toFixed(2)} cm²</span>
                    </div>
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("tools.film_volume")}:</span>
                      <span>{results.volume.toFixed(4)} cm³</span>
                    </div>
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("common.quantity")}:</span>
                      <span>{form.getValues("quantity")} {t("tools.bags")}</span>
                    </div>
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("tools.bags_per_kg")}:</span>
                      <span>{results.bagsPerKg.toFixed(0)} {t("tools.bags")}</span>
                    </div>
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("tools.bag_type")}:</span>
                      <span>
                        {form.getValues("bagType") === "flat" ? t("tools.flat_bag") : t("tools.gusset_bag")}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className={`text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t("tools.dimensions")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("common.width")}:</span>
                      <span>
                        {form.getValues("width")} {form.getValues("units") === "cm" ? t("tools.cm") : t("tools.inches")}
                      </span>
                    </div>
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("common.length")}:</span>
                      <span>
                        {form.getValues("length")} {form.getValues("units") === "cm" ? t("tools.cm") : t("tools.inches")}
                      </span>
                    </div>
                    {form.getValues("bagType") === "gusset" && (
                      <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                        <span className="text-muted-foreground">{t("tools.gusset")}:</span>
                        <span>
                          {form.getValues("gusset")} {form.getValues("units") === "cm" ? t("tools.cm") : t("tools.inches")}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
                      <span className="text-muted-foreground">{t("common.thickness")}:</span>
                      <span>{form.getValues("thickness")} μm</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-4 text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p>
                    <strong>{t("tools.note")}:</strong> {t("tools.calculation_disclaimer")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-center">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <span className="material-icons text-5xl text-muted-foreground mb-2 block">calculate</span>
                  <p className="text-muted-foreground">
                    {t("tools.enter_specifications_message")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}