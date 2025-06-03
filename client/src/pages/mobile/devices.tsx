import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Smartphone, 
  Tablet, 
  Wifi, 
  WifiOff,
  Plus,
  Trash2,
  Settings,
  Activity
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface MobileDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: string;
  deviceModel: string | null;
  appVersion: string | null;
  osVersion: string | null;
  pushToken: string | null;
  isActive: boolean;
  lastActive: string;
  registeredAt: string;
}

export default function MobileDevices() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegisterDeviceOpen, setIsRegisterDeviceOpen] = useState(false);
  const [deviceData, setDeviceData] = useState({
    deviceName: '',
    deviceType: 'android',
    deviceModel: '',
    appVersion: '1.0.0',
    osVersion: ''
  });

  // Fetch mobile devices
  const { data: devices = [], isLoading: devicesLoading, refetch: refetchDevices } = useQuery({
    queryKey: ['/api/mobile/devices'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Register device mutation
  const registerDeviceMutation = useMutation({
    mutationFn: async (deviceInfo: any) => {
      const response = await fetch('/api/mobile/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deviceInfo,
          id: `device_${Date.now()}`
        })
      });
      if (!response.ok) throw new Error('Failed to register device');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Device registered successfully"
      });
      setIsRegisterDeviceOpen(false);
      setDeviceData({
        deviceName: '',
        deviceType: 'android',
        deviceModel: '',
        appVersion: '1.0.0',
        osVersion: ''
      });
      refetchDevices();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to register device",
        variant: "destructive"
      });
    }
  });

  // Deactivate device mutation
  const deactivateDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch(`/api/mobile/devices/${deviceId}/deactivate`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to deactivate device');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Device deactivated successfully"
      });
      refetchDevices();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate device",
        variant: "destructive"
      });
    }
  });

  // Update device activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch(`/api/mobile/devices/${deviceId}/activity`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to update device activity');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Device activity updated"
      });
      refetchDevices();
    }
  });

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'ios':
      case 'android':
        return <Smartphone className="h-6 w-6" />;
      case 'tablet':
        return <Tablet className="h-6 w-6" />;
      default:
        return <Smartphone className="h-6 w-6" />;
    }
  };

  const getDeviceTypeColor = (deviceType: string) => {
    switch (deviceType) {
      case 'ios': return 'bg-gray-100 text-gray-800';
      case 'android': return 'bg-green-100 text-green-800';
      case 'tablet': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRegisterDevice = () => {
    if (!deviceData.deviceName || !deviceData.deviceType) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    registerDeviceMutation.mutate(deviceData);
  };

  const handleDeactivateDevice = (deviceId: string) => {
    deactivateDeviceMutation.mutate(deviceId);
  };

  const handleUpdateActivity = (deviceId: string) => {
    updateActivityMutation.mutate(deviceId);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-gray-600 mt-1">Manage your mobile devices and app access</p>
        </div>
        <Dialog open={isRegisterDeviceOpen} onOpenChange={setIsRegisterDeviceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Device</DialogTitle>
              <DialogDescription>
                Register a new mobile device for operator app access
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="deviceName">Device Name *</Label>
                <Input
                  id="deviceName"
                  value={deviceData.deviceName}
                  onChange={(e) => setDeviceData(prev => ({ ...prev, deviceName: e.target.value }))}
                  placeholder="e.g., John's Phone"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deviceType">Device Type *</Label>
                <Select
                  value={deviceData.deviceType}
                  onValueChange={(value) => setDeviceData(prev => ({ ...prev, deviceType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deviceModel">Device Model</Label>
                <Input
                  id="deviceModel"
                  value={deviceData.deviceModel}
                  onChange={(e) => setDeviceData(prev => ({ ...prev, deviceModel: e.target.value }))}
                  placeholder="e.g., Samsung Galaxy S21"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="appVersion">App Version</Label>
                <Input
                  id="appVersion"
                  value={deviceData.appVersion}
                  onChange={(e) => setDeviceData(prev => ({ ...prev, appVersion: e.target.value }))}
                  placeholder="e.g., 1.0.0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="osVersion">OS Version</Label>
                <Input
                  id="osVersion"
                  value={deviceData.osVersion}
                  onChange={(e) => setDeviceData(prev => ({ ...prev, osVersion: e.target.value }))}
                  placeholder="e.g., Android 12"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleRegisterDevice}
                disabled={registerDeviceMutation.isPending}
              >
                {registerDeviceMutation.isPending ? 'Registering...' : 'Register Device'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(devices as MobileDevice[]).map((device) => (
          <Card key={device.id} className={device.isActive ? 'border-green-200' : 'border-gray-200'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={device.isActive ? 'text-green-600' : 'text-gray-400'}>
                    {getDeviceIcon(device.deviceType)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{device.deviceName}</CardTitle>
                    <CardDescription>
                      {device.deviceModel || 'Unknown Model'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {device.isActive ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-gray-400" />
                  )}
                  <Badge variant={device.isActive ? 'default' : 'secondary'}>
                    {device.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getDeviceTypeColor(device.deviceType)}`}>
                    {device.deviceType.toUpperCase()}
                  </span>
                </div>
                {device.appVersion && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">App Version:</span>
                    <span>{device.appVersion}</span>
                  </div>
                )}
                {device.osVersion && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">OS Version:</span>
                    <span>{device.osVersion}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Active:</span>
                  <span>{formatDistanceToNow(new Date(device.lastActive), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registered:</span>
                  <span>{formatDistanceToNow(new Date(device.registeredAt), { addSuffix: true })}</span>
                </div>
                
                <div className="flex gap-2 pt-3">
                  {device.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateActivity(device.id)}
                      disabled={updateActivityMutation.isPending}
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Update Activity
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={device.isActive ? "destructive" : "default"}
                    onClick={() => handleDeactivateDevice(device.id)}
                    disabled={deactivateDeviceMutation.isPending}
                  >
                    {device.isActive ? (
                      <>
                        <WifiOff className="h-4 w-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Wifi className="h-4 w-4 mr-1" />
                        Reactivate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {devices.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Devices Registered</h3>
              <p className="text-gray-600 mb-4">
                Register your mobile device to access the operator app and receive notifications.
              </p>
              <Button onClick={() => setIsRegisterDeviceOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register Your First Device
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Management Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Device Management Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Active Devices</h4>
              <p className="text-gray-600">
                Active devices can receive push notifications and access the mobile operator app. 
                Only one device per user can be active at a time for security reasons.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Device Registration</h4>
              <p className="text-gray-600">
                Register new devices to access mobile features. Each device requires approval 
                and will automatically deactivate other devices for the same user.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Security</h4>
              <p className="text-gray-600">
                Deactivate lost or stolen devices immediately. Device activity is tracked 
                for security and audit purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}