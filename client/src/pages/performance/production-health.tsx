import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { 
  ProductionHealthIndicator, 
  ProductionHealthOverview, 
  type HealthStatus
} from '@/components/ui/production-health-indicator';
import { useLanguage } from '@/hooks/use-language';
import { motion } from 'framer-motion';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ResponsiveContainer } from '@/components/ui/responsive-grid';

// Demo data for visualization
const PRODUCTION_LINES = [
  {
    id: 'extrusion',
    name: 'Extrusion Line',
    status: 'normal' as HealthStatus,
    uptime: 92,
    temperature: 180,
    speed: 85,
    output: 78,
    maintenance: {
      last: '2025-04-28',
      next: '2025-05-25',
      status: 'optimal' as HealthStatus
    }
  },
  {
    id: 'printing',
    name: 'Printing Line',
    status: 'optimal' as HealthStatus,
    uptime: 98,
    temperature: 75,
    speed: 90,
    output: 95,
    maintenance: {
      last: '2025-05-02',
      next: '2025-05-30',
      status: 'optimal' as HealthStatus
    }
  },
  {
    id: 'cutting',
    name: 'Cutting Line',
    status: 'warning' as HealthStatus,
    uptime: 76,
    temperature: 68,
    speed: 60,
    output: 72,
    maintenance: {
      last: '2025-05-05',
      next: '2025-05-15',
      status: 'warning' as HealthStatus
    }
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    status: 'optimal' as HealthStatus,
    uptime: 99,
    temperature: 22,
    speed: null,
    output: 90,
    maintenance: {
      last: '2025-04-15',
      next: '2025-06-15',
      status: 'normal' as HealthStatus
    }
  }
];

// Helper function to get animation variants based on health status
const getAnimationVariants = (status: HealthStatus) => {
  const baseVariants = {
    initial: { opacity: 0, y: 10 }
  };
  
  switch (status) {
    case 'optimal':
      return {
        ...baseVariants,
        animate: { 
          opacity: 1, 
          y: 0, 
          transition: { duration: 0.5, ease: "easeOut" } 
        }
      };
    case 'normal':
      return {
        ...baseVariants,
        animate: { 
          opacity: 1, 
          y: 0, 
          transition: { duration: 0.5, ease: "easeOut", delay: 0.1 } 
        }
      };
    case 'warning':
      return {
        ...baseVariants,
        animate: { 
          opacity: 1, 
          y: 0, 
          // Fixed the type issue with repeatType
          transition: { 
            duration: 0.5, 
            ease: "easeOut", 
            delay: 0.2,
            repeat: 1,
            repeatType: "reverse" as const
          } 
        }
      };
    case 'critical':
      return {
        ...baseVariants,
        animate: { 
          opacity: 1, 
          y: 0, 
          // Fixed the type issue with repeatType
          transition: { 
            duration: 0.5, 
            ease: "easeOut", 
            delay: 0.3,
            repeat: 2,
            repeatType: "reverse" as const
          } 
        }
      };
    default:
      return {
        ...baseVariants,
        animate: { 
          opacity: 1, 
          y: 0, 
          transition: { duration: 0.5, ease: "easeOut", delay: 0.4 } 
        }
      };
  }
};

