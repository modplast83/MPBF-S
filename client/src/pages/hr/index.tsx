import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Trophy, AlertTriangle } from "lucide-react";
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
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t("hr.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage employee attendance, performance, and workplace issues
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hrModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Link key={module.path} href={module.path}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className={`p-2 rounded-lg ${module.color} text-white mr-4`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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