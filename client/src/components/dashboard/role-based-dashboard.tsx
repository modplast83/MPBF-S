import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { ActiveOrdersTable } from './active-orders-table';
import { PerformanceHealth } from './performance-health';
import { ProductionChart } from './production-chart';
import { RecentOrders } from './recent-orders';
import { QuickActions } from './quick-actions';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import {
  BarChart4,
  BarChartHorizontal,
  Boxes,
  ClipboardCheck,
  Factory,
  FileCheck,
  LayoutDashboard,
  LineChart,
  PencilRuler,
  PlusCircle,
  Settings,
  Truck
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Dashboard views based on different roles
const ROLE_BASED_VIEWS = {
  administrator: ['overview', 'production', 'quality', 'warehouse'],
  supervisor: ['overview', 'production', 'quality'],
  operator: ['production', 'quality'],
  manager: ['overview', 'warehouse', 'quality'],
  default: ['overview', 'production']
};

// Dashboard layout presets
const DASHBOARD_PRESETS = {
  'production-focused': 'Production Focus',
  'quality-focused': 'Quality Focus',
  'warehouse-focused': 'Warehouse Focus',
  'balanced': 'Balanced View'
};

export function RoleBasedDashboard() {
  const { t } = useTranslation();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPreset, setSelectedPreset] = useState('balanced');
  
  // Determine available tabs based on user permissions
  const isAdmin = user?.isAdmin || false;
  const availableTabs = isAdmin ? ROLE_BASED_VIEWS.administrator : ROLE_BASED_VIEWS.default;
  
  // If the active tab isn't available for this role, select the first available tab
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  // Handle preset change
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    toast({
      title: t('dashboard.preset_changed'),
      description: t('dashboard.preset_changed_description', { preset: DASHBOARD_PRESETS[value as keyof typeof DASHBOARD_PRESETS] }),
    });
    
    // Select appropriate tab based on preset
    if (value === 'production-focused' && availableTabs.includes('production')) {
      setActiveTab('production');
    } else if (value === 'quality-focused' && availableTabs.includes('quality')) {
      setActiveTab('quality');
    } else if (value === 'warehouse-focused' && availableTabs.includes('warehouse')) {
      setActiveTab('warehouse');
    }
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-7xl">
      {/* Header Section - Responsive */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-4 lg:mb-6">
        <div className="flex-1 min-w-0">
          <PageHeader
            heading={t('dashboard.personalized_dashboard')}
            text={t('dashboard.welcome_message', { name: user?.firstName || user?.username || 'User' })}
          />
        </div>
        
        {/* Controls Section - Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-2">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-full sm:w-[160px] lg:w-[180px]">
                <SelectValue placeholder={t('dashboard.select_preset')} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DASHBOARD_PRESETS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setLocation('/orders/new')} 
            className="flex items-center justify-center gap-1 order-1 sm:order-2 w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t('dashboard.new_order')}</span>
            <span className="sm:hidden">{t('dashboard.new_order')}</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={availableTabs[0]} value={activeTab} onValueChange={setActiveTab}>
        {/* Responsive Tab Navigation */}
        <div className="mb-4 lg:mb-6">
          <TabsList className={`
            grid w-full gap-1 
            ${availableTabs.length === 2 ? 'grid-cols-2' : 
              availableTabs.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}
            p-1
          `}>
            {availableTabs.includes('overview') && (
              <TabsTrigger value="overview" className="flex items-center justify-center gap-1 p-2 sm:p-3">
                <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{t('dashboard.overview')}</span>
              </TabsTrigger>
            )}
            {availableTabs.includes('production') && (
              <TabsTrigger value="production" className="flex items-center justify-center gap-1 p-2 sm:p-3">
                <Factory className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{t('dashboard.production')}</span>
              </TabsTrigger>
            )}
            {availableTabs.includes('quality') && (
              <TabsTrigger value="quality" className="flex items-center justify-center gap-1 p-2 sm:p-3">
                <ClipboardCheck className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{t('dashboard.quality')}</span>
              </TabsTrigger>
            )}
            {availableTabs.includes('warehouse') && (
              <TabsTrigger value="warehouse" className="flex items-center justify-center gap-1 p-2 sm:p-3">
                <Boxes className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{t('dashboard.warehouse')}</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 space-y-4 lg:space-y-6">
          {/* Quick Actions - Full width at top */}
          <div className="w-full">
            <QuickActions />
          </div>
          
          {/* Responsive Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
            {/* Performance Health - Responsive sizing */}
            <div className={`col-span-1 ${selectedPreset === 'balanced' ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
              <PerformanceHealth />
            </div>
            
            {/* Active Orders - Responsive layout */}
            {(selectedPreset === 'balanced' || selectedPreset === 'production-focused') && (
              <div className="col-span-1 lg:col-span-6">
                <ActiveOrdersTable />
              </div>
            )}
            
            {/* Recent Orders - Only for balanced view */}
            {selectedPreset === 'balanced' && (
              <div className="col-span-1 lg:col-span-6">
                <RecentOrders />
              </div>
            )}
          </div>
          
          {/* Production Chart - Full width for production focus */}
          {selectedPreset === 'production-focused' && (
            <div className="w-full">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    {t('dashboard.production_trends')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductionChart />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="production" className="mt-0 space-y-4 lg:space-y-6">
          {/* Production Chart - Full width responsive */}
          <div className="w-full">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  {t('dashboard.production_trends')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductionChart />
              </CardContent>
            </Card>
          </div>
          
          {/* Production Details Grid - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <div className="order-1">
              <ActiveOrdersTable />
            </div>
            <div className="order-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChartHorizontal className="h-5 w-5 text-primary" />
                    {t('dashboard.productivity_metrics')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{t('dashboard.efficiency')}</span>
                        <span className="text-sm font-medium">87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{t('dashboard.utilization')}</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{t('dashboard.production_target')}</span>
                        <span className="text-sm font-medium">91%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '91%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="mt-0 space-y-4 lg:space-y-6">
          {/* Quality Grid - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <div className="order-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    {t('dashboard.quality_metrics')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border rounded-lg p-3 text-center">
                        <div className="text-lg sm:text-xl font-semibold">93%</div>
                        <div className="text-xs text-muted-foreground">{t('dashboard.pass_rate')}</div>
                      </div>
                      
                      <div className="border rounded-lg p-3 text-center">
                        <div className="text-lg sm:text-xl font-semibold">254</div>
                        <div className="text-xs text-muted-foreground">{t('dashboard.total_checks')}</div>
                      </div>
                      
                      <div className="border rounded-lg p-3 text-center">
                        <div className="text-lg sm:text-xl font-semibold">3</div>
                        <div className="text-xs text-muted-foreground">{t('dashboard.pending_violations')}</div>
                      </div>
                      
                      <div className="border rounded-lg p-3 text-center">
                        <div className="text-lg sm:text-xl font-semibold">12</div>
                        <div className="text-xs text-muted-foreground">{t('dashboard.resolved_violations')}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="order-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    {t('dashboard.recent_quality_inspections')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3 text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1.5 gap-1">
                        <div className="font-medium flex-1 min-w-0">Roll EX-0023-003 Thickness Check</div>
                        <div className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs flex-shrink-0 w-fit">Pass</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Performed by: Ahmad - 23 May, 2025
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3 text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1.5 gap-1">
                        <div className="font-medium flex-1 min-w-0">Roll EX-0022-001 Print Alignment</div>
                        <div className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs flex-shrink-0 w-fit">Fail</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Performed by: Mohammad - 22 May, 2025
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3 text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1.5 gap-1">
                        <div className="font-medium flex-1 min-w-0">Roll EX-0022-002 Color Verification</div>
                        <div className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs flex-shrink-0 w-fit">Pass</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Performed by: Aisha - 22 May, 2025
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="warehouse" className="mt-0 space-y-4 lg:space-y-6">
          {/* Warehouse Inventory Status - Full Width */}
          <div className="w-full">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-primary" />
                  {t('dashboard.inventory_status')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="text-xs text-muted-foreground mb-1">{t('dashboard.raw_materials')}</div>
                    <div className="text-xl sm:text-2xl font-bold">5.2T</div>
                    <div className="text-sm">LDPE, PP, HDPE</div>
                    <div className="flex items-center mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <span className="text-xs ml-2 flex-shrink-0">65%</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="text-xs text-muted-foreground mb-1">{t('dashboard.final_products')}</div>
                    <div className="text-xl sm:text-2xl font-bold">3,245</div>
                    <div className="text-sm">Ready for shipment</div>
                    <div className="flex items-center mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                      <span className="text-xs ml-2 flex-shrink-0">82%</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                    <div className="text-xs text-muted-foreground mb-1">{t('dashboard.shipping')}</div>
                    <div className="text-xl sm:text-2xl font-bold">7</div>
                    <div className="text-sm">Orders ready to ship</div>
                    <div className="flex items-center mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                      <span className="text-xs ml-2 flex-shrink-0">100%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}