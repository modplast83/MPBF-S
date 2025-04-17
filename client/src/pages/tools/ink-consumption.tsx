import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Droplet, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema with validation
const inkConsumptionSchema = z.object({
  printWidth: z.string().transform(val => parseFloat(val)),
  printLength: z.string().transform(val => parseFloat(val)),
  printArea: z.string().transform(val => parseFloat(val)),
  coveragePercentage: z.string().transform(val => parseFloat(val)),
  aniloxVolume: z.string().transform(val => parseFloat(val)),
  transferEfficiency: z.string().transform(val => parseFloat(val)),
  quantity: z.string().transform(val => parseInt(val)),
  units: z.enum(["mm", "inch"]),
  inkDensity: z.string().transform(val => parseFloat(val)),
});

type InkConsumptionFormData = z.infer<typeof inkConsumptionSchema>;

export default function InkConsumptionCalculator() {
  const [results, setResults] = useState<{
    inkConsumptionPerUnit: number;
    totalInkConsumption: number;
    totalInkWeight: number;
    effectiveAniloxVolume: number;
    totalPrintArea: number;
  } | null>(null);
  
  // Initialize form with default values
  const form = useForm<InkConsumptionFormData>({
    resolver: zodResolver(inkConsumptionSchema),
    defaultValues: {
      printWidth: "300",
      printLength: "400",
      printArea: "120000", // Auto-calculated
      coveragePercentage: "30",
      aniloxVolume: "4.5", // BCM (Billion Cubic Microns)
      transferEfficiency: "40",
      quantity: "10000",
      units: "mm",
      inkDensity: "1.06", // g/cm³
    },
  });

  // Update print area when dimensions change
  const updatePrintArea = () => {
    const width = parseFloat(form.getValues("printWidth"));
    const length = parseFloat(form.getValues("printLength"));
    
    if (!isNaN(width) && !isNaN(length)) {
      // Convert inches to mm if needed
      let actualWidth = width;
      let actualLength = length;
      
      if (form.getValues("units") === "inch") {
        actualWidth = width * 25.4;
        actualLength = length * 25.4;
      }
      
      // Calculate area in mm²
      const area = actualWidth * actualLength;
      form.setValue("printArea", area.toString());
    }
  };

  // Calculate the ink consumption based on print area, anilox specifications
  const calculateInkConsumption = (data: InkConsumptionFormData) => {
    let printArea = data.printArea; // mm²
    const coveragePercentage = data.coveragePercentage / 100; // Convert to decimal
    const aniloxVolume = data.aniloxVolume; // BCM (Billion Cubic Microns)
    const transferEfficiency = data.transferEfficiency / 100; // Convert to decimal
    const quantity = data.quantity;
    const inkDensity = data.inkDensity; // g/cm³
    
    // Convert mm² to cm²
    printArea = printArea / 100;
    
    // Calculate effective anilox volume (anilox volume * transfer efficiency)
    const effectiveAniloxVolume = aniloxVolume * transferEfficiency;
    
    // Calculate ink volume per unit area (BCM to cm³)
    // 1 BCM = 1 billion µm³ = 0.001 cm³ per square inch
    // Convert to cm³ per cm²
    const inkVolumePerSquareCm = (effectiveAniloxVolume * 0.001) / 6.4516; // 1 in² = 6.4516 cm²
    
    // Calculate ink consumption per unit (cm³)
    const inkConsumptionPerUnit = printArea * coveragePercentage * inkVolumePerSquareCm;
    
    // Calculate total ink consumption (cm³)
    const totalInkConsumption = inkConsumptionPerUnit * quantity;
    
    // Calculate total ink weight (g)
    const totalInkWeight = totalInkConsumption * inkDensity;
    
    setResults({
      inkConsumptionPerUnit,
      totalInkConsumption,
      totalInkWeight,
      effectiveAniloxVolume,
      totalPrintArea: printArea * quantity,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Ink Consumption Calculator"
        text="Calculate the amount of ink needed for flexographic printing jobs"
      >
        <Droplet className="h-6 w-6 mb-2" />
      </PageHeader>

      <Link href="/tools" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tools
      </Link>
      
      <Tabs defaultValue="calculator">
        <TabsList className="mb-4">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="guide">Usage Guide</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Print & Ink Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(calculateInkConsumption)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="units"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Measurement Units</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setTimeout(updatePrintArea, 0);
                            }}
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
                        name="printWidth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Print Width</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.1" 
                                onChange={(e) => {
                                  field.onChange(e);
                                  setTimeout(updatePrintArea, 0);
                                }}
                              />
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
                        name="printLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Print Length</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.1" 
                                onChange={(e) => {
                                  field.onChange(e);
                                  setTimeout(updatePrintArea, 0);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              {form.watch("units") === "mm" ? "mm" : "inches"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="printArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Print Area</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" step="0.1" />
                          </FormControl>
                          <FormDescription>
                            mm² (auto-calculated)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coveragePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ink Coverage: {field.value}%
                          </FormLabel>
                          <FormControl>
                            <Slider
                              value={[parseFloat(field.value)]}
                              onValueChange={(value) => field.onChange(value[0].toString())}
                              min={1}
                              max={100}
                              step={1}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentage of the print area covered with ink
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aniloxVolume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anilox Volume</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0.1" step="0.1" />
                          </FormControl>
                          <FormDescription>
                            BCM (Billion Cubic Microns per square inch)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transferEfficiency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Transfer Efficiency: {field.value}%
                          </FormLabel>
                          <FormControl>
                            <Slider
                              value={[parseFloat(field.value)]}
                              onValueChange={(value) => field.onChange(value[0].toString())}
                              min={10}
                              max={80}
                              step={1}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentage of ink transferred from anilox to substrate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="inkDensity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ink Density</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0.8" step="0.01" />
                          </FormControl>
                          <FormDescription>
                            g/cm³ (Water: 1.0, Solvent: 0.9, UV: 1.05-1.2)
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
                            Number of units to be printed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">Calculate Ink Consumption</Button>
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
                        <h3 className="text-sm font-semibold text-muted-foreground">Ink Per Unit</h3>
                        <p className="text-2xl font-bold">
                          {results.inkConsumptionPerUnit.toFixed(3)} cm³
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">Total Ink Volume</h3>
                        <p className="text-2xl font-bold">
                          {results.totalInkConsumption < 1000
                            ? `${results.totalInkConsumption.toFixed(2)} cm³`
                            : `${(results.totalInkConsumption / 1000).toFixed(2)} L`}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Total Ink Weight: <span className="font-bold">{(results.totalInkWeight / 1000).toFixed(2)} kg</span></p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Calculation Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Print Area (per unit):</span>
                          <span>{(parseFloat(form.getValues("printArea")) / 100).toFixed(2)} cm²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Print Area:</span>
                          <span>{results.totalPrintArea.toFixed(2)} cm²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ink Coverage:</span>
                          <span>{form.getValues("coveragePercentage")}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Effective Area:</span>
                          <span>
                            {(
                              (parseFloat(form.getValues("printArea")) / 100) *
                              (parseFloat(form.getValues("coveragePercentage")) / 100)
                            ).toFixed(2)} cm²
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Anilox Volume:</span>
                          <span>{form.getValues("aniloxVolume")} BCM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transfer Efficiency:</span>
                          <span>{form.getValues("transferEfficiency")}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Effective Anilox Vol:</span>
                          <span>{results.effectiveAniloxVolume.toFixed(2)} BCM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ink Density:</span>
                          <span>{form.getValues("inkDensity")} g/cm³</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>
                        <strong>Note:</strong> This calculation is an approximation and actual ink consumption may vary 
                        based on printing conditions, press setup, ink viscosity, and other factors.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-center">
                    <div>
                      <Droplet className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Enter print specifications and click "Calculate Ink Consumption" to see results.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle>Guide to Using the Ink Consumption Calculator</CardTitle>
              <CardDescription>
                Understanding the parameters for accurate calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Input Parameters</h3>
                <div className="space-y-3 mt-2">
                  <div>
                    <h4 className="font-medium">Print Dimensions</h4>
                    <p className="text-sm text-muted-foreground">
                      The width and length of the printed area on each unit. The calculator automatically
                      computes the total area in square millimeters.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Ink Coverage</h4>
                    <p className="text-sm text-muted-foreground">
                      The percentage of the total print area that is covered with ink. For example:
                      <br />- Text-only prints: 5-15%
                      <br />- Medium graphics: 20-40%
                      <br />- Heavy coverage: 50-80%
                      <br />- Solid fills: 90-100%
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Anilox Volume</h4>
                    <p className="text-sm text-muted-foreground">
                      Measured in BCM (Billion Cubic Microns), this represents the volume of ink that the anilox 
                      roll can hold per square inch. Typical values range from 2.0 to 14.0 BCM, depending on the 
                      line screen and cell depth.
                      <br />- Fine text/lines: 2.0-3.0 BCM
                      <br />- Process printing: 3.0-5.0 BCM
                      <br />- Solid areas: 6.0-12.0 BCM
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Transfer Efficiency</h4>
                    <p className="text-sm text-muted-foreground">
                      The percentage of ink that transfers from the anilox roll to the substrate. This varies 
                      based on press conditions, ink rheology, and substrate characteristics. Typical values range 
                      from 30% to 60%.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Ink Density</h4>
                    <p className="text-sm text-muted-foreground">
                      The weight of ink per unit volume (g/cm³). Common values:
                      <br />- Water-based inks: 1.0-1.1 g/cm³
                      <br />- Solvent-based inks: 0.9-1.0 g/cm³
                      <br />- UV inks: 1.05-1.2 g/cm³
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold">Interpretation of Results</h3>
                <div className="space-y-3 mt-2">
                  <div>
                    <h4 className="font-medium">Ink Per Unit</h4>
                    <p className="text-sm text-muted-foreground">
                      The volume of ink required to print a single unit, measured in cubic centimeters (cm³).
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Total Ink Volume</h4>
                    <p className="text-sm text-muted-foreground">
                      The total volume of ink required for the entire print run, shown in cm³ or liters (L).
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Total Ink Weight</h4>
                    <p className="text-sm text-muted-foreground">
                      The weight of ink required, calculated by multiplying the volume by the ink density.
                      This is typically more useful for ordering and inventory purposes.
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold">Practical Considerations</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mt-2">
                  <li>Add 15-20% extra for wash-up, ink left in containers, and wastage.</li>
                  <li>For multi-color jobs, calculate each color separately and sum them.</li>
                  <li>The calculator does not account for make-ready waste or press setup.</li>
                  <li>Results should be validated against historical consumption data when possible.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}