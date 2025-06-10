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
import { Progress } from '@/components/ui/progress';
import { 
  ArrowUpRight, 
  CheckCircle2, 
  ClipboardCheck, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';

type QualityStats = {
  totalChecks: number;
  passedChecks: number;
  pendingViolations: number;
  resolvedViolations: number;
  qualityScore: number;
};

export function QualityMetricsWidget() {
  const { t } = useTranslation();
  
  const { data: stats, isLoading } = useQuery<QualityStats>({
    queryKey: ['/api/quality/stats'],
    refetchInterval: 60000, // Refresh every minute
  });

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getQualityScoreText = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              {t('dashboard.quality_metrics')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.quality_metrics_description')}
            </CardDescription>
          </div>
          {!isLoading && stats && (
            <div className="flex flex-col items-center">
              <div className={`text-2xl font-bold ${getQualityScoreText(stats.qualityScore)}`}>
                {stats.qualityScore}%
              </div>
              <div className="text-xs text-muted-foreground">
                {t('dashboard.quality_score')}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-16" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">{t('dashboard.pass_rate')}</span>
                <span className="text-sm font-medium">
                  {stats.totalChecks > 0 
                    ? Math.round((stats.passedChecks / stats.totalChecks) * 100) 
                    : 0}%
                </span>
              </div>
              <Progress 
                value={stats.totalChecks > 0 ? (stats.passedChecks / stats.totalChecks) * 100 : 0} 
                className={getPassRateColor(stats.totalChecks > 0 ? (stats.passedChecks / stats.totalChecks) * 100 : 0)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-3 text-center">
                <div className="flex justify-center text-green-500 mb-1">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-xl font-semibold">{stats.passedChecks}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard.passed_checks')}</div>
              </div>
              
              <div className="border rounded-lg p-3 text-center">
                <div className="flex justify-center text-red-500 mb-1">
                  <XCircle className="h-5 w-5" />
                </div>
                <div className="text-xl font-semibold">{stats.totalChecks - stats.passedChecks}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard.failed_checks')}</div>
              </div>
              
              <div className="border rounded-lg p-3 text-center">
                <div className="flex justify-center text-yellow-500 mb-1">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="text-xl font-semibold">{stats.pendingViolations}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard.pending_violations')}</div>
              </div>
              
              <div className="border rounded-lg p-3 text-center">
                <div className="flex justify-center text-green-500 mb-1">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-xl font-semibold">{stats.resolvedViolations}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard.resolved_violations')}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {t('dashboard.no_quality_data')}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1">
        <Link href="/quality">
          <Button variant="ghost" size="sm" className="gap-1 w-full">
            <span>{t('dashboard.view_quality_dashboard')}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}