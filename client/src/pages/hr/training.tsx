import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar, User, Clock, CheckCircle, XCircle, Briefcase, AlertTriangle, GraduationCap, FileText, Users, Trophy, Award, Printer, Download, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import CertificateGenerator from "@/components/hr/certificate-generator";
import CertificateList from "@/components/hr/certificate-list";

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

interface TrainingPoint {
  id: number;
  name: string;
  category: string;
  isActive: boolean;
}

interface TrainingEvaluation {
  id: number;
  trainingId: number;
  trainingPointId: number;
  status: string;
  notes?: string;
  evaluatedAt?: string;
  evaluatedBy?: string;
}

interface TrainingCertificate {
  id: number;
  trainingId: number;
  certificateNumber: string;
  templateId: string;
  issuedDate: string;
  validUntil?: string;
  issuerName: string;
  issuerTitle: string;
  companyName: string;
  status: string;
  customDesign?: any;
}

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

const trainingFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  traineeId: z.string().min(1, "Trainee is required"),
  trainingSection: z.string().min(1, "Training section is required"),
  numberOfDays: z.number().min(1, "Number of days must be at least 1"),
  supervisorId: z.string().min(1, "Supervisor is required"),
  report: z.string().optional(),
  status: z.string().default("in_progress"),
});

type TrainingFormData = z.infer<typeof trainingFormSchema>;

