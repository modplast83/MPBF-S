
import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function PageHeader({
  heading,
  text,
  children,
  className,
  gradient = false,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-8 mb-8",
      "bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30",
      "border border-gray-200/50 shadow-sm",
      "animate-slide-in-up",
      className
    )} {...props}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          {children && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              {children}
            </div>
          )}
          <div className="flex-1">
            <h1 className={cn(
              "text-3xl font-bold tracking-tight",
              gradient 
                ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent"
                : "text-gray-900"
            )}>
              {heading}
            </h1>
            {text && (
              <p className="mt-2 text-gray-600 text-lg leading-relaxed max-w-3xl">
                {text}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full blur-2xl" />
    </div>
  );
}

/* CSS for grid pattern - add this to your index.css if not already present */
const gridPatternCSS = `
.bg-grid-pattern {
  background-image: radial-gradient(circle, #000 1px, transparent 1px);
  background-size: 20px 20px;
}
`;
