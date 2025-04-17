import twilio from 'twilio';
import { SmsMessage, InsertSmsMessage } from '@shared/schema';
import { storage } from '../storage';

// Initialize Twilio client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Create Twilio client
const twilioClient = twilio(accountSid, authToken);

/**
 * SMS Service handles sending SMS messages using Twilio
 */
export class SmsService {
  /**
   * Send an SMS message
   * @param smsData SMS message data
   * @returns The created SMS message record
   */
  static async sendSms(smsData: InsertSmsMessage): Promise<SmsMessage> {
    try {
      // Create the message in the database with pending status
      const createdMessage = await storage.createSmsMessage(smsData);
      
      // Send the message via Twilio
      const twilioMessage = await twilioClient.messages.create({
        body: smsData.message,
        from: twilioPhoneNumber,
        to: smsData.recipientPhone,
      });
      
      // Update the message with Twilio message ID and status
      const updatedMessage = await storage.updateSmsMessage(createdMessage.id, {
        status: 'sent',
        twilioMessageId: twilioMessage.sid,
      });
      
      return updatedMessage || createdMessage;
    } catch (error: any) {
      // If there's an error, update the message status
      if (smsData.id) {
        await storage.updateSmsMessage(smsData.id, {
          status: 'failed',
          errorMessage: error.message,
        });
      }
      
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
  
  /**
   * Send an order notification to a customer
   * @param orderId Order ID
   * @param phoneNumber Customer phone number
   * @param message Custom message text
   * @param sentBy User ID of the sender
   * @returns The created SMS message record
   */
  static async sendOrderNotification(
    orderId: number,
    phoneNumber: string,
    message: string,
    sentBy?: string,
    recipientName?: string,
    customerId?: string,
  ): Promise<SmsMessage> {
    const smsData: InsertSmsMessage = {
      recipientPhone: phoneNumber,
      recipientName,
      message,
      orderId,
      customerId,
      sentBy,
      status: 'pending',
      messageType: 'order_notification',
    };
    
    return this.sendSms(smsData);
  }
  
  /**
   * Send a job order status update
   * @param jobOrderId Job order ID
   * @param phoneNumber Customer phone number
   * @param message Custom message text
   * @param sentBy User ID of the sender
   * @returns The created SMS message record
   */
  static async sendJobOrderUpdate(
    jobOrderId: number,
    phoneNumber: string,
    message: string,
    sentBy?: string,
    recipientName?: string,
    customerId?: string,
  ): Promise<SmsMessage> {
    const smsData: InsertSmsMessage = {
      recipientPhone: phoneNumber,
      recipientName,
      message,
      jobOrderId,
      customerId,
      sentBy,
      status: 'pending',
      messageType: 'status_update',
    };
    
    return this.sendSms(smsData);
  }
  
  /**
   * Send a custom message
   * @param phoneNumber Recipient phone number
   * @param message Custom message text
   * @param sentBy User ID of the sender
   * @returns The created SMS message record
   */
  static async sendCustomMessage(
    phoneNumber: string,
    message: string,
    sentBy?: string,
    recipientName?: string,
    customerId?: string,
    orderId?: number,
    jobOrderId?: number,
  ): Promise<SmsMessage> {
    const smsData: InsertSmsMessage = {
      recipientPhone: phoneNumber,
      recipientName,
      message,
      orderId,
      jobOrderId,
      customerId,
      sentBy,
      status: 'pending',
      messageType: 'custom',
    };
    
    return this.sendSms(smsData);
  }
}