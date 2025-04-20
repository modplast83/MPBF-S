import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiInfo } from "react-icons/fi"
import { cn } from "@/lib/utils"

interface FormTooltipProps {
  tip: string
  children?: React.ReactNode
  position?: "top" | "bottom" | "left" | "right"
  className?: string
}

export function FormTooltip({ 
  tip, 
  children, 
  position = "top", 
  className 
}: FormTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  
  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
  }
  
  const arrowPositionClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent",
    bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent", 
    left: "left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent",
    right: "right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent"
  }
  
  const arrowBorderClasses = {
    top: "border-t-8 border-l-8 border-r-8 border-b-0",
    bottom: "border-b-8 border-l-8 border-r-8 border-t-0",
    left: "border-l-8 border-t-8 border-b-8 border-r-0",
    right: "border-r-8 border-t-8 border-b-8 border-l-0" 
  }

  return (
    <div 
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <button 
          type="button" 
          className="text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground transition-colors"
          aria-label="More information"
        >
          <FiInfo className="h-4 w-4" />
        </button>
      )}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className={cn(
              "absolute z-50 max-w-xs",
              positionClasses[position]
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-gray-800 text-white rounded-md px-3 py-2 text-sm shadow-md">
              {tip}
            </div>
            <div 
              className={cn(
                "absolute w-0 h-0",  
                arrowBorderClasses[position],
                arrowPositionClasses[position]
              )} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}