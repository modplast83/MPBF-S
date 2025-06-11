import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  category: string;
  source: string;
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: string;
}

const priorityConfig = {
  urgent: { color: 'text-red-600', bgColor: 'bg-red-600' },
  critical: { color: 'text-red-500', bgColor: 'bg-red-500' },
  high: { color: 'text-orange-500', bgColor: 'bg-orange-500' },
  medium: { color: 'text-blue-500', bgColor: 'bg-blue-500' },
  low: { color: 'text-gray-500', bgColor: 'bg-gray-500' }
};

const typeIcons = {
  alert: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle,
  system: Info
};

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch recent notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications', { limit: 5, unreadOnly: true }],
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds for real-time updates
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!user,
    refetchInterval: 30000
  });

  const getTypeIcon = (type: string) => {
    const IconComponent = typeIcons[type as keyof typeof typeIcons] || Info;
    return IconComponent;
  };

  const getPriorityColor = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig]?.color || 'text-gray-500';
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={5}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="max-h-96">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No new notifications
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification: Notification) => {
                    const IconComponent = getTypeIcon(notification.type);
                    const priorityColor = getPriorityColor(notification.priority);
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-1 mt-0.5">
                            <IconComponent className={`h-4 w-4 ${priorityColor}`} />
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between">
                              <h4 className={`text-sm font-medium leading-tight ${
                                !notification.isRead ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1 ml-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${priorityColor}`}
                                >
                                  {notification.priority}
                                </Badge>
                                {notification.actionRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    Action
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                {formatDistanceToNow(new Date(notification.createdAt))} ago
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {notification.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t">
                <Link href="/notifications">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Notifications ({unreadCount} unread)
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}