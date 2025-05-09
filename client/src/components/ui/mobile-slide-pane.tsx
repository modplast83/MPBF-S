import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileSlideProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  padding?: boolean;
}

export function MobileSlidePane({
  title,
  isOpen,
  onClose,
  children,
  className,
  showBackButton = false,
  onBack,
  padding = true
}: MobileSlideProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  // Mount the component with a slight delay to allow for animation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setMounted(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  // If not mobile, return children directly
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 transform transition-all duration-300 ease-in-out',
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        !isOpen && !mounted && 'pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/50 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      
      {/* Content pane */}
      <div 
        className={cn(
          'fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2" 
                onClick={onBack || onClose}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-lg font-medium">{title}</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Scrollable content */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className={padding ? 'p-4' : undefined}>
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}