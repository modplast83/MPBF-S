import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductionHealthOverview } from '@/components/ui/production-health-indicator';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { HealthStatus } from '@/components/ui/production-health-indicator';

// Helper function to calculate production health based on real data
// This would be connected to actual data in a production environment
const calculateLineHealthStatus = (healthPercentage: number): HealthStatus => {
  if (healthPercentage >= 90) return 'optimal';
  if (healthPercentage >= 75) return 'normal';
  if (healthPercentage >= 50) return 'warning';
  if (healthPercentage > 0) return 'critical';
  return 'inactive';
};

// Helper to get description based on status
const getStatusDescription = (status: HealthStatus, t: any): string => {
  switch (status) {
    case 'optimal':
      return t('production.health.running_smoothly');
    case 'normal':
      return t('production.health.running_smoothly');
    case 'warning':
      return t('production.health.minor_issues');
    case 'critical':
      return t('production.health.attention_needed');
    case 'inactive':
      return t('production.health.maintenance_required');
    default:
      return '';
  }
};

export function ProductionHealthDashboard() {
  const { t } = useTranslation();
  const [healthData, setHealthData] = useState<{
    extrusion: number;
    printing: number;
    cutting: number;
    warehouse: number;
  }>({
    extrusion: 85,
    printing: 92,
    cutting: 78,
    warehouse: 95
  });
  
  // Simulate changing health data (for demo purposes)
  // In a real app, this would come from an API or WebSocket
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthData(prev => ({
        extrusion: Math.min(100, Math.max(30, prev.extrusion + (Math.random() * 10 - 5))),
        printing: Math.min(100, Math.max(30, prev.printing + (Math.random() * 10 - 5))),
        cutting: Math.min(100, Math.max(30, prev.cutting + (Math.random() * 10 - 5))),
        warehouse: Math.min(100, Math.max(30, prev.warehouse + (Math.random() * 10 - 5)))
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Prepare sections for the health overview
  const healthSections = [
    {
      name: t('production.health.extrusion_line'),
      status: calculateLineHealthStatus(healthData.extrusion),
      details: getStatusDescription(calculateLineHealthStatus(healthData.extrusion), t)
    },
    {
      name: t('production.health.printing_line'),
      status: calculateLineHealthStatus(healthData.printing),
      details: getStatusDescription(calculateLineHealthStatus(healthData.printing), t)
    },
    {
      name: t('production.health.cutting_line'),
      status: calculateLineHealthStatus(healthData.cutting),
      details: getStatusDescription(calculateLineHealthStatus(healthData.cutting), t)
    },
    {
      name: t('production.health.warehouse'),
      status: calculateLineHealthStatus(healthData.warehouse),
      details: getStatusDescription(calculateLineHealthStatus(healthData.warehouse), t)
    }
  ];
  
  // Calculate overall system health
  const overallHealth = (healthData.extrusion + healthData.printing + healthData.cutting + healthData.warehouse) / 4;
  const overallHealthStatus = calculateLineHealthStatus(overallHealth);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>{t('production.health.title')}</CardTitle>
        <CardDescription>{t('production.health.overview')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">{t('common.status')}: {Math.round(overallHealth)}%</h4>
            <p className="text-xs text-muted-foreground">
              {getStatusDescription(overallHealthStatus, t)}
            </p>
          </div>
          <motion.div 
            className="h-2 bg-muted rounded-full overflow-hidden w-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={`h-full ${
                overallHealthStatus === 'optimal' ? 'bg-green-500' :
                overallHealthStatus === 'normal' ? 'bg-blue-500' :
                overallHealthStatus === 'warning' ? 'bg-amber-500' :
                overallHealthStatus === 'critical' ? 'bg-red-500' :
                'bg-gray-400'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${overallHealth}%` }}
              transition={{ 
                duration: 0.8,
                ease: "easeOut"
              }}
            />
          </motion.div>
        </div>
        
        <ProductionHealthOverview sections={healthSections} />
      </CardContent>
    </Card>
  );
}