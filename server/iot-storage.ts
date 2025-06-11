import { db } from "./db";
import { 
  machineSensors, 
  sensorData, 
  iotAlerts,
  InsertMachineSensor,
  InsertSensorData,
  InsertIotAlert,
  MachineSensor,
  SensorData,
  IotAlert
} from "@shared/schema";
import { eq, desc, and, gte, lte, isNull } from "drizzle-orm";

export class IotStorage {
  // Machine Sensors
  async getMachineSensors(): Promise<MachineSensor[]> {
    return await db.select().from(machineSensors);
  }

  async getMachineSensorsByMachine(machineId: string): Promise<MachineSensor[]> {
    return await db.select().from(machineSensors).where(eq(machineSensors.machineId, machineId));
  }

  async getMachineSensor(id: string): Promise<MachineSensor | undefined> {
    const result = await db.select().from(machineSensors).where(eq(machineSensors.id, id));
    return result[0];
  }

  async createMachineSensor(sensor: InsertMachineSensor): Promise<MachineSensor> {
    const result = await db.insert(machineSensors).values(sensor).returning();
    return result[0];
  }

  async updateMachineSensor(id: string, updates: Partial<MachineSensor>): Promise<MachineSensor | undefined> {
    const result = await db.update(machineSensors)
      .set(updates)
      .where(eq(machineSensors.id, id))
      .returning();
    return result[0];
  }

  async deleteMachineSensor(id: string): Promise<void> {
    await db.delete(machineSensors).where(eq(machineSensors.id, id));
  }

  // Sensor Data
  async getSensorData(sensorId: string, limit: number = 100): Promise<SensorData[]> {
    return await db.select()
      .from(sensorData)
      .where(eq(sensorData.sensorId, sensorId))
      .orderBy(desc(sensorData.timestamp))
      .limit(limit);
  }

  async getSensorDataByDateRange(sensorId: string, startDate: Date, endDate: Date): Promise<SensorData[]> {
    return await db.select()
      .from(sensorData)
      .where(
        and(
          eq(sensorData.sensorId, sensorId),
          gte(sensorData.timestamp, startDate),
          lte(sensorData.timestamp, endDate)
        )
      )
      .orderBy(desc(sensorData.timestamp));
  }

  async createSensorData(data: InsertSensorData): Promise<SensorData> {
    const result = await db.insert(sensorData).values(data).returning();
    
    // Check for threshold violations and create alerts if needed
    await this.checkThresholds(data.sensorId, data.value);
    
    return result[0];
  }

  async getLatestSensorData(sensorId: string): Promise<SensorData | undefined> {
    const result = await db.select()
      .from(sensorData)
      .where(eq(sensorData.sensorId, sensorId))
      .orderBy(desc(sensorData.timestamp))
      .limit(1);
    return result[0];
  }

  // IoT Alerts
  async getIotAlerts(): Promise<IotAlert[]> {
    return await db.select().from(iotAlerts).orderBy(desc(iotAlerts.createdAt));
  }

  async getActiveIotAlerts(): Promise<IotAlert[]> {
    return await db.select()
      .from(iotAlerts)
      .where(eq(iotAlerts.isActive, true))
      .orderBy(desc(iotAlerts.createdAt));
  }

  async getIotAlertsBySensor(sensorId: string): Promise<IotAlert[]> {
    return await db.select()
      .from(iotAlerts)
      .where(eq(iotAlerts.sensorId, sensorId))
      .orderBy(desc(iotAlerts.createdAt));
  }

  async createIotAlert(alert: InsertIotAlert): Promise<IotAlert> {
    const result = await db.insert(iotAlerts).values(alert).returning();
    return result[0];
  }

  async acknowledgeIotAlert(id: number, userId: string): Promise<IotAlert | undefined> {
    const result = await db.update(iotAlerts)
      .set({ acknowledgedBy: userId, acknowledgedAt: new Date() })
      .where(eq(iotAlerts.id, id))
      .returning();
    return result[0];
  }

  async resolveIotAlert(id: number, userId: string): Promise<IotAlert | undefined> {
    const result = await db.update(iotAlerts)
      .set({ 
        resolvedBy: userId, 
        resolvedAt: new Date(),
        isActive: false 
      })
      .where(eq(iotAlerts.id, id))
      .returning();
    return result[0];
  }

  // Private method to check thresholds and create alerts
  private async checkThresholds(sensorId: string, value: number): Promise<void> {
    const sensor = await this.getMachineSensor(sensorId);
    if (!sensor) return;

    let alertType = '';
    let severity = '';
    let thresholdValue = 0;

    if (sensor.criticalThreshold !== null && 
        ((sensor.sensorType === 'temperature' && value > sensor.criticalThreshold) ||
         (sensor.sensorType === 'pressure' && value > sensor.criticalThreshold) ||
         (sensor.sensorType === 'vibration' && value > sensor.criticalThreshold))) {
      alertType = 'threshold_exceeded';
      severity = 'critical';
      thresholdValue = sensor.criticalThreshold;
    } else if (sensor.warningThreshold !== null && 
               ((sensor.sensorType === 'temperature' && value > sensor.warningThreshold) ||
                (sensor.sensorType === 'pressure' && value > sensor.warningThreshold) ||
                (sensor.sensorType === 'vibration' && value > sensor.warningThreshold))) {
      alertType = 'threshold_exceeded';
      severity = 'warning';
      thresholdValue = sensor.warningThreshold;
    }

    if (alertType) {
      // Check if there's already an active alert for this sensor
      const existingAlert = await db.select()
        .from(iotAlerts)
        .where(
          and(
            eq(iotAlerts.sensorId, sensorId),
            eq(iotAlerts.isActive, true),
            eq(iotAlerts.alertType, alertType)
          )
        )
        .limit(1);

      if (existingAlert.length === 0) {
        await this.createIotAlert({
          sensorId,
          alertType,
          severity,
          message: `${sensor.name} ${severity} threshold exceeded`,
          currentValue: value,
          thresholdValue,
          isActive: true
        });
      }
    }
  }

  // Analytics methods
  async getSensorAnalytics(sensorId: string, hours: number = 24): Promise<any> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const data = await this.getSensorDataByDateRange(sensorId, startDate, new Date());
    
    if (data.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        latest: 0,
        trend: 'stable',
        dataPoints: []
      };
    }

    const values = data.map(d => d.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[0]; // Most recent value (ordered by desc)

    // Simple trend calculation
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend = 'stable';
    if (secondAvg > firstAvg * 1.05) trend = 'increasing';
    else if (secondAvg < firstAvg * 0.95) trend = 'decreasing';

    return {
      average: Math.round(average * 100) / 100,
      min,
      max,
      latest,
      trend,
      dataPoints: data.map(d => ({
        timestamp: d.timestamp,
        value: d.value,
        status: d.status
      }))
    };
  }
}

export const iotStorage = new IotStorage();