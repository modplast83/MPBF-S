import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
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
import { Calculator, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

// Form schema with validation
const bagWeightSchema = z.object({
  bagType: z.string({ required_error: "Please select a bag type" }),
  width: z.string().transform(val => parseFloat(val)),
  length: z.string().transform(val => parseFloat(val)),
  thickness: z.string().transform(val => parseFloat(val)),
  gusset: z.string().transform(val => parseFloat(val)).optional(),
  density: z.string().transform(val => parseFloat(val)),
  units: z.enum(["mm", "inch"]),
  quantity: z.string().transform(val => parseInt(val)),
});

type BagWeightFormData = z.infer<typeof bagWeightSchema>;

export default function BagWeightCalculator() {
  const [results, setResults] = useState<{
    singleBagWeight: number;
    totalWeight: number;
    area: number;
    volume: number;
  } | null>(null);

  // Initialize form with default values
  const form = useForm<BagWeightFormData>({
    resolver: zodResolver(bagWeightSchema),
    defaultValues: {
      bagType: "flat",
      width: "300",
      length: "400",
      thickness: "40", // in microns
      gusset: "0",
      density: "0.92", // LDPE density in g/cm³
      units: "mm",
      quantity: "1000",
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

    // Convert inch to mm if needed
    if (data.units === "inch") {
      width = width * 25.4;
      length = length * 25.4;
      if (gusset) gusset = gusset * 25.4;
    }

    // Calculate area in cm²
    let area: number;
    if (data.bagType === "flat") {
      // Flat bag (width * length * 2)
      area = (width * length * 2) / 100; // Convert from mm² to cm²
    } else if (data.bagType === "gusset") {
      // Gusset bag (width + (2 * gusset)) * length * 2
      area = ((width + (2 * gusset)) * length * 2) / 100;
    } else {
      // Default to flat bag calculation
      area = (width * length * 2) / 100;
    }

    // Calculate volume (area * thickness) in cm³
    // Thickness is in microns, so divide by 10000 to convert to cm
    const volume = area * (thickness / 10000);

    // Calculate weight (volume * density) in grams
    const singleBagWeight = volume * density;
    
    // Calculate total weight for the given quantity
    const totalWeight = singleBagWeight * quantity / 1000; // in kg

    setResults({
      singleBagWeight,
      totalWeight,
      area,
      volume,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Bag Weight Calculator"
        text="Calculate the theoretical weight of plastic bags based on dimensions and material"
      >
        <Calculator className="h-6 w-6 mb-2" />
      </PageHeader>

      <Link href="/tools" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tools
      </Link>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Bag Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(calculateBagWeight)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="bagType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bag Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bag type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="flat">Flat Bag</SelectItem>
                          <SelectItem value="gusset">Gusset Bag</SelectItem>
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
                      <FormLabel>Measurement Units</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select units" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mm">Millimeters (mm)</SelectItem>
                          <SelectItem value="inch">Inches (in)</SelectItem>
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
                        <FormLabel>Width</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.1" />
                        </FormControl>
                        <FormDescription>
                          {form.watch("units") === "mm" ? "mm" : "inches"}
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
                        <FormLabel>Length</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.1" />
                        </FormControl>
                        <FormDescription>
                          {form.watch("units") === "mm" ? "mm" : "inches"}
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
                        <FormLabel>Gusset Depth</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.1" />
                        </FormControl>
                        <FormDescription>
                          {form.watch("units") === "mm" ? "mm" : "inches"}
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
                      <FormLabel>Thickness</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="0.1" />
                      </FormControl>
                      <FormDescription>
                        Microns (μm)
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
                      <FormLabel>Material Density</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0.1" step="0.01" />
                      </FormControl>
                      <FormDescription>
                        g/cm³ (LDPE: 0.92, HDPE: 0.95, PP: 0.90)
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
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" />
                      </FormControl>
                      <FormDescription>
                        Number of bags
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">Calculate Weight</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">Single Bag Weight</h3>
                    <p className="text-2xl font-bold">
                      {results.singleBagWeight.toFixed(3)} g
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">Total Weight</h3>
                    <p className="text-2xl font-bold">
                      {results.totalWeight.toFixed(2)} kg
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Calculation Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material:</span>
                      <span>
                        {
                          form.getValues("density") === "0.92" ? "LDPE" :
                          form.getValues("density") === "0.95" ? "HDPE" :
                          form.getValues("density") === "0.90" ? "PP" :
                          "Custom Material"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Density:</span>
                      <span>{form.getValues("density")} g/cm³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Surface Area:</span>
                      <span>{results.area.toFixed(2)} cm²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Film Volume:</span>
                      <span>{results.volume.toFixed(4)} cm³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span>{form.getValues("quantity")} bags</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bag Type:</span>
                      <span>
                        {form.getValues("bagType") === "flat" ? "Flat Bag" : "Gusset Bag"}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Dimensions</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Width:</span>
                      <span>
                        {form.getValues("width")} {form.getValues("units")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Length:</span>
                      <span>
                        {form.getValues("length")} {form.getValues("units")}
                      </span>
                    </div>
                    {form.getValues("bagType") === "gusset" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gusset:</span>
                        <span>
                          {form.getValues("gusset")} {form.getValues("units")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thickness:</span>
                      <span>{form.getValues("thickness")} μm</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    <strong>Note:</strong> This is a theoretical calculation. Actual weights may vary due to
                    manufacturing processes, additives, and other factors.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Enter bag specifications and click "Calculate Weight" to see results.
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