import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar, User, Clock, CheckCircle, XCircle, Briefcase, AlertTriangle, GraduationCap, FileText, Users, Trophy } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";

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

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

const trainingFormSchema = z.object({
  trainingId: z.string().min(1, "Training ID is required"),
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
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      trainingId: "",
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
  const { data: trainings = [], isLoading: trainingsLoading } = useQuery({
    queryKey: ['/api/trainings'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: trainingPoints = [] } = useQuery<TrainingPoint[]>({
    queryKey: ['/api/training-points'],
  });

  const { data: evaluations = [] } = useQuery<TrainingEvaluation[]>({
    queryKey: ['/api/trainings', selectedTraining?.id, 'evaluations'],
    enabled: !!selectedTraining,
  });

  // Mutations
  const createTrainingMutation = useMutation({
    mutationFn: (data: TrainingFormData) => apiRequest('/api/trainings', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainings'] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateTrainingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Training> }) => 
      apiRequest(`/api/trainings/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainings'] });
      setSelectedTraining(null);
    },
  });

  const createEvaluationMutation = useMutation({
    mutationFn: (data: { trainingId: number; trainingPointId: number; status: string; notes?: string }) =>
      apiRequest('/api/training-evaluations', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainings', selectedTraining?.id, 'evaluations'] });
    },
  });

  const handleSubmit = (data: TrainingFormData) => {
    createTrainingMutation.mutate(data);
  };

  const handleEvaluationUpdate = (trainingPointId: number, status: string, notes?: string) => {
    if (!selectedTraining) return;
    
    createEvaluationMutation.mutate({
      trainingId: selectedTraining.id,
      trainingPointId,
      status,
      notes,
    });
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

  const getTrainingSectionIcon = (section: string) => {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Management</h1>
            <p className="text-gray-600">Manage and evaluate training processes for employees</p>
          </div>
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
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trainingId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Training ID</FormLabel>
                          <FormControl>
                            <Input placeholder="TRN-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                        {format(new Date(training.date), 'MMM dd, yyyy')}
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

      {/* Training Evaluation Dialog */}
      <Dialog open={showEvaluationDialog} onOpenChange={setShowEvaluationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Training Evaluation - {selectedTraining?.trainingId}</DialogTitle>
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
                      const evaluation = evaluations.find(e => e.trainingPointId === point.id);
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
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Pass
                              </Button>
                              <Button
                                size="sm"
                                variant={evaluation?.status === 'not_pass' ? 'default' : 'outline'}
                                className={evaluation?.status === 'not_pass' ? 'bg-red-600 hover:bg-red-700' : ''}
                                onClick={() => handleEvaluationUpdate(point.id, 'not_pass')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Not Pass
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
}