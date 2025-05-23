import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type QualityBadgeVariant = 
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info";

const qualityBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive/90 text-destructive-foreground hover:bg-destructive",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        success: 
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        warning:
          "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        info:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface QualityBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: QualityBadgeVariant;
}

/**
 * Custom badge component for the quality module with extended variants
 */
export function QualityBadge({ 
  className, 
  variant = "default", 
  ...props 
}: QualityBadgeProps) {
  return (
    <div className={cn(qualityBadgeVariants({ variant }), className)} {...props} />
  );
}