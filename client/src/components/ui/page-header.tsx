import React from 'react';
import { H1 } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
  className,
}) => {
  const { isRTL } = useLanguage();

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-3`}>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <span className="material-icons text-xl">{icon}</span>
          </div>
        )}
        <div>
          <H1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</H1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
};

// Also provide a default export for backward compatibility
export default PageHeader;