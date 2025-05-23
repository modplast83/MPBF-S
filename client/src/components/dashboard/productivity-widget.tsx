import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  BarChart4, 
  UserCog
} from 'lucide-react';

type ProductivityData = {
  operatorEfficiency: number;
  machineUtilization: number;
  cycleTimeVariance: number;
  productionPerHour: number;
  productionTarget: number;
  productionTrend: 'up' | 'down' | 'stable';
};

export function ProductivityWidget() {
  const { t } = useTranslation();
  
  const { data, isLoading } = useQuery<ProductivityData>({
    queryKey: ['/api/production/productivity'],
    refetchInterval: 300000, // Refresh every 5 minutes
    
    // Fallback to realistic placeholder data if API not implemented yet
    placeholderData: {
      operatorEfficiency: 87,
      machineUtilization: 92,
      cycleTimeVariance: 4.2,
      productionPerHour: 182,
      productionTarget: 200,
      productionTrend: 'up'
    }
  });

  const getPercentageColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceText = (actual: number, target: number) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 95) return 'Excellent';
    if (percentage >= 85) return 'Good';
    if (percentage >= 70) return 'Average';
    return 'Below Target';
  };

  const getPerformanceColor = (actual: number, target: number) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 85) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4 border-t-2 border-gray-400"></div>;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCog className="h-5 w-5 text-primary" />
          {t('dashboard.productivity')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.productivity_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <div className="text-sm text-muted-foreground mb-1">{t('dashboard.operator_efficiency')}</div>
                <div className="flex items-end gap-2">
                  <div className={`text-2xl font-bold ${getPercentageColor(data.operatorEfficiency)}`}>
                    {data.operatorEfficiency}%
                  </div>
                  {data.productionTrend === 'up' && (
                    <div className="text-xs text-green-600 mb-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      +2.4%
                    </div>
                  )}
                  {data.productionTrend === 'down' && (
                    <div className="text-xs text-red-600 mb-1 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                      -1.3%
                    </div>
                  )}
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-sm text-muted-foreground mb-1">{t('dashboard.machine_utilization')}</div>
                <div className="flex items-end gap-2">
                  <div className={`text-2xl font-bold ${getPercentageColor(data.machineUtilization)}`}>
                    {data.machineUtilization}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{t('dashboard.hourly_production')}</div>
                <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(data.productionTrend)}
                  <span>{t(`dashboard.trend_${data.productionTrend}`)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{data.productionPerHour}</div>
                  <div className="text-xs text-muted-foreground">{t('dashboard.units_per_hour')}</div>
                </div>
                <div>
                  <div className="text-sm text-right">{t('dashboard.target')}: {data.productionTarget}</div>
                  <div className={`text-xs text-right ${getPerformanceColor(data.productionPerHour, data.productionTarget)}`}>
                    {t(`dashboard.performance_${getPerformanceText(data.productionPerHour, data.productionTarget).toLowerCase()}`)}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (data.productionPerHour / data.productionTarget) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">{t('dashboard.cycle_time_variance')}</div>
                  <div className="text-xl font-medium">±{data.cycleTimeVariance}%</div>
                </div>
                <BarChart4 className="h-12 w-12 text-muted-foreground/30" />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {t('dashboard.no_productivity_data')}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1">
        <Link href="/reports/performance">
          <Button variant="ghost" size="sm" className="gap-1 w-full">
            <span>{t('dashboard.view_performance_reports')}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}