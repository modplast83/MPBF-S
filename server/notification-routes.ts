import type { Express, Request, Response } from "express";
import { notificationService } from "./notification-service.js";
import { insertNotificationSchema, insertNotificationTemplateSchema } from "../shared/schema.js";
import { requireAuth } from "./auth-utils";
import { z } from "zod";

export function setupNotificationRoutes(app: Express) {
  // Get notifications for current user
  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const {
        category,
        priority,
        unreadOnly,
        limit = 50,
        offset = 0
      } = req.query;

      const notifications = await notificationService.getUserNotifications(
        userId,
        userRole,
        {
          category: category as string,
          priority: priority as string,
          unreadOnly: unreadOnly === 'true',
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get notification statistics
  app.get("/api/notifications/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const stats = await notificationService.getStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      res.status(500).json({ message: "Failed to fetch notification stats" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const counts = await notificationService.getUnreadCount(userId, userRole);
      res.json(counts.total);
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const notificationId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const success = await notificationService.markAsRead(notificationId, userId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Notification not found or not accessible" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { category } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const count = await notificationService.markAllAsRead(userId, category);
      res.json({ count });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Dismiss notification
  app.post("/api/notifications/:id/dismiss", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const notificationId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const success = await notificationService.dismissNotification(notificationId, userId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Notification not found or not accessible" });
      }
    } catch (error) {
      console.error("Error dismissing notification:", error);
      res.status(500).json({ message: "Failed to dismiss notification" });
    }
  });

  // Archive notification
  app.post("/api/notifications/:id/archive", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const notificationId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const success = await notificationService.archiveNotification(notificationId, userId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Notification not found or not accessible" });
      }
    } catch (error) {
      console.error("Error archiving notification:", error);
      res.status(500).json({ message: "Failed to archive notification" });
    }
  });

  // Create notification (admin only)
  app.post("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await notificationService.createNotification(validatedData);
      
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Broadcast notification (admin only)
  app.post("/api/notifications/broadcast", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { targetRole, ...notificationData } = req.body;
      const validatedData = insertNotificationSchema.omit({ userId: true }).parse(notificationData);
      
      const notification = await notificationService.broadcastNotification(
        validatedData,
        targetRole
      );
      
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      console.error("Error broadcasting notification:", error);
      res.status(500).json({ message: "Failed to broadcast notification" });
    }
  });

  // Notification Templates CRUD

  // Get notification templates
  app.get("/api/notification-templates", requireAuth, async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      const templates = await notificationService.getTemplates(category as string);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching notification templates:", error);
      res.status(500).json({ message: "Failed to fetch notification templates" });
    }
  });

  // Create notification template (admin only)
  app.post("/api/notification-templates", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertNotificationTemplateSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      const template = await notificationService.createTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating notification template:", error);
      res.status(500).json({ message: "Failed to create notification template" });
    }
  });

  // Update notification template (admin only)
  app.put("/api/notification-templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const templateId = req.params.id;
      
      if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertNotificationTemplateSchema.partial().parse(req.body);
      const success = await notificationService.updateTemplate(templateId, validatedData);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Template not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating notification template:", error);
      res.status(500).json({ message: "Failed to update notification template" });
    }
  });

  // Delete notification template (admin only)
  app.delete("/api/notification-templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const templateId = req.params.id;
      
      if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const success = await notificationService.deleteTemplate(templateId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Template not found" });
      }
    } catch (error) {
      console.error("Error deleting notification template:", error);
      res.status(500).json({ message: "Failed to delete notification template" });
    }
  });

  // Generate system notification from template
  app.post("/api/notifications/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { event, data, targetUsers, targetRoles } = req.body;
      
      const notifications = await notificationService.generateSystemNotification(
        event,
        data || {},
        targetUsers,
        targetRoles
      );
      
      res.json({ 
        generated: notifications.length,
        notifications 
      });
    } catch (error) {
      console.error("Error generating system notifications:", error);
      res.status(500).json({ message: "Failed to generate system notifications" });
    }
  });
}