import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { ModuleCard } from "@/components/ui/module-card";
import { 
  Factory, 
  Workflow, 
  Blend, 
  AlertTriangle, 
  BarChart3, 
  Wifi,
  TrendingUp,
  Settings
} from "lucide-react";

export default function ProductionIndex() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const productionModules = [
    {
      title: t("production.orders.title"),
      description: t("production.orders.description"),
      icon: Factory,
      path: "/orders",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      count: 24
    },
    {
      title: t("job_orders.title"),
      description: t("job_orders.description", "Manage job orders for production scheduling and tracking"),
      icon: Factory,
      path: "/production/job-orders",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    },
    {
      title: t("production.workflow.title"),
      description: t("production.workflow.description"),
      icon: Workflow,
      path: "/workflow",
      color: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      title: t("production.mix_materials.title"),
      description: t("production.mix_materials.description"),
      icon: Blend,
      path: "/production/mix-materials",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "JO Mix",
      description: "Create ABA mixing for job orders using predefined formulas",
      icon: Settings,
      path: "/production/jo-mix",
      color: "bg-gradient-to-br from-teal-500 to-teal-600",
    },
    {
      title: t("production.bottleneck_monitor.title"),
      description: t("production.bottleneck_monitor.description"),
      icon: AlertTriangle,
      path: "/production/bottleneck-dashboard",
      color: "bg-gradient-to-br from-red-500 to-red-600",
    },
    {
      title: t("production.metrics.title"),
      description: t("production.metrics.description"),
      icon: BarChart3,
      path: "/production/metrics-input",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    },
    {
      title: t("production.iot_monitor.title"),
      description: t("production.iot_monitor.description"),
      icon: Wifi,
      path: "/production/iot-monitor",
      color: "bg-gradient-to-br from-teal-500 to-teal-600",
    }
  ];

  return (
    <div className={`min-h-full ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header Section */}
      <div className={`mb-12 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg">
            <Factory className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          {t('production.title')}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t('production.description')}
        </p>
      </div>
      
      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {productionModules.map((module) => (
          <ModuleCard
            key={module.path}
            title={module.title}
            description={module.description}
            icon={module.icon}
            path={module.path}
            color={module.color}
            count={module.count}
          />
        ))}
      </div>
      
      {/* Production Stats */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Efficiency</h3>
          <p className="text-slate-600 text-sm">Real-time production efficiency tracking</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Alerts</h3>
          <p className="text-slate-600 text-sm">Automated bottleneck detection</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Analytics</h3>
          <p className="text-slate-600 text-sm">Comprehensive performance metrics</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <Settings className="h-8 w-8 text-purple-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Control</h3>
          <p className="text-slate-600 text-sm">Advanced process control systems</p>
        </div>
      </div>
    </div>
  );
}