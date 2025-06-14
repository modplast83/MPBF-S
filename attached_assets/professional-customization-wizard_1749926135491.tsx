import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Palette, 
  Ruler, 
  Package, 
  Eye,
  Download,
  RotateCcw,
  Brush,
  Square,
  Circle,
  Type,
  Move
} from "lucide-react";

interface CustomizationState {
  productType: string;
  template: string;
  dimensions: {
    width: number;
    length: number;
    gusset: number;
    thickness: number;
  };
  materialColor: string;
  uploadedDesign: File | null;
  designColors: string[];
  canvasDesign: string | null;
  finalPreview: boolean;
}

const PRODUCT_TYPES = [
  { id: "shopping-bag", name: "Shopping Bag", icon: "🛍️" },
  { id: "table-cover", name: "Table Cover", icon: "🪑" },
  { id: "packing-bags", name: "Packing Bags", icon: "📦" },
  { id: "garbage-bags", name: "Garbage Bags", icon: "🗑️" }
];

const TEMPLATES = [
  { id: "t-shirt", name: "T-Shirt Template", description: "Classic t-shirt bag design", productTypes: ["shopping-bag"] },
  { id: "t-shirt-hook", name: "T-Shirt with Hook", description: "T-shirt bag with hanging hook", productTypes: ["shopping-bag"] },
  { id: "d-cut", name: "D-Cut Template", description: "D-shaped handle design", productTypes: ["shopping-bag"] },
  { id: "non-cut", name: "Non-Cut Template", description: "No handle cuts", productTypes: ["packing-bags", "garbage-bags"] },
  { id: "sheet", name: "Sheet Template", description: "Flat sheet design", productTypes: ["table-cover"] }
];

const MATERIAL_COLORS = [
  { id: "clear", name: "Clear", hex: "#ffffff", border: true },
  { id: "white", name: "White", hex: "#ffffff" },
  { id: "black", name: "Black", hex: "#000000" },
  { id: "red", name: "Red", hex: "#ef4444" },
  { id: "green", name: "Green", hex: "#22c55e" },
  { id: "blue", name: "Blue", hex: "#3b82f6" },
  { id: "pink", name: "Pink", hex: "#ec4899" },
  { id: "gold", name: "Gold", hex: "#fbbf24" },
  { id: "silver", name: "Silver", hex: "#94a3b8" },
  { id: "brown", name: "Brown", hex: "#a3a3a3" },
  { id: "gray", name: "Gray", hex: "#6b7280" },
  { id: "purple", name: "Purple", hex: "#8b5cf6" },
  { id: "orange", name: "Orange", hex: "#f97316" },
  { id: "light-blue", name: "Light Blue", hex: "#38bdf8" },
  { id: "ivory", name: "Ivory", hex: "#fffbeb" },
  { id: "yellow", name: "Yellow", hex: "#eab308" }
];

const DESIGN_COLORS = [
  "#000000", "#ef4444", "#22c55e", "#3b82f6", "#fbbf24", 
  "#ec4899", "#8b5cf6", "#f97316", "#6b7280", "#ffffff"
];

