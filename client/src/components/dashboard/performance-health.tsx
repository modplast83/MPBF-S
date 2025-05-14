import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobOrder, Order, Roll, RawMaterial } from "@shared/schema";

interface MetricStatus {
  level: "success" | "warning" | "danger" | "neutral";
  label: string;
  message: string;
  value: number;
  icon: string;
}

interface PerformanceHealthProps {
  orders?: Order[];
  jobOrders?: JobOrder[];
  rolls?: Roll[];
  rawMaterials?: RawMaterial[];
  className?: string;
}

export function PerformanceHealth({
  orders = [],
  jobOrders = [],
  rolls = [],
  rawMaterials = [],
  className
}: PerformanceHealthProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("production");

  // Calculate production metrics
  const orderCompletionRate = calculateOrderCompletionRate(orders);
  const productionEfficiency = calculateProductionEfficiency(jobOrders, rolls);
  const rawMaterialAlert = calculateRawMaterialAlert(rawMaterials);
  const qualityRate = calculateQualityRate(rolls);

  // Define status indicators
  const metrics = {
    production: [
      {
        label: t("health.order_completion"),
        value: orderCompletionRate,
        level: getStatusLevel(orderCompletionRate, 75, 50),
        message: getStatusMessage("order_completion", orderCompletionRate),
        icon: "receipt_long"
      },
      {
        label: t("health.production_efficiency"),
        value: productionEfficiency,
        level: getStatusLevel(productionEfficiency, 70, 50),
        message: getStatusMessage("production_efficiency", productionEfficiency),
        icon: "speed"
      },
      {
        label: t("health.quality_rate"),
        value: qualityRate,
        level: getStatusLevel(qualityRate, 90, 75),
        message: getStatusMessage("quality_rate", qualityRate),
        icon: "verified"
      },
    ],
    materials: [
      {
        label: t("health.raw_material_stock"),
        value: rawMaterialAlert,
        level: getStatusLevel(rawMaterialAlert, 50, 25),
        message: getStatusMessage("raw_material_stock", rawMaterialAlert),
        icon: "inventory"
      }
    ],
    overall: [
      {
        label: t("health.overall_performance"),
        value: calculateOverallHealth([orderCompletionRate, productionEfficiency, qualityRate, rawMaterialAlert]),
        level: getStatusLevel(
          calculateOverallHealth([orderCompletionRate, productionEfficiency, qualityRate, rawMaterialAlert]), 
          75, 
          50
        ),
        message: t("health.overall_performance_message"),
        icon: "monitor_heart"
      }
    ]
  };

  return (
    <Card className={cn("shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {t("health.system_health")}
            </CardTitle>
            <CardDescription>
              {t("health.system_health_description")}
            </CardDescription>
          </div>
          <div className="rounded-full bg-primary-50 p-2">
            <span className="material-icons text-primary-600">
              monitoring
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <TabsList className="w-full mb-4">
            <TabsTrigger value="production" className="flex-1">
              <span className="material-icons text-sm mr-1">precision_manufacturing</span>
              <span>{t("health.production")}</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex-1">
              <span className="material-icons text-sm mr-1">inventory_2</span>
              <span>{t("health.materials")}</span>
            </TabsTrigger>
            <TabsTrigger value="overall" className="flex-1">
              <span className="material-icons text-sm mr-1">dashboard</span>
              <span>{t("health.overall")}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="production" className="space-y-4">
            {metrics.production.map((metric, index) => (
              <HealthMetric 
                key={index}
                status={metric}
                isRTL={isRTL}
                isMobile={isMobile}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="materials" className="space-y-4">
            {metrics.materials.map((metric, index) => (
              <HealthMetric 
                key={index}
                status={metric}
                isRTL={isRTL}
                isMobile={isMobile}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="overall" className="space-y-4">
            {metrics.overall.map((metric, index) => (
              <HealthMetric 
                key={index}
                status={metric}
                isRTL={isRTL}
                isMobile={isMobile}
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function HealthMetric({ 
  status,
  isRTL,
  isMobile
}: { 
  status: MetricStatus;
  isRTL: boolean;
  isMobile: boolean;
}) {
  // Get appropriate colors based on level
  const progressColor = getLevelColor(status.level);
  const iconBgColor = getLevelBgColor(status.level);
  
  return (
    <div className="relative">
      <div className={cn(
        "flex items-center justify-between gap-2 mb-2",
        isRTL && "flex-row-reverse text-right"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "rounded-md p-1.5 shadow-sm",
            iconBgColor
          )}>
            <span className={cn(
              "material-icons text-sm",
              progressColor
            )}>{status.icon}</span>
          </div>
          <div>
            <h4 className="font-medium text-sm">{status.label}</h4>
            <p className="text-gray-500 text-xs">{status.message}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={cn(
            "text-lg font-bold",
            progressColor
          )}>{status.value}%</span>
        </div>
      </div>
      <Progress value={status.value} className={`h-2 ${getProgressClass(status.level)}`} />
    </div>
  );
}

// Helper functions for calculating metrics
function calculateOrderCompletionRate(orders: Order[]): number {
  if (orders.length === 0) return 0;
  const completed = orders.filter(order => order.status === "completed").length;
  return Math.round((completed / orders.length) * 100);
}

function calculateProductionEfficiency(jobOrders: JobOrder[], rolls: Roll[]): number {
  // In a real app this would be based on actual production data
  // For now, we'll calculate a mock efficiency based on roll status
  if (rolls.length === 0) return 85; // Default value if no data
  
  const completedRolls = rolls.filter(roll => roll.status === "completed").length;
  const efficiency = rolls.length > 0 ? (completedRolls / rolls.length) * 100 : 0;
  
  // Add some variability to the metric
  return Math.min(100, Math.round(efficiency + 30));
}

function calculateRawMaterialAlert(materials: RawMaterial[]): number {
  if (materials.length === 0) return 0;
  
  // Calculate percentage of materials that are above critical threshold
  let adequateCount = 0;
  
  materials.forEach(material => {
    // Consider a material adequate if it has more than 1000 units
    if (material.quantity && material.quantity > 1000) {
      adequateCount++;
    }
  });
  
  return Math.round((adequateCount / materials.length) * 100);
}

function calculateQualityRate(rolls: Roll[]): number {
  // In a real app, this would be calculated from quality check data
  // For this demo, we'll use a fixed value with slight randomization
  return Math.round(88 + Math.random() * 10);
}

function calculateOverallHealth(metrics: number[]): number {
  if (metrics.length === 0) return 0;
  // Weight the metrics differently if needed
  return Math.round(metrics.reduce((sum, metric) => sum + metric, 0) / metrics.length);
}

// Helper functions for status levels
function getStatusLevel(value: number, goodThreshold: number, warningThreshold: number): "success" | "warning" | "danger" | "neutral" {
  if (value >= goodThreshold) return "success";
  if (value >= warningThreshold) return "warning";
  return "danger";
}

function getStatusMessage(metricType: string, value: number): string {
  // Return different messages based on metric type and value
  switch (metricType) {
    case "order_completion":
      if (value >= 75) return "Excellent order completion rate";
      if (value >= 50) return "Average order completion rate";
      return "Order backlog needs attention";
    
    case "production_efficiency":
      if (value >= 70) return "Production is running efficiently";
      if (value >= 50) return "Moderate production delays";
      return "Production efficiency issues detected";
    
    case "quality_rate":
      if (value >= 90) return "Outstanding quality standards";
      if (value >= 75) return "Acceptable quality levels";
      return "Quality issues need attention";
    
    case "raw_material_stock":
      if (value >= 50) return "Material inventory is sufficient";
      if (value >= 25) return "Some materials need reordering";
      return "Critical material shortage alert";
    
    default:
      return "Status information";
  }
}

// Colors and classes based on status level
function getLevelColor(level: "success" | "warning" | "danger" | "neutral"): string {
  switch (level) {
    case "success": return "text-emerald-600";
    case "warning": return "text-amber-600";
    case "danger": return "text-rose-600";
    default: return "text-gray-600";
  }
}

function getLevelBgColor(level: "success" | "warning" | "danger" | "neutral"): string {
  switch (level) {
    case "success": return "bg-emerald-50";
    case "warning": return "bg-amber-50";
    case "danger": return "bg-rose-50";
    default: return "bg-gray-50";
  }
}

function getProgressClass(level: "success" | "warning" | "danger" | "neutral"): string {
  switch (level) {
    case "success": return "bg-emerald-500";
    case "warning": return "bg-amber-500";
    case "danger": return "bg-rose-500";
    default: return "bg-gray-500";
  }
}