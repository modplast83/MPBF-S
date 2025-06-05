import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: any;
  path: string;
  color: string;
  count?: number;
  action?: string;
}

export function ModuleCard({ 
  title, 
  description, 
  icon: IconComponent, 
  path, 
  color, 
  count, 
  action = "Access" 
}: ModuleCardProps) {
  const { isRTL } = useLanguage();
  
  return (
    <Link href={path}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-gradient-to-br from-white to-slate-50 border-0 shadow-md h-full">
        <CardHeader className={`${color} text-white p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <CardTitle className={`flex items-center justify-between relative z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <span className={`font-bold text-lg ${isRTL ? 'mr-4' : 'ml-4'}`}>{title}</span>
            </div>
            {count !== undefined && (
              <div className="bg-white/20 backdrop-blur-sm text-white rounded-full px-3 py-1 text-sm font-semibold border border-white/30">
                {count}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            {description}
          </p>
          <div className={`flex justify-end ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 group-hover:bg-slate-800 group-hover:text-white transition-all duration-300"
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>{action}</span>
              <ArrowRight className={`h-4 w-4 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}