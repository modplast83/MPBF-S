import * as React from "react"
import { motion } from "framer-motion"
import { Button, ButtonProps, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
  withSpinner?: boolean
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, variant, size, isLoading = false, loadingText, withSpinner = true, children, ...props }, ref) => {
    return (
      <Button
        className={cn(
          buttonVariants({ variant, size, className }),
          isLoading && "relative cursor-not-allowed"
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && withSpinner && (
          <motion.span 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.span>
        )}
        
        <span className={cn(isLoading && withSpinner && "invisible")}>
          {isLoading && loadingText ? loadingText : children}
        </span>
      </Button>
    )
  }
)

LoadingButton.displayName = "LoadingButton"

export { LoadingButton }