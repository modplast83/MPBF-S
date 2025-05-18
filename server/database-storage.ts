import { eq, and, gte, lte } from "drizzle-orm";
import {
  users,
  type User,
  type UpsertUser,
  permissions,
  type Permission,
  type InsertPermission,
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
  qualityViolations,
  type QualityViolation,
  type InsertQualityViolation,
  qualityPenalties,
  type QualityPenalty,
  type InsertQualityPenalty,
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
  abaMaterialConfigs,
  type AbaMaterialConfig,
  type InsertAbaMaterialConfig
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, sql, ne, desc, asc, isNull } from "drizzle-orm";
import { IStorage } from "./storage";
import connectPg from "connect-pg-simple";
import session from "express-session";

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const pgStore = connectPg(session);
    // Use the holy-bonus database URL if available, otherwise fall back to the standard database URL
    const databaseUrl = process.env.DATABASE_URL_WILDFLOWER || process.env.DATABASE_URL;
    
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
      
      // Handle the special case for password updating
      const isUpdate = !!userData.id;
      const isPasswordUnchanged = userData.password === "UNCHANGED_PASSWORD";
      
      if (isUpdate && isPasswordUnchanged) {
        // Get the existing user to keep their current password
        const existingUser = await this.getUser(userData.id);
        if (!existingUser) {
          throw new Error(`User with id ${userData.id} not found`);
        }
        
        // Use the existing password instead of "UNCHANGED_PASSWORD"
        userData.password = existingUser.password;
      }
      
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
        
      console.log("Upsert user success for:", userData.username);
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  // Permission management operations
  async getPermissions(): Promise<Permission[]> {
    const allPermissions = await db.select().from(permissions);
    return allPermissions;
  }

  async getPermissionsByRole(role: string): Promise<Permission[]> {
    const rolePermissions = await db.select()
      .from(permissions)
      .where(eq(permissions.role, role));
    return rolePermissions;
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const [permission] = await db.select()
      .from(permissions)
      .where(eq(permissions.id, id));
    return permission;
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    try {
      // Extract field values with appropriate defaults
      const role = permission.role;
      const module = permission.module;
      const can_view = permission.can_view === undefined ? true : permission.can_view;
      const can_create = permission.can_create === undefined ? false : permission.can_create;
      const can_edit = permission.can_edit === undefined ? false : permission.can_edit;
      const can_delete = permission.can_delete === undefined ? false : permission.can_delete;
      const is_active = permission.is_active === undefined ? true : permission.is_active;
      
      // Build a direct SQL query for insertion using string interpolation (not parameters)
      // We're not specifying ID so the sequence is used
      const query = `
        INSERT INTO permissions 
        (role, module, can_view, can_create, can_edit, can_delete, is_active) 
        VALUES (
          '${role}',
          '${module}',
          ${can_view ? 'TRUE' : 'FALSE'},
          ${can_create ? 'TRUE' : 'FALSE'},
          ${can_edit ? 'TRUE' : 'FALSE'},
          ${can_delete ? 'TRUE' : 'FALSE'},
          ${is_active ? 'TRUE' : 'FALSE'}
        )
        RETURNING *;
      `;
      
      console.log("Executing direct SQL insert query:", query);
      
      // Execute the raw query using db.execute
      const result = await db.execute(query);
      
      if (!result.rows.length) {
        throw new Error("Failed to create permission - no row returned");
      }
      
      const row = result.rows[0];
      return {
        id: Number(row.id),
        role: row.role,
        module: row.module,
        can_view: Boolean(row.can_view),
        can_create: Boolean(row.can_create),
        can_edit: Boolean(row.can_edit),
        can_delete: Boolean(row.can_delete),
        is_active: Boolean(row.is_active)
      };
    } catch (error) {
      console.error('Error in createPermission:', error);
      throw error;
    }
  }

  async updatePermission(id: number, permissionData: Partial<Permission>): Promise<Permission | undefined> {
    try {
      // Get existing permission first to check if it exists
      const existingPermission = await this.getPermission(id);
      if (!existingPermission) {
        console.error(`Permission with ID ${id} not found`);
        return undefined;
      }
      
      console.log("Original Permission Data:", JSON.stringify(existingPermission));
      console.log("Update Permission Data:", JSON.stringify(permissionData));
      
      // Build SQL SET clauses dynamically with parameter placeholders
      const setClauses = [];
      const params = [];
      let paramIndex = 1;
      
      if (permissionData.can_view !== undefined) {
        setClauses.push(`can_view = $${paramIndex}`);
        params.push(permissionData.can_view);
        paramIndex++;
      }
      
      if (permissionData.can_create !== undefined) {
        setClauses.push(`can_create = $${paramIndex}`);
        params.push(permissionData.can_create);
        paramIndex++;
      }
      
      if (permissionData.can_edit !== undefined) {
        setClauses.push(`can_edit = $${paramIndex}`);
        params.push(permissionData.can_edit);
        paramIndex++;
      }
      
      if (permissionData.can_delete !== undefined) {
        setClauses.push(`can_delete = $${paramIndex}`);
        params.push(permissionData.can_delete);
        paramIndex++;
      }
      
      if (permissionData.is_active !== undefined) {
        setClauses.push(`is_active = $${paramIndex}`);
        params.push(permissionData.is_active);
        paramIndex++;
      }
      
      if (permissionData.role !== undefined) {
        setClauses.push(`role = $${paramIndex}`);
        params.push(permissionData.role);
        paramIndex++;
      }
      
      if (permissionData.module !== undefined) {
        setClauses.push(`module = $${paramIndex}`);
        params.push(permissionData.module);
        paramIndex++;
      }
      
      // Only proceed if we have fields to update
      if (setClauses.length === 0) {
        console.log("No fields to update for permission", id);
        return existingPermission; // Return existing if no updates
      }
      
      // Build full SQL query with returning and use parameterized queries
      const query = {
        text: `
          UPDATE permissions 
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *;
        `,
        values: [...params, id]
      };
      
      console.log("Executing parameterized SQL query:", query.text);
      console.log("With parameters:", query.values);
      
      // Execute the raw query using pool.query for better parameter handling
      const result = await pool.query(query);
      
      if (!result.rows.length) {
        console.log("No rows returned from update query");
        return undefined;
      }
      
      const row = result.rows[0];
      console.log("Updated permission row:", row);
      
      return {
        id: Number(row.id),
        role: row.role,
        module: row.module,
        can_view: Boolean(row.can_view),
        can_create: Boolean(row.can_create),
        can_edit: Boolean(row.can_edit),
        can_delete: Boolean(row.can_delete),
        is_active: Boolean(row.is_active)
      };
    } catch (error) {
      console.error('Error in updatePermission:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async deletePermission(id: number): Promise<boolean> {
    await db
      .delete(permissions)
      .where(eq(permissions.id, id));
    return true;
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
  async getJobOrders(): Promise<JobOrder[]> {
    return await db.select().from(jobOrders);
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
      .where(eq(qualityCheckTypes.stage, stage));
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
    return await db.select().from(qualityChecks);
  }

  async getQualityChecksByRoll(rollId: string): Promise<QualityCheck[]> {
    return await db
      .select()
      .from(qualityChecks)
      .where(eq(qualityChecks.rollId, rollId));
  }

  async getQualityChecksByJobOrder(jobOrderId: number): Promise<QualityCheck[]> {
    return await db
      .select()
      .from(qualityChecks)
      .where(eq(qualityChecks.jobOrderId, jobOrderId));
  }

  async getQualityCheck(id: number): Promise<QualityCheck | undefined> {
    const [check] = await db
      .select()
      .from(qualityChecks)
      .where(eq(qualityChecks.id, id));
    return check;
  }

  async createQualityCheck(qualityCheck: InsertQualityCheck): Promise<QualityCheck> {
    const [created] = await db
      .insert(qualityChecks)
      .values(qualityCheck)
      .returning();
    return created;
  }

  async updateQualityCheck(id: number, qualityCheck: Partial<QualityCheck>): Promise<QualityCheck | undefined> {
    const [updated] = await db
      .update(qualityChecks)
      .set(qualityCheck)
      .where(eq(qualityChecks.id, id))
      .returning();
    return updated;
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
    const [created] = await db
      .insert(plateCalculations)
      .values(calculation)
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

  // ABA Material Configurations methods
  async getAbaMaterialConfigs(): Promise<AbaMaterialConfig[]> {
    return await db.select().from(abaMaterialConfigs);
  }

  async getAbaMaterialConfigsByUser(createdBy: string): Promise<AbaMaterialConfig[]> {
    return await db
      .select()
      .from(abaMaterialConfigs)
      .where(eq(abaMaterialConfigs.createdBy, createdBy));
  }

  async getAbaMaterialConfig(id: number): Promise<AbaMaterialConfig | undefined> {
    const [config] = await db
      .select()
      .from(abaMaterialConfigs)
      .where(eq(abaMaterialConfigs.id, id));
    return config;
  }

  async getDefaultAbaMaterialConfig(): Promise<AbaMaterialConfig | undefined> {
    const [config] = await db
      .select()
      .from(abaMaterialConfigs)
      .where(eq(abaMaterialConfigs.isDefault, true));
    return config;
  }

  async createAbaMaterialConfig(config: InsertAbaMaterialConfig): Promise<AbaMaterialConfig> {
    const [created] = await db
      .insert(abaMaterialConfigs)
      .values(config)
      .returning();
    return created;
  }

  async updateAbaMaterialConfig(id: number, update: Partial<AbaMaterialConfig>): Promise<AbaMaterialConfig | undefined> {
    const [updated] = await db
      .update(abaMaterialConfigs)
      .set(update)
      .where(eq(abaMaterialConfigs.id, id))
      .returning();
    return updated;
  }

  async deleteAbaMaterialConfig(id: number): Promise<boolean> {
    await db
      .delete(abaMaterialConfigs)
      .where(eq(abaMaterialConfigs.id, id));
    return true;
  }

  async setDefaultAbaMaterialConfig(id: number): Promise<boolean> {
    // First, set all configs to not default
    await db
      .update(abaMaterialConfigs)
      .set({ isDefault: false });
    
    // Then set the specified one to default
    const [updated] = await db
      .update(abaMaterialConfigs)
      .set({ isDefault: true })
      .where(eq(abaMaterialConfigs.id, id))
      .returning();
    
    return !!updated;
  }
}