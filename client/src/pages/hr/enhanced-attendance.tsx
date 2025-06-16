import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MapPin, 
  Clock, 
  UserCheck, 
  LogOut, 
  Coffee, 
  PlayCircle, 
  StopCircle,
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar,
  TrendingUp,
  Timer
} from "lucide-react";

interface GeofenceData {
  id: number;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  isActive: boolean;
}

interface AttendanceRecord {
  id: number;
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  workingHours: number;
  overtimeHours: number;
  breakDuration: number;
  checkInLocation?: string;
  checkOutLocation?: string;
  status: string;
  isAutoCheckedOut: boolean;
  autoCheckOutReason?: string;
  overtimeApproved: boolean;
}

export default function EnhancedAttendance() {
  const { toast } = useToast();
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isInGeofence, setIsInGeofence] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest('GET', '/api/user')
  });

  // Fetch today's attendance
  const { data: todayAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['/api/time-attendance', currentUser?.id, selectedDate],
    queryFn: () => currentUser ? apiRequest('GET', `/api/time-attendance/user/${currentUser.id}`) : null,
    enabled: !!currentUser
  });

  // Fetch all attendance records
  const { data: allAttendance = [], isLoading } = useQuery({
    queryKey: ['/api/hr/time-attendance'],
    queryFn: () => apiRequest('GET', '/api/hr/time-attendance')
  });

  // Fetch users for display
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users')
  });

  // Fetch geofences
  const { data: geofences = [] } = useQuery({
    queryKey: ['/api/hr/geofences'],
    queryFn: () => apiRequest('GET', '/api/hr/geofences')
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data: { userId: string; latitude: number; longitude: number }) =>
      apiRequest('POST', '/api/hr/check-in', data),
    onSuccess: () => {
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ['/api/hr/time-attendance'] });
      toast({
        title: "Success",
        description: "Checked in successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in",
        variant: "destructive"
      });
    }
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: (data: { userId: string; latitude?: number; longitude?: number; isAutomatic?: boolean }) =>
      apiRequest('POST', '/api/hr/check-out', data),
    onSuccess: () => {
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ['/api/hr/time-attendance'] });
      toast({
        title: "Success",
        description: "Checked out successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Check-out Failed",
        description: error.message || "Failed to check out",
        variant: "destructive"
      });
    }
  });

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ latitude, longitude });
          checkGeofence(latitude, longitude);
        },
        (error) => {
          setLocationError("Location access denied. Please enable location services for attendance tracking.");
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );

      // Watch position for automatic check-out
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ latitude, longitude });
          checkGeofence(latitude, longitude);
        },
        (error) => {
          console.error("Position watch error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  // Check if user is within geofence
  const checkGeofence = async (latitude: number, longitude: number) => {
    try {
      const response = await apiRequest('POST', '/api/hr/check-geofence', { latitude, longitude });
      const inGeofence = response.length > 0;
      
      // If user was in geofence but now outside, trigger automatic check-out
      if (isInGeofence && !inGeofence && todayAttendance?.checkInTime && !todayAttendance?.checkOutTime) {
        if (currentUser) {
          checkOutMutation.mutate({
            userId: currentUser.id,
            latitude,
            longitude,
            isAutomatic: true
          });
        }
      }
      
      setIsInGeofence(inGeofence);
    } catch (error) {
      console.error("Geofence check error:", error);
    }
  };

  const handleCheckIn = () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive"
      });
      return;
    }

    if (!currentPosition) {
      toast({
        title: "Location Required",
        description: "Please enable location services to check in",
        variant: "destructive"
      });
      return;
    }

    checkInMutation.mutate({
      userId: currentUser.id,
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude
    });
  };

  const handleCheckOut = () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive"
      });
      return;
    }

    checkOutMutation.mutate({
      userId: currentUser.id,
      latitude: currentPosition?.latitude,
      longitude: currentPosition?.longitude,
      isAutomatic: false
    });
  };

  const getTodayRecord = () => {
    if (!currentUser || !allAttendance) return null;
    const today = new Date().toISOString().split('T')[0];
    return allAttendance.find((record: AttendanceRecord) => 
      record.userId === currentUser.id && 
      new Date(record.date).toISOString().split('T')[0] === today
    );
  };

  const todayRecord = getTodayRecord();

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown User';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-yellow-100 text-yellow-800",
      early_leave: "bg-orange-100 text-orange-800",
      sick: "bg-purple-100 text-purple-800",
      vacation: "bg-blue-100 text-blue-800"
    };
    return variants[status] || "bg-gray-100 text-gray-800";
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "Not recorded";
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Calculate statistics
  const todayStats = {
    totalEmployees: users.length,
    checkedIn: allAttendance.filter((r: AttendanceRecord) => 
      new Date(r.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && r.checkInTime
    ).length,
    onTime: allAttendance.filter((r: AttendanceRecord) => 
      new Date(r.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && 
      r.status === 'present' && r.checkInTime
    ).length,
    avgWorkingHours: allAttendance.length > 0 
      ? allAttendance.reduce((sum: number, r: AttendanceRecord) => sum + r.workingHours, 0) / allAttendance.length 
      : 0
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enhanced Attendance System</h1>
        <p className="text-gray-600 mt-2">Smart attendance tracking with geofencing and automatic check-out</p>
      </div>

      {/* Location Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {locationError ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{locationError}</span>
                </div>
              ) : currentPosition ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Location detected</span>
                  <Badge className={isInGeofence ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {isInGeofence ? "Inside Factory Area" : "Outside Factory Area"}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Timer className="h-5 w-5" />
                  <span>Getting location...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <UserCheck className="h-8 w-8 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Check In</h3>
              <Button 
                onClick={handleCheckIn}
                disabled={!isInGeofence || !!todayRecord?.checkInTime || checkInMutation.isPending}
                className="w-full"
              >
                {checkInMutation.isPending ? "Checking In..." : "Check In"}
              </Button>
              {todayRecord?.checkInTime && (
                <p className="text-sm text-gray-500 mt-2">
                  Checked in at {formatTime(todayRecord.checkInTime)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <LogOut className="h-8 w-8 mx-auto mb-4 text-blue-500" />
              <h3 className="font-semibold mb-2">Check Out</h3>
              <Button 
                onClick={handleCheckOut}
                disabled={!todayRecord?.checkInTime || !!todayRecord?.checkOutTime || checkOutMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {checkOutMutation.isPending ? "Checking Out..." : "Check Out"}
              </Button>
              {todayRecord?.checkOutTime && (
                <p className="text-sm text-gray-500 mt-2">
                  Checked out at {formatTime(todayRecord.checkOutTime)}
                  {todayRecord.isAutoCheckedOut && (
                    <Badge className="ml-2 bg-orange-100 text-orange-800">Auto</Badge>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-4 text-purple-500" />
              <h3 className="font-semibold mb-2">Working Hours</h3>
              <div className="text-2xl font-bold text-gray-900">
                {todayRecord ? formatDuration(todayRecord.workingHours) : "0h 0m"}
              </div>
              {todayRecord?.overtimeHours > 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  +{formatDuration(todayRecord.overtimeHours)} overtime
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Coffee className="h-8 w-8 mx-auto mb-4 text-orange-500" />
              <h3 className="font-semibold mb-2">Break Time</h3>
              <div className="text-lg font-semibold text-gray-900">
                {todayRecord?.breakDuration ? formatDuration(todayRecord.breakDuration) : "0h 0m"}
              </div>
              {todayRecord?.breakStartTime && !todayRecord?.breakEndTime && (
                <Badge className="mt-2 bg-yellow-100 text-yellow-800">On Break</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{todayStats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Checked In Today</p>
                <p className="text-3xl font-bold text-gray-900">{todayStats.checkedIn}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Time</p>
                <p className="text-3xl font-bold text-gray-900">{todayStats.onTime}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Hours</p>
                <p className="text-3xl font-bold text-gray-900">{todayStats.avgWorkingHours.toFixed(1)}h</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading attendance records...</div>
          ) : allAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attendance records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Auto Check-out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAttendance
                    .sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20)
                    .map((record: AttendanceRecord) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {getUserName(record.userId)}
                        </TableCell>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {formatTime(record.checkInTime)}
                        </TableCell>
                        <TableCell>
                          {formatTime(record.checkOutTime)}
                        </TableCell>
                        <TableCell>
                          {formatDuration(record.workingHours)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatDuration(record.overtimeHours)}
                          </div>
                          {record.overtimeHours > 0 && (
                            <Badge 
                              className={record.overtimeApproved 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {record.overtimeApproved ? "Approved" : "Pending"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(record.status)}>
                            {record.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.isAutoCheckedOut ? (
                            <Badge className="bg-orange-100 text-orange-800">
                              Auto
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              Manual
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}