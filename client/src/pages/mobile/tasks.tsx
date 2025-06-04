import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  Clock, 
  Play, 
  MapPin,
  Camera,
  Plus,
  Filter,
  AlertTriangle,
  User,
  Calendar,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface OperatorTask {
  id: number;
  assignedTo: string;
  taskType: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string | null;
  relatedJobOrderId: number | null;
  relatedMachineId: string | null;
  relatedRollId: string | null;
  assignedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  notes: string | null;
  attachments: string[];
  gpsLocation: string | null;
  createdAt: string;
}

interface OperatorUpdate {
  id: number;
  operatorId: string;
  updateType: string;
  title: string;
  message: string;
  relatedJobOrderId: number | null;
  relatedMachineId: string | null;
  relatedRollId: string | null;
  priority: string;
  status: string;
  photos: string[];
  gpsLocation: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

export default function MobileTasks() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<OperatorTask | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [isQuickUpdateOpen, setIsQuickUpdateOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');
  const [quickUpdateData, setQuickUpdateData] = useState({
    type: 'status_update',
    message: '',
    priority: 'normal'
  });

  // Fetch operator tasks
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['/api/mobile/tasks'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch pending tasks
  const { data: pendingTasks = [], refetch: refetchPendingTasks } = useQuery({
    queryKey: ['/api/mobile/tasks/pending'],
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Fetch operator updates
  const { data: updates = [], refetch: refetchUpdates } = useQuery({
    queryKey: ['/api/mobile/updates'],
    refetchInterval: 20000
  });

  // Fetch task statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/mobile/stats'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Start task mutation
  const startTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/mobile/tasks/${taskId}/start`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to start task');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task started successfully"
      });
      refetchTasks();
      refetchPendingTasks();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start task",
        variant: "destructive"
      });
    }
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: number; notes?: string }) => {
      const response = await fetch(`/api/mobile/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!response.ok) throw new Error('Failed to complete task');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task completed successfully"
      });
      setIsTaskDetailsOpen(false);
      setSelectedTask(null);
      refetchTasks();
      refetchPendingTasks();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  });

  // Quick update mutation
  const quickUpdateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch('/api/mobile/quick-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) throw new Error('Failed to create update');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Update sent successfully"
      });
      setIsQuickUpdateOpen(false);
      setQuickUpdateData({
        type: 'status_update',
        message: '',
        priority: 'normal'
      });
      refetchUpdates();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send update",
        variant: "destructive"
      });
    }
  });

  // Filter tasks
  const filteredTasks = tasks.filter((task: OperatorTask) => {
    if (taskFilter === 'pending') return task.status === 'pending';
    if (taskFilter === 'in_progress') return task.status === 'in_progress';
    if (taskFilter === 'completed') return task.status === 'completed';
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'normal': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTaskClick = (task: OperatorTask) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const handleStartTask = (taskId: number) => {
    startTaskMutation.mutate(taskId);
  };

  const handleCompleteTask = (taskId: number, notes?: string) => {
    completeTaskMutation.mutate({ taskId, notes });
  };

  const handleQuickUpdate = () => {
    quickUpdateMutation.mutate(quickUpdateData);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('mobile.tasks.title', 'Operator Tasks')}</h1>
          <p className="text-gray-600 mt-1">{t('mobile.tasks.description', 'Manage your daily tasks and updates')}</p>
        </div>
        <Dialog open={isQuickUpdateOpen} onOpenChange={setIsQuickUpdateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('mobile.tasks.quick_update', 'Quick Update')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('mobile.tasks.send_quick_update', 'Send Quick Update')}</DialogTitle>
              <DialogDescription>
                {t('mobile.tasks.quick_update_desc', 'Send a quick status update to supervisors')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">{t('mobile.tasks.update_type', 'Update Type')}</Label>
                <Select
                  value={quickUpdateData.type}
                  onValueChange={(value) => setQuickUpdateData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status_update">{t('mobile.updates.update_types.status_update', 'Status Update')}</SelectItem>
                    <SelectItem value="issue_report">{t('mobile.updates.update_types.issue_report', 'Issue Report')}</SelectItem>
                    <SelectItem value="progress_update">{t('mobile.updates.update_types.progress_update', 'Progress Update')}</SelectItem>
                    <SelectItem value="completion_report">{t('mobile.updates.update_types.completion_report', 'Completion Report')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">{t('mobile.tasks.update_message', 'Message')}</Label>
                <Textarea
                  id="message"
                  value={quickUpdateData.message}
                  onChange={(e) => setQuickUpdateData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe the update..."
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={quickUpdateData.priority}
                  onValueChange={(value) => setQuickUpdateData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleQuickUpdate}
                disabled={quickUpdateMutation.isPending || !quickUpdateData.message}
              >
                {quickUpdateMutation.isPending ? 'Sending...' : 'Send Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                Tasks waiting
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</div>
              <p className="text-xs text-muted-foreground">
                Per task
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="updates">My Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          {/* Task Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={taskFilter} onValueChange={setTaskFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="grid gap-4">
            {filteredTasks.map((task: OperatorTask) => (
              <Card 
                key={task.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTaskClick(task)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <CardDescription className="text-sm">
                        {task.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartTask(task.id);
                          }}
                          disabled={startTaskMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteTask(task.id);
                          }}
                          disabled={completeTaskMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>Type: {task.taskType.replace('_', ' ')}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {task.estimatedDuration && (
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4 text-gray-500" />
                        <span>Est: {formatDuration(task.estimatedDuration)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          {/* Updates List */}
          <div className="grid gap-4">
            {updates.map((update: OperatorUpdate) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{update.title}</CardTitle>
                        <Badge variant={getPriorityColor(update.priority)}>
                          {update.priority}
                        </Badge>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(update.status)}`}>
                          {update.status}
                        </span>
                      </div>
                      <CardDescription>
                        Type: {update.updateType.replace('_', ' ')}
                      </CardDescription>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{update.message}</p>
                  {update.acknowledgedBy && (
                    <div className="text-xs text-green-600">
                      Acknowledged {update.acknowledgedAt && formatDistanceToNow(new Date(update.acknowledgedAt), { addSuffix: true })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Details Dialog */}
      <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Task Type</Label>
                  <p className="text-sm">{selectedTask.taskType.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge variant={getPriorityColor(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
                {selectedTask.dueDate && (
                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <p className="text-sm">{new Date(selectedTask.dueDate).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedTask.estimatedDuration && (
                <div>
                  <Label className="text-sm font-medium">Estimated Duration</Label>
                  <p className="text-sm">{formatDuration(selectedTask.estimatedDuration)}</p>
                </div>
              )}

              {selectedTask.actualDuration && (
                <div>
                  <Label className="text-sm font-medium">Actual Duration</Label>
                  <p className="text-sm">{formatDuration(selectedTask.actualDuration)}</p>
                </div>
              )}

              {selectedTask.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm">{selectedTask.notes}</p>
                </div>
              )}

              {selectedTask.startedAt && (
                <div>
                  <Label className="text-sm font-medium">Started At</Label>
                  <p className="text-sm">{new Date(selectedTask.startedAt).toLocaleString()}</p>
                </div>
              )}

              {selectedTask.completedAt && (
                <div>
                  <Label className="text-sm font-medium">Completed At</Label>
                  <p className="text-sm">{new Date(selectedTask.completedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedTask?.status === 'pending' && (
              <Button
                onClick={() => selectedTask && handleStartTask(selectedTask.id)}
                disabled={startTaskMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Task
              </Button>
            )}
            {selectedTask?.status === 'in_progress' && (
              <Button
                onClick={() => selectedTask && handleCompleteTask(selectedTask.id)}
                disabled={completeTaskMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Task
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}