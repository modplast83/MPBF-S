import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  Target
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import type { SmsMessage } from "shared/schema";

interface SmsAnalyticsProps {
  messages: SmsMessage[];
}

export function SmsAnalytics({ messages }: SmsAnalyticsProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    // Total counts
    const totalMessages = messages.length;
    const deliveredMessages = messages.filter(m => m.status === "delivered").length;
    const failedMessages = messages.filter(m => m.status === "failed").length;
    const pendingMessages = messages.filter(m => m.status === "pending").length;

    // Delivery rate
    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;

    // Recent messages (last 7 days)
    const recentMessages = messages.filter(m => 
      m.sentAt && isWithinInterval(new Date(m.sentAt), { start: last7Days, end: now })
    );

    // Messages by category
    const messagesByCategory = messages.reduce((acc, message) => {
      acc[message.category] = (acc[message.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Messages by priority
    const messagesByPriority = messages.reduce((acc, message) => {
      acc[message.priority] = (acc[message.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Messages by day (last 7 days)
    const messagesByDay = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const dayMessages = messages.filter(m => 
        m.sentAt && isWithinInterval(new Date(m.sentAt), { 
          start: startOfDay(date), 
          end: endOfDay(date) 
        })
      );
      return {
        date: format(date, "MMM dd"),
        total: dayMessages.length,
        delivered: dayMessages.filter(m => m.status === "delivered").length,
        failed: dayMessages.filter(m => m.status === "failed").length,
      };
    });

    // Unique recipients
    const uniqueRecipients = new Set(messages.map(m => m.recipientPhone)).size;

    // Average retry count
    const totalRetries = messages.reduce((sum, m) => sum + (m.retryCount || 0), 0);
    const averageRetries = totalMessages > 0 ? totalRetries / totalMessages : 0;

    return {
      totalMessages,
      deliveredMessages,
      failedMessages,
      pendingMessages,
      deliveryRate,
      recentMessages: recentMessages.length,
      messagesByCategory,
      messagesByPriority,
      messagesByDay,
      uniqueRecipients,
      averageRetries,
    };
  }, [messages]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "production":
        return <BarChart3 className="h-4 w-4" />;
      case "quality":
        return <CheckCircle className="h-4 w-4" />;
      case "maintenance":
        return <AlertTriangle className="h-4 w-4" />;
      case "hr":
        return <Users className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "normal":
        return "text-blue-600 bg-blue-50";
      case "low":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">SMS Analytics</h3>
        <p className="text-sm text-gray-500">Overview of SMS messaging performance and statistics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages}</div>
            <div className="text-xs text-gray-500">
              {analytics.recentMessages} in last 7 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.deliveryRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">
              {analytics.deliveredMessages} delivered
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.failedMessages}</div>
            <div className="text-xs text-gray-500">
              {analytics.pendingMessages} pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Unique Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueRecipients}</div>
            <div className="text-xs text-gray-500">
              {analytics.averageRetries.toFixed(1)} avg retries
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Messages by Category
          </CardTitle>
          <CardDescription>Distribution of messages across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(analytics.messagesByCategory).map(([category, count]) => (
              <div key={category} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getCategoryIcon(category)}
                </div>
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-xs text-gray-500 capitalize">{category}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messages by Priority */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Messages by Priority
          </CardTitle>
          <CardDescription>Priority distribution of sent messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.messagesByPriority).map(([priority, count]) => (
              <div key={priority} className={`p-3 rounded-lg border ${getPriorityColor(priority)}`}>
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-sm capitalize">{priority}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Message Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Message Trend (Last 7 Days)
          </CardTitle>
          <CardDescription>Message delivery trends over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.messagesByDay.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm font-medium w-16">{day.date}</div>
                <div className="flex-1 mx-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${day.total > 0 ? (day.delivered / day.total) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 w-12">
                      {day.total > 0 ? `${((day.delivered / day.total) * 100).toFixed(0)}%` : "0%"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span>{day.delivered}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                    <span>{day.failed}</span>
                  </div>
                  <div className="font-medium">{day.total}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.deliveryRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Overall Success Rate</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalMessages > 0 ? (analytics.totalMessages / 30).toFixed(1) : "0"}
              </div>
              <div className="text-sm text-gray-500">Messages per Day (30d avg)</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.averageRetries.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">Average Retry Count</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics.totalMessages === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No SMS Data Available</h3>
            <p className="text-gray-500 text-center">
              Start sending SMS messages to see analytics and insights here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}