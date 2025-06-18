import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Clock,
  Activity,
  Users,
  Target
} from 'lucide-react';
import { ActiveOrdersTable } from './active-orders-table';
import { QualityMetricsWidget } from './quality-metrics-widget';
import { ProductionChart } from './production-chart';
import { RecentOrders } from './recent-orders';
import { QuickActions } from './quick-actions';

interface WidgetRendererProps {
  widgetType: string;
  config: any;
  isEditMode?: boolean;
}

export function WidgetRenderer({ widgetType, config, isEditMode }: WidgetRendererProps) {
  switch (widgetType) {
    case 'stats-overview':
      return <StatsOverviewWidget config={config} />;
    case 'recent-orders':
      return <RecentOrdersWidget config={config} />;
    case 'quality-metrics':
      return <QualityMetricsWidget />;
    case 'production-chart':
      return <ProductionChartWidget config={config} />;
    case 'active-machines':
      return <ActiveMachinesWidget config={config} />;
    case 'production-targets':
      return <ProductionTargetsWidget config={config} />;
    case 'bottleneck-monitor':
      return <BottleneckMonitorWidget config={config} />;
    case 'quality-violations':
      return <QualityViolationsWidget config={config} />;
    case 'order-summary':
      return <OrderSummaryWidget config={config} />;
    case 'pending-orders':
      return <PendingOrdersWidget config={config} />;
    case 'quick-actions':
      return <QuickActions />;
    case 'notifications':
      return <NotificationsWidget config={config} />;
    case 'calendar':
      return <CalendarWidget config={config} />;
    case 'performance-metrics':
      return <PerformanceMetricsWidget config={config} />;
    default:
      return <DefaultWidget widgetType={widgetType} config={config} />;
  }
}

// Stats Overview Widget
function StatsOverviewWidget({ config }: { config: any }) {
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard-stats'],
  });

  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Statistics Overview'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="flex items-center justify-center mb-1">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-600">
            {stats?.totalOrders || 0}
          </div>
          <div className="text-xs text-blue-600">Total Orders</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-xl font-bold text-green-600">
            {stats?.completedOrders || 0}
          </div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded">
          <div className="flex items-center justify-center mb-1">
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-xl font-bold text-yellow-600">
            {stats?.pendingOrders || 0}
          </div>
          <div className="text-xs text-yellow-600">Pending</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <div className="flex items-center justify-center mb-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-xl font-bold text-red-600">
            {stats?.qualityIssues || 0}
          </div>
          <div className="text-xs text-red-600">Quality Issues</div>
        </div>
      </div>
    </div>
  );
}

// Recent Orders Widget
function RecentOrdersWidget({ config }: { config: any }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Recent Orders'}</h3>
      <RecentOrders limit={config.limit || 5} />
    </div>
  );
}

// Production Chart Widget
function ProductionChartWidget({ config }: { config: any }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Production Chart'}</h3>
      <ProductionChart />
    </div>
  );
}

