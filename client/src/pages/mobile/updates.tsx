import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  MapPin,
  Camera,
  Plus,
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export default function MobileUpdates() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewUpdateOpen, setIsNewUpdateOpen] = useState(false);
  const [isIssueReportOpen, setIsIssueReportOpen] = useState(false);
  const [newUpdateData, setNewUpdateData] = useState({
    type: 'status_update',
    title: '',
    message: '',
    priority: 'normal'
  });
  const [issueReportData, setIssueReportData] = useState({
    title: '',
    description: '',
    severity: 'normal',
    machineId: ''
  });

  // Fetch operator updates
  const { data: updates = [], isLoading: updatesLoading, refetch: refetchUpdates } = useQuery({
    queryKey: ['/api/mobile/updates'],
    refetchInterval: 20000
  });

  // Fetch machines for issue reporting
  const { data: machines = [] } = useQuery({
    queryKey: ['/api/machines']
  });

  // Create update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch('/api/mobile/updates', {
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
      setIsNewUpdateOpen(false);
      setNewUpdateData({
        type: 'status_update',
        title: '',
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

  // Report issue mutation
  const reportIssueMutation = useMutation({
    mutationFn: async (issueData: any) => {
      const response = await fetch('/api/mobile/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
      });
      if (!response.ok) throw new Error('Failed to report issue');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Issue reported successfully"
      });
      setIsIssueReportOpen(false);
      setIssueReportData({
        title: '',
        description: '',
        severity: 'normal',
        machineId: ''
      });
      refetchUpdates();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to report issue",
        variant: "destructive"
      });
    }
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
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'issue_report': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'completion_report': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'progress_update': return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleCreateUpdate = () => {
    const updateData = {
      updateType: newUpdateData.type,
      title: newUpdateData.title,
      message: newUpdateData.message,
      priority: newUpdateData.priority
    };

    createUpdateMutation.mutate(updateData);
  };

  const handleReportIssue = () => {
    const issueData = {
      title: issueReportData.title,
      description: issueReportData.description,
      severity: issueReportData.severity,
      machineId: issueReportData.machineId || undefined
    };

    reportIssueMutation.mutate(issueData);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quick Updates</h1>
          <p className="text-gray-600 mt-1">Send status updates and report issues</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isIssueReportOpen} onOpenChange={setIsIssueReportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Issue</DialogTitle>
                <DialogDescription>
                  Report a production issue or problem that needs attention
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="issueTitle">Issue Title</Label>
                  <Input
                    id="issueTitle"
                    value={issueReportData.title}
                    onChange={(e) => setIssueReportData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issueDescription">Description</Label>
                  <Textarea
                    id="issueDescription"
                    value={issueReportData.description}
                    onChange={(e) => setIssueReportData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the issue..."
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="machine">Related Machine (Optional)</Label>
                  <Select
                    value={issueReportData.machineId}
                    onValueChange={(value) => setIssueReportData(prev => ({ ...prev, machineId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {(machines as any[]).map((machine: any) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={issueReportData.severity}
                    onValueChange={(value) => setIssueReportData(prev => ({ ...prev, severity: value }))}
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
                  onClick={handleReportIssue}
                  disabled={reportIssueMutation.isPending || !issueReportData.title || !issueReportData.description}
                >
                  {reportIssueMutation.isPending ? 'Reporting...' : 'Report Issue'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isNewUpdateOpen} onOpenChange={setIsNewUpdateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Update
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Update</DialogTitle>
                <DialogDescription>
                  Send a status update to supervisors and management
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="updateType">Update Type</Label>
                  <Select
                    value={newUpdateData.type}
                    onValueChange={(value) => setNewUpdateData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status_update">Status Update</SelectItem>
                      <SelectItem value="progress_update">Progress Update</SelectItem>
                      <SelectItem value="completion_report">Completion Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="updateTitle">Title</Label>
                  <Input
                    id="updateTitle"
                    value={newUpdateData.title}
                    onChange={(e) => setNewUpdateData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Update title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="updateMessage">Message</Label>
                  <Textarea
                    id="updateMessage"
                    value={newUpdateData.message}
                    onChange={(e) => setNewUpdateData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe the update..."
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="updatePriority">Priority</Label>
                  <Select
                    value={newUpdateData.priority}
                    onValueChange={(value) => setNewUpdateData(prev => ({ ...prev, priority: value }))}
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
                  onClick={handleCreateUpdate}
                  disabled={createUpdateMutation.isPending || !newUpdateData.title || !newUpdateData.message}
                >
                  {createUpdateMutation.isPending ? 'Sending...' : 'Send Update'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsNewUpdateOpen(true)}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Status Update</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Send a quick status update to your supervisors</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsIssueReportOpen(true)}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg">Report Issue</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Report a problem or issue that needs attention</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          setNewUpdateData(prev => ({ ...prev, type: 'completion_report', title: 'Task Completion' }));
          setIsNewUpdateOpen(true);
        }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Completion Report</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Report completion of a task or milestone</p>
          </CardContent>
        </Card>
      </div>

      {/* Updates History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
          <CardDescription>
            Your recent status updates and communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(updates as OperatorUpdate[]).map((update) => (
              <div key={update.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="mt-1">
                  {getUpdateTypeIcon(update.updateType)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{update.title}</h4>
                    <Badge variant={getPriorityColor(update.priority)}>
                      {update.priority}
                    </Badge>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(update.status)}`}>
                      {update.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{update.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Type: {update.updateType.replace('_', ' ')}</span>
                    <span>{formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}</span>
                    {update.acknowledgedBy && (
                      <span className="text-green-600">
                        Acknowledged {update.acknowledgedAt && formatDistanceToNow(new Date(update.acknowledgedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {updates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No updates yet. Send your first update above!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}