import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
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
  Target
} from "lucide-react";
import { format } from "date-fns";

export default function EmployeeDashboard() {
  const { t } = useTranslation();

  // Fetch user data
  const { data: user } = useQuery<any>({
    queryKey: ['/api/user'],
  });

  const currentDate = new Date();
  const formattedDate = format(currentDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {t('user_dashboard.welcome', 'Welcome')}, {user?.firstName || user?.username}
          </h1>
          <p className="text-gray-600">
            {t('user_dashboard.today_date', 'Today is')} {formattedDate}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/setup/users'}>
          {t('user_dashboard.settings', 'Settings')}
        </Button>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('user_dashboard.today_status', 'Today\'s Status')}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {t('user_dashboard.not_checked_in', 'Not Checked In')}
                </p>
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
                  {t('user_dashboard.hours_today', 'Hours Today')}
                </p>
                <p className="text-2xl font-bold">0.0</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('user_dashboard.this_week', 'This Week')}
                </p>
                <p className="text-2xl font-bold">0.0h</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('user_dashboard.violations', 'Violations')}
                </p>
                <p className="text-2xl font-bold text-red-600">0</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('user_dashboard.overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="attendance">{t('user_dashboard.attendance', 'Attendance')}</TabsTrigger>
          <TabsTrigger value="tasks">{t('user_dashboard.tasks', 'Tasks')}</TabsTrigger>
          <TabsTrigger value="schedule">{t('user_dashboard.todays_schedule', 'Today\'s Schedule')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {t('user_dashboard.attendance', 'Attendance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Check In</span>
                    <Button variant="outline" size="sm">
                      {t('user_dashboard.check_in', 'Check In')}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Check Out</span>
                    <Button variant="outline" size="sm" disabled>
                      {t('user_dashboard.check_out', 'Check Out')}
                    </Button>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">
                      {t('user_dashboard.location', 'Location')}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
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