import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { 
  BookOpen, 
  Calendar, 
  User, 
  Clock, 
  Users, 
  Award, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  FileText,
  Target
} from "lucide-react";
import { useTranslation } from "react-i18next";
import GeneralTrainingForm from "@/components/training/general-training-form";
import TrainingEvaluationForm from "@/components/training/training-evaluation-form";

interface Training {
  id: number;
  trainingId: string;
  traineeId: string;
  traineeName?: string;
  date: string;
  trainingCategory: string;
  trainingFields: string[];
  status: string;
  duration?: number;
  location?: string;
  instructor?: string;
  notes?: string;
  type?: string;
}

export default function GeneralTrainingPage() {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [evaluatingTraining, setEvaluatingTraining] = useState<Training | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch trainings
  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['/api/trainings'],
  });

  // Fetch users for name mapping
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  // Filter trainings to show general trainings only
  const generalTrainings = trainings.filter((training: Training) => 
    training.type === "general" || 
    training.trainingCategory || 
    !training.type // Include legacy trainings without type
  );

  // Add trainee names to trainings
  const trainingsWithNames = generalTrainings.map((training: Training) => {
    const trainee = users.find((user: any) => user.id === training.traineeId);
    return {
      ...training,
      traineeName: trainee ? 
        (trainee.firstName && trainee.lastName ? `${trainee.firstName} ${trainee.lastName}` : trainee.username) 
        : 'Unknown Trainee'
    };
  });

  // Filter trainings based on search and filters
  const filteredTrainings = trainingsWithNames.filter((training: Training) => {
    const matchesSearch = searchTerm === "" || 
      training.traineeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.trainingCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.trainingId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || training.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || training.trainingCategory === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
    setIsFormOpen(true);
  };

  const handleEvaluateTraining = (training: Training) => {
    setEvaluatingTraining(training);
    setIsEvaluationOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTraining(null);
  };

  const handleCloseEvaluation = () => {
    setIsEvaluationOpen(false);
    setEvaluatingTraining(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "scheduled":
        return <Badge className="bg-yellow-100 text-yellow-800"><Calendar className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Extrusion": "bg-blue-100 text-blue-800",
      "Printing": "bg-purple-100 text-purple-800",
      "Cutting": "bg-green-100 text-green-800",
      "Maintenance": "bg-orange-100 text-orange-800",
      "Warehouse": "bg-indigo-100 text-indigo-800",
      "Safety": "bg-red-100 text-red-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  // Calculate statistics
  const totalTrainings = filteredTrainings.length;
  const completedTrainings = filteredTrainings.filter(t => t.status === 'completed').length;
  const inProgressTrainings = filteredTrainings.filter(t => t.status === 'in_progress').length;
  const scheduledTrainings = filteredTrainings.filter(t => t.status === 'scheduled').length;

  const TrainingCard = ({ training }: { training: Training }) => {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{training.trainingId}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{training.traineeName}</span>
              </div>
            </div>
            {getStatusBadge(training.status)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={getCategoryColor(training.trainingCategory)}>
              {training.trainingCategory}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(training.date), "MMM dd, yyyy")}</span>
            </div>
            {training.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{training.duration}h</span>
              </div>
            )}
            {training.location && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>{training.location}</span>
              </div>
            )}
          </div>

          {training.trainingFields && training.trainingFields.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Training Fields:</div>
              <div className="flex flex-wrap gap-1">
                {training.trainingFields.slice(0, 3).map((field, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
                {training.trainingFields.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{training.trainingFields.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditTraining(training)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {training.status === 'completed' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEvaluateTraining(training)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Evaluate
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">General Training Management</h1>
          <p className="text-muted-foreground">
            Manage employee training programs across all departments
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Training
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trainings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrainings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTrainings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressTrainings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{scheduledTrainings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trainings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Extrusion">Extrusion</SelectItem>
                <SelectItem value="Printing">Printing</SelectItem>
                <SelectItem value="Cutting">Cutting</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Warehouse">Warehouse</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Training Content */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid">
          {filteredTrainings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Training Sessions Found</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-4">
                  {searchTerm || statusFilter !== "all" || categoryFilter !== "all" 
                    ? "No trainings match your current filters. Try adjusting your search criteria."
                    : "Get started by creating your first training session."}
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Training
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrainings.map((training) => (
                <TrainingCard key={training.id} training={training} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Training ID</th>
                      <th className="text-left p-4 font-medium">Trainee</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Duration</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainings.map((training) => (
                      <tr key={training.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{training.trainingId}</td>
                        <td className="p-4">{training.traineeName}</td>
                        <td className="p-4">{format(new Date(training.date), "MMM dd, yyyy")}</td>
                        <td className="p-4">
                          <Badge className={getCategoryColor(training.trainingCategory)}>
                            {training.trainingCategory}
                          </Badge>
                        </td>
                        <td className="p-4">{training.duration || "N/A"}h</td>
                        <td className="p-4">{getStatusBadge(training.status)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditTraining(training)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {training.status === 'completed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEvaluateTraining(training)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Training Form */}
      <GeneralTrainingForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editingTraining={editingTraining}
      />

      {/* Training Evaluation Form */}
      {evaluatingTraining && (
        <TrainingEvaluationForm
          isOpen={isEvaluationOpen}
          onClose={handleCloseEvaluation}
          training={evaluatingTraining}
        />
      )}
    </div>
  );
}