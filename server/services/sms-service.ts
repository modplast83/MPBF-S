import { storage } from '../storage';
import { SmsMessage, InsertSmsMessage } from '@shared/schema';

// Initialize Taqnyat credentials with environment variables
const taqnyatApiKey = process.env.TAQNYAT_API_KEY;
const taqnyatSenderId = process.env.TAQNYAT_SENDER_ID;
const taqnyatApiUrl = process.env.TAQNYAT_API_URL || 'https://api.taqnyat.sa/v1/messages';

// Create a SMS service class to handle Taqnyat integration
export class SmsService {
  
  // Check if Taqnyat credentials are available
  private static hasTaqnyatCredentials(): boolean {
    if (!taqnyatApiKey || !taqnyatSenderId) {
      console.error('Taqnyat credentials not found in environment variables.');
      return false;
    }
    return true;
  }

  // Send SMS using Taqnyat API
  private static async sendTaqnyatMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.hasTaqnyatCredentials()) {
      return { success: false, error: 'Taqnyat credentials not configured' };
    }

    try {
      const response = await fetch(taqnyatApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${taqnyatApiKey}`
        },
        body: JSON.stringify({
          body: message,
          recipients: [to],
          sender: taqnyatSenderId
        })
      });

      const result = await response.json();
      
      if (response.ok && result.statusCode === 201) {
        return { 
          success: true, 
          messageId: result.messageId || result.id || 'taq_' + Date.now()
        };
      } else {
        return { 
          success: false, 
          error: result.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      console.error('Failed to send SMS via Taqnyat:', error);
      return { 
        success: false, 
        error: error.message || 'Network error connecting to Taqnyat'
      };
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

    // Try to send the message via Taqnyat
    try {
      const result = await this.sendTaqnyatMessage(messageData.recipientPhone, messageData.message);
      
      if (result.success) {
        // Update the message with Taqnyat message ID and sent status
        return await storage.updateSmsMessage(message.id, {
          status: 'sent',
          twilioMessageId: result.messageId || null
        });
      } else {
        // If sending failed, update the message status
        return await storage.updateSmsMessage(message.id, {
          status: 'failed',
          errorMessage: result.error || 'Failed to send SMS via Taqnyat'
        });
      }
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
    category: string = 'general',
    priority: string = 'normal',
    customerId?: string,
    orderId?: number,
    jobOrderId?: number
  ): Promise<SmsMessage> {
    return this.sendMessage({
      recipientPhone,
      message,
      messageType: 'custom',
      category,
      priority,
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