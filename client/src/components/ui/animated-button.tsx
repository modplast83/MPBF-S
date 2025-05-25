import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AnimatedButton - Creates a pulsing effect when clicked
 */
export const AnimatedButton = ({ 
  children, 
  onClick, 
  className = "",
  ...props 
}: React.ComponentProps<typeof Button>) => {
  const [isPulsing, setIsPulsing] = useState(false);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPulsing(true);
    if (onClick) {
      onClick(e);
    }
    
    // Reset pulsing state after animation completes
    setTimeout(() => setIsPulsing(false), 300);
  };
  
  return (
    <div className="relative inline-block">
      {isPulsing && (
        <motion.span
          className="absolute inset-0 rounded-md bg-primary-400 opacity-30"
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <Button
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    </div>
  );
};

/**
 * SuccessCheck - Animated checkmark for successful actions
 */
export const SuccessCheck = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div 
      className={`inline-flex items-center justify-center ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <motion.div
        className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </motion.svg>
      </motion.div>
    </motion.div>
  );
};

/**
 * FadeInContent - Simple fade-in animation for elements
 */
export const FadeInContent = ({ 
  children, 
  delay = 0, 
  duration = 0.3,
  className = "" 
}: { 
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
};