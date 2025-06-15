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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  User
} from 'lucide-react';
import { format } from 'date-fns';

type Violation = {
  id: string;
  checkId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved';
  reportDate: string;
  reportedBy: string;
  assignedTo?: string;
  resolvedAt?: string;
};

type RecentViolationsData = {
  violations: Violation[];
  totalPending: number;
  totalInProgress: number;
  totalResolved: number;
};

export function QualityViolationsWidget() {
  const { t } = useTranslation();
  
  const { data, isLoading } = useQuery<RecentViolationsData>({
    queryKey: ['/api/quality/recent-violations'],
    refetchInterval: 60000, // Refresh every minute
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">High</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              {t('dashboard.quality_violations')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.recent_violations_description')}
            </CardDescription>
          </div>
          {!isLoading && data && (
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-red-600">
                {data.totalPending}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('dashboard.pending_violations')}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-12" />
          </div>
        ) : data && data.violations.length > 0 ? (
          <div className="space-y-3">
            {data.violations.slice(0, 3).map((violation) => (
              <div key={violation.id} className="border rounded-md p-3 text-sm">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="font-medium line-clamp-1">{violation.description}</div>
                  {getSeverityBadge(violation.severity)}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(violation.reportDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Reported by: {violation.reportedBy || 'Unknown'}</span>
                  </div>
                  <div className="w-full mt-1">
                    {getStatusBadge(violation.status)}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between text-sm mt-4">
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>{data.totalResolved} {t('dashboard.resolved')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-600">
                <Clock className="h-4 w-4" />
                <span>{data.totalInProgress} {t('dashboard.in_progress')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{data.totalPending} {t('dashboard.pending')}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {t('dashboard.no_violations_data')}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1">
        <Link href="/quality/violations">
          <Button variant="ghost" size="sm" className="gap-1 w-full">
            <span>{t('dashboard.view_all_violations')}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}