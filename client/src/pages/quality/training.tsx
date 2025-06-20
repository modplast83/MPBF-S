import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Users, Clock, FileText, Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
// import TrainingForm from "@/components/hr/training-form"; // TODO: Create quality-specific training form

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

interface TrainingStats {
  total: number;
  completed: number;
  inProgress: number;
  thisMonth: number;
}

interface TrainingPoint {
  id: number;
  name: string;
  category: string;
  description?: string;
  estimatedDuration?: number;
  isActive: boolean;
}

export default function TrainingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();

  const { data: trainings = [] } = useQuery<Training[]>({
    queryKey: ["/api/trainings"]
  });

  const { data: trainingPoints = [] } = useQuery<TrainingPoint[]>({
    queryKey: ["/api/training-points"]
  });

  // Calculate statistics
  const stats: TrainingStats = {
    total: trainings.length,
    completed: trainings.filter((t: any) => t.status === "completed").length,
    inProgress: trainings.filter((t: any) => t.status === "in_progress").length,
    thisMonth: trainings.filter((t: any) => {
      const trainingDate = new Date(t.date);
      const now = new Date();
      return trainingDate.getMonth() === now.getMonth() && trainingDate.getFullYear() === now.getFullYear();
    }).length
  };

  const deleteTrainingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/trainings/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to delete training");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t("quality.training.delete_success") });
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
    },
    onError: () => {
      toast({ title: t("quality.training.delete_error"), variant: "destructive" });
    }
  });

  // Filter trainings based on search and status
  const filteredTrainings = trainings.filter((training: any) => {
    const matchesSearch = training.trainingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.traineeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.trainingSection.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || training.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">{t("quality.training.status_completed")}</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">{t("quality.training.status_in_progress")}</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">{t("quality.training.status_cancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    setShowForm(true);
  };

  const handleDelete = (training: Training) => {
    if (confirm(t("quality.training.delete_confirm", { id: training.trainingId }))) {
      deleteTrainingMutation.mutate(training.id);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTraining(null);
  };

  return (
    <div className={`min-h-full p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("quality.training.title")}</h1>
          <p className="text-gray-600">{t("quality.training.description")}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t("quality.training.new_training")}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t("quality.training.stats.total_trainings")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t("quality.training.stats.completed")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t("quality.training.stats.in_progress")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t("quality.training.stats.this_month")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Training Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search trainings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Training List */}
          <div className="space-y-4">
            {filteredTrainings.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No training sessions found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first training session.</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Training
                </Button>
              </div>
            ) : (
              filteredTrainings.map((training: any) => (
                <Card key={training.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Training #{training.trainingId}
                          </h3>
                          {getStatusBadge(training.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Trainee: {training.traineeId}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date: {format(new Date(training.date), "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Duration: {training.numberOfDays} days
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-700">
                            <strong>Section:</strong> {training.trainingSection}
                          </p>
                          {training.report && (
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>Report:</strong> {training.report}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(training)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(training)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Training Form Dialog */}
      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingTraining ? "Edit Training" : "Create New Training"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500">
            Training form component will be implemented for quality-specific training management.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}