export default function ProfessionalCustomizationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [customization, setCustomization] = useState<CustomizationState>({
    productType: "",
    template: "",
    dimensions: { width: 30, length: 40, gusset: 10, thickness: 0.02 },
    materialColor: "",
    uploadedDesign: null,
    designColors: [],
    canvasDesign: null,
    finalPreview: false
  });

  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState("brush");
  const [brushSize, setBrushSize] = useState(5);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { toast } = useToast();

  const steps = [
    "Product & Template",
    "Dimensions",
    "Material Color", 
    "Design Upload",
    "Design Tools",
    "Final Preview"
  ];

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.strokeStyle = selectedColor;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PNG, JPG, PDF, or SVG files only.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setCustomization(prev => ({ ...prev, uploadedDesign: file }));

    // Create preview for image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDesignPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    toast({
      title: "Design uploaded successfully",
      description: `${file.name} has been uploaded and will be vectorized.`,
    });
  };

  const addDesignColor = (color: string) => {
    if (customization.designColors.length >= 4) {
      toast({
        title: "Maximum colors reached",
        description: "You can use up to 4 colors in your design.",
        variant: "destructive",
      });
      return;
    }
    
    if (!customization.designColors.includes(color)) {
      setCustomization(prev => ({
        ...prev,
        designColors: [...prev.designColors, color]
      }));
    }
  };

  const removeDesignColor = (color: string) => {
    setCustomization(prev => ({
      ...prev,
      designColors: prev.designColors.filter(c => c !== color)
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return customization.productType && customization.template;
      case 1: return true; // Dimensions have defaults
      case 2: return customization.materialColor;
      case 3: return true; // Design upload is optional
      case 4: return true; // Design tools are optional
      case 5: return true; // Final preview
      default: return false;
    }
  };

  const renderTemplatePreview = (template: string, materialColor: string) => {
    const color = MATERIAL_COLORS.find(c => c.id === materialColor)?.hex || "#ffffff";
    const strokeColor = color === "#ffffff" || color === "#fffbeb" ? "#333" : "#000";
    
    switch (template) {
      case "t-shirt":
        // T-shirt bag - exactly like your blue sample
        return (
          <div className="w-32 h-40 mx-auto relative">
            <svg viewBox="0 0 100 130" className="w-full h-full">
              {/* Single path outlining the entire T-shirt bag shape */}
              <path 
                d="M15 40 
                   L15 15 
                   L25 15 
                   L25 35 
                   L50 35 
                   L75 35 
                   L75 15 
                   L85 15 
                   L85 40 
                   L85 120 
                   L15 120 
                   Z" 
                fill={color}
                stroke={strokeColor}
                strokeWidth="1.5"
              />
              {/* Left handle cutout - much larger */}
              <path 
                d="M25 15 
                   C 25 22 25 30 25 35 
                   L50 35 
                   C 50 30 50 22 50 15" 
                fill="white" 
                stroke={strokeColor} 
                strokeWidth="1"
              />
              {/* Right handle cutout - much larger */}
              <path 
                d="M50 15 
                   C 50 22 50 30 50 35 
                   L75 35 
                   C 75 30 75 22 75 15" 
                fill="white" 
                stroke={strokeColor} 
                strokeWidth="1"
              />
            </svg>
          </div>
        );
      
      case "t-shirt-hook":
        // T-shirt bag with hook - same clean design with hook
        return (
          <div className="w-32 h-40 mx-auto relative">
            <svg viewBox="0 0 100 130" className="w-full h-full">
              {/* Single path outlining the entire T-shirt bag shape */}
              <path 
                d="M15 40 
                   L15 15 
                   L25 15 
                   L25 35 
                   L50 35 
                   L75 35 
                   L75 15 
                   L85 15 
                   L85 40 
                   L85 120 
                   L15 120 
                   Z" 
                fill={color}
                stroke={strokeColor}
                strokeWidth="1.5"
              />
              {/* Left handle cutout - much larger */}
              <path 
                d="M25 15 
                   C 25 22 25 30 25 35 
                   L50 35 
                   C 50 30 50 22 50 15" 
                fill="white" 
                stroke={strokeColor} 
                strokeWidth="1"
              />
              {/* Right handle cutout - much larger */}
              <path 
                d="M50 15 
                   C 50 22 50 30 50 35 
                   L75 35 
                   C 75 30 75 22 75 15" 
                fill="white" 
                stroke={strokeColor} 
                strokeWidth="1"
              />
              {/* Hook cutout at top center */}
              <ellipse cx="50" cy="10" rx="3" ry="2" fill="white" stroke={strokeColor} strokeWidth="1"/>
            </svg>
          </div>
        );
      
      case "d-cut":
        // D-Cut bag - rectangular with D-shaped handle
        return (
          <div className="w-32 h-40 mx-auto relative">
            <svg viewBox="0 0 100 130" className="w-full h-full">
              {/* Main bag body */}
              <rect 
                x="20" y="10" width="60" height="110" 
                fill={color}
                stroke={strokeColor}
                strokeWidth="1.5"
              />
              {/* D-shaped handle cutout */}
              <path 
                d="M35 15 L65 15 C 70 15 70 25 65 25 L35 25 C 30 25 30 15 35 15 Z" 
                fill="white" 
                stroke={strokeColor} 
                strokeWidth="1"
              />
            </svg>
          </div>
        );
      
      case "non-cut":
        // Non-cut bag - simple rectangular bag without handles
        return (
          <div className="w-32 h-40 mx-auto relative">
            <svg viewBox="0 0 100 130" className="w-full h-full">
              {/* Simple rectangular bag */}
              <rect 
                x="25" y="20" width="50" height="90" 
                fill={color}
                stroke={strokeColor}
                strokeWidth="1.5"
                rx="2"
              />
              {/* Optional top seal */}
              <line 
                x1="25" y1="30" x2="75" y2="30" 
                stroke={strokeColor} 
                strokeWidth="1" 
                strokeDasharray="2,2"
              />
            </svg>
          </div>
        );
      
      case "sheet":
        // Sheet template - flat packaging style
        return (
          <div className="w-32 h-40 mx-auto relative">
            <svg viewBox="0 0 100 130" className="w-full h-full">
              {/* Flat sheet/pouch */}
              <rect 
                x="15" y="25" width="70" height="80" 
                fill={color}
                stroke={strokeColor}
                strokeWidth="1.5"
                rx="1"
              />
              {/* Top seal line */}
              <line 
                x1="15" y1="35" x2="85" y2="35" 
                stroke={strokeColor} 
                strokeWidth="1.5"
              />
              {/* Side seals */}
              <line 
                x1="20" y1="25" x2="20" y2="105" 
                stroke={strokeColor} 
                strokeWidth="1" 
                strokeDasharray="1,1"
              />
              <line 
                x1="80" y1="25" x2="80" y2="105" 
                stroke={strokeColor} 
                strokeWidth="1" 
                strokeDasharray="1,1"
              />
            </svg>
          </div>
        );
      
      default:
        return (
          <div className="w-32 h-40 mx-auto bg-gray-200 rounded flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">Professional Product Customization</h1>
        
        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {index + 1}
              </div>
              <span className="text-xs mt-2 text-center max-w-20">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Customization Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep]}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Step 0: Product & Template Selection */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-4 block">Select Product Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {PRODUCT_TYPES.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => setCustomization(prev => ({ ...prev, productType: product.id }))}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            customization.productType === product.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-2xl mb-2">{product.icon}</div>
                          <div className="font-medium">{product.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {customization.productType && (
                    <div>
                      <Label className="text-base font-medium mb-4 block">Select Template</Label>
                      <div className="space-y-3">
                        {TEMPLATES.filter(template => 
                          template.productTypes.includes(customization.productType)
                        ).map((template) => (
                          <div
                            key={template.id}
                            onClick={() => setCustomization(prev => ({ ...prev, template: template.id }))}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              customization.template === template.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-gray-600">{template.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: Dimensions */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="width">Width (cm)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={customization.dimensions.width}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, width: Number(e.target.value) }
                        }))}
                        min="10"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="length">Length (cm)</Label>
                      <Input
                        id="length"
                        type="number"
                        value={customization.dimensions.length}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, length: Number(e.target.value) }
                        }))}
                        min="10"
                        max="150"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gusset">Gusset (cm)</Label>
                      <Input
                        id="gusset"
                        type="number"
                        value={customization.dimensions.gusset}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, gusset: Number(e.target.value) }
                        }))}
                        min="0"
                        max="30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="thickness">Thickness (mm)</Label>
                      <Input
                        id="thickness"
                        type="number"
                        step="0.01"
                        value={customization.dimensions.thickness}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          dimensions: { ...prev.dimensions, thickness: Number(e.target.value) }
                        }))}
                        min="0.01"
                        max="0.20"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Size Optimization</h4>
                    <p className="text-sm text-gray-600">
                      Dimensions are automatically optimized for screen display and printing efficiency.
                      Current ratio: {(customization.dimensions.width / customization.dimensions.length).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Material Color */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Select Material Color</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {MATERIAL_COLORS.map((color) => (
                      <div
                        key={color.id}
                        onClick={() => setCustomization(prev => ({ ...prev, materialColor: color.id }))}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          customization.materialColor === color.id
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div 
                          className={`w-full h-8 rounded mb-2 ${color.border ? "border border-gray-300" : ""}`}
                          style={{ backgroundColor: color.hex }}
                        ></div>
                        <div className="text-xs text-center font-medium">{color.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Design Upload */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-4 block">Upload Logo or Design</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Upload your design file</p>
                        <p className="text-sm text-gray-600">
                          Supports: AI, EPS, PDF, PNG, JPG (Max 10MB)
                        </p>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          accept=".ai,.eps,.pdf,.png,.jpg,.jpeg,.svg"
                          className="hidden"
                          id="design-upload"
                        />
                        <Button
                          onClick={() => document.getElementById('design-upload')?.click()}
                          variant="outline"
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>
                    
                    {customization.uploadedDesign && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-800">
                            {customization.uploadedDesign.name}
                          </span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Design uploaded successfully and will be vectorized to black color
                        </p>
                      </div>
                    )}

                    {designPreview && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium">Preview</Label>
                        <div className="mt-2 border rounded-lg p-4 bg-white">
                          <img 
                            src={designPreview} 
                            alt="Design preview" 
                            className="max-w-full max-h-64 mx-auto object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Design Tools */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-4 block">Draw and Paint Tools</Label>
                    
                    {/* Tool Selection */}
                    <div className="flex space-x-2 mb-4">
                      <Button
                        variant={selectedTool === "brush" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool("brush")}
                      >
                        <Brush className="h-4 w-4 mr-1" /> Brush
                      </Button>
                      <Button
                        variant={selectedTool === "rectangle" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool("rectangle")}
                      >
                        <Square className="h-4 w-4 mr-1" /> Rectangle
                      </Button>
                      <Button
                        variant={selectedTool === "circle" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool("circle")}
                      >
                        <Circle className="h-4 w-4 mr-1" /> Circle
                      </Button>
                      <Button
                        variant={selectedTool === "text" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool("text")}
                      >
                        <Type className="h-4 w-4 mr-1" /> Text
                      </Button>
                    </div>

                    {/* Color Palette */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Design Colors (Max 4)</Label>
                      <div className="flex space-x-2 mb-2">
                        {DESIGN_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setSelectedColor(color);
                              addDesignColor(color);
                            }}
                            className={`w-8 h-8 rounded border-2 ${
                              selectedColor === color ? "border-blue-500" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      {/* Selected Colors */}
                      <div className="flex space-x-2 items-center">
                        <span className="text-sm text-gray-600">Selected colors:</span>
                        {customization.designColors.map((color) => (
                          <Badge
                            key={color}
                            variant="secondary"
                            className="flex items-center space-x-1"
                          >
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: color }}
                            ></div>
                            <button
                              onClick={() => removeDesignColor(color)}
                              className="ml-1 text-xs hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        <span className="text-xs text-gray-500">
                          ({customization.designColors.length}/4)
                        </span>
                      </div>
                    </div>

                    {/* Brush Size */}
                    {selectedTool === "brush" && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium mb-2 block">
                          Brush Size: {brushSize}px
                        </Label>
                        <Slider
                          value={[brushSize]}
                          onValueChange={(value) => setBrushSize(value[0])}
                          max={20}
                          min={1}
                          step={1}
                          className="w-32"
                        />
                      </div>
                    )}

                    {/* Drawing Canvas */}
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium">Design Canvas</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearCanvas}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" /> Clear
                        </Button>
                      </div>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={300}
                        className="border border-gray-200 cursor-crosshair w-full max-w-md"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Final Preview */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4">Final Product Preview</h3>
                    
                    {/* Product Template with Design */}
                    <div className="bg-gray-50 p-8 rounded-lg">
                      {renderTemplatePreview(customization.template, customization.materialColor)}
                      
                      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                        <div className="text-left">
                          <strong>Product:</strong> {PRODUCT_TYPES.find(p => p.id === customization.productType)?.name}
                          <br />
                          <strong>Template:</strong> {TEMPLATES.find(t => t.id === customization.template)?.name}
                          <br />
                          <strong>Material:</strong> {MATERIAL_COLORS.find(c => c.id === customization.materialColor)?.name}
                        </div>
                        <div className="text-left">
                          <strong>Dimensions:</strong>
                          <br />
                          Width: {customization.dimensions.width} cm
                          <br />
                          Length: {customization.dimensions.length} cm
                          <br />
                          Gusset: {customization.dimensions.gusset} cm
                          <br />
                          Thickness: {customization.dimensions.thickness} mm
                        </div>
                      </div>

                      {customization.designColors.length > 0 && (
                        <div className="mt-4">
                          <strong className="text-sm">Design Colors:</strong>
                          <div className="flex justify-center space-x-2 mt-2">
                            {customization.designColors.map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-center space-x-4">
                      <Button variant="outline" onClick={() => {
                        const specData = {
                          product: PRODUCT_TYPES.find(p => p.id === customization.productType)?.name,
                          template: TEMPLATES.find(t => t.id === customization.template)?.name,
                          dimensions: customization.dimensions,
                          material: MATERIAL_COLORS.find(c => c.id === customization.materialColor)?.name,
                          colors: customization.designColors.length,
                          timestamp: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(specData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `product-specifications-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Specifications
                      </Button>
                      <Button onClick={() => {
                        toast({
                          title: "Quote Request Sent",
                          description: "We'll send you a detailed quote within 24 hours.",
                        });
                      }}>
                        Request Quote
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
                {customization.template && customization.materialColor ? (
                  <div className="text-center">
                    {renderTemplatePreview(customization.template, customization.materialColor)}
                    <p className="text-xs text-gray-600 mt-2">
                      {TEMPLATES.find(t => t.id === customization.template)?.name}
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select product and template to see preview</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Width:</span>
                <span>{customization.dimensions.width} cm</span>
              </div>
              <div className="flex justify-between">
                <span>Length:</span>
                <span>{customization.dimensions.length} cm</span>
              </div>
              <div className="flex justify-between">
                <span>Gusset:</span>
                <span>{customization.dimensions.gusset} cm</span>
              </div>
              <div className="flex justify-between">
                <span>Thickness:</span>
                <span>{customization.dimensions.thickness} mm</span>
              </div>
              {customization.materialColor && (
                <div className="flex justify-between">
                  <span>Material:</span>
                  <span>{MATERIAL_COLORS.find(c => c.id === customization.materialColor)?.name}</span>
                </div>
              )}
              {customization.designColors.length > 0 && (
                <div className="flex justify-between">
                  <span>Print Colors:</span>
                  <span>{customization.designColors.length}/4</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={nextStep}
          disabled={currentStep === steps.length - 1 || !canProceed()}
        >
          {currentStep === steps.length - 1 ? "Complete" : "Next"}
          {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}