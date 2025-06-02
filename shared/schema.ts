import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  unique,
  varchar,
  jsonb,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Cliché (Plate) Price Calculations related schemas

// Categories table
export const categories = pgTable("categories", {
  id: text("id").primaryKey(), // CID in the provided schema
  name: text("name").notNull(), // Category Name
  code: text("code").notNull().unique(), // Category Code
});

export const insertCategorySchema = createInsertSchema(categories);
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Items table
export const items = pgTable("items", {
  id: text("id").primaryKey(), // ItemID
  categoryId: text("category_id").notNull().references(() => categories.id), // CategoriesID
  name: text("name").notNull(), // Items Name
  fullName: text("full_name").notNull(), // Item Full Name
});

export const insertItemSchema = createInsertSchema(items);
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Sections table
export const sections = pgTable("sections", {
  id: text("id").primaryKey(), // Section ID
  name: text("name").notNull(), // Section Name
});

export const insertSectionSchema = createInsertSchema(sections);
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sections.$inferSelect;

// Master Batch table
export const masterBatches = pgTable("master_batches", {
  id: text("id").primaryKey(), // MasterBatch ID
  name: text("name").notNull(), // Master Batch
});

export const insertMasterBatchSchema = createInsertSchema(masterBatches);
export type InsertMasterBatch = z.infer<typeof insertMasterBatchSchema>;
export type MasterBatch = typeof masterBatches.$inferSelect;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // UID
  username: varchar("username").unique().notNull(), // Username
  password: text("password"), // Password - hashed
  email: varchar("email").unique(), // Email
  firstName: varchar("first_name"), // First name
  lastName: varchar("last_name"), // Last name
  bio: text("bio"), // Bio
  profileImageUrl: varchar("profile_image_url"), // Profile image URL
  role: text("role").notNull().default("user"), // UserRole (administrator, supervisor, operator, user)
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  sectionId: text("section_id").references(() => sections.id), // UserSection
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users);
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Customers table
export const customers = pgTable("customers", {
  id: text("id").primaryKey(), // CID
  code: text("code").notNull().unique(), // Customer Code
  name: text("name").notNull(), // Customer Name
  nameAr: text("name_ar"), // Customer Name Ar
  userId: text("user_id").references(() => users.id), // UserID (Sales)
  plateDrawerCode: text("plate_drawer_code"), // Plate Drawer Code
});

export const insertCustomerSchema = createInsertSchema(customers);
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Customer Products table
export const customerProducts = pgTable("customer_products", {
  id: serial("id").primaryKey(), // CPID
  customerId: text("customer_id").notNull().references(() => customers.id), // Customer ID
  categoryId: text("category_id").notNull().references(() => categories.id), // CategoryID
  itemId: text("item_id").notNull().references(() => items.id), // ItemID
  sizeCaption: text("size_caption"), // Size Caption
  width: doublePrecision("width"), // Width
  leftF: doublePrecision("left_f"), // Left F
  rightF: doublePrecision("right_f"), // Right F
  thickness: doublePrecision("thickness"), // Thickness
  thicknessOne: doublePrecision("thickness_one"), // Thickness One
  printingCylinder: doublePrecision("printing_cylinder"), // Printing Cylinder (Inch)
  lengthCm: doublePrecision("length_cm"), // Length (Cm)
  cuttingLength: doublePrecision("cutting_length_cm"), // Cutting Length (CM)
  rawMaterial: text("raw_material"), // Raw Material
  masterBatchId: text("master_batch_id").references(() => masterBatches.id), // Master Batch ID
  printed: text("printed"), // Printed
  cuttingUnit: text("cutting_unit"), // Cutting Unit
  unitWeight: doublePrecision("unit_weight_kg"), // Unit Weight (Kg)
  packing: text("packing"), // Packing
  punching: text("punching"), // Punching
  cover: text("cover"), // Cover
  volum: text("volum"), // Volum
  knife: text("knife"), // Knife
  notes: text("notes"), // Notes
}, (table) => {
  return {
    customerProductUnique: unique().on(table.customerId, table.itemId),
  };
});

