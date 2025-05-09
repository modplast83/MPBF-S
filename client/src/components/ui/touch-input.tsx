import * as React from "react"

import { cn } from "@/lib/utils"

// Modified version of the input component with touch-friendly sizes and padding
// Create a new interface that extends HTMLInputAttributes but excludes the size property
type InputHTMLAttributesWithoutSize = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

export interface InputProps
  extends InputHTMLAttributesWithoutSize {
  size?: "default" | "lg" | "sm"; // Added different size options
}

const TouchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "default", ...props }, ref) => {
    // Size-based classes
    const sizeClasses = {
      default: "h-10 py-2 px-3",
      sm: "h-9 py-1 px-3 text-sm",
      lg: "h-12 py-3 px-4 text-lg",
    };
    
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-md border border-input bg-background touch-manipulation",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
TouchInput.displayName = "TouchInput"

export { TouchInput }