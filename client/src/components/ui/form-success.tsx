import * as React from "react"
import { motion } from "framer-motion"
import { FiCheckCircle } from "react-icons/fi"
import { cn } from "@/lib/utils"

interface FormSuccessProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

export function FormSuccess({ message, className, ...props }: FormSuccessProps) {
  if (!message) return null

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400",
        className
      )}
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 500 }}
      {...props}
    >
      <FiCheckCircle className="h-4 w-4" />
      <p>{message}</p>
    </motion.div>
  )
}