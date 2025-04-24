import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Define colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Interfaces for the data types
interface ProcessingTime {
  rollId: number;
  processingTime: number;
  stage: string;
  date: string;
}

interface PerformanceMetrics {
  processingTimes: {
    avgExtrusionToNextStage: number;
    avgPrintingToCutting: number;
    avgTotalProcessingTime: number;
    recentProcessingTimes: ProcessingTime[];
  };
  wasteMetrics: {
    totalWasteQty: number;
    overallWastePercentage: number;
    rollProcessingTimes: {
      rollId: number;
      wasteQty: number;
      wastePercentage: number;
    }[];
  };
  orderMetrics: {
    avgOrderFulfillmentTime: number;
    orderFulfillmentTimes: {
      orderId: number;
      fulfillmentTime: number;
    }[];
  };
  qualityMetrics: {
    totalQualityChecks: number;
    failedQualityChecks: number;
    qualityFailureRate: number;
  };
  throughput: {
    date: string;
    count: number;
    totalWeight: number;
  }[];
  mobileMetrics: {
    avgProcessingTime: number;
    avgOrderFulfillment: number;
    wastePercentage: number;
    qualityFailureRate: number;
    recentProcessingTimes: ProcessingTime[];
  };
}

function MetricCard({ title, value, subtitle, icon, trend, color = "primary" }: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  color?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    error: 'text-red-600 bg-red-50',
  };
  
  const iconColorClass = colorClasses[color];
  
  return (
    <Card className="h-full">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          {icon && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColorClass}`}>
              <span className="material-icons text-base">{icon}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-2xl md:text-3xl font-bold">{value}</span>
          {subtitle && <span className="text-xs text-gray-500 mt-1">{subtitle}</span>}
        </div>
        {trend && (
          <div className="mt-3 flex items-center">
            <span className={`material-icons text-sm ${
              trend.direction === 'up' ? 'text-green-500' : 
              trend.direction === 'down' ? 'text-red-500' : 'text-gray-500'
            }`}>
              {trend.direction === 'up' ? 'trending_up' : 
               trend.direction === 'down' ? 'trending_down' : 'trending_flat'}
            </span>
            <span className="text-xs ml-1">{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceCharts({ data, isMobile, isRTL }: { 
  data: PerformanceMetrics; 
  isMobile: boolean;
  isRTL: boolean;
}) {
  const { t } = useTranslation();
  
  // Format data for charts
  const wasteData = [
    { name: t("performance.waste"), value: data.wasteMetrics.totalWasteQty },
    { name: t("performance.good_product"), value: data.wasteMetrics.totalWasteQty / (data.wasteMetrics.overallWastePercentage / 100) - data.wasteMetrics.totalWasteQty }
  ];
  
  const qualityData = [
    { name: t("performance.passed"), value: data.qualityMetrics.totalQualityChecks - data.qualityMetrics.failedQualityChecks },
    { name: t("performance.failed"), value: data.qualityMetrics.failedQualityChecks }
  ];
  
  // Format processing times data for line chart
  const processingTimesData = data.mobileMetrics.recentProcessingTimes.map(item => ({
    rollId: item.rollId,
    processingTime: parseFloat(item.processingTime.toFixed(2)),
    stage: item.stage,
    date: item.date ? format(new Date(item.date), 'MM/dd') : '-'
  })).sort((a, b) => a.rollId - b.rollId).slice(0, 10);
  
  // Format throughput data
  const throughputData = data.throughput.slice(-10).map(item => ({
    date: item.date.split('-')[2] + '/' + item.date.split('-')[1],  // Day/Month format
    count: item.count,
    weight: parseFloat((item.totalWeight / 1000).toFixed(1))  // Convert to tons
  }));
  
  return (
    <div className="space-y-6">
      {/* Mobile-optimized KPI cards in 2 rows of 2 */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title={t("performance.avg_processing_time")}
          value={`${data.mobileMetrics.avgProcessingTime.toFixed(1)} ${t("performance.hours")}`}
          icon="timer"
          color="primary"
        />
        <MetricCard
          title={t("performance.avg_order_fulfillment")}
          value={`${data.mobileMetrics.avgOrderFulfillment.toFixed(1)} ${t("performance.days")}`}
          icon="schedule"
          color="success"
        />
        <MetricCard
          title={t("performance.waste_percentage")}
          value={`${data.mobileMetrics.wastePercentage.toFixed(1)}%`}
          icon="delete"
          color="warning"
        />
        <MetricCard
          title={t("performance.quality_failure_rate")}
          value={`${data.mobileMetrics.qualityFailureRate.toFixed(1)}%`}
          icon="error"
          color="error"
        />
      </div>
      
      {/* Charts for mobile - Simple and focused */}
      <Tabs defaultValue="processing" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="processing">{t("performance.processing")}</TabsTrigger>
          <TabsTrigger value="quality">{t("performance.quality")}</TabsTrigger>
          <TabsTrigger value="throughput">{t("performance.throughput")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="processing" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("performance.recent_processing_times")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={processingTimesData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      reversed={isRTL} 
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => [`${value} ${t("performance.hours")}`, t("performance.time")]} />
                    <Line 
                      type="monotone" 
                      dataKey="processingTime" 
                      stroke="#8884d8" 
                      name={t("performance.processing_time")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quality" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("performance.quality_metrics")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#4caf50" : "#f44336"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span>{t("performance.quality_pass_rate")}</span>
                  <span>{(100 - data.qualityMetrics.qualityFailureRate).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={100 - data.qualityMetrics.qualityFailureRate} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="throughput" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("performance.daily_throughput")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={throughputData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      reversed={isRTL} 
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any, name: any) => [
                      value, 
                      name === "count" ? t("performance.rolls_count") : t("performance.weight_tons")
                    ]} />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name={t("performance.rolls_count")}
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="weight" 
                      name={t("performance.weight_tons")}
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Waste Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("performance.waste_analysis")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {wasteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#ff9800" : "#4caf50"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(1) : value} kg`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span>{t("performance.waste_percentage")}</span>
              <span>{data.wasteMetrics.overallWastePercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={data.wasteMetrics.overallWastePercentage} 
              className="h-2 bg-green-100" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PerformancePage() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  
  // Fetch performance metrics data
  const { data, isLoading, error } = useQuery<PerformanceMetrics>({
    queryKey: ["/api/performance-metrics"],
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl md:text-2xl font-bold text-secondary-900 mb-4 px-1">
          {t("performance.title")}
        </h1>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 rounded-lg my-4">
        <p className="text-red-700">{t("common.error_loading_data")}</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 sm:space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <h1 className="text-xl md:text-2xl font-bold text-secondary-900 mb-4 px-1">
        {t("performance.title")}
      </h1>
      
      <PerformanceCharts data={data} isMobile={isMobile} isRTL={isRTL} />
    </div>
  );
}