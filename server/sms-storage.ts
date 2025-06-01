import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { 
  smsMessages, 
  smsTemplates, 
  smsNotificationRules,
  type SmsMessage, 
  type InsertSmsMessage,
  type SmsTemplate, 
  type InsertSmsTemplate,
  type SmsNotificationRule, 
  type InsertSmsNotificationRule
} from "@shared/schema";

export class SmsStorage {
  // SMS Messages
  async getSmsMessages(): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages).orderBy(desc(smsMessages.sentAt));
  }

  async getSmsMessagesByOrder(orderId: number): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages)
      .where(eq(smsMessages.orderId, orderId))
      .orderBy(desc(smsMessages.sentAt));
  }

  async getSmsMessagesByJobOrder(jobOrderId: number): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages)
      .where(eq(smsMessages.jobOrderId, jobOrderId))
      .orderBy(desc(smsMessages.sentAt));
  }

  async getSmsMessagesByCustomer(customerId: string): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages)
      .where(eq(smsMessages.customerId, customerId))
      .orderBy(desc(smsMessages.sentAt));
  }

  async getSmsMessage(id: number): Promise<SmsMessage | undefined> {
    const [message] = await db.select().from(smsMessages)
      .where(eq(smsMessages.id, id));
    return message;
  }

  async createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage> {
    const [newMessage] = await db.insert(smsMessages)
      .values({
        ...message,
        sentAt: new Date(),
        status: message.status || "pending",
        priority: message.priority || "normal",
        category: message.category || "general"
      })
      .returning();
    return newMessage;
  }

  async updateSmsMessage(id: number, updates: Partial<SmsMessage>): Promise<SmsMessage | undefined> {
    const [updatedMessage] = await db.update(smsMessages)
      .set(updates)
      .where(eq(smsMessages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteSmsMessage(id: number): Promise<boolean> {
    const result = await db.delete(smsMessages)
      .where(eq(smsMessages.id, id));
    return result.rowCount > 0;
  }

  // SMS Templates
  async getSmsTemplates(): Promise<SmsTemplate[]> {
    return await db.select().from(smsTemplates).orderBy(desc(smsTemplates.createdAt));
  }

  async getSmsTemplate(id: string): Promise<SmsTemplate | undefined> {
    const [template] = await db.select().from(smsTemplates)
      .where(eq(smsTemplates.id, id));
    return template;
  }

  async createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate> {
    const [newTemplate] = await db.insert(smsTemplates)
      .values({
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newTemplate;
  }

  async updateSmsTemplate(id: string, updates: Partial<SmsTemplate>): Promise<SmsTemplate | undefined> {
    const [updatedTemplate] = await db.update(smsTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(smsTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteSmsTemplate(id: string): Promise<boolean> {
    const result = await db.delete(smsTemplates)
      .where(eq(smsTemplates.id, id));
    return result.rowCount > 0;
  }

  // SMS Notification Rules
  async getSmsNotificationRules(): Promise<SmsNotificationRule[]> {
    return await db.select().from(smsNotificationRules).orderBy(desc(smsNotificationRules.createdAt));
  }

  async getSmsNotificationRule(id: number): Promise<SmsNotificationRule | undefined> {
    const [rule] = await db.select().from(smsNotificationRules)
      .where(eq(smsNotificationRules.id, id));
    return rule;
  }

  async createSmsNotificationRule(rule: InsertSmsNotificationRule): Promise<SmsNotificationRule> {
    const [newRule] = await db.insert(smsNotificationRules)
      .values({
        ...rule,
        createdAt: new Date()
      })
      .returning();
    return newRule;
  }

  async updateSmsNotificationRule(id: number, updates: Partial<SmsNotificationRule>): Promise<SmsNotificationRule | undefined> {
    const [updatedRule] = await db.update(smsNotificationRules)
      .set(updates)
      .where(eq(smsNotificationRules.id, id))
      .returning();
    return updatedRule;
  }

  async deleteSmsNotificationRule(id: number): Promise<boolean> {
    const result = await db.delete(smsNotificationRules)
      .where(eq(smsNotificationRules.id, id));
    return result.rowCount > 0;
  }

  // Utility methods
  async resendSmsMessage(id: number): Promise<SmsMessage | undefined> {
    const message = await this.getSmsMessage(id);
    if (!message) return undefined;

    const retryCount = (message.retryCount || 0) + 1;
    return await this.updateSmsMessage(id, {
      status: "pending",
      retryCount,
      lastRetryAt: new Date()
    });
  }

  async markMessageDelivered(twilioMessageId: string): Promise<SmsMessage | undefined> {
    const [updatedMessage] = await db.update(smsMessages)
      .set({
        status: "delivered",
        deliveredAt: new Date()
      })
      .where(eq(smsMessages.twilioMessageId, twilioMessageId))
      .returning();
    return updatedMessage;
  }

  async markMessageFailed(twilioMessageId: string, errorMessage: string): Promise<SmsMessage | undefined> {
    const [updatedMessage] = await db.update(smsMessages)
      .set({
        status: "failed",
        errorMessage
      })
      .where(eq(smsMessages.twilioMessageId, twilioMessageId))
      .returning();
    return updatedMessage;
  }
}

export const smsStorage = new SmsStorage();