import { eq, and, gte, lte, desc, asc, or, sql, ne, isNull } from "drizzle-orm";
import {
  users,
  type User,
  type UpsertUser,
  permissions,
  type Permission,
  type InsertPermission,
  modules,
  type Module,
  type InsertModule,
  categories,
  type Category,
  type InsertCategory,
  items,
  type Item,
  type InsertItem,
  sections,
  type Section,
  type InsertSection,
  machines,
  type Machine,
  type InsertMachine,
  masterBatches,
  type MasterBatch,
  type InsertMasterBatch,
  customers,
  type Customer,
  type InsertCustomer,
  customerProducts,
  type CustomerProduct,
  type InsertCustomerProduct,
  orders,
  type Order,
  type InsertOrder,
  jobOrders,
  type JobOrder,
  type InsertJobOrder,
  rolls,
  type Roll,
  type InsertRoll,
  rawMaterials,
  type RawMaterial,
  type InsertRawMaterial,
  finalProducts,
  type FinalProduct,
  type InsertFinalProduct,
  qualityCheckTypes,
  type QualityCheckType,
  type InsertQualityCheckType,
  qualityChecks,
  type QualityCheck,
  type InsertQualityCheck,
  timeAttendance,
  type TimeAttendance,
  type InsertTimeAttendance,
  employeeOfMonth,
  type EmployeeOfMonth,
  type InsertEmployeeOfMonth,
  hrViolations,
  type HrViolation,
  type InsertHrViolation,
  hrComplaints,
  type HrComplaint,
  type InsertHrComplaint,

  correctiveActions,
  type CorrectiveAction,
  type InsertCorrectiveAction,
  smsMessages,
  type SmsMessage,
  type InsertSmsMessage,
  mixMaterials,
  type MixMaterial,
  type InsertMixMaterial,
  mixItems,
  type MixItem,
  type InsertMixItem,
  mixMachines,
  type MixMachine,
  type InsertMixMachine,
  materialInputs,
  type MaterialInput,
  type InsertMaterialInput,
  materialInputItems,
  type MaterialInputItem,
  type InsertMaterialInputItem,
  platePricingParameters,
  type PlatePricingParameter,
  type InsertPlatePricingParameter,
  plateCalculations,
  type PlateCalculation,
  type InsertPlateCalculation,

  maintenanceRequests,
  type MaintenanceRequest,
  type InsertMaintenanceRequest,
  maintenanceActions,
  type MaintenanceAction,
  type InsertMaintenanceAction,
  maintenanceSchedule,
  type MaintenanceSchedule,
  type InsertMaintenanceSchedule,
  smsTemplates,
  type SmsTemplate,
  type InsertSmsTemplate,
  smsNotificationRules,
  type SmsNotificationRule,
  type InsertSmsNotificationRule,
  trainings,
  type Training,
  type InsertTraining,
  trainingPoints,
  type TrainingPoint,
  type InsertTrainingPoint,
  trainingEvaluations,
  type TrainingEvaluation,
  type InsertTrainingEvaluation,
  trainingFieldEvaluations,
  type TrainingFieldEvaluation,
  type InsertTrainingFieldEvaluation,
  trainingCertificates,
  type TrainingCertificate,
  type InsertCertificate,



  geofences,
  type Geofence,
  type InsertGeofence,
  leaveRequests,
  type LeaveRequest,
  type InsertLeaveRequest,
  overtimeRequests,
  type OvertimeRequest,
  type InsertOvertimeRequest,
  payrollRecords,
  type PayrollRecord,
  type InsertPayrollRecord,
  performanceReviews,
  type PerformanceReview,
  type InsertPerformanceReview,
  abaFormulas,
  type AbaFormula,
  type InsertAbaFormula,
  abaFormulaMaterials,
  type AbaFormulaMaterial,
  type InsertAbaFormulaMaterial,
  joMixes,
  type JoMix,
  type InsertJoMix,
  joMixItems,
  type JoMixItem,
  type InsertJoMixItem,
  joMixMaterials,
  type JoMixMaterial,
  type InsertJoMixMaterial
} from "@shared/schema";
import { db, pool } from "./db";
import { IStorage } from "./storage";
import connectPg from "connect-pg-simple";
import session from "express-session";

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const pgStore = connectPg(session);
    // Use consistent database URL
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    this.sessionStore = new pgStore({
      conString: databaseUrl,
      createTableIfMissing: true,
      tableName: "sessions",
    });
  }

  // User operations with Replit Auth
  async getUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return true;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      console.log("Upserting user:", userData.username);
      
      // Create a clean copy to avoid mutating the input
      const cleanUserData = { ...userData };
      
      // Handle the special case for password updating
      const isUpdate = !!cleanUserData.id;
      const isPasswordUnchanged = cleanUserData.password === "UNCHANGED_PASSWORD";
      
      if (isUpdate && isPasswordUnchanged) {
        // Get the existing user to keep their current password
        const existingUser = await this.getUser(cleanUserData.id);
        if (!existingUser) {
          throw new Error(`User with id ${cleanUserData.id} not found`);
        }
        
        // Use the existing password instead of "UNCHANGED_PASSWORD"
        cleanUserData.password = existingUser.password;
      }
      
      const [user] = await db
        .insert(users)
        .values({
          ...cleanUserData,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...cleanUserData,
            updatedAt: new Date(),
          },
        })
        .returning();
        
      console.log("Upsert user success for:", cleanUserData.username);
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  // Permission management operations (section-based)
  async getPermissions(): Promise<Permission[]> {
    const allPermissions = await db.select().from(permissions);
    return allPermissions;
  }



  async getPermissionsBySection(sectionId: string): Promise<Permission[]> {
    const sectionPermissions = await db.select()
      .from(permissions)
      .where(eq(permissions.sectionId, sectionId));
    return sectionPermissions;
  }

  async getPermissionsByModule(moduleId: number): Promise<Permission[]> {
    const modulePermissions = await db.select()
      .from(permissions)
      .where(eq(permissions.moduleId, moduleId));
    return modulePermissions;
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const [permission] = await db.select()
      .from(permissions)
      .where(eq(permissions.id, id));
    return permission;
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    try {
      // First, try to find existing permission for this section and module
      const existing = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.sectionId, permission.sectionId),
            eq(permissions.moduleId, permission.moduleId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing permission
        const [updated] = await db
          .update(permissions)
          .set({
            canView: permission.canView,
            canCreate: permission.canCreate,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete,
            isActive: permission.isActive
          })
          .where(eq(permissions.id, existing[0].id))
          .returning();
        return updated;
      } else {
        // Create new permission
        const [created] = await db
          .insert(permissions)
          .values(permission)
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error in createPermission:', error);
      throw error;
    }
  }

  async updatePermission(id: number, permissionData: Partial<Permission>): Promise<Permission | undefined> {
    try {
      const [updated] = await db
        .update(permissions)
        .set(permissionData)
        .where(eq(permissions.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error in updatePermission:', error);
      throw error;
    }
  }

  async deletePermission(id: number): Promise<boolean> {
    try {
      await db
        .delete(permissions)
        .where(eq(permissions.id, id));
      return true;
    } catch (error) {
      console.error('Error in deletePermission:', error);
      throw error;
    }
  }

  // Modules management operations
  async getModules(): Promise<Module[]> {
    return await db.select().from(modules);
  }

  async getModulesByCategory(category: string): Promise<Module[]> {
    return await db.select()
      .from(modules)
      .where(eq(modules.category, category));
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select()
      .from(modules)
      .where(eq(modules.id, id));
    return module;
  }

  async createModule(module: InsertModule): Promise<Module> {
    try {
      const [created] = await db
        .insert(modules)
        .values(module)
        .returning();
      return created;
    } catch (error) {
      console.error('Error in createModule:', error);
      throw error;
    }
  }

  async updateModule(id: number, module: Partial<Module>): Promise<Module | undefined> {
    try {
      const [updated] = await db
        .update(modules)
        .set(module)
        .where(eq(modules.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error in updateModule:', error);
      throw error;
    }
  }

  async deleteModule(id: number): Promise<boolean> {
    try {
      await db
        .delete(modules)
        .where(eq(modules.id, id));
      return true;
    } catch (error) {
      console.error('Error in deleteModule:', error);
      throw error;
    }
  }

  // Categories methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async getCategoryByCode(code: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.code, code));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db
      .insert(categories)
      .values(category)
      .returning();
    return created;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    await db
      .delete(categories)
      .where(eq(categories.id, id));
    return true;
  }

  // Items methods
  async getItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .where(eq(items.categoryId, categoryId));
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db
      .select()
      .from(items)
      .where(eq(items.id, id));
    return item;
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [created] = await db
      .insert(items)
      .values(item)
      .returning();
    return created;
  }

  async updateItem(id: string, item: Partial<Item>): Promise<Item | undefined> {
    const [updated] = await db
      .update(items)
      .set(item)
      .where(eq(items.id, id))
      .returning();
    return updated;
  }

  async deleteItem(id: string): Promise<boolean> {
    await db
      .delete(items)
      .where(eq(items.id, id));
    return true;
  }

  // Sections methods
  async getSections(): Promise<Section[]> {
    return await db.select().from(sections);
  }

  async getSection(id: string): Promise<Section | undefined> {
    const [section] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, id));
    return section;
  }

  async createSection(section: InsertSection): Promise<Section> {
    const [created] = await db
      .insert(sections)
      .values(section)
      .returning();
    return created;
  }

  async updateSection(id: string, section: Partial<Section>): Promise<Section | undefined> {
    const [updated] = await db
      .update(sections)
      .set(section)
      .where(eq(sections.id, id))
      .returning();
    return updated;
  }

  async deleteSection(id: string): Promise<boolean> {
    await db
      .delete(sections)
      .where(eq(sections.id, id));
    return true;
  }

  // Machines methods
  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines);
  }

  async getMachinesBySection(sectionId: string): Promise<Machine[]> {
    return await db
      .select()
      .from(machines)
      .where(eq(machines.sectionId, sectionId));
  }

  async getMachine(id: string): Promise<Machine | undefined> {
    const [machine] = await db
      .select()
      .from(machines)
      .where(eq(machines.id, id));
    return machine;
  }

  async createMachine(machine: InsertMachine): Promise<Machine> {
    const [created] = await db
      .insert(machines)
      .values(machine)
      .returning();
    return created;
  }

  async updateMachine(id: string, machine: Partial<Machine>): Promise<Machine | undefined> {
    const [updated] = await db
      .update(machines)
      .set(machine)
      .where(eq(machines.id, id))
      .returning();
    return updated;
  }

  async deleteMachine(id: string): Promise<boolean> {
    await db
      .delete(machines)
      .where(eq(machines.id, id));
    return true;
  }

  // Master Batches methods
  async getMasterBatches(): Promise<MasterBatch[]> {
    return await db.select().from(masterBatches);
  }

  async getMasterBatch(id: string): Promise<MasterBatch | undefined> {
    const [batch] = await db
      .select()
      .from(masterBatches)
      .where(eq(masterBatches.id, id));
    return batch;
  }

  async createMasterBatch(masterBatch: InsertMasterBatch): Promise<MasterBatch> {
    const [created] = await db
      .insert(masterBatches)
      .values(masterBatch)
      .returning();
    return created;
  }

  async updateMasterBatch(id: string, masterBatch: Partial<MasterBatch>): Promise<MasterBatch | undefined> {
    const [updated] = await db
      .update(masterBatches)
      .set(masterBatch)
      .where(eq(masterBatches.id, id))
      .returning();
    return updated;
  }

  async deleteMasterBatch(id: string): Promise<boolean> {
    await db
      .delete(masterBatches)
      .where(eq(masterBatches.id, id));
    return true;
  }

  // Customers methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByCode(code: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.code, code));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    await db
      .delete(customers)
      .where(eq(customers.id, id));
    return true;
  }

  // Customer Products methods
  async getCustomerProducts(): Promise<CustomerProduct[]> {
    return await db.select().from(customerProducts);
  }

  async getCustomerProductsByCustomer(customerId: string): Promise<CustomerProduct[]> {
    return await db
      .select()
      .from(customerProducts)
      .where(eq(customerProducts.customerId, customerId));
  }

  async getCustomerProduct(id: number): Promise<CustomerProduct | undefined> {
    const [product] = await db
      .select()
      .from(customerProducts)
      .where(eq(customerProducts.id, id));
    return product;
  }

  async createCustomerProduct(customerProduct: InsertCustomerProduct): Promise<CustomerProduct> {
    const [created] = await db
      .insert(customerProducts)
      .values(customerProduct)
      .returning();
    return created;
  }

  async updateCustomerProduct(id: number, customerProduct: Partial<CustomerProduct>): Promise<CustomerProduct | undefined> {
    const [updated] = await db
      .update(customerProducts)
      .set(customerProduct)
      .where(eq(customerProducts.id, id))
      .returning();
    return updated;
  }

  async deleteCustomerProduct(id: number): Promise<boolean> {
    await db
      .delete(customerProducts)
      .where(eq(customerProducts.id, id));
    return true;
  }

  // Orders methods
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db
      .insert(orders)
      .values(order)
      .returning();
    return created;
  }

  async updateOrder(id: number, order: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      // Using a transaction to ensure all deletes succeed or fail together
      await db.transaction(async (tx) => {
        // 1. Get all job orders related to this order
        const relatedJobOrders = await tx
          .select()
          .from(jobOrders)
          .where(eq(jobOrders.orderId, id));
        
        // 2. For each job order, delete related entities
        for (const jobOrder of relatedJobOrders) {
          // 2.1 Get and delete rolls related to this job order
          const relatedRolls = await tx
            .select()
            .from(rolls)
            .where(eq(rolls.jobOrderId, jobOrder.id));
          
          for (const roll of relatedRolls) {
            // 2.1.1 Delete quality checks related to this roll
            const rollQualityChecks = await tx
              .select()
              .from(qualityChecks)
              .where(eq(qualityChecks.rollId, roll.id));
            
            for (const check of rollQualityChecks) {
              // 2.1.1.1 Delete corrective actions related to this quality check
              await tx
                .delete(correctiveActions)
                .where(eq(correctiveActions.qualityCheckId, check.id));
            }
            
            // 2.1.1.2 Delete the quality checks
            await tx
              .delete(qualityChecks)
              .where(eq(qualityChecks.rollId, roll.id));
          }
          
          // 2.1.2 Delete the rolls
          await tx
            .delete(rolls)
            .where(eq(rolls.jobOrderId, jobOrder.id));
          
          // 2.2 Delete quality checks related directly to the job order (not through rolls)
          await tx
            .delete(qualityChecks)
            .where(eq(qualityChecks.jobOrderId, jobOrder.id));
          
          // 2.3 Delete SMS messages related to the job order
          await tx
            .delete(smsMessages)
            .where(eq(smsMessages.jobOrderId, jobOrder.id));
            
          // 2.4 Delete final products related to the job order
          await tx
            .delete(finalProducts)
            .where(eq(finalProducts.jobOrderId, jobOrder.id));
        }
        
        // 3. Delete all job orders for this order
        await tx
          .delete(jobOrders)
          .where(eq(jobOrders.orderId, id));
        
        // 4. Delete SMS messages related directly to the order
        await tx
          .delete(smsMessages)
          .where(eq(smsMessages.orderId, id));
        
        // 5. Finally delete the order itself
        await tx
          .delete(orders)
          .where(eq(orders.id, id));
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }

  // Job Orders methods
  async getJobOrders(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          jo.id,
          jo.order_id as "orderId",
          jo.customer_product_id as "customerProductId",
          jo.quantity,
          jo.finished_qty as "finishedQty",
          jo.received_qty as "receivedQty",
          jo.status,
          jo.customer_id as "customerId",
          jo.receive_date as "receiveDate",
          jo.received_by as "receivedBy",
          COALESCE(c1.name, c2.name) as "customerName",
          mb.name as "masterBatch",
          CONCAT(cp.width, 'x', cp.length_cm) as size,
          i.name as "itemName"
        FROM job_orders jo
        LEFT JOIN customers c1 ON jo.customer_id = c1.id
        LEFT JOIN customer_products cp ON jo.customer_product_id = cp.id
        LEFT JOIN customers c2 ON cp.customer_id = c2.id
        LEFT JOIN master_batches mb ON cp.master_batch_id = mb.id
        LEFT JOIN items i ON cp.item_id = i.id
        ORDER BY jo.id
      `);
      
      return result.rows as any[];
    } catch (error) {
      console.error('Error fetching job orders:', error);
      // Fallback to basic query without joins
      return await db.select().from(jobOrders).orderBy(jobOrders.id);
    }
  }

  async getJobOrdersByOrder(orderId: number): Promise<JobOrder[]> {
    return await db
      .select()
      .from(jobOrders)
      .where(eq(jobOrders.orderId, orderId));
  }

  async getJobOrder(id: number): Promise<JobOrder | undefined> {
    const [jobOrder] = await db
      .select()
      .from(jobOrders)
      .where(eq(jobOrders.id, id));
    return jobOrder;
  }

  async createJobOrder(jobOrder: InsertJobOrder): Promise<JobOrder> {
    const [created] = await db
      .insert(jobOrders)
      .values(jobOrder)
      .returning();
    return created;
  }

  async updateJobOrder(id: number, jobOrder: Partial<JobOrder>): Promise<JobOrder | undefined> {
    const [updated] = await db
      .update(jobOrders)
      .set(jobOrder)
      .where(eq(jobOrders.id, id))
      .returning();
    return updated;
  }

  async deleteJobOrder(id: number): Promise<boolean> {
    await db
      .delete(jobOrders)
      .where(eq(jobOrders.id, id));
    return true;
  }

  // Rolls methods
  async getRolls(): Promise<Roll[]> {
    return await db.select().from(rolls);
  }

  async getRollsByJobOrder(jobOrderId: number): Promise<Roll[]> {
    return await db
      .select()
      .from(rolls)
      .where(eq(rolls.jobOrderId, jobOrderId));
  }

  async getRollsByStage(stage: string): Promise<Roll[]> {
    return await db
      .select()
      .from(rolls)
      .where(eq(rolls.currentStage, stage));
  }

  async getRoll(id: string): Promise<Roll | undefined> {
    const [roll] = await db
      .select()
      .from(rolls)
      .where(eq(rolls.id, id));
    return roll;
  }

  async createRoll(roll: InsertRoll): Promise<Roll> {
    const [created] = await db
      .insert(rolls)
      .values(roll)
      .returning();
    return created;
  }

  async updateRoll(id: string, roll: Partial<Roll>): Promise<Roll | undefined> {
    const [updated] = await db
      .update(rolls)
      .set(roll)
      .where(eq(rolls.id, id))
      .returning();
    return updated;
  }

  async deleteRoll(id: string): Promise<boolean> {
    await db
      .delete(rolls)
      .where(eq(rolls.id, id));
    return true;
  }

  // Raw Materials methods
  async getRawMaterials(): Promise<RawMaterial[]> {
    return await db.select().from(rawMaterials);
  }

  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    const [material] = await db
      .select()
      .from(rawMaterials)
      .where(eq(rawMaterials.id, id));
    return material;
  }

  async createRawMaterial(rawMaterial: InsertRawMaterial): Promise<RawMaterial> {
    const [created] = await db
      .insert(rawMaterials)
      .values(rawMaterial)
      .returning();
    return created;
  }

  async updateRawMaterial(id: number, rawMaterial: Partial<RawMaterial>): Promise<RawMaterial | undefined> {
    const [updated] = await db
      .update(rawMaterials)
      .set(rawMaterial)
      .where(eq(rawMaterials.id, id))
      .returning();
    return updated;
  }

  async deleteRawMaterial(id: number): Promise<boolean> {
    await db
      .delete(rawMaterials)
      .where(eq(rawMaterials.id, id));
    return true;
  }

  // Final Products methods
  async getFinalProducts(): Promise<FinalProduct[]> {
    return await db.select().from(finalProducts);
  }
  
  async getFinalProductsByJobOrder(jobOrderId: number): Promise<FinalProduct[]> {
    return await db
      .select()
      .from(finalProducts)
      .where(eq(finalProducts.jobOrderId, jobOrderId));
  }

  async getFinalProduct(id: number): Promise<FinalProduct | undefined> {
    const [product] = await db
      .select()
      .from(finalProducts)
      .where(eq(finalProducts.id, id));
    return product;
  }

  async createFinalProduct(finalProduct: InsertFinalProduct): Promise<FinalProduct> {
    const [created] = await db
      .insert(finalProducts)
      .values(finalProduct)
      .returning();
    return created;
  }

  async updateFinalProduct(id: number, finalProduct: Partial<FinalProduct>): Promise<FinalProduct | undefined> {
    const [updated] = await db
      .update(finalProducts)
      .set(finalProduct)
      .where(eq(finalProducts.id, id))
      .returning();
    return updated;
  }

  async deleteFinalProduct(id: number): Promise<boolean> {
    await db
      .delete(finalProducts)
      .where(eq(finalProducts.id, id));
    return true;
  }

  // Quality Check Types methods
  async getQualityCheckTypes(): Promise<QualityCheckType[]> {
    return await db.select().from(qualityCheckTypes);
  }

  async getQualityCheckTypesByStage(stage: string): Promise<QualityCheckType[]> {
    return await db
      .select()
      .from(qualityCheckTypes)
      .where(eq(qualityCheckTypes.targetStage, stage));
  }

  async getQualityCheckType(id: string): Promise<QualityCheckType | undefined> {
    const [checkType] = await db
      .select()
      .from(qualityCheckTypes)
      .where(eq(qualityCheckTypes.id, id));
    return checkType;
  }

  async createQualityCheckType(qualityCheckType: InsertQualityCheckType): Promise<QualityCheckType> {
    const [created] = await db
      .insert(qualityCheckTypes)
      .values(qualityCheckType)
      .returning();
    return created;
  }

  async updateQualityCheckType(id: string, qualityCheckType: Partial<QualityCheckType>): Promise<QualityCheckType | undefined> {
    const [updated] = await db
      .update(qualityCheckTypes)
      .set(qualityCheckType)
      .where(eq(qualityCheckTypes.id, id))
      .returning();
    return updated;
  }

  async deleteQualityCheckType(id: string): Promise<boolean> {
    await db
      .delete(qualityCheckTypes)
      .where(eq(qualityCheckTypes.id, id));
    return true;
  }

  // Quality Checks methods
  async getQualityChecks(): Promise<QualityCheck[]> {
    try {
      // Import the pool and adapter
      const { pool } = await import('./db');
      const { adaptToFrontend } = await import('./quality-check-adapter');
      
      // Use direct SQL to get all quality checks
      const query = `
        SELECT * FROM quality_checks 
        ORDER BY checked_at DESC
      `;
      
      const result = await pool.query(query);
      
      if (!result || !result.rows) {
        return [];
      }
      
      // Convert all database records to frontend format
      return result.rows.map(row => adaptToFrontend(row));
    } catch (error) {
      console.error("Error fetching quality checks:", error);
      return [];
    }
  }

  async getQualityChecksByRoll(rollId: string): Promise<QualityCheck[]> {
    try {
      // Import the pool and adapter
      const { pool } = await import('./db');
      const { adaptToFrontend } = await import('./quality-check-adapter');
      
      // Use direct SQL to get quality checks for a specific roll
      const query = `
        SELECT * FROM quality_checks 
        WHERE roll_id = $1
        ORDER BY checked_at DESC
      `;
      
      const result = await pool.query(query, [rollId]);
      
      if (!result || !result.rows) {
        return [];
      }
      
      // Convert all database records to frontend format
      return result.rows.map(row => adaptToFrontend(row));
    } catch (error) {
      console.error(`Error fetching quality checks for roll ${rollId}:`, error);
      return [];
    }
  }

  async getQualityChecksByJobOrder(jobOrderId: number): Promise<QualityCheck[]> {
    try {
      // Import the pool and adapter
      const { pool } = await import('./db');
      const { adaptToFrontend } = await import('./quality-check-adapter');
      
      // Use direct SQL to get quality checks for a specific job order
      const query = `
        SELECT * FROM quality_checks 
        WHERE job_order_id = $1
        ORDER BY checked_at DESC
      `;
      
      const result = await pool.query(query, [jobOrderId]);
      
      if (!result || !result.rows) {
        return [];
      }
      
      // Convert all database records to frontend format
      return result.rows.map(row => adaptToFrontend(row));
    } catch (error) {
      console.error(`Error fetching quality checks for job order ${jobOrderId}:`, error);
      return [];
    }
  }

  async getQualityCheck(id: number): Promise<QualityCheck | undefined> {
    try {
      const { pool } = await import('./db');
      const { adaptToFrontend } = await import('./quality-check-adapter');

      // Use direct SQL query to match database columns
      const query = `
        SELECT * FROM quality_checks WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (!result || !result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      // Map the database record to frontend format
      return adaptToFrontend(result.rows[0]);
    } catch (error) {
      console.error("Error fetching quality check:", error);
      throw error;
    }
  }

  async createQualityCheck(qualityCheckData: any): Promise<QualityCheck> {
    try {
      console.log("Creating quality check with data in storage function:", qualityCheckData);
      
      // Import the pool from db.ts and the quality check adapter
      const { pool } = await import('./db');
      const { adaptToDatabase, adaptToFrontend } = await import('./quality-check-adapter');
      
      // Transform frontend data to database format if needed
      let dbData;
      if (qualityCheckData.checkTypeId || qualityCheckData.performedBy) {
        // This is frontend format, transform it
        dbData = adaptToDatabase(qualityCheckData);
      } else {
        // This is already in database format or needs direct mapping
        dbData = {
          check_type_id: qualityCheckData.checkTypeId || qualityCheckData.check_type_id || qualityCheckData.checkType,
          checked_by: qualityCheckData.performedBy || qualityCheckData.checked_by || qualityCheckData.checkedBy,
          job_order_id: qualityCheckData.jobOrderId || qualityCheckData.job_order_id,
          roll_id: qualityCheckData.rollId || qualityCheckData.roll_id,
          status: qualityCheckData.status || 'pending',
          notes: qualityCheckData.notes || null
        };
      }
      
      console.log("Mapped to database format:", dbData);
      
      // Use direct SQL with the pool to execute the query
      const query = `
        INSERT INTO quality_checks 
        (check_type_id, checked_by, job_order_id, roll_id, status, notes, checked_at, created_at)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      
      const values = [
        dbData.check_type_id,
        dbData.checked_by,
        dbData.job_order_id,
        dbData.roll_id,
        dbData.status,
        dbData.notes,
        new Date(),
        new Date()
      ];
      
      console.log("Executing SQL with values:", values);
      
      const result = await pool.query(query, values);
      
      if (!result || !result.rows || result.rows.length === 0) {
        throw new Error("No result returned from quality check creation");
      }
      
      console.log("Successfully created quality check:", result.rows[0]);
      
      // Map the database record back to the expected frontend format using the adapter
      return adaptToFrontend(result.rows[0]);
    } catch (error) {
      console.error("Database error creating quality check:", error);
      throw error;
    }
  }

  async updateQualityCheck(id: number, qualityCheckData: Partial<QualityCheck>): Promise<QualityCheck | undefined> {
    try {
      // Import the pool and adapter functions
      const { pool } = await import('./db');
      const { adaptToDatabase, adaptToFrontend } = await import('./quality-check-adapter');
      
      // Convert frontend data to database format
      const dbQualityCheck = adaptToDatabase(qualityCheckData);
      
      // Build the SET part of the query dynamically based on provided fields
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      // Only include fields that are provided in the update
      if (dbQualityCheck.check_type_id !== undefined) {
        updateFields.push(`check_type_id = $${paramIndex++}`);
        values.push(dbQualityCheck.check_type_id);
      }
      
      if (dbQualityCheck.checked_by !== undefined) {
        updateFields.push(`checked_by = $${paramIndex++}`);
        values.push(dbQualityCheck.checked_by);
      }
      
      if (dbQualityCheck.job_order_id !== undefined) {
        updateFields.push(`job_order_id = $${paramIndex++}`);
        values.push(dbQualityCheck.job_order_id);
      }
      
      if (dbQualityCheck.roll_id !== undefined) {
        updateFields.push(`roll_id = $${paramIndex++}`);
        values.push(dbQualityCheck.roll_id);
      }
      
      if (dbQualityCheck.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(dbQualityCheck.status);
      }
      
      if (dbQualityCheck.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(dbQualityCheck.notes);
      }
      
      if (dbQualityCheck.checklist_results !== undefined) {
        updateFields.push(`checklist_results = $${paramIndex++}`);
        values.push(dbQualityCheck.checklist_results);
      }
      
      if (dbQualityCheck.parameter_values !== undefined) {
        updateFields.push(`parameter_values = $${paramIndex++}`);
        values.push(dbQualityCheck.parameter_values);
      }
      
      if (dbQualityCheck.issue_severity !== undefined) {
        updateFields.push(`issue_severity = $${paramIndex++}`);
        values.push(dbQualityCheck.issue_severity);
      }
      
      if (dbQualityCheck.image_urls !== undefined) {
        updateFields.push(`image_urls = $${paramIndex++}`);
        values.push(dbQualityCheck.image_urls);
      }
      
      // If no fields to update, return undefined
      if (updateFields.length === 0) {
        return undefined;
      }
      
      // Add the ID as the last parameter
      values.push(id);
      
      const query = `
        UPDATE quality_checks 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (!result || !result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      // Map the updated database record back to frontend format
      return adaptToFrontend(result.rows[0]);
    } catch (error) {
      console.error(`Error updating quality check ${id}:`, error);
      throw error;
    }
  }

  async deleteQualityCheck(id: number): Promise<boolean> {
    await db
      .delete(qualityChecks)
      .where(eq(qualityChecks.id, id));
    return true;
  }

  // Corrective Actions methods
  async getCorrectiveActions(): Promise<CorrectiveAction[]> {
    return await db.select().from(correctiveActions);
  }

  async getCorrectiveActionsByQualityCheck(qualityCheckId: number): Promise<CorrectiveAction[]> {
    return await db
      .select()
      .from(correctiveActions)
      .where(eq(correctiveActions.qualityCheckId, qualityCheckId));
  }

  async getCorrectiveAction(id: number): Promise<CorrectiveAction | undefined> {
    const [action] = await db
      .select()
      .from(correctiveActions)
      .where(eq(correctiveActions.id, id));
    return action;
  }

  async createCorrectiveAction(correctiveAction: InsertCorrectiveAction): Promise<CorrectiveAction> {
    const [created] = await db
      .insert(correctiveActions)
      .values(correctiveAction)
      .returning();
    return created;
  }

  async updateCorrectiveAction(id: number, correctiveAction: Partial<CorrectiveAction>): Promise<CorrectiveAction | undefined> {
    const [updated] = await db
      .update(correctiveActions)
      .set(correctiveAction)
      .where(eq(correctiveActions.id, id))
      .returning();
    return updated;
  }

  async deleteCorrectiveAction(id: number): Promise<boolean> {
    await db
      .delete(correctiveActions)
      .where(eq(correctiveActions.id, id));
    return true;
  }



  // SMS Messages methods
  async getSmsMessages(): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages);
  }

  async getSmsMessagesByOrder(orderId: number): Promise<SmsMessage[]> {
    return await db
      .select()
      .from(smsMessages)
      .where(eq(smsMessages.orderId, orderId));
  }

  async getSmsMessagesByJobOrder(jobOrderId: number): Promise<SmsMessage[]> {
    return await db
      .select()
      .from(smsMessages)
      .where(eq(smsMessages.jobOrderId, jobOrderId));
  }

  async getSmsMessagesByCustomer(customerId: string): Promise<SmsMessage[]> {
    return await db
      .select()
      .from(smsMessages)
      .where(eq(smsMessages.customerId, customerId));
  }

  async getSmsMessage(id: number): Promise<SmsMessage | undefined> {
    const [message] = await db
      .select()
      .from(smsMessages)
      .where(eq(smsMessages.id, id));
    return message;
  }

  async createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage> {
    const [created] = await db
      .insert(smsMessages)
      .values(message)
      .returning();
    return created;
  }

  async updateSmsMessage(id: number, message: Partial<SmsMessage>): Promise<SmsMessage | undefined> {
    const [updated] = await db
      .update(smsMessages)
      .set(message)
      .where(eq(smsMessages.id, id))
      .returning();
    return updated;
  }

  async deleteSmsMessage(id: number): Promise<boolean> {
    await db
      .delete(smsMessages)
      .where(eq(smsMessages.id, id));
    return true;
  }

  // Mix Materials methods
  async getMixMaterials(): Promise<MixMaterial[]> {
    return await db.select().from(mixMaterials);
  }

  async getMixMaterial(id: number): Promise<MixMaterial | undefined> {
    const [mix] = await db
      .select()
      .from(mixMaterials)
      .where(eq(mixMaterials.id, id));
    return mix;
  }

  async createMixMaterial(mix: InsertMixMaterial): Promise<MixMaterial> {
    const [created] = await db
      .insert(mixMaterials)
      .values(mix)
      .returning();
    return created;
  }

  async updateMixMaterial(id: number, mix: Partial<MixMaterial>): Promise<MixMaterial | undefined> {
    const [updated] = await db
      .update(mixMaterials)
      .set(mix)
      .where(eq(mixMaterials.id, id))
      .returning();
    return updated;
  }

  async deleteMixMaterial(id: number): Promise<boolean> {
    try {
      // Using a transaction to ensure all deletes succeed or fail together
      await db.transaction(async (tx) => {
        // 1. Delete all mix items associated with this mix material
        await tx
          .delete(mixItems)
          .where(eq(mixItems.mixId, id));
        
        // 2. Delete all mix machine associations
        await tx
          .delete(mixMachines)
          .where(eq(mixMachines.mixId, id));
        
        // 3. Finally delete the mix material itself
        await tx
          .delete(mixMaterials)
          .where(eq(mixMaterials.id, id));
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting mix material:", error);
      throw error;
    }
  }

  // Mix Machines methods
  async getMixMachines(): Promise<MixMachine[]> {
    return await db.select().from(mixMachines);
  }

  async getMixMachinesByMixId(mixId: number): Promise<MixMachine[]> {
    return await db
      .select()
      .from(mixMachines)
      .where(eq(mixMachines.mixId, mixId));
  }

  async createMixMachine(mixMachine: InsertMixMachine): Promise<MixMachine> {
    const [created] = await db
      .insert(mixMachines)
      .values(mixMachine)
      .returning();
    return created;
  }

  async deleteMixMachinesByMixId(mixId: number): Promise<boolean> {
    await db
      .delete(mixMachines)
      .where(eq(mixMachines.mixId, mixId));
    return true;
  }

  // Mix Items methods
  async getMixItems(): Promise<MixItem[]> {
    return await db.select().from(mixItems);
  }

  async getMixItemsByMix(mixId: number): Promise<MixItem[]> {
    return await db
      .select()
      .from(mixItems)
      .where(eq(mixItems.mixId, mixId));
  }

  async getMixItem(id: number): Promise<MixItem | undefined> {
    const [item] = await db
      .select()
      .from(mixItems)
      .where(eq(mixItems.id, id));
    return item;
  }

  async createMixItem(mixItem: InsertMixItem): Promise<MixItem> {
    const [created] = await db
      .insert(mixItems)
      .values(mixItem)
      .returning();
    return created;
  }

  async updateMixItem(id: number, mixItem: Partial<MixItem>): Promise<MixItem | undefined> {
    const [updated] = await db
      .update(mixItems)
      .set(mixItem)
      .where(eq(mixItems.id, id))
      .returning();
    return updated;
  }

  async deleteMixItem(id: number): Promise<boolean> {
    await db
      .delete(mixItems)
      .where(eq(mixItems.id, id));
    return true;
  }

  // SMS Template methods
  async getSmsTemplates(): Promise<SmsTemplate[]> {
    return await db.select().from(smsTemplates);
  }

  async getSmsTemplate(id: string): Promise<SmsTemplate | undefined> {
    const [template] = await db
      .select()
      .from(smsTemplates)
      .where(eq(smsTemplates.id, id));
    return template;
  }

  async createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate> {
    const [created] = await db
      .insert(smsTemplates)
      .values(template)
      .returning();
    return created;
  }

  async updateSmsTemplate(id: string, template: Partial<SmsTemplate>): Promise<SmsTemplate | undefined> {
    const [updated] = await db
      .update(smsTemplates)
      .set(template)
      .where(eq(smsTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteSmsTemplate(id: string): Promise<boolean> {
    await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
    return true;
  }

  // SMS Notification Rules methods
  async getSmsNotificationRules(): Promise<SmsNotificationRule[]> {
    return await db.select().from(smsNotificationRules);
  }

  async getSmsNotificationRule(id: number): Promise<SmsNotificationRule | undefined> {
    const [rule] = await db
      .select()
      .from(smsNotificationRules)
      .where(eq(smsNotificationRules.id, id));
    return rule;
  }

  async createSmsNotificationRule(rule: InsertSmsNotificationRule): Promise<SmsNotificationRule> {
    const [created] = await db
      .insert(smsNotificationRules)
      .values(rule)
      .returning();
    return created;
  }

  async updateSmsNotificationRule(id: number, rule: Partial<SmsNotificationRule>): Promise<SmsNotificationRule | undefined> {
    const [updated] = await db
      .update(smsNotificationRules)
      .set(rule)
      .where(eq(smsNotificationRules.id, id))
      .returning();
    return updated;
  }

  async deleteSmsNotificationRule(id: number): Promise<boolean> {
    await db.delete(smsNotificationRules).where(eq(smsNotificationRules.id, id));
    return true;
  }

  // Material Inputs methods
  async getMaterialInputs(): Promise<MaterialInput[]> {
    return await db.select().from(materialInputs);
  }

  async getMaterialInput(id: number): Promise<MaterialInput | undefined> {
    const [input] = await db
      .select()
      .from(materialInputs)
      .where(eq(materialInputs.id, id));
    return input;
  }

  async createMaterialInput(materialInput: InsertMaterialInput): Promise<MaterialInput> {
    const [created] = await db
      .insert(materialInputs)
      .values(materialInput)
      .returning();
    return created;
  }

  async updateMaterialInput(id: number, materialInput: Partial<MaterialInput>): Promise<MaterialInput | undefined> {
    const [updated] = await db
      .update(materialInputs)
      .set(materialInput)
      .where(eq(materialInputs.id, id))
      .returning();
    return updated;
  }

  async deleteMaterialInput(id: number): Promise<boolean> {
    await db
      .delete(materialInputs)
      .where(eq(materialInputs.id, id));
    return true;
  }

  // Material Input Items methods
  async getMaterialInputItems(): Promise<MaterialInputItem[]> {
    return await db.select().from(materialInputItems);
  }

  async getMaterialInputItemsByInput(inputId: number): Promise<MaterialInputItem[]> {
    return await db
      .select()
      .from(materialInputItems)
      .where(eq(materialInputItems.inputId, inputId));
  }

  async getMaterialInputItem(id: number): Promise<MaterialInputItem | undefined> {
    const [item] = await db
      .select()
      .from(materialInputItems)
      .where(eq(materialInputItems.id, id));
    return item;
  }

  async createMaterialInputItem(item: InsertMaterialInputItem): Promise<MaterialInputItem> {
    const [created] = await db
      .insert(materialInputItems)
      .values(item)
      .returning();
    return created;
  }

  async deleteMaterialInputItem(id: number): Promise<boolean> {
    await db
      .delete(materialInputItems)
      .where(eq(materialInputItems.id, id));
    return true;
  }

  // Cliché (Plate) Pricing Parameters methods
  async getPlatePricingParameters(): Promise<PlatePricingParameter[]> {
    return await db.select().from(platePricingParameters);
  }

  async getPlatePricingParameterByType(type: string): Promise<PlatePricingParameter | undefined> {
    const [param] = await db
      .select()
      .from(platePricingParameters)
      .where(eq(platePricingParameters.type, type));
    return param;
  }

  async getPlatePricingParameter(id: number): Promise<PlatePricingParameter | undefined> {
    const [param] = await db
      .select()
      .from(platePricingParameters)
      .where(eq(platePricingParameters.id, id));
    return param;
  }

  async createPlatePricingParameter(param: InsertPlatePricingParameter): Promise<PlatePricingParameter> {
    const [created] = await db
      .insert(platePricingParameters)
      .values(param)
      .returning();
    return created;
  }

  async updatePlatePricingParameter(id: number, update: Partial<PlatePricingParameter>): Promise<PlatePricingParameter | undefined> {
    const [updated] = await db
      .update(platePricingParameters)
      .set(update)
      .where(eq(platePricingParameters.id, id))
      .returning();
    return updated;
  }

  async deletePlatePricingParameter(id: number): Promise<boolean> {
    await db
      .delete(platePricingParameters)
      .where(eq(platePricingParameters.id, id));
    return true;
  }

  // Plate Calculations methods
  async getPlateCalculations(): Promise<PlateCalculation[]> {
    return await db.select().from(plateCalculations);
  }

  async getPlateCalculationsByCustomer(customerId: string): Promise<PlateCalculation[]> {
    return await db
      .select()
      .from(plateCalculations)
      .where(eq(plateCalculations.customerId, customerId));
  }

  async getPlateCalculation(id: number): Promise<PlateCalculation | undefined> {
    const [calculation] = await db
      .select()
      .from(plateCalculations)
      .where(eq(plateCalculations.id, id));
    return calculation;
  }

  async createPlateCalculation(calculation: InsertPlateCalculation): Promise<PlateCalculation> {
    // Calculate the area before insertion
    const area = calculation.width * calculation.height;
    
    const [created] = await db
      .insert(plateCalculations)
      .values({
        ...calculation,
        area,
        calculatedPrice: 0 // Will be calculated by the calling function
      })
      .returning();
    return created;
  }

  async updatePlateCalculation(id: number, update: Partial<PlateCalculation>): Promise<PlateCalculation | undefined> {
    const [updated] = await db
      .update(plateCalculations)
      .set(update)
      .where(eq(plateCalculations.id, id))
      .returning();
    return updated;
  }

  async deletePlateCalculation(id: number): Promise<boolean> {
    await db
      .delete(plateCalculations)
      .where(eq(plateCalculations.id, id));
    return true;
  }



  // HR Module Methods

  // Time Attendance
  async getAllTimeAttendance(): Promise<TimeAttendance[]> {
    return await db.select().from(timeAttendance);
  }

  async getTimeAttendanceByUser(userId: string): Promise<TimeAttendance[]> {
    return await db.select().from(timeAttendance).where(eq(timeAttendance.userId, userId));
  }

  async getTimeAttendanceByDate(date: Date): Promise<TimeAttendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.select().from(timeAttendance)
      .where(and(
        gte(timeAttendance.date, startOfDay),
        lte(timeAttendance.date, endOfDay)
      ));
  }

  async getTimeAttendanceByUserAndDate(userId: string, date: Date): Promise<TimeAttendance | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [attendance] = await db.select().from(timeAttendance)
      .where(and(
        eq(timeAttendance.userId, userId),
        gte(timeAttendance.date, startOfDay),
        lte(timeAttendance.date, endOfDay)
      ));
    return attendance || undefined;
  }

  async getTimeAttendance(id: number): Promise<TimeAttendance | undefined> {
    const [attendance] = await db.select().from(timeAttendance).where(eq(timeAttendance.id, id));
    return attendance || undefined;
  }

  async createTimeAttendance(attendanceData: InsertTimeAttendance): Promise<TimeAttendance> {
    const [attendance] = await db
      .insert(timeAttendance)
      .values(attendanceData)
      .returning();
    return attendance;
  }

  async updateTimeAttendance(id: number, attendanceData: Partial<TimeAttendance>): Promise<TimeAttendance | undefined> {
    const [updated] = await db
      .update(timeAttendance)
      .set(attendanceData)
      .where(eq(timeAttendance.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTimeAttendance(id: number): Promise<boolean> {
    await db.delete(timeAttendance).where(eq(timeAttendance.id, id));
    return true;
  }



  // Employee profile data is now part of users table - no separate methods needed

  // Geofences
  async getGeofences(): Promise<Geofence[]> {
    return await db.select().from(geofences).where(eq(geofences.isActive, true));
  }

  async getGeofence(id: number): Promise<Geofence | undefined> {
    const [geofence] = await db.select().from(geofences).where(eq(geofences.id, id));
    return geofence;
  }

  async createGeofence(geofenceData: InsertGeofence): Promise<Geofence> {
    const [geofence] = await db.insert(geofences).values(geofenceData).returning();
    return geofence;
  }

  async updateGeofence(id: number, geofenceData: Partial<Geofence>): Promise<Geofence | undefined> {
    const [updated] = await db.update(geofences).set(geofenceData).where(eq(geofences.id, id)).returning();
    return updated;
  }

  async deleteGeofence(id: number): Promise<boolean> {
    await db.update(geofences).set({ isActive: false }).where(eq(geofences.id, id));
    return true;
  }

  // Leave Requests
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).orderBy(desc(leaveRequests.requestedAt));
  }

  async getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.userId, userId)).orderBy(desc(leaveRequests.requestedAt));
  }

  async getLeaveRequestsByStatus(status: string): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.status, status)).orderBy(desc(leaveRequests.requestedAt));
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request;
  }

  async createLeaveRequest(requestData: InsertLeaveRequest): Promise<LeaveRequest> {
    const [request] = await db.insert(leaveRequests).values(requestData).returning();
    return request;
  }

  async updateLeaveRequest(id: number, requestData: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const [updated] = await db.update(leaveRequests).set(requestData).where(eq(leaveRequests.id, id)).returning();
    return updated;
  }

  async deleteLeaveRequest(id: number): Promise<boolean> {
    await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    return true;
  }

  // Overtime Requests
  async getOvertimeRequests(): Promise<OvertimeRequest[]> {
    return await db.select().from(overtimeRequests).orderBy(desc(overtimeRequests.requestedAt));
  }

  async getOvertimeRequestsByUser(userId: string): Promise<OvertimeRequest[]> {
    return await db.select().from(overtimeRequests).where(eq(overtimeRequests.userId, userId)).orderBy(desc(overtimeRequests.requestedAt));
  }

  async getOvertimeRequestsByStatus(status: string): Promise<OvertimeRequest[]> {
    return await db.select().from(overtimeRequests).where(eq(overtimeRequests.status, status)).orderBy(desc(overtimeRequests.requestedAt));
  }

  async getOvertimeRequest(id: number): Promise<OvertimeRequest | undefined> {
    const [request] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, id));
    return request;
  }

  async createOvertimeRequest(requestData: InsertOvertimeRequest): Promise<OvertimeRequest> {
    const [request] = await db.insert(overtimeRequests).values(requestData).returning();
    return request;
  }

  async updateOvertimeRequest(id: number, requestData: Partial<OvertimeRequest>): Promise<OvertimeRequest | undefined> {
    const [updated] = await db.update(overtimeRequests).set(requestData).where(eq(overtimeRequests.id, id)).returning();
    return updated;
  }

  async deleteOvertimeRequest(id: number): Promise<boolean> {
    await db.delete(overtimeRequests).where(eq(overtimeRequests.id, id));
    return true;
  }

  // Payroll Records
  async getPayrollRecords(): Promise<PayrollRecord[]> {
    return await db.select().from(payrollRecords).orderBy(desc(payrollRecords.payPeriodEnd));
  }

  async getPayrollRecordsByUser(userId: string): Promise<PayrollRecord[]> {
    return await db.select().from(payrollRecords).where(eq(payrollRecords.userId, userId)).orderBy(desc(payrollRecords.payPeriodEnd));
  }

  async getPayrollRecordsByStatus(status: string): Promise<PayrollRecord[]> {
    return await db.select().from(payrollRecords).where(eq(payrollRecords.status, status)).orderBy(desc(payrollRecords.payPeriodEnd));
  }

  async getPayrollRecord(id: number): Promise<PayrollRecord | undefined> {
    const [record] = await db.select().from(payrollRecords).where(eq(payrollRecords.id, id));
    return record;
  }

  async createPayrollRecord(recordData: InsertPayrollRecord): Promise<PayrollRecord> {
    const [record] = await db.insert(payrollRecords).values(recordData).returning();
    return record;
  }

  async updatePayrollRecord(id: number, recordData: Partial<PayrollRecord>): Promise<PayrollRecord | undefined> {
    const [updated] = await db.update(payrollRecords).set(recordData).where(eq(payrollRecords.id, id)).returning();
    return updated;
  }

  async deletePayrollRecord(id: number): Promise<boolean> {
    await db.delete(payrollRecords).where(eq(payrollRecords.id, id));
    return true;
  }

  // Performance Reviews
  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    return await db.select().from(performanceReviews).orderBy(desc(performanceReviews.reviewDate));
  }

  async getPerformanceReviewsByUser(userId: string): Promise<PerformanceReview[]> {
    return await db.select().from(performanceReviews).where(eq(performanceReviews.userId, userId)).orderBy(desc(performanceReviews.reviewDate));
  }

  async getPerformanceReviewsByReviewer(reviewerId: string): Promise<PerformanceReview[]> {
    return await db.select().from(performanceReviews).where(eq(performanceReviews.reviewerId, reviewerId)).orderBy(desc(performanceReviews.reviewDate));
  }

  async getPerformanceReview(id: number): Promise<PerformanceReview | undefined> {
    const [review] = await db.select().from(performanceReviews).where(eq(performanceReviews.id, id));
    return review;
  }

  async createPerformanceReview(reviewData: InsertPerformanceReview): Promise<PerformanceReview> {
    const [review] = await db.insert(performanceReviews).values(reviewData).returning();
    return review;
  }

  async updatePerformanceReview(id: number, reviewData: Partial<PerformanceReview>): Promise<PerformanceReview | undefined> {
    const [updated] = await db.update(performanceReviews).set(reviewData).where(eq(performanceReviews.id, id)).returning();
    return updated;
  }

  async deletePerformanceReview(id: number): Promise<boolean> {
    await db.delete(performanceReviews).where(eq(performanceReviews.id, id));
    return true;
  }

  // Overtime Analysis Methods
  async getMonthlyOvertimeByUser(userId: string, year: number, month: number): Promise<{ totalHours: number; approvedHours: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const result = await db
      .select({
        totalHours: sql<number>`COALESCE(SUM(${overtimeRequests.requestedHours}), 0)`,
        approvedHours: sql<number>`COALESCE(SUM(CASE WHEN ${overtimeRequests.status} = 'approved' THEN ${overtimeRequests.approvedHours} ELSE 0 END), 0)`
      })
      .from(overtimeRequests)
      .where(
        and(
          eq(overtimeRequests.userId, userId),
          gte(overtimeRequests.date, startDate),
          lte(overtimeRequests.date, endDate)
        )
      );
    
    return result[0] || { totalHours: 0, approvedHours: 0 };
  }

  // Geofence Checking Method
  async checkUserInGeofence(latitude: number, longitude: number): Promise<Geofence[]> {
    // This would typically use a spatial query in PostGIS, but for now we'll use a simple distance calculation
    const geofences = await this.getGeofences();
    const inGeofences: Geofence[] = [];
    
    for (const geofence of geofences) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        geofence.centerLatitude,
        geofence.centerLongitude
      );
      
      if (distance <= geofence.radius) {
        inGeofences.push(geofence);
      }
    }
    
    return inGeofences;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Employee of the Month
  async getEmployeeOfMonth(): Promise<EmployeeOfMonth[]> {
    return await db.select().from(employeeOfMonth);
  }

  async getEmployeeOfMonthByYear(year: number): Promise<EmployeeOfMonth[]> {
    return await db.select().from(employeeOfMonth).where(eq(employeeOfMonth.year, year));
  }

  async getEmployeeOfMonthByUser(userId: string): Promise<EmployeeOfMonth[]> {
    return await db.select().from(employeeOfMonth).where(eq(employeeOfMonth.userId, userId));
  }

  async getEmployeeOfMonthRecord(id: number): Promise<EmployeeOfMonth | undefined> {
    const [record] = await db.select().from(employeeOfMonth).where(eq(employeeOfMonth.id, id));
    return record || undefined;
  }

  async createEmployeeOfMonth(employeeData: InsertEmployeeOfMonth): Promise<EmployeeOfMonth> {
    const [employee] = await db
      .insert(employeeOfMonth)
      .values(employeeData)
      .returning();
    return employee;
  }

  async updateEmployeeOfMonth(id: number, employeeData: Partial<EmployeeOfMonth>): Promise<EmployeeOfMonth | undefined> {
    const [updated] = await db
      .update(employeeOfMonth)
      .set(employeeData)
      .where(eq(employeeOfMonth.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmployeeOfMonth(id: number): Promise<boolean> {
    await db.delete(employeeOfMonth).where(eq(employeeOfMonth.id, id));
    return true;
  }

  // HR Violations
  async getHrViolations(): Promise<HrViolation[]> {
    return await db.select().from(hrViolations);
  }

  async getHrViolationsByUser(userId: string): Promise<HrViolation[]> {
    return await db.select().from(hrViolations).where(eq(hrViolations.userId, userId));
  }

  async getHrViolationsByReporter(reportedBy: string): Promise<HrViolation[]> {
    return await db.select().from(hrViolations).where(eq(hrViolations.reportedBy, reportedBy));
  }

  async getHrViolationsByStatus(status: string): Promise<HrViolation[]> {
    return await db.select().from(hrViolations).where(eq(hrViolations.status, status));
  }

  async getHrViolationsBySeverity(severity: string): Promise<HrViolation[]> {
    return await db.select().from(hrViolations).where(eq(hrViolations.severity, severity));
  }

  async getHrViolation(id: number): Promise<HrViolation | undefined> {
    const [violation] = await db.select().from(hrViolations).where(eq(hrViolations.id, id));
    return violation || undefined;
  }

  async createHrViolation(violationData: InsertHrViolation): Promise<HrViolation> {
    const [violation] = await db
      .insert(hrViolations)
      .values(violationData)
      .returning();
    return violation;
  }

  async updateHrViolation(id: number, violationData: Partial<HrViolation>): Promise<HrViolation | undefined> {
    const [updated] = await db
      .update(hrViolations)
      .set(violationData)
      .where(eq(hrViolations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHrViolation(id: number): Promise<boolean> {
    await db.delete(hrViolations).where(eq(hrViolations.id, id));
    return true;
  }

  // HR Complaints
  async getHrComplaints(): Promise<HrComplaint[]> {
    return await db.select().from(hrComplaints);
  }

  async getHrComplaintsByComplainant(complainantId: string): Promise<HrComplaint[]> {
    return await db.select().from(hrComplaints).where(eq(hrComplaints.complainantId, complainantId));
  }

  async getHrComplaintsByAgainstUser(againstUserId: string): Promise<HrComplaint[]> {
    return await db.select().from(hrComplaints).where(eq(hrComplaints.againstUserId, againstUserId));
  }

  async getHrComplaintsByUser(userId: string): Promise<HrComplaint[]> {
    return await db.select().from(hrComplaints).where(
      or(
        eq(hrComplaints.complainantId, userId),
        eq(hrComplaints.againstUserId, userId)
      )
    );
  }

  async getHrComplaintsByStatus(status: string): Promise<HrComplaint[]> {
    return await db.select().from(hrComplaints).where(eq(hrComplaints.status, status));
  }

  async getHrComplaintsByAssignee(assignedTo: string): Promise<HrComplaint[]> {
    // Note: HR complaints don't have assignedTo field in current schema
    // This method returns empty array until schema is updated
    return [];
  }

  async getHrComplaint(id: number): Promise<HrComplaint | undefined> {
    const [complaint] = await db.select().from(hrComplaints).where(eq(hrComplaints.id, id));
    return complaint || undefined;
  }

  async createHrComplaint(complaintData: InsertHrComplaint): Promise<HrComplaint> {
    const [complaint] = await db
      .insert(hrComplaints)
      .values(complaintData)
      .returning();
    return complaint;
  }

  async updateHrComplaint(id: number, complaintData: Partial<HrComplaint>): Promise<HrComplaint | undefined> {
    const [updated] = await db
      .update(hrComplaints)
      .set(complaintData)
      .where(eq(hrComplaints.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHrComplaint(id: number): Promise<boolean> {
    await db.delete(hrComplaints).where(eq(hrComplaints.id, id));
    return true;
  }

  // Maintenance Requests methods
  async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return await db.select().from(maintenanceRequests).orderBy(desc(maintenanceRequests.createdAt));
  }

  async getMaintenanceRequest(id: number): Promise<MaintenanceRequest | undefined> {
    const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return request || undefined;
  }

  async getMaintenanceRequestsByMachine(machineId: string): Promise<MaintenanceRequest[]> {
    return await db.select().from(maintenanceRequests)
      .where(eq(maintenanceRequests.machineId, machineId))
      .orderBy(desc(maintenanceRequests.createdAt));
  }

  async getMaintenanceRequestsByStatus(status: string): Promise<MaintenanceRequest[]> {
    return await db.select().from(maintenanceRequests)
      .where(eq(maintenanceRequests.status, status))
      .orderBy(desc(maintenanceRequests.createdAt));
  }

  async getMaintenanceRequestsByUser(userId: string): Promise<MaintenanceRequest[]> {
    return await db.select().from(maintenanceRequests)
      .where(eq(maintenanceRequests.requestedBy, userId))
      .orderBy(desc(maintenanceRequests.createdAt));
  }

  async createMaintenanceRequest(requestData: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const [request] = await db
      .insert(maintenanceRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async updateMaintenanceRequest(id: number, requestData: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined> {
    const [updated] = await db
      .update(maintenanceRequests)
      .set(requestData)
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMaintenanceRequest(id: number): Promise<boolean> {
    await db.delete(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return true;
  }

  // Maintenance Actions methods
  async getMaintenanceActions(): Promise<MaintenanceAction[]> {
    return await db.select().from(maintenanceActions).orderBy(desc(maintenanceActions.actionDate));
  }

  async getMaintenanceAction(id: number): Promise<MaintenanceAction | undefined> {
    const [action] = await db.select().from(maintenanceActions).where(eq(maintenanceActions.id, id));
    return action || undefined;
  }

  async getMaintenanceActionsByRequest(requestId: number): Promise<MaintenanceAction[]> {
    return await db.select().from(maintenanceActions)
      .where(eq(maintenanceActions.requestId, requestId))
      .orderBy(desc(maintenanceActions.actionDate));
  }

  async getMaintenanceActionsByMachine(machineId: string): Promise<MaintenanceAction[]> {
    return await db.select().from(maintenanceActions)
      .where(eq(maintenanceActions.machineId, machineId))
      .orderBy(desc(maintenanceActions.actionDate));
  }

  async createMaintenanceAction(actionData: InsertMaintenanceAction): Promise<MaintenanceAction> {
    const [action] = await db
      .insert(maintenanceActions)
      .values(actionData)
      .returning();
    return action;
  }

  async updateMaintenanceAction(id: number, actionData: Partial<MaintenanceAction>): Promise<MaintenanceAction | undefined> {
    const [updated] = await db
      .update(maintenanceActions)
      .set(actionData)
      .where(eq(maintenanceActions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMaintenanceAction(id: number): Promise<boolean> {
    await db.delete(maintenanceActions).where(eq(maintenanceActions.id, id));
    return true;
  }

  // Maintenance Schedule methods
  async getMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    return await db.select().from(maintenanceSchedule).orderBy(asc(maintenanceSchedule.nextDue));
  }

  async getMaintenanceSchedule(id: number): Promise<MaintenanceSchedule | undefined> {
    const [schedule] = await db.select().from(maintenanceSchedule).where(eq(maintenanceSchedule.id, id));
    return schedule || undefined;
  }

  async getMaintenanceSchedulesByMachine(machineId: string): Promise<MaintenanceSchedule[]> {
    return await db.select().from(maintenanceSchedule)
      .where(eq(maintenanceSchedule.machineId, machineId))
      .orderBy(asc(maintenanceSchedule.nextDue));
  }

  async getOverdueMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    const today = new Date();
    return await db.select().from(maintenanceSchedule)
      .where(and(
        eq(maintenanceSchedule.status, "active"),
        lte(maintenanceSchedule.nextDue, today)
      ))
      .orderBy(asc(maintenanceSchedule.nextDue));
  }

  async createMaintenanceSchedule(scheduleData: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    const [schedule] = await db
      .insert(maintenanceSchedule)
      .values(scheduleData)
      .returning();
    return schedule;
  }

  async updateMaintenanceSchedule(id: number, scheduleData: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule | undefined> {
    const [updated] = await db
      .update(maintenanceSchedule)
      .set(scheduleData)
      .where(eq(maintenanceSchedule.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMaintenanceSchedule(id: number): Promise<boolean> {
    await db.delete(maintenanceSchedule).where(eq(maintenanceSchedule.id, id));
    return true;
  }

  // Training methods
  async getTrainings(): Promise<Training[]> {
    return await db.select().from(trainings).orderBy(desc(trainings.createdAt));
  }

  async getTrainingsByTrainee(traineeId: string): Promise<Training[]> {
    return await db.select().from(trainings)
      .where(eq(trainings.traineeId, traineeId))
      .orderBy(desc(trainings.createdAt));
  }

  async getTrainingsBySupervisor(supervisorId: string): Promise<Training[]> {
    return await db.select().from(trainings)
      .where(eq(trainings.supervisorId, supervisorId))
      .orderBy(desc(trainings.createdAt));
  }

  async getTrainingsBySection(section: string): Promise<Training[]> {
    return await db.select().from(trainings)
      .where(eq(trainings.trainingSection, section))
      .orderBy(desc(trainings.createdAt));
  }

  async getTraining(id: number): Promise<Training | undefined> {
    const [training] = await db.select().from(trainings).where(eq(trainings.id, id));
    return training || undefined;
  }

  async createTraining(training: InsertTraining): Promise<Training> {
    const [created] = await db
      .insert(trainings)
      .values(training)
      .returning();
    return created;
  }

  async updateTraining(id: number, training: Partial<Training>): Promise<Training | undefined> {
    const [updated] = await db
      .update(trainings)
      .set({ ...training, updatedAt: new Date() })
      .where(eq(trainings.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTraining(id: number): Promise<boolean> {
    await db.delete(trainings).where(eq(trainings.id, id));
    return true;
  }

  // Training Points methods
  async getTrainingPoints(): Promise<TrainingPoint[]> {
    return await db.select().from(trainingPoints).orderBy(asc(trainingPoints.name));
  }

  async getActiveTrainingPoints(): Promise<TrainingPoint[]> {
    return await db.select().from(trainingPoints)
      .where(eq(trainingPoints.isActive, true))
      .orderBy(asc(trainingPoints.name));
  }

  async getTrainingPointsByCategory(category: string): Promise<TrainingPoint[]> {
    return await db.select().from(trainingPoints)
      .where(and(eq(trainingPoints.category, category), eq(trainingPoints.isActive, true)))
      .orderBy(asc(trainingPoints.name));
  }

  async getTrainingPoint(id: number): Promise<TrainingPoint | undefined> {
    const [point] = await db.select().from(trainingPoints).where(eq(trainingPoints.id, id));
    return point || undefined;
  }

  async createTrainingPoint(point: InsertTrainingPoint): Promise<TrainingPoint> {
    const [created] = await db
      .insert(trainingPoints)
      .values(point)
      .returning();
    return created;
  }

  async updateTrainingPoint(id: number, point: Partial<TrainingPoint>): Promise<TrainingPoint | undefined> {
    const [updated] = await db
      .update(trainingPoints)
      .set(point)
      .where(eq(trainingPoints.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTrainingPoint(id: number): Promise<boolean> {
    await db.delete(trainingPoints).where(eq(trainingPoints.id, id));
    return true;
  }

  // Training Evaluations methods
  async getTrainingEvaluations(): Promise<TrainingEvaluation[]> {
    return await db.select().from(trainingEvaluations).orderBy(desc(trainingEvaluations.createdAt));
  }

  async getTrainingEvaluationsByTraining(trainingId: number): Promise<TrainingEvaluation[]> {
    return await db.select().from(trainingEvaluations)
      .where(eq(trainingEvaluations.trainingId, trainingId))
      .orderBy(asc(trainingEvaluations.id));
  }

  async getTrainingEvaluation(id: number): Promise<TrainingEvaluation | undefined> {
    const [evaluation] = await db.select().from(trainingEvaluations).where(eq(trainingEvaluations.id, id));
    return evaluation || undefined;
  }

  async createTrainingEvaluation(evaluation: InsertTrainingEvaluation): Promise<TrainingEvaluation> {
    const [created] = await db
      .insert(trainingEvaluations)
      .values({
        ...evaluation,
        evaluatedAt: new Date()
      })
      .returning();
    return created;
  }

  async updateTrainingEvaluation(id: number, evaluation: Partial<TrainingEvaluation>): Promise<TrainingEvaluation | undefined> {
    const [updated] = await db
      .update(trainingEvaluations)
      .set(evaluation)
      .where(eq(trainingEvaluations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTrainingEvaluation(id: number): Promise<boolean> {
    await db.delete(trainingEvaluations).where(eq(trainingEvaluations.id, id));
    return true;
  }

  // Training Field Evaluations methods
  async getTrainingFieldEvaluations(): Promise<TrainingFieldEvaluation[]> {
    return await db.select().from(trainingFieldEvaluations).orderBy(desc(trainingFieldEvaluations.createdAt));
  }

  async getTrainingFieldEvaluationsByTraining(trainingId: number): Promise<TrainingFieldEvaluation[]> {
    return await db.select().from(trainingFieldEvaluations)
      .where(eq(trainingFieldEvaluations.trainingId, trainingId))
      .orderBy(asc(trainingFieldEvaluations.id));
  }

  async getTrainingFieldEvaluation(id: number): Promise<TrainingFieldEvaluation | undefined> {
    const [evaluation] = await db.select().from(trainingFieldEvaluations).where(eq(trainingFieldEvaluations.id, id));
    return evaluation || undefined;
  }

  async createTrainingFieldEvaluation(evaluation: InsertTrainingFieldEvaluation): Promise<TrainingFieldEvaluation> {
    const [created] = await db
      .insert(trainingFieldEvaluations)
      .values({
        ...evaluation,
        evaluatedAt: evaluation.evaluatedAt || new Date()
      })
      .returning();
    return created;
  }

  async updateTrainingFieldEvaluation(id: number, evaluation: Partial<TrainingFieldEvaluation>): Promise<TrainingFieldEvaluation | undefined> {
    const [updated] = await db
      .update(trainingFieldEvaluations)
      .set(evaluation)
      .where(eq(trainingFieldEvaluations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTrainingFieldEvaluation(id: number): Promise<boolean> {
    await db.delete(trainingFieldEvaluations).where(eq(trainingFieldEvaluations.id, id));
    return true;
  }

  // Training Certificates methods
  async getTrainingCertificates(): Promise<TrainingCertificate[]> {
    return await db.select().from(trainingCertificates).orderBy(desc(trainingCertificates.issuedDate));
  }

  async getTrainingCertificatesByTraining(trainingId: number): Promise<TrainingCertificate[]> {
    return await db.select().from(trainingCertificates)
      .where(eq(trainingCertificates.trainingId, trainingId))
      .orderBy(desc(trainingCertificates.issuedDate));
  }

  async getTrainingCertificate(id: number): Promise<TrainingCertificate | undefined> {
    const [certificate] = await db.select().from(trainingCertificates).where(eq(trainingCertificates.id, id));
    return certificate || undefined;
  }

  async getTrainingCertificateByNumber(certificateNumber: string): Promise<TrainingCertificate | undefined> {
    const [certificate] = await db.select().from(trainingCertificates)
      .where(eq(trainingCertificates.certificateNumber, certificateNumber));
    return certificate || undefined;
  }

  async createTrainingCertificate(certificate: InsertCertificate): Promise<TrainingCertificate> {
    // Generate unique certificate number if not provided
    if (!certificate.certificateNumber) {
      const prefix = "CERT";
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      certificate.certificateNumber = `${prefix}-${timestamp}-${random}`;
    }

    const [created] = await db
      .insert(trainingCertificates)
      .values(certificate)
      .returning();
    return created;
  }

  async updateTrainingCertificate(id: number, certificate: Partial<TrainingCertificate>): Promise<TrainingCertificate | undefined> {
    const [updated] = await db
      .update(trainingCertificates)
      .set(certificate)
      .where(eq(trainingCertificates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTrainingCertificate(id: number): Promise<boolean> {
    await db.delete(trainingCertificates).where(eq(trainingCertificates.id, id));
    return true;
  }

  async revokeCertificate(id: number): Promise<TrainingCertificate | undefined> {
    return await this.updateTrainingCertificate(id, { status: "revoked" });
  }

  async getActiveCertificates(): Promise<TrainingCertificate[]> {
    return await db.select().from(trainingCertificates)
      .where(eq(trainingCertificates.status, "active"))
      .orderBy(desc(trainingCertificates.issuedDate));
  }

  // ABA Formulas methods
  async getAbaFormulas(): Promise<any[]> {
    const formulas = await db.select().from(abaFormulas).orderBy(desc(abaFormulas.createdAt));
    
    // Transform data to frontend format and include materials
    const result = [];
    for (const formula of formulas) {
      const materials = await this.getAbaFormulaMaterials(formula.id);
      result.push({
        ...formula,
        aToB: this.parseAbRatio(formula.abRatio), // Convert "2:1" to 2
        materials
      });
    }
    
    return result;
  }

  async getAbaFormula(id: number): Promise<any | undefined> {
    const [formula] = await db.select().from(abaFormulas).where(eq(abaFormulas.id, id));
    if (!formula) return undefined;
    
    const materials = await this.getAbaFormulaMaterials(formula.id);
    return {
      ...formula,
      aToB: this.parseAbRatio(formula.abRatio), // Convert "2:1" to 2
      materials
    };
  }

  async getAbaFormulaById(id: number): Promise<AbaFormula | undefined> {
    const [formula] = await db.select().from(abaFormulas).where(eq(abaFormulas.id, id));
    return formula || undefined;
  }

  private parseAbRatio(abRatio: string): number {
    // Convert "2:1" format to number 2
    const parts = abRatio.split(':');
    return parseInt(parts[0]) || 1;
  }

  async createAbaFormula(formula: InsertAbaFormula): Promise<AbaFormula> {
    const [created] = await db
      .insert(abaFormulas)
      .values(formula)
      .returning();
    return created;
  }

  async updateAbaFormula(id: number, updates: Partial<InsertAbaFormula>): Promise<AbaFormula | undefined> {
    const [updated] = await db
      .update(abaFormulas)
      .set(updates)
      .where(eq(abaFormulas.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAbaFormula(id: number): Promise<boolean> {
    // Delete related materials first
    await db.delete(abaFormulaMaterials).where(eq(abaFormulaMaterials.formulaId, id));
    // Then delete the formula
    await db.delete(abaFormulas).where(eq(abaFormulas.id, id));
    return true;
  }

  // ABA Formula Materials methods
  async getAbaFormulaMaterials(formulaId: number): Promise<AbaFormulaMaterial[]> {
    return await db.select().from(abaFormulaMaterials)
      .where(eq(abaFormulaMaterials.formulaId, formulaId))
      .orderBy(abaFormulaMaterials.id);
  }

  async createAbaFormulaMaterial(material: InsertAbaFormulaMaterial): Promise<AbaFormulaMaterial> {
    const [created] = await db
      .insert(abaFormulaMaterials)
      .values(material)
      .returning();
    return created;
  }

  async updateAbaFormulaMaterial(id: number, updates: Partial<InsertAbaFormulaMaterial>): Promise<AbaFormulaMaterial | undefined> {
    const [updated] = await db
      .update(abaFormulaMaterials)
      .set(updates)
      .where(eq(abaFormulaMaterials.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAbaFormulaMaterial(id: number): Promise<boolean> {
    await db.delete(abaFormulaMaterials).where(eq(abaFormulaMaterials.id, id));
    return true;
  }

  async deleteAbaFormulaMaterialsByFormula(formulaId: number): Promise<boolean> {
    await db.delete(abaFormulaMaterials).where(eq(abaFormulaMaterials.formulaId, formulaId));
    return true;
  }

  // JO Mix methods
  async getJoMixes(): Promise<JoMix[]> {
    return await db.select().from(joMixes).orderBy(desc(joMixes.createdAt));
  }

  async getJoMix(id: number): Promise<JoMix | undefined> {
    const [mix] = await db.select().from(joMixes).where(eq(joMixes.id, id));
    return mix || undefined;
  }

  async createJoMix(mix: InsertJoMix): Promise<JoMix> {
    const [created] = await db.insert(joMixes).values(mix).returning();
    return created;
  }

  async updateJoMix(id: number, updates: Partial<InsertJoMix>): Promise<JoMix | undefined> {
    const [updated] = await db.update(joMixes).set(updates).where(eq(joMixes.id, id)).returning();
    return updated || undefined;
  }

  async deleteJoMix(id: number): Promise<boolean> {
    // Delete related items and materials first
    await db.delete(joMixItems).where(eq(joMixItems.joMixId, id));
    await db.delete(joMixMaterials).where(eq(joMixMaterials.joMixId, id));
    // Then delete the mix
    await db.delete(joMixes).where(eq(joMixes.id, id));
    return true;
  }

  async generateMixNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of mixes created today
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayMixes = await db.select().from(joMixes)
      .where(and(
        gte(joMixes.createdAt, startOfDay),
        lt(joMixes.createdAt, endOfDay)
      ));
    
    const sequence = String(todayMixes.length + 1).padStart(3, '0');
    return `MIX${dateStr}${sequence}`;
  }

  // JO Mix Items methods
  async getJoMixItems(joMixId: number): Promise<JoMixItem[]> {
    return await db.select().from(joMixItems).where(eq(joMixItems.joMixId, joMixId));
  }

  async createJoMixItem(item: InsertJoMixItem): Promise<JoMixItem> {
    const [created] = await db.insert(joMixItems).values(item).returning();
    return created;
  }

  // JO Mix Materials methods
  async getJoMixMaterials(joMixId: number): Promise<JoMixMaterial[]> {
    return await db.select().from(joMixMaterials).where(eq(joMixMaterials.joMixId, joMixId));
  }

  async createJoMixMaterial(material: InsertJoMixMaterial): Promise<JoMixMaterial> {
    const [created] = await db.insert(joMixMaterials).values(material).returning();
    return created;
  }

  // JO Mix methods
  async getJoMixes(): Promise<any[]> {
    const mixes = await db
      .select({
        id: joMixes.id,
        mixNumber: joMixes.mixNumber,
        totalQuantity: joMixes.totalQuantity,
        screwType: joMixes.screwType,
        status: joMixes.status,
        createdBy: joMixes.createdBy,
        createdAt: joMixes.createdAt,
        completedAt: joMixes.completedAt,
        abaFormulaId: joMixes.abaFormulaId,
        formulaName: abaFormulas.name,
        createdByName: users.username,
      })
      .from(joMixes)
      .leftJoin(abaFormulas, eq(joMixes.abaFormulaId, abaFormulas.id))
      .leftJoin(users, eq(joMixes.createdBy, users.id))
      .orderBy(joMixes.createdAt);

    // Get mix items and materials for each mix
    for (const mix of mixes) {
      const items = await this.getJoMixItems(mix.id);
      const materials = await this.getJoMixMaterials(mix.id);
      mix.items = items;
      mix.materials = materials;
    }

    return mixes;
  }

  async getJoMix(id: number): Promise<any | undefined> {
    const [mix] = await db
      .select({
        id: joMixes.id,
        mixNumber: joMixes.mixNumber,
        totalQuantity: joMixes.totalQuantity,
        screwType: joMixes.screwType,
        status: joMixes.status,
        createdBy: joMixes.createdBy,
        createdAt: joMixes.createdAt,
        completedAt: joMixes.completedAt,
        abaFormulaId: joMixes.abaFormulaId,
        formulaName: abaFormulas.name,
        createdByName: users.username,
      })
      .from(joMixes)
      .leftJoin(abaFormulas, eq(joMixes.abaFormulaId, abaFormulas.id))
      .leftJoin(users, eq(joMixes.createdBy, users.id))
      .where(eq(joMixes.id, id));

    if (!mix) return undefined;

    // Get mix items and materials
    const items = await this.getJoMixItems(mix.id);
    const materials = await this.getJoMixMaterials(mix.id);
    
    return {
      ...mix,
      items,
      materials
    };
  }

  async createJoMix(mix: InsertJoMix): Promise<JoMix> {
    const [created] = await db
      .insert(joMixes)
      .values(mix)
      .returning();
    return created;
  }

  async updateJoMix(id: number, updates: Partial<InsertJoMix>): Promise<JoMix | undefined> {
    const [updated] = await db
      .update(joMixes)
      .set(updates)
      .where(eq(joMixes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteJoMix(id: number): Promise<boolean> {
    await db.delete(joMixes).where(eq(joMixes.id, id));
    return true;
  }

  // JO Mix Items methods
  async getJoMixItems(joMixId: number): Promise<any[]> {
    return await db
      .select({
        id: joMixItems.id,
        joMixId: joMixItems.joMixId,
        jobOrderId: joMixItems.jobOrderId,
        quantity: joMixItems.quantity,
        createdAt: joMixItems.createdAt,
        jobOrderNumber: jobOrders.id,
        jobOrderQty: jobOrders.quantity,
      })
      .from(joMixItems)
      .leftJoin(jobOrders, eq(joMixItems.jobOrderId, jobOrders.id))
      .where(eq(joMixItems.joMixId, joMixId))
      .orderBy(joMixItems.id);
  }

  async createJoMixItem(item: InsertJoMixItem): Promise<JoMixItem> {
    const [created] = await db
      .insert(joMixItems)
      .values(item)
      .returning();
    return created;
  }

  async deleteJoMixItems(joMixId: number): Promise<boolean> {
    await db.delete(joMixItems).where(eq(joMixItems.joMixId, joMixId));
    return true;
  }

  // JO Mix Materials methods
  async getJoMixMaterials(joMixId: number): Promise<any[]> {
    return await db
      .select({
        id: joMixMaterials.id,
        joMixId: joMixMaterials.joMixId,
        materialId: joMixMaterials.materialId,
        quantity: joMixMaterials.quantity,
        percentage: joMixMaterials.percentage,
        createdAt: joMixMaterials.createdAt,
        materialName: rawMaterials.name,
        materialType: rawMaterials.type,
        materialUnit: rawMaterials.unit,
      })
      .from(joMixMaterials)
      .leftJoin(rawMaterials, eq(joMixMaterials.materialId, rawMaterials.id))
      .where(eq(joMixMaterials.joMixId, joMixId))
      .orderBy(joMixMaterials.id);
  }

  async createJoMixMaterial(material: InsertJoMixMaterial): Promise<JoMixMaterial> {
    const [created] = await db
      .insert(joMixMaterials)
      .values(material)
      .returning();
    return created;
  }

  async deleteJoMixMaterials(joMixId: number): Promise<boolean> {
    await db.delete(joMixMaterials).where(eq(joMixMaterials.joMixId, joMixId));
    return true;
  }

  // Generate unique mix number
  async generateMixNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of mixes created today
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todayMixes = await db
      .select()
      .from(joMixes)
      .where(sql`${joMixes.createdAt} >= ${todayStart} AND ${joMixes.createdAt} < ${todayEnd}`);
    
    const sequenceNumber = (todayMixes.length + 1).toString().padStart(3, '0');
    return `MIX${dateStr}${sequenceNumber}`;
  }
}