export const insertCustomerProductSchema = createInsertSchema(customerProducts).omit({ id: true });
export type InsertCustomerProduct = z.infer<typeof insertCustomerProductSchema>;
export type CustomerProduct = typeof customerProducts.$inferSelect;

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(), // ID
  date: timestamp("date").defaultNow().notNull(), // Order Date
  customerId: text("customer_id").notNull().references(() => customers.id), // Customer ID
  note: text("note"), // Order Note
  status: text("status").notNull().default("pending"), // Status (pending, processing, completed)
  userId: text("user_id").references(() => users.id), // Created by
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, date: true, status: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Job Orders table
export const jobOrders = pgTable("job_orders", {
  id: serial("id").primaryKey(), // ID
  orderId: integer("order_id").notNull().references(() => orders.id), // Order ID
  customerProductId: integer("customer_product_id").notNull().references(() => customerProducts.id), // Customer Product No
  quantity: doublePrecision("quantity").notNull(), // Qty Kg
  finishedQty: doublePrecision("finished_qty").default(0).notNull(), // Finished quantity (kg)
  receivedQty: doublePrecision("received_qty").default(0).notNull(), // Received quantity (kg)
  status: text("status").default("pending").notNull(), // Status (pending, in_progress, extrusion_completed, completed, cancelled, received, partially_received)
  customerId: text("customer_id").references(() => customers.id), // Customer ID
  receiveDate: timestamp("receive_date"), // Date when received in warehouse
  receivedBy: text("received_by").references(() => users.id), // User who received the job order
}, (table) => {
  return {
    jobOrderUnique: unique().on(table.orderId, table.customerProductId),
  };
});

export const insertJobOrderSchema = createInsertSchema(jobOrders).omit({ id: true });
export type InsertJobOrder = z.infer<typeof insertJobOrderSchema>;
export type JobOrder = typeof jobOrders.$inferSelect;

// Rolls table
export const rolls = pgTable("rolls", {
  id: text("id").primaryKey(), // ID
  jobOrderId: integer("job_order_id").notNull().references(() => jobOrders.id), // Job Order ID
  serialNumber: text("roll_serial").notNull(), // Roll Serial
  extrudingQty: doublePrecision("extruding_qty").default(0), // Extruding Qty
  printingQty: doublePrecision("printing_qty").default(0), // Printing Qty
  cuttingQty: doublePrecision("cutting_qty").default(0), // Cutting Qty
  currentStage: text("current_stage").notNull().default("extrusion"), // Current stage (extrusion, printing, cutting, completed)
  status: text("status").notNull().default("pending"), // Status (pending, processing, completed)
  wasteQty: doublePrecision("waste_qty").default(0), // Waste quantity in kg (difference between printing and cutting)
  wastePercentage: doublePrecision("waste_percentage").default(0), // Waste percentage
  createdById: text("created_by_id").references(() => users.id), // User who created the roll (extrusion)
  printedById: text("printed_by_id").references(() => users.id), // User who printed the roll
  cutById: text("cut_by_id").references(() => users.id), // User who cut the roll
  createdAt: timestamp("created_at").defaultNow(), // Creation timestamp
  printedAt: timestamp("printed_at"), // Printing timestamp
  cutAt: timestamp("cut_at"), // Cutting timestamp
});

export const insertRollSchema = createInsertSchema(rolls);

// Create a custom schema for roll creation API that makes id and serialNumber optional
// since they'll be auto-generated on the server
export const createRollSchema = insertRollSchema.omit({ 
  id: true, 
  serialNumber: true 
});

export type InsertRoll = z.infer<typeof insertRollSchema>;
export type CreateRoll = z.infer<typeof createRollSchema>;
export type Roll = typeof rolls.$inferSelect;

// Permissions table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  module: text("module").notNull(),
  can_view: boolean("can_view").default(false),
  can_create: boolean("can_create").default(false),
  can_edit: boolean("can_edit").default(false),
  can_delete: boolean("can_delete").default(false),
  is_active: boolean("is_active").default(true),
}, (table) => ({
  uniqueIndex: unique().on(table.role, table.module),
}));

export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true });
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

// Machines table
export const machines = pgTable("machines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sectionId: text("section_id").references(() => sections.id),
  serialNumber: text("serial_number"),
  supplier: text("supplier"),
  dateOfManufacturing: timestamp("date_of_manufacturing"),
  modelNumber: text("model_number"),
  isActive: boolean("is_active").default(true),
});

export const insertMachineSchema = createInsertSchema(machines);
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type Machine = typeof machines.$inferSelect;

