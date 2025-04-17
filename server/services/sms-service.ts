import twilio from 'twilio';
const Twilio = twilio;
import { storage } from '../storage';
import { SmsMessage, InsertSmsMessage } from '@shared/schema';

// Initialize Twilio client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Create a SMS service class to handle Twilio integration
export class SmsService {
  private static twilioClient: Twilio | null = null;

  // Initialize the Twilio client if credentials are available
  private static getTwilioClient(): Twilio | null {
    if (this.twilioClient) {
      return this.twilioClient;
    }

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Twilio credentials not found in environment variables.');
      return null;
    }

    try {
      this.twilioClient = new Twilio(accountSid, authToken);
      return this.twilioClient;
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
      return null;
    }
  }

  // Send a message and record it in the database
  private static async sendMessage(messageData: Omit<InsertSmsMessage, 'id' | 'sentAt' | 'deliveredAt' | 'twilioMessageId'>): Promise<SmsMessage> {
    // Create a record in the database first with pending status
    const message = await storage.createSmsMessage({
      ...messageData,
      status: 'pending',
      sentAt: new Date(),
      deliveredAt: null,
      twilioMessageId: null
    });

    // Try to send the message via Twilio
    try {
      const client = this.getTwilioClient();
      if (!client) {
        // If Twilio client is not available, update the message status
        return await storage.updateSmsMessage(message.id, {
          status: 'failed',
          errorMessage: 'Twilio client not initialized. Check environment credentials.'
        });
      }

      // Send the message via Twilio
      const twilioMessage = await client.messages.create({
        body: messageData.message,
        from: twilioPhoneNumber,
        to: messageData.recipientPhone
      });

      // Update the message with Twilio message ID and sent status
      return await storage.updateSmsMessage(message.id, {
        status: 'sent',
        twilioMessageId: twilioMessage.sid
      });
    } catch (error: any) {
      // Handle sending errors and update the message status
      console.error('Failed to send SMS:', error);
      return await storage.updateSmsMessage(message.id, {
        status: 'failed',
        errorMessage: error.message || 'Failed to send SMS'
      });
    }
  }

  // Send order notification
  public static async sendOrderNotification(
    orderId: number,
    recipientPhone: string,
    message: string,
    sentBy?: string,
    recipientName?: string,
    customerId?: string
  ): Promise<SmsMessage> {
    return this.sendMessage({
      recipientPhone,
      message,
      messageType: 'order_notification',
      orderId,
      customerId,
      recipientName,
      sentBy,
      jobOrderId: null
    });
  }

  // Send job order status update
  public static async sendJobOrderUpdate(
    jobOrderId: number,
    recipientPhone: string,
    message: string,
    sentBy?: string,
    recipientName?: string,
    customerId?: string
  ): Promise<SmsMessage> {
    return this.sendMessage({
      recipientPhone,
      message,
      messageType: 'status_update',
      jobOrderId,
      customerId,
      recipientName,
      sentBy,
      orderId: null
    });
  }

  // Send custom message
  public static async sendCustomMessage(
    recipientPhone: string,
    message: string,
    sentBy?: string,
    recipientName?: string,
    customerId?: string,
    orderId?: number,
    jobOrderId?: number
  ): Promise<SmsMessage> {
    return this.sendMessage({
      recipientPhone,
      message,
      messageType: 'custom',
      customerId,
      recipientName,
      sentBy,
      orderId,
      jobOrderId
    });
  }

  // Check message status and update in the database
  public static async checkMessageStatus(messageId: number): Promise<SmsMessage | null> {
    const message = await storage.getSmsMessage(messageId);
    if (!message || !message.twilioMessageId) {
      return message;
    }

    const client = this.getTwilioClient();
    if (!client) {
      return message;
    }

    try {
      const twilioMessage = await client.messages(message.twilioMessageId).fetch();
      const status = twilioMessage.status.toLowerCase();

      // Only update if status has changed
      if (status !== message.status) {
        const updatedMessage = await storage.updateSmsMessage(messageId, {
          status: status as any,
          deliveredAt: status === 'delivered' ? new Date() : message.deliveredAt
        });
        return updatedMessage;
      }

      return message;
    } catch (error) {
      console.error(`Failed to check status for message ${messageId}:`, error);
      return message;
    }
  }
}