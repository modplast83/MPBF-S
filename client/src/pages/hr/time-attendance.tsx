import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin, Coffee, LogOut, Calendar, Users, UserCheck, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { QuickActions } from "@/components/ui/quick-actions";
import type { TimeAttendance } from "@shared/schema";

export default function TimeAttendancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get attendance records
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.TIME_ATTENDANCE, selectedDate],
    queryFn: () => apiRequest('GET', `${API_ENDPOINTS.TIME_ATTENDANCE}/date/${selectedDate}`)
  });

  // Get user's today attendance
  const { data: todayAttendance } = useQuery({
    queryKey: [API_ENDPOINTS.TIME_ATTENDANCE, 'user', user?.id, selectedDate],
    queryFn: () => apiRequest('GET', `${API_ENDPOINTS.TIME_ATTENDANCE}/user/${user?.id}`),
    enabled: !!user?.id
  });

  // Get all users for name lookup
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users')
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', API_ENDPOINTS.TIME_ATTENDANCE, data),
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
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest('PUT', `${API_ENDPOINTS.TIME_ATTENDANCE}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.TIME_ATTENDANCE] });
      toast({
        title: t("hr.common.success"),
        description: "Check-out recorded successfully"
      });
    }
  });

  // Break mutations
  const breakStartMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest('PUT', `${API_ENDPOINTS.TIME_ATTENDANCE}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.TIME_ATTENDANCE] });
      toast({
        title: t("hr.common.success"),
        description: "Break started successfully"
      });
    }
  });

  const breakEndMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest('PUT', `${API_ENDPOINTS.TIME_ATTENDANCE}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.TIME_ATTENDANCE] });
      toast({
        title: t("hr.common.success"),
        description: "Break ended successfully"
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
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          checkOutMutation.mutate({
            id: attendance.id,
            data: {
              checkOutTime: checkOutTime.toISOString(),
              workingHours: Math.round(workingHours * 100) / 100,
              overtimeHours: workingHours > 8 ? Math.round((workingHours - 8) * 100) / 100 : 0,
              location: attendance.location + ` | Out: ${location}`
            }
          });
        });
      } else {
        checkOutMutation.mutate({
          id: attendance.id,
          data: {
            checkOutTime: checkOutTime.toISOString(),
            workingHours: Math.round(workingHours * 100) / 100,
            overtimeHours: workingHours > 8 ? Math.round((workingHours - 8) * 100) / 100 : 0
          }
        });
      }
    }
  };

  const handleBreakStart = () => {
    if (todayAttendance?.[0]) {
      const attendance = todayAttendance[0];
      const breakStartTime = new Date();
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          breakStartMutation.mutate({
            id: attendance.id,
            data: {
              breakStartTime: breakStartTime.toISOString(),
              location: attendance.location + ` | Break Start: ${location}`
            }
          });
        });
      } else {
        breakStartMutation.mutate({
          id: attendance.id,
          data: {
            breakStartTime: breakStartTime.toISOString()
          }
        });
      }
    }
  };

  const handleBreakEnd = () => {
    if (todayAttendance?.[0]) {
      const attendance = todayAttendance[0];
      const breakEndTime = new Date();
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          breakEndMutation.mutate({
            id: attendance.id,
            data: {
              breakEndTime: breakEndTime.toISOString(),
              location: attendance.location + ` | Break End: ${location}`
            }
          });
        });
      } else {
        breakEndMutation.mutate({
          id: attendance.id,
          data: {
            breakEndTime: breakEndTime.toISOString()
          }
        });
      }
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

  const getUserFirstName = (userId: string) => {
    const user = users?.find((u: any) => u.id === userId);
    return user?.firstName || userId;
  };

  const currentAttendance = todayAttendance?.find((att: TimeAttendance) => 
    format(new Date(att.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const quickActions = [
    {
      id: "check-in",
      label: "Check In",
      icon: UserCheck,
      onClick: handleCheckIn,
      variant: currentAttendance?.checkInTime ? "outline" : "default"
    },
    {
      id: "check-out",
      label: "Check Out",
      icon: LogOut,
      onClick: handleCheckOut,
      variant: currentAttendance?.checkOutTime ? "outline" : "default"
    },
    {
      id: "break",
      label: currentAttendance?.breakEndTime ? "End Break" : "Start Break",
      icon: Coffee,
      onClick: currentAttendance?.breakEndTime ? handleBreakEnd : handleBreakStart,
      variant: "outline"
    },
    {
      id: "refresh",
      label: "Refresh",
      icon: RefreshCw,
      onClick: () => {
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.TIME_ATTENDANCE] });
      },
      variant: "outline"
    }
  ];

  return (
    <div className={`container mx-auto ${isMobile ? "p-3" : "p-6"}`}>
      <QuickActions
        title="Time Tracking"
        actions={quickActions}
        columns={2}
      />

      <div className={isMobile ? "mb-4" : "mb-8"}>
        <h1 className={`font-bold text-gray-900 dark:text-gray-100 ${isMobile ? "text-xl" : "text-3xl"}`}>
          {t("hr.time_attendance.title")}
        </h1>
        <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? "mt-1 text-sm" : "mt-2"}`}>
          {t("hr.time_attendance.attendance_summary")}
        </p>
      </div>

      {/* Quick Actions */}
      <div className={`grid gap-3 ${isMobile ? "grid-cols-2 mb-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-4 mb-8"}`}>
        <Card className={isMobile ? "col-span-1" : ""}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? "pb-1 px-3 pt-3" : "pb-2"}`}>
            <CardTitle className={`font-medium truncate ${isMobile ? "text-xs" : "text-xs sm:text-sm"}`}>
              {isMobile ? "Check In" : t("hr.time_attendance.check_in")}
            </CardTitle>
            <Clock className={`text-muted-foreground flex-shrink-0 ${isMobile ? "h-3 w-3" : "h-3 w-3 sm:h-4 sm:w-4"}`} />
          </CardHeader>
          <CardContent className={isMobile ? "pt-1 px-3 pb-3" : "pt-2"}>
            <Button 
              onClick={handleCheckIn}
              disabled={!!currentAttendance?.checkInTime || checkInMutation.isPending}
              className={`w-full ${isMobile ? "text-xs h-8" : "text-xs sm:text-sm h-8 sm:h-9"}`}
              size="sm"
            >
              {currentAttendance?.checkInTime ? 
                format(new Date(currentAttendance.checkInTime), 'HH:mm') : 
                <span className="truncate">{isMobile ? "In" : "Check In"}</span>
              }
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">
              {t("hr.time_attendance.check_out")}
            </CardTitle>
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <Button 
              onClick={handleCheckOut}
              disabled={!currentAttendance?.checkInTime || !!currentAttendance?.checkOutTime || checkOutMutation.isPending}
              variant="outline"
              className="w-full text-xs sm:text-sm h-8 sm:h-9"
              size="sm"
            >
              {currentAttendance?.checkOutTime ? 
                format(new Date(currentAttendance.checkOutTime), 'HH:mm') : 
                <span className="truncate">Check Out</span>
              }
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">
              Hours
            </CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-2xl font-bold">
              {currentAttendance?.workingHours?.toFixed(1) || '0.0'}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">
              Break Out
            </CardTitle>
            <Coffee className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <Button 
              onClick={handleBreakStart}
              disabled={!currentAttendance?.checkInTime || !!currentAttendance?.checkOutTime || !!currentAttendance?.breakStartTime || breakStartMutation.isPending}
              variant="secondary"
              className="w-full text-xs sm:text-sm h-8 sm:h-9"
              size="sm"
            >
              {currentAttendance?.breakStartTime ? 
                format(new Date(currentAttendance.breakStartTime), 'HH:mm') : 
                <span className="truncate">Break Out</span>
              }
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">
              Break In
            </CardTitle>
            <Coffee className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-2">
            <Button 
              onClick={handleBreakEnd}
              disabled={!currentAttendance?.breakStartTime || !!currentAttendance?.breakEndTime || !!currentAttendance?.checkOutTime || breakEndMutation.isPending}
              variant="secondary"
              className="w-full text-xs sm:text-sm h-8 sm:h-9"
              size="sm"
            >
              {currentAttendance?.breakEndTime ? 
                format(new Date(currentAttendance.breakEndTime), 'HH:mm') : 
                <span className="truncate">Break In</span>
              }
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto text-sm"
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
            <>
              {/* Mobile Card Layout */}
              <div className="block lg:hidden space-y-4">
                {attendanceRecords?.map((record: TimeAttendance) => (
                  <Card key={record.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">{getUserFirstName(record.userId)}</h3>
                      <Badge className={getStatusBadge(record.status)}>
                        {t(`hr.time_attendance.${record.status}`)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Check In:</span>
                          <span className="font-medium">
                            {record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm') : '-'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <LogOut className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Check Out:</span>
                          <span className="font-medium">
                            {record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm') : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Hours:</span>
                          <span className="font-medium">{record.workingHours?.toFixed(1) || '0.0'}h</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Overtime:</span>
                          <span className="font-medium">{record.overtimeHours?.toFixed(1) || '0.0'}h</span>
                        </div>
                      </div>
                    </div>
                    {record.location && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">{record.location}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
                {(!attendanceRecords || attendanceRecords.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("hr.common.no_data")}
                  </div>
                )}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden lg:block">
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
                        <TableCell className="font-medium">{getUserFirstName(record.userId)}</TableCell>
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
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}