import { db } from "./db";
import { dashboardWidgets, dashboardLayouts } from "../shared/schema";
import { eq, and } from "drizzle-orm";

type DashboardWidget = typeof dashboardWidgets.$inferSelect;
type DashboardLayout = typeof dashboardLayouts.$inferSelect;
type InsertDashboardWidget = typeof dashboardWidgets.$inferInsert;
type InsertDashboardLayout = typeof dashboardLayouts.$inferInsert;

export class DashboardStorage {
  // Dashboard Widgets
  async getUserWidgets(userId: string, layoutName: string = 'default'): Promise<DashboardWidget[]> {
    return await db.select()
      .from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.userId, userId),
        eq(dashboardWidgets.dashboardLayout, layoutName)
      ))
      .orderBy(dashboardWidgets.createdAt);
  }

  async createWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    const [newWidget] = await db.insert(dashboardWidgets)
      .values({
        ...widget,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newWidget;
  }

  async updateWidget(id: number, updates: Partial<DashboardWidget>): Promise<DashboardWidget | undefined> {
    const [updatedWidget] = await db.update(dashboardWidgets)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(dashboardWidgets.id, id))
      .returning();
    return updatedWidget;
  }

  async deleteWidget(id: number): Promise<void> {
    await db.delete(dashboardWidgets)
      .where(eq(dashboardWidgets.id, id));
  }

  async deleteUserWidgets(userId: string, layoutName: string): Promise<void> {
    await db.delete(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.userId, userId),
        eq(dashboardWidgets.dashboardLayout, layoutName)
      ));
  }

  async saveUserLayout(userId: string, layoutName: string, widgets: any[]): Promise<void> {
    // Delete existing widgets for this layout
    await this.deleteUserWidgets(userId, layoutName);

    // Insert new widgets
    if (widgets.length > 0) {
      await db.insert(dashboardWidgets)
        .values(widgets.map(widget => ({
          userId,
          widgetType: widget.widgetType,
          widgetConfig: widget.widgetConfig,
          position: widget.position,
          isVisible: widget.isVisible ?? true,
          dashboardLayout: layoutName,
          createdAt: new Date(),
          updatedAt: new Date()
        })));
    }
  }

  // Dashboard Layouts
  async getUserLayouts(userId: string): Promise<DashboardLayout[]> {
    return await db.select()
      .from(dashboardLayouts)
      .where(eq(dashboardLayouts.userId, userId))
      .orderBy(dashboardLayouts.createdAt);
  }

  async createLayout(layout: InsertDashboardLayout): Promise<DashboardLayout> {
    const [newLayout] = await db.insert(dashboardLayouts)
      .values({
        ...layout,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newLayout;
  }

  async updateLayout(id: number, updates: Partial<DashboardLayout>): Promise<DashboardLayout | undefined> {
    const [updatedLayout] = await db.update(dashboardLayouts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(dashboardLayouts.id, id))
      .returning();
    return updatedLayout;
  }

  async deleteLayout(id: number): Promise<void> {
    await db.delete(dashboardLayouts)
      .where(eq(dashboardLayouts.id, id));
  }

  // Dashboard Statistics
  async getDashboardStats(userId: string): Promise<any> {
    // This would typically aggregate data from multiple tables
    // For now, returning basic structure that can be expanded
    return {
      totalOrders: 125,
      completedOrders: 98,
      pendingOrders: 27,
      qualityIssues: 3,
      efficiency: 87,
      outputRate: 92,
      qualityScore: 96
    };
  }
}

export const dashboardStorage = new DashboardStorage();