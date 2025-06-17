import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Clock,
  Target,
  Activity,
  FileText,
  Settings,
  Calendar,
  PieChart,
  LineChart,
  BarChart4
} from 'lucide-react';

interface WidgetConfig {
  [key: string]: any;
}

interface WidgetTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'analytics' | 'production' | 'quality' | 'orders' | 'system';
  defaultConfig: WidgetConfig;
  configurable: boolean;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  // Analytics Widgets
  {
    id: 'stats-overview',
    type: 'stats-overview',
    name: 'Statistics Overview',
    description: 'Key performance metrics and statistics',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'analytics',
    defaultConfig: { title: 'Statistics Overview', showTrends: true },
    configurable: true
  },
  {
    id: 'production-chart',
    type: 'production-chart',
    name: 'Production Chart',
    description: 'Visual representation of production data',
    icon: <LineChart className="h-5 w-5" />,
    category: 'analytics',
    defaultConfig: { title: 'Production Trends', chartType: 'line', period: '7d' },
    configurable: true
  },
  {
    id: 'performance-metrics',
    type: 'performance-metrics',
    name: 'Performance Metrics',
    description: 'Real-time performance indicators',
    icon: <TrendingUp className="h-5 w-5" />,
    category: 'analytics',
    defaultConfig: { title: 'Performance Dashboard', refreshInterval: 30 },
    configurable: true
  },

  // Production Widgets
  {
    id: 'active-machines',
    type: 'active-machines',
    name: 'Active Machines',
    description: 'Current machine status and utilization',
    icon: <Activity className="h-5 w-5" />,
    category: 'production',
    defaultConfig: { title: 'Machine Status', showUtilization: true },
    configurable: true
  },
  {
    id: 'production-targets',
    type: 'production-targets',
    name: 'Production Targets',
    description: 'Daily and weekly production goals',
    icon: <Target className="h-5 w-5" />,
    category: 'production',
    defaultConfig: { title: 'Production Targets', period: 'daily' },
    configurable: true
  },
  {
    id: 'bottleneck-monitor',
    type: 'bottleneck-monitor',
    name: 'Bottleneck Monitor',
    description: 'Real-time bottleneck detection and alerts',
    icon: <AlertTriangle className="h-5 w-5" />,
    category: 'production',
    defaultConfig: { title: 'Bottleneck Alerts', alertThreshold: 80 },
    configurable: true
  },

  // Quality Widgets
  {
    id: 'quality-metrics',
    type: 'quality-metrics',
    name: 'Quality Metrics',
    description: 'Quality control statistics and trends',
    icon: <PieChart className="h-5 w-5" />,
    category: 'quality',
    defaultConfig: { title: 'Quality Dashboard', showDefectRate: true },
    configurable: true
  },
  {
    id: 'quality-violations',
    type: 'quality-violations',
    name: 'Quality Violations',
    description: 'Recent quality issues and violations',
    icon: <AlertTriangle className="h-5 w-5" />,
    category: 'quality',
    defaultConfig: { title: 'Quality Violations', limit: 10 },
    configurable: true
  },

  // Orders Widgets
  {
    id: 'recent-orders',
    type: 'recent-orders',
    name: 'Recent Orders',
    description: 'Latest customer orders and status',
    icon: <Package className="h-5 w-5" />,
    category: 'orders',
    defaultConfig: { title: 'Recent Orders', limit: 5, showStatus: true },
    configurable: true
  },
  {
    id: 'order-summary',
    type: 'order-summary',
    name: 'Order Summary',
    description: 'Order statistics and completion rates',
    icon: <BarChart4 className="h-5 w-5" />,
    category: 'orders',
    defaultConfig: { title: 'Order Summary', period: '30d' },
    configurable: true
  },
  {
    id: 'pending-orders',
    type: 'pending-orders',
    name: 'Pending Orders',
    description: 'Orders awaiting processing or completion',
    icon: <Clock className="h-5 w-5" />,
    category: 'orders',
    defaultConfig: { title: 'Pending Orders', priority: 'high' },
    configurable: true
  },

  // System Widgets
  {
    id: 'quick-actions',
    type: 'quick-actions',
    name: 'Quick Actions',
    description: 'Frequently used actions and shortcuts',
    icon: <Settings className="h-5 w-5" />,
    category: 'system',
    defaultConfig: { title: 'Quick Actions', actions: ['new-order', 'quality-check'] },
    configurable: true
  },
  {
    id: 'notifications',
    type: 'notifications',
    name: 'Notifications',
    description: 'System notifications and alerts',
    icon: <FileText className="h-5 w-5" />,
    category: 'system',
    defaultConfig: { title: 'Notifications', limit: 5, autoRefresh: true },
    configurable: true
  },
  {
    id: 'calendar',
    type: 'calendar',
    name: 'Calendar',
    description: 'Upcoming events and schedules',
    icon: <Calendar className="h-5 w-5" />,
    category: 'system',
    defaultConfig: { title: 'Calendar', view: 'week' },
    configurable: true
  }
];

