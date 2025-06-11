import { db } from "./db";
import { 
  operatorTasks, 
  operatorUpdates, 
  mobileDevices,
  InsertOperatorTask,
  InsertOperatorUpdate,
  InsertMobileDevice,
  OperatorTask,
  OperatorUpdate,
  MobileDevice
} from "../shared/schema";
import { eq, desc, and, or, isNull } from "drizzle-orm";

export class MobileStorage {
  // Operator Tasks
  async getOperatorTasks(): Promise<OperatorTask[]> {
    return await db.select().from(operatorTasks).orderBy(desc(operatorTasks.createdAt));
  }

  async getOperatorTasksByUser(userId: string): Promise<OperatorTask[]> {
    return await db.select()
      .from(operatorTasks)
      .where(eq(operatorTasks.assignedTo, userId))
      .orderBy(desc(operatorTasks.createdAt));
  }

  async getPendingOperatorTasks(userId: string): Promise<OperatorTask[]> {
    return await db.select()
      .from(operatorTasks)
      .where(
        and(
          eq(operatorTasks.assignedTo, userId),
          eq(operatorTasks.status, 'pending')
        )
      )
      .orderBy(desc(operatorTasks.createdAt));
  }

  async getOperatorTask(id: number): Promise<OperatorTask | undefined> {
    const result = await db.select().from(operatorTasks).where(eq(operatorTasks.id, id));
    return result[0];
  }

  async createOperatorTask(task: InsertOperatorTask): Promise<OperatorTask> {
    const result = await db.insert(operatorTasks).values(task).returning();
    return result[0];
  }

  async updateOperatorTask(id: number, updates: Partial<OperatorTask>): Promise<OperatorTask | undefined> {
    const result = await db.update(operatorTasks)
      .set(updates)
      .where(eq(operatorTasks.id, id))
      .returning();
    return result[0];
  }

  async startOperatorTask(id: number): Promise<OperatorTask | undefined> {
    const result = await db.update(operatorTasks)
      .set({ 
        status: 'in_progress',
        startedAt: new Date()
      })
      .where(eq(operatorTasks.id, id))
      .returning();
    return result[0];
  }

  async completeOperatorTask(id: number, notes?: string): Promise<OperatorTask | undefined> {
    const task = await this.getOperatorTask(id);
    if (!task) return undefined;

    const actualDuration = task.startedAt 
      ? Math.floor((Date.now() - task.startedAt.getTime()) / (1000 * 60))
      : null;

    const result = await db.update(operatorTasks)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        actualDuration,
        notes: notes || task.notes
      })
      .where(eq(operatorTasks.id, id))
      .returning();
    return result[0];
  }

  async deleteOperatorTask(id: number): Promise<void> {
    await db.delete(operatorTasks).where(eq(operatorTasks.id, id));
  }

  // Operator Updates
  async getOperatorUpdates(): Promise<OperatorUpdate[]> {
    return await db.select().from(operatorUpdates).orderBy(desc(operatorUpdates.createdAt));
  }

  async getOperatorUpdatesByUser(userId: string): Promise<OperatorUpdate[]> {
    return await db.select()
      .from(operatorUpdates)
      .where(eq(operatorUpdates.operatorId, userId))
      .orderBy(desc(operatorUpdates.createdAt));
  }

  async getUnacknowledgedOperatorUpdates(): Promise<OperatorUpdate[]> {
    return await db.select()
      .from(operatorUpdates)
      .where(eq(operatorUpdates.status, 'new'))
      .orderBy(desc(operatorUpdates.createdAt));
  }

  async getOperatorUpdate(id: number): Promise<OperatorUpdate | undefined> {
    const result = await db.select().from(operatorUpdates).where(eq(operatorUpdates.id, id));
    return result[0];
  }

  async createOperatorUpdate(update: InsertOperatorUpdate): Promise<OperatorUpdate> {
    const result = await db.insert(operatorUpdates).values(update).returning();
    return result[0];
  }

  async acknowledgeOperatorUpdate(id: number, userId: string): Promise<OperatorUpdate | undefined> {
    const result = await db.update(operatorUpdates)
      .set({ 
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: new Date()
      })
      .where(eq(operatorUpdates.id, id))
      .returning();
    return result[0];
  }

  async resolveOperatorUpdate(id: number): Promise<OperatorUpdate | undefined> {
    const result = await db.update(operatorUpdates)
      .set({ status: 'resolved' })
      .where(eq(operatorUpdates.id, id))
      .returning();
    return result[0];
  }

  async deleteOperatorUpdate(id: number): Promise<void> {
    await db.delete(operatorUpdates).where(eq(operatorUpdates.id, id));
  }

  // Mobile Devices
  async getMobileDevices(): Promise<MobileDevice[]> {
    return await db.select().from(mobileDevices).orderBy(desc(mobileDevices.lastActive));
  }

  async getMobileDevicesByUser(userId: string): Promise<MobileDevice[]> {
    return await db.select()
      .from(mobileDevices)
      .where(eq(mobileDevices.userId, userId))
      .orderBy(desc(mobileDevices.lastActive));
  }

  async getMobileDevice(id: string): Promise<MobileDevice | undefined> {
    const result = await db.select().from(mobileDevices).where(eq(mobileDevices.id, id));
    return result[0];
  }

  async registerMobileDevice(device: InsertMobileDevice): Promise<MobileDevice> {
    // Deactivate other devices for the same user
    await db.update(mobileDevices)
      .set({ isActive: false })
      .where(eq(mobileDevices.userId, device.userId));

    const result = await db.insert(mobileDevices).values(device).returning();
    return result[0];
  }

  async updateMobileDevice(id: string, updates: Partial<MobileDevice>): Promise<MobileDevice | undefined> {
    const result = await db.update(mobileDevices)
      .set(updates)
      .where(eq(mobileDevices.id, id))
      .returning();
    return result[0];
  }

  async updateDeviceActivity(id: string): Promise<MobileDevice | undefined> {
    const result = await db.update(mobileDevices)
      .set({ lastActive: new Date() })
      .where(eq(mobileDevices.id, id))
      .returning();
    return result[0];
  }

  async deactivateMobileDevice(id: string): Promise<MobileDevice | undefined> {
    const result = await db.update(mobileDevices)
      .set({ isActive: false })
      .where(eq(mobileDevices.id, id))
      .returning();
    return result[0];
  }

  async deleteMobileDevice(id: string): Promise<void> {
    await db.delete(mobileDevices).where(eq(mobileDevices.id, id));
  }

  // Analytics and Statistics
  async getOperatorTaskStats(userId: string, days: number = 7): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const tasks = await db.select()
      .from(operatorTasks)
      .where(
        and(
          eq(operatorTasks.assignedTo, userId),
          isNull(operatorTasks.createdAt) ? undefined : eq(operatorTasks.createdAt, startDate)
        )
      );

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

    const completedTasksWithDuration = tasks.filter(t => 
      t.status === 'completed' && t.actualDuration
    );
    
    const avgDuration = completedTasksWithDuration.length > 0
      ? completedTasksWithDuration.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / completedTasksWithDuration.length
      : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      averageDuration: Math.round(avgDuration),
      tasksByType: this.groupTasksByType(tasks),
      tasksByPriority: this.groupTasksByPriority(tasks)
    };
  }

  private groupTasksByType(tasks: OperatorTask[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.taskType] = (acc[task.taskType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupTasksByPriority(tasks: OperatorTask[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const mobileStorage = new MobileStorage();