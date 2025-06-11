import { storage } from '../storage';
import { SmsMessage, InsertSmsMessage } from '../../shared/schema';

// Initialize Taqnyat credentials with environment variables
const taqnyatApiKey = process.env.TAQNYAT_API_KEY;
const taqnyatSenderId = process.env.TAQNYAT_SENDER_ID;
const taqnyatApiUrl = process.env.TAQNYAT_API_URL || 'https://api.taqnyat.sa/v1/messages';

// SMS Result type
type SmsResult = { success: boolean; messageId?: string; error?: string };

// SMS service class using only Taqnyat
export class SmsService {
  
  // Check if Taqnyat credentials are available
  private static hasTaqnyatCredentials(): boolean {
    return !!(taqnyatApiKey && taqnyatSenderId);
  }

  // Send SMS using Taqnyat API
  private static async sendTaqnyatMessage(to: string, message: string): Promise<SmsResult> {
    if (!this.hasTaqnyatCredentials()) {
      return { success: false, error: 'Taqnyat credentials not configured' };
    }

    try {
      console.log('Attempting to send SMS via Taqnyat...');
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
        console.log('SMS sent successfully via Taqnyat');
        return { 
          success: true, 
          messageId: result.messageId || result.id || 'taq_' + Date.now()
        };
      } else {
        const errorMsg = result.message || `HTTP ${response.status}: ${response.statusText}`;
        console.log(`Taqnyat failed: ${errorMsg}`);
        return { 
          success: false, 
          error: errorMsg
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
  private static async sendMessage(messageData: Omit<InsertSmsMessage, 'id' | 'twilioMessageId'>): Promise<SmsMessage> {
    // Create a record in the database first with pending status
    const message = await storage.createSmsMessage({
      ...messageData,
      status: 'pending',
      twilioMessageId: null
    });

    // Try to send the message via Taqnyat
    try {
      const result = await this.sendTaqnyatMessage(messageData.recipientPhone, messageData.message);
      
      if (result.success) {
        // Update the message with success status
        const updatedMessage = await storage.updateSmsMessage(message.id, {
          status: 'sent',
          twilioMessageId: result.messageId || null,
          errorMessage: 'Sent via Taqnyat'
        });
        return updatedMessage!;
      } else {
        // If sending failed, update the message status
        const updatedMessage = await storage.updateSmsMessage(message.id, {
          status: 'failed',
          errorMessage: result.error || 'Failed to send SMS via Taqnyat'
        });
        return updatedMessage!;
      }
    } catch (error: any) {
      // Handle unexpected errors and update the message status
      console.error('Unexpected error sending SMS:', error);
      const updatedMessage = await storage.updateSmsMessage(message.id, {
        status: 'failed',
        errorMessage: error.message || 'Unexpected error sending SMS'
      });
      return updatedMessage!;
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
      jobOrderId: null,
      category: 'order',
      priority: 'normal',
      scheduledFor: null,
      deliveredAt: null,
      errorMessage: null
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
      orderId: null,
      category: 'status',
      priority: 'normal',
      scheduledFor: null,
      deliveredAt: null,
      errorMessage: null
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
      jobOrderId,
      scheduledFor: null,
      deliveredAt: null,
      errorMessage: null
    });
  }

  // Check if service is available
  public static isAvailable(): boolean {
    return this.hasTaqnyatCredentials();
  }

  // Get service status
  public static getStatus(): { available: boolean; provider: string; error?: string } {
    if (this.hasTaqnyatCredentials()) {
      return { available: true, provider: 'Taqnyat' };
    } else {
      return { 
        available: false, 
        provider: 'Taqnyat', 
        error: 'Taqnyat credentials not configured' 
      };
    }
  }
}