import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "react-i18next";
import { 
  Wrench, 
  ClipboardList, 
  Calendar, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from "lucide-react";

export default function MaintenancePage() {
  const { t } = useTranslation();

  const maintenanceModules = [
    {
      title: t("maintenance.requests.title"),
      description: t("maintenance.requests.description"),
      path: "/maintenance/requests",
      icon: ClipboardList,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: t("maintenance.actions.title"),
      description: t("maintenance.actions.description"),
      path: "/maintenance/actions",
      icon: Wrench,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: t("maintenance.schedule.title"),
      description: t("maintenance.schedule.description"),
      path: "/maintenance/schedule",
      icon: Calendar,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: t("maintenance.dashboard.title"),
      description: t("maintenance.dashboard.description"),
      path: "/maintenance/dashboard",
      icon: BarChart3,
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader
        title={t("maintenance.title")}
        description={t("maintenance.description")}
      />

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {maintenanceModules.map((module, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${module.color} text-white`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {module.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href={module.path}>
                <Button className="w-full">
                  Access {module.title}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>{t("maintenance.features.title", "Maintenance Module Features")}</CardTitle>
          <CardDescription>
            {t("maintenance.features.description", "Comprehensive maintenance management capabilities")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <ClipboardList className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">{t("maintenance.features.requestManagement")}</h4>
                <p className="text-sm text-gray-600">
                  {t("maintenance.features.requestManagementDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Wrench className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-medium">{t("maintenance.features.actionTracking")}</h4>
                <p className="text-sm text-gray-600">
                  {t("maintenance.features.actionTrackingDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium">{t("maintenance.features.preventiveScheduling")}</h4>
                <p className="text-sm text-gray-600">
                  {t("maintenance.features.preventiveSchedulingDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <BarChart3 className="h-5 w-5 text-orange-500 mt-1" />
              <div>
                <h4 className="font-medium">{t("maintenance.features.analytics")}</h4>
                <p className="text-sm text-gray-600">
                  {t("maintenance.features.analyticsDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
              <div>
                <h4 className="font-medium">{t("maintenance.features.priorityManagement")}</h4>
                <p className="text-sm text-gray-600">
                  {t("maintenance.features.priorityManagementDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-gray-500 mt-1" />
              <div>
                <h4 className="font-medium">{t("maintenance.features.integration")}</h4>
                <p className="text-sm text-gray-600">
                  {t("maintenance.features.integrationDesc")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}