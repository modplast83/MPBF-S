// Smart notification system storage for production bottlenecks
import { 
  ProductionMetrics, InsertProductionMetrics,
  BottleneckAlert, InsertBottleneckAlert,
  NotificationSettings, InsertNotificationSettings,
  ProductionTargets, InsertProductionTargets
} from "../shared/schema";

export class BottleneckStorage {
  private productionMetrics: ProductionMetrics[] = [];
  private bottleneckAlerts: BottleneckAlert[] = [];
  private notificationSettings: NotificationSettings[] = [];
  private productionTargets: ProductionTargets[] = [];
  private currentId = 1;

  // Production Metrics methods
  async getProductionMetrics(): Promise<ProductionMetrics[]> {
    return this.productionMetrics;
  }

  async getProductionMetricsBySection(sectionId: string): Promise<ProductionMetrics[]> {
    return this.productionMetrics.filter(metric => metric.sectionId === sectionId);
  }

  async getProductionMetricsByMachine(machineId: string): Promise<ProductionMetrics[]> {
    return this.productionMetrics.filter(metric => metric.machineId === machineId);
  }

  async getProductionMetricsByDateRange(startDate: Date, endDate: Date): Promise<ProductionMetrics[]> {
    return this.productionMetrics.filter(metric => 
      metric.timestamp >= startDate && metric.timestamp <= endDate
    );
  }

  async createProductionMetric(metric: InsertProductionMetrics): Promise<ProductionMetrics> {
    const newMetric: ProductionMetrics = {
      ...metric,
      id: this.currentId++,
      timestamp: new Date()
    };
    this.productionMetrics.push(newMetric);
    
    // Analyze for bottlenecks after adding new metric
    await this.analyzeForBottlenecks(newMetric);
    
    return newMetric;
  }

  // Bottleneck Alert methods
  async getBottleneckAlerts(): Promise<BottleneckAlert[]> {
    return this.bottleneckAlerts.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  async getActiveBottleneckAlerts(): Promise<BottleneckAlert[]> {
    return this.bottleneckAlerts.filter(alert => alert.status === 'active');
  }

  async getBottleneckAlertsBySection(sectionId: string): Promise<BottleneckAlert[]> {
    return this.bottleneckAlerts.filter(alert => alert.sectionId === sectionId);
  }

  async acknowledgeAlert(id: number, userId: string): Promise<BottleneckAlert | undefined> {
    const alert = this.bottleneckAlerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = userId;
    }
    return alert;
  }

