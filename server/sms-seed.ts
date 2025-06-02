import { smsStorage } from "./sms-storage";

export async function seedSmsData() {
  try {
    // Create professional SMS templates
    const templates = [
      {
        id: "order_created",
        name: "Order Created Notification",
        category: "production" as const,
        messageType: "order_notification",
        template: "Hello {{customer_name}}, your order #{{order_id}} has been created and is now in production. We'll keep you updated on the progress.",
        variables: ["{{customer_name}}", "{{order_id}}"],
        isActive: true,
      },
      {
        id: "order_completed",
        name: "Order Completion Notice",
        category: "production" as const,
        messageType: "order_notification",
        template: "Great news! Your order #{{order_id}} has been completed. Please contact us to arrange delivery or pickup.",
        variables: ["{{order_id}}"],
        isActive: true,
      },
      {
        id: "bottleneck_alert",
        name: "Production Bottleneck Alert",
        category: "production" as const,
        messageType: "bottleneck_alert",
        template: "ALERT: Production bottleneck detected in {{section_name}} at {{machine_name}}. Estimated delay: {{delay_hours}} hours. Immediate attention required.",
        variables: ["{{section_name}}", "{{machine_name}}", "{{delay_hours}}"],
        isActive: true,
      },
      {
        id: "quality_issue",
        name: "Quality Issue Alert",
        category: "quality" as const,
        messageType: "quality_alert",
        template: "Quality Issue: Job Order #{{job_order_id}} has failed quality inspection. Priority: {{priority}}. Action required immediately.",
        variables: ["{{job_order_id}}", "{{priority}}"],
        isActive: true,
      },
      {
        id: "maintenance_required",
        name: "Maintenance Required",
        category: "maintenance" as const,
        messageType: "maintenance_alert",
        template: "Maintenance Alert: {{machine_name}} requires immediate maintenance. Current status: {{status}}. Please schedule maintenance ASAP.",
        variables: ["{{machine_name}}", "{{status}}"],
        isActive: true,
      },
      {
        id: "shift_handover",
        name: "Shift Handover",
        category: "management" as const,
        messageType: "hr_notification",
        template: "Shift Handover: {{operator_name}}, your shift starts in 30 minutes. Please review the handover notes for {{section_name}}.",
        variables: ["{{operator_name}}", "{{section_name}}"],
        isActive: true,
      },
      {
        id: "target_missed",
        name: "Production Target Missed",
        category: "production" as const,
        messageType: "status_update",
        template: "Production Alert: {{section_name}} has missed target by {{percentage}}%. Current rate: {{actual_rate}}/hr, Target: {{target_rate}}/hr.",
        variables: ["{{section_name}}", "{{percentage}}", "{{actual_rate}}", "{{target_rate}}"],
        isActive: true,
      }
    ];

    // Create notification rules
    const notificationRules = [
      {
        name: "Order Created Notifications",
        triggerEvent: "order_created",
        templateId: "order_created",
        recipientRoles: ["administrator", "supervisor"],
        isActive: true,
        priority: "normal" as const,
        cooldownMinutes: 0,
        workingHoursOnly: false,
      },
      {
        name: "Bottleneck Alerts",
        triggerEvent: "bottleneck_detected",
        templateId: "bottleneck_alert",
        recipientRoles: ["administrator", "supervisor"],
        isActive: true,
        priority: "urgent" as const,
        cooldownMinutes: 15,
        workingHoursOnly: false,
      },
      {
        name: "Quality Issue Alerts",
        triggerEvent: "quality_issue",
        templateId: "quality_issue",
        recipientRoles: ["administrator", "supervisor", "quality_inspector"],
        isActive: true,
        priority: "high" as const,
        cooldownMinutes: 5,
        workingHoursOnly: false,
      },
      {
        name: "Maintenance Alerts",
        triggerEvent: "maintenance_required",
        templateId: "maintenance_required",
        recipientRoles: ["administrator", "maintenance_tech"],
        isActive: true,
        priority: "high" as const,
        cooldownMinutes: 30,
        workingHoursOnly: true,
      },
      {
        name: "Target Miss Alerts",
        triggerEvent: "target_missed",
        templateId: "target_missed",
        recipientRoles: ["administrator", "supervisor"],
        isActive: true,
        priority: "normal" as const,
        cooldownMinutes: 60,
        workingHoursOnly: true,
      }
    ];

    // Seed templates
    console.log("Seeding SMS templates...");
    for (const template of templates) {
      try {
        const existingTemplate = await smsStorage.getSmsTemplate(template.id);
        if (!existingTemplate) {
          await smsStorage.createSmsTemplate(template);
          console.log(`Created template: ${template.name}`);
        }
      } catch (error) {
        // Template likely doesn't exist, try to create it
        try {
          await smsStorage.createSmsTemplate(template);
          console.log(`Created template: ${template.name}`);
        } catch (createError) {
          console.log(`Template ${template.name} already exists`);
        }
      }
    }

    // Seed notification rules
    console.log("Seeding SMS notification rules...");
    for (const rule of notificationRules) {
      try {
        await smsStorage.createSmsNotificationRule(rule);
        console.log(`Created rule: ${rule.name}`);
      } catch (error) {
        console.log(`Rule ${rule.name} already exists or error:`, error);
      }
    }

    // Create sample SMS messages for demonstration
    const sampleMessages = [
      {
        recipientPhone: "+1234567890",
        recipientName: "Sample Customer",
        message: "Hello Sample Customer, your order #1001 has been created and is now in production. We'll keep you updated on the progress.",
        status: "delivered" as const,
        priority: "normal" as const,
        category: "production" as const,
        messageType: "order_notification" as const,
        orderId: null,
        customerId: null,
        templateId: "order_created",
      },
      {
        recipientPhone: "+1234567891",
        recipientName: "Production Manager",
        message: "ALERT: Production bottleneck detected in Extrusion Section at Machine A1. Estimated delay: 2 hours. Immediate attention required.",
        status: "sent" as const,
        priority: "urgent" as const,
        category: "production" as const,
        messageType: "bottleneck_alert" as const,
        templateId: "bottleneck_alert",
      },
      {
        recipientPhone: "+1234567892",
        recipientName: "Quality Inspector",
        message: "Quality Issue: Job Order #2001 has failed quality inspection. Priority: high. Action required immediately.",
        status: "delivered" as const,
        priority: "high" as const,
        category: "quality" as const,
        messageType: "quality_alert" as const,
        templateId: "quality_issue",
      }
    ];

    console.log("Seeding sample SMS messages...");
    for (const message of sampleMessages) {
      try {
        await smsStorage.createSmsMessage({
          ...message,
          retryCount: 0,
          isScheduled: false,
          sentBy: "admin",
        });
        console.log(`Created sample message to: ${message.recipientName}`);
      } catch (error) {
        console.log(`Sample message creation error:`, error);
      }
    }

    console.log("SMS data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding SMS data:", error);
  }
}