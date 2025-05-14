import { useState, useRef, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Palette, ArrowLeft, Upload, Droplets } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { colord } from "colord";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schema with validation
const colorMixSchema = z.object({
  colorModel: z.enum(["cmyk", "rgb"]),
  // CMYK fields
  cyan: z.string().transform(val => parseFloat(val)),
  magenta: z.string().transform(val => parseFloat(val)),
  yellow: z.string().transform(val => parseFloat(val)),
  black: z.string().transform(val => parseFloat(val)),
  // RGB fields
  red: z.string().transform(val => parseInt(val)),
  green: z.string().transform(val => parseInt(val)),
  blue: z.string().transform(val => parseInt(val)),
  // Target color (hex)
  targetColor: z.string().optional(),
});

type ColorMixFormData = z.infer<typeof colorMixSchema>;

// Simplified color mix type for display
type ColorMix = {
  name: string;
  percentage: number;
  colorCode: string;
};

// Standard printing ink colors with their hex values
const standardInks = {
  cmyk: [
    { name: "Process Cyan", colorCode: "#00AEEF", cmyk: [100, 0, 0, 0] },
    { name: "Process Magenta", colorCode: "#EC008C", cmyk: [0, 100, 0, 0] },
    { name: "Process Yellow", colorCode: "#FFF200", cmyk: [0, 0, 100, 0] },
    { name: "Process Black", colorCode: "#000000", cmyk: [0, 0, 0, 100] },
    { name: "Transparent White", colorCode: "#FFFFFF", cmyk: [0, 0, 0, 0] },
    { name: "Rhodamine Red", colorCode: "#E63E8C", cmyk: [0, 88, 0, 0] },
    { name: "Warm Red", colorCode: "#FF5000", cmyk: [0, 82, 100, 0] },
    { name: "Reflex Blue", colorCode: "#001489", cmyk: [100, 70, 0, 0] },
  ],
  rgb: [
    { name: "Red", colorCode: "#FF0000", rgb: [255, 0, 0] },
    { name: "Green", colorCode: "#00FF00", rgb: [0, 255, 0] },
    { name: "Blue", colorCode: "#0000FF", rgb: [0, 0, 255] },
    { name: "Black", colorCode: "#000000", rgb: [0, 0, 0] },
    { name: "White", colorCode: "#FFFFFF", rgb: [255, 255, 255] },
  ]
};

// Function to convert RGB to CMYK
function rgbToCmyk(r: number, g: number, b: number) {
  // Normalize RGB values
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  // Calculate CMY
  let cyan = 1 - red;
  let magenta = 1 - green;
  let yellow = 1 - blue;

  // Calculate K (black)
  let black = Math.min(cyan, magenta, yellow);

  // Adjust CMY values
  if (black === 1) {
    cyan = 0;
    magenta = 0;
    yellow = 0;
  } else {
    cyan = (cyan - black) / (1 - black);
    magenta = (magenta - black) / (1 - black);
    yellow = (yellow - black) / (1 - black);
  }

  // Convert to percentages
  return {
    c: Math.round(cyan * 100),
    m: Math.round(magenta * 100),
    y: Math.round(yellow * 100),
    k: Math.round(black * 100)
  };
}

// Function to convert CMYK to RGB
function cmykToRgb(c: number, m: number, y: number, k: number) {
  // Normalize CMYK values
  const cyan = c / 100;
  const magenta = m / 100;
  const yellow = y / 100;
  const black = k / 100;

  // Calculate RGB
  const red = Math.round(255 * (1 - cyan) * (1 - black));
  const green = Math.round(255 * (1 - magenta) * (1 - black));
  const blue = Math.round(255 * (1 - yellow) * (1 - black));

  return { r: red, g: green, b: blue };
}

// Function to convert RGB to Hex
function rgbToHex(r: number, g: number, b: number) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

// Function to convert Hex to RGB
function hexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

// Function to calculate color difference (simple Euclidean distance in RGB space)
function colorDistance(color1: { r: number, g: number, b: number }, color2: { r: number, g: number, b: number }) {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
}

