import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff, 
  Check, 
  X, 
  Archive, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Filter,
  MoreVertical
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  category: string;
  source: string;
  isRead: boolean;
  isArchived: boolean;
  isDismissed: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
  metadata?: any;
}

interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Array<{ category: string; count: number; unread: number }>;
  byPriority: Array<{ priority: string; count: number; unread: number }>;
}

const priorityConfig = {
  urgent: { color: 'bg-red-600', textColor: 'text-red-600', icon: AlertTriangle },
  critical: { color: 'bg-red-500', textColor: 'text-red-500', icon: AlertCircle },
  high: { color: 'bg-orange-500', textColor: 'text-orange-500', icon: AlertTriangle },
  medium: { color: 'bg-blue-500', textColor: 'text-blue-500', icon: Info },
  low: { color: 'bg-gray-500', textColor: 'text-gray-500', icon: Info }
};

const typeConfig = {
  alert: { icon: AlertTriangle, color: 'text-red-600' },
  warning: { icon: AlertCircle, color: 'text-orange-600' },
  info: { icon: Info, color: 'text-blue-600' },
  success: { icon: CheckCircle, color: 'text-green-600' },
  system: { icon: Info, color: 'text-gray-600' }
};

export function NotificationCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications', { 
      category: selectedCategory || undefined,
      priority: selectedPriority || undefined,
      unreadOnly: showUnreadOnly || undefined
    }],
    enabled: !!user
  });

  // Fetch notification stats
  const { data: stats } = useQuery<NotificationStats>({
    queryKey: ['/api/notifications/stats'],
    enabled: !!user
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/stats'] });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: (category?: string) => 
      apiRequest('/api/notifications/mark-all-read', { 
        method: 'POST',
        body: JSON.stringify({ category })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/stats'] });
    }
  });

  // Dismiss notification mutation
  const dismissMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}/dismiss`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/stats'] });
    }
  });

  // Archive notification mutation
  const archiveMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}/archive`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/stats'] });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getPriorityIcon = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;
    const IconComponent = config.icon;
    return <IconComponent className={`h-4 w-4 ${config.textColor}`} />;
  };

  const getTypeIcon = (type: string) => {
    const config = typeConfig[type as keyof typeof typeConfig];
    if (!config) return null;
    const IconComponent = config.icon;
    return <IconComponent className={`h-4 w-4 ${config.color}`} />;
  };

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (activeTab === 'unread' && notification.isRead) return false;
    if (activeTab === 'archived' && !notification.isArchived) return false;
    if (activeTab === 'action-required' && !notification.actionRequired) return false;
    if (activeTab === 'all' && notification.isArchived) return false;
    return true;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead && !n.isArchived).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notification Center</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSelectedCategory('')}>
                All Categories
              </DropdownMenuItem>
              {stats?.byCategory.map(cat => (
                <DropdownMenuItem 
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                >
                  {cat.category} ({cat.unread})
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedPriority('')}>
                All Priorities
              </DropdownMenuItem>
              {stats?.byPriority.map(pri => (
                <DropdownMenuItem 
                  key={pri.priority}
                  onClick={() => setSelectedPriority(pri.priority)}
                >
                  {pri.priority} ({pri.unread})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={unreadCount === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
                </div>
                <BellOff className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.byPriority.find(p => p.priority === 'high')?.unread || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Action Required</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {notifications.filter((n: Notification) => n.actionRequired && !n.isRead).length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="action-required">
            Action Required
          </TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-sm font-normal text-gray-500">
                  {filteredNotifications.length} notifications
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading notifications...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No notifications found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notification: Notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2 mt-1">
                              {getTypeIcon(notification.type)}
                              {getPriorityIcon(notification.priority)}
                            </div>
                            
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${priorityConfig[notification.priority as keyof typeof priorityConfig]?.textColor}`}
                                >
                                  {notification.priority}
                                </Badge>
                                {notification.actionRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    Action Required
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  {formatDistanceToNow(new Date(notification.createdAt))} ago
                                </span>
                                <span>From: {notification.source}</span>
                                {notification.readAt && (
                                  <span>
                                    Read {formatDistanceToNow(new Date(notification.readAt))} ago
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.isRead && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsReadMutation.mutate(notification.id);
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissMutation.mutate(notification.id);
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Dismiss
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  archiveMutation.mutate(notification.id);
                                }}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}