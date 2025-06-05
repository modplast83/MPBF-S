import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { ModuleCard } from "@/components/ui/module-card";
import { 
  Database, 
  Shield, 
  FileText, 
  MessageSquare,
  Server,
  Settings,
  Lock,
  HardDrive
} from "lucide-react";

export default function SystemIndex() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const systemModules = [
    {
      title: "Database",
      description: "Database management and maintenance tools",
      icon: Database,
      path: "/system/database",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Permissions",
      description: "User roles and access control management",
      icon: Shield,
      path: "/system/permissions",
      color: "bg-gradient-to-br from-red-500 to-red-600",
    },
    {
      title: "Import & Export",
      description: "Data import and export operations",
      icon: FileText,
      path: "/system/import-export",
      color: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      title: "SMS Management",
      description: "SMS notifications and messaging system",
      icon: MessageSquare,
      path: "/system/sms",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Server Management",
      description: "Server monitoring and system administration",
      icon: Server,
      path: "/system/server",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
    }
  ];

  return (
    <div className={`min-h-full ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header Section */}
      <div className={`mb-12 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg">
            <Settings className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          System Management
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Configure and maintain system settings, security, and administrative functions
        </p>
      </div>
      
      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {systemModules.map((module) => (
          <ModuleCard
            key={module.path}
            title={module.title}
            description={module.description}
            icon={module.icon}
            path={module.path}
            color={module.color}
            action="Configure"
          />
        ))}
      </div>
      
      {/* System Stats */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <Lock className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Security</h3>
          <p className="text-slate-600 text-sm">Access control and permissions</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <HardDrive className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Storage</h3>
          <p className="text-slate-600 text-sm">Database and file management</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <MessageSquare className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Communication</h3>
          <p className="text-slate-600 text-sm">SMS and notification systems</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <Server className="h-8 w-8 text-purple-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Performance</h3>
          <p className="text-slate-600 text-sm">System monitoring and optimization</p>
        </div>
      </div>
    </div>
  );
}