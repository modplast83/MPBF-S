import * as React from "react"
import { motion } from "framer-motion"
import { FiCheck, FiAlertCircle } from "react-icons/fi"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  status?: "idle" | "valid" | "invalid" | "loading"
  showStatusIcon?: boolean
  animateValidation?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, status = "idle", showStatusIcon = true, animateValidation = true, ...props }, ref) => {
    // Track focus state
    const [isFocused, setIsFocused] = React.useState(false);
    
    // Handle focus and blur
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus && props.onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur && props.onBlur(e);
    };

    // Determine className based on status
    const inputClassName = cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      status === "valid" && "border-green-500 focus-visible:ring-green-500",
      status === "invalid" && "border-red-500 focus-visible:ring-red-500",
      isFocused && animateValidation && "scale-[1.01] transition-transform duration-200",
      status === "valid" && animateValidation && "shadow-[0_0_0_1px_rgba(34,197,94,0.5)]",
      status === "invalid" && animateValidation && "shadow-[0_0_0_1px_rgba(239,68,68,0.5)]",
      isFocused && animateValidation && "shadow-[0_0_0_2px_rgba(59,130,246,0.5)]",
      className
    );

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={type}
          className={inputClassName}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {showStatusIcon && status === "valid" && (
          <motion.div 
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-green-500"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <FiCheck />
          </motion.div>
        )}
        
        {showStatusIcon && status === "invalid" && (
          <motion.div 
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-red-500"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <FiAlertCircle />
          </motion.div>
        )}
        
        {status === "loading" && (
          <motion.div 
            className="absolute top-1/2 right-3 transform -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