  async resolveAlert(id: number, userId: string, notes?: string): Promise<BottleneckAlert | undefined> {
    const alert = this.bottleneckAlerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.resolvedBy = userId;
      alert.resolutionNotes = notes || '';
    }
    return alert;
  }

  async createBottleneckAlert(alert: InsertBottleneckAlert): Promise<BottleneckAlert> {
    const newAlert: BottleneckAlert = {
      ...alert,
      id: this.currentId++,
      detectedAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null
    };
    this.bottleneckAlerts.push(newAlert);
    return newAlert;
  }

  // Production Targets methods
  async getProductionTargets(): Promise<ProductionTargets[]> {
    return this.productionTargets.filter(target => target.isActive);
  }

  async getProductionTargetsBySection(sectionId: string): Promise<ProductionTargets[]> {
    return this.productionTargets.filter(target => 
      target.sectionId === sectionId && target.isActive
    );
  }

  async createProductionTarget(target: InsertProductionTargets): Promise<ProductionTargets> {
    const newTarget: ProductionTargets = {
      ...target,
      id: this.currentId++,
      effectiveFrom: new Date(),
      effectiveTo: null
    };
    this.productionTargets.push(newTarget);
    return newTarget;
  }

  async updateProductionTarget(id: number, updates: Partial<ProductionTargets>): Promise<ProductionTargets | undefined> {
    const target = this.productionTargets.find(t => t.id === id);
    if (target) {
      Object.assign(target, updates);
    }
    return target;
  }

  // Notification Settings methods
  async getNotificationSettings(): Promise<NotificationSettings[]> {
    return this.notificationSettings;
  }

  async getNotificationSettingsByUser(userId: string): Promise<NotificationSettings[]> {
    return this.notificationSettings.filter(setting => setting.userId === userId);
  }

  async createNotificationSetting(setting: InsertNotificationSettings): Promise<NotificationSettings> {
    const newSetting: NotificationSettings = {
      ...setting,
      id: this.currentId++
    };
    this.notificationSettings.push(newSetting);
    return newSetting;
  }

  async updateNotificationSetting(id: number, updates: Partial<NotificationSettings>): Promise<NotificationSettings | undefined> {
    const setting = this.notificationSettings.find(s => s.id === id);
    if (setting) {
      Object.assign(setting, updates);
    }
    return setting;
  }

  // Bottleneck analysis logic
  private async analyzeForBottlenecks(metric: ProductionMetrics): Promise<void> {
    const targets = await this.getProductionTargetsBySection(metric.sectionId);
    const relevantTarget = targets.find(t => 
      t.stage === metric.stage && 
      t.shift === metric.shift &&
      (!t.machineId || t.machineId === metric.machineId)
    );

    if (!relevantTarget) return;

    const alerts: InsertBottleneckAlert[] = [];

    // Check efficiency drop
    if (metric.efficiency < relevantTarget.minEfficiency) {
      alerts.push({
        alertType: 'efficiency_drop',
        severity: metric.efficiency < 50 ? 'critical' : metric.efficiency < 65 ? 'high' : 'medium',
        sectionId: metric.sectionId,
        machineId: metric.machineId,
        title: `Efficiency Drop Detected - ${metric.stage}`,
        description: `Efficiency dropped to ${metric.efficiency.toFixed(1)}% (target: ${relevantTarget.minEfficiency}%)`,
        affectedJobOrders: metric.jobOrderId ? [metric.jobOrderId] : [],
        estimatedDelay: this.calculateEstimatedDelay(metric.efficiency, relevantTarget.minEfficiency),
        suggestedActions: this.getSuggestedActions('efficiency_drop', metric),
        status: 'active'
      });
    }

    // Check production rate below target
    if (metric.actualRate < relevantTarget.targetRate * 0.8) {
      alerts.push({
        alertType: 'rate_below_target',
        severity: metric.actualRate < relevantTarget.targetRate * 0.5 ? 'critical' : 'high',
        sectionId: metric.sectionId,
        machineId: metric.machineId,
        title: `Production Rate Below Target - ${metric.stage}`,
        description: `Current rate: ${metric.actualRate.toFixed(1)} units/hr (target: ${relevantTarget.targetRate.toFixed(1)} units/hr)`,
        affectedJobOrders: metric.jobOrderId ? [metric.jobOrderId] : [],
        estimatedDelay: this.calculateDelayFromRate(metric.actualRate, relevantTarget.targetRate),
        suggestedActions: this.getSuggestedActions('rate_below_target', metric),
        status: 'active'
      });
    }

    // Check excessive downtime
    if (metric.downtime && metric.downtime > relevantTarget.maxDowntime) {
      alerts.push({
        alertType: 'downtime_exceeded',
        severity: metric.downtime > relevantTarget.maxDowntime * 2 ? 'critical' : 'high',
        sectionId: metric.sectionId,
        machineId: metric.machineId,
        title: `Excessive Downtime - ${metric.stage}`,
        description: `Downtime: ${metric.downtime} minutes (max allowed: ${relevantTarget.maxDowntime} minutes)`,
        affectedJobOrders: metric.jobOrderId ? [metric.jobOrderId] : [],
        estimatedDelay: Math.ceil(metric.downtime / 60),
        suggestedActions: this.getSuggestedActions('downtime_exceeded', metric),
        status: 'active'
      });
    }

    // Create alerts
    for (const alert of alerts) {
      await this.createBottleneckAlert(alert);
    }
  }

  private calculateEstimatedDelay(actualEfficiency: number, targetEfficiency: number): number {
    if (actualEfficiency <= 0 || targetEfficiency <= 0) return 0;
    const efficiencyRatio = targetEfficiency / actualEfficiency;
    return Math.ceil((efficiencyRatio - 1) * 8); // Estimate delay in hours for an 8-hour shift
  }

  private calculateDelayFromRate(actualRate: number, targetRate: number): number {
    if (actualRate <= 0 || targetRate <= 0) return 0;
    const rateRatio = targetRate / actualRate;
    return Math.ceil((rateRatio - 1) * 4); // Estimate delay in hours
  }

  private getSuggestedActions(alertType: string, metric: ProductionMetrics): string[] {
    switch (alertType) {
      case 'efficiency_drop':
        return [
          'Check machine calibration and settings',
          'Inspect raw material quality',
          'Review operator training status',
          'Verify maintenance schedule compliance',
          'Check for equipment wear or damage'
        ];
      case 'rate_below_target':
        return [
          'Optimize machine speed settings',
          'Check for material flow issues',
          'Review job setup parameters',
          'Inspect for mechanical bottlenecks',
          'Consider additional operator support'
        ];
      case 'downtime_exceeded':
        return [
          'Investigate root cause of downtime',
          'Check preventive maintenance schedule',
          'Review spare parts availability',
          'Ensure adequate technical support',
          'Consider backup equipment activation'
        ];
      default:
        return ['Contact production supervisor for immediate assessment'];
    }
  }

  // Analytics methods
  async getEfficiencyTrends(sectionId: string, days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const metrics = await this.getProductionMetricsByDateRange(startDate, new Date());
    const sectionMetrics = metrics.filter(m => m.sectionId === sectionId);
    
    return {
      averageEfficiency: sectionMetrics.length > 0 ? 
        sectionMetrics.reduce((sum, m) => sum + m.efficiency, 0) / sectionMetrics.length : 0,
      dailyTrends: this.groupMetricsByDay(sectionMetrics),
      alertCount: this.bottleneckAlerts.filter(a => 
        a.sectionId === sectionId && 
        a.detectedAt >= startDate
      ).length
    };
  }

  private groupMetricsByDay(metrics: ProductionMetrics[]): any[] {
    const grouped = metrics.reduce((acc, metric) => {
      const date = metric.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, metrics: [] };
      }
      acc[date].metrics.push(metric);
      return acc;
    }, {} as any);

    return Object.values(grouped).map((day: any) => ({
      date: day.date,
      averageEfficiency: day.metrics.length > 0 ? 
        day.metrics.reduce((sum: number, m: ProductionMetrics) => sum + m.efficiency, 0) / day.metrics.length : 0,
      totalDowntime: day.metrics.reduce((sum: number, m: ProductionMetrics) => sum + (m.downtime || 0), 0),
      averageRate: day.metrics.length > 0 ?
        day.metrics.reduce((sum: number, m: ProductionMetrics) => sum + m.actualRate, 0) / day.metrics.length : 0
    }));
  }
}

export const bottleneckStorage = new BottleneckStorage();