// Raw Materials table
export const rawMaterials = pgTable("raw_materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  quantity: doublePrecision("quantity").default(0),
  unit: text("unit").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertRawMaterialSchema = createInsertSchema(rawMaterials).omit({ id: true, lastUpdated: true });
export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;
export type RawMaterial = typeof rawMaterials.$inferSelect;

// Final Products table
export const finalProducts = pgTable("final_products", {
  id: serial("id").primaryKey(),
  jobOrderId: integer("job_order_id").notNull().references(() => jobOrders.id),
  quantity: doublePrecision("quantity").notNull(),
  completedDate: timestamp("completed_date").defaultNow(),
  status: text("status").notNull().default("in-stock"),
});

export const insertFinalProductSchema = createInsertSchema(finalProducts).omit({ id: true, completedDate: true });
export type InsertFinalProduct = z.infer<typeof insertFinalProductSchema>;
export type FinalProduct = typeof finalProducts.$inferSelect;

// Quality Check Types
export const qualityCheckTypes = pgTable("quality_check_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  checklistItems: text("checklist_items").array(),
  parameters: text("parameters").array(),
  targetStage: text("target_stage").notNull(), // extrusion, printing, cutting, final
  isActive: boolean("is_active").default(true),
});

export const insertQualityCheckTypeSchema = createInsertSchema(qualityCheckTypes);
export type InsertQualityCheckType = z.infer<typeof insertQualityCheckTypeSchema>;
export type QualityCheckType = typeof qualityCheckTypes.$inferSelect;

// Quality Checks
export const qualityChecks = pgTable("quality_checks", {
  id: serial("id").primaryKey(), 
  checkTypeId: text("check_type_id").notNull().references(() => qualityCheckTypes.id),
  rollId: text("roll_id").references(() => rolls.id),
  jobOrderId: integer("job_order_id").references(() => jobOrders.id),
  performedBy: text("performed_by").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // pending, passed, failed
  notes: text("notes"),
  checklistResults: text("checklist_results").array(),
  parameterValues: text("parameter_values").array(),
  issueSeverity: text("issue_severity"), // minor, major, critical
  imageUrls: text("image_urls").array(),
});

export const insertQualityCheckSchema = createInsertSchema(qualityChecks).omit({ id: true, timestamp: true });
export type InsertQualityCheck = z.infer<typeof insertQualityCheckSchema>;
export type QualityCheck = typeof qualityChecks.$inferSelect;

// Corrective Actions
export const correctiveActions = pgTable("corrective_actions", {
  id: serial("id").primaryKey(),
  qualityCheckId: integer("quality_check_id").notNull().references(() => qualityChecks.id),
  createdAt: timestamp("created_at"),
  completedAt: timestamp("completed_at"),
  assignedTo: text("assigned_to").references(() => users.id),
  completedBy: text("completed_by").references(() => users.id),
  action: text("action"),
  status: text("status").notNull().default("open"), // open, in-progress, completed, verified
});

export const insertCorrectiveActionSchema = createInsertSchema(correctiveActions).omit({ id: true });
export type InsertCorrectiveAction = z.infer<typeof insertCorrectiveActionSchema>;
export type CorrectiveAction = typeof correctiveActions.$inferSelect;

// Quality Violations
export const qualityViolations = pgTable("quality_violations", {
  id: serial("id").primaryKey(),
  qualityCheckId: integer("quality_check_id").notNull().references(() => qualityChecks.id),
  reportedBy: text("reported_by").references(() => users.id),
  violationType: text("violation_type").notNull(), // "procedural", "material", "equipment", "personnel"
  severity: text("severity").notNull(), // "minor", "major", "critical"
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // "open", "investigating", "resolved", "dismissed"
  reportDate: timestamp("report_date").defaultNow().notNull(),
  resolutionDate: timestamp("resolution_date"),
  affectedArea: text("affected_area").notNull(), // "extrusion", "printing", "cutting", etc.
  rootCause: text("root_cause"),
  imageUrls: text("image_urls").array(),
  notes: text("notes"),
});

export const insertQualityViolationSchema = createInsertSchema(qualityViolations).omit({ id: true, reportDate: true });
export type InsertQualityViolation = z.infer<typeof insertQualityViolationSchema>;
export type QualityViolation = typeof qualityViolations.$inferSelect;

