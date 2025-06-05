import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { ModuleCard } from "@/components/ui/module-card";
import { 
  Package, 
  Warehouse, 
  ShoppingCart, 
  TrendingUp,
  Boxes,
  FileText,
  BarChart3
} from "lucide-react";

export default function WarehouseIndex() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const warehouseModules = [
    {
      title: "Raw Materials",
      description: "Manage inventory of raw materials and supplies",
      icon: Boxes,
      path: "/warehouse/raw-materials",
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      count: 45
    },
    {
      title: "Final Products",
      description: "Track finished goods and product inventory",
      icon: Package,
      path: "/warehouse/final-products",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      count: 128
    }
  ];

  return (
    <div className={`min-h-full ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header Section */}
      <div className={`mb-12 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg">
            <Warehouse className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          Warehouse Management
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Complete inventory control for raw materials and finished products
        </p>
      </div>
      
      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
        {warehouseModules.map((module) => (
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
      
      {/* Warehouse Stats */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Stock Levels</h3>
          <p className="text-slate-600 text-sm">Real-time inventory tracking</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Analytics</h3>
          <p className="text-slate-600 text-sm">Inventory movement analysis</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <FileText className="h-8 w-8 text-purple-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Reports</h3>
          <p className="text-slate-600 text-sm">Comprehensive inventory reports</p>
        </div>
      </div>
    </div>
  );
}