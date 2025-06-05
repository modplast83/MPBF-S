import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GestureInterface } from '@/components/mobile/gesture-interface';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { 
  Clock, 
  Target, 
  AlertCircle, 
  CheckCircle2,
  Activity,
  Smartphone,
  BarChart3,
  Settings
} from 'lucide-react';

interface ProductionMetrics {
  currentShift: {
    startTime: string;
    target: number;
    produced: number;
    efficiency: number;
  };
  activeJobs: number;
  pendingTasks: number;
  alerts: number;
}

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [selectedShift, setSelectedShift] = useState('current');

  // Fetch production metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<ProductionMetrics>({
    queryKey: ['/api/production/metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch active job orders
  const { data: activeJobs = [], isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ['/api/job-orders', { status: 'in_progress' }],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch recent quality checks
  const { data: qualityChecks = [], isLoading: qualityLoading } = useQuery<any[]>({
    queryKey: ['/api/quality-checks', { limit: 5 }],
    refetchInterval: 60000, // Refresh every minute
  });

  const getCurrentShiftProgress = () => {
    if (!metrics?.currentShift) return 0;
    return Math.min((metrics.currentShift.produced / metrics.currentShift.target) * 100, 100);
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Operator Dashboard</CardTitle>
              <p className="text-sm text-gray-600">
                Welcome, {user?.firstName || user?.username}
              </p>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>Online</span>
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Shift Progress</p>
                <p className="text-lg font-semibold">
                  {getCurrentShiftProgress().toFixed(1)}%
                </p>
              </div>
            </div>
            {metrics?.currentShift && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getCurrentShiftProgress()}%` }}
                ></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Efficiency</p>
                <p className={`text-lg font-semibold ${getEfficiencyColor(metrics?.currentShift?.efficiency || 0)}`}>
                  {metrics?.currentShift?.efficiency || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-lg font-semibold">{metrics?.activeJobs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alerts</p>
                <p className="text-lg font-semibold">{metrics?.alerts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="gestures" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gestures" className="flex items-center space-x-1">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Gestures</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center space-x-1">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Quality</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-1">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gestures" className="space-y-4">
          <GestureInterface />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Job Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : activeJobs?.length > 0 ? (
                <div className="space-y-3">
                  {activeJobs.slice(0, 5).map((job: any) => (
                    <div key={job.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Job #{job.id}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {job.quantity} | Status: {job.status}
                          </p>
                        </div>
                        <Badge variant="outline">{job.priority || 'Normal'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active job orders
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Quality Checks</CardTitle>
            </CardHeader>
            <CardContent>
              {qualityLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : qualityChecks?.length > 0 ? (
                <div className="space-y-3">
                  {qualityChecks.slice(0, 5).map((check: any) => (
                    <div key={check.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{check.checkType}</p>
                          <p className="text-sm text-gray-600">
                            {check.rollId && `Roll: ${check.rollId}`}
                          </p>
                        </div>
                        <Badge 
                          variant={check.result === 'pass' ? 'default' : 'destructive'}
                        >
                          {check.result || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent quality checks
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Haptic Feedback</p>
                    <p className="text-sm text-gray-600">Vibration for gesture responses</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enabled
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-refresh</p>
                    <p className="text-sm text-gray-600">Update data automatically</p>
                  </div>
                  <Button variant="outline" size="sm">
                    30s
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sound Alerts</p>
                    <p className="text-sm text-gray-600">Audio notifications</p>
                  </div>
                  <Button variant="outline" size="sm">
                    On
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Screen Timeout</p>
                    <p className="text-sm text-gray-600">Keep screen active</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Never
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full" variant="outline">
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Shift Info */}
      {metrics?.currentShift && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Started</p>
                <p className="font-semibold">{formatTime(metrics.currentShift.startTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Target</p>
                <p className="font-semibold">{metrics.currentShift.target}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Produced</p>
                <p className="font-semibold">{metrics.currentShift.produced}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="font-semibold">
                  {Math.max(0, metrics.currentShift.target - metrics.currentShift.produced)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}