import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Download, Eye, Palette, Save, Settings, Award } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const certificateSchema = z.object({
  trainingId: z.number().min(1, "Training is required"),
  issuerName: z.string().min(1, "Issuer name is required"),
  issuerTitle: z.string().min(1, "Issuer title is required"),
  companyName: z.string().min(1, "Company name is required"),
  templateId: z.string().default("default"),
  validUntil: z.string().optional(),
  logoUrl: z.string().optional(),
  customDesign: z.object({
    primaryColor: z.string().default("#1f2937"),
    secondaryColor: z.string().default("#3b82f6"),
    accentColor: z.string().default("#f59e0b"),
    fontFamily: z.string().default("Arial, sans-serif"),
    borderStyle: z.string().default("elegant"),
    layout: z.string().default("modern"),
    includeQR: z.boolean().default(true),
    customText: z.string().optional()
  }).optional()
});

type CertificateFormData = z.infer<typeof certificateSchema>;

interface Training {
  id: number;
  trainingId: string;
  date: string;
  traineeId: string;
  trainingSection: string;
  numberOfDays: number;
  supervisorId: string;
  supervisorSignature?: string;
  report?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isAdmin: boolean;
}

interface CertificateGeneratorProps {
  trainingId?: number;
  onClose?: () => void;
}

const templates = [
  { id: "default", name: "Default", description: "Clean and professional" },
  { id: "elegant", name: "Elegant", description: "Sophisticated with borders" },
  { id: "modern", name: "Modern", description: "Contemporary design" },
  { id: "classic", name: "Classic", description: "Traditional certificate style" }
];

const colorSchemes = [
  { name: "Professional Blue", primary: "#1f2937", secondary: "#3b82f6", accent: "#f59e0b" },
  { name: "Corporate Green", primary: "#065f46", secondary: "#10b981", accent: "#f59e0b" },
  { name: "Royal Purple", primary: "#581c87", secondary: "#8b5cf6", accent: "#f59e0b" },
  { name: "Classic Black", primary: "#000000", secondary: "#6b7280", accent: "#dc2626" }
];