interface WidgetLibraryProps {
  onAddWidget: (widgetType: string, config: WidgetConfig) => void;
  onClose: () => void;
}

export function WidgetLibrary({ onAddWidget, onClose }: WidgetLibraryProps) {
  const [selectedWidget, setSelectedWidget] = useState<WidgetTemplate | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({});
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['analytics', 'production', 'quality', 'orders', 'system'] as const;

  const filteredWidgets = WIDGET_TEMPLATES.filter(widget =>
    widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    widget.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddWidget = () => {
    if (selectedWidget) {
      const finalConfig = {
        ...selectedWidget.defaultConfig,
        ...widgetConfig
      };
      onAddWidget(selectedWidget.type, finalConfig);
      onClose();
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      analytics: 'bg-blue-100 text-blue-800',
      production: 'bg-green-100 text-green-800',
      quality: 'bg-yellow-100 text-yellow-800',
      orders: 'bg-purple-100 text-purple-800',
      system: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.system;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Widget Library</DialogTitle>
          <DialogDescription>
            Browse and add widgets to customize your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Widget Browser */}
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <Input
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <Tabs defaultValue="analytics" className="flex-1 overflow-hidden">
              <TabsList className="grid grid-cols-5 w-full">
                {categories.map(category => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="capitalize"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map(category => (
                <TabsContent 
                  key={category} 
                  value={category}
                  className="flex-1 overflow-y-auto mt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredWidgets
                      .filter(widget => widget.category === category)
                      .map(widget => (
                      <Card
                        key={widget.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedWidget?.id === widget.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => {
                          setSelectedWidget(widget);
                          setWidgetConfig(widget.defaultConfig);
                        }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {widget.icon}
                              <CardTitle className="text-sm">{widget.name}</CardTitle>
                            </div>
                            <Badge className={getCategoryColor(widget.category)}>
                              {widget.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-xs">
                            {widget.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Widget Configuration */}
          <div className="w-80 border-l pl-6 flex flex-col">
            {selectedWidget ? (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedWidget.icon}
                    <h3 className="font-semibold">{selectedWidget.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedWidget.description}
                  </p>
                </div>

                {selectedWidget.configurable && (
                  <div className="space-y-4 flex-1">
                    <div>
                      <Label htmlFor="widget-title">Widget Title</Label>
                      <Input
                        id="widget-title"
                        value={widgetConfig.title || selectedWidget.defaultConfig.title}
                        onChange={(e) => setWidgetConfig({
                          ...widgetConfig,
                          title: e.target.value
                        })}
                      />
                    </div>

                    {/* Additional configuration options based on widget type */}
                    {selectedWidget.type === 'recent-orders' && (
                      <div>
                        <Label htmlFor="order-limit">Number of Orders</Label>
                        <Input
                          id="order-limit"
                          type="number"
                          min="1"
                          max="20"
                          value={widgetConfig.limit || selectedWidget.defaultConfig.limit}
                          onChange={(e) => setWidgetConfig({
                            ...widgetConfig,
                            limit: parseInt(e.target.value)
                          })}
                        />
                      </div>
                    )}

                    {selectedWidget.type === 'production-chart' && (
                      <div>
                        <Label htmlFor="chart-period">Time Period</Label>
                        <select
                          id="chart-period"
                          className="w-full p-2 border rounded"
                          value={widgetConfig.period || selectedWidget.defaultConfig.period}
                          onChange={(e) => setWidgetConfig({
                            ...widgetConfig,
                            period: e.target.value
                          })}
                        >
                          <option value="1d">Last 24 Hours</option>
                          <option value="7d">Last 7 Days</option>
                          <option value="30d">Last 30 Days</option>
                          <option value="90d">Last 90 Days</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t">
                  <Button onClick={handleAddWidget} className="w-full">
                    Add Widget to Dashboard
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a widget to configure and add to your dashboard
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}