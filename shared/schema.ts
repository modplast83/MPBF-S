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
  status: text("status").default("pending").notNull(), // Status (pending, in_progress, extrusion_completed, completed, cancelled)
  customerId: text("customer_id").references(() => customers.id), // Customer ID
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
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  isActive: boolean("is_active").default(true),
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
  assignedTo: text("assigned_to").references(() => users.id),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open, in-progress, completed, verified
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  verifiedBy: text("verified_by").references(() => users.id),
  notes: text("notes"),
});

export const insertCorrectiveActionSchema = createInsertSchema(correctiveActions).omit({ id: true });
export type InsertCorrectiveAction = z.infer<typeof insertCorrectiveActionSchema>;
export type CorrectiveAction = typeof correctiveActions.$inferSelect;

// SMS Messages
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
  messageType: text("message_type").notNull(), // order_notification, status_update, custom, etc.
  twilioMessageId: text("twilio_message_id"),
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({ 
  id: true, 
  sentAt: true, 
  deliveredAt: true, 
  twilioMessageId: true 
});
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;

// Mix Materials table
export const mixMaterials = pgTable("mix_materials", {
  id: serial("id").primaryKey(),
  mixDate: timestamp("mix_date").defaultNow().notNull(),
  mixPerson: text("mix_person").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  totalQuantity: doublePrecision("total_quantity").default(0),
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
  mixDate: true, 
  totalQuantity: true,
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
  mixId: integer("mix_id").notNull().references(() => mixMaterials.id),
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
