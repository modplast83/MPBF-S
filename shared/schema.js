"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertNotificationSchema = exports.notificationCenter = exports.insertSmsNotificationRuleSchema = exports.smsNotificationRules = exports.insertSmsTemplateSchema = exports.smsTemplates = exports.insertSmsMessageSchema = exports.smsMessages = exports.insertQualityPenaltySchema = exports.qualityPenalties = exports.insertQualityViolationSchema = exports.qualityViolations = exports.insertCorrectiveActionSchema = exports.correctiveActions = exports.insertQualityCheckSchema = exports.qualityChecks = exports.insertQualityCheckTypeSchema = exports.qualityCheckTypes = exports.insertFinalProductSchema = exports.finalProducts = exports.insertRawMaterialSchema = exports.rawMaterials = exports.insertMachineSchema = exports.machines = exports.insertPermissionSchema = exports.permissions = exports.insertModuleSchema = exports.modules = exports.createRollSchema = exports.insertRollSchema = exports.rolls = exports.insertJobOrderSchema = exports.jobOrders = exports.insertOrderSchema = exports.orders = exports.insertCustomerProductSchema = exports.customerProducts = exports.insertCustomerSchema = exports.customers = exports.upsertUserSchema = exports.users = exports.sessions = exports.insertMasterBatchSchema = exports.masterBatches = exports.insertSectionSchema = exports.sections = exports.insertItemSchema = exports.items = exports.insertCategorySchema = exports.categories = void 0;
exports.insertMaintenanceRequestSchema = exports.maintenanceRequests = exports.productionTargets = exports.insertNotificationSettingsSchema = exports.notificationSettings = exports.insertBottleneckAlertSchema = exports.bottleneckAlerts = exports.insertProductionMetricsSchema = exports.productionMetrics = exports.insertHrComplaintSchema = exports.hrComplaints = exports.insertHrViolationSchema = exports.hrViolations = exports.insertEmployeeOfMonthSchema = exports.employeeOfMonth = exports.insertTimeAttendanceSchema = exports.timeAttendance = exports.insertAbaMaterialConfigSchema = exports.abaMaterialConfigs = exports.insertMobileDeviceSchema = exports.mobileDevices = exports.insertOperatorUpdateSchema = exports.operatorUpdates = exports.insertOperatorTaskSchema = exports.operatorTasks = exports.insertIotAlertSchema = exports.iotAlerts = exports.insertSensorDataSchema = exports.sensorData = exports.insertMachineSensorSchema = exports.machineSensors = exports.plateCalculationRequestSchema = exports.insertPlateCalculationSchema = exports.plateCalculations = exports.insertPlatePricingParameterSchema = exports.platePricingParameters = exports.insertMaterialInputItemSchema = exports.materialInputItems = exports.insertMaterialInputSchema = exports.materialInputs = exports.insertMixItemSchema = exports.mixItems = exports.insertMixMachineSchema = exports.insertMixMaterialSchema = exports.mixMachines = exports.mixMaterials = exports.insertNotificationTemplateSchema = exports.notificationTemplates = exports.insertNotificationPreferenceSchema = exports.notificationPreferences = void 0;
exports.insertSmsProviderHealthSchema = exports.insertSmsProviderSettingsSchema = exports.smsProviderHealth = exports.smsProviderSettings = exports.insertProductionTargetsSchema = exports.insertMaintenanceScheduleSchema = exports.maintenanceSchedule = exports.insertMaintenanceActionSchema = exports.maintenanceActions = void 0;
// @ts-nocheck
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var zod_1 = require("zod");
// Cliché (Plate) Price Calculations related schemas
// Categories table
exports.categories = (0, pg_core_1.pgTable)("categories", {
    id: (0, pg_core_1.text)("id").primaryKey(), // CID in the provided schema
    name: (0, pg_core_1.text)("name").notNull(), // Category Name
    code: (0, pg_core_1.text)("code").notNull().unique(), // Category Code
});
exports.insertCategorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.categories);
// Items table
exports.items = (0, pg_core_1.pgTable)("items", {
    id: (0, pg_core_1.text)("id").primaryKey(), // ItemID
    categoryId: (0, pg_core_1.text)("category_id").notNull().references(function () { return exports.categories.id; }), // CategoriesID
    name: (0, pg_core_1.text)("name").notNull(), // Items Name
    fullName: (0, pg_core_1.text)("full_name").notNull(), // Item Full Name
});
exports.insertItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.items);
// Sections table
exports.sections = (0, pg_core_1.pgTable)("sections", {
    id: (0, pg_core_1.text)("id").primaryKey(), // Section ID
    name: (0, pg_core_1.text)("name").notNull(), // Section Name
});
exports.insertSectionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.sections);
// Master Batch table
exports.masterBatches = (0, pg_core_1.pgTable)("master_batches", {
    id: (0, pg_core_1.text)("id").primaryKey(), // MasterBatch ID
    name: (0, pg_core_1.text)("name").notNull(), // Master Batch
});
exports.insertMasterBatchSchema = (0, drizzle_zod_1.createInsertSchema)(exports.masterBatches);
// Session storage table for Replit Auth
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    sid: (0, pg_core_1.varchar)("sid").primaryKey(),
    sess: (0, pg_core_1.jsonb)("sess").notNull(),
    expire: (0, pg_core_1.timestamp)("expire").notNull(),
}, function (table) { return [(0, pg_core_1.index)("IDX_session_expire").on(table.expire)]; });
// Users table
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.varchar)("id").primaryKey().notNull(), // UID
    username: (0, pg_core_1.varchar)("username").unique().notNull(), // Username
    password: (0, pg_core_1.text)("password"), // Password - hashed
    email: (0, pg_core_1.varchar)("email").unique(), // Email
    firstName: (0, pg_core_1.varchar)("first_name"), // First name
    lastName: (0, pg_core_1.varchar)("last_name"), // Last name
    bio: (0, pg_core_1.text)("bio"), // Bio
    profileImageUrl: (0, pg_core_1.varchar)("profile_image_url"), // Profile image URL
    isAdmin: (0, pg_core_1.boolean)("is_admin").default(false).notNull(), // True for administrators, false for regular users
    phone: (0, pg_core_1.text)("phone"),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    sectionId: (0, pg_core_1.text)("section_id").references(function () { return exports.sections.id; }), // UserSection
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.upsertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users);
// Customers table
exports.customers = (0, pg_core_1.pgTable)("customers", {
    id: (0, pg_core_1.text)("id").primaryKey(), // CID
    code: (0, pg_core_1.text)("code").notNull().unique(), // Customer Code
    name: (0, pg_core_1.text)("name").notNull(), // Customer Name
    nameAr: (0, pg_core_1.text)("name_ar"), // Customer Name Ar
    userId: (0, pg_core_1.text)("user_id").references(function () { return exports.users.id; }), // UserID (Sales)
    plateDrawerCode: (0, pg_core_1.text)("plate_drawer_code"), // Plate Drawer Code
});
exports.insertCustomerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.customers);
// Customer Products table
exports.customerProducts = (0, pg_core_1.pgTable)("customer_products", {
    id: (0, pg_core_1.serial)("id").primaryKey(), // CPID
    customerId: (0, pg_core_1.text)("customer_id").notNull().references(function () { return exports.customers.id; }), // Customer ID
    categoryId: (0, pg_core_1.text)("category_id").notNull().references(function () { return exports.categories.id; }), // CategoryID
    itemId: (0, pg_core_1.text)("item_id").notNull().references(function () { return exports.items.id; }), // ItemID
    sizeCaption: (0, pg_core_1.text)("size_caption"), // Size Caption
    width: (0, pg_core_1.doublePrecision)("width"), // Width
    leftF: (0, pg_core_1.doublePrecision)("left_f"), // Left F
    rightF: (0, pg_core_1.doublePrecision)("right_f"), // Right F
    thickness: (0, pg_core_1.doublePrecision)("thickness"), // Thickness
    thicknessOne: (0, pg_core_1.doublePrecision)("thickness_one"), // Thickness One
    printingCylinder: (0, pg_core_1.doublePrecision)("printing_cylinder"), // Printing Cylinder (Inch)
    lengthCm: (0, pg_core_1.doublePrecision)("length_cm"), // Length (Cm)
    cuttingLength: (0, pg_core_1.doublePrecision)("cutting_length_cm"), // Cutting Length (CM)
    rawMaterial: (0, pg_core_1.text)("raw_material"), // Raw Material
    masterBatchId: (0, pg_core_1.text)("master_batch_id").references(function () { return exports.masterBatches.id; }), // Master Batch ID
    printed: (0, pg_core_1.text)("printed"), // Printed
    cuttingUnit: (0, pg_core_1.text)("cutting_unit"), // Cutting Unit
    unitWeight: (0, pg_core_1.doublePrecision)("unit_weight_kg"), // Unit Weight (Kg)
    packing: (0, pg_core_1.text)("packing"), // Packing
    punching: (0, pg_core_1.text)("punching"), // Punching
    cover: (0, pg_core_1.text)("cover"), // Cover
    volum: (0, pg_core_1.text)("volum"), // Volum
    knife: (0, pg_core_1.text)("knife"), // Knife
    notes: (0, pg_core_1.text)("notes"), // Notes
}, function (table) {
    return {
        customerProductUnique: (0, pg_core_1.unique)().on(table.customerId, table.itemId),
    };
});
exports.insertCustomerProductSchema = (0, drizzle_zod_1.createInsertSchema)(exports.customerProducts).omit({ id: true });
// Orders table
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(), // ID
    date: (0, pg_core_1.timestamp)("date").defaultNow().notNull(), // Order Date
    customerId: (0, pg_core_1.text)("customer_id").notNull().references(function () { return exports.customers.id; }), // Customer ID
    note: (0, pg_core_1.text)("note"), // Order Note
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // Status (pending, processing, completed)
    userId: (0, pg_core_1.text)("user_id").references(function () { return exports.users.id; }), // Created by
});
exports.insertOrderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.orders).omit({ id: true, date: true, status: true });
// Job Orders table
exports.jobOrders = (0, pg_core_1.pgTable)("job_orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(), // ID
    orderId: (0, pg_core_1.integer)("order_id").notNull().references(function () { return exports.orders.id; }), // Order ID
    customerProductId: (0, pg_core_1.integer)("customer_product_id").notNull().references(function () { return exports.customerProducts.id; }), // Customer Product No
    quantity: (0, pg_core_1.doublePrecision)("quantity").notNull(), // Qty Kg
    finishedQty: (0, pg_core_1.doublePrecision)("finished_qty").default(0).notNull(), // Finished quantity (kg)
    receivedQty: (0, pg_core_1.doublePrecision)("received_qty").default(0).notNull(), // Received quantity (kg)
    status: (0, pg_core_1.text)("status").default("pending").notNull(), // Status (pending, in_progress, extrusion_completed, completed, cancelled, received, partially_received)
    customerId: (0, pg_core_1.text)("customer_id").references(function () { return exports.customers.id; }), // Customer ID
    receiveDate: (0, pg_core_1.timestamp)("receive_date"), // Date when received in warehouse
    receivedBy: (0, pg_core_1.text)("received_by").references(function () { return exports.users.id; }), // User who received the job order
}, function (table) {
    return {
        jobOrderUnique: (0, pg_core_1.unique)().on(table.orderId, table.customerProductId),
    };
});
exports.insertJobOrderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.jobOrders).omit({ id: true });
// Rolls table
exports.rolls = (0, pg_core_1.pgTable)("rolls", {
    id: (0, pg_core_1.text)("id").primaryKey(), // ID
    jobOrderId: (0, pg_core_1.integer)("job_order_id").notNull().references(function () { return exports.jobOrders.id; }), // Job Order ID
    serialNumber: (0, pg_core_1.text)("roll_serial").notNull(), // Roll Serial
    extrudingQty: (0, pg_core_1.doublePrecision)("extruding_qty").default(0), // Extruding Qty
    printingQty: (0, pg_core_1.doublePrecision)("printing_qty").default(0), // Printing Qty
    cuttingQty: (0, pg_core_1.doublePrecision)("cutting_qty").default(0), // Cutting Qty
    currentStage: (0, pg_core_1.text)("current_stage").notNull().default("extrusion"), // Current stage (extrusion, printing, cutting, completed)
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // Status (pending, processing, completed)
    wasteQty: (0, pg_core_1.doublePrecision)("waste_qty").default(0), // Waste quantity in kg (difference between printing and cutting)
    wastePercentage: (0, pg_core_1.doublePrecision)("waste_percentage").default(0), // Waste percentage
    createdById: (0, pg_core_1.text)("created_by_id").references(function () { return exports.users.id; }), // User who created the roll (extrusion)
    printedById: (0, pg_core_1.text)("printed_by_id").references(function () { return exports.users.id; }), // User who printed the roll
    cutById: (0, pg_core_1.text)("cut_by_id").references(function () { return exports.users.id; }), // User who cut the roll
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(), // Creation timestamp
    printedAt: (0, pg_core_1.timestamp)("printed_at"), // Printing timestamp
    cutAt: (0, pg_core_1.timestamp)("cut_at"), // Cutting timestamp
});
exports.insertRollSchema = (0, drizzle_zod_1.createInsertSchema)(exports.rolls);
// Create a custom schema for roll creation API that makes id and serialNumber optional
// since they'll be auto-generated on the server
exports.createRollSchema = exports.insertRollSchema.omit({
    id: true,
    serialNumber: true
});
// Modules table for system modules
exports.modules = (0, pg_core_1.pgTable)("modules", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull().unique(),
    displayName: (0, pg_core_1.text)("display_name").notNull(),
    description: (0, pg_core_1.text)("description"),
    category: (0, pg_core_1.text)("category").notNull(), // 'setup', 'production', 'quality', 'warehouse', 'system', etc.
    route: (0, pg_core_1.text)("route"), // URL route for the module
    icon: (0, pg_core_1.text)("icon"), // Icon name for UI
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.insertModuleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.modules).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
// Section-based permissions table
exports.permissions = (0, pg_core_1.pgTable)("permissions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    sectionId: (0, pg_core_1.text)("section_id").notNull().references(function () { return exports.sections.id; }),
    moduleId: (0, pg_core_1.integer)("module_id").notNull().references(function () { return exports.modules.id; }),
    canView: (0, pg_core_1.boolean)("can_view").default(false),
    canCreate: (0, pg_core_1.boolean)("can_create").default(false),
    canEdit: (0, pg_core_1.boolean)("can_edit").default(false),
    canDelete: (0, pg_core_1.boolean)("can_delete").default(false),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, function (table) { return ({
    uniqueIndex: (0, pg_core_1.unique)().on(table.sectionId, table.moduleId),
}); });
exports.insertPermissionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.permissions).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
// Machines table
exports.machines = (0, pg_core_1.pgTable)("machines", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    sectionId: (0, pg_core_1.text)("section_id").references(function () { return exports.sections.id; }),
    serialNumber: (0, pg_core_1.text)("serial_number"),
    supplier: (0, pg_core_1.text)("supplier"),
    dateOfManufacturing: (0, pg_core_1.timestamp)("date_of_manufacturing"),
    modelNumber: (0, pg_core_1.text)("model_number"),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
});
exports.insertMachineSchema = (0, drizzle_zod_1.createInsertSchema)(exports.machines);
// Raw Materials table
exports.rawMaterials = (0, pg_core_1.pgTable)("raw_materials", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    type: (0, pg_core_1.text)("type").notNull(),
    quantity: (0, pg_core_1.doublePrecision)("quantity").default(0),
    unit: (0, pg_core_1.text)("unit").notNull(),
    lastUpdated: (0, pg_core_1.timestamp)("last_updated").defaultNow(),
});
exports.insertRawMaterialSchema = (0, drizzle_zod_1.createInsertSchema)(exports.rawMaterials).omit({ id: true, lastUpdated: true });
// Final Products table
exports.finalProducts = (0, pg_core_1.pgTable)("final_products", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    jobOrderId: (0, pg_core_1.integer)("job_order_id").notNull().references(function () { return exports.jobOrders.id; }),
    quantity: (0, pg_core_1.doublePrecision)("quantity").notNull(),
    completedDate: (0, pg_core_1.timestamp)("completed_date").defaultNow(),
    status: (0, pg_core_1.text)("status").notNull().default("in-stock"),
});
exports.insertFinalProductSchema = (0, drizzle_zod_1.createInsertSchema)(exports.finalProducts).omit({ id: true, completedDate: true });
// Quality Check Types
exports.qualityCheckTypes = (0, pg_core_1.pgTable)("quality_check_types", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    checklistItems: (0, pg_core_1.text)("checklist_items").array(),
    parameters: (0, pg_core_1.text)("parameters").array(),
    targetStage: (0, pg_core_1.text)("target_stage").notNull(), // extrusion, printing, cutting, final
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
});
exports.insertQualityCheckTypeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.qualityCheckTypes);
// Quality Checks
exports.qualityChecks = (0, pg_core_1.pgTable)("quality_checks", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    checkTypeId: (0, pg_core_1.text)("check_type_id").notNull().references(function () { return exports.qualityCheckTypes.id; }),
    rollId: (0, pg_core_1.text)("roll_id").references(function () { return exports.rolls.id; }),
    jobOrderId: (0, pg_core_1.integer)("job_order_id").references(function () { return exports.jobOrders.id; }),
    performedBy: (0, pg_core_1.text)("performed_by").references(function () { return exports.users.id; }),
    timestamp: (0, pg_core_1.timestamp)("timestamp").defaultNow().notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // pending, passed, failed
    notes: (0, pg_core_1.text)("notes"),
    checklistResults: (0, pg_core_1.text)("checklist_results").array(),
    parameterValues: (0, pg_core_1.text)("parameter_values").array(),
    issueSeverity: (0, pg_core_1.text)("issue_severity"), // minor, major, critical
    imageUrls: (0, pg_core_1.text)("image_urls").array(),
});
exports.insertQualityCheckSchema = (0, drizzle_zod_1.createInsertSchema)(exports.qualityChecks).omit({ id: true, timestamp: true });
// Corrective Actions
exports.correctiveActions = (0, pg_core_1.pgTable)("corrective_actions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    qualityCheckId: (0, pg_core_1.integer)("quality_check_id").notNull().references(function () { return exports.qualityChecks.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at"),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    assignedTo: (0, pg_core_1.text)("assigned_to").references(function () { return exports.users.id; }),
    completedBy: (0, pg_core_1.text)("completed_by").references(function () { return exports.users.id; }),
    action: (0, pg_core_1.text)("action"),
    status: (0, pg_core_1.text)("status").notNull().default("open"), // open, in-progress, completed, verified
});
exports.insertCorrectiveActionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.correctiveActions).omit({ id: true });
// Quality Violations
exports.qualityViolations = (0, pg_core_1.pgTable)("quality_violations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    qualityCheckId: (0, pg_core_1.integer)("quality_check_id").notNull().references(function () { return exports.qualityChecks.id; }),
    reportedBy: (0, pg_core_1.text)("reported_by").references(function () { return exports.users.id; }),
    violationType: (0, pg_core_1.text)("violation_type").notNull(), // "procedural", "material", "equipment", "personnel"
    severity: (0, pg_core_1.text)("severity").notNull(), // "minor", "major", "critical"
    description: (0, pg_core_1.text)("description").notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("open"), // "open", "investigating", "resolved", "dismissed"
    reportDate: (0, pg_core_1.timestamp)("report_date").defaultNow().notNull(),
    resolutionDate: (0, pg_core_1.timestamp)("resolution_date"),
    affectedArea: (0, pg_core_1.text)("affected_area").notNull(), // "extrusion", "printing", "cutting", etc.
    rootCause: (0, pg_core_1.text)("root_cause"),
    imageUrls: (0, pg_core_1.text)("image_urls").array(),
    notes: (0, pg_core_1.text)("notes"),
});
exports.insertQualityViolationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.qualityViolations).omit({ id: true, reportDate: true });
// Penalties for Quality Violations
exports.qualityPenalties = (0, pg_core_1.pgTable)("quality_penalties", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    violationId: (0, pg_core_1.integer)("violation_id").notNull().references(function () { return exports.qualityViolations.id; }),
    assignedTo: (0, pg_core_1.text)("assigned_to").notNull().references(function () { return exports.users.id; }),
    assignedBy: (0, pg_core_1.text)("assigned_by").notNull().references(function () { return exports.users.id; }),
    penaltyType: (0, pg_core_1.text)("penalty_type").notNull(), // "warning", "financial", "training", "suspension"
    description: (0, pg_core_1.text)("description").notNull(),
    amount: (0, pg_core_1.doublePrecision)("amount"), // For financial penalties
    currency: (0, pg_core_1.text)("currency"), // For financial penalties
    startDate: (0, pg_core_1.timestamp)("start_date").notNull(),
    endDate: (0, pg_core_1.timestamp)("end_date"),
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // "pending", "active", "completed", "appealed", "cancelled"
    verifiedBy: (0, pg_core_1.text)("verified_by").references(function () { return exports.users.id; }),
    verificationDate: (0, pg_core_1.timestamp)("verification_date"),
    comments: (0, pg_core_1.text)("comments"),
    appealDetails: (0, pg_core_1.text)("appeal_details"),
    supportingDocuments: (0, pg_core_1.text)("supporting_documents").array(),
});
exports.insertQualityPenaltySchema = (0, drizzle_zod_1.createInsertSchema)(exports.qualityPenalties).omit({ id: true });
// SMS Messages with Professional Notifications
exports.smsMessages = (0, pg_core_1.pgTable)("sms_messages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    recipientPhone: (0, pg_core_1.text)("recipient_phone").notNull(),
    recipientName: (0, pg_core_1.text)("recipient_name"),
    message: (0, pg_core_1.text)("message").notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // pending, sent, failed, delivered
    orderId: (0, pg_core_1.integer)("order_id").references(function () { return exports.orders.id; }),
    jobOrderId: (0, pg_core_1.integer)("job_order_id").references(function () { return exports.jobOrders.id; }),
    customerId: (0, pg_core_1.text)("customer_id").references(function () { return exports.customers.id; }),
    sentBy: (0, pg_core_1.text)("sent_by").references(function () { return exports.users.id; }),
    sentAt: (0, pg_core_1.timestamp)("sent_at").defaultNow(),
    deliveredAt: (0, pg_core_1.timestamp)("delivered_at"),
    errorMessage: (0, pg_core_1.text)("error_message"),
    messageType: (0, pg_core_1.text)("message_type").notNull(), // order_notification, status_update, custom, bottleneck_alert, quality_alert, maintenance_alert, hr_notification
    twilioMessageId: (0, pg_core_1.text)("twilio_message_id"),
    priority: (0, pg_core_1.text)("priority").notNull().default("normal"), // low, normal, high, urgent
    category: (0, pg_core_1.text)("category").notNull().default("general"), // general, production, quality, maintenance, hr, management
    templateId: (0, pg_core_1.text)("template_id"), // Reference to message template
    scheduledFor: (0, pg_core_1.timestamp)("scheduled_for"), // For scheduled messages
    isScheduled: (0, pg_core_1.boolean)("is_scheduled").default(false),
    retryCount: (0, pg_core_1.integer)("retry_count").default(0),
    lastRetryAt: (0, pg_core_1.timestamp)("last_retry_at"),
    metadata: (0, pg_core_1.jsonb)("metadata"), // Additional data like order details, alert info, etc.
});
exports.insertSmsMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.smsMessages).omit({
    id: true,
    sentAt: true,
    lastRetryAt: true
}).extend({
    twilioMessageId: zod_1.z.string().nullable().optional(),
    deliveredAt: zod_1.z.date().nullable().optional()
});
// SMS Templates for Professional Notifications
exports.smsTemplates = (0, pg_core_1.pgTable)("sms_templates", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    category: (0, pg_core_1.text)("category").notNull(), // production, quality, maintenance, hr, management, custom
    messageType: (0, pg_core_1.text)("message_type").notNull(),
    template: (0, pg_core_1.text)("template").notNull(), // Message template with placeholders
    variables: (0, pg_core_1.text)("variables").array(), // Available variables for template
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdBy: (0, pg_core_1.text)("created_by").references(function () { return exports.users.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.insertSmsTemplateSchema = (0, drizzle_zod_1.createInsertSchema)(exports.smsTemplates);
// SMS Notification Rules
exports.smsNotificationRules = (0, pg_core_1.pgTable)("sms_notification_rules", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    triggerEvent: (0, pg_core_1.text)("trigger_event").notNull(), // order_created, order_completed, bottleneck_detected, etc.
    conditions: (0, pg_core_1.jsonb)("conditions"), // JSON conditions for when to trigger
    templateId: (0, pg_core_1.text)("template_id").references(function () { return exports.smsTemplates.id; }),
    recipientRoles: (0, pg_core_1.text)("recipient_roles").array(), // Which roles should receive notifications
    recipientUsers: (0, pg_core_1.text)("recipient_users").array(), // Specific users to notify
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    priority: (0, pg_core_1.text)("priority").default("normal"),
    cooldownMinutes: (0, pg_core_1.integer)("cooldown_minutes").default(0), // Prevent spam
    workingHoursOnly: (0, pg_core_1.boolean)("working_hours_only").default(false),
    createdBy: (0, pg_core_1.text)("created_by").references(function () { return exports.users.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertSmsNotificationRuleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.smsNotificationRules).omit({ id: true });
// Notification Center with Priority Management
exports.notificationCenter = (0, pg_core_1.pgTable)("notification_center", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    type: (0, pg_core_1.text)("type").notNull(), // system, alert, warning, info, success, quality, production, maintenance, hr
    priority: (0, pg_core_1.text)("priority").notNull().default("medium"), // low, medium, high, critical, urgent
    category: (0, pg_core_1.text)("category").notNull(), // production, quality, maintenance, hr, system, order, inventory
    source: (0, pg_core_1.text)("source").notNull(), // module that generated the notification
    userId: (0, pg_core_1.text)("user_id").references(function () { return exports.users.id; }), // specific user (null for broadcast)
    userRole: (0, pg_core_1.text)("user_role"), // role-based notifications
    isRead: (0, pg_core_1.boolean)("is_read").default(false),
    isArchived: (0, pg_core_1.boolean)("is_archived").default(false),
    isDismissed: (0, pg_core_1.boolean)("is_dismissed").default(false),
    actionRequired: (0, pg_core_1.boolean)("action_required").default(false),
    actionUrl: (0, pg_core_1.text)("action_url"), // URL to navigate for action
    actionData: (0, pg_core_1.jsonb)("action_data"), // Additional data for action
    expiresAt: (0, pg_core_1.timestamp)("expires_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
    readAt: (0, pg_core_1.timestamp)("read_at"),
    dismissedAt: (0, pg_core_1.timestamp)("dismissed_at"),
    metadata: (0, pg_core_1.jsonb)("metadata"), // Additional context data
});
exports.insertNotificationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.notificationCenter).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    readAt: true,
    dismissedAt: true
});
// Notification Preferences for Users
exports.notificationPreferences = (0, pg_core_1.pgTable)("notification_preferences", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.text)("user_id").notNull().references(function () { return exports.users.id; }),
    category: (0, pg_core_1.text)("category").notNull(), // production, quality, maintenance, hr, system
    enabled: (0, pg_core_1.boolean)("enabled").default(true),
    priority: (0, pg_core_1.text)("priority").notNull().default("medium"), // minimum priority to receive
    emailEnabled: (0, pg_core_1.boolean)("email_enabled").default(false),
    smsEnabled: (0, pg_core_1.boolean)("sms_enabled").default(false),
    pushEnabled: (0, pg_core_1.boolean)("push_enabled").default(true),
    soundEnabled: (0, pg_core_1.boolean)("sound_enabled").default(true),
    quietHours: (0, pg_core_1.jsonb)("quiet_hours"), // {start: "22:00", end: "06:00"}
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.insertNotificationPreferenceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.notificationPreferences).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
// Notification Templates for Auto-Generation
exports.notificationTemplates = (0, pg_core_1.pgTable)("notification_templates", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    type: (0, pg_core_1.text)("type").notNull(),
    priority: (0, pg_core_1.text)("priority").notNull().default("medium"),
    title: (0, pg_core_1.text)("title").notNull(), // Template with placeholders
    message: (0, pg_core_1.text)("message").notNull(), // Template with placeholders
    actionRequired: (0, pg_core_1.boolean)("action_required").default(false),
    actionUrl: (0, pg_core_1.text)("action_url"), // URL template
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    triggerEvent: (0, pg_core_1.text)("trigger_event"), // Event that triggers this notification
    conditions: (0, pg_core_1.jsonb)("conditions"), // Conditions for triggering
    createdBy: (0, pg_core_1.text)("created_by").references(function () { return exports.users.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.insertNotificationTemplateSchema = (0, drizzle_zod_1.createInsertSchema)(exports.notificationTemplates).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
// Mix Materials table
exports.mixMaterials = (0, pg_core_1.pgTable)("mix_materials", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    mixDate: (0, pg_core_1.timestamp)("mix_date").defaultNow().notNull(),
    mixPerson: (0, pg_core_1.text)("mix_person").notNull().references(function () { return exports.users.id; }),
    orderId: (0, pg_core_1.integer)("order_id").references(function () { return exports.orders.id; }),
    totalQuantity: (0, pg_core_1.doublePrecision)("total_quantity").default(0),
    mixScrew: (0, pg_core_1.text)("mix_screw"), // A or B for the screw type
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Mix Machines junction table
exports.mixMachines = (0, pg_core_1.pgTable)("mix_machines", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    mixId: (0, pg_core_1.integer)("mix_id").notNull().references(function () { return exports.mixMaterials.id; }, { onDelete: "cascade" }),
    machineId: (0, pg_core_1.text)("machine_id").notNull().references(function () { return exports.machines.id; }),
}, function (table) { return ({
    uniqueIndex: (0, pg_core_1.unique)().on(table.mixId, table.machineId),
}); });
exports.insertMixMaterialSchema = (0, drizzle_zod_1.createInsertSchema)(exports.mixMaterials).omit({
    id: true,
    createdAt: true
});
exports.insertMixMachineSchema = (0, drizzle_zod_1.createInsertSchema)(exports.mixMachines).omit({
    id: true
});
// Mix Items table
exports.mixItems = (0, pg_core_1.pgTable)("mix_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    mixId: (0, pg_core_1.integer)("mix_id").notNull().references(function () { return exports.mixMaterials.id; }, { onDelete: "cascade" }),
    rawMaterialId: (0, pg_core_1.integer)("raw_material_id").notNull().references(function () { return exports.rawMaterials.id; }),
    quantity: (0, pg_core_1.doublePrecision)("quantity").notNull(),
    percentage: (0, pg_core_1.doublePrecision)("percentage").default(0),
});
exports.insertMixItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.mixItems).omit({
    id: true,
    percentage: true
});
// Material Inputs table
exports.materialInputs = (0, pg_core_1.pgTable)("material_inputs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    date: (0, pg_core_1.timestamp)("date").defaultNow().notNull(),
    userId: (0, pg_core_1.text)("user_id").notNull().references(function () { return exports.users.id; }), // User who performed the input
    notes: (0, pg_core_1.text)("notes"),
});
exports.insertMaterialInputSchema = (0, drizzle_zod_1.createInsertSchema)(exports.materialInputs).omit({
    id: true,
    date: true
});
// Material Input Items table
exports.materialInputItems = (0, pg_core_1.pgTable)("material_input_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    inputId: (0, pg_core_1.integer)("input_id").notNull().references(function () { return exports.materialInputs.id; }, { onDelete: "cascade" }),
    rawMaterialId: (0, pg_core_1.integer)("raw_material_id").notNull().references(function () { return exports.rawMaterials.id; }),
    quantity: (0, pg_core_1.doublePrecision)("quantity").notNull(),
});
exports.insertMaterialInputItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.materialInputItems).omit({
    id: true
});
// Cliché (Plate) Pricing Parameters
exports.platePricingParameters = (0, pg_core_1.pgTable)("plate_pricing_parameters", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(), // Parameter name (e.g., "Base price per cm²")
    value: (0, pg_core_1.doublePrecision)("value").notNull(), // Value of the parameter
    description: (0, pg_core_1.text)("description"), // Description of the parameter
    type: (0, pg_core_1.text)("type").notNull(), // Type of parameter (base_price, multiplier, etc.)
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    lastUpdated: (0, pg_core_1.timestamp)("last_updated").defaultNow(),
});
exports.insertPlatePricingParameterSchema = (0, drizzle_zod_1.createInsertSchema)(exports.platePricingParameters).omit({ id: true, lastUpdated: true });
// Plate Calculations
exports.plateCalculations = (0, pg_core_1.pgTable)("plate_calculations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    customerId: (0, pg_core_1.text)("customer_id").references(function () { return exports.customers.id; }),
    width: (0, pg_core_1.doublePrecision)("width").notNull(), // Width in cm
    height: (0, pg_core_1.doublePrecision)("height").notNull(), // Height in cm
    area: (0, pg_core_1.doublePrecision)("area").notNull(), // Area in cm²
    colors: (0, pg_core_1.integer)("colors").notNull().default(1), // Number of colors
    plateType: (0, pg_core_1.text)("plate_type").notNull(), // Type of plate (standard, premium, etc.)
    thickness: (0, pg_core_1.doublePrecision)("thickness"), // Thickness in mm
    calculatedPrice: (0, pg_core_1.doublePrecision)("calculated_price").notNull(), // Final calculated price
    basePricePerUnit: (0, pg_core_1.doublePrecision)("base_price_per_unit"), // Base price per cm²
    colorMultiplier: (0, pg_core_1.doublePrecision)("color_multiplier"), // Multiplier based on colors
    thicknessMultiplier: (0, pg_core_1.doublePrecision)("thickness_multiplier"), // Multiplier based on thickness
    customerDiscount: (0, pg_core_1.doublePrecision)("customer_discount"), // Customer specific discount percentage
    notes: (0, pg_core_1.text)("notes"), // Additional notes
    createdById: (0, pg_core_1.text)("created_by_id").references(function () { return exports.users.id; }), // User who created the calculation
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertPlateCalculationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.plateCalculations).omit({ id: true, area: true, calculatedPrice: true, createdAt: true });
// Cliché Calculation Request Schema (for the frontend)
exports.plateCalculationRequestSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    width: zod_1.z.number().positive("Width must be positive"),
    height: zod_1.z.number().positive("Height must be positive"),
    colors: zod_1.z.number().int().positive("Number of colors must be positive").default(1),
    plateType: zod_1.z.string(),
    thickness: zod_1.z.number().optional(),
    customerDiscount: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional(),
});
// IoT Integration Module - Machine Sensors
exports.machineSensors = (0, pg_core_1.pgTable)("machine_sensors", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    machineId: (0, pg_core_1.text)("machine_id").notNull().references(function () { return exports.machines.id; }),
    sensorType: (0, pg_core_1.text)("sensor_type").notNull(), // temperature, pressure, speed, vibration, energy, status
    name: (0, pg_core_1.text)("name").notNull(),
    unit: (0, pg_core_1.text)("unit"), // °C, bar, rpm, Hz, kW, boolean
    minValue: (0, pg_core_1.doublePrecision)("min_value"),
    maxValue: (0, pg_core_1.doublePrecision)("max_value"),
    warningThreshold: (0, pg_core_1.doublePrecision)("warning_threshold"),
    criticalThreshold: (0, pg_core_1.doublePrecision)("critical_threshold"),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    calibrationDate: (0, pg_core_1.timestamp)("calibration_date"),
    nextCalibrationDate: (0, pg_core_1.timestamp)("next_calibration_date"),
});
exports.insertMachineSensorSchema = (0, drizzle_zod_1.createInsertSchema)(exports.machineSensors);
// IoT Sensor Data
exports.sensorData = (0, pg_core_1.pgTable)("sensor_data", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    sensorId: (0, pg_core_1.text)("sensor_id").notNull().references(function () { return exports.machineSensors.id; }),
    value: (0, pg_core_1.doublePrecision)("value").notNull(),
    timestamp: (0, pg_core_1.timestamp)("timestamp").defaultNow().notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("normal"), // normal, warning, critical
    metadata: (0, pg_core_1.jsonb)("metadata"), // Additional sensor-specific data
});
exports.insertSensorDataSchema = (0, drizzle_zod_1.createInsertSchema)(exports.sensorData).omit({ id: true, timestamp: true });
// IoT Alerts
exports.iotAlerts = (0, pg_core_1.pgTable)("iot_alerts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    sensorId: (0, pg_core_1.text)("sensor_id").notNull().references(function () { return exports.machineSensors.id; }),
    alertType: (0, pg_core_1.text)("alert_type").notNull(), // threshold_exceeded, sensor_offline, anomaly_detected
    severity: (0, pg_core_1.text)("severity").notNull(), // warning, critical, emergency
    message: (0, pg_core_1.text)("message").notNull(),
    currentValue: (0, pg_core_1.doublePrecision)("current_value"),
    thresholdValue: (0, pg_core_1.doublePrecision)("threshold_value"),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    acknowledgedBy: (0, pg_core_1.text)("acknowledged_by").references(function () { return exports.users.id; }),
    acknowledgedAt: (0, pg_core_1.timestamp)("acknowledged_at"),
    resolvedBy: (0, pg_core_1.text)("resolved_by").references(function () { return exports.users.id; }),
    resolvedAt: (0, pg_core_1.timestamp)("resolved_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertIotAlertSchema = (0, drizzle_zod_1.createInsertSchema)(exports.iotAlerts).omit({ id: true, createdAt: true });
// Mobile App - Operator Tasks
exports.operatorTasks = (0, pg_core_1.pgTable)("operator_tasks", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    assignedTo: (0, pg_core_1.text)("assigned_to").notNull().references(function () { return exports.users.id; }),
    taskType: (0, pg_core_1.text)("task_type").notNull(), // quality_check, maintenance, production_update, material_input
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    priority: (0, pg_core_1.text)("priority").notNull().default("normal"), // low, normal, high, urgent
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
    dueDate: (0, pg_core_1.timestamp)("due_date"),
    relatedJobOrderId: (0, pg_core_1.integer)("related_job_order_id").references(function () { return exports.jobOrders.id; }),
    relatedMachineId: (0, pg_core_1.text)("related_machine_id").references(function () { return exports.machines.id; }),
    relatedRollId: (0, pg_core_1.text)("related_roll_id").references(function () { return exports.rolls.id; }),
    assignedBy: (0, pg_core_1.text)("assigned_by").references(function () { return exports.users.id; }),
    startedAt: (0, pg_core_1.timestamp)("started_at"),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    estimatedDuration: (0, pg_core_1.integer)("estimated_duration"), // in minutes
    actualDuration: (0, pg_core_1.integer)("actual_duration"), // in minutes
    notes: (0, pg_core_1.text)("notes"),
    attachments: (0, pg_core_1.text)("attachments").array(), // photo URLs
    gpsLocation: (0, pg_core_1.text)("gps_location"), // latitude,longitude
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertOperatorTaskSchema = (0, drizzle_zod_1.createInsertSchema)(exports.operatorTasks).omit({ id: true, createdAt: true });
// Mobile App - Quick Updates from operators
exports.operatorUpdates = (0, pg_core_1.pgTable)("operator_updates", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    operatorId: (0, pg_core_1.text)("operator_id").notNull().references(function () { return exports.users.id; }),
    updateType: (0, pg_core_1.text)("update_type").notNull(), // status_update, issue_report, progress_update, completion_report
    title: (0, pg_core_1.text)("title").notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    relatedJobOrderId: (0, pg_core_1.integer)("related_job_order_id").references(function () { return exports.jobOrders.id; }),
    relatedMachineId: (0, pg_core_1.text)("related_machine_id").references(function () { return exports.machines.id; }),
    relatedRollId: (0, pg_core_1.text)("related_roll_id").references(function () { return exports.rolls.id; }),
    priority: (0, pg_core_1.text)("priority").default("normal"),
    status: (0, pg_core_1.text)("status").default("new"), // new, acknowledged, resolved
    photos: (0, pg_core_1.text)("photos").array(), // photo URLs
    gpsLocation: (0, pg_core_1.text)("gps_location"),
    acknowledgedBy: (0, pg_core_1.text)("acknowledged_by").references(function () { return exports.users.id; }),
    acknowledgedAt: (0, pg_core_1.timestamp)("acknowledged_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertOperatorUpdateSchema = (0, drizzle_zod_1.createInsertSchema)(exports.operatorUpdates).omit({ id: true, createdAt: true });
// Mobile App - Device Registration
exports.mobileDevices = (0, pg_core_1.pgTable)("mobile_devices", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    userId: (0, pg_core_1.text)("user_id").notNull().references(function () { return exports.users.id; }),
    deviceName: (0, pg_core_1.text)("device_name").notNull(),
    deviceType: (0, pg_core_1.text)("device_type").notNull(), // android, ios
    deviceModel: (0, pg_core_1.text)("device_model"),
    appVersion: (0, pg_core_1.text)("app_version"),
    osVersion: (0, pg_core_1.text)("os_version"),
    pushToken: (0, pg_core_1.text)("push_token"), // for push notifications
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    lastActive: (0, pg_core_1.timestamp)("last_active").defaultNow(),
    registeredAt: (0, pg_core_1.timestamp)("registered_at").defaultNow(),
});
exports.insertMobileDeviceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.mobileDevices).omit({ registeredAt: true });
// ABA Material Configurations table for storing ABA calculator formulas
exports.abaMaterialConfigs = (0, pg_core_1.pgTable)("aba_material_configs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    createdBy: (0, pg_core_1.text)("created_by").notNull().references(function () { return exports.users.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    isDefault: (0, pg_core_1.boolean)("is_default").default(false),
    configData: (0, pg_core_1.jsonb)("config_data").notNull(), // Stores the MaterialDistribution[] array as JSON
});
exports.insertAbaMaterialConfigSchema = (0, drizzle_zod_1.createInsertSchema)(exports.abaMaterialConfigs).omit({ id: true, createdAt: true });
// HR Module Tables
// Time Attendance
exports.timeAttendance = (0, pg_core_1.pgTable)("time_attendance", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.text)("user_id").notNull().references(function () { return exports.users.id; }),
    date: (0, pg_core_1.timestamp)("date").notNull(),
    checkInTime: (0, pg_core_1.timestamp)("check_in_time"),
    checkOutTime: (0, pg_core_1.timestamp)("check_out_time"),
    breakStartTime: (0, pg_core_1.timestamp)("break_start_time"),
    breakEndTime: (0, pg_core_1.timestamp)("break_end_time"),
    workingHours: (0, pg_core_1.doublePrecision)("working_hours").default(0), // in hours
    overtimeHours: (0, pg_core_1.doublePrecision)("overtime_hours").default(0), // in hours
    location: (0, pg_core_1.text)("location"), // GPS coordinates or location name
    status: (0, pg_core_1.text)("status").notNull().default("present"), // present, absent, late, early_leave
    isAutoCheckedOut: (0, pg_core_1.boolean)("is_auto_checked_out").default(false),
    notes: (0, pg_core_1.text)("notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertTimeAttendanceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.timeAttendance).omit({ id: true, createdAt: true });
// Employee of the Month
exports.employeeOfMonth = (0, pg_core_1.pgTable)("employee_of_month", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.text)("user_id").notNull().references(function () { return exports.users.id; }),
    month: (0, pg_core_1.integer)("month").notNull(), // 1-12
    year: (0, pg_core_1.integer)("year").notNull(),
    obligationPoints: (0, pg_core_1.integer)("obligation_points").notNull().default(0),
    qualityScore: (0, pg_core_1.doublePrecision)("quality_score").default(0),
    attendanceScore: (0, pg_core_1.doublePrecision)("attendance_score").default(0),
    productivityScore: (0, pg_core_1.doublePrecision)("productivity_score").default(0),
    totalScore: (0, pg_core_1.doublePrecision)("total_score").default(0),
    rank: (0, pg_core_1.integer)("rank"),
    reward: (0, pg_core_1.text)("reward"),
    rewardAmount: (0, pg_core_1.doublePrecision)("reward_amount"),
    notes: (0, pg_core_1.text)("notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, function (table) { return ({
    uniqueUserMonth: (0, pg_core_1.unique)().on(table.userId, table.month, table.year),
}); });
exports.insertEmployeeOfMonthSchema = (0, drizzle_zod_1.createInsertSchema)(exports.employeeOfMonth).omit({ id: true, createdAt: true });
// HR Violations and Complaints
exports.hrViolations = (0, pg_core_1.pgTable)("hr_violations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.text)("user_id").notNull().references(function () { return exports.users.id; }), // Employee involved
    reportedBy: (0, pg_core_1.text)("reported_by").notNull().references(function () { return exports.users.id; }), // Who reported it
    violationType: (0, pg_core_1.text)("violation_type").notNull(), // "attendance", "conduct", "safety", "performance", "policy"
    severity: (0, pg_core_1.text)("severity").notNull(), // "minor", "major", "critical"
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    actionTaken: (0, pg_core_1.text)("action_taken"),
    status: (0, pg_core_1.text)("status").notNull().default("open"), // "open", "investigating", "resolved", "dismissed"
    reportDate: (0, pg_core_1.timestamp)("report_date").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.insertHrViolationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.hrViolations).omit({ id: true, createdAt: true, updatedAt: true });
