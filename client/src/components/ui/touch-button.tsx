import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { buttonVariants as originalButtonVariants } from "./button"
import { cn } from "@/lib/utils"

// Modified version of the button component with touch-friendly sizes and improvements
const touchButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5", // Slightly larger than standard
        sm: "h-10 rounded-md px-4 py-2", // Slightly larger than standard
        lg: "h-13 rounded-md px-8 py-3", // Larger for easier touch
        xl: "h-14 rounded-md px-10 py-3.5 text-base", // Extra large for prominent actions
        icon: "h-11 w-11", // Larger than standard
        "icon-sm": "h-10 w-10", // Minimum recommended touch target
        "icon-lg": "h-13 w-13", // Larger icon
        "icon-round": "h-12 w-12 rounded-full", // Round button with good size for touch
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Create a type that combines the original button size variants and our new touch variants
type TouchButtonSize = 
  | "default" 
  | "sm" 
  | "lg" 
  | "xl" 
  | "icon" 
  | "icon-sm" 
  | "icon-lg" 
  | "icon-round";

// Need to omit size from the original VariantProps to avoid type conflicts
type OriginalButtonVariantProps = VariantProps<typeof originalButtonVariants>;
type TouchSizeVariantProps = { size?: TouchButtonSize };

export interface TouchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<OriginalButtonVariantProps, 'size'>,
    TouchSizeVariantProps {
  asChild?: boolean
}

const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(touchButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
TouchButton.displayName = "TouchButton"

export { TouchButton, touchButtonVariants }