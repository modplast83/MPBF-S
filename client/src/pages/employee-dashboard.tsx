import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  MapPin,
  Target,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

export default function EmployeeDashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  // Fetch user data
  const { data: user } = useQuery<any>({
    queryKey: ['/api/user'],
  });

  const currentDate = new Date();
  const formattedDate = format(currentDate, isMobile ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy');

  return (
    <div className="container mx-auto py-3 sm:py-6 px-4 sm:px-6">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'} mb-6`}>
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>
            {t('user_dashboard.welcome', 'Welcome')}, {user?.firstName || user?.username}
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
            {t('user_dashboard.today_date', 'Today is')} {formattedDate}
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation('/setup/users')} size={isMobile ? "sm" : "default"} className={isMobile ? "self-start" : ""}>
          <Settings className="h-4 w-4 mr-2" />
          {t('user_dashboard.settings', 'Settings')}
        </Button>
      </div>
      {/* Quick Status Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-6'} mb-6`}>
        <Card>
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between pt-[0px] pb-[0px] pl-[2px] pr-[2px] ml-[-19px] mr-[-19px]">
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                  {t('user_dashboard.today_status', 'Today\'s Status')}
                </p>
                <p className="font-bold text-green-600 text-[15px]">
                  {t('user_dashboard.not_checked_in', 'Not Checked In')}
                </p>
              </div>
              <Clock className={`${isMobile ? 'h-5 w-5 mx-auto' : 'h-8 w-8'} text-blue-500`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between ml-[-14px] mr-[-14px] pl-[0px] pr-[0px]">
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                  {t('user_dashboard.hours_today', 'Hours Today')}
                </p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>0.0</p>
              </div>
              <TrendingUp className={`${isMobile ? 'h-5 w-5 mx-auto' : 'h-8 w-8'} text-green-500`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between ml-[-6px] mr-[-6px]">
              <div className={isMobile ? 'text-center' : ''}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                  {t('user_dashboard.this_week', 'This Week')}
                </p>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>0.0h</p>
              </div>
              <Calendar className={`${isMobile ? 'h-5 w-5 mx-auto' : 'h-8 w-8'} text-purple-500`} />
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
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-600`}>0</p>
              </div>
              <AlertTriangle className={`${isMobile ? 'h-5 w-5 mx-auto' : 'h-8 w-8'} text-red-500`} />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 h-auto' : 'grid-cols-4'}`}>
          <TabsTrigger value="overview" className={isMobile ? 'text-xs py-2' : ''}>
            {isMobile ? t('user_dashboard.overview_short', 'Overview') : t('user_dashboard.overview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="attendance" className={isMobile ? 'text-xs py-2' : ''}>
            {isMobile ? t('user_dashboard.attendance_short', 'Attend.') : t('user_dashboard.attendance', 'Attendance')}
          </TabsTrigger>
          <TabsTrigger value="tasks" className={isMobile ? 'text-xs py-2' : ''}>
            {isMobile ? t('user_dashboard.tasks_short', 'Tasks') : t('user_dashboard.tasks', 'Tasks')}
          </TabsTrigger>
          <TabsTrigger value="schedule" className={isMobile ? 'text-xs py-2' : ''}>
            {isMobile ? t('user_dashboard.schedule_short', 'Schedule') : t('user_dashboard.todays_schedule', 'Today\'s Schedule')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className={`space-y-${isMobile ? '4' : '6'}`}>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
            {/* Today's Attendance */}
            <Card>
              <CardHeader className={isMobile ? 'pb-3' : ''}>
                <CardTitle className={`flex items-center ${isMobile ? 'text-base' : ''}`}>
                  <Clock className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
                  {t('user_dashboard.attendance', 'Attendance')}
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? 'pt-0' : ''}>
                <div className={`space-y-${isMobile ? '3' : '4'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Check In</span>
                    <Button variant="outline" size={isMobile ? "xs" : "sm"}>
                      {t('user_dashboard.check_in', 'Check In')}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Check Out</span>
                    <Button variant="outline" size={isMobile ? "xs" : "sm"} disabled>
                      {t('user_dashboard.check_out', 'Check Out')}
                    </Button>
                  </div>
                  <div className={`pt-${isMobile ? '3' : '4'} border-t`}>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
                      {t('user_dashboard.location', 'Location')}
                    </p>
                    <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      <MapPin className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
                      Factory Floor - Section A
                    </div>
                  </div>
                </div>
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {t('user_dashboard.attendance_rate', 'Attendance Rate')}
                    </span>
                    <Badge variant="secondary">100%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {t('user_dashboard.days_present', 'Days Present')}
                    </span>
                    <span className="text-sm font-medium">5/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {t('user_dashboard.days_late', 'Days Late')}
                    </span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>{t('user_dashboard.recent_activities', 'Recent Activities')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                {t('user_dashboard.no_recent_activities', 'No recent activities')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('user_dashboard.monthly_summary', 'Monthly Summary')}</CardTitle>
              <CardDescription>Your attendance record for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">22</p>
                  <p className="text-sm text-gray-600">{t('user_dashboard.days_present', 'Days Present')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">0</p>
                  <p className="text-sm text-gray-600">{t('user_dashboard.days_absent', 'Days Absent')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">176</p>
                  <p className="text-sm text-gray-600">{t('user_dashboard.total_hours', 'Total Hours')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">8</p>
                  <p className="text-sm text-gray-600">{t('user_dashboard.overtime_hours', 'Overtime Hours')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No tasks assigned for today
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {t('user_dashboard.todays_schedule', 'Today\'s Schedule')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Morning Shift</p>
                    <p className="text-sm text-gray-600">8:00 AM - 4:00 PM</p>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}