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
import { Wrench, ArrowLeft, Clock, ArrowLeftRight, RotateCw, Activity } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Unit Converter Schema
const unitConverterSchema = z.object({
  fromValue: z.string().transform(val => parseFloat(val)),
  fromUnit: z.string(),
  toUnit: z.string(),
});

type UnitConverterFormData = z.infer<typeof unitConverterSchema>;

// Production Time Calculator Schema
const productionTimeSchema = z.object({
  machineSpeed: z.string().transform(val => parseFloat(val)),
  quantity: z.string().transform(val => parseFloat(val)),
  setupTime: z.string().transform(val => parseFloat(val)),
  efficiency: z.string().transform(val => parseFloat(val)),
});

type ProductionTimeFormData = z.infer<typeof productionTimeSchema>;

// Film Roll Calculator Schema
const filmRollSchema = z.object({
  rollDiameter: z.string().transform(val => parseFloat(val)),
  coreDiameter: z.string().transform(val => parseFloat(val)),
  filmThickness: z.string().transform(val => parseFloat(val)),
  rollWidth: z.string().transform(val => parseFloat(val)),
  units: z.enum(["mm", "inch"]),
});

type FilmRollFormData = z.infer<typeof filmRollSchema>;

export default function UtilityTools() {
  const [unitResult, setUnitResult] = useState<number | null>(null);
  const [timeResult, setTimeResult] = useState<{
    totalHours: number;
    productionHours: number;
    setupHours: number;
    days: number;
    shifts: number;
  } | null>(null);
  const [rollResult, setRollResult] = useState<{
    filmLength: number;
    filmArea: number;
    rollWeight: number;
  } | null>(null);

  // Unit converter form
  const unitForm = useForm<UnitConverterFormData>({
    resolver: zodResolver(unitConverterSchema),
    defaultValues: {
      fromValue: "1",
      fromUnit: "mm",
      toUnit: "inch",
    },
  });

  // Production time calculator form
  const timeForm = useForm<ProductionTimeFormData>({
    resolver: zodResolver(productionTimeSchema),
    defaultValues: {
      machineSpeed: "100",
      quantity: "10000",
      setupTime: "2",
      efficiency: "85",
    },
  });

  // Film roll calculator form
  const rollForm = useForm<FilmRollFormData>({
    resolver: zodResolver(filmRollSchema),
    defaultValues: {
      rollDiameter: "500",
      coreDiameter: "76",
      filmThickness: "40",
      rollWidth: "300",
      units: "mm",
    },
  });

  // Conversion factors for various units
  const conversionFactors: Record<string, Record<string, number>> = {
    // Length
    "mm": { "mm": 1, "inch": 0.0393701, "cm": 0.1, "m": 0.001, "ft": 0.00328084 },
    "inch": { "mm": 25.4, "inch": 1, "cm": 2.54, "m": 0.0254, "ft": 0.0833333 },
    "cm": { "mm": 10, "inch": 0.393701, "cm": 1, "m": 0.01, "ft": 0.0328084 },
    "m": { "mm": 1000, "inch": 39.3701, "cm": 100, "m": 1, "ft": 3.28084 },
    "ft": { "mm": 304.8, "inch": 12, "cm": 30.48, "m": 0.3048, "ft": 1 },
    
    // Weight
    "g": { "g": 1, "kg": 0.001, "lb": 0.00220462, "oz": 0.035274 },
    "kg": { "g": 1000, "kg": 1, "lb": 2.20462, "oz": 35.274 },
    "lb": { "g": 453.592, "kg": 0.453592, "lb": 1, "oz": 16 },
    "oz": { "g": 28.3495, "kg": 0.0283495, "lb": 0.0625, "oz": 1 },
    
    // Temperature
    "c": { "c": 1, "f": (val: number) => val * 1.8 + 32, "k": (val: number) => val + 273.15 },
    "f": { "c": (val: number) => (val - 32) / 1.8, "f": 1, "k": (val: number) => (val - 32) / 1.8 + 273.15 },
    "k": { "c": (val: number) => val - 273.15, "f": (val: number) => (val - 273.15) * 1.8 + 32, "k": 1 },
    
    // Area
    "mm2": { "mm2": 1, "cm2": 0.01, "m2": 0.000001, "in2": 0.00155 },
    "cm2": { "mm2": 100, "cm2": 1, "m2": 0.0001, "in2": 0.155 },
    "m2": { "mm2": 1000000, "cm2": 10000, "m2": 1, "in2": 1550 },
    "in2": { "mm2": 645.16, "cm2": 6.4516, "m2": 0.00064516, "in2": 1 },
    
    // Volume
    "ml": { "ml": 1, "l": 0.001, "cm3": 1, "in3": 0.0610237, "gal": 0.000264172 },
    "l": { "ml": 1000, "l": 1, "cm3": 1000, "in3": 61.0237, "gal": 0.264172 },
    "cm3": { "ml": 1, "l": 0.001, "cm3": 1, "in3": 0.0610237, "gal": 0.000264172 },
    "in3": { "ml": 16.3871, "l": 0.0163871, "cm3": 16.3871, "in3": 1, "gal": 0.004329 },
    "gal": { "ml": 3785.41, "l": 3.78541, "cm3": 3785.41, "in3": 231, "gal": 1 },
  };

  // Function to convert between units
  const convertUnits = (data: UnitConverterFormData) => {
    const { fromValue, fromUnit, toUnit } = data;
    
    if (fromUnit in conversionFactors && toUnit in conversionFactors[fromUnit]) {
      const conversion = conversionFactors[fromUnit][toUnit];
      
      // Handle temperature conversions which are functions
      if (typeof conversion === 'function') {
        setUnitResult(conversion(fromValue));
      } else {
        setUnitResult(fromValue * conversion);
      }
    }
  };

  // Calculate production time
  const calculateProductionTime = (data: ProductionTimeFormData) => {
    const { machineSpeed, quantity, setupTime, efficiency } = data;
    
    // Calculate the production time in hours
    const effectiveSpeed = machineSpeed * (efficiency / 100);
    const productionHours = quantity / effectiveSpeed;
    const setupHours = setupTime;
    const totalHours = productionHours + setupHours;
    
    // Calculate days and shifts (assuming 8 hour shifts)
    const shifts = totalHours / 8;
    const days = shifts / 3; // Assuming 3 shifts per day
    
    setTimeResult({
      totalHours,
      productionHours,
      setupHours,
      days,
      shifts,
    });
  };

  // Calculate film roll length and weight
  const calculateRollProperties = (data: FilmRollFormData) => {
    let { rollDiameter, coreDiameter, filmThickness, rollWidth } = data;
    
    // Convert to mm if units are in inches
    if (data.units === "inch") {
      rollDiameter = rollDiameter * 25.4;
      coreDiameter = coreDiameter * 25.4;
      filmThickness = filmThickness * 25.4;
      rollWidth = rollWidth * 25.4;
    }
    
    // Calculate the film length in meters
    // Formula: L = π(D² - d²)/(4t) where D is outer diameter, d is core diameter, t is film thickness
    const filmLengthMM = (Math.PI * (Math.pow(rollDiameter, 2) - Math.pow(coreDiameter, 2))) / (4 * filmThickness);
    const filmLengthM = filmLengthMM / 1000;
    
    // Calculate the film area in square meters
    const filmAreaM2 = filmLengthM * (rollWidth / 1000);
    
    // Estimate the weight using typical LDPE density (0.92 g/cm³)
    // Volume = Area * Thickness (converted to cm)
    const volumeCm3 = filmAreaM2 * 10000 * (filmThickness / 10000);
    const weightKg = volumeCm3 * 0.92 / 1000;
    
    setRollResult({
      filmLength: filmLengthM,
      filmArea: filmAreaM2,
      rollWeight: weightKg,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Utility Tools"
        text="Additional utilities and calculators for plastic manufacturing"
      >
        <Wrench className="h-6 w-6 mb-2" />
      </PageHeader>

      <Link href="/tools" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tools
      </Link>
      
      <Tabs defaultValue="unit-converter">
        <TabsList className="mb-4">
          <TabsTrigger value="unit-converter">Unit Converter</TabsTrigger>
          <TabsTrigger value="production-time">Production Time</TabsTrigger>
          <TabsTrigger value="film-roll">Film Roll Calculator</TabsTrigger>
        </TabsList>
        
        {/* Unit Converter */}
        <TabsContent value="unit-converter">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <ArrowLeftRight className="h-5 w-5 mr-2" />
                  Unit Converter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...unitForm}>
                  <form onSubmit={unitForm.handleSubmit(convertUnits)} className="space-y-4">
                    <FormField
                      control={unitForm.control}
                      name="fromValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="any" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={unitForm.control}
                        name="fromUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mm">Millimeter (mm)</SelectItem>
                                <SelectItem value="cm">Centimeter (cm)</SelectItem>
                                <SelectItem value="m">Meter (m)</SelectItem>
                                <SelectItem value="inch">Inch (in)</SelectItem>
                                <SelectItem value="ft">Foot (ft)</SelectItem>
                                <SelectItem value="g">Gram (g)</SelectItem>
                                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                <SelectItem value="lb">Pound (lb)</SelectItem>
                                <SelectItem value="oz">Ounce (oz)</SelectItem>
                                <SelectItem value="mm2">Square Millimeter (mm²)</SelectItem>
                                <SelectItem value="cm2">Square Centimeter (cm²)</SelectItem>
                                <SelectItem value="m2">Square Meter (m²)</SelectItem>
                                <SelectItem value="in2">Square Inch (in²)</SelectItem>
                                <SelectItem value="ml">Milliliter (ml)</SelectItem>
                                <SelectItem value="l">Liter (L)</SelectItem>
                                <SelectItem value="cm3">Cubic Centimeter (cm³)</SelectItem>
                                <SelectItem value="in3">Cubic Inch (in³)</SelectItem>
                                <SelectItem value="gal">Gallon (gal)</SelectItem>
                                <SelectItem value="c">Celsius (°C)</SelectItem>
                                <SelectItem value="f">Fahrenheit (°F)</SelectItem>
                                <SelectItem value="k">Kelvin (K)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={unitForm.control}
                        name="toUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mm">Millimeter (mm)</SelectItem>
                                <SelectItem value="cm">Centimeter (cm)</SelectItem>
                                <SelectItem value="m">Meter (m)</SelectItem>
                                <SelectItem value="inch">Inch (in)</SelectItem>
                                <SelectItem value="ft">Foot (ft)</SelectItem>
                                <SelectItem value="g">Gram (g)</SelectItem>
                                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                <SelectItem value="lb">Pound (lb)</SelectItem>
                                <SelectItem value="oz">Ounce (oz)</SelectItem>
                                <SelectItem value="mm2">Square Millimeter (mm²)</SelectItem>
                                <SelectItem value="cm2">Square Centimeter (cm²)</SelectItem>
                                <SelectItem value="m2">Square Meter (m²)</SelectItem>
                                <SelectItem value="in2">Square Inch (in²)</SelectItem>
                                <SelectItem value="ml">Milliliter (ml)</SelectItem>
                                <SelectItem value="l">Liter (L)</SelectItem>
                                <SelectItem value="cm3">Cubic Centimeter (cm³)</SelectItem>
                                <SelectItem value="in3">Cubic Inch (in³)</SelectItem>
                                <SelectItem value="gal">Gallon (gal)</SelectItem>
                                <SelectItem value="c">Celsius (°C)</SelectItem>
                                <SelectItem value="f">Fahrenheit (°F)</SelectItem>
                                <SelectItem value="k">Kelvin (K)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">Convert</Button>
                    
                    {unitResult !== null && (
                      <div className="mt-4 p-4 bg-muted rounded-md text-center">
                        <div className="text-sm font-medium text-muted-foreground">Result</div>
                        <div className="text-2xl font-bold">
                          {unitResult.toFixed(
                            // Show more decimal places for very small values
                            unitResult < 0.01 ? 6 : unitResult < 1 ? 4 : 2
                          )}
                          {' '}
                          {unitForm.getValues("toUnit")}
                        </div>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Common Conversion Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Length</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 inch</span>
                        <span>25.4 mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 foot</span>
                        <span>304.8 mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 meter</span>
                        <span>39.37 inches</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 micron (μm)</span>
                        <span>0.001 mm</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Weight</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 pound</span>
                        <span>453.6 g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 kg</span>
                        <span>2.205 pounds</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 ounce</span>
                        <span>28.35 g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 metric ton</span>
                        <span>1000 kg</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Volume</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 liter</span>
                        <span>1000 cm³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 gallon (US)</span>
                        <span>3.785 liters</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 cubic inch</span>
                        <span>16.39 cm³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 cubic foot</span>
                        <span>28.32 liters</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Area</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 square inch</span>
                        <span>645.16 mm²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 square foot</span>
                        <span>0.0929 m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 square meter</span>
                        <span>10.764 ft²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1 square yard</span>
                        <span>0.8361 m²</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Temperature</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">°F to °C</span>
                        <span>(°F - 32) × 5/9</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">°C to °F</span>
                        <span>(°C × 9/5) + 32</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">°C to K</span>
                        <span>°C + 273.15</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Production Time Calculator */}
        <TabsContent value="production-time">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Production Time Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...timeForm}>
                  <form onSubmit={timeForm.handleSubmit(calculateProductionTime)} className="space-y-4">
                    <FormField
                      control={timeForm.control}
                      name="machineSpeed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Machine Speed</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" step="any" />
                          </FormControl>
                          <FormDescription>
                            Units per hour
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={timeForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Production Quantity</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
                          </FormControl>
                          <FormDescription>
                            Total units to produce
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={timeForm.control}
                      name="setupTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setup Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" step="0.1" />
                          </FormControl>
                          <FormDescription>
                            Hours required for setup
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={timeForm.control}
                      name="efficiency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Machine Efficiency</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" max="100" />
                          </FormControl>
                          <FormDescription>
                            Percentage (typical range: 70-95%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">Calculate Production Time</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Time Calculation Results</CardTitle>
              </CardHeader>
              <CardContent>
                {timeResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">Total Time</h3>
                        <p className="text-2xl font-bold">
                          {timeResult.totalHours.toFixed(1)} hours
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">Shifts Required</h3>
                        <p className="text-2xl font-bold">
                          {Math.ceil(timeResult.shifts)} shifts
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        Approximately {Math.ceil(timeResult.days)} days 
                        {timeResult.days > 1 ? ' (3 shifts per day)' : ''}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Time Breakdown</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Setup Time:</span>
                          <span>{timeResult.setupHours.toFixed(1)} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Production Time:</span>
                          <span>{timeResult.productionHours.toFixed(1)} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Effective Speed:</span>
                          <span>
                            {(parseFloat(timeForm.getValues("machineSpeed")) * 
                              (parseFloat(timeForm.getValues("efficiency")) / 100)).toFixed(0)} units/hr
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Efficiency:</span>
                          <span>{timeForm.getValues("efficiency")}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>
                        <strong>Note:</strong> This calculation assumes continuous 
                        operation. Actual production time may vary due to unplanned 
                        downtime, maintenance, and other factors.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-center">
                    <div>
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Enter production details and click "Calculate Production Time" to see results.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Film Roll Calculator */}
        <TabsContent value="film-roll">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <RotateCw className="h-5 w-5 mr-2" />
                  Film Roll Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...rollForm}>
                  <form onSubmit={rollForm.handleSubmit(calculateRollProperties)} className="space-y-4">
                    <FormField
                      control={rollForm.control}
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
                        control={rollForm.control}
                        name="rollDiameter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roll Diameter</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="any" />
                            </FormControl>
                            <FormDescription>
                              {rollForm.watch("units") === "mm" ? "mm" : "inches"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={rollForm.control}
                        name="coreDiameter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Core Diameter</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="any" />
                            </FormControl>
                            <FormDescription>
                              {rollForm.watch("units") === "mm" ? "mm" : "inches"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={rollForm.control}
                        name="filmThickness"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Film Thickness</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="any" />
                            </FormControl>
                            <FormDescription>
                              Microns (μm)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={rollForm.control}
                        name="rollWidth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roll Width</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="any" />
                            </FormControl>
                            <FormDescription>
                              {rollForm.watch("units") === "mm" ? "mm" : "inches"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">Calculate Roll Properties</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Roll Calculation Results</CardTitle>
              </CardHeader>
              <CardContent>
                {rollResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">Film Length</h3>
                        <p className="text-2xl font-bold">
                          {rollResult.filmLength.toFixed(1)} m
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">Roll Weight</h3>
                        <p className="text-2xl font-bold">
                          {rollResult.rollWeight.toFixed(2)} kg
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        Film Area: {rollResult.filmArea.toFixed(2)} m²
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Roll Specifications</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Roll Diameter:</span>
                          <span>
                            {rollForm.getValues("rollDiameter")} {rollForm.getValues("units")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Core Diameter:</span>
                          <span>
                            {rollForm.getValues("coreDiameter")} {rollForm.getValues("units")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Film Thickness:</span>
                          <span>
                            {rollForm.getValues("filmThickness")} μm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Roll Width:</span>
                          <span>
                            {rollForm.getValues("rollWidth")} {rollForm.getValues("units")}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>
                        <strong>Note:</strong> Weight calculation assumes LDPE film with a density of 0.92 g/cm³.
                        Adjust for different materials by multiplying the result by the ratio of densities.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-center">
                    <div>
                      <RotateCw className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Enter roll specifications and click "Calculate Roll Properties" to see results.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}