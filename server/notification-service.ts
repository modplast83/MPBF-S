import { NotificationStorage } from "./notification-storage.js";
import { 
  InsertNotification, 
  Notification, 
  NotificationTemplate,
  InsertNotificationTemplate
} from "../shared/schema.js";

export class NotificationService {
  private storage: NotificationStorage;

  constructor() {
    this.storage = new NotificationStorage();
  }

  // Priority levels for ordering
  private priorityOrder = {
    urgent: 5,
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  // Create notification with smart prioritization
  async createNotification(notification: InsertNotification): Promise<Notification> {
    // Auto-set priority based on type and category if not specified
    if (!notification.priority) {
      notification.priority = this.determinePriority(notification.type, notification.category);
    }

    // Set expiration if not specified based on priority
    if (!notification.expiresAt) {
      notification.expiresAt = this.calculateExpiration(notification.priority);
    }

    return await this.storage.createNotification(notification);
  }

  // Create notification from template
  async createFromTemplate(
    templateId: string, 
    variables: Record<string, any>,
    targetUser?: string,
    targetRole?: string
  ): Promise<Notification | null> {
    const template = await this.storage.getNotificationTemplate(templateId);
    if (!template || !template.isActive) {
      return null;
    }

    const notification: InsertNotification = {
      title: this.replaceVariables(template.title, variables),
      message: this.replaceVariables(template.message, variables),
      type: template.type,
      priority: template.priority,
      category: template.category,
      source: `template:${templateId}`,
      userId: targetUser || null,
      userRole: targetRole || null,
      actionRequired: template.actionRequired,
      actionUrl: template.actionUrl ? this.replaceVariables(template.actionUrl, variables) : null,
      metadata: { templateId, variables }
    };

    return await this.createNotification(notification);
  }

  // Broadcast notification to role or all users
  async broadcastNotification(
    notification: Omit<InsertNotification, 'userId'>,
    targetRole?: string
  ): Promise<Notification> {
    return await this.createNotification({
      ...notification,
      userId: null,
      userRole: targetRole || null
    });
  }

  // Get prioritized notifications for user
  async getUserNotifications(
    userId: string,
    userRole?: string,
    filters: {
      category?: string;
      priority?: string;
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    const notifications = await this.storage.getNotifications({
      userId,
      userRole,
      category: filters.category,
      priority: filters.priority,
      isRead: filters.unreadOnly ? false : undefined,
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });

    // Sort by priority and creation time
    return notifications.sort((a, b) => {
      const aPriority = this.priorityOrder[a.priority as keyof typeof this.priorityOrder] || 0;
      const bPriority = this.priorityOrder[b.priority as keyof typeof this.priorityOrder] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: number, userId: string): Promise<boolean> {
    return await this.storage.markAsRead(notificationId, userId);
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string, category?: string): Promise<number> {
    return await this.storage.markAllAsRead(userId, category);
  }

  // Dismiss notification
  async dismissNotification(notificationId: number, userId: string): Promise<boolean> {
    return await this.storage.dismissNotification(notificationId, userId);
  }

  // Archive notification
  async archiveNotification(notificationId: number, userId: string): Promise<boolean> {
    return await this.storage.archiveNotification(notificationId, userId);
  }

  // Get unread count with priority breakdown
  async getUnreadCount(userId: string, userRole?: string): Promise<{
    total: number;
    urgent: number;
    critical: number;
    high: number;
  }> {
    const notifications = await this.storage.getNotifications({
      userId,
      userRole,
      isRead: false,
      isArchived: false
    });

    const counts = {
      total: notifications.length,
      urgent: 0,
      critical: 0,
      high: 0
    };

    notifications.forEach(notification => {
      if (notification.priority === 'urgent') counts.urgent++;
      else if (notification.priority === 'critical') counts.critical++;
      else if (notification.priority === 'high') counts.high++;
    });

    return counts;
  }

  // Get notification statistics
  async getStats(userId: string): Promise<any> {
    return await this.storage.getNotificationStats(userId);
  }

  // Auto-generate notifications based on system events
  async generateSystemNotification(
    event: string,
    data: Record<string, any>,
    targetUsers?: string[],
    targetRoles?: string[]
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    // Find relevant templates for this event
    const templates = await this.storage.getNotificationTemplates();
    const relevantTemplates = templates.filter(
      template => template.triggerEvent === event && template.isActive
    );

    for (const template of relevantTemplates) {
      // Check if conditions are met
      if (this.evaluateConditions(template.conditions, data)) {
        // Create notifications for specified users
        if (targetUsers) {
          for (const userId of targetUsers) {
            const notification = await this.createFromTemplate(
              template.id,
              data,
              userId
            );
            if (notification) notifications.push(notification);
          }
        }

        // Create notifications for specified roles
        if (targetRoles) {
          for (const role of targetRoles) {
            const notification = await this.createFromTemplate(
              template.id,
              data,
              undefined,
              role
            );
            if (notification) notifications.push(notification);
          }
        }

        // If no specific targets, create broadcast notification
        if (!targetUsers && !targetRoles) {
          const notification = await this.createFromTemplate(template.id, data);
          if (notification) notifications.push(notification);
        }
      }
    }

    return notifications;
  }

  // Cleanup expired notifications
  async cleanupExpiredNotifications(): Promise<number> {
    return await this.storage.cleanupExpiredNotifications();
  }

  // Private helper methods
  private determinePriority(type: string, category: string): string {
    // Auto-determine priority based on type and category
    if (type === 'alert' || category === 'quality') return 'high';
    if (type === 'warning' || category === 'maintenance') return 'medium';
    if (type === 'system' || category === 'hr') return 'medium';
    if (category === 'production') return 'high';
    return 'medium';
  }

  private calculateExpiration(priority: string): Date {
    const now = new Date();
    const hours = {
      urgent: 1,    // 1 hour
      critical: 4,  // 4 hours
      high: 24,     // 1 day
      medium: 72,   // 3 days
      low: 168      // 1 week
    };

    const expirationHours = hours[priority as keyof typeof hours] || 72;
    return new Date(now.getTime() + expirationHours * 60 * 60 * 1000);
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    });
    return result;
  }

  private evaluateConditions(conditions: any, data: Record<string, any>): boolean {
    if (!conditions) return true;
    
    try {
      // Simple condition evaluation - can be extended for complex rules
      if (typeof conditions === 'object') {
        return Object.entries(conditions).every(([key, expectedValue]) => {
          return data[key] === expectedValue;
        });
      }
      return true;
    } catch (error) {
      console.error('Error evaluating notification conditions:', error);
      return false;
    }
  }

  // Template management
  async createTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate> {
    return await this.storage.createNotificationTemplate(template);
  }

  async getTemplates(category?: string): Promise<NotificationTemplate[]> {
    return await this.storage.getNotificationTemplates(category);
  }

  async updateTemplate(id: string, updates: Partial<InsertNotificationTemplate>): Promise<boolean> {
    return await this.storage.updateNotificationTemplate(id, updates);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return await this.storage.deleteNotificationTemplate(id);
  }
}

// Singleton instance
export const notificationService = new NotificationService();