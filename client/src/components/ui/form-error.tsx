import * as React from "react"
import { motion } from "framer-motion"
import { FiAlertCircle } from "react-icons/fi"
import { cn } from "@/lib/utils"

interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

export function FormError({ message, className, ...props }: FormErrorProps) {
  if (!message) return null

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400",
        className
      )}
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 500 }}
      {...props}
    >
      <FiAlertCircle className="h-4 w-4" />
      <p>{message}</p>
    </motion.div>
  )
}