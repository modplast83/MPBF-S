import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Trophy, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function HRIndex() {
  const { t } = useTranslation();

  const hrModules = [
    {
      title: t("hr.time_attendance.title"),
      description: t("hr.time_attendance.attendance_summary"),
      icon: Clock,
      path: "/hr/time-attendance",
      color: "bg-blue-500"
    },
    {
      title: t("hr.employee_of_month.title"),
      description: t("hr.employee_of_month.performance_evaluation"),
      icon: Trophy,
      path: "/hr/employee-of-month",
      color: "bg-yellow-500"
    },
    {
      title: t("hr.violations_complaints.title"),
      description: t("hr.violations_complaints.investigation_notes"),
      icon: AlertTriangle,
      path: "/hr/violations-complaints",
      color: "bg-red-500"
    },
    {
      title: "Violation Trends",
      description: "Smart data visualization and analytics for violation patterns",
      icon: TrendingUp,
      path: "/hr/violation-trends",
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t("hr.title")}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Manage employee attendance, performance, and workplace issues
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {hrModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Link key={module.path} href={module.path}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full">
                <CardHeader className="flex flex-row items-center space-y-0 pb-3 sm:pb-2">
                  <div className={`p-2 sm:p-3 rounded-lg ${module.color} text-white mr-3 sm:mr-4 flex-shrink-0`}>
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-lg font-semibold truncate">{module.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm line-clamp-2 mt-1">
                      {module.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 sm:pt-2">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Click to access {module.title.toLowerCase()} management
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}