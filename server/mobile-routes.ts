import { Express } from "express";
import { z } from "zod";
import { mobileStorage } from "./mobile-storage";
import { 
  insertOperatorTaskSchema, 
  insertOperatorUpdateSchema, 
  insertMobileDeviceSchema 
} from "@shared/schema";
import { requireAuth } from "./auth-utils";

export function setupMobileRoutes(app: Express) {
  // Operator Tasks
  app.get("/api/mobile/tasks", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const tasks = await mobileStorage.getOperatorTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting operator tasks:", error);
      res.status(500).json({ error: "Failed to get operator tasks" });
    }
  });

  app.get("/api/mobile/tasks/pending", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const tasks = await mobileStorage.getPendingOperatorTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting pending tasks:", error);
      res.status(500).json({ error: "Failed to get pending tasks" });
    }
  });

  app.get("/api/mobile/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const task = await mobileStorage.getOperatorTask(parseInt(id));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error getting task:", error);
      res.status(500).json({ error: "Failed to get task" });
    }
  });

  app.post("/api/mobile/tasks", requireAuth, async (req, res) => {
    try {
      const taskData = insertOperatorTaskSchema.parse(req.body);
      const task = await mobileStorage.createOperatorTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/mobile/tasks/:id/start", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const task = await mobileStorage.startOperatorTask(parseInt(id));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error starting task:", error);
      res.status(500).json({ error: "Failed to start task" });
    }
  });

  app.patch("/api/mobile/tasks/:id/complete", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const task = await mobileStorage.completeOperatorTask(parseInt(id), notes);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({ error: "Failed to complete task" });
    }
  });

  app.patch("/api/mobile/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const task = await mobileStorage.updateOperatorTask(parseInt(id), updates);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/mobile/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await mobileStorage.deleteOperatorTask(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Operator Updates
  app.get("/api/mobile/updates", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const updates = await mobileStorage.getOperatorUpdatesByUser(userId);
      res.json(updates);
    } catch (error) {
      console.error("Error getting operator updates:", error);
      res.status(500).json({ error: "Failed to get operator updates" });
    }
  });

  app.get("/api/mobile/updates/unacknowledged", requireAuth, async (req, res) => {
    try {
      const updates = await mobileStorage.getUnacknowledgedOperatorUpdates();
      res.json(updates);
    } catch (error) {
      console.error("Error getting unacknowledged updates:", error);
      res.status(500).json({ error: "Failed to get unacknowledged updates" });
    }
  });

  app.get("/api/mobile/updates/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const update = await mobileStorage.getOperatorUpdate(parseInt(id));
      if (!update) {
        return res.status(404).json({ error: "Update not found" });
      }
      res.json(update);
    } catch (error) {
      console.error("Error getting update:", error);
      res.status(500).json({ error: "Failed to get update" });
    }
  });

  app.post("/api/mobile/updates", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const updateData = insertOperatorUpdateSchema.parse({
        ...req.body,
        operatorId: userId
      });
      
      const update = await mobileStorage.createOperatorUpdate(updateData);
      res.json(update);
    } catch (error) {
      console.error("Error creating update:", error);
      res.status(500).json({ error: "Failed to create update" });
    }
  });

  app.patch("/api/mobile/updates/:id/acknowledge", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const update = await mobileStorage.acknowledgeOperatorUpdate(parseInt(id), userId);
      if (!update) {
        return res.status(404).json({ error: "Update not found" });
      }
      res.json(update);
    } catch (error) {
      console.error("Error acknowledging update:", error);
      res.status(500).json({ error: "Failed to acknowledge update" });
    }
  });

  app.patch("/api/mobile/updates/:id/resolve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const update = await mobileStorage.resolveOperatorUpdate(parseInt(id));
      if (!update) {
        return res.status(404).json({ error: "Update not found" });
      }
      res.json(update);
    } catch (error) {
      console.error("Error resolving update:", error);
      res.status(500).json({ error: "Failed to resolve update" });
    }
  });

  // Mobile Devices
  app.get("/api/mobile/devices", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const devices = await mobileStorage.getMobileDevicesByUser(userId);
      res.json(devices);
    } catch (error) {
      console.error("Error getting mobile devices:", error);
      res.status(500).json({ error: "Failed to get mobile devices" });
    }
  });

  app.post("/api/mobile/devices/register", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const deviceData = insertMobileDeviceSchema.parse({
        ...req.body,
        userId
      });
      
      const device = await mobileStorage.registerMobileDevice(deviceData);
      res.json(device);
    } catch (error) {
      console.error("Error registering device:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  });

  app.patch("/api/mobile/devices/:id/activity", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const device = await mobileStorage.updateDeviceActivity(id);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      console.error("Error updating device activity:", error);
      res.status(500).json({ error: "Failed to update device activity" });
    }
  });

  app.patch("/api/mobile/devices/:id/deactivate", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const device = await mobileStorage.deactivateMobileDevice(id);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      console.error("Error deactivating device:", error);
      res.status(500).json({ error: "Failed to deactivate device" });
    }
  });

  // Statistics and Analytics
  app.get("/api/mobile/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const days = parseInt(req.query.days as string) || 7;
      const stats = await mobileStorage.getOperatorTaskStats(userId, days);
      res.json(stats);
    } catch (error) {
      console.error("Error getting operator stats:", error);
      res.status(500).json({ error: "Failed to get operator stats" });
    }
  });

  // Quick Actions for operators
  app.post("/api/mobile/quick-update", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { type, message, jobOrderId, machineId, rollId, photos, location } = req.body;
      
      const updateData = insertOperatorUpdateSchema.parse({
        operatorId: userId,
        updateType: type || 'status_update',
        title: `Quick Update - ${type || 'Status'}`,
        message,
        relatedJobOrderId: jobOrderId,
        relatedMachineId: machineId,
        relatedRollId: rollId,
        photos: photos || [],
        gpsLocation: location,
        priority: 'normal'
      });
      
      const update = await mobileStorage.createOperatorUpdate(updateData);
      res.json(update);
    } catch (error) {
      console.error("Error creating quick update:", error);
      res.status(500).json({ error: "Failed to create quick update" });
    }
  });

  // Issue reporting
  app.post("/api/mobile/report-issue", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { title, description, severity, machineId, photos, location } = req.body;
      
      const updateData = insertOperatorUpdateSchema.parse({
        operatorId: userId,
        updateType: 'issue_report',
        title: title || 'Issue Report',
        message: description,
        relatedMachineId: machineId,
        photos: photos || [],
        gpsLocation: location,
        priority: severity || 'normal'
      });
      
      const update = await mobileStorage.createOperatorUpdate(updateData);
      res.json(update);
    } catch (error) {
      console.error("Error reporting issue:", error);
      res.status(500).json({ error: "Failed to report issue" });
    }
  });
}