export default function ProductionHealthPage() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [selectedLine, setSelectedLine] = useState<string>('overview');

  // Convert production lines to sections for the overview
  const healthSections = PRODUCTION_LINES.map(line => ({
    name: t(`production.health.${line.id}_line`) || line.name,
    status: line.status,
    details: `${line.uptime}% ${t('performance.uptime')}`
  }));

  return (
    <ResponsiveContainer maxWidth="xl" padding={true} className="space-y-6">
      <div className={`flex flex-col ${isRTL ? 'rtl' : ''}`}>
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">
          {t('production.health.title')}
        </h1>
        <p className="text-secondary-500 mb-6">
          {t('production.health.page_description') || "Real-time monitoring of production line health and status"}
        </p>

        <TooltipProvider>
          <Tabs 
            defaultValue="overview" 
            value={selectedLine}
            onValueChange={setSelectedLine}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="overview">{t('production.health.overview')}</TabsTrigger>
              {PRODUCTION_LINES.map(line => (
                <TabsTrigger key={line.id} value={line.id}>
                  {t(`production.health.${line.id}_line`) || line.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <ProductionHealthOverview sections={healthSections} className="mb-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('production.health.maintenance_schedule') || "Maintenance Schedule"}</CardTitle>
                    <CardDescription>
                      {t('production.health.upcoming_maintenance') || "Upcoming maintenance for all production lines"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {PRODUCTION_LINES.map((line, index) => (
                        <motion.div 
                          key={line.id}
                          className="flex justify-between items-center p-3 border rounded-md"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                        >
                          <div className="flex items-center space-x-3">
                            <ProductionHealthIndicator 
                              status={line.maintenance.status}
                              label={t(`production.health.${line.id}_line`) || line.name}
                              size="sm"
                              pulseEffect={false}
                              className="p-0"
                            />
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">{t('production.health.next_maintenance') || "Next Maintenance"}: </span>
                            <span className="font-medium">{line.maintenance.next}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('production.health.overall_efficiency') || "Overall Efficiency"}</CardTitle>
                    <CardDescription>
                      {t('production.health.system_performance') || "System performance across all production lines"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {['uptime', 'output', 'temperature'].map((metric, index) => {
                        const avgValue = PRODUCTION_LINES.reduce((sum, line) => {
                          if (metric === 'temperature') {
                            return sum + (line.temperature || 0);
                          } else if (metric === 'output') {
                            return sum + (line.output || 0);
                          }
                          return sum + (line.uptime || 0);
                        }, 0) / PRODUCTION_LINES.length;

                        return (
                          <div key={metric} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                {t(`production.health.${metric}`) || metric.charAt(0).toUpperCase() + metric.slice(1)}
                              </span>
                              <span className="text-sm">
                                {Math.round(avgValue)}
                                {metric === 'temperature' ? '°C' : '%'}
                              </span>
                            </div>
                            <motion.div 
                              className="h-2 bg-gray-100 rounded-full overflow-hidden"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 0.5, delay: index * 0.2 }}
                            >
                              <motion.div 
                                className={`h-full ${
                                  avgValue > 85 ? 'bg-green-500' : 
                                  avgValue > 70 ? 'bg-blue-500' : 
                                  avgValue > 50 ? 'bg-amber-500' : 
                                  'bg-red-500'
                                }`}
                                initial={{ width: '0%' }}
                                animate={{ width: `${avgValue}%` }}
                                transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                              />
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {PRODUCTION_LINES.map(line => (
              <TabsContent key={line.id} value={line.id} className="mt-0">
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{t(`production.health.${line.id}_line`) || line.name}</CardTitle>
                        <CardDescription>
                          {t('production.health.current_status') || "Current operational status"}
                        </CardDescription>
                      </div>
                      <ProductionHealthIndicator 
                        status={line.status}
                        label={t(`production.health.${line.status}`) || line.status}
                        className="p-0"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { key: 'uptime', value: `${line.uptime}%`, icon: 'online_prediction' },
                        { key: 'temperature', value: `${line.temperature}°C`, icon: 'thermostat' },
                        { key: 'output', value: `${line.output}%`, icon: 'speed' },
                        { key: 'last_maintenance', value: line.maintenance.last, icon: 'engineering' }
                      ].map((item, index) => (
                        <motion.div 
                          key={item.key}
                          className="border rounded-lg p-4 flex flex-col"
                          variants={getAnimationVariants(line.status)}
                          initial="initial"
                          animate="animate"
                        >
                          <div className="flex items-center mb-2">
                            <span className="material-icons text-secondary-500 mr-2">{item.icon}</span>
                            <span className="text-sm text-secondary-500">
                              {t(`production.health.${item.key}`) || item.key.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-xl font-semibold">{item.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('production.health.maintenance_info') || "Maintenance Information"}</CardTitle>
                    <CardDescription>
                      {t('production.health.line_maintenance_schedule') || "Line maintenance schedule and history"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">{t('production.health.last_maintenance') || "Last Maintenance"}</h3>
                        <div className="text-xl font-semibold">{line.maintenance.last}</div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">{t('production.health.next_maintenance') || "Next Maintenance"}</h3>
                        <div className="text-xl font-semibold">{line.maintenance.next}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TooltipProvider>
      </div>
    </ResponsiveContainer>
  );
}