export default function TrainingPage() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("trainings");
  const [showTrainingPointDialog, setShowTrainingPointDialog] = useState(false);
  const [showCertificateGenerator, setShowCertificateGenerator] = useState(false);
  const [editingTrainingPoint, setEditingTrainingPoint] = useState<TrainingPoint | null>(null);

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      date: "",
      traineeId: "",
      trainingSection: "",
      numberOfDays: 1,
      supervisorId: "",
      report: "",
      status: "in_progress",
    },
  });

  // Queries
  const { data: trainings = [], isLoading: trainingsLoading } = useQuery<Training[]>({
    queryKey: ['/api/trainings'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: trainingPoints = [] } = useQuery<TrainingPoint[]>({
    queryKey: ['/api/training-points'],
  });

  const { data: trainingCertificates = [] } = useQuery<TrainingCertificate[]>({
    queryKey: ['/api/training-certificates'],
  });

  const { data: evaluations = [] } = useQuery<TrainingEvaluation[]>({
    queryKey: ['/api/trainings', selectedTraining?.id, 'evaluations'],
    queryFn: async () => {
      if (!selectedTraining) return [];
      const response = await fetch(`/api/trainings/${selectedTraining.id}/evaluations`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch evaluations');
      return response.json();
    },
    enabled: !!selectedTraining,
  });

  // Mutations
  // Function to generate training ID
  const generateTrainingId = () => {
    const existingIds = trainings.map(t => t.trainingId);
    let counter = 1;
    let newId = `TRN-${String(counter).padStart(3, '0')}`;
    
    while (existingIds.includes(newId)) {
      counter++;
      newId = `TRN-${String(counter).padStart(3, '0')}`;
    }
    
    return newId;
  };

  const createTrainingMutation = useMutation({
    mutationFn: async (data: TrainingFormData) => {
      const trainingId = generateTrainingId();
      const trainingData = {
        ...data,
        trainingId,
      };
      
      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(trainingData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create training');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainings'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Training Created",
        description: `Training ${data.trainingId} has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create training. Please try again.",
      });
    },
  });

  const updateTrainingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Training> }) => {
      const response = await fetch(`/api/trainings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update training');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainings'] });
      setSelectedTraining(null);
    },
  });

  // Training Point mutations
  const createTrainingPointMutation = useMutation({
    mutationFn: async (data: { name: string; category: string }) => {
      const response = await fetch('/api/training-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create training point');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training-points'] });
      setShowTrainingPointDialog(false);
      setEditingTrainingPoint(null);
      toast({ title: "Training point created successfully" });
    },
  });

  const updateTrainingPointMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TrainingPoint> }) => {
      const response = await fetch(`/api/training-points/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update training point');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training-points'] });
      setShowTrainingPointDialog(false);
      setEditingTrainingPoint(null);
      toast({ title: "Training point updated successfully" });
    },
  });

  const deleteTrainingPointMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/training-points/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete training point');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training-points'] });
      toast({ title: "Training point deleted successfully" });
    },
  });

  const createEvaluationMutation = useMutation({
    mutationFn: async (data: { trainingId: number; trainingPointId: number; status: string; notes?: string; evaluationId?: number }) => {
      // If evaluation exists, update it; otherwise create new one
      const method = data.evaluationId ? 'PUT' : 'POST';
      const url = data.evaluationId ? `/api/training-evaluations/${data.evaluationId}` : '/api/training-evaluations';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trainingId: data.trainingId,
          trainingPointId: data.trainingPointId,
          status: data.status,
          notes: data.notes,
        }),
      });
      
      // Handle 409 conflict - evaluation already exists, try updating instead
      if (response.status === 409 && method === 'POST') {
        try {
          const conflictData = await response.json();
          const existingEvaluation = conflictData.existingEvaluation;
          
          if (existingEvaluation && existingEvaluation.id) {
            const updateResponse = await fetch(`/api/training-evaluations/${existingEvaluation.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                status: data.status,
                notes: data.notes,
              }),
            });
            if (!updateResponse.ok) throw new Error('Failed to update existing evaluation');
            return updateResponse.json();
          }
        } catch (parseError) {
          // If we can't parse the response, fall back to original logic
          const existingEvaluation = evaluations.find(e => 
            e.trainingId === data.trainingId && e.trainingPointId === data.trainingPointId
          );
          
          if (existingEvaluation) {
            const updateResponse = await fetch(`/api/training-evaluations/${existingEvaluation.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                status: data.status,
                notes: data.notes,
              }),
            });
            if (!updateResponse.ok) throw new Error('Failed to update existing evaluation');
            return updateResponse.json();
          }
        }
      }
      
      if (!response.ok) throw new Error(`Failed to ${data.evaluationId ? 'update' : 'create'} evaluation`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainings', selectedTraining?.id, 'evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trainings'] });
    },
    onError: (error) => {
      console.error('Evaluation update error:', error);
    },
  });

  const handleSubmit = (data: TrainingFormData) => {
    createTrainingMutation.mutate(data);
  };

  const handleEvaluationUpdate = (trainingPointId: number, status: string, notes?: string) => {
    if (!selectedTraining) return;
    
    // Check if evaluation already exists for this training and training point
    const existingEvaluation = evaluations.find(e => 
      e.trainingId === selectedTraining.id && e.trainingPointId === trainingPointId
    );
    
    createEvaluationMutation.mutate({
      trainingId: selectedTraining.id,
      trainingPointId,
      status,
      notes,
      evaluationId: existingEvaluation?.id,
    });
  };

  const printTrainingEvaluation = () => {
    if (!selectedTraining) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No training selected for printing.",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add company logo
      try {
        // Import and add the company logo
        const logoImg = new Image();
        logoImg.src = '/assets/FactoryLogoHPNGW Green.png';
        logoImg.onload = () => {
          try {
            doc.addImage(logoImg, 'PNG', 20, 10, 30, 15);
          } catch (imgError) {
            console.log('Could not add logo to PDF');
          }
        };
      } catch (logoError) {
        console.log('Logo not available, continuing without logo');
      }
      
      // Header with logo space
      doc.setFontSize(20);
      doc.text('Training Evaluation Report', pageWidth / 2, 30, { align: 'center' });
      
      // Company info
      doc.setFontSize(10);
      doc.text('Manufacturing Training Department', pageWidth / 2, 40, { align: 'center' });
      
      // Training details
      doc.setFontSize(12);
      doc.text(`Training ID: ${selectedTraining.trainingId || 'N/A'}`, 20, 60);
      doc.text(`Date: ${selectedTraining.date ? format(new Date(selectedTraining.date), 'MMM dd, yyyy') : 'N/A'}`, 20, 70);
      doc.text(`Trainee: ${getUserName(selectedTraining.traineeId) || 'N/A'}`, 20, 80);
      doc.text(`Supervisor: ${getUserName(selectedTraining.supervisorId) || 'N/A'}`, 20, 90);
      doc.text(`Section: ${selectedTraining.trainingSection || 'N/A'}`, 20, 100);
      doc.text(`Duration: ${selectedTraining.numberOfDays || 0} days`, 20, 110);
      
      // Evaluation Results - Only show evaluated points
      doc.setFontSize(14);
      doc.text('Training Point Evaluations:', 20, 130);
      
      let yPosition = 150;
      const activePoints = trainingPoints.filter(point => point.isActive);
      
      // Filter to only include points that have been evaluated (pass or not_pass)
      const evaluatedPoints = activePoints.filter(point => {
        const evaluation = evaluations.find(e => 
          e.trainingId === selectedTraining.id && e.trainingPointId === point.id
        );
        return evaluation && (evaluation.status === 'pass' || evaluation.status === 'not_pass');
      });
      
      if (evaluatedPoints.length === 0) {
        doc.setFontSize(11);
        doc.text('No training points have been evaluated yet', 25, yPosition);
        yPosition += 20;
      } else {
        // Group by status for better organization
        const passedPoints = evaluatedPoints.filter(point => {
          const evaluation = evaluations.find(e => 
            e.trainingId === selectedTraining.id && e.trainingPointId === point.id
          );
          return evaluation?.status === 'pass';
        });
        
        const failedPoints = evaluatedPoints.filter(point => {
          const evaluation = evaluations.find(e => 
            e.trainingId === selectedTraining.id && e.trainingPointId === point.id
          );
          return evaluation?.status === 'not_pass';
        });
        
        // Show passed points
        if (passedPoints.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(0, 150, 0); // Green
          doc.text('✓ PASSED TRAINING POINTS:', 25, yPosition);
          doc.setTextColor(0, 0, 0); // Reset to black
          yPosition += 15;
          
          passedPoints.forEach((point) => {
            const evaluation = evaluations.find(e => 
              e.trainingId === selectedTraining.id && e.trainingPointId === point.id
            );
            
            doc.setFontSize(11);
            doc.text(`• ${point.name || 'Unknown Point'}`, 30, yPosition);
            doc.text('PASS', 150, yPosition);
            
            if (evaluation?.notes) {
              yPosition += 10;
              doc.setFontSize(9);
              doc.text(`  Notes: ${evaluation.notes}`, 35, yPosition);
              doc.setFontSize(11);
            }
            
            yPosition += 15;
            
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 30;
            }
          });
          yPosition += 10;
        }
        
        // Show failed points
        if (failedPoints.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(200, 0, 0); // Red
          doc.text('✗ FAILED TRAINING POINTS:', 25, yPosition);
          doc.setTextColor(0, 0, 0); // Reset to black
          yPosition += 15;
          
          failedPoints.forEach((point) => {
            const evaluation = evaluations.find(e => 
              e.trainingId === selectedTraining.id && e.trainingPointId === point.id
            );
            
            doc.setFontSize(11);
            doc.text(`• ${point.name || 'Unknown Point'}`, 30, yPosition);
            doc.text('NOT PASS', 150, yPosition);
            
            if (evaluation?.notes) {
              yPosition += 10;
              doc.setFontSize(9);
              doc.text(`  Notes: ${evaluation.notes}`, 35, yPosition);
              doc.setFontSize(11);
            }
            
            yPosition += 15;
            
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 30;
            }
          });
          yPosition += 10;
        }
        
        // Summary
        doc.setFontSize(12);
        doc.text('EVALUATION SUMMARY:', 25, yPosition);
        yPosition += 15;
        
        doc.setFontSize(11);
        doc.text(`Total Points Evaluated: ${evaluatedPoints.length}`, 30, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 150, 0);
        doc.text(`Passed: ${passedPoints.length}`, 30, yPosition);
        yPosition += 10;
        doc.setTextColor(200, 0, 0);
        doc.text(`Failed: ${failedPoints.length}`, 30, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 10;
        
        const passPercentage = evaluatedPoints.length > 0 ? Math.round((passedPoints.length / evaluatedPoints.length) * 100) : 0;
        doc.text(`Pass Rate: ${passPercentage}%`, 30, yPosition);
        yPosition += 15;
      }
      
      // Report section
      if (selectedTraining.report) {
        doc.setFontSize(14);
        doc.text('Training Report:', 20, yPosition + 20);
        doc.setFontSize(11);
        const reportLines = doc.splitTextToSize(selectedTraining.report, pageWidth - 40);
        doc.text(reportLines, 20, yPosition + 35);
        yPosition += 50;
      }
      
      // Add signature section at the bottom
      const pageHeight = doc.internal.pageSize.getHeight();
      let signatureY = Math.max(yPosition + 30, pageHeight - 60);
      
      // Check if we need a new page for signatures
      if (signatureY > pageHeight - 60) {
        doc.addPage();
        signatureY = 50;
      }
      
      doc.setFontSize(12);
      doc.text('SIGNATURES:', 20, signatureY);
      signatureY += 20;
      
      doc.setFontSize(10);
      // Trainee signature
      doc.text('Trainee Signature:', 20, signatureY);
      doc.text('_'.repeat(25), 70, signatureY);
      doc.text('Date:', 140, signatureY);
      doc.text('_'.repeat(15), 155, signatureY);
      signatureY += 20;
      
      // Supervisor signature
      doc.text('Supervisor Signature:', 20, signatureY);
      doc.text('_'.repeat(25), 70, signatureY);
      doc.text('Date:', 140, signatureY);
      doc.text('_'.repeat(15), 155, signatureY);
      signatureY += 20;
      
      // HR signature
      doc.text('HR Representative:', 20, signatureY);
      doc.text('_'.repeat(25), 70, signatureY);
      doc.text('Date:', 140, signatureY);
      doc.text('_'.repeat(15), 155, signatureY);
      
      // Footer
      doc.setFontSize(8);
      doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, pageHeight - 20);
      doc.text('Manufacturing Training Department', pageWidth - 80, pageHeight - 20);
      
      // Generate filename with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `Training_Evaluation_${selectedTraining.trainingId || 'Unknown'}_${timestamp}.pdf`;
      
      doc.save(filename);
      
      toast({
        title: "Success",
        description: "Training evaluation report generated successfully.",
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate training evaluation report. Please try again.",
      });
    }
  };

  const printTrainingList = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text('Training Management Report', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 50);
    doc.text(`Total Trainings: ${trainings.length}`, 20, 60);
    
    // Training List
    doc.setFontSize(14);
    doc.text('Training Sessions:', 20, 80);
    
    let yPosition = 100;
    trainings.forEach((training, index) => {
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${training.trainingId}`, 25, yPosition);
      doc.text(`Trainee: ${getUserName(training.traineeId)}`, 30, yPosition + 10);
      doc.text(`Section: ${training.trainingSection}`, 30, yPosition + 20);
      doc.text(`Status: ${training.status}`, 30, yPosition + 30);
      doc.text(`Date: ${training.date ? format(new Date(training.date), 'MMM dd, yyyy') : 'N/A'}`, 30, yPosition + 40);
      
      yPosition += 60;
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }
    });
    
    doc.save(`Training_Management_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : userId;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTrainingSectionIcon = (section: string | null | undefined) => {
    if (!section) return <GraduationCap className="h-4 w-4" />;
    
    switch (section.toLowerCase()) {
      case 'extrusion':
        return <Briefcase className="h-4 w-4" />;
      case 'printing':
        return <FileText className="h-4 w-4" />;
      case 'cutting':
        return <AlertTriangle className="h-4 w-4" />;
      case 'safety':
        return <Trophy className="h-4 w-4" />;
      default:
        return <GraduationCap className="h-4 w-4" />;
    }
  };

  return (
    <div className={`min-h-full p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("hr.training_management.title")}</h1>
            <p className="text-gray-600">{t("hr.training_management.description")}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={printTrainingList}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  New Training
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Training</DialogTitle>
                <DialogDescription>
                  Create a new training session by selecting trainee, supervisor, and training details.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-700">
                        <strong>Training ID:</strong> Will be automatically generated (e.g., TRN-001, TRN-002, etc.)
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="traineeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trainee</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select trainee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {getUserName(user.id)}
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
                      name="supervisorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervisor</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select supervisor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {getUserName(user.id)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trainingSection"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Training Section</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="extrusion">Extrusion</SelectItem>
                              <SelectItem value="printing">Printing</SelectItem>
                              <SelectItem value="cutting">Cutting</SelectItem>
                              <SelectItem value="safety">Safety</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numberOfDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Days</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="report"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Training report notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTrainingMutation.isPending}>
                      {createTrainingMutation.isPending ? "Creating..." : "Create Training"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trainings">Training Sessions</TabsTrigger>
          <TabsTrigger value="points">Training Points</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        {/* Training Sessions Tab */}
        <TabsContent value="trainings" className="space-y-6">
          {/* Training List */}
      <div className="grid gap-6">
        {trainingsLoading ? (
          <div className="text-center py-8">Loading trainings...</div>
        ) : trainings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No trainings found. Create your first training session.</p>
            </CardContent>
          </Card>
        ) : (
          trainings.map((training: Training) => (
            <Card key={training.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTrainingSectionIcon(training.trainingSection)}
                    <div>
                      <CardTitle className="text-lg">{training.trainingId}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {training.date ? format(new Date(training.date), 'MMM dd, yyyy') : 'Date not set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(training.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTraining(training);
                        setShowEvaluationDialog(true);
                      }}
                    >
                      View Details
                    </Button>
                    {training.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Award className="h-4 w-4 mr-1" />
                        Certificate
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <strong>Trainee:</strong> {getUserName(training.traineeId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <strong>Supervisor:</strong> {getUserName(training.supervisorId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <strong>Duration:</strong> {training.numberOfDays} day{training.numberOfDays > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Section: {training.trainingSection}</span>
                  </div>
                  {training.report && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <strong>Report:</strong> {training.report}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
        </div>
        </TabsContent>

        {/* Training Points Tab */}
        <TabsContent value="points" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">Training Points</h3>
              <p className="text-gray-600">Manage training evaluation criteria and points</p>
            </div>
            <Button onClick={() => setShowTrainingPointDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Training Point
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingPoints.map((point) => (
                    <TableRow key={point.id}>
                      <TableCell className="font-medium">{point.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{point.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={point.isActive ? "default" : "secondary"}>
                          {point.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTrainingPoint(point);
                              setShowTrainingPointDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTrainingPointMutation.mutate(point.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">Training Evaluations</h3>
            <p className="text-gray-600">View and manage training evaluation results</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Evaluations Selected</h3>
                <p className="text-gray-500">
                  Select a training session from the Training Sessions tab to view its evaluations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Certificates Tab */}
        <TabsContent value="certificates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">Training Certificates</h3>
              <p className="text-gray-600">Manage and generate training completion certificates</p>
            </div>
            <Button onClick={() => setShowCertificateGenerator(true)}>
              <Award className="h-4 w-4 mr-2" />
              Generate Certificate
            </Button>
          </div>

          <CertificateList />
        </TabsContent>
      </Tabs>
      
      {/* Training Point Dialog */}
      <Dialog open={showTrainingPointDialog} onOpenChange={setShowTrainingPointDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTrainingPoint ? 'Edit Training Point' : 'Add Training Point'}
            </DialogTitle>
            <DialogDescription>
              {editingTrainingPoint 
                ? 'Update the training point details below.'
                : 'Create a new training evaluation point.'
              }
            </DialogDescription>
          </DialogHeader>
          <TrainingPointForm 
            trainingPoint={editingTrainingPoint}
            onSubmit={(data) => {
              if (editingTrainingPoint) {
                updateTrainingPointMutation.mutate({ id: editingTrainingPoint.id, data });
              } else {
                createTrainingPointMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setShowTrainingPointDialog(false);
              setEditingTrainingPoint(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Certificate Generator Dialog */}
      <Dialog open={showCertificateGenerator} onOpenChange={setShowCertificateGenerator}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Generate Training Certificate</DialogTitle>
            <DialogDescription>
              Create a new training completion certificate
            </DialogDescription>
          </DialogHeader>
          <CertificateGenerator 
            onClose={() => setShowCertificateGenerator(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Training Evaluation Dialog */}
      <Dialog open={showEvaluationDialog} onOpenChange={setShowEvaluationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Training Evaluation - {selectedTraining?.trainingId}</DialogTitle>
                <DialogDescription>
                  Evaluate training points and update training status for the selected training session.
                </DialogDescription>
              </div>
              <Button 
                variant="outline"
                onClick={printTrainingEvaluation}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Evaluation
              </Button>
            </div>
          </DialogHeader>
          {selectedTraining && (
            <div className="space-y-6">
              {/* Training Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Training Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Trainee:</strong> {getUserName(selectedTraining.traineeId)}</p>
                      <p><strong>Supervisor:</strong> {getUserName(selectedTraining.supervisorId)}</p>
                    </div>
                    <div>
                      <p><strong>Section:</strong> {selectedTraining.trainingSection}</p>
                      <p><strong>Duration:</strong> {selectedTraining.numberOfDays} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Training Points Evaluation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Training Points Evaluation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trainingPoints.filter(point => point.isActive).map((point) => {
                      const evaluation = evaluations.find(e => 
                        e.trainingId === selectedTraining.id && e.trainingPointId === point.id
                      );
                      return (
                        <div key={point.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{point.name}</h4>
                              <p className="text-sm text-gray-500 capitalize">{point.category.replace('_', ' ')}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={evaluation?.status === 'pass' ? 'default' : 'outline'}
                                className={evaluation?.status === 'pass' ? 'bg-green-600 hover:bg-green-700' : ''}
                                onClick={() => handleEvaluationUpdate(point.id, 'pass')}
                                disabled={createEvaluationMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {createEvaluationMutation.isPending ? 'Saving...' : 'Pass'}
                              </Button>
                              <Button
                                size="sm"
                                variant={evaluation?.status === 'not_pass' ? 'default' : 'outline'}
                                className={evaluation?.status === 'not_pass' ? 'bg-red-600 hover:bg-red-700' : ''}
                                onClick={() => handleEvaluationUpdate(point.id, 'not_pass')}
                                disabled={createEvaluationMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {createEvaluationMutation.isPending ? 'Saving...' : 'Not Pass'}
                              </Button>
                            </div>
                          </div>
                          {evaluation && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              Status: <span className="font-medium capitalize">{evaluation.status.replace('_', ' ')}</span>
                              {evaluation.evaluatedAt && (
                                <span className="ml-2">
                                  - Evaluated on {format(new Date(evaluation.evaluatedAt), 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Training Status Update */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Update Training Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedTraining.status === 'in_progress' ? 'default' : 'outline'}
                      onClick={() => updateTrainingMutation.mutate({ 
                        id: selectedTraining.id, 
                        data: { status: 'in_progress' } 
                      })}
                    >
                      In Progress
                    </Button>
                    <Button
                      variant={selectedTraining.status === 'completed' ? 'default' : 'outline'}
                      className={selectedTraining.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
                      onClick={() => updateTrainingMutation.mutate({ 
                        id: selectedTraining.id, 
                        data: { status: 'completed' } 
                      })}
                    >
                      Completed
                    </Button>
                    <Button
                      variant={selectedTraining.status === 'cancelled' ? 'default' : 'outline'}
                      className={selectedTraining.status === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''}
                      onClick={() => updateTrainingMutation.mutate({ 
                        id: selectedTraining.id, 
                        data: { status: 'cancelled' } 
                      })}
                    >
                      Cancelled
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // Training Point Form Component
  function TrainingPointForm({ 
    trainingPoint, 
    onSubmit, 
    onCancel 
  }: { 
    trainingPoint: TrainingPoint | null; 
    onSubmit: (data: { name: string; category: string }) => void;
    onCancel: () => void;
  }) {
    const [name, setName] = useState(trainingPoint?.name || '');
    const [category, setCategory] = useState(trainingPoint?.category || '');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({ name, category });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter training point name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="machine_operation">Machine Operation</SelectItem>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="setup">Setup</SelectItem>
              <SelectItem value="quality_control">Quality Control</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {trainingPoint ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    );
  }
}