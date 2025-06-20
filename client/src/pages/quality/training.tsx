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
  Download,
  Eye
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import QualityTrainingForm from "@/components/quality/quality-training-form";

interface Training {
  id: number;
  trainingId: string;
  title: string;
  description: string;
  instructor: string;
  location: string;
  scheduledDate: string;
  duration: number;
  maxParticipants: number;
  category: string;
  priority: string;
  status: string;
  certificationRequired: boolean;
  qualityCheckTypes: string[];
  equipmentIds: string[];
  prerequisites: string[];
  learningObjectives: string[];
  type?: string;
}

export default function QualityTrainingPage() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Fetch trainings with quality focus
  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['/api/trainings'],
  });

  // Filter trainings to show quality-related ones
  const qualityTrainings = trainings.filter((training: Training) => 
    training.type === "quality" || 
    training.category?.includes("quality") ||
    training.qualityCheckTypes?.length > 0
  );

  const filteredTrainings = qualityTrainings.filter((training: Training) => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || training.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || training.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || training.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTraining(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "quality_control": return CheckCircle;
      case "equipment_operation": return User;
      case "safety_procedures": return AlertTriangle;
      case "process_improvement": return Award;
      case "documentation": return BookOpen;
      case "calibration": return Clock;
      default: return BookOpen;
    }
  };

  const TrainingCard = ({ training }: { training: Training }) => {
    const CategoryIcon = getCategoryIcon(training.category);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">{training.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{training.trainingId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(training.priority)}>
                {training.priority}
              </Badge>
              <Badge className={getStatusColor(training.status)}>
                {training.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {training.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{training.instructor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(training.scheduledDate), "MMM dd, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{training.duration}h</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Max {training.maxParticipants}</span>
            </div>
          </div>

          {training.certificationRequired && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Award className="h-4 w-4" />
              <span>Certification Required</span>
            </div>
          )}

          {training.qualityCheckTypes && training.qualityCheckTypes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Related Quality Checks:</p>
              <div className="flex flex-wrap gap-1">
                {training.qualityCheckTypes.slice(0, 3).map((checkType, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {checkType}
                  </Badge>
                ))}
                {training.qualityCheckTypes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{training.qualityCheckTypes.length - 3} more
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
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditTraining(training)}
            >
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality Training Management</h1>
          <p className="text-muted-foreground">
            Manage quality-focused training sessions and certifications
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Quality Training
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Trainings</p>
                <p className="text-2xl font-bold">{qualityTrainings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">
                  {qualityTrainings.filter(t => t.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {qualityTrainings.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Certifications</p>
                <p className="text-2xl font-bold">
                  {qualityTrainings.filter(t => t.certificationRequired).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trainings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
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
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="quality_control">Quality Control</SelectItem>
                <SelectItem value="equipment_operation">Equipment Operation</SelectItem>
                <SelectItem value="safety_procedures">Safety Procedures</SelectItem>
                <SelectItem value="process_improvement">Process Improvement</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="calibration">Calibration</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Training List */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTrainings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quality Trainings Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all"
                    ? "No trainings match your current filters."
                    : "Get started by creating your first quality training session."}
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quality Training
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
                      <th className="text-left p-4 font-medium">Training</th>
                      <th className="text-left p-4 font-medium">Instructor</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Duration</th>
                      <th className="text-left p-4 font-medium">Priority</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainings.map((training) => (
                      <tr key={training.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{training.title}</p>
                            <p className="text-sm text-muted-foreground">{training.trainingId}</p>
                          </div>
                        </td>
                        <td className="p-4">{training.instructor}</td>
                        <td className="p-4">
                          {format(new Date(training.scheduledDate), "MMM dd, yyyy")}
                        </td>
                        <td className="p-4">{training.duration}h</td>
                        <td className="p-4">
                          <Badge className={getPriorityColor(training.priority)}>
                            {training.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(training.status)}>
                            {training.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditTraining(training)}
                          >
                            Edit
                          </Button>
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

      {/* Quality Training Form */}
      <QualityTrainingForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editingTraining={editingTraining}
      />
    </div>
  );
}