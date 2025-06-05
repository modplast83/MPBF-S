import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Calendar, TrendingUp, Award } from "lucide-react";

interface ProgressStats {
  completedToday: number;
  totalScheduled: number;
  streak: number;
  efficiency: number;
  upcomingDue: number;
  overdue: number;
}

interface ProgressTrackerProps {
  stats: ProgressStats;
  onMilestoneReached?: (milestone: string, data: any) => void;
}

export function ProgressTracker({ stats, onMilestoneReached }: ProgressTrackerProps) {
  const [previousStats, setPreviousStats] = useState<ProgressStats>(stats);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    // Check for milestones when stats change
    if (stats.completedToday > previousStats.completedToday) {
      checkMilestones(stats, previousStats);
    }
    setPreviousStats(stats);
    setAnimationKey(prev => prev + 1);
  }, [stats, previousStats, onMilestoneReached]);

  const checkMilestones = (current: ProgressStats, previous: ProgressStats) => {
    // Streak milestones
    if (current.streak > 0 && current.streak % 5 === 0 && current.streak > previous.streak) {
      onMilestoneReached?.("streak_achieved", {
        title: `${current.streak} Day Streak!`,
        subtitle: "Consistency Champion",
        description: "You're building excellent maintenance habits!",
        stats: [
          { label: "Current Streak", value: current.streak },
          { label: "Tasks Completed", value: current.completedToday }
        ],
        achievementLevel: current.streak >= 20 ? "gold" : current.streak >= 10 ? "silver" : "bronze"
      });
    }

    // Daily completion milestones
    if (current.completedToday >= current.totalScheduled && current.totalScheduled > 0) {
      onMilestoneReached?.("perfect_score", {
        title: "Perfect Day!",
        subtitle: "All Tasks Completed",
        description: "Outstanding work! You've completed all scheduled maintenance tasks.",
        stats: [
          { label: "Completed", value: current.completedToday },
          { label: "Efficiency", value: `${current.efficiency}%` }
        ],
        achievementLevel: "gold"
      });
    }

    // Efficiency milestones
    if (current.efficiency >= 95 && previous.efficiency < 95) {
      onMilestoneReached?.("milestone_reached", {
        title: "Efficiency Master!",
        subtitle: "95%+ Task Completion",
        description: "Your maintenance efficiency is exceptional!",
        stats: [
          { label: "Efficiency", value: `${current.efficiency}%` },
          { label: "Completed", value: current.completedToday }
        ],
        achievementLevel: "platinum"
      });
    }
  };

  const completionPercentage = stats.totalScheduled > 0 
    ? Math.round((stats.completedToday / stats.totalScheduled) * 100)
    : 0;

  const getStreakBadgeColor = () => {
    if (stats.streak >= 20) return "bg-gradient-to-r from-yellow-400 to-orange-500";
    if (stats.streak >= 10) return "bg-gradient-to-r from-gray-300 to-gray-500";
    if (stats.streak >= 5) return "bg-gradient-to-r from-amber-600 to-orange-600";
    return "bg-gradient-to-r from-green-400 to-blue-500";
  };

  const getEfficiencyColor = () => {
    if (stats.efficiency >= 95) return "text-green-600";
    if (stats.efficiency >= 80) return "text-blue-600";
    if (stats.efficiency >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Daily Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stats.completedToday} of {stats.totalScheduled}</span>
              <motion.span 
                key={`completion-${animationKey}`}
                initial={{ scale: 1.5, color: "#10b981" }}
                animate={{ scale: 1, color: "#374151" }}
                transition={{ duration: 0.3 }}
                className="font-semibold"
              >
                {completionPercentage}%
              </motion.span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Streak Counter */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Completion Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <motion.div 
              key={`streak-${animationKey}`}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold"
            >
              {stats.streak}
            </motion.div>
            <Badge className={`${getStreakBadgeColor()} text-white border-0`}>
              <Award className="w-3 h-3 mr-1" />
              {stats.streak >= 20 ? "Legend" : stats.streak >= 10 ? "Expert" : stats.streak >= 5 ? "Pro" : "Rising"}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">consecutive days</p>
        </CardContent>
      </Card>

      {/* Efficiency Rating */}
      <Card>
        <CardHeader className="flex flex-col space-y-1.5 p-6 pb-2 pl-[15px] pr-[15px]">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            key={`efficiency-${animationKey}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`text-2xl font-bold ${getEfficiencyColor()}`}
          >
            {stats.efficiency}%
          </motion.div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.efficiency >= 95 ? "Exceptional" : 
             stats.efficiency >= 80 ? "Excellent" :
             stats.efficiency >= 60 ? "Good" : "Needs Improvement"}
          </p>
        </CardContent>
      </Card>

      {/* Upcoming & Overdue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Schedule Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Upcoming</span>
              <span className="font-semibold text-blue-600">{stats.upcomingDue}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Overdue</span>
              <motion.span 
                key={`overdue-${animationKey}`}
                initial={{ scale: stats.overdue > previousStats.overdue ? 1.3 : 1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`font-semibold ${stats.overdue > 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {stats.overdue}
              </motion.span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Achievement definitions for different milestones
export const ACHIEVEMENT_LEVELS = {
  TASK_COMPLETION: {
    1: { title: "First Step", level: "bronze" },
    5: { title: "Getting Started", level: "bronze" },
    10: { title: "Momentum Builder", level: "silver" },
    25: { title: "Task Master", level: "gold" },
    50: { title: "Maintenance Pro", level: "platinum" }
  },
  STREAK: {
    3: { title: "Consistency", level: "bronze" },
    7: { title: "Week Warrior", level: "silver" },
    14: { title: "Fortnight Champion", level: "gold" },
    30: { title: "Month Master", level: "platinum" }
  },
  EFFICIENCY: {
    80: { title: "Efficient", level: "bronze" },
    90: { title: "Highly Efficient", level: "silver" },
    95: { title: "Excellence", level: "gold" },
    100: { title: "Perfection", level: "platinum" }
  }
};