// Active Machines Widget
function ActiveMachinesWidget({ config }: { config: any }) {
  const { data: machines } = useQuery({
    queryKey: ['/api/machines/status'],
  });

  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Machine Status'}</h3>
      <div className="space-y-2">
        {machines?.slice(0, 4).map((machine: any, index: number) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">{machine.name || `Machine ${index + 1}`}</span>
            </div>
            <Badge variant={machine.status === 'active' ? 'default' : 'secondary'}>
              {machine.status || 'Active'}
            </Badge>
          </div>
        )) || (
          <div className="text-center py-4 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Machine data loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Production Targets Widget
function ProductionTargetsWidget({ config }: { config: any }) {
  const { data: targets } = useQuery({
    queryKey: ['/api/production/targets'],
  });

  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Production Targets'}</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Daily Target</span>
          <div className="text-right">
            <div className="text-sm font-medium">{targets?.daily?.current || 0} / {targets?.daily?.target || 1000}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((targets?.daily?.current || 0) / (targets?.daily?.target || 1000) * 100)}%
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${Math.min(100, (targets?.daily?.current || 0) / (targets?.daily?.target || 1000) * 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// Bottleneck Monitor Widget
function BottleneckMonitorWidget({ config }: { config: any }) {
  const { data: bottlenecks } = useQuery({
    queryKey: ['/api/production/bottlenecks'],
  });

  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Bottleneck Monitor'}</h3>
      {bottlenecks?.length > 0 ? (
        <div className="space-y-2">
          {bottlenecks.slice(0, 3).map((bottleneck: any, index: number) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">{bottleneck.section || 'Production Line'}</div>
                <div className="text-xs text-muted-foreground">{bottleneck.issue || 'Performance below threshold'}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm text-green-600">No bottlenecks detected</p>
        </div>
      )}
    </div>
  );
}

// Quality Violations Widget
function QualityViolationsWidget({ config }: { config: any }) {
  const { data: violations } = useQuery({
    queryKey: ['/api/quality/violations/recent'],
  });

  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Quality Violations'}</h3>
      {violations?.length > 0 ? (
        <div className="space-y-2">
          {violations.slice(0, config.limit || 5).map((violation: any, index: number) => (
            <div key={index} className="p-2 bg-yellow-50 rounded">
              <div className="text-sm font-medium">{violation.type || 'Quality Issue'}</div>
              <div className="text-xs text-muted-foreground">
                {violation.section || 'Unknown Section'} • {violation.date || 'Recent'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm text-green-600">No violations today</p>
        </div>
      )}
    </div>
  );
}

// Order Summary Widget
function OrderSummaryWidget({ config }: { config: any }) {
  const { data: summary } = useQuery({
    queryKey: ['/api/orders/summary', config.period],
  });

  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Order Summary'}</h3>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 bg-blue-50 rounded">
          <div className="text-lg font-bold text-blue-600">{summary?.new || 0}</div>
          <div className="text-xs text-blue-600">New Orders</div>
        </div>
        <div className="p-2 bg-green-50 rounded">
          <div className="text-lg font-bold text-green-600">{summary?.completed || 0}</div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
      </div>
    </div>
  );
}

// Pending Orders Widget
function PendingOrdersWidget({ config }: { config: any }) {
  const { data: pendingOrders } = useQuery({
    queryKey: ['/api/orders/pending'],
  });

  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Pending Orders'}</h3>
      {pendingOrders?.length > 0 ? (
        <div className="space-y-2">
          {pendingOrders.slice(0, 3).map((order: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium">Order #{order.id}</div>
                <div className="text-xs text-muted-foreground">{order.customer}</div>
              </div>
              <Badge variant="secondary">{order.status}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No pending orders</p>
        </div>
      )}
    </div>
  );
}

// Notifications Widget
function NotificationsWidget({ config }: { config: any }) {
  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
  });

  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Notifications'}</h3>
      {notifications?.length > 0 ? (
        <div className="space-y-2">
          {notifications.slice(0, config.limit || 5).map((notification: any, index: number) => (
            <div key={index} className="p-2 bg-gray-50 rounded">
              <div className="text-sm">{notification.message}</div>
              <div className="text-xs text-muted-foreground">{notification.time}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-sm text-muted-foreground">No new notifications</div>
        </div>
      )}
    </div>
  );
}

// Calendar Widget
function CalendarWidget({ config }: { config: any }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Calendar'}</h3>
      <div className="text-center py-4">
        <div className="text-2xl font-bold">{new Date().getDate()}</div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

// Performance Metrics Widget
function PerformanceMetricsWidget({ config }: { config: any }) {
  const { data: metrics } = useQuery({
    queryKey: ['/api/performance/metrics'],
  });

  return (
    <div>
      <h3 className="font-semibold mb-3">{config.title || 'Performance Metrics'}</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Overall Efficiency</span>
          <span className="text-sm font-medium">{metrics?.efficiency || 85}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Output Rate</span>
          <span className="text-sm font-medium">{metrics?.outputRate || 92}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Quality Score</span>
          <span className="text-sm font-medium">{metrics?.qualityScore || 96}%</span>
        </div>
      </div>
    </div>
  );
}

// Default Widget for unknown types
function DefaultWidget({ widgetType, config }: { widgetType: string; config: any }) {
  return (
    <div className="text-center py-4">
      <div className="text-sm font-medium">{config.title || widgetType}</div>
      <div className="text-xs text-muted-foreground mt-1">Widget content loading...</div>
    </div>
  );
}