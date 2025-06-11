
import React from 'react';
import { Link } from 'wouter';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color?: string;
  count?: number;
  isNew?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ModuleCard({ 
  title, 
  description, 
  icon: Icon, 
  path, 
  color = "bg-gradient-to-br from-blue-500 to-blue-600", 
  count,
  isNew = false,
  disabled = false,
  className
}: ModuleCardProps) {
  const cardContent = (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 ease-out",
      "hover:shadow-xl hover:-translate-y-1",
      "border-0 bg-white/80 backdrop-blur-sm",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
      "before:translate-x-[-100%] before:transition-transform before:duration-700",
      "hover:before:translate-x-[100%]",
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02]",
      className
    )}>
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between">
          <div className={cn(
            "p-3 rounded-xl shadow-lg transition-transform duration-300",
            "group-hover:scale-110 group-hover:shadow-xl",
            color
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col items-end gap-2">
            {isNew && (
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 animate-pulse-scale"
              >
                New
              </Badge>
            )}
            {count !== undefined && (
              <Badge 
                variant="outline" 
                className="bg-gray-50/80 backdrop-blur-sm border-gray-200 text-gray-700 font-semibold"
              >
                {count}
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-gray-600 leading-relaxed">
          {description}
        </CardDescription>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/20 pointer-events-none" />
        
        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </CardContent>
    </Card>
  );

  if (disabled) {
    return cardContent;
  }

  return (
    <Link href={path} className="block">
      {cardContent}
    </Link>
  );
}