// HR Complaints
exports.hrComplaints = (0, pg_core_1.pgTable)("hr_complaints", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    complainantId: (0, pg_core_1.text)("complainant_id").notNull().references(function () { return exports.users.id; }), // Who filed the complaint
    againstUserId: (0, pg_core_1.text)("against_user_id").references(function () { return exports.users.id; }), // Who the complaint is against (can be null for general complaints)
    complaintType: (0, pg_core_1.text)("complaint_type").notNull(), // "harassment", "discrimination", "work_environment", "management", "safety", "other"
    priority: (0, pg_core_1.text)("priority").notNull().default("medium"), // "low", "medium", "high", "urgent"
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    desiredOutcome: (0, pg_core_1.text)("desired_outcome"),
    isAnonymous: (0, pg_core_1.boolean)("is_anonymous").default(false),
    status: (0, pg_core_1.text)("status").notNull().default("submitted"), // "submitted", "under_review", "investigating", "resolved", "closed"
    submittedDate: (0, pg_core_1.timestamp)("submitted_date").defaultNow(),
    assignedTo: (0, pg_core_1.text)("assigned_to").references(function () { return exports.users.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.insertHrComplaintSchema = (0, drizzle_zod_1.createInsertSchema)(exports.hrComplaints).omit({ id: true, createdAt: true, updatedAt: true });
// Production Bottleneck Detection System
exports.productionMetrics = (0, pg_core_1.pgTable)("production_metrics", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    sectionId: (0, pg_core_1.text)("section_id").notNull().references(function () { return exports.sections.id; }),
    machineId: (0, pg_core_1.text)("machine_id").references(function () { return exports.machines.id; }),
    jobOrderId: (0, pg_core_1.integer)("job_order_id").references(function () { return exports.jobOrders.id; }),
    stage: (0, pg_core_1.text)("stage").notNull(), // "extruding", "printing", "cutting", "mixing"
    targetRate: (0, pg_core_1.doublePrecision)("target_rate").notNull(), // Expected production rate per hour
    actualRate: (0, pg_core_1.doublePrecision)("actual_rate").notNull(), // Actual production rate
    efficiency: (0, pg_core_1.doublePrecision)("efficiency").notNull(), // Percentage efficiency
    downtime: (0, pg_core_1.integer)("downtime_minutes").default(0), // Downtime in minutes
    timestamp: (0, pg_core_1.timestamp)("timestamp").defaultNow().notNull(),
    shift: (0, pg_core_1.text)("shift").notNull().default("day"), // "day", "night", "morning"
    operator: (0, pg_core_1.text)("operator").references(function () { return exports.users.id; }),
    notes: (0, pg_core_1.text)("notes"),
});
exports.insertProductionMetricsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.productionMetrics).omit({ id: true, timestamp: true });
// Bottleneck Alerts
exports.bottleneckAlerts = (0, pg_core_1.pgTable)("bottleneck_alerts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    alertType: (0, pg_core_1.text)("alert_type").notNull(), // "efficiency_drop", "downtime_exceeded", "rate_below_target", "queue_buildup"
    severity: (0, pg_core_1.text)("severity").notNull().default("medium"), // "low", "medium", "high", "critical"
    sectionId: (0, pg_core_1.text)("section_id").notNull().references(function () { return exports.sections.id; }),
    machineId: (0, pg_core_1.text)("machine_id").references(function () { return exports.machines.id; }),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    affectedJobOrders: (0, pg_core_1.integer)("affected_job_orders").array(), // Array of job order IDs
    estimatedDelay: (0, pg_core_1.integer)("estimated_delay_hours"), // Estimated delay in hours
    suggestedActions: (0, pg_core_1.text)("suggested_actions").array(), // Array of suggested actions
    status: (0, pg_core_1.text)("status").notNull().default("active"), // "active", "acknowledged", "resolved", "ignored"
    detectedAt: (0, pg_core_1.timestamp)("detected_at").defaultNow().notNull(),
    acknowledgedAt: (0, pg_core_1.timestamp)("acknowledged_at"),
    acknowledgedBy: (0, pg_core_1.text)("acknowledged_by").references(function () { return exports.users.id; }),
    resolvedAt: (0, pg_core_1.timestamp)("resolved_at"),
    resolvedBy: (0, pg_core_1.text)("resolved_by").references(function () { return exports.users.id; }),
    resolutionNotes: (0, pg_core_1.text)("resolution_notes"),
});
exports.insertBottleneckAlertSchema = (0, drizzle_zod_1.createInsertSchema)(exports.bottleneckAlerts).omit({ id: true, detectedAt: true });
// Notification Settings
exports.notificationSettings = (0, pg_core_1.pgTable)("notification_settings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.text)("user_id").notNull().references(function () { return exports.users.id; }),
    alertType: (0, pg_core_1.text)("alert_type").notNull(), // "efficiency_drop", "downtime_exceeded", etc.
    enabled: (0, pg_core_1.boolean)("enabled").default(true),
    minSeverity: (0, pg_core_1.text)("min_severity").notNull().default("medium"), // Minimum severity to notify
    notificationMethods: (0, pg_core_1.text)("notification_methods").array().notNull(), // ["email", "sms", "push", "in_app"]
    workingHoursOnly: (0, pg_core_1.boolean)("working_hours_only").default(false),
    departments: (0, pg_core_1.text)("departments").array(), // If empty, all departments
    machines: (0, pg_core_1.text)("machines").array(), // If empty, all machines
});
exports.insertNotificationSettingsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.notificationSettings).omit({ id: true });
// Production Targets
exports.productionTargets = (0, pg_core_1.pgTable)("production_targets", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    sectionId: (0, pg_core_1.text)("section_id").notNull().references(function () { return exports.sections.id; }),
    machineId: (0, pg_core_1.text)("machine_id").references(function () { return exports.machines.id; }),
    stage: (0, pg_core_1.text)("stage").notNull(),
    targetRate: (0, pg_core_1.doublePrecision)("target_rate").notNull(), // Units per hour
    minEfficiency: (0, pg_core_1.doublePrecision)("min_efficiency").notNull().default(75), // Minimum acceptable efficiency %
    maxDowntime: (0, pg_core_1.integer)("max_downtime_minutes").notNull().default(30), // Maximum acceptable downtime per shift
    shift: (0, pg_core_1.text)("shift").notNull().default("day"),
    effectiveFrom: (0, pg_core_1.timestamp)("effective_from").defaultNow().notNull(),
    effectiveTo: (0, pg_core_1.timestamp)("effective_to"),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdBy: (0, pg_core_1.text)("created_by").notNull().references(function () { return exports.users.id; }),
});
// Maintenance Module Tables
// Maintenance Requests
exports.maintenanceRequests = (0, pg_core_1.pgTable)("maintenance_requests", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    requestNumber: (0, pg_core_1.text)("request_number"),
    machineId: (0, pg_core_1.text)("machine_id").notNull().references(function () { return exports.machines.id; }),
    damageType: (0, pg_core_1.text)("damage_type").notNull(),
    severity: (0, pg_core_1.text)("severity").notNull().default("Normal"), // High, Normal, Low
    description: (0, pg_core_1.text)("description").notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
    priority: (0, pg_core_1.integer)("priority").default(2), // 1=High, 2=Normal, 3=Low
    estimatedRepairTime: (0, pg_core_1.integer)("estimated_repair_time"), // in hours
    actualRepairTime: (0, pg_core_1.integer)("actual_repair_time"), // in hours
    requestedBy: (0, pg_core_1.text)("requested_by").notNull().references(function () { return exports.users.id; }),
    reportedBy: (0, pg_core_1.text)("reported_by").references(function () { return exports.users.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    assignedTo: (0, pg_core_1.text)("assigned_to").references(function () { return exports.users.id; }),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    notes: (0, pg_core_1.text)("notes"),
});
exports.insertMaintenanceRequestSchema = (0, drizzle_zod_1.createInsertSchema)(exports.maintenanceRequests).omit({ id: true, createdAt: true });
// Maintenance Actions
exports.maintenanceActions = (0, pg_core_1.pgTable)("maintenance_actions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    requestId: (0, pg_core_1.integer)("request_id").notNull().references(function () { return exports.maintenanceRequests.id; }, { onDelete: "cascade" }),
    machineId: (0, pg_core_1.text)("machine_id").notNull().references(function () { return exports.machines.id; }),
    actionDate: (0, pg_core_1.timestamp)("action_date").defaultNow().notNull(),
    actionType: (0, pg_core_1.text)("action_type").notNull(),
    partReplaced: (0, pg_core_1.text)("part_replaced"),
    partId: (0, pg_core_1.integer)("part_id"),
    description: (0, pg_core_1.text)("description").notNull(),
    performedBy: (0, pg_core_1.text)("performed_by").notNull().references(function () { return exports.users.id; }),
    hours: (0, pg_core_1.doublePrecision)("hours").default(0),
    cost: (0, pg_core_1.doublePrecision)("cost").default(0),
    status: (0, pg_core_1.text)("status").notNull().default("completed"), // pending, in_progress, completed
});
exports.insertMaintenanceActionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.maintenanceActions).omit({ id: true, actionDate: true });
// Maintenance Schedule (for preventive maintenance)
exports.maintenanceSchedule = (0, pg_core_1.pgTable)("maintenance_schedule", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    machineId: (0, pg_core_1.text)("machine_id").notNull().references(function () { return exports.machines.id; }),
    taskName: (0, pg_core_1.text)("task_name").notNull(),
    maintenanceType: (0, pg_core_1.text)("maintenance_type"),
    description: (0, pg_core_1.text)("description"),
    frequency: (0, pg_core_1.text)("frequency").notNull(), // daily, weekly, monthly, quarterly, yearly
    lastCompleted: (0, pg_core_1.timestamp)("last_completed"),
    nextDue: (0, pg_core_1.timestamp)("next_due").notNull(),
    assignedTo: (0, pg_core_1.text)("assigned_to").references(function () { return exports.users.id; }),
    priority: (0, pg_core_1.text)("priority").default("medium"), // low, medium, high, critical
    estimatedHours: (0, pg_core_1.doublePrecision)("estimated_hours").default(1),
    instructions: (0, pg_core_1.text)("instructions"),
    status: (0, pg_core_1.text)("status").default("active"), // active, inactive, completed
    createdBy: (0, pg_core_1.text)("created_by").notNull().references(function () { return exports.users.id; }),
});
exports.insertMaintenanceScheduleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.maintenanceSchedule).omit({ id: true });
exports.insertProductionTargetsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.productionTargets).omit({ id: true, effectiveFrom: true });
// SMS Provider Settings for fallback configuration
exports.smsProviderSettings = (0, pg_core_1.pgTable)('sms_provider_settings', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    primaryProvider: (0, pg_core_1.text)('primary_provider').notNull().default('taqnyat'),
    fallbackProvider: (0, pg_core_1.text)('fallback_provider').notNull().default('twilio'),
    retryAttempts: (0, pg_core_1.integer)('retry_attempts').notNull().default(3),
    retryDelay: (0, pg_core_1.integer)('retry_delay').notNull().default(5000), // milliseconds
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    lastUpdated: (0, pg_core_1.timestamp)('last_updated').notNull().defaultNow(),
    updatedBy: (0, pg_core_1.text)('updated_by')
});
// SMS Provider Health Status for monitoring
exports.smsProviderHealth = (0, pg_core_1.pgTable)('sms_provider_health', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    provider: (0, pg_core_1.text)('provider').notNull(), // 'taqnyat' or 'twilio'
    status: (0, pg_core_1.text)('status').notNull().default('healthy'), // 'healthy', 'degraded', 'down'
    lastSuccessfulSend: (0, pg_core_1.timestamp)('last_successful_send'),
    lastFailedSend: (0, pg_core_1.timestamp)('last_failed_send'),
    successCount: (0, pg_core_1.integer)('success_count').notNull().default(0),
    failureCount: (0, pg_core_1.integer)('failure_count').notNull().default(0),
    lastError: (0, pg_core_1.text)('last_error'),
    checkedAt: (0, pg_core_1.timestamp)('checked_at').notNull().defaultNow()
});
exports.insertSmsProviderSettingsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.smsProviderSettings).omit({ id: true, lastUpdated: true });
exports.insertSmsProviderHealthSchema = (0, drizzle_zod_1.createInsertSchema)(exports.smsProviderHealth).omit({ id: true, checkedAt: true });
