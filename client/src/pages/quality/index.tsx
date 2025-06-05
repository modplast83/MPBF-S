import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { ModuleCard } from "@/components/ui/module-card";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  ClipboardCheck,
  FileText,
  Settings,
  BarChart3
} from "lucide-react";

export default function QualityIndex() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const qualityModules = [
    {
      title: "Check Types",
      description: "Define and manage quality check procedures",
      icon: Settings,
      path: "/quality/check-types",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Quality Checks",
      description: "Perform and track quality inspections",
      icon: CheckCircle,
      path: "/quality/checks",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      count: 15
    },
    {
      title: "Corrective Actions",
      description: "Manage quality issues and improvements",
      icon: AlertTriangle,
      path: "/quality/corrective-actions",
      color: "bg-gradient-to-br from-red-500 to-red-600",
    },
    {
      title: "Unified Dashboard",
      description: "Comprehensive quality overview and metrics",
      icon: BarChart3,
      path: "/quality/unified-dashboard",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Reports",
      description: "Quality performance reports and analytics",
      icon: FileText,
      path: "/quality/reports",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    },
    {
      title: "Violations & Complaints",
      description: "Track quality violations and customer complaints",
      icon: ClipboardCheck,
      path: "/quality/violations",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
    }
  ];

  return (
    <div className={`min-h-full ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header Section */}
      <div className={`mb-12 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          Quality Management
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Ensure product quality through comprehensive testing and continuous improvement
        </p>
      </div>
      
      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {qualityModules.map((module) => (
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
      
      {/* Quality Stats */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Compliance</h3>
          <p className="text-slate-600 text-sm">Quality standards adherence</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Trends</h3>
          <p className="text-slate-600 text-sm">Quality improvement tracking</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Issues</h3>
          <p className="text-slate-600 text-sm">Active quality concerns</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <FileText className="h-8 w-8 text-purple-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Reports</h3>
          <p className="text-slate-600 text-sm">Detailed quality analytics</p>
        </div>
      </div>
    </div>
  );
}