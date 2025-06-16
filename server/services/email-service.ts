import sgMail from '@sendgrid/mail';

export interface QuoteEmailData {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  productType: string;
  template: string;
  materialColor: string;
  quantity: number;
  dimensions: {
    width: number;
    length: number;
    gusset: number;
    thickness: number;
  };
  clichesCost: number;
  bagsCost: number;
  minimumKg: number;
  numberOfColors: number;
  estimatedCost: number;
  notes?: string;
  timestamp: string;
}

export class EmailService {
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured');
      return;
    }

    if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      console.error('Invalid SendGrid API key format - should start with SG.');
      return;
    }

    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
      console.log('SendGrid email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SendGrid:', error);
    }
  }

  public isReady(): boolean {
    return this.isConfigured;
  }

  public async sendQuoteRequest(quoteData: QuoteEmailData): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Email service not configured. Please add SENDGRID_API_KEY to environment variables.'
      };
    }

    try {
      const emailContent = this.generateQuoteEmailContent(quoteData);
      
      const msg = {
        to: 'Modplast83@gmail.com',
        from: 'noreply@modplast.com', // Must be verified in SendGrid
        subject: `New Quote Request from ${quoteData.customerInfo.name}`,
        html: emailContent,
        replyTo: quoteData.customerInfo.email
      };

      console.log('Attempting to send email with SendGrid...');
      await sgMail.send(msg);
      
      return {
        success: true,
        message: 'Quote request sent successfully'
      };

    } catch (error: any) {
      console.error('SendGrid error details:', {
        code: error.code,
        message: error.message,
        response: error.response?.body
      });

      if (error.code === 403) {
        return {
          success: false,
          message: 'SendGrid authentication failed. Please verify your API key and sender email address in SendGrid dashboard.'
        };
      } else if (error.code === 401) {
        return {
          success: false,
          message: 'Invalid SendGrid API key. Please check your API key configuration.'
        };
      } else if (error.response?.body?.errors) {
        const errorDetails = error.response.body.errors.map((e: any) => e.message).join(', ');
        return {
          success: false,
          message: `SendGrid error: ${errorDetails}`
        };
      } else {
        return {
          success: false,
          message: 'Failed to send email. Please check your SendGrid configuration.'
        };
      }
    }
  }

  private generateQuoteEmailContent(quoteData: QuoteEmailData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          New Quote Request
        </h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Customer Information:</h3>
          <p><strong>Name:</strong> ${quoteData.customerInfo.name}</p>
          <p><strong>Email:</strong> ${quoteData.customerInfo.email}</p>
          <p><strong>Phone:</strong> ${quoteData.customerInfo.phone}</p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Product Details:</h3>
          <p><strong>Product Type:</strong> ${quoteData.productType}</p>
          <p><strong>Template:</strong> ${quoteData.template}</p>
          <p><strong>Material Color:</strong> ${quoteData.materialColor}</p>
          <p><strong>Quantity:</strong> ${quoteData.quantity.toLocaleString()} pieces</p>
          
          <h4 style="color: #374151; margin-bottom: 10px;">Dimensions:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Width: ${quoteData.dimensions.width} cm</li>
            <li>Length: ${quoteData.dimensions.length} cm</li>
            <li>Gusset: ${quoteData.dimensions.gusset} cm</li>
            <li>Thickness: ${quoteData.dimensions.thickness} mm</li>
          </ul>
        </div>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Pricing Breakdown:</h3>
          
          <div style="margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>1. Clichés Cost:</strong> ${quoteData.clichesCost.toLocaleString()} SR</p>
            <p style="margin-left: 20px; font-size: 12px; color: #666; font-style: italic;">
              Formula: ${quoteData.dimensions.width} × ${quoteData.dimensions.length} cm² × ${quoteData.numberOfColors} colors × 0.5 SR
            </p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>2. Bags Cost:</strong> ${quoteData.bagsCost.toLocaleString()} SR</p>
            <p style="margin-left: 20px; font-size: 12px; color: #666; font-style: italic;">
              Formula: Minimum ${quoteData.minimumKg} kg × 10 SR/kg (for ${quoteData.numberOfColors} color${quoteData.numberOfColors > 1 ? 's' : ''})
            </p>
          </div>
          
          <hr style="margin: 15px 0; border: 1px solid #d1d5db;">
          <p style="font-size: 18px; font-weight: bold; color: #059669;">
            <strong>Total Cost:</strong> ${quoteData.estimatedCost.toLocaleString()} SR
          </p>
          <p style="color: #6b7280;">
            <strong>Unit Price:</strong> ${(quoteData.estimatedCost / quoteData.quantity).toFixed(3)} SR per piece
          </p>
        </div>
        
        ${quoteData.notes ? `
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Additional Notes:</h3>
            <p style="margin: 0;">${quoteData.notes}</p>
          </div>
        ` : ''}
        
        <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
        <div style="text-align: center; color: #6b7280; font-size: 12px;">
          <p><em>Quote request submitted on: ${new Date(quoteData.timestamp).toLocaleString()}</em></p>
          <p><em>*Final pricing may vary based on design complexity and material availability</em></p>
        </div>
      </div>
    `;
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    try {
      // Test with a simple email validation call
      const testMsg = {
        to: 'test@example.com',
        from: 'noreply@modplast.com',
        subject: 'Test Connection',
        text: 'This is a test',
        mailSettings: {
          sandboxMode: {
            enable: true
          }
        }
      };

      await sgMail.send(testMsg);
      return {
        success: true,
        message: 'SendGrid connection successful'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `SendGrid connection failed: ${error.message}`
      };
    }
  }
}

export const emailService = new EmailService();