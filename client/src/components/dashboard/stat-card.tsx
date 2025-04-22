import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  className,
  iconColor = "text-primary-500",
  iconBgColor = "bg-primary-50",
}: StatCardProps) {
  const { isRTL } = useLanguage();
  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group relative overflow-hidden", 
      className
    )}>
      {/* Background decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50/30 to-primary-100/10 rounded-bl-full -z-10 transform translate-x-8 -translate-y-8 group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform"></div>
      
      <div className={cn("flex justify-between items-start", isRTL && "flex-row-reverse")}>
        <div className={isRTL ? 'text-right' : ''}>
          <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">{title}</p>
          <h3 className="text-3xl font-extrabold mt-3 text-gray-800 group-hover:text-primary-700 transition-colors">{value}</h3>
          {trend && (
            <p
              className={cn(
                "flex items-center text-sm mt-3 font-medium",
                isRTL && "flex-row-reverse",
                trend.direction === "up" && "text-emerald-600",
                trend.direction === "down" && "text-rose-600",
                trend.direction === "neutral" && "text-amber-600"
              )}
            >
              <span className={cn(
                "material-icons text-sm flex items-center justify-center h-5 w-5 rounded-full mr-1.5",
                trend.direction === "up" && "bg-emerald-100",
                trend.direction === "down" && "bg-rose-100",
                trend.direction === "neutral" && "bg-amber-100",
                isRTL ? "mr-0 ml-1.5" : "mr-1.5"
              )}>
                {trend.direction === "up" && "arrow_upward"}
                {trend.direction === "down" && "arrow_downward"}
                {trend.direction === "neutral" && "trending_flat"}
              </span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        <div className={cn(
          "rounded-lg p-3 shadow-sm group-hover:shadow-md transition-all", 
          iconBgColor,
          "group-hover:scale-110 transform duration-200"
        )}>
          <span className={cn("material-icons", iconColor)}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