export default function CertificateGenerator({ trainingId, onClose }: CertificateGeneratorProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedColorScheme, setSelectedColorScheme] = useState(colorSchemes[0]);
  const certificateRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      trainingId: trainingId || 0,
      issuerName: "",
      issuerTitle: "Training Supervisor",
      companyName: "Production Management Factory",
      templateId: "default",
      customDesign: {
        primaryColor: selectedColorScheme.primary,
        secondaryColor: selectedColorScheme.secondary,
        accentColor: selectedColorScheme.accent,
        fontFamily: "Arial, sans-serif",
        borderStyle: "elegant",
        layout: "modern",
        includeQR: true
      }
    }
  });

  const { data: trainings } = useQuery<Training[]>({
    queryKey: ["/api/trainings"],
    enabled: !trainingId
  });

  const { data: selectedTraining } = useQuery<Training>({
    queryKey: ["/api/trainings", form.watch("trainingId")],
    enabled: !!form.watch("trainingId")
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"]
  });

  const createCertificateMutation = useMutation({
    mutationFn: async (data: CertificateFormData) => {
      const response = await fetch("/api/training-certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create certificate");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Certificate created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/training-certificates"] });
      onClose?.();
    },
    onError: () => {
      toast({ title: "Failed to create certificate", variant: "destructive" });
    }
  });

  const handleColorSchemeChange = (scheme: typeof colorSchemes[0]) => {
    setSelectedColorScheme(scheme);
    form.setValue("customDesign.primaryColor", scheme.primary);
    form.setValue("customDesign.secondaryColor", scheme.secondary);
    form.setValue("customDesign.accentColor", scheme.accent);
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#ffffff"
      });
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate-${selectedTraining?.id || 'draft'}.pdf`);
      
      toast({ title: "Certificate downloaded successfully" });
    } catch (error) {
      toast({ title: "Failed to download certificate", variant: "destructive" });
    }
  };

  const onSubmit = (data: CertificateFormData) => {
    createCertificateMutation.mutate(data);
  };

  const trainee = users?.find(u => u.id === selectedTraining?.traineeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Certificate Generator</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {previewMode ? "Edit" : "Preview"}
          </Button>
          {previewMode && (
            <Button variant="outline" size="sm" onClick={downloadCertificate}>
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card className={previewMode ? "lg:col-span-1" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Certificate Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trainingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training Session</FormLabel>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          disabled={!!trainingId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select training" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {trainings?.map((training: any) => (
                              <SelectItem key={training.id} value={training.id.toString()}>
                                Training #{training.id} - {training.trainingSection}
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
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
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
                    name="issuerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuer Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter issuer name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issuerTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuer Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter issuer title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Design Customization
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    {colorSchemes.map((scheme) => (
                      <Button
                        key={scheme.name}
                        type="button"
                        variant={selectedColorScheme.name === scheme.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleColorSchemeChange(scheme)}
                        className="h-auto p-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: scheme.primary }}
                            />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: scheme.secondary }}
                            />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: scheme.accent }}
                            />
                          </div>
                          <span className="text-xs">{scheme.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>

                  <FormField
                    control={form.control}
                    name="customDesign.customText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Text (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Add custom text to appear on the certificate"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createCertificateMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    {createCertificateMutation.isPending ? "Creating..." : "Create Certificate"}
                  </Button>
                  {onClose && (
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Certificate Preview */}
        {previewMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Certificate Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div
                  ref={certificateRef}
                  className="bg-white p-8 rounded-lg shadow-lg relative"
                  style={{
                    fontFamily: form.watch("customDesign.fontFamily"),
                    minHeight: "420px",
                    background: `linear-gradient(135deg, ${form.watch("customDesign.primaryColor")}10, ${form.watch("customDesign.secondaryColor")}10)`
                  }}
                >
                  {/* Certificate Header */}
                  <div className="text-center mb-8">
                    <div
                      className="text-3xl font-bold mb-2"
                      style={{ color: form.watch("customDesign.primaryColor") }}
                    >
                      CERTIFICATE OF COMPLETION
                    </div>
                    <div
                      className="w-24 h-1 mx-auto mb-4"
                      style={{ backgroundColor: form.watch("customDesign.accentColor") }}
                    />
                    <div className="text-lg text-gray-600">
                      This is to certify that
                    </div>
                  </div>

                  {/* Trainee Name */}
                  <div className="text-center mb-8">
                    <div
                      className="text-4xl font-elegant mb-2 border-b-2 inline-block pb-2"
                      style={{
                        color: form.watch("customDesign.secondaryColor"),
                        borderColor: form.watch("customDesign.accentColor")
                      }}
                    >
                      {trainee?.firstName} {trainee?.lastName || "[Trainee Name]"}
                    </div>
                  </div>

                  {/* Training Details */}
                  <div className="text-center mb-8">
                    <div className="text-lg text-gray-700 mb-2">
                      has successfully completed the training program in
                    </div>
                    <div
                      className="text-2xl font-semibold mb-4"
                      style={{ color: form.watch("customDesign.primaryColor") }}
                    >
                      {selectedTraining?.trainingSection || "[Training Section]"}
                    </div>
                    <div className="text-gray-600">
                      Duration: {selectedTraining?.numberOfDays || "[X]"} days
                    </div>
                  </div>

                  {/* Custom Text */}
                  {form.watch("customDesign.customText") && (
                    <div className="text-center mb-8">
                      <div className="text-gray-700 italic">
                        {form.watch("customDesign.customText")}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between items-end mt-12">
                    <div className="text-center">
                      <div
                        className="border-t-2 pt-2 mb-2"
                        style={{ borderColor: form.watch("customDesign.primaryColor") }}
                      >
                        <div className="font-semibold">
                          {form.watch("issuerName") || "[Issuer Name]"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {form.watch("issuerTitle")}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="mb-2">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: form.watch("customDesign.accentColor"),
                            color: form.watch("customDesign.accentColor")
                          }}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date().toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {form.watch("companyName")}
                      </div>
                    </div>
                  </div>

                  {/* Decorative Border */}
                  <div
                    className="absolute inset-4 border-4 rounded-lg pointer-events-none"
                    style={{
                      borderColor: form.watch("customDesign.secondaryColor"),
                      opacity: 0.3
                    }}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}