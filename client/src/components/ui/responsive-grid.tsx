import React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number; // Extra small devices (phones)
    sm?: number; // Small devices (small tablets)
    md?: number; // Medium devices (tablets)
    lg?: number; // Large devices (desktops)
    xl?: number; // Extra large devices (large desktops)
  };
  gap?: {
    x?: number;
    y?: number;
  };
  rowGap?: number;
  colGap?: number;
}

export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = { x: 4, y: 4 },
  rowGap,
  colGap,
}: ResponsiveGridProps) {
  // Convert column counts to Tailwind classes
  const colClasses = {
    xs: cols.xs ? `grid-cols-${cols.xs}` : '',
    sm: cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    md: cols.md ? `md:grid-cols-${cols.md}` : '',
    lg: cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    xl: cols.xl ? `xl:grid-cols-${cols.xl}` : '',
  };

  // Calculate gap classes
  const gapX = colGap !== undefined ? colGap : gap.x;
  const gapY = rowGap !== undefined ? rowGap : gap.y;
  
  const gapClasses = [
    gapX !== undefined ? `gap-x-${gapX}` : '',
    gapY !== undefined ? `gap-y-${gapY}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(
      "grid w-full",
      colClasses.xs,
      colClasses.sm,
      colClasses.md,
      colClasses.lg,
      colClasses.xl,
      gapClasses,
      className
    )}>
      {children}
    </div>
  );
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  padding?: boolean | number;
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = true,
}: ResponsiveContainerProps) {
  const isMobile = useIsMobile();
  
  // Convert maxWidth to Tailwind class
  const maxWidthClass = maxWidth === 'none' ? '' : `max-w-${maxWidth}`;
  
  // Calculate padding classes
  let paddingClass = '';
  if (padding === true) {
    paddingClass = isMobile ? 'px-3 py-3' : 'px-6 py-4';
  } else if (typeof padding === 'number') {
    paddingClass = `p-${padding}`;
  }

  return (
    <div className={cn(
      "w-full mx-auto",
      maxWidthClass,
      paddingClass,
      className
    )}>
      {children}
    </div>
  );
}