// Penalties for Quality Violations
export const qualityPenalties = pgTable("quality_penalties", {
  id: serial("id").primaryKey(),
  violationId: integer("violation_id").notNull().references(() => qualityViolations.id),
  assignedTo: text("assigned_to").notNull().references(() => users.id),
  assignedBy: text("assigned_by").notNull().references(() => users.id),
  penaltyType: text("penalty_type").notNull(), // "warning", "financial", "training", "suspension"
  description: text("description").notNull(),
  amount: doublePrecision("amount"), // For financial penalties
  currency: text("currency"), // For financial penalties
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("pending"), // "pending", "active", "completed", "appealed", "cancelled"
  verifiedBy: text("verified_by").references(() => users.id),
  verificationDate: timestamp("verification_date"),
  comments: text("comments"),
  appealDetails: text("appeal_details"),
  supportingDocuments: text("supporting_documents").array(),
});

export const insertQualityPenaltySchema = createInsertSchema(qualityPenalties).omit({ id: true });
export type InsertQualityPenalty = z.infer<typeof insertQualityPenaltySchema>;
export type QualityPenalty = typeof qualityPenalties.$inferSelect;

// SMS Messages with Professional Notifications
export const smsMessages = pgTable("sms_messages", {
  id: serial("id").primaryKey(),
  recipientPhone: text("recipient_phone").notNull(),
  recipientName: text("recipient_name"),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed, delivered
  orderId: integer("order_id").references(() => orders.id),
  jobOrderId: integer("job_order_id").references(() => jobOrders.id),
  customerId: text("customer_id").references(() => customers.id),
  sentBy: text("sent_by").references(() => users.id),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  errorMessage: text("error_message"),
  messageType: text("message_type").notNull(), // order_notification, status_update, custom, bottleneck_alert, quality_alert, maintenance_alert, hr_notification
  twilioMessageId: text("twilio_message_id"),
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  category: text("category").notNull().default("general"), // general, production, quality, maintenance, hr, management
  templateId: text("template_id"), // Reference to message template
  scheduledFor: timestamp("scheduled_for"), // For scheduled messages
  isScheduled: boolean("is_scheduled").default(false),
  retryCount: integer("retry_count").default(0),
  lastRetryAt: timestamp("last_retry_at"),
  metadata: jsonb("metadata"), // Additional data like order details, alert info, etc.
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({ 
  id: true, 
  sentAt: true, 
  lastRetryAt: true
}).extend({
  twilioMessageId: z.string().nullable().optional(),
  deliveredAt: z.date().nullable().optional()
});
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;

// SMS Templates for Professional Notifications
export const smsTemplates = pgTable("sms_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // production, quality, maintenance, hr, management, custom
  messageType: text("message_type").notNull(),
  template: text("template").notNull(), // Message template with placeholders
  variables: text("variables").array(), // Available variables for template
  isActive: boolean("is_active").default(true),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates);
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type SmsTemplate = typeof smsTemplates.$inferSelect;

// SMS Notification Rules
export const smsNotificationRules = pgTable("sms_notification_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  triggerEvent: text("trigger_event").notNull(), // order_created, order_completed, bottleneck_detected, etc.
  conditions: jsonb("conditions"), // JSON conditions for when to trigger
  templateId: text("template_id").references(() => smsTemplates.id),
  recipientRoles: text("recipient_roles").array(), // Which roles should receive notifications
  recipientUsers: text("recipient_users").array(), // Specific users to notify
  isActive: boolean("is_active").default(true),
  priority: text("priority").default("normal"),
  cooldownMinutes: integer("cooldown_minutes").default(0), // Prevent spam
  workingHoursOnly: boolean("working_hours_only").default(false),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmsNotificationRuleSchema = createInsertSchema(smsNotificationRules).omit({ id: true });
export type InsertSmsNotificationRule = z.infer<typeof insertSmsNotificationRuleSchema>;
export type SmsNotificationRule = typeof smsNotificationRules.$inferSelect;

// Mix Materials table
export const mixMaterials = pgTable("mix_materials", {
  id: serial("id").primaryKey(),
  mixDate: timestamp("mix_date").defaultNow().notNull(),
  mixPerson: text("mix_person").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  totalQuantity: doublePrecision("total_quantity").default(0),
  mixScrew: text("mix_screw"), // A or B for the screw type
  createdAt: timestamp("created_at").defaultNow(),
});

// Mix Machines junction table
export const mixMachines = pgTable("mix_machines", {
  id: serial("id").primaryKey(),
  mixId: integer("mix_id").notNull().references(() => mixMaterials.id, { onDelete: "cascade" }),
  machineId: text("machine_id").notNull().references(() => machines.id),
}, (table) => ({
  uniqueIndex: unique().on(table.mixId, table.machineId),
}));

export const insertMixMaterialSchema = createInsertSchema(mixMaterials).omit({ 
  id: true, 
  createdAt: true 
});

export const insertMixMachineSchema = createInsertSchema(mixMachines).omit({
  id: true
});

export type InsertMixMaterial = z.infer<typeof insertMixMaterialSchema>;
export type InsertMixMachine = z.infer<typeof insertMixMachineSchema>;
export type MixMaterial = typeof mixMaterials.$inferSelect;
export type MixMachine = typeof mixMachines.$inferSelect;

// Mix Items table
export const mixItems = pgTable("mix_items", {
  id: serial("id").primaryKey(),
  mixId: integer("mix_id").notNull().references(() => mixMaterials.id, { onDelete: "cascade" }),
  rawMaterialId: integer("raw_material_id").notNull().references(() => rawMaterials.id),
  quantity: doublePrecision("quantity").notNull(),
  percentage: doublePrecision("percentage").default(0),
});

export const insertMixItemSchema = createInsertSchema(mixItems).omit({ 
  id: true,
  percentage: true 
});
export type InsertMixItem = z.infer<typeof insertMixItemSchema>;
export type MixItem = typeof mixItems.$inferSelect;

// Material Inputs table
export const materialInputs = pgTable("material_inputs", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  userId: text("user_id").notNull().references(() => users.id), // User who performed the input
  notes: text("notes"),
});

export const insertMaterialInputSchema = createInsertSchema(materialInputs).omit({ 
  id: true, 
  date: true 
});
export type InsertMaterialInput = z.infer<typeof insertMaterialInputSchema>;
export type MaterialInput = typeof materialInputs.$inferSelect;

// Material Input Items table
export const materialInputItems = pgTable("material_input_items", {
  id: serial("id").primaryKey(),
  inputId: integer("input_id").notNull().references(() => materialInputs.id, { onDelete: "cascade" }),
  rawMaterialId: integer("raw_material_id").notNull().references(() => rawMaterials.id),
  quantity: doublePrecision("quantity").notNull(),
});

export const insertMaterialInputItemSchema = createInsertSchema(materialInputItems).omit({ 
  id: true
});
export type InsertMaterialInputItem = z.infer<typeof insertMaterialInputItemSchema>;
export type MaterialInputItem = typeof materialInputItems.$inferSelect;

// Cliché (Plate) Pricing Parameters
export const platePricingParameters = pgTable("plate_pricing_parameters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Parameter name (e.g., "Base price per cm²")
  value: doublePrecision("value").notNull(), // Value of the parameter
  description: text("description"), // Description of the parameter
  type: text("type").notNull(), // Type of parameter (base_price, multiplier, etc.)
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertPlatePricingParameterSchema = createInsertSchema(platePricingParameters).omit({ id: true, lastUpdated: true });
export type InsertPlatePricingParameter = z.infer<typeof insertPlatePricingParameterSchema>;
export type PlatePricingParameter = typeof platePricingParameters.$inferSelect;

// Plate Calculations
export const plateCalculations = pgTable("plate_calculations", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id),
  width: doublePrecision("width").notNull(), // Width in cm
  height: doublePrecision("height").notNull(), // Height in cm
  area: doublePrecision("area").notNull(), // Area in cm²
  colors: integer("colors").notNull().default(1), // Number of colors
  plateType: text("plate_type").notNull(), // Type of plate (standard, premium, etc.)
  thickness: doublePrecision("thickness"), // Thickness in mm
  calculatedPrice: doublePrecision("calculated_price").notNull(), // Final calculated price
  basePricePerUnit: doublePrecision("base_price_per_unit"), // Base price per cm²
  colorMultiplier: doublePrecision("color_multiplier"), // Multiplier based on colors
  thicknessMultiplier: doublePrecision("thickness_multiplier"), // Multiplier based on thickness
  customerDiscount: doublePrecision("customer_discount"), // Customer specific discount percentage
  notes: text("notes"), // Additional notes
  createdById: text("created_by_id").references(() => users.id), // User who created the calculation
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlateCalculationSchema = createInsertSchema(plateCalculations).omit({ id: true, area: true, calculatedPrice: true, createdAt: true });
export type InsertPlateCalculation = z.infer<typeof insertPlateCalculationSchema>;
export type PlateCalculation = typeof plateCalculations.$inferSelect;

// Cliché Calculation Request Schema (for the frontend)
export const plateCalculationRequestSchema = z.object({
  customerId: z.string().optional(),
  width: z.number().positive("Width must be positive"),
  height: z.number().positive("Height must be positive"),
  colors: z.number().int().positive("Number of colors must be positive").default(1),
  plateType: z.string(),
  thickness: z.number().optional(),
  customerDiscount: z.number().optional(),
  notes: z.string().optional(),
});

export type PlateCalculationRequest = z.infer<typeof plateCalculationRequestSchema>;

// ABA Material Configurations table for storing ABA calculator formulas
export const abaMaterialConfigs = pgTable("aba_material_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isDefault: boolean("is_default").default(false),
  configData: jsonb("config_data").notNull(), // Stores the MaterialDistribution[] array as JSON
});

export const insertAbaMaterialConfigSchema = createInsertSchema(abaMaterialConfigs).omit({ id: true, createdAt: true });
export type InsertAbaMaterialConfig = z.infer<typeof insertAbaMaterialConfigSchema>;
export type AbaMaterialConfig = typeof abaMaterialConfigs.$inferSelect;

// HR Module Tables

// Time Attendance
export const timeAttendance = pgTable("time_attendance", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  breakStartTime: timestamp("break_start_time"),
  breakEndTime: timestamp("break_end_time"),
  workingHours: doublePrecision("working_hours").default(0), // in hours
  overtimeHours: doublePrecision("overtime_hours").default(0), // in hours
  location: text("location"), // GPS coordinates or location name
  status: text("status").notNull().default("present"), // present, absent, late, early_leave
  isAutoCheckedOut: boolean("is_auto_checked_out").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTimeAttendanceSchema = createInsertSchema(timeAttendance).omit({ id: true, createdAt: true });
export type InsertTimeAttendance = z.infer<typeof insertTimeAttendanceSchema>;
export type TimeAttendance = typeof timeAttendance.$inferSelect;

// Employee of the Month
export const employeeOfMonth = pgTable("employee_of_month", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  obligationPoints: integer("obligation_points").notNull().default(0),
  qualityScore: doublePrecision("quality_score").default(0),
  attendanceScore: doublePrecision("attendance_score").default(0),
  productivityScore: doublePrecision("productivity_score").default(0),
  totalScore: doublePrecision("total_score").default(0),
  rank: integer("rank"),
  reward: text("reward"),
  rewardAmount: doublePrecision("reward_amount"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserMonth: unique().on(table.userId, table.month, table.year),
}));

export const insertEmployeeOfMonthSchema = createInsertSchema(employeeOfMonth).omit({ id: true, createdAt: true });
export type InsertEmployeeOfMonth = z.infer<typeof insertEmployeeOfMonthSchema>;
export type EmployeeOfMonth = typeof employeeOfMonth.$inferSelect;

// HR Violations and Complaints
export const hrViolations = pgTable("hr_violations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), // Employee involved
  reportedBy: text("reported_by").notNull().references(() => users.id), // Who reported it
  violationType: text("violation_type").notNull(), // "attendance", "conduct", "safety", "performance", "policy"
  severity: text("severity").notNull(), // "minor", "major", "critical"
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionTaken: text("action_taken"),
  status: text("status").notNull().default("open"), // "open", "investigating", "resolved", "dismissed"
  reportDate: timestamp("report_date").defaultNow().notNull(),
  resolutionDate: timestamp("resolution_date"),
  witnessIds: text("witness_ids").array(), // Array of user IDs who witnessed
  evidenceUrls: text("evidence_urls").array(), // Photos, documents etc.
  penaltyType: text("penalty_type"), // "warning", "financial", "training", "suspension", "termination"
  penaltyAmount: doublePrecision("penalty_amount"),
  notes: text("notes"),
});

export const insertHrViolationSchema = createInsertSchema(hrViolations).omit({ id: true, reportDate: true });
export type InsertHrViolation = z.infer<typeof insertHrViolationSchema>;
export type HrViolation = typeof hrViolations.$inferSelect;

// HR Complaints
export const hrComplaints = pgTable("hr_complaints", {
  id: serial("id").primaryKey(),
  complainantId: text("complainant_id").notNull().references(() => users.id), // Who filed the complaint
  againstUserId: text("against_user_id").references(() => users.id), // Who the complaint is against (can be null for general complaints)
  complaintType: text("complaint_type").notNull(), // "harassment", "discrimination", "work_environment", "management", "safety", "other"
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "urgent"
  status: text("status").notNull().default("submitted"), // "submitted", "under_review", "investigating", "resolved", "closed"
  isAnonymous: boolean("is_anonymous").default(false),
  assignedTo: text("assigned_to").references(() => users.id), // HR person assigned
  submittedDate: timestamp("submitted_date").defaultNow().notNull(),
  resolutionDate: timestamp("resolution_date"),
  actionTaken: text("action_taken"),
  evidenceUrls: text("evidence_urls").array(),
  notes: text("notes"),
});

export const insertHrComplaintSchema = createInsertSchema(hrComplaints).omit({ id: true, submittedDate: true });
export type InsertHrComplaint = z.infer<typeof insertHrComplaintSchema>;
export type HrComplaint = typeof hrComplaints.$inferSelect;

// Production Bottleneck Detection System
export const productionMetrics = pgTable("production_metrics", {
  id: serial("id").primaryKey(),
  sectionId: text("section_id").notNull().references(() => sections.id),
  machineId: text("machine_id").references(() => machines.id),
  jobOrderId: integer("job_order_id").references(() => jobOrders.id),
  stage: text("stage").notNull(), // "extruding", "printing", "cutting", "mixing"
  targetRate: doublePrecision("target_rate").notNull(), // Expected production rate per hour
  actualRate: doublePrecision("actual_rate").notNull(), // Actual production rate
  efficiency: doublePrecision("efficiency").notNull(), // Percentage efficiency
  downtime: integer("downtime_minutes").default(0), // Downtime in minutes
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  shift: text("shift").notNull().default("day"), // "day", "night", "morning"
  operator: text("operator").references(() => users.id),
  notes: text("notes"),
});

export const insertProductionMetricsSchema = createInsertSchema(productionMetrics).omit({ id: true, timestamp: true });
export type InsertProductionMetrics = z.infer<typeof insertProductionMetricsSchema>;
export type ProductionMetrics = typeof productionMetrics.$inferSelect;

// Bottleneck Alerts
export const bottleneckAlerts = pgTable("bottleneck_alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(), // "efficiency_drop", "downtime_exceeded", "rate_below_target", "queue_buildup"
  severity: text("severity").notNull().default("medium"), // "low", "medium", "high", "critical"
  sectionId: text("section_id").notNull().references(() => sections.id),
  machineId: text("machine_id").references(() => machines.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedJobOrders: integer("affected_job_orders").array(), // Array of job order IDs
  estimatedDelay: integer("estimated_delay_hours"), // Estimated delay in hours
  suggestedActions: text("suggested_actions").array(), // Array of suggested actions
  status: text("status").notNull().default("active"), // "active", "acknowledged", "resolved", "ignored"
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: text("acknowledged_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
});

export const insertBottleneckAlertSchema = createInsertSchema(bottleneckAlerts).omit({ id: true, detectedAt: true });
export type InsertBottleneckAlert = z.infer<typeof insertBottleneckAlertSchema>;
export type BottleneckAlert = typeof bottleneckAlerts.$inferSelect;

// Notification Settings
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  alertType: text("alert_type").notNull(), // "efficiency_drop", "downtime_exceeded", etc.
  enabled: boolean("enabled").default(true),
  minSeverity: text("min_severity").notNull().default("medium"), // Minimum severity to notify
  notificationMethods: text("notification_methods").array().notNull(), // ["email", "sms", "push", "in_app"]
  workingHoursOnly: boolean("working_hours_only").default(false),
  departments: text("departments").array(), // If empty, all departments
  machines: text("machines").array(), // If empty, all machines
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({ id: true });
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;

// Production Targets
export const productionTargets = pgTable("production_targets", {
  id: serial("id").primaryKey(),
  sectionId: text("section_id").notNull().references(() => sections.id),
  machineId: text("machine_id").references(() => machines.id),
  stage: text("stage").notNull(),
  targetRate: doublePrecision("target_rate").notNull(), // Units per hour
  minEfficiency: doublePrecision("min_efficiency").notNull().default(75), // Minimum acceptable efficiency %
  maxDowntime: integer("max_downtime_minutes").notNull().default(30), // Maximum acceptable downtime per shift
  shift: text("shift").notNull().default("day"),
  effectiveFrom: timestamp("effective_from").defaultNow().notNull(),
  effectiveTo: timestamp("effective_to"),
  isActive: boolean("is_active").default(true),
  createdBy: text("created_by").notNull().references(() => users.id),
});

// Maintenance Module Tables

// Maintenance Requests
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number"),
  machineId: text("machine_id").notNull().references(() => machines.id),
  damageType: text("damage_type").notNull(),
  severity: text("severity").notNull().default("Normal"), // High, Normal, Low
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  priority: integer("priority").default(2), // 1=High, 2=Normal, 3=Low
  estimatedRepairTime: integer("estimated_repair_time"), // in hours
  actualRepairTime: integer("actual_repair_time"), // in hours
  requestedBy: text("requested_by").notNull().references(() => users.id),
  reportedBy: text("reported_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  assignedTo: text("assigned_to").references(() => users.id),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({ id: true, createdAt: true });
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;

// Maintenance Actions
export const maintenanceActions = pgTable("maintenance_actions", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => maintenanceRequests.id, { onDelete: "cascade" }),
  machineId: text("machine_id").notNull().references(() => machines.id),
  actionDate: timestamp("action_date").defaultNow().notNull(),
  actionType: text("action_type").notNull(),
  partReplaced: text("part_replaced"),
  partId: integer("part_id"),
  description: text("description").notNull(),
  performedBy: text("performed_by").notNull().references(() => users.id),
  hours: doublePrecision("hours").default(0),
  cost: doublePrecision("cost").default(0),
  status: text("status").notNull().default("completed"), // pending, in_progress, completed
});

export const insertMaintenanceActionSchema = createInsertSchema(maintenanceActions).omit({ id: true, actionDate: true });
export type InsertMaintenanceAction = z.infer<typeof insertMaintenanceActionSchema>;
export type MaintenanceAction = typeof maintenanceActions.$inferSelect;

// Maintenance Schedule (for preventive maintenance)
export const maintenanceSchedule = pgTable("maintenance_schedule", {
  id: serial("id").primaryKey(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  taskName: text("task_name").notNull(),
  taskDescription: text("task_description"),
  frequency: text("frequency").notNull(), // daily, weekly, monthly, quarterly, yearly
  lastCompleted: timestamp("last_completed"),
  nextDue: timestamp("next_due").notNull(),
  assignedTo: text("assigned_to").references(() => users.id),
  priority: text("priority").default("medium"), // low, medium, high, critical
  estimatedHours: doublePrecision("estimated_hours").default(1),
  instructions: text("instructions"),
  status: text("status").default("active"), // active, inactive, completed
  createdBy: text("created_by").notNull().references(() => users.id),
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedule).omit({ id: true });
export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;
export type MaintenanceSchedule = typeof maintenanceSchedule.$inferSelect;

export const insertProductionTargetsSchema = createInsertSchema(productionTargets).omit({ id: true, effectiveFrom: true });
export type InsertProductionTargets = z.infer<typeof insertProductionTargetsSchema>;
export type ProductionTargets = typeof productionTargets.$inferSelect;

// SMS Provider Settings for fallback configuration
export const smsProviderSettings = pgTable('sms_provider_settings', {
  id: serial('id').primaryKey(),
  primaryProvider: text('primary_provider').notNull().default('taqnyat'),
  fallbackProvider: text('fallback_provider').notNull().default('twilio'),
  retryAttempts: integer('retry_attempts').notNull().default(3),
  retryDelay: integer('retry_delay').notNull().default(5000), // milliseconds
  isActive: boolean('is_active').notNull().default(true),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  updatedBy: text('updated_by')
});

// SMS Provider Health Status for monitoring
export const smsProviderHealth = pgTable('sms_provider_health', {
  id: serial('id').primaryKey(),
  provider: text('provider').notNull(), // 'taqnyat' or 'twilio'
  status: text('status').notNull().default('healthy'), // 'healthy', 'degraded', 'down'
  lastSuccessfulSend: timestamp('last_successful_send'),
  lastFailedSend: timestamp('last_failed_send'),
  successCount: integer('success_count').notNull().default(0),
  failureCount: integer('failure_count').notNull().default(0),
  lastError: text('last_error'),
  checkedAt: timestamp('checked_at').notNull().defaultNow()
});

export const insertSmsProviderSettingsSchema = createInsertSchema(smsProviderSettings).omit({ id: true, lastUpdated: true });
export type InsertSmsProviderSettings = z.infer<typeof insertSmsProviderSettingsSchema>;
export type SmsProviderSettings = typeof smsProviderSettings.$inferSelect;

export const insertSmsProviderHealthSchema = createInsertSchema(smsProviderHealth).omit({ id: true, checkedAt: true });
export type InsertSmsProviderHealth = z.infer<typeof insertSmsProviderHealthSchema>;
export type SmsProviderHealth = typeof smsProviderHealth.$inferSelect;
