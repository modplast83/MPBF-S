import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, 
  AlertTriangle, 
  Thermometer, 
  Gauge, 
  Zap, 
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Settings,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MachineSensor {
  id: string;
  machineId: string;
  sensorType: string;
  name: string;
  unit: string;
  minValue: number | null;
  maxValue: number | null;
  warningThreshold: number | null;
  criticalThreshold: number | null;
  isActive: boolean;
}

interface SensorData {
  id: number;
  sensorId: string;
  value: number;
  timestamp: string;
  status: string;
}

interface IotAlert {
  id: number;
  sensorId: string;
  alertType: string;
  severity: string;
  message: string;
  currentValue: number | null;
  thresholdValue: number | null;
  isActive: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface SensorAnalytics {
  average: number;
  min: number;
  max: number;
  latest: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  dataPoints: Array<{
    timestamp: string;
    value: number;
    status: string;
  }>;
}

export default function IoTMonitor() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [isAddSensorOpen, setIsAddSensorOpen] = useState(false);
  const [newSensorData, setNewSensorData] = useState({
    machineId: '',
    sensorType: '',
    name: '',
    unit: '',
    warningThreshold: '',
    criticalThreshold: ''
  });

  // Fetch sensors
  const { data: sensors = [], isLoading: sensorsLoading, refetch: refetchSensors } = useQuery({
    queryKey: ['/api/iot/sensors'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch machines for sensor creation
  const { data: machines = [] } = useQuery({
    queryKey: ['/api/machines']
  });

  // Fetch active alerts
  const { data: activeAlerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ['/api/iot/alerts/active'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch sensor analytics for selected sensor
  const { data: sensorAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/iot/analytics', selectedSensor],
    enabled: !!selectedSensor,
    refetchInterval: 15000
  });

  // Filter sensors by selected machine
  const filteredSensors = selectedMachine === 'all' 
    ? sensors 
    : sensors.filter((s: MachineSensor) => s.machineId === selectedMachine);

  // Create sensor mutation
  const createSensorMutation = useMutation({
    mutationFn: async (sensorData: any) => {
      const response = await fetch('/api/iot/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensorData)
      });
      if (!response.ok) throw new Error('Failed to create sensor');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sensor created successfully"
      });
      setIsAddSensorOpen(false);
      setNewSensorData({
        machineId: '',
        sensorType: '',
        name: '',
        unit: '',
        warningThreshold: '',
        criticalThreshold: ''
      });
      refetchSensors();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sensor",
        variant: "destructive"
      });
    }
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/iot/alerts/${alertId}/acknowledge`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to acknowledge alert');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alert acknowledged"
      });
      refetchAlerts();
    }
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/iot/alerts/${alertId}/resolve`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to resolve alert');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alert resolved"
      });
      refetchAlerts();
    }
  });

  const handleCreateSensor = () => {
    const sensorData = {
      id: `sensor_${Date.now()}`,
      machineId: newSensorData.machineId,
      sensorType: newSensorData.sensorType,
      name: newSensorData.name,
      unit: newSensorData.unit,
      warningThreshold: newSensorData.warningThreshold ? parseFloat(newSensorData.warningThreshold) : null,
      criticalThreshold: newSensorData.criticalThreshold ? parseFloat(newSensorData.criticalThreshold) : null,
      isActive: true
    };

    createSensorMutation.mutate(sensorData);
  };

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType) {
      case 'temperature': return <Thermometer className="h-5 w-5" />;
      case 'pressure': return <Gauge className="h-5 w-5" />;
      case 'speed': return <Activity className="h-5 w-5" />;
      case 'energy': return <Zap className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('iot.title', 'IoT Monitor')}</h1>
          <p className="text-gray-600 mt-1">{t('iot.description', 'Real-time machine monitoring and alerts')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchSensors();
              refetchAlerts();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('iot.refresh', 'Refresh')}
          </Button>
          <Dialog open={isAddSensorOpen} onOpenChange={setIsAddSensorOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('iot.add_sensor', 'Add Sensor')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('iot.add_new_sensor', 'Add New Sensor')}</DialogTitle>
                <DialogDescription>
                  {t('iot.configure_sensor', 'Configure a new IoT sensor for machine monitoring')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="machine">{t('iot.machine', 'Machine')}</Label>
                  <Select
                    value={newSensorData.machineId}
                    onValueChange={(value) => setNewSensorData(prev => ({ ...prev, machineId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('iot.select_machine', 'Select machine')} />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map((machine: any) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sensorType">{t('iot.sensor_type', 'Sensor Type')}</Label>
                  <Select
                    value={newSensorData.sensorType}
                    onValueChange={(value) => setNewSensorData(prev => ({ ...prev, sensorType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('iot.select_sensor_type', 'Select sensor type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">{t('iot.sensor_types.temperature', 'Temperature')}</SelectItem>
                      <SelectItem value="pressure">{t('iot.sensor_types.pressure', 'Pressure')}</SelectItem>
                      <SelectItem value="speed">{t('iot.sensor_types.speed', 'Speed')}</SelectItem>
                      <SelectItem value="vibration">{t('iot.sensor_types.vibration', 'Vibration')}</SelectItem>
                      <SelectItem value="energy">{t('iot.sensor_types.energy', 'Energy')}</SelectItem>
                      <SelectItem value="status">{t('iot.sensor_types.status', 'Status')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">{t('iot.sensor_name', 'Sensor Name')}</Label>
                  <Input
                    id="name"
                    value={newSensorData.name}
                    onChange={(e) => setNewSensorData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('iot.sensor_name_placeholder', 'e.g., Main Motor Temperature')}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">{t('iot.unit', 'Unit')}</Label>
                  <Input
                    id="unit"
                    value={newSensorData.unit}
                    onChange={(e) => setNewSensorData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder={t('iot.unit_placeholder', 'e.g., °C, bar, rpm')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="warning">{t('iot.warning_threshold', 'Warning Threshold')}</Label>
                    <Input
                      id="warning"
                      type="number"
                      value={newSensorData.warningThreshold}
                      onChange={(e) => setNewSensorData(prev => ({ ...prev, warningThreshold: e.target.value }))}
                      placeholder={t('iot.warning_level', 'Warning level')}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="critical">{t('iot.critical_threshold', 'Critical Threshold')}</Label>
                    <Input
                      id="critical"
                      type="number"
                      value={newSensorData.criticalThreshold}
                      onChange={(e) => setNewSensorData(prev => ({ ...prev, criticalThreshold: e.target.value }))}
                      placeholder={t('iot.critical_level', 'Critical level')}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateSensor}
                  disabled={createSensorMutation.isPending}
                >
                  {createSensorMutation.isPending ? t('iot.creating', 'Creating...') : t('iot.create_sensor', 'Create Sensor')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              {t('iot.active_alerts', 'Active Alerts')} ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert: IotAlert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('iot.current', 'Current')}: {alert.currentValue} | {t('iot.threshold', 'Threshold')}: {alert.thresholdValue}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!alert.acknowledgedBy && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                        disabled={acknowledgeAlertMutation.isPending}
                      >
                        {t('iot.acknowledge', 'Acknowledge')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => resolveAlertMutation.mutate(alert.id)}
                      disabled={resolveAlertMutation.isPending}
                    >
                      {t('iot.resolve', 'Resolve')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t('iot.overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="sensors">{t('iot.sensors', 'Sensors')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('iot.analytics', 'Analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Sensor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSensors.map((sensor: MachineSensor) => (
              <Card 
                key={sensor.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedSensor(sensor.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSensorIcon(sensor.sensorType)}
                      <CardTitle className="text-sm">{sensor.name}</CardTitle>
                    </div>
                    <Badge variant={sensor.isActive ? 'default' : 'secondary'}>
                      {sensor.isActive ? t('iot.active', 'Active') : t('iot.inactive', 'Inactive')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('iot.type', 'Type')}:</span>
                      <span className="capitalize">{t(`iot.sensor_types.${sensor.sensorType}`, sensor.sensorType)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t('iot.unit', 'Unit')}:</span>
                      <span>{sensor.unit}</span>
                    </div>
                    {sensor.warningThreshold && (
                      <div className="flex justify-between text-sm">
                        <span>{t('iot.warning', 'Warning')}:</span>
                        <span className="text-yellow-600">{sensor.warningThreshold}</span>
                      </div>
                    )}
                    {sensor.criticalThreshold && (
                      <div className="flex justify-between text-sm">
                        <span>{t('iot.critical', 'Critical')}:</span>
                        <span className="text-red-600">{sensor.criticalThreshold}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-6">
          {/* Machine Filter */}
          <Card>
            <CardHeader>
              <CardTitle>{t('iot.filter_by_machine', 'Filter by Machine')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('iot.all_machines', 'All Machines')}</SelectItem>
                  {machines.map((machine: any) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Detailed Sensor List */}
          <div className="grid gap-4">
            {filteredSensors.map((sensor: MachineSensor) => (
              <Card key={sensor.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSensorIcon(sensor.sensorType)}
                      <div>
                        <CardTitle>{sensor.name}</CardTitle>
                        <CardDescription>
                          {sensor.sensorType} sensor on machine {sensor.machineId}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={sensor.isActive ? 'default' : 'secondary'}>
                      {sensor.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Unit</label>
                      <p className="text-lg">{sensor.unit}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Warning</label>
                      <p className="text-lg text-yellow-600">{sensor.warningThreshold || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Critical</label>
                      <p className="text-lg text-red-600">{sensor.criticalThreshold || 'N/A'}</p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSensor(sensor.id)}
                      >
                        View Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {selectedSensor ? (
            <>
              {analyticsLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">Loading analytics...</div>
                  </CardContent>
                </Card>
              ) : sensorAnalytics ? (
                <div className="space-y-6">
                  {/* Analytics Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Latest Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{sensorAnalytics.latest}</div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {getTrendIcon(sensorAnalytics.trend)}
                          <span className="capitalize">{sensorAnalytics.trend}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{sensorAnalytics.average}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Minimum</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{sensorAnalytics.min}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Maximum</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{sensorAnalytics.max}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Analytics Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sensor Data Trend (Last 24 Hours)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sensorAnalytics.dataPoints}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="timestamp" 
                              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleString()}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">No analytics data available</div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  Select a sensor to view analytics
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}