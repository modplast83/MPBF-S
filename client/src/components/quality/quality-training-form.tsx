import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, User, Clock, BookOpen, Award, AlertTriangle, CheckCircle, Plus, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Quality Training Schema
const qualityTrainingSchema = z.object({
  title: z.string().min(1, "Training title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  instructor: z.string().min(1, "Instructor name is required"),
  location: z.string().min(1, "Location is required"),
  scheduledDate: z.date({
    required_error: "Training date is required",
  }),
  duration: z.number().min(0.5, "Duration must be at least 30 minutes").max(8, "Duration cannot exceed 8 hours"),
  maxParticipants: z.number().min(1, "Must allow at least 1 participant").max(50, "Cannot exceed 50 participants"),
  category: z.enum(["quality_control", "equipment_operation", "safety_procedures", "process_improvement", "documentation", "calibration"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  prerequisites: z.array(z.string()).default([]),
  learningObjectives: z.array(z.string()).default([]),
  certificationRequired: z.boolean().default(false),
  qualityCheckTypes: z.array(z.string()).default([]),
  equipmentIds: z.array(z.string()).default([]),
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
});

type QualityTrainingFormData = z.infer<typeof qualityTrainingSchema>;

interface QualityTrainingFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTraining?: any;
}

export default function QualityTrainingForm({ isOpen, onClose, editingTraining }: QualityTrainingFormProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prerequisites, setPrerequisites] = useState<string[]>(editingTraining?.prerequisites || []);
  const [learningObjectives, setLearningObjectives] = useState<string[]>(editingTraining?.learningObjectives || []);
  const [prerequisiteInput, setPrerequisiteInput] = useState("");
  const [objectiveInput, setObjectiveInput] = useState("");

  // Fetch quality check types for selection
  const { data: qualityCheckTypes = [] } = useQuery({
    queryKey: ['/api/quality-check-types'],
  });

  // Fetch equipment/machines for selection
  const { data: items = [] } = useQuery({
    queryKey: ['/api/items'],
  });

  const form = useForm<QualityTrainingFormData>({
    resolver: zodResolver(qualityTrainingSchema),
    defaultValues: {
      title: editingTraining?.title || "",
      description: editingTraining?.description || "",
      instructor: editingTraining?.instructor || "",
      location: editingTraining?.location || "",
      scheduledDate: editingTraining?.scheduledDate ? new Date(editingTraining.scheduledDate) : new Date(),
      duration: editingTraining?.duration || 2,
      maxParticipants: editingTraining?.maxParticipants || 15,
      category: editingTraining?.category || "quality_control",
      priority: editingTraining?.priority || "medium",
      certificationRequired: editingTraining?.certificationRequired || false,
      qualityCheckTypes: editingTraining?.qualityCheckTypes || [],
      equipmentIds: editingTraining?.equipmentIds || [],
      status: editingTraining?.status || "scheduled",
      prerequisites: editingTraining?.prerequisites || [],
      learningObjectives: editingTraining?.learningObjectives || [],
    },
  });

  const generateTrainingId = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-4);
    return `QTR-${dateStr}-${timeStr}`;
  };

  const createTrainingMutation = useMutation({
    mutationFn: async (data: QualityTrainingFormData) => {
      const trainingId = editingTraining?.trainingId || generateTrainingId();
      const trainingData = {
        ...data,
        trainingId,
        prerequisites,
        learningObjectives,
        type: "quality", // Mark as quality training
      };
      
      const url = editingTraining ? `/api/trainings/${editingTraining.id}` : '/api/trainings';
      const method = editingTraining ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(trainingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingTraining ? 'update' : 'create'} training`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainings'] });
      onClose();
      form.reset();
      setPrerequisites([]);
      setLearningObjectives([]);
      toast({
        title: editingTraining ? "Training Updated" : "Training Created",
        description: `Quality training ${data.trainingId} has been ${editingTraining ? 'updated' : 'created'} successfully.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${editingTraining ? 'update' : 'create'} training. Please try again.`,
      });
    },
  });

  const addPrerequisite = () => {
    if (prerequisiteInput.trim() && !prerequisites.includes(prerequisiteInput.trim())) {
      setPrerequisites([...prerequisites, prerequisiteInput.trim()]);
      setPrerequisiteInput("");
    }
  };

  const removePrerequisite = (index: number) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== index));
  };

  const addLearningObjective = () => {
    if (objectiveInput.trim() && !learningObjectives.includes(objectiveInput.trim())) {
      setLearningObjectives([...learningObjectives, objectiveInput.trim()]);
      setObjectiveInput("");
    }
  };

  const removeLearningObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const onSubmit = (data: QualityTrainingFormData) => {
    createTrainingMutation.mutate(data);
  };

  const categoryOptions = [
    { value: "quality_control", label: "Quality Control", icon: CheckCircle },
    { value: "equipment_operation", label: "Equipment Operation", icon: User },
    { value: "safety_procedures", label: "Safety Procedures", icon: AlertTriangle },
    { value: "process_improvement", label: "Process Improvement", icon: Award },
    { value: "documentation", label: "Documentation", icon: BookOpen },
    { value: "calibration", label: "Calibration", icon: Clock },
  ];

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", isRTL && "rtl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {editingTraining ? "Edit Quality Training" : "Create Quality Training"}
          </DialogTitle>
          <DialogDescription>
            Create comprehensive quality training sessions to improve team skills and compliance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter training title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the training content and goals"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructor</FormLabel>
                        <FormControl>
                          <Input placeholder="Instructor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Schedule & Logistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Schedule & Logistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Scheduled Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Training location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.5"
                              min="0.5"
                              max="8"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Participants</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              max="50"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <Badge className={cn("text-xs", option.color)}>
                              {option.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quality-Specific Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quality-Specific Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="qualityCheckTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Quality Check Types</FormLabel>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {qualityCheckTypes.map((checkType: any) => (
                          <div key={checkType.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={checkType.id}
                              checked={field.value?.includes(checkType.id)}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...(field.value || []), checkType.id]
                                  : (field.value || []).filter((id: string) => id !== checkType.id);
                                field.onChange(updatedValue);
                              }}
                            />
                            <label htmlFor={checkType.id} className="text-sm font-medium">
                              {checkType.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                

                <FormField
                  control={form.control}
                  name="certificationRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Certification Required</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Participants must pass assessment to receive certification
                        </div>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Prerequisites */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Prerequisites</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add prerequisite"
                    value={prerequisiteInput}
                    onChange={(e) => setPrerequisiteInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                  />
                  <Button type="button" onClick={addPrerequisite} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {prerequisites.map((prerequisite, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {prerequisite}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removePrerequisite(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Objectives */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Learning Objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add learning objective"
                    value={objectiveInput}
                    onChange={(e) => setObjectiveInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningObjective())}
                  />
                  <Button type="button" onClick={addLearningObjective} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {learningObjectives.map((objective, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {objective}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeLearningObjective(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTrainingMutation.isPending}
                className="min-w-[120px]"
              >
                {createTrainingMutation.isPending ? "Saving..." : (editingTraining ? "Update Training" : "Create Training")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}