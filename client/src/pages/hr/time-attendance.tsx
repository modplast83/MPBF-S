import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin, Coffee, LogOut, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth-v2";
import { useToast } from "@/hooks/use-toast";
import type { TimeAttendance } from "@shared/schema";

export default function TimeAttendancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get attendance records
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.TIME_ATTENDANCE, selectedDate],
    queryFn: () => apiRequest(`${API_ENDPOINTS.TIME_ATTENDANCE}/date/${selectedDate}`)
  });

  // Get user's today attendance
  const { data: todayAttendance } = useQuery({
    queryKey: [API_ENDPOINTS.TIME_ATTENDANCE, 'user', user?.id, selectedDate],
    queryFn: () => apiRequest(`${API_ENDPOINTS.TIME_ATTENDANCE}/user/${user?.id}`),
    enabled: !!user?.id
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data: any) => apiRequest(API_ENDPOINTS.TIME_ATTENDANCE, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.TIME_ATTENDANCE] });
      toast({
        title: t("hr.common.success"),
        description: "Check-in recorded successfully"
      });
    }
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest(`${API_ENDPOINTS.TIME_ATTENDANCE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.TIME_ATTENDANCE] });
      toast({
        title: t("hr.common.success"),
        description: "Check-out recorded successfully"
      });
    }
  });

  const handleCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const location = `${position.coords.latitude},${position.coords.longitude}`;
        checkInMutation.mutate({
          userId: user?.id,
          date: new Date(),
          checkInTime: new Date(),
          location,
          status: 'present'
        });
      });
    } else {
      checkInMutation.mutate({
        userId: user?.id,
        date: new Date(),
        checkInTime: new Date(),
        status: 'present'
      });
    }
  };

  const handleCheckOut = () => {
    if (todayAttendance?.[0]) {
      const attendance = todayAttendance[0];
      const checkOutTime = new Date();
      const checkInTime = new Date(attendance.checkInTime);
      const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      
      checkOutMutation.mutate({
        id: attendance.id,
        data: {
          checkOutTime,
          workingHours: workingHours,
          overtimeHours: workingHours > 8 ? workingHours - 8 : 0
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-yellow-100 text-yellow-800",
      early_leave: "bg-orange-100 text-orange-800"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const currentAttendance = todayAttendance?.find((att: TimeAttendance) => 
    format(new Date(att.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t("hr.time_attendance.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t("hr.time_attendance.attendance_summary")}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("hr.time_attendance.check_in")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCheckIn}
              disabled={!!currentAttendance?.checkInTime || checkInMutation.isPending}
              className="w-full"
            >
              {currentAttendance?.checkInTime ? 
                format(new Date(currentAttendance.checkInTime), 'HH:mm') : 
                t("hr.time_attendance.check_in")
              }
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("hr.time_attendance.check_out")}
            </CardTitle>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCheckOut}
              disabled={!currentAttendance?.checkInTime || !!currentAttendance?.checkOutTime || checkOutMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {currentAttendance?.checkOutTime ? 
                format(new Date(currentAttendance.checkOutTime), 'HH:mm') : 
                t("hr.time_attendance.check_out")
              }
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("hr.time_attendance.working_hours")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentAttendance?.workingHours?.toFixed(1) || '0.0'}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("hr.time_attendance.overtime_hours")}
            </CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentAttendance?.overtimeHours?.toFixed(1) || '0.0'}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{t("hr.time_attendance.daily_attendance")}</span>
          </CardTitle>
          <CardDescription>
            Attendance records for {format(new Date(selectedDate), 'MMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">{t("hr.common.loading")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("hr.common.employee")}</TableHead>
                  <TableHead>{t("hr.time_attendance.check_in_time")}</TableHead>
                  <TableHead>{t("hr.time_attendance.check_out_time")}</TableHead>
                  <TableHead>{t("hr.time_attendance.working_hours")}</TableHead>
                  <TableHead>{t("hr.time_attendance.overtime_hours")}</TableHead>
                  <TableHead>{t("hr.common.location")}</TableHead>
                  <TableHead>{t("hr.common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords?.map((record: TimeAttendance) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.userId}</TableCell>
                    <TableCell>
                      {record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      {record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell>{record.workingHours?.toFixed(1) || '0.0'}h</TableCell>
                    <TableCell>{record.overtimeHours?.toFixed(1) || '0.0'}h</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{record.location || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(record.status)}>
                        {t(`hr.time_attendance.${record.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!attendanceRecords || attendanceRecords.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      {t("hr.common.no_data")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}