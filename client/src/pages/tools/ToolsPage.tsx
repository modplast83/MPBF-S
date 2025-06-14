import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { ModuleCard } from "@/components/ui/module-card";
import { 
  Calculator, 
  Palette, 
  Wrench, 
  DollarSign,
  Beaker,
  Settings,
  Zap,
  Package
} from "lucide-react";

const tools = [
  {
    title: "Order Design",
    description: "Professional product customization wizard for packaging solutions",
    icon: Package,
    path: "/tools/order-design",
    color: "bg-gradient-to-br from-indigo-500 to-purple-600"
  },
  {
    title: "Bag Weight Calculator",
    description: "Calculate optimal bag weights and material requirements",
    icon: Calculator,
    path: "/tools/bag-weight",
    color: "bg-gradient-to-br from-blue-500 to-blue-600"
  },
  {
    title: "Ink Consumption Calculator", 
    description: "Estimate ink usage for printing operations",
    icon: Palette,
    path: "/tools/ink-consumption",
    color: "bg-gradient-to-br from-purple-500 to-purple-600"
  },
  {
    title: "Mix Colors Calculator",
    description: "Calculate color mixing ratios and formulations",
    icon: Beaker,
    path: "/tools/mix-colors",
    color: "bg-gradient-to-br from-green-500 to-green-600"
  },
  {
    title: "Utility Tools",
    description: "Additional utility tools for production support",
    icon: Wrench,
    path: "/tools/utilities",
    color: "bg-gradient-to-br from-orange-500 to-orange-600"
  },
  {
    title: "Cost Calculator",
    description: "Calculate production costs and pricing",
    icon: DollarSign,
    path: "/tools/cost-calculator",
    color: "bg-gradient-to-br from-red-500 to-red-600"
  }
];

export default function ToolsPage() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className={`min-h-full ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header Section */}
      <div className={`mb-12 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg">
            <Wrench className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          Manufacturing Tools
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Essential calculators and utilities for efficient production management
        </p>
      </div>
      
      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {tools.map((tool) => (
          <ModuleCard
            key={tool.path}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            path={tool.path}
            color={tool.color}
            action="Open Tool"
          />
        ))}
      </div>
      
      {/* Tools Categories */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <Calculator className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Calculators</h3>
          <p className="text-slate-600 text-sm">Precise calculations for manufacturing</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <Settings className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Utilities</h3>
          <p className="text-slate-600 text-sm">Production support tools</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50 text-center">
          <Zap className="h-8 w-8 text-purple-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Efficiency</h3>
          <p className="text-slate-600 text-sm">Optimize production workflows</p>
        </div>
      </div>
    </div>
  );
}