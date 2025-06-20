import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, FileText, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

// Training Evaluation Schema
const trainingEvaluationSchema = z.object({
  trainingId: z.number(),
  evaluations: z.array(z.object({
    trainingField: z.string(),
    status: z.enum(["Pass", "Not Pass", "Not Evaluated"]),
    notes: z.string().optional(),
  })),
  overallNotes: z.string().optional(),
});

type TrainingEvaluationFormData = z.infer<typeof trainingEvaluationSchema>;

interface TrainingEvaluationFormProps {
  isOpen: boolean;
  onClose: () => void;
  training: any;
}

export default function TrainingEvaluationForm({ isOpen, onClose, training }: TrainingEvaluationFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize evaluation state
  const [evaluations, setEvaluations] = useState<any[]>(
    training?.trainingFields?.map((field: string) => ({
      trainingField: field,
      status: "Not Evaluated",
      notes: ""
    })) || []
  );

  const form = useForm<TrainingEvaluationFormData>({
    resolver: zodResolver(trainingEvaluationSchema),
    defaultValues: {
      trainingId: training?.id,
      evaluations: evaluations,
      overallNotes: "",
    },
  });

  // Submit evaluation mutation
  const submitEvaluationMutation = useMutation({
    mutationFn: async (data: TrainingEvaluationFormData) => {
      const response = await fetch(`/api/trainings/${training.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to submit evaluation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training evaluation submitted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trainings'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit evaluation",
        variant: "destructive"
      });
    }
  });

  const handleEvaluationChange = (index: number, field: string, value: string) => {
    const newEvaluations = [...evaluations];
    newEvaluations[index] = {
      ...newEvaluations[index],
      [field]: value
    };
    setEvaluations(newEvaluations);
    form.setValue('evaluations', newEvaluations);
  };

  const onSubmit = (data: TrainingEvaluationFormData) => {
    submitEvaluationMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Not Pass":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "Not Evaluated":
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Pass":
        return "default";
      case "Not Pass":
        return "destructive";
      case "Not Evaluated":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const passedCount = evaluations.filter(e => e.status === "Pass").length;
  const failedCount = evaluations.filter(e => e.status === "Not Pass").length;
  const notEvaluatedCount = evaluations.filter(e => e.status === "Not Evaluated").length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Training Evaluation</DialogTitle>
          <DialogDescription>
            Evaluate training fields for completed training session
          </DialogDescription>
        </DialogHeader>

        {/* Training Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Training Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Trainee:</span> {training?.traineeName}
              </div>
              <div>
                <span className="font-medium">Date:</span> {training?.date ? format(new Date(training.date), "PPP") : "N/A"}
              </div>
              <div>
                <span className="font-medium">Category:</span> {training?.trainingCategory}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {training?.duration || "N/A"} hours
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Summary */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Evaluation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Pass: {passedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Not Pass: {failedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">Not Evaluated: {notEvaluatedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Training Fields Evaluation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Training Fields Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluations.map((evaluation, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(evaluation.status)}
                          <span className="font-medium">{evaluation.trainingField}</span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(evaluation.status)}>
                          {evaluation.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Evaluation Status
                          </label>
                          <Select
                            value={evaluation.status}
                            onValueChange={(value) => handleEvaluationChange(index, 'status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pass">Pass</SelectItem>
                              <SelectItem value="Not Pass">Not Pass</SelectItem>
                              <SelectItem value="Not Evaluated">Not Evaluated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Notes
                          </label>
                          <Textarea
                            placeholder="Evaluation notes..."
                            rows={2}
                            value={evaluation.notes}
                            onChange={(e) => handleEvaluationChange(index, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Overall Notes */}
            <FormField
              control={form.control}
              name="overallNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Evaluation Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Overall training evaluation notes..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitEvaluationMutation.isPending}
              >
                {submitEvaluationMutation.isPending ? "Submitting..." : "Submit Evaluation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}