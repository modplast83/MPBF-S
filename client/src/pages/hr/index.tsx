import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trophy, AlertTriangle, TrendingUp, ArrowRight, Users, Calendar } from "lucide-react";
import { Link } from "wouter";

interface HRModuleCardProps {
  title: string;
  description: string;
  icon: any;
  path: string;
  color: string;
}

function HRModuleCard({ title, description, icon: IconComponent, path, color }: HRModuleCardProps) {
  const { isRTL } = useLanguage();
  
  return (
    <Link href={path}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-gradient-to-br from-white to-slate-50 border-0 shadow-md h-full">
        <CardHeader className={`${color} text-white p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <CardTitle className={`flex items-center relative z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <span className={`font-bold text-lg ${isRTL ? 'mr-4' : 'ml-4'}`}>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CardDescription className="text-slate-600 text-sm leading-relaxed mb-4">
            {description}
          </CardDescription>
          <div className={`flex justify-end ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 group-hover:bg-slate-800 group-hover:text-white transition-all duration-300"
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>Access</span>
              <ArrowRight className={`h-4 w-4 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HRIndex() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const hrModules = [
    {
      title: t("hr.time_attendance.title"),
      description: t("hr.time_attendance.attendance_summary"),
      icon: Clock,
      path: "/hr/time-attendance",
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: t("hr.employee_of_month.title"),
      description: t("hr.employee_of_month.performance_evaluation"),
      icon: Trophy,
      path: "/hr/employee-of-month",
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600"
    },
    {
      title: t("hr.violations_complaints.title"),
      description: t("hr.violations_complaints.investigation_notes"),
      icon: AlertTriangle,
      path: "/hr/violations-complaints",
      color: "bg-gradient-to-br from-red-500 to-red-600"
    },
    {
      title: "Violation Trends",
      description: "Smart data visualization and analytics for violation patterns",
      icon: TrendingUp,
      path: "/hr/violation-trends",
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className={`min-h-full ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header Section */}
      <div className={`mb-12 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg">
            <Users className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          {t("hr.title")}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Manage employee attendance, performance, and workplace issues with comprehensive HR tools
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