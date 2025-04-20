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
    <div className={cn("bg-white rounded-lg shadow p-6", className)}>
      <div className={cn("flex justify-between items-start", isRTL && "flex-row-reverse")}>
        <div className={isRTL ? 'text-right' : ''}>
          <p className="text-secondary-500 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
          {trend && (
            <p
              className={cn(
                "flex items-center text-sm mt-2",
                isRTL && "flex-row-reverse",
                trend.direction === "up" && "text-success",
                trend.direction === "down" && "text-error",
                trend.direction === "neutral" && "text-secondary-500"
              )}
            >
              <span className={cn("material-icons text-sm", isRTL ? "mr-0 ml-1" : "mr-1")}>
                {trend.direction === "up" && "arrow_upward"}
                {trend.direction === "down" && "arrow_downward"}
                {trend.direction === "neutral" && "trending_flat"}
              </span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        <div className={cn("rounded-full p-3", iconBgColor)}>
          <span className={cn("material-icons", iconColor)}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
