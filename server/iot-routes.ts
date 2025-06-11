import { Express } from "express";
import { z } from "zod";
import { iotStorage } from "./iot-storage";
import { 
  insertMachineSensorSchema, 
  insertSensorDataSchema, 
  insertIotAlertSchema 
} from "../shared/schema";
import { requireAuth } from "./auth-utils";

export function setupIotRoutes(app: Express) {
  // Machine Sensors
  app.get("/api/iot/sensors", requireAuth, async (req, res) => {
    try {
      const sensors = await iotStorage.getMachineSensors();
      res.json(sensors);
    } catch (error) {
      console.error("Error getting machine sensors:", error);
      res.status(500).json({ error: "Failed to get machine sensors" });
    }
  });

  app.get("/api/iot/sensors/machine/:machineId", requireAuth, async (req, res) => {
    try {
      const { machineId } = req.params;
      const sensors = await iotStorage.getMachineSensorsByMachine(machineId);
      res.json(sensors);
    } catch (error) {
      console.error("Error getting machine sensors:", error);
      res.status(500).json({ error: "Failed to get machine sensors" });
    }
  });

  app.get("/api/iot/sensors/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const sensor = await iotStorage.getMachineSensor(id);
      if (!sensor) {
        return res.status(404).json({ error: "Sensor not found" });
      }
      res.json(sensor);
    } catch (error) {
      console.error("Error getting sensor:", error);
      res.status(500).json({ error: "Failed to get sensor" });
    }
  });

  app.post("/api/iot/sensors", requireAuth, async (req, res) => {
    try {
      const sensorData = insertMachineSensorSchema.parse(req.body);
      const sensor = await iotStorage.createMachineSensor(sensorData);
      res.json(sensor);
    } catch (error) {
      console.error("Error creating sensor:", error);
      res.status(500).json({ error: "Failed to create sensor" });
    }
  });

  app.patch("/api/iot/sensors/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const sensor = await iotStorage.updateMachineSensor(id, updates);
      if (!sensor) {
        return res.status(404).json({ error: "Sensor not found" });
      }
      res.json(sensor);
    } catch (error) {
      console.error("Error updating sensor:", error);
      res.status(500).json({ error: "Failed to update sensor" });
    }
  });

  app.delete("/api/iot/sensors/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await iotStorage.deleteMachineSensor(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting sensor:", error);
      res.status(500).json({ error: "Failed to delete sensor" });
    }
  });

  // Sensor Data
  app.get("/api/iot/data/:sensorId", requireAuth, async (req, res) => {
    try {
      const { sensorId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const data = await iotStorage.getSensorData(sensorId, limit);
      res.json(data);
    } catch (error) {
      console.error("Error getting sensor data:", error);
      res.status(500).json({ error: "Failed to get sensor data" });
    }
  });

  app.get("/api/iot/data/:sensorId/range", requireAuth, async (req, res) => {
    try {
      const { sensorId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }

      const data = await iotStorage.getSensorDataByDateRange(
        sensorId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      res.json(data);
    } catch (error) {
      console.error("Error getting sensor data range:", error);
      res.status(500).json({ error: "Failed to get sensor data range" });
    }
  });

  app.get("/api/iot/data/:sensorId/latest", requireAuth, async (req, res) => {
    try {
      const { sensorId } = req.params;
      const data = await iotStorage.getLatestSensorData(sensorId);
      res.json(data);
    } catch (error) {
      console.error("Error getting latest sensor data:", error);
      res.status(500).json({ error: "Failed to get latest sensor data" });
    }
  });

  app.post("/api/iot/data", requireAuth, async (req, res) => {
    try {
      const sensorData = insertSensorDataSchema.parse(req.body);
      const data = await iotStorage.createSensorData(sensorData);
      res.json(data);
    } catch (error) {
      console.error("Error creating sensor data:", error);
      res.status(500).json({ error: "Failed to create sensor data" });
    }
  });

  // Analytics
  app.get("/api/iot/analytics/:sensorId", requireAuth, async (req, res) => {
    try {
      const { sensorId } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;
      const analytics = await iotStorage.getSensorAnalytics(sensorId, hours);
      res.json(analytics);
    } catch (error) {
      console.error("Error getting sensor analytics:", error);
      res.status(500).json({ error: "Failed to get sensor analytics" });
    }
  });

  // IoT Alerts
  app.get("/api/iot/alerts", requireAuth, async (req, res) => {
    try {
      const alerts = await iotStorage.getIotAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error getting IoT alerts:", error);
      res.status(500).json({ error: "Failed to get IoT alerts" });
    }
  });

  app.get("/api/iot/alerts/active", requireAuth, async (req, res) => {
    try {
      const alerts = await iotStorage.getActiveIotAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error getting active IoT alerts:", error);
      res.status(500).json({ error: "Failed to get active IoT alerts" });
    }
  });

  app.get("/api/iot/alerts/sensor/:sensorId", requireAuth, async (req, res) => {
    try {
      const { sensorId } = req.params;
      const alerts = await iotStorage.getIotAlertsBySensor(sensorId);
      res.json(alerts);
    } catch (error) {
      console.error("Error getting sensor alerts:", error);
      res.status(500).json({ error: "Failed to get sensor alerts" });
    }
  });

  app.post("/api/iot/alerts", requireAuth, async (req, res) => {
    try {
      const alertData = insertIotAlertSchema.parse(req.body);
      const alert = await iotStorage.createIotAlert(alertData);
      res.json(alert);
    } catch (error) {
      console.error("Error creating IoT alert:", error);
      res.status(500).json({ error: "Failed to create IoT alert" });
    }
  });

  app.patch("/api/iot/alerts/:id/acknowledge", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const alert = await iotStorage.acknowledgeIotAlert(parseInt(id), userId);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error acknowledging IoT alert:", error);
      res.status(500).json({ error: "Failed to acknowledge IoT alert" });
    }
  });

  app.patch("/api/iot/alerts/:id/resolve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const alert = await iotStorage.resolveIotAlert(parseInt(id), userId);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error resolving IoT alert:", error);
      res.status(500).json({ error: "Failed to resolve IoT alert" });
    }
  });

  // Bulk data endpoint for IoT devices
  app.post("/api/iot/data/bulk", requireAuth, async (req, res) => {
    try {
      const { data } = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Data must be an array" });
      }

      const results = [];
      for (const item of data) {
        try {
          const sensorData = insertSensorDataSchema.parse(item);
          const result = await iotStorage.createSensorData(sensorData);
          results.push(result);
        } catch (error) {
          console.error("Error processing bulk data item:", error);
          results.push({ error: "Failed to process item", item });
        }
      }

      res.json({ processed: results.length, results });
    } catch (error) {
      console.error("Error processing bulk sensor data:", error);
      res.status(500).json({ error: "Failed to process bulk sensor data" });
    }
  });
}