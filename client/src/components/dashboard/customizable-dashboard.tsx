import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { WidgetCustomizer } from './widget-customizer';
import { ActiveOrdersTable } from './active-orders-table';
import { PerformanceHealth } from './performance-health';
import { ProductionChart } from './production-chart';
import { RecentOrders } from './recent-orders';
import { QualityMetricsWidget } from './quality-metrics-widget';
import { ProductivityWidget } from './productivity-widget';
import { QualityViolationsWidget } from './quality-violations-widget';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import {
  ArrowUpRight,
  BarChart4,
  Boxes,
  ClipboardCheck,
  Factory,
  FileCheck,
  LayoutDashboard,
  LineChart,
  PlusCircle,
  ShieldAlert,
  Truck
} from 'lucide-react';

interface WidgetSettings {
  enabled: boolean;
  position: number;
  size?: 'small' | 'medium' | 'large';
}

type UserWidgetPreferences = Record<string, WidgetSettings>;

// Widget sizes to CSS classes mapping
const WIDGET_SIZE_CLASSES = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-1 md:col-span-4'
};

export function CustomizableDashboard() {
  const { t } = useTranslation();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Initialize widget preferences from localStorage or defaults
  const [widgetPreferences, setWidgetPreferences] = useState<UserWidgetPreferences>(() => {
    const savedPreferences = localStorage.getItem('dashboardWidgetSettings');
    return savedPreferences ? JSON.parse(savedPreferences) : {};
  });

  useEffect(() => {
    // Load user preferences from localStorage when component mounts
    const savedPreferences = localStorage.getItem('dashboardWidgetSettings');
    if (savedPreferences) {
      setWidgetPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  // Handle widget settings changes
  const handleWidgetSettingsChange = (newSettings: UserWidgetPreferences) => {
    setWidgetPreferences(newSettings);
    localStorage.setItem('dashboardWidgetSettings', JSON.stringify(newSettings));
  };

  // Filter and sort widgets based on user preferences
  const getWidgetOrder = () => {
    const enabledWidgets = Object.entries(widgetPreferences)
      .filter(([_, settings]) => settings.enabled)
      .sort((a, b) => a[1].position - b[1].position)
      .map(([id]) => id);
    
    return enabledWidgets;
  };

  // Get widget size class based on preferences
  const getWidgetSizeClass = (widgetId: string) => {
    const size = widgetPreferences[widgetId]?.size || 'medium';
    return WIDGET_SIZE_CLASSES[size];
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <PageHeader
          heading={t('dashboard.personalized_dashboard')}
          text={t('dashboard.welcome_message', { name: user?.firstName || 'User' })}
        />
        
        <div className="flex items-center mt-4 md:mt-0 gap-2">
          <WidgetCustomizer 
            onSettingsChange={handleWidgetSettingsChange}
            initialSettings={widgetPreferences}
          />
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setLocation('/orders/new')} 
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('dashboard.new_order')}</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <LayoutDashboard className="h-4 w-4" />
            <span>{t('dashboard.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center gap-1">
            <Factory className="h-4 w-4" />
            <span>{t('dashboard.production')}</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-1">
            <FileCheck className="h-4 w-4" />
            <span>{t('dashboard.quality')}</span>
          </TabsTrigger>
          <TabsTrigger value="warehouse" className="flex items-center gap-1">
            <Boxes className="h-4 w-4" />
            <span>{t('dashboard.warehouse')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {getWidgetOrder().map((widgetId) => (
              <div key={widgetId} className={getWidgetSizeClass(widgetId)}>
                {widgetId === 'performance' && <PerformanceHealth />}
                {widgetId === 'orders' && <ActiveOrdersTable />}
                {widgetId === 'quality' && <QualityMetricsWidget />}
                {widgetId === 'production' && <ProductionChart />}
                {widgetId === 'violations' && <QualityViolationsWidget />}
                {widgetId === 'productivity' && <ProductivityWidget />}
              </div>
            ))}
            
            {getWidgetOrder().length === 0 && (
              <div className="col-span-4 border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">{t('dashboard.no_widgets_enabled')}</p>
                <WidgetCustomizer 
                  onSettingsChange={handleWidgetSettingsChange}
                  initialSettings={widgetPreferences}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="production" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-4">
              <ProductionChart />
            </div>
            <div className="col-span-2">
              <ActiveOrdersTable />
            </div>
            <div className="col-span-2">
              <ProductivityWidget />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <QualityMetricsWidget />
            </div>
            <div className="col-span-2">
              <QualityViolationsWidget />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="warehouse" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-4">
              <PerformanceHealth />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}