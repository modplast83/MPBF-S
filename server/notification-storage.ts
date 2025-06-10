// @ts-nocheck
import { db } from "./db.js";
import { 
  notificationCenter, 
  notificationPreferences, 
  notificationTemplates,
  InsertNotification,
  InsertNotificationPreference,
  InsertNotificationTemplate,
  Notification,
  NotificationPreference,
  NotificationTemplate
} from "../shared/schema.js";
import { eq, and, or, desc, asc, gte, lte, inArray, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

export class NotificationStorage {
  // Notification CRUD Operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notificationCenter).values(notification).returning();
    return created;
  }

  async getNotifications(params: {
    userId?: string;
    userRole?: string;
    category?: string;
    priority?: string;
    isRead?: boolean;
    isArchived?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Notification[]> {
    let query = db.select().from(notificationCenter);
    
    const conditions = [];
    
    if (params.userId) {
      conditions.push(
        or(
          eq(notificationCenter.userId, params.userId),
          isNull(notificationCenter.userId) // Broadcast notifications
        )
      );
    }
    
    if (params.userRole) {
      conditions.push(
        or(
          eq(notificationCenter.userRole, params.userRole),
          isNull(notificationCenter.userRole)
        )
      );
    }
    
    if (params.category) {
      conditions.push(eq(notificationCenter.category, params.category));
    }
    
    if (params.priority) {
      conditions.push(eq(notificationCenter.priority, params.priority));
    }
    
    if (params.isRead !== undefined) {
      conditions.push(eq(notificationCenter.isRead, params.isRead));
    }
    
    if (params.isArchived !== undefined) {
      conditions.push(eq(notificationCenter.isArchived, params.isArchived));
    }

    // Filter out expired notifications
    conditions.push(
      or(
        isNull(notificationCenter.expiresAt),
        gte(notificationCenter.expiresAt, new Date())
      )
    );
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(
      desc(notificationCenter.priority),
      desc(notificationCenter.createdAt)
    );
    
    if (params.limit) {
      query = query.limit(params.limit);
    }
    
    if (params.offset) {
      query = query.offset(params.offset);
    }
    
    return await query;
  }

  async getNotificationById(id: number): Promise<Notification | null> {
    const [notification] = await db
      .select()
      .from(notificationCenter)
      .where(eq(notificationCenter.id, id));
    return notification || null;
  }

  async markAsRead(id: number, userId: string): Promise<boolean> {
    const result = await db
      .update(notificationCenter)
      .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(notificationCenter.id, id),
          or(
            eq(notificationCenter.userId, userId),
            isNull(notificationCenter.userId)
          )
        )
      );
    return result.rowCount > 0;
  }

  async markAllAsRead(userId: string, category?: string): Promise<number> {
    const conditions = [
      or(
        eq(notificationCenter.userId, userId),
        isNull(notificationCenter.userId)
      ),
      eq(notificationCenter.isRead, false)
    ];

    if (category) {
      conditions.push(eq(notificationCenter.category, category));
    }

    const result = await db
      .update(notificationCenter)
      .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
      .where(and(...conditions));
    
    return result.rowCount;
  }

  async dismissNotification(id: number, userId: string): Promise<boolean> {
    const result = await db
      .update(notificationCenter)
      .set({ isDismissed: true, dismissedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(notificationCenter.id, id),
          or(
            eq(notificationCenter.userId, userId),
            isNull(notificationCenter.userId)
          )
        )
      );
    return result.rowCount > 0;
  }

  async archiveNotification(id: number, userId: string): Promise<boolean> {
    const result = await db
      .update(notificationCenter)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(
        and(
          eq(notificationCenter.id, id),
          or(
            eq(notificationCenter.userId, userId),
            isNull(notificationCenter.userId)
          )
        )
      );
    return result.rowCount > 0;
  }

  async getUnreadCount(userId: string, userRole?: string): Promise<number> {
    const conditions = [
      or(
        eq(notificationCenter.userId, userId),
        isNull(notificationCenter.userId)
      ),
      eq(notificationCenter.isRead, false),
      eq(notificationCenter.isArchived, false),
      eq(notificationCenter.isDismissed, false)
    ];

    if (userRole) {
      conditions.push(
        or(
          eq(notificationCenter.userRole, userRole),
          isNull(notificationCenter.userRole)
        )
      );
    }

    // Filter out expired notifications
    conditions.push(
      or(
        isNull(notificationCenter.expiresAt),
        gte(notificationCenter.expiresAt, new Date())
      )
    );

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationCenter)
      .where(and(...conditions));
    
    return result.count;
  }

  // Notification Preferences
  async createNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference> {
    const [created] = await db.insert(notificationPreferences).values(preference).returning();
    return created;
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
    return await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
  }

  async updateNotificationPreference(id: number, updates: Partial<InsertNotificationPreference>): Promise<boolean> {
    const result = await db
      .update(notificationPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationPreferences.id, id));
    return result.rowCount > 0;
  }

  // Notification Templates
  async createNotificationTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate> {
    const [created] = await db.insert(notificationTemplates).values(template).returning();
    return created;
  }

  async getNotificationTemplates(category?: string): Promise<NotificationTemplate[]> {
    let query = db.select().from(notificationTemplates);
    
    if (category) {
      query = query.where(eq(notificationTemplates.category, category));
    }
    
    return await query.orderBy(asc(notificationTemplates.name));
  }

  async getNotificationTemplate(id: string): Promise<NotificationTemplate | null> {
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, id));
    return template || null;
  }

  async updateNotificationTemplate(id: string, updates: Partial<InsertNotificationTemplate>): Promise<boolean> {
    const result = await db
      .update(notificationTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationTemplates.id, id));
    return result.rowCount > 0;
  }

  async deleteNotificationTemplate(id: string): Promise<boolean> {
    const result = await db
      .delete(notificationTemplates)
      .where(eq(notificationTemplates.id, id));
    return result.rowCount > 0;
  }

  // Cleanup and Maintenance
  async cleanupExpiredNotifications(): Promise<number> {
    const result = await db
      .delete(notificationCenter)
      .where(
        and(
          lte(notificationCenter.expiresAt, new Date()),
          eq(notificationCenter.isArchived, true)
        )
      );
    return result.rowCount;
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byCategory: Array<{ category: string; count: number; unread: number }>;
    byPriority: Array<{ priority: string; count: number; unread: number }>;
  }> {
    const baseConditions = [
      or(
        eq(notificationCenter.userId, userId),
        isNull(notificationCenter.userId)
      ),
      eq(notificationCenter.isArchived, false),
      or(
        isNull(notificationCenter.expiresAt),
        gte(notificationCenter.expiresAt, new Date())
      )
    ];

    // Total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationCenter)
      .where(and(...baseConditions));

    // Unread count
    const [unreadResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationCenter)
      .where(and(...baseConditions, eq(notificationCenter.isRead, false)));

    // By category
    const categoryStats = await db
      .select({
        category: notificationCenter.category,
        count: sql<number>`count(*)`,
        unread: sql<number>`sum(case when is_read = false then 1 else 0 end)`
      })
      .from(notificationCenter)
      .where(and(...baseConditions))
      .groupBy(notificationCenter.category);

    // By priority
    const priorityStats = await db
      .select({
        priority: notificationCenter.priority,
        count: sql<number>`count(*)`,
        unread: sql<number>`sum(case when is_read = false then 1 else 0 end)`
      })
      .from(notificationCenter)
      .where(and(...baseConditions))
      .groupBy(notificationCenter.priority);

    return {
      total: totalResult.count,
      unread: unreadResult.count,
      byCategory: categoryStats,
      byPriority: priorityStats
    };
  }
}