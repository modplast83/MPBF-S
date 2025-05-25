import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ButtonPulse - Creates a pulsing effect when clicked
 */
export const ButtonPulse = ({ 
  children, 
  onClick, 
  className = "",
  ...props 
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & { 
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
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
    <motion.button
      className={`relative ${className}`}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      // Explicitly cast props to avoid type conflicts with motion props
      {...(props as any)}
    >
      {isPulsing && (
        <motion.span
          className="absolute inset-0 rounded-md bg-primary-400 opacity-30"
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      {children}
    </motion.button>
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
 * FadeIn - Simple fade-in animation for elements
 */
export const FadeIn = ({ 
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

/**
 * Tooltip - Interactive tooltip that appears on hover
 */
export const AnimatedTooltip = ({ 
  children, 
  content,
  direction = "top",
  className = ""
}: { 
  children: React.ReactNode;
  content: React.ReactNode;
  direction?: "top" | "bottom" | "left" | "right";
  className?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Direction-based positioning
  const getPosition = () => {
    switch (direction) {
      case "top": return { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: "8px" };
      case "bottom": return { top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px" };
      case "left": return { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: "8px" };
      case "right": return { left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: "8px" };
    }
  };
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute z-50 bg-secondary-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap"
            style={getPosition()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {content}
            <div 
              className={`absolute w-2 h-2 bg-secondary-900 transform rotate-45 ${
                direction === "top" ? "top-full -translate-x-1/2 -mt-1 left-1/2" :
                direction === "bottom" ? "bottom-full -translate-x-1/2 -mb-1 left-1/2" :
                direction === "left" ? "left-full -translate-y-1/2 -ml-1 top-1/2" :
                "right-full -translate-y-1/2 -mr-1 top-1/2"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * NotificationBadge - Animated notification badge
 */
export const NotificationBadge = ({ count = 0 }: { count?: number }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (count > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);
  
  if (count === 0) return null;
  
  return (
    <motion.div
      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-xs"
      initial={{ scale: 0 }}
      animate={{ 
        scale: isAnimating ? [1, 1.2, 1] : 1,
      }}
      transition={{ 
        duration: isAnimating ? 0.3 : 0.2,
        times: [0, 0.5, 1]
      }}
    >
      {count}
    </motion.div>
  );
};

/**
 * ShimmerEffect - Creates a shimmer loading effect
 */
export const ShimmerEffect = ({ 
  width = "100%", 
  height = "16px",
  className = ""
}: { 
  width?: string | number;
  height?: string | number;
  className?: string;
}) => {
  return (
    <div 
      className={`relative overflow-hidden bg-gray-200 rounded ${className}`}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
        animate={{ x: ["0%", "200%"] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
    </div>
  );
};

/**
 * ExpandingCard - Card that expands when clicked
 */
export const ExpandingCard = ({ 
  title, 
  children,
  className = "",
  initiallyExpanded = false
}: { 
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  initiallyExpanded?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <motion.button
        className="w-full px-4 py-3 flex justify-between items-center bg-secondary-50"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
      >
        <span className="font-medium">{title}</span>
        <motion.span
          className="material-icons"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          expand_more
        </motion.span>
      </motion.button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * HoverCard - Card with hover effects
 */
export const HoverCard = ({ 
  children,
  className = ""
}: { 
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden ${className}`}
      whileHover={{ 
        y: -5,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        borderColor: "rgba(59, 130, 246, 0.5)"
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

/**
 * PageTransition - Transition animation for page changes
 */
export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Confetti - Simple confetti animation for celebrations
 */
export const Confetti = ({ 
  isActive, 
  duration = 2000,
  particleCount = 30
}: { 
  isActive: boolean;
  duration?: number;
  particleCount?: number;
}) => {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; size: number; }[]>([]);
  
  useEffect(() => {
    if (isActive) {
      const colors = ['#FF5252', '#FFD740', '#69F0AE', '#448AFF', '#E040FB'];
      const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4
      }));
      
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, duration, particleCount]);
  
  if (!isActive && particles.length === 0) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute top-0 rounded-full"
          style={{ 
            left: `${particle.x}%`, 
            width: particle.size, 
            height: particle.size, 
            backgroundColor: particle.color 
          }}
          initial={{ y: -20 }}
          animate={{ y: '100vh' }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            ease: [0.1, 0.25, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
};