// Function to suggest ink mixes based on target color
function suggestInkMixes(targetColor: string, colorModel: "cmyk" | "rgb") {
  const targetRgb = hexToRgb(targetColor);
  const mixSuggestions: ColorMix[] = [];

  // Simple approach: find the closest standard ink colors and suggest a mix
  if (colorModel === "cmyk") {
    // Convert target to CMYK
    const targetCmyk = rgbToCmyk(targetRgb.r, targetRgb.g, targetRgb.b);
    
    // Generate mix suggestion using CMYK process colors
    if (targetCmyk.c > 0) {
      mixSuggestions.push({
        name: "Process Cyan",
        percentage: targetCmyk.c,
        colorCode: "#00AEEF"
      });
    }
    
    if (targetCmyk.m > 0) {
      mixSuggestions.push({
        name: "Process Magenta",
        percentage: targetCmyk.m,
        colorCode: "#EC008C"
      });
    }
    
    if (targetCmyk.y > 0) {
      mixSuggestions.push({
        name: "Process Yellow",
        percentage: targetCmyk.y,
        colorCode: "#FFF200"
      });
    }
    
    if (targetCmyk.k > 0) {
      mixSuggestions.push({
        name: "Process Black",
        percentage: targetCmyk.k,
        colorCode: "#000000"
      });
    }
    
    // If it's a very light color, add white
    if (targetCmyk.c + targetCmyk.m + targetCmyk.y + targetCmyk.k < 50) {
      const whitePercentage = 100 - (targetCmyk.c + targetCmyk.m + targetCmyk.y + targetCmyk.k);
      if (whitePercentage > 0) {
        mixSuggestions.push({
          name: "Transparent White",
          percentage: whitePercentage,
          colorCode: "#FFFFFF"
        });
      }
    }
  } else {
    // RGB model - find closest mix using RGB primaries
    if (targetRgb.r > 0) {
      mixSuggestions.push({
        name: "Red",
        percentage: (targetRgb.r / 255) * 100,
        colorCode: "#FF0000"
      });
    }
    
    if (targetRgb.g > 0) {
      mixSuggestions.push({
        name: "Green",
        percentage: (targetRgb.g / 255) * 100,
        colorCode: "#00FF00"
      });
    }
    
    if (targetRgb.b > 0) {
      mixSuggestions.push({
        name: "Blue",
        percentage: (targetRgb.b / 255) * 100,
        colorCode: "#0000FF"
      });
    }
    
    // If it's a dark color, add black
    const maxComponent = Math.max(targetRgb.r, targetRgb.g, targetRgb.b);
    if (maxComponent < 128) {
      const blackPercentage = ((255 - maxComponent) / 255) * 50; // Adjust for better visual results
      mixSuggestions.push({
        name: "Black",
        percentage: blackPercentage,
        colorCode: "#000000"
      });
    }
    
    // If it's a light color, add white
    if (maxComponent < 200) {
      const whitePercentage = ((255 - maxComponent) / 255) * 20; // Adjust for better visual results
      mixSuggestions.push({
        name: "White",
        percentage: whitePercentage,
        colorCode: "#FFFFFF"
      });
    }
  }

  // Sort by percentage (descending)
  return mixSuggestions.sort((a, b) => b.percentage - a.percentage);
}

// Function to analyze an image and extract dominant colors
async function analyzeImage(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to analyze image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = img.width;
        const height = img.height;
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Sample pixels (simplified approach - sample grid points)
        const sampleSize = Math.max(1, Math.floor(Math.min(width, height) / 20));
        const colors: string[] = [];
        
        for (let x = 0; x < width; x += sampleSize) {
          for (let y = 0; y < height; y += sampleSize) {
            const data = ctx.getImageData(x, y, 1, 1).data;
            const hex = rgbToHex(data[0], data[1], data[2]);
            colors.push(hex);
          }
        }
        
        // Extract dominant colors (simplified - just take unique colors)
        const uniqueColorsSet = new Set(colors);
        const uniqueColors = Array.from(uniqueColorsSet);
        
        // Return top colors (limited to 8)
        resolve(uniqueColors.slice(0, 8));
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
      
      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
}

export default function MixColorsCalculator() {
  const [results, setResults] = useState<ColorMix[] | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [selectedExtractedColor, setSelectedExtractedColor] = useState<string | null>(null);
  const [targetColorPreview, setTargetColorPreview] = useState("#5A7D9A");
  const [mixedColorPreview, setMixedColorPreview] = useState("#5A7D9A");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize form with default values
  const form = useForm<ColorMixFormData>({
    resolver: zodResolver(colorMixSchema),
    defaultValues: {
      colorModel: "cmyk",
      cyan: "50",
      magenta: "20",
      yellow: "0",
      black: "40",
      red: "90",
      green: "125",
      blue: "154",
      targetColor: "#5A7D9A",
    },
  });

  // Update color preview when form values change
  const watchedValues = form.watch();
  
  useEffect(() => {
    if (watchedValues.colorModel === "cmyk") {
      const c = parseFloat(watchedValues.cyan?.toString() || "0");
      const m = parseFloat(watchedValues.magenta?.toString() || "0");
      const y = parseFloat(watchedValues.yellow?.toString() || "0");
      const k = parseFloat(watchedValues.black?.toString() || "0");
      
      const rgb = cmykToRgb(c, m, y, k);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setMixedColorPreview(hex);
    } else {
      const r = parseInt(watchedValues.red?.toString() || "0");
      const g = parseInt(watchedValues.green?.toString() || "0");
      const b = parseInt(watchedValues.blue?.toString() || "0");
      
      const hex = rgbToHex(r, g, b);
      setMixedColorPreview(hex);
    }
  }, [watchedValues]);

  // Handle target color change
  useEffect(() => {
    if (watchedValues.targetColor) {
      setTargetColorPreview(watchedValues.targetColor);
    }
  }, [watchedValues.targetColor]);

  // Calculate the color mix based on form data
  const calculateColorMix = (data: ColorMixFormData) => {
    const targetColor = data.targetColor || "#5A7D9A";
    setTargetColorPreview(targetColor);
    
    // Calculate suggested ink mix
    const suggestions = suggestInkMixes(targetColor, data.colorModel);
    setResults(suggestions);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setUploadError('Please upload an image file');
      return;
    }
    
    try {
      const dominantColors = await analyzeImage(file);
      setExtractedColors(dominantColors);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setUploadError('Error analyzing image. Please try a different file.');
    }
  };

  // Handle extracted color selection
  const handleExtractedColorSelect = (color: string) => {
    setSelectedExtractedColor(color);
    form.setValue('targetColor', color);
    setTargetColorPreview(color);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Mix Colors Calculator"
        description="Calculate color formulas for printing special colors"
        icon="palette"
      />

      <Link href="/tools" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tools
      </Link>
      
      <Tabs defaultValue="calculator">
        <TabsList className="mb-4">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="upload">Upload Design</TabsTrigger>
          <TabsTrigger value="guide">Usage Guide</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Color Specifications</CardTitle>
                <CardDescription>
                  Enter color values or select a target color
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(calculateColorMix)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="colorModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Model</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select color model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cmyk">CMYK (Printing)</SelectItem>
                              <SelectItem value="rgb">RGB (Digital)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("colorModel") === "cmyk" ? (
                      <>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="cyan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Cyan: {field.value}%
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[parseFloat(field.value?.toString() || "0")]}
                                    onValueChange={(value) => field.onChange(String(value[0]))}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="pt-2"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="magenta"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Magenta: {field.value}%
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[parseFloat(field.value?.toString() || "0")]}
                                    onValueChange={(value) => field.onChange(String(value[0]))}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="pt-2"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="yellow"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Yellow: {field.value}%
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[parseFloat(field.value?.toString() || "0")]}
                                    onValueChange={(value) => field.onChange(String(value[0]))}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="pt-2"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="black"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Black: {field.value}%
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[parseFloat(field.value?.toString() || "0")]}
                                    onValueChange={(value) => field.onChange(String(value[0]))}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="pt-2"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="red"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Red: {field.value}
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[parseInt(field.value?.toString() || "0")]}
                                    onValueChange={(value) => field.onChange(String(value[0]))}
                                    min={0}
                                    max={255}
                                    step={1}
                                    className="pt-2"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="green"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Green: {field.value}
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[parseInt(field.value?.toString() || "0")]}
                                    onValueChange={(value) => field.onChange(String(value[0]))}
                                    min={0}
                                    max={255}
                                    step={1}
                                    className="pt-2"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="blue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Blue: {field.value}
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[parseInt(field.value?.toString() || "0")]}
                                    onValueChange={(value) => field.onChange(String(value[0]))}
                                    min={0}
                                    max={255}
                                    step={1}
                                    className="pt-2"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    <Separator className="my-4" />
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="targetColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Color</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input {...field} placeholder="#5A7D9A" />
                              </FormControl>
                              <div 
                                className="w-10 h-10 rounded border"
                                style={{ backgroundColor: targetColorPreview }}
                              />
                            </div>
                            <FormDescription>
                              Enter a hex color code (e.g., #5A7D9A)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col space-y-4 mt-6">
                      <div className="flex space-x-4 items-center">
                        <div className="flex-1">
                          <Label>Input Color</Label>
                          <div className="h-12 mt-1 rounded-md border" style={{ backgroundColor: mixedColorPreview }}></div>
                        </div>
                        <div className="flex-1">
                          <Label>Target Color</Label>
                          <div className="h-12 mt-1 rounded-md border" style={{ backgroundColor: targetColorPreview }}></div>
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full mt-4">
                        <Droplets className="mr-2 h-4 w-4" />
                        Calculate Color Mix
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Color Mix Results</CardTitle>
                <CardDescription>
                  Suggested ink formulation for your target color
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-6">
                    <div className="flex flex-col space-y-2">
                      <Label>Target Color</Label>
                      <div className="h-16 rounded-md flex items-center justify-center border" 
                           style={{ backgroundColor: targetColorPreview }}>
                        <span className="text-xs font-mono bg-white bg-opacity-70 px-2 py-1 rounded">
                          {targetColorPreview}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Suggested Ink Formula</Label>
                      {results.length > 0 ? (
                        <div className="space-y-2">
                          {results.map((mix, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div 
                                className="w-6 h-6 rounded-full" 
                                style={{ backgroundColor: mix.colorCode }}
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{mix.name}</div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${mix.percentage}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-sm font-medium">{mix.percentage.toFixed(1)}%</div>
                            </div>
                          ))}
                          
                          <Separator className="my-4" />
                          
                          <div className="text-sm text-muted-foreground mt-2">
                            <p>
                              <b>Mixing Instructions:</b> Combine the inks in the proportions shown above. 
                              Start with the highest percentage ink and add smaller percentages gradually.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted rounded-md text-center">
                          No mix suggestions available for this color
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center text-muted-foreground">
                    <Droplets className="h-12 w-12" />
                    <div>
                      <p className="text-lg font-medium">No Color Mix Calculated</p>
                      <p className="text-sm">Enter your color specifications and click Calculate</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Design</CardTitle>
              <CardDescription>
                Upload an image to extract colors and generate color formulas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Upload className="h-8 w-8 mb-4 text-muted-foreground" />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Image
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF, BMP
                </p>
              </div>
              
              {uploadError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {extractedColors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Extracted Colors</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {extractedColors.map((color, index) => (
                      <div 
                        key={index} 
                        className={`
                          h-20 rounded-md cursor-pointer flex items-end justify-center p-2
                          hover:ring-2 hover:ring-primary transition-all
                          ${selectedExtractedColor === color ? 'ring-2 ring-primary' : ''}
                        `}
                        style={{ backgroundColor: color }}
                        onClick={() => handleExtractedColorSelect(color)}
                      >
                        <span className="text-xs font-mono bg-white bg-opacity-70 px-2 py-1 rounded">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {selectedExtractedColor && (
                    <div className="mt-6">
                      <Button 
                        onClick={() => form.handleSubmit(calculateColorMix)()}
                        className="w-full"
                      >
                        Calculate Formula for Selected Color
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle>How to Use the Color Mixing Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">About This Tool</h3>
                <p>
                  The Color Mixing Calculator helps printing operators find the correct formula for special colors.
                  It can calculate the percentage of CMYK or RGB colors needed to create a specific color,
                  and even analyze uploaded designs to extract colors and provide mixing formulas.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Using the Calculator</h3>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Method 1: Enter Color Values</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Select your preferred color model (CMYK for printing, RGB for digital)</li>
                    <li>Adjust the sliders to set your desired color values</li>
                    <li>Or enter a specific hex color code in the Target Color field</li>
                    <li>Click "Calculate Color Mix" to get the suggested ink formula</li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Method 2: Upload a Design</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Go to the "Upload Design" tab</li>
                    <li>Click "Upload Image" and select your design file</li>
                    <li>The tool will extract the dominant colors from your design</li>
                    <li>Click on any extracted color to select it</li>
                    <li>Click "Calculate Formula for Selected Color" to get the mixing formula</li>
                  </ol>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Tips for Accurate Color Mixing</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Start with the highest percentage ink and add smaller amounts gradually</li>
                  <li>Mix a small sample batch first to check the color match</li>
                  <li>Remember that printed colors may appear differently from screen colors</li>
                  <li>For best results, use standardized inks and consistent mixing conditions</li>
                  <li>Keep records of successful mixes for future reference</li>
                </ul>
              </div>
              
              <Alert>
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  This tool provides approximations based on theoretical color models. 
                  Actual ink behavior may vary based on substrate, printing method, and ink properties.
                  Always test your color mix before full production.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}