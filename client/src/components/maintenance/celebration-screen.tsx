import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Star, Trophy, Zap, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CelebrationScreenProps {
  isVisible: boolean;
  onClose: () => void;
  type: "task_completed" | "milestone_reached" | "streak_achieved" | "perfect_score";
  data: {
    title: string;
    subtitle?: string;
    description?: string;
    stats?: Array<{ label: string; value: string | number }>;
    achievementLevel?: "bronze" | "silver" | "gold" | "platinum";
  };
}

const celebrationVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 50 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 300,
      duration: 0.6
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    y: -30,
    transition: { duration: 0.3 }
  }
};

const particleVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: [0, 1, 0],
    scale: [0, 1, 0],
    y: [0, -100, -200],
    x: [0, Math.random() * 200 - 100, Math.random() * 300 - 150],
    transition: {
      duration: 2,
      delay: i * 0.1,
      ease: "easeOut"
    }
  })
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export function CelebrationScreen({ isVisible, onClose, type, data }: CelebrationScreenProps) {
  const [particles, setParticles] = useState<number[]>([]);
  
  useEffect(() => {
    if (isVisible) {
      setParticles(Array.from({ length: 20 }, (_, i) => i));
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const getIcon = () => {
    switch (type) {
      case "task_completed":
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case "milestone_reached":
        return <Target className="w-16 h-16 text-blue-500" />;
      case "streak_achieved":
        return <Zap className="w-16 h-16 text-yellow-500" />;
      case "perfect_score":
        return <Trophy className="w-16 h-16 text-yellow-600" />;
      default:
        return <Award className="w-16 h-16 text-purple-500" />;
    }
  };

  const getColors = () => {
    switch (data.achievementLevel) {
      case "bronze":
        return "from-amber-600 to-orange-600";
      case "silver":
        return "from-gray-400 to-gray-600";
      case "gold":
        return "from-yellow-400 to-yellow-600";
      case "platinum":
        return "from-blue-300 to-purple-600";
      default:
        return "from-green-400 to-blue-600";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Animated particles */}
          {particles.map((i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${50 + Math.random() * 20 - 10}%`,
                top: `${50 + Math.random() * 20 - 10}%`,
              }}
              variants={particleVariants}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            </motion.div>
          ))}

          <motion.div
            variants={celebrationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative"
          >
            <Card className="max-w-md w-full mx-auto overflow-hidden">
              {/* Gradient header */}
              <div className={`bg-gradient-to-r ${getColors()} p-6 text-white text-center relative overflow-hidden`}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                                     radial-gradient(circle at 70% 50%, white 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                
                <motion.div
                  variants={pulseVariants}
                  animate="pulse"
                  className="relative z-10"
                >
                  {getIcon()}
                </motion.div>
                
                <motion.h2 
                  className="text-2xl font-bold mt-4 relative z-10"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {data.title}
                </motion.h2>
                
                {data.subtitle && (
                  <motion.p 
                    className="text-white/90 mt-2 relative z-10"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {data.subtitle}
                  </motion.p>
                )}
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                {data.description && (
                  <motion.p 
                    className="text-gray-600 mb-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {data.description}
                  </motion.p>
                )}

                {/* Stats */}
                {data.stats && data.stats.length > 0 && (
                  <motion.div 
                    className="grid grid-cols-2 gap-4 mb-6"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {data.stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Action buttons */}
                <motion.div 
                  className="flex gap-3 justify-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    onClick={onClose}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Continue
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing celebration states
export function useCelebration() {
  const [celebration, setCelebration] = useState<{
    isVisible: boolean;
    type: CelebrationScreenProps["type"];
    data: CelebrationScreenProps["data"];
  }>({
    isVisible: false,
    type: "task_completed",
    data: { title: "" }
  });

  const showCelebration = (
    type: CelebrationScreenProps["type"], 
    data: CelebrationScreenProps["data"]
  ) => {
    setCelebration({
      isVisible: true,
      type,
      data
    });
  };

  const hideCelebration = () => {
    setCelebration(prev => ({ ...prev, isVisible: false }));
  };

  return {
    celebration,
    showCelebration,
    hideCelebration
  };
}