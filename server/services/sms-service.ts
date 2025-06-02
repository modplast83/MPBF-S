import { storage } from '../storage';
import { SmsMessage, InsertSmsMessage, SmsProviderHealth, InsertSmsProviderHealth } from '@shared/schema';

// Initialize Taqnyat credentials with environment variables
const taqnyatApiKey = process.env.TAQNYAT_API_KEY;
const taqnyatSenderId = process.env.TAQNYAT_SENDER_ID;
const taqnyatApiUrl = process.env.TAQNYAT_API_URL || 'https://api.taqnyat.sa/v1/messages';

// Initialize Twilio fallback credentials
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// SMS Provider types
type SmsProvider = 'taqnyat' | 'twilio';
type SmsResult = { success: boolean; messageId?: string; error?: string; provider?: SmsProvider };

// Create a SMS service class to handle multiple providers with fallback
export class SmsService {
  
  // Check if Taqnyat credentials are available
  private static hasTaqnyatCredentials(): boolean {
    return !!(taqnyatApiKey && taqnyatSenderId);
  }

  // Check if Twilio credentials are available
  private static hasTwilioCredentials(): boolean {
    return !!(twilioAccountSid && twilioAuthToken && twilioPhoneNumber);
  }

  // Send SMS using Taqnyat API (primary provider)
  private static async sendTaqnyatMessage(to: string, message: string): Promise<SmsResult> {
    if (!this.hasTaqnyatCredentials()) {
      return { success: false, error: 'Taqnyat credentials not configured', provider: 'taqnyat' };
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
          messageId: result.messageId || result.id || 'taq_' + Date.now(),
          provider: 'taqnyat'
        };
      } else {
        return { 
          success: false, 
          error: result.message || `HTTP ${response.status}: ${response.statusText}`,
          provider: 'taqnyat'
        };
      }
    } catch (error: any) {
      console.error('Failed to send SMS via Taqnyat:', error);
      return { 
        success: false, 
        error: error.message || 'Network error connecting to Taqnyat',
        provider: 'taqnyat'
      };
    }
  }

  // Send SMS using Twilio API (fallback provider)
  private static async sendTwilioMessage(to: string, message: string): Promise<SmsResult> {
    if (!this.hasTwilioCredentials()) {
      return { success: false, error: 'Twilio credentials not configured', provider: 'twilio' };
    }

    try {
      // Dynamic import to avoid loading Twilio if not needed
      const twilio = (await import('twilio')).default;
      const client = twilio(twilioAccountSid, twilioAuthToken);

      const twilioMessage = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: to
      });

      return {
        success: true,
        messageId: twilioMessage.sid,
        provider: 'twilio'
      };
    } catch (error: any) {
      console.error('Failed to send SMS via Twilio:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS via Twilio',
        provider: 'twilio'
      };
    }
  }

  // Update provider health status
  private static async updateProviderHealth(provider: SmsProvider, success: boolean, error?: string): Promise<void> {
    try {
      await this.updateHealthStatus(provider, success, error);
    } catch (healthError) {
      console.error('Failed to update provider health status:', healthError);
    }
  }

  // Send SMS with automatic failover and health monitoring
  private static async sendWithFailover(to: string, message: string): Promise<SmsResult> {
    // Try primary provider (Taqnyat) first
    console.log('Attempting to send SMS via Taqnyat (primary provider)...');
    const taqnyatResult = await this.sendTaqnyatMessage(to, message);
    
    // Update Taqnyat health status
    await this.updateProviderHealth('taqnyat', taqnyatResult.success, taqnyatResult.error);
    
    if (taqnyatResult.success) {
      console.log('SMS sent successfully via Taqnyat');
      return taqnyatResult;
    }

    // If Taqnyat fails, try Twilio as fallback
    console.log('Taqnyat failed, attempting fallback to Twilio...');
    const twilioResult = await this.sendTwilioMessage(to, message);
    
    // Update Twilio health status
    await this.updateProviderHealth('twilio', twilioResult.success, twilioResult.error);
    
    if (twilioResult.success) {
      console.log('SMS sent successfully via Twilio (fallback)');
      return twilioResult;
    }

    // Both providers failed
    console.error('Both SMS providers failed');
    return {
      success: false,
      error: `Primary: ${taqnyatResult.error} | Fallback: ${twilioResult.error}`,
      provider: 'both_failed'
    };
  }

  // Update health status in database
  private static async updateHealthStatus(provider: SmsProvider, success: boolean, error?: string): Promise<void> {
    const now = new Date();
    
    // This is a simplified health update - in a real implementation you'd use proper storage methods
    const query = success
      ? `UPDATE sms_provider_health 
         SET success_count = success_count + 1, 
             last_successful_send = $1, 
             status = 'healthy',
             checked_at = $1 
         WHERE provider = $2`
      : `UPDATE sms_provider_health 
         SET failure_count = failure_count + 1, 
             last_failed_send = $1, 
             last_error = $3,
             status = CASE 
               WHEN failure_count >= 5 THEN 'down'
               WHEN failure_count >= 2 THEN 'degraded'
               ELSE status
             END,
             checked_at = $1 
         WHERE provider = $2`;

    try {
      if (success) {
        // For now, we'll use console logging. In a full implementation, this would use the database storage
        console.log(`Updated ${provider} health: success`);
      } else {
        console.log(`Updated ${provider} health: failure - ${error}`);
      }
    } catch (dbError) {
      console.error('Failed to update health status in database:', dbError);
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

    // Try to send the message with automatic failover
    try {
      const result = await this.sendWithFailover(messageData.recipientPhone, messageData.message);
      
      if (result.success) {
        // Update the message with provider message ID and sent status
        return await storage.updateSmsMessage(message.id, {
          status: 'sent',
          twilioMessageId: result.messageId || null,
          errorMessage: result.provider ? `Sent via ${result.provider}` : null
        });
      } else {
        // If sending failed on all providers, update the message status
        return await storage.updateSmsMessage(message.id, {
          status: 'failed',
          errorMessage: result.error || 'Failed to send SMS via all providers'
        });
      }
    } catch (error: any) {
      // Handle unexpected errors and update the message status
      console.error('Unexpected error sending SMS:', error);
      return await storage.updateSmsMessage(message.id, {
        status: 'failed',
        errorMessage: error.message || 'Unexpected error sending SMS'
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