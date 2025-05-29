import type { Express } from "express";
import { bottleneckStorage } from "./bottleneck-storage";
import { 
  insertProductionMetricsSchema, 
  insertBottleneckAlertSchema,
  insertNotificationSettingsSchema,
  insertProductionTargetsSchema 
} from "@shared/schema";

export function setupBottleneckRoutes(app: Express) {
  // Production Metrics endpoints
  app.get("/api/production/metrics", async (req, res) => {
    try {
      const { section, machine, startDate, endDate } = req.query;
      
      let metrics;
      if (section) {
        metrics = await bottleneckStorage.getProductionMetricsBySection(section as string);
      } else if (machine) {
        metrics = await bottleneckStorage.getProductionMetricsByMachine(machine as string);
      } else if (startDate && endDate) {
        metrics = await bottleneckStorage.getProductionMetricsByDateRange(
          new Date(startDate as string), 
          new Date(endDate as string)
        );
      } else {
        metrics = await bottleneckStorage.getProductionMetrics();
      }
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching production metrics:", error);
      res.status(500).json({ error: "Failed to fetch production metrics" });
    }
  });

  app.post("/api/production/metrics", async (req, res) => {
    try {
      const validatedData = insertProductionMetricsSchema.parse(req.body);
      const metric = await bottleneckStorage.createProductionMetric(validatedData);
      res.json(metric);
    } catch (error) {
      console.error("Error creating production metric:", error);
      res.status(500).json({ error: "Failed to create production metric" });
    }
  });

  // Bottleneck Alerts endpoints
  app.get("/api/bottleneck/alerts", async (req, res) => {
    try {
      const { status, section } = req.query;
      
      let alerts;
      if (status === 'active') {
        alerts = await bottleneckStorage.getActiveBottleneckAlerts();
      } else if (section) {
        alerts = await bottleneckStorage.getBottleneckAlertsBySection(section as string);
      } else {
        alerts = await bottleneckStorage.getBottleneckAlerts();
      }
      
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching bottleneck alerts:", error);
      res.status(500).json({ error: "Failed to fetch bottleneck alerts" });
    }
  });

  app.post("/api/bottleneck/alerts", async (req, res) => {
    try {
      const validatedData = insertBottleneckAlertSchema.parse(req.body);
      const alert = await bottleneckStorage.createBottleneckAlert(validatedData);
      res.json(alert);
    } catch (error) {
      console.error("Error creating bottleneck alert:", error);
      res.status(500).json({ error: "Failed to create bottleneck alert" });
    }
  });

  app.put("/api/bottleneck/alerts/:id/acknowledge", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user?.id || 'unknown';
      const alert = await bottleneckStorage.acknowledgeAlert(id, userId);
      
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  app.put("/api/bottleneck/alerts/:id/resolve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user?.id || 'unknown';
      const { notes } = req.body;
      
      const alert = await bottleneckStorage.resolveAlert(id, userId, notes);
      
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  // Production Targets endpoints
  app.get("/api/production/targets", async (req, res) => {
    try {
      const { section } = req.query;
      
      let targets;
      if (section) {
        targets = await bottleneckStorage.getProductionTargetsBySection(section as string);
      } else {
        targets = await bottleneckStorage.getProductionTargets();
      }
      
      res.json(targets);
    } catch (error) {
      console.error("Error fetching production targets:", error);
      res.status(500).json({ error: "Failed to fetch production targets" });
    }
  });

  app.post("/api/production/targets", async (req, res) => {
    try {
      const validatedData = insertProductionTargetsSchema.parse(req.body);
      const target = await bottleneckStorage.createProductionTarget(validatedData);
      res.json(target);
    } catch (error) {
      console.error("Error creating production target:", error);
      res.status(500).json({ error: "Failed to create production target" });
    }
  });

  app.put("/api/production/targets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const target = await bottleneckStorage.updateProductionTarget(id, req.body);
      
      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }
      
      res.json(target);
    } catch (error) {
      console.error("Error updating production target:", error);
      res.status(500).json({ error: "Failed to update production target" });
    }
  });

  // Notification Settings endpoints
  app.get("/api/notification/settings", async (req, res) => {
    try {
      const { userId } = req.query;
      
      let settings;
      if (userId) {
        settings = await bottleneckStorage.getNotificationSettingsByUser(userId as string);
      } else {
        settings = await bottleneckStorage.getNotificationSettings();
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.post("/api/notification/settings", async (req, res) => {
    try {
      const validatedData = insertNotificationSettingsSchema.parse(req.body);
      const setting = await bottleneckStorage.createNotificationSetting(validatedData);
      res.json(setting);
    } catch (error) {
      console.error("Error creating notification setting:", error);
      res.status(500).json({ error: "Failed to create notification setting" });
    }
  });

  app.put("/api/notification/settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const setting = await bottleneckStorage.updateNotificationSetting(id, req.body);
      
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error updating notification setting:", error);
      res.status(500).json({ error: "Failed to update notification setting" });
    }
  });

  // Analytics endpoints
  app.get("/api/production/analytics/efficiency/:sectionId", async (req, res) => {
    try {
      const sectionId = req.params.sectionId;
      const days = parseInt(req.query.days as string) || 7;
      
      const trends = await bottleneckStorage.getEfficiencyTrends(sectionId, days);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching efficiency trends:", error);
      res.status(500).json({ error: "Failed to fetch efficiency trends" });
    }
  });

  // Dashboard overview endpoint
  app.get("/api/bottleneck/dashboard", async (req, res) => {
    try {
      const activeAlerts = await bottleneckStorage.getActiveBottleneckAlerts();
      const recentMetrics = await bottleneckStorage.getProductionMetrics();
      
      // Get last 24 hours of metrics
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const last24Hours = recentMetrics.filter(m => m.timestamp >= yesterday);
      
      // Calculate overall efficiency
      const overallEfficiency = last24Hours.length > 0 
        ? last24Hours.reduce((sum, m) => sum + m.efficiency, 0) / last24Hours.length 
        : 0;
      
      // Count alerts by severity
      const alertsBySeverity = activeAlerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        activeAlerts: activeAlerts.length,
        alertsBySeverity,
        overallEfficiency: Math.round(overallEfficiency * 100) / 100,
        metricsCount: last24Hours.length,
        criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
        topBottlenecks: activeAlerts
          .sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                   (severityOrder[a.severity as keyof typeof severityOrder] || 0);
          })
          .slice(0, 5)
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Mock data generation for testing (remove in production)
  app.post("/api/bottleneck/generate-sample-data", async (req, res) => {
    try {
      // Generate sample production metrics
      const sampleMetrics = [
        {
          sectionId: "EXT01",
          machineId: "EXT-M01",
          jobOrderId: 1,
          stage: "extruding",
          targetRate: 100,
          actualRate: 85,
          efficiency: 85,
          downtime: 15,
          shift: "day",
          operator: "admin",
          notes: "Normal operation with minor efficiency drop"
        },
        {
          sectionId: "PRT01", 
          machineId: "PRT-M01",
          jobOrderId: 1,
          stage: "printing",
          targetRate: 80,
          actualRate: 60,
          efficiency: 75,
          downtime: 45,
          shift: "day",
          operator: "admin",
          notes: "Ink flow issues causing delays"
        }
      ];
      
      // Generate sample targets
      const sampleTargets = [
        {
          sectionId: "EXT01",
          machineId: "EXT-M01",
          stage: "extruding",
          targetRate: 100,
          minEfficiency: 80,
          maxDowntime: 30,
          shift: "day",
          isActive: true,
          createdBy: "admin"
        },
        {
          sectionId: "PRT01",
          machineId: "PRT-M01", 
          stage: "printing",
          targetRate: 80,
          minEfficiency: 75,
          maxDowntime: 30,
          shift: "day",
          isActive: true,
          createdBy: "admin"
        }
      ];
      
      // Create targets first
      for (const target of sampleTargets) {
        await bottleneckStorage.createProductionTarget(target);
      }
      
      // Create metrics (this will trigger bottleneck analysis)
      for (const metric of sampleMetrics) {
        await bottleneckStorage.createProductionMetric(metric);
      }
      
      res.json({ message: "Sample data generated successfully" });
    } catch (error) {
      console.error("Error generating sample data:", error);
      res.status(500).json({ error: "Failed to generate sample data" });
    }
  });
}