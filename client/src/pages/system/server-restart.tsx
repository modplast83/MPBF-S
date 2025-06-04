import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  RotateCcw, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  RefreshCw,
  Power,
  Shield,
  Terminal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ServerStatus {
  status: string;
  uptime: number;
  lastRestart: string;
  processId: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  activeConnections: number;
  nodeVersion: string;
  environment: string;
}

interface RestartHistoryItem {
  id: number;
  timestamp: string;
  reason: string;
  initiatedBy: string;
  status: string;
  duration: number;
}

export default function ServerRestart() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [restartProgress, setRestartProgress] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartStatus, setRestartStatus] = useState<'idle' | 'preparing' | 'stopping' | 'starting' | 'complete' | 'error'>('idle');
  const [lastRestartTime, setLastRestartTime] = useState<Date | null>(null);

  // Fetch real server status from API
  const { data: serverStatus, refetch: refetchStatus } = useQuery<ServerStatus>({
    queryKey: ['/api/system/server-status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch restart history
  const { data: restartHistory } = useQuery<RestartHistoryItem[]>({
    queryKey: ['/api/system/restart-history'],
  });

  const restartServerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/system/restart-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to restart server');
      return response.json();
    },
    onSuccess: () => {
      setRestartStatus('complete');
      setLastRestartTime(new Date());
      toast({
        title: t('system.server_restart.success_title', 'Server Restarted'),
        description: t('system.server_restart.success_desc', 'Server has been successfully restarted')
      });
    },
    onError: (error) => {
      setRestartStatus('error');
      setIsRestarting(false);
      setRestartProgress(0);
      toast({
        title: t('system.server_restart.error_title', 'Restart Failed'),
        description: t('system.server_restart.error_desc', 'Failed to restart the server'),
        variant: "destructive"
      });
    }
  });

  const handleServerRestart = async () => {
    setIsRestarting(true);
    setRestartStatus('preparing');
    setRestartProgress(0);

    // Simulate restart process with progress updates
    const stages = [
      { status: 'preparing', progress: 20, duration: 1000 },
      { status: 'stopping', progress: 40, duration: 2000 },
      { status: 'starting', progress: 80, duration: 3000 },
      { status: 'complete', progress: 100, duration: 1000 }
    ];

    for (const stage of stages) {
      setRestartStatus(stage.status as any);
      setRestartProgress(stage.progress);
      await new Promise(resolve => setTimeout(resolve, stage.duration));
    }

    // Actually trigger the restart
    restartServerMutation.mutate();
    
    // Reset state after completion
    setTimeout(() => {
      setIsRestarting(false);
      setRestartProgress(0);
      setRestartStatus('idle');
    }, 2000);
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'stopping': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading state if server status is not yet loaded
  if (!serverStatus) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('common.loading', 'Loading...')}</span>
        </div>
      </div>
    );
  }

  const getRestartStatusText = (status: string) => {
    switch (status) {
      case 'preparing': return t('system.server_restart.preparing', 'Preparing restart...');
      case 'stopping': return t('system.server_restart.stopping', 'Stopping server...');
      case 'starting': return t('system.server_restart.starting', 'Starting server...');
      case 'complete': return t('system.server_restart.complete', 'Restart complete');
      case 'error': return t('system.server_restart.error', 'Restart failed');
      default: return '';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('system.server_restart.title', 'Server Management')}</h1>
          <p className="text-gray-600 mt-1">
            {t('system.server_restart.description', 'Monitor server status and perform maintenance operations')}
          </p>
        </div>
        <Badge className={getStatusColor(serverStatus.status)}>
          <Activity className="h-3 w-3 mr-1" />
          {t(`system.server_restart.status.${serverStatus.status}`, serverStatus.status)}
        </Badge>
      </div>

      {/* Server Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('system.server_restart.uptime', 'Uptime')}
                </p>
                <p className="text-2xl font-bold">{formatUptime(serverStatus.uptime)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('system.server_restart.memory_usage', 'Memory Usage')}
                </p>
                <p className="text-2xl font-bold">{serverStatus.memoryUsage.percentage}%</p>
                <p className="text-xs text-gray-500">
                  {serverStatus.memoryUsage.used}MB / {serverStatus.memoryUsage.total}MB
                </p>
              </div>
              <Server className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('system.server_restart.process_id', 'Process ID')}
                </p>
                <p className="text-2xl font-bold">{serverStatus.processId}</p>
              </div>
              <Terminal className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('system.server_restart.active_connections', 'Active Connections')}
                </p>
                <p className="text-2xl font-bold">{serverStatus.activeConnections}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restart Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Power className="h-5 w-5 mr-2" />
              {t('system.server_restart.restart_controls', 'Server Restart')}
            </CardTitle>
            <CardDescription>
              {t('system.server_restart.restart_desc', 'Restart the application server to apply configuration changes or clear memory')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isRestarting && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{getRestartStatusText(restartStatus)}</span>
                    <span className="text-sm text-gray-500">{restartProgress}%</span>
                  </div>
                  <Progress value={restartProgress} className="h-2" />
                </div>
              )}

              <Alert className={restartStatus === 'error' ? 'border-red-200' : 'border-yellow-200'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('system.server_restart.warning_title', 'Warning')}</AlertTitle>
                <AlertDescription>
                  {t('system.server_restart.warning_desc', 'Restarting the server will temporarily disconnect all users. Active operations may be interrupted.')}
                </AlertDescription>
              </Alert>

              <div className="flex space-x-3">
                <Button
                  onClick={handleServerRestart}
                  disabled={isRestarting}
                  variant="destructive"
                  className="flex-1"
                >
                  {isRestarting ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      {t('system.server_restart.restarting', 'Restarting...')}
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      {t('system.server_restart.restart_now', 'Restart Server')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              {t('system.server_restart.server_info', 'Server Information')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('system.server_restart.last_restart', 'Last Restart')}</span>
                <span className="text-sm font-medium">
                  {lastRestartTime 
                    ? format(lastRestartTime, 'MMM d, yyyy HH:mm')
                    : format(new Date(serverStatus.lastRestart), 'MMM d, yyyy HH:mm')
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('system.server_restart.server_status', 'Status')}</span>
                <Badge className={getStatusColor(serverStatus.status)}>
                  {restartStatus === 'complete' ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Activity className="h-3 w-3 mr-1" />
                  )}
                  {t(`system.server_restart.status.${serverStatus.status}`, serverStatus.status)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('system.server_restart.environment', 'Environment')}</span>
                <span className="text-sm font-medium">Production</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('system.server_restart.node_version', 'Node.js Version')}</span>
                <span className="text-sm font-medium">v20.18.1</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Restart History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('system.server_restart.restart_history', 'Restart History')}</CardTitle>
          <CardDescription>
            {t('system.server_restart.history_desc', 'Recent server restart events and their status')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {restartHistory?.map((restart) => (
              <div key={restart.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{restart.reason}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(restart.timestamp), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(restart.duration / 1000)}s
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{restart.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}