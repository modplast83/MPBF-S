import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, User, Clock, BookOpen, Award, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Training Categories and their fields
const TRAINING_CATEGORIES = {
  "Extrusion": [
    "Machine Setup and Operation",
    "Material Handling",
    "Temperature Control",
    "Quality Control",
    "Safety Procedures",
    "Troubleshooting",
    "Maintenance Basics"
  ],
  "Printing": [
    "Print Setup",
    "Ink Management",
    "Registration Control",
    "Color Matching",
    "Quality Inspection",
    "Equipment Cleaning",
    "Waste Reduction"
  ],
  "Cutting": [
    "Blade Selection",
    "Cutting Parameters",
    "Material Handling",
    "Precision Control",
    "Safety Protocols",
    "Edge Quality",
    "Tool Maintenance"
  ],
  "Maintenance": [
    "Preventive Maintenance",
    "Electrical Systems",
    "Mechanical Systems",
    "Hydraulic Systems",
    "Safety Lockout",
    "Parts Inventory",
    "Documentation"
  ],
  "Warehouse": [
    "Inventory Management",
    "Material Handling",
    "Storage Systems",
    "Order Processing",
    "Safety Procedures",
    "Quality Control",
    "Documentation"
  ],
  "Safety": [
    "Personal Protective Equipment",
    "Emergency Procedures",
    "Hazard Identification",
    "Chemical Safety",
    "Fire Safety",
    "First Aid",
    "Incident Reporting"
  ]
};

// General Training Schema
const generalTrainingSchema = z.object({
  traineeId: z.string().min(1, "Trainee is required"),
  date: z.date({
    required_error: "Training date is required",
  }),
  trainingCategory: z.enum(["Extrusion", "Printing", "Cutting", "Maintenance", "Warehouse", "Safety"]),
  trainingFields: z.array(z.string()).min(1, "At least one training field is required"),
  notes: z.string().optional(),
  duration: z.number().min(0.5, "Duration must be at least 30 minutes").max(8, "Duration cannot exceed 8 hours").optional(),
  location: z.string().optional(),
  instructor: z.string().optional(),
});

type GeneralTrainingFormData = z.infer<typeof generalTrainingSchema>;

interface GeneralTrainingFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTraining?: any;
}

export default function GeneralTrainingForm({ isOpen, onClose, editingTraining }: GeneralTrainingFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>(editingTraining?.trainingCategory || "");
  const [selectedFields, setSelectedFields] = useState<string[]>(editingTraining?.trainingFields || []);

  // Fetch users/employees for trainee selection
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const form = useForm<GeneralTrainingFormData>({
    resolver: zodResolver(generalTrainingSchema),
    defaultValues: {
      traineeId: editingTraining?.traineeId || "",
      date: editingTraining?.date ? new Date(editingTraining.date) : new Date(),
      trainingCategory: editingTraining?.trainingCategory || "Extrusion",
      trainingFields: editingTraining?.trainingFields || [],
      notes: editingTraining?.notes || "",
      duration: editingTraining?.duration || 2,
      location: editingTraining?.location || "",
      instructor: editingTraining?.instructor || "",
    },
  });

  // Create training mutation
  const createTrainingMutation = useMutation({
    mutationFn: async (data: GeneralTrainingFormData) => {
      const trainingData = {
        ...data,
        trainingId: generateTrainingId(),
        status: 'scheduled',
        type: 'general'
      };

      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingData)
      });

      if (!response.ok) {
        throw new Error('Failed to create training');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trainings'] });
      form.reset();
      setSelectedFields([]);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create training",
        variant: "destructive"
      });
    }
  });

  // Update training mutation
  const updateTrainingMutation = useMutation({
    mutationFn: async (data: GeneralTrainingFormData) => {
      const response = await fetch(`/api/trainings/${editingTraining.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update training');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trainings'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update training",
        variant: "destructive"
      });
    }
  });

  const generateTrainingId = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-4);
    return `GTR-${dateStr}-${timeStr}`;
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedFields([]);
    form.setValue('trainingCategory', category as any);
    form.setValue('trainingFields', []);
  };

  const handleFieldToggle = (field: string) => {
    const newFields = selectedFields.includes(field)
      ? selectedFields.filter(f => f !== field)
      : [...selectedFields, field];
    
    setSelectedFields(newFields);
    form.setValue('trainingFields', newFields);
  };

  const onSubmit = (data: GeneralTrainingFormData) => {
    if (editingTraining) {
      updateTrainingMutation.mutate(data);
    } else {
      createTrainingMutation.mutate(data);
    }
  };

  const availableFields = selectedCategory ? TRAINING_CATEGORIES[selectedCategory as keyof typeof TRAINING_CATEGORIES] || [] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTraining ? "Edit General Training" : "Create General Training"}
          </DialogTitle>
          <DialogDescription>
            Create or manage general employee training sessions across different departments
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Training Date *</FormLabel>
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
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trainee */}
            <FormField
              control={form.control}
              name="traineeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trainee *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trainee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Training Category */}
            <FormField
              control={form.control}
              name="trainingCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Category *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleCategoryChange(value);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select training category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.keys(TRAINING_CATEGORIES).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Training Fields */}
            {selectedCategory && (
              <div className="space-y-3">
                <FormLabel>Training Fields *</FormLabel>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {availableFields.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={field}
                        checked={selectedFields.includes(field)}
                        onChange={() => handleFieldToggle(field)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={field} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {field}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedFields.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedFields.map((field) => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => handleFieldToggle(field)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Duration */}
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
                      placeholder="2"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Training room, Production floor, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instructor */}
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the training..."
                      rows={3}
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
                disabled={createTrainingMutation.isPending || updateTrainingMutation.isPending}
              >
                {createTrainingMutation.isPending || updateTrainingMutation.isPending 
                  ? "Saving..." 
                  : editingTraining ? "Update Training" : "Create Training"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}