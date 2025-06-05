import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Trophy, 
  TrendingUp, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Coffee,
  Timer,
  Target,
  User,
  Bell,
  Activity,
  FileText,
  BarChart3,
  Settings
} from "lucide-react";
import { formatDistanceToNow, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "@/hooks/use-auth-v2";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserDashboardData {
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role: string;
    sectionId?: string;
    profileImageUrl?: string;
  };
  todayAttendance?: {
    id: number;
    checkInTime?: string;
    checkOutTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
    workingHours: number;
    overtimeHours: number;
    status: string;
    location?: string;
  };
  weeklyStats: {
    totalHours: number;
    daysPresent: number;
    daysLate: number;
    averageCheckIn: string;
  };
  monthlyStats: {
    totalHours: number;
    daysPresent: number;
    daysAbsent: number;
    overtimeHours: number;
  };
  violations: Array<{
    id: number;
    violationType: string;
    severity: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  achievements: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    achievedAt: string;
  }>;
  tasks: Array<{
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate?: string;
  }>;
}

export default function UserDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useIsMobile();

  // Fetch user dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/user-dashboard', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'early_leave': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'bg-yellow-100 text-yellow-800';
      case 'major': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = dashboardData as UserDashboardData;

  return (
    <div className="container mx-auto py-3 sm:py-6 px-4 sm:px-6">
      {/* Header Section */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'} mb-6`}>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Avatar className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'}`}>
            <AvatarImage src={data?.user?.profileImageUrl} />
            <AvatarFallback>
              {data?.user?.firstName?.[0]}{data?.user?.lastName?.[0] || data?.user?.username?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
              {t('user_dashboard.welcome', 'Welcome')}, {data?.user?.firstName || data?.user?.username}!
            </h1>
            <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
              {t('user_dashboard.today_date', 'Today is')} {format(new Date(), isMobile ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <Button variant="outline" size={isMobile ? "sm" : "sm"} className={isMobile ? "self-start" : ""}>
          <Settings className="h-4 w-4 mr-2" />
          {t('user_dashboard.settings', 'Settings')}
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-6'} mb-6`}>
        <Card>
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                  {t('user_dashboard.today_status', 'Today Status')}
                </p>
                <div className={`${isMobile ? 'text-sm mt-1' : 'text-2xl'} font-bold`}>
                  {data?.todayAttendance ? (
                    <Badge className={`${getStatusColor(data.todayAttendance.status)} ${isMobile ? 'text-xs px-2 py-1' : ''}`}>
                      {t(`user_dashboard.status.${data.todayAttendance.status}`, data.todayAttendance.status)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={isMobile ? 'text-xs px-2 py-1' : ''}>{t('user_dashboard.not_checked_in', 'Not Checked In')}</Badge>
                  )}
                </div>
              </div>
              <Clock className={`${isMobile ? 'h-5 w-5 mx-auto' : 'h-8 w-8'} text-blue-500`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                  {t('user_dashboard.hours_today', 'Hours Today')}
                </p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                  {data?.todayAttendance?.workingHours?.toFixed(1) || '0.0'}h
                </p>
              </div>
              <Timer className={`${isMobile ? 'h-5 w-5 mx-auto' : 'h-8 w-8'} text-green-500`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                  {t('user_dashboard.this_week', 'This Week')}
                </p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                  {data?.weeklyStats?.totalHours?.toFixed(1) || '0.0'}h
                </p>
              </div>
              <BarChart3 className={`${isMobile ? 'h-5 w-5 mx-auto' : 'h-8 w-8'} text-purple-500`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                  {t('user_dashboard.violations', 'Violations')}
                </p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                  {data?.violations?.filter(v => v.status === 'open').length || 0}
                </p>
              </div>
              <AlertTriangle className={`${isMobile ? 'h-5 w-5 mx-auto' : 'h-8 w-8'} text-red-500`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 h-auto' : 'grid-cols-4'}`}>
          <TabsTrigger value="overview" className={isMobile ? 'text-xs py-2' : ''}>
            {isMobile ? t('user_dashboard.overview_short', 'Overview') : t('user_dashboard.overview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="attendance" className={isMobile ? 'text-xs py-2' : ''}>
            {isMobile ? t('user_dashboard.attendance_short', 'Attend.') : t('user_dashboard.attendance', 'Attendance')}
          </TabsTrigger>
          <TabsTrigger value="violations" className={isMobile ? 'text-xs py-2' : ''}>
            {isMobile ? t('user_dashboard.violations_short', 'Issues') : t('user_dashboard.violations', 'Violations')}
          </TabsTrigger>
          <TabsTrigger value="tasks" className={isMobile ? 'text-xs py-2' : ''}>
            {isMobile ? t('user_dashboard.tasks_short', 'Tasks') : t('user_dashboard.tasks', 'Tasks')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {t('user_dashboard.todays_schedule', "Today's Schedule")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.todayAttendance ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('user_dashboard.check_in', 'Check In')}</span>
                      <span className="font-medium">
                        {data.todayAttendance.checkInTime 
                          ? format(new Date(data.todayAttendance.checkInTime), 'HH:mm')
                          : t('user_dashboard.not_checked_in', 'Not Checked In')
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('user_dashboard.check_out', 'Check Out')}</span>
                      <span className="font-medium">
                        {data.todayAttendance.checkOutTime 
                          ? format(new Date(data.todayAttendance.checkOutTime), 'HH:mm')
                          : t('user_dashboard.still_working', 'Still Working')
                        }
                      </span>
                    </div>
                    {data.todayAttendance.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t('user_dashboard.location', 'Location')}</span>
                        <span className="font-medium flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {data.todayAttendance.location}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    {t('user_dashboard.no_attendance_today', 'No attendance record for today')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Weekly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  {t('user_dashboard.weekly_performance', 'Weekly Performance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('user_dashboard.attendance_rate', 'Attendance Rate')}</span>
                      <span>{((data?.weeklyStats?.daysPresent || 0) / 5 * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(data?.weeklyStats?.daysPresent || 0) / 5 * 100} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t('user_dashboard.days_present', 'Days Present')}</span>
                      <p className="font-semibold">{data?.weeklyStats?.daysPresent || 0}/5</p>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('user_dashboard.days_late', 'Days Late')}</span>
                      <p className="font-semibold">{data?.weeklyStats?.daysLate || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                {t('user_dashboard.recent_activities', 'Recent Activities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.violations?.slice(0, 3).map((violation) => (
                  <div key={violation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">{violation.title}</p>
                        <p className="text-xs text-gray-600">{formatDistanceToNow(new Date(violation.createdAt))} ago</p>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(violation.severity)}>
                      {violation.severity}
                    </Badge>
                  </div>
                ))}
                {(!data?.violations || data.violations.length === 0) && (
                  <p className="text-center text-gray-500 py-4">
                    {t('user_dashboard.no_recent_activities', 'No recent activities')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('user_dashboard.monthly_summary', 'Monthly Summary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{data?.monthlyStats?.daysPresent || 0}</p>
                  <p className="text-sm text-gray-600">{t('user_dashboard.days_present', 'Days Present')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{data?.monthlyStats?.daysAbsent || 0}</p>
                  <p className="text-sm text-gray-600">{t('user_dashboard.days_absent', 'Days Absent')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{data?.monthlyStats?.totalHours?.toFixed(1) || '0.0'}h</p>
                  <p className="text-sm text-gray-600">{t('user_dashboard.total_hours', 'Total Hours')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{data?.monthlyStats?.overtimeHours?.toFixed(1) || '0.0'}h</p>
                  <p className="text-sm text-gray-600">{t('user_dashboard.overtime_hours', 'Overtime Hours')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('user_dashboard.violations_penalties', 'Violations & Penalties')}</CardTitle>
              <CardDescription>
                {t('user_dashboard.violations_desc', 'Review your violations and their current status')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.violations?.map((violation) => (
                  <div key={violation.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{violation.title}</h3>
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                          <Badge variant={violation.status === 'resolved' ? 'default' : 'secondary'}>
                            {violation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                        <p className="text-xs text-gray-500">
                          {t('user_dashboard.reported_on', 'Reported on')} {format(new Date(violation.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium capitalize">{violation.violationType}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!data?.violations || data.violations.length === 0) && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">{t('user_dashboard.no_violations', 'No violations on record')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('user_dashboard.my_tasks', 'My Tasks')}</CardTitle>
              <CardDescription>
                {t('user_dashboard.tasks_desc', 'Track your assigned tasks and deadlines')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.tasks?.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-500">
                            {t('user_dashboard.due_date', 'Due:')} {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!data?.tasks || data.tasks.length === 0) && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('user_dashboard.no_tasks', 'No tasks assigned')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}