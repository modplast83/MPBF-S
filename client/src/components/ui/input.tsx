import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
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
    // Animation variants for different states
    const inputVariants = {
      valid: {
        boxShadow: "0 0 0 1px rgba(34, 197, 94, 0.5)",
        borderColor: "rgba(34, 197, 94, 1)",
        transition: { duration: 0.2 }
      },
      invalid: {
        boxShadow: "0 0 0 1px rgba(239, 68, 68, 0.5)",
        borderColor: "rgba(239, 68, 68, 1)",
        transition: { duration: 0.2 }
      },
      focus: {
        scale: 1.01,
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)",
        transition: { duration: 0.2 }
      },
      idle: {
        boxShadow: "none",
        borderColor: "rgba(209, 213, 219, 1)",
        scale: 1,
        transition: { duration: 0.2 }
      }
    };

    // Track focus state
    const [isFocused, setIsFocused] = React.useState(false);
    
    // Determine current animation state
    const currentVariant = isFocused ? "focus" : status === "valid" ? "valid" : status === "invalid" ? "invalid" : "idle";

    // These are the props we want to pass to the standard input element
    const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
      type,
      className: cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        status === "valid" && "border-green-500",
        status === "invalid" && "border-red-500",
        className
      ),
      onFocus: (e) => {
        setIsFocused(true);
        props.onFocus && props.onFocus(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        props.onBlur && props.onBlur(e);
      },
      ...props
    };

    // These are the motion-specific props
    const motionProps: HTMLMotionProps<"input"> = {
      animate: animateValidation ? currentVariant : undefined,
      variants: inputVariants,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    };

    return (
      <div className="relative w-full">
        <motion.input
          ref={ref}
          {...inputProps}
          {...motionProps}
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
