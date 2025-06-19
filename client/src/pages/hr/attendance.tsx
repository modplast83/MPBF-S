import { useState } from "react";
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
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { 
  Clock, 
  UserCheck, 
  LogOut, 
  Coffee, 
  Users,
  Calendar,
  Plus
} from "lucide-react";

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

export default function AttendancePage() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    userId: "",
    date: new Date().toISOString().split('T')[0],
    action: "check_in", // check_in, check_out, break_start, break_end
    time: ""
  });

  // Fetch all attendance records
  const { data: allAttendance = [], isLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ['/api/hr/time-attendance'],
    queryFn: () => apiRequest('GET', '/api/hr/time-attendance')
  });

  // Fetch users for display
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users')
  });

  // Filter attendance by selected date
  const todayAttendance = allAttendance.filter((record: AttendanceRecord) => 
    record.date === selectedDate
  );

  // Manual attendance entry mutation
  const manualAttendanceMutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint = data.action === 'check_in' ? '/api/hr/check-in' :
                      data.action === 'check_out' ? '/api/hr/check-out' :
                      data.action === 'break_start' ? '/api/hr/break-start' :
                      '/api/hr/break-end';
      return apiRequest('POST', endpoint, {
        userId: data.userId,
        latitude: 0, // Manual entry doesn't require location
        longitude: 0,
        manualEntry: true,
        time: data.time
      });
    },
    onSuccess: () => {
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ['/api/hr/time-attendance'] });
      setShowManualEntry(false);
      setManualEntry({
        userId: "",
        date: new Date().toISOString().split('T')[0],
        action: "check_in",
        time: ""
      });
      toast({
        title: "Success",
        description: "Attendance record updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed",
        description: error.message || "Failed to update attendance",
        variant: "destructive"
      });
    }
  });

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown User';
  };

  // Get current status for user
  const getCurrentStatus = (userId: string) => {
    const userAttendance = todayAttendance.find((record: AttendanceRecord) => record.userId === userId);
    if (!userAttendance) return { status: 'Not checked in', color: 'bg-gray-500' };
    
    if (userAttendance.checkOutTime) return { status: 'Checked out', color: 'bg-red-500' };
    if (userAttendance.breakStartTime && !userAttendance.breakEndTime) return { status: 'On break', color: 'bg-yellow-500' };
    if (userAttendance.checkInTime) return { status: 'Checked in', color: 'bg-green-500' };
    
    return { status: 'Not checked in', color: 'bg-gray-500' };
  };

  // Handle manual attendance entry
  const handleManualEntry = () => {
    if (!manualEntry.userId || !manualEntry.date || !manualEntry.time) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    manualAttendanceMutation.mutate(manualEntry);
  };

  // Calculate daily statistics
  const dailyStats = {
    totalEmployees: users.length,
    checkedIn: todayAttendance.filter((r: AttendanceRecord) => 
      r.checkInTime && !r.checkOutTime
    ).length,
    onBreak: todayAttendance.filter((r: AttendanceRecord) => 
      r.breakStartTime && !r.breakEndTime
    ).length,
    checkedOut: todayAttendance.filter((r: AttendanceRecord) => 
      r.checkOutTime
    ).length
  };

  // Format time display
  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get attendance record for user
  const getUserAttendance = (userId: string) => {
    return todayAttendance.find((record: AttendanceRecord) => record.userId === userId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Attendance
          </h1>
          <p className="text-gray-600 mt-2">
            Manage employee attendance and track working hours
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-select" className="text-sm font-medium">
              Date:
            </Label>
            <Input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          
          <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Manual Attendance Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-select">Employee</Label>
                  <Select value={manualEntry.userId} onValueChange={(value) => 
                    setManualEntry(prev => ({ ...prev, userId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getUserName(user.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="action-select">Action</Label>
                  <Select value={manualEntry.action} onValueChange={(value) => 
                    setManualEntry(prev => ({ ...prev, action: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check_in">Check In</SelectItem>
                      <SelectItem value="check_out">Check Out</SelectItem>
                      <SelectItem value="break_start">Break Start</SelectItem>
                      <SelectItem value="break_end">Break End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="time-input">Time</Label>
                  <Input
                    id="time-input"
                    type="time"
                    value={manualEntry.time}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="date-input">Date</Label>
                  <Input
                    id="date-input"
                    type="date"
                    value={manualEntry.date}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleManualEntry} disabled={manualAttendanceMutation.isPending}>
                    {manualAttendanceMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowManualEntry(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Daily Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dailyStats.checkedIn}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
            <Coffee className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dailyStats.onBreak}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
            <LogOut className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dailyStats.checkedOut}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Employee Attendance - {new Date(selectedDate).toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Break Start</TableHead>
                  <TableHead>Break End</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Break Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => {
                  const attendance = getUserAttendance(user.id);
                  const status = getCurrentStatus(user.id);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {getUserName(user.id)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} text-white`}>
                          {status.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTime(attendance?.checkInTime)}</TableCell>
                      <TableCell>{formatTime(attendance?.breakStartTime)}</TableCell>
                      <TableCell>{formatTime(attendance?.breakEndTime)}</TableCell>
                      <TableCell>{formatTime(attendance?.checkOutTime)}</TableCell>
                      <TableCell>
                        {attendance?.workingHours ? `${attendance.workingHours.toFixed(1)}h` : '--'}
                      </TableCell>
                      <TableCell>
                        {attendance?.breakDuration ? `${attendance.breakDuration}min` : '--'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}