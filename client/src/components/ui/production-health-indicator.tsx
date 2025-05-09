import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Badge } from './badge';
import { motion } from 'framer-motion';

export type HealthStatus = 'optimal' | 'normal' | 'warning' | 'critical' | 'inactive';

export interface ProductionHealthIndicatorProps {
  status: HealthStatus;
  label: string;
  description?: string;
  className?: string;
  pulseEffect?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function ProductionHealthIndicator({
  status,
  label,
  description,
  className,
  pulseEffect = true,
  size = 'md',
  onClick
}: ProductionHealthIndicatorProps) {
  const { t } = useTranslation();
  const [animated, setAnimated] = useState(false);

  // Reset animation state when status changes to trigger animation again
  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => setAnimated(true), 10);
    return () => clearTimeout(timer);
  }, [status]);

  // Map status to color
  const getStatusColorClass = () => {
    switch (status) {
      case 'optimal':
        return 'bg-green-500';
      case 'normal':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-red-500';
      case 'inactive':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Map status to translated text
  const getStatusText = () => {
    switch (status) {
      case 'optimal':
        return t('production.health.optimal');
      case 'normal':
        return t('production.health.normal');
      case 'warning':
        return t('production.health.warning');
      case 'critical':
        return t('production.health.critical');
      case 'inactive':
        return t('production.health.inactive');
      default:
        return status;
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2 w-2';
      case 'lg':
        return 'h-4 w-4';
      default: // 'md'
        return 'h-3 w-3';
    }
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-2 rounded-md p-2',
        onClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : '',
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        {/* Main indicator dot */}
        <motion.div
          className={cn(
            'rounded-full',
            getSizeClasses(),
            getStatusColorClass()
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: animated ? 1 : 0.8, 
            opacity: animated ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Pulse effect (only for active statuses) */}
        {pulseEffect && status !== 'inactive' && animated && (
          <motion.div
            className={cn(
              'absolute top-0 left-0 rounded-full',
              getSizeClasses(),
              getStatusColorClass(),
              'opacity-40'
            )}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-gray-500">{description}</span>}
        <Badge variant="outline" className="mt-1 text-xs">
          {getStatusText()}
        </Badge>
      </div>
    </div>
  );
}

export function ProductionHealthOverview({
  sections,
  className
}: {
  sections: {
    name: string;
    status: HealthStatus;
    details?: string;
  }[];
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className={cn('rounded-md border', className)}>
      <div className="border-b p-3 bg-muted/20">
        <h3 className="text-lg font-medium">
          {t('production.health.title') || 'Production Health'}
        </h3>
      </div>
      <div className="p-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sections.map((section, index) => (
          <ProductionHealthIndicator
            key={index}
            status={section.status}
            label={section.name}
            description={section.details}
          />
        ))}
      </div>
    </div>
  );
}