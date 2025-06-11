import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { 
  Tag, 
  Package, 
  Users, 
  ShoppingBag, 
  Layout, 
  Cog, 
  UserCheck,
  ArrowRight,
  Building2
} from "lucide-react";

interface SetupCardProps {
  title: string;
  description: string;
  icon: any;
  path: string;
  count: number;
}

function SetupCard({ title, description, icon: IconComponent, path, count }: SetupCardProps) {
  const { isRTL } = useLanguage();
  
  return (
    <Link href={path}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-gradient-to-br from-white to-slate-50 border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
          <CardTitle className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <span className={`font-bold text-lg ${isRTL ? 'mr-4' : 'ml-4'}`}>{title}</span>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm text-blue-100 rounded-full px-3 py-1 text-sm font-semibold border border-blue-400/30">
              {count}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-slate-600 text-sm leading-relaxed mb-4">{description}</p>
          <div className={`flex justify-end ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 group-hover:bg-slate-800 group-hover:text-white transition-all duration-300"
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>Manage</span>
              <ArrowRight className={`h-4 w-4 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SetupIndex() {
  const { isRTL } = useLanguage();
  
  // In a real application, these counts would come from API queries
  const [setupModules] = useState([
    {
      title: "Categories",
      description: "Manage product categories for organization",
      icon: Tag,
      path: "/setup/categories",
      count: 5
    },
    {
      title: "Products",
      description: "Manage customer-specific product specifications",
      icon: Package,
      path: "/setup/products",
      count: 24
    },
    {
      title: "Customers",
      description: "Manage customer information and relationships",
      icon: Users,
      path: "/setup/customers",
      count: 12
    },
    {
      title: "Items",
      description: "Manage product items and details",
      icon: ShoppingBag,
      path: "/setup/items",
      count: 37
    },
    {
      title: "Sections",
      description: "Manage factory production sections",
      icon: Building2,
      path: "/setup/sections",
      count: 3
    },
    {
      title: "Machines",
      description: "Manage production machinery and equipment",
      icon: Cog,
      path: "/setup/machines",
      count: 8
    },
    {
      title: "Users",
      description: "Manage system users and permissions",
      icon: UserCheck,
      path: "/setup/users",
      count: 6
    }
  ]);

  return (
    <div className={`min-h-full ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header Section */}
      <div className={`mb-12 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          Setup & Configuration
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Manage your system configuration and settings with our comprehensive setup modules
        </p>
      </div>
      
      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {setupModules.map((module) => (
          <SetupCard
            key={module.path}
            title={module.title}
            description={module.description}
            icon={module.icon}
            path={module.path}
            count={module.count}
          />
        ))}
      </div>
      
      {/* Footer Info */}
      <div className="mt-16 text-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8 border border-slate-200/50">
          <h3 className="text-xl lg:text-2xl font-bold text-slate-800 mb-4">Quick Setup Guide</h3>
          <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto text-sm lg:text-base">
            Configure your manufacturing system step by step. Start with Categories and Products, 
            then set up your Customers and Items. Finally, configure your production Sections, 
            Machines, and manage system Users for optimal workflow.
          </p>
        </div>
      </div>
    </div>
  );
}
