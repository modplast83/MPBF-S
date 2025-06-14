import { IStorage } from './storage';
import { DatabaseStorage } from './database-storage';
import session from "express-session";
import {
  User, UpsertUser, Customer, InsertCustomer, Category, InsertCategory,
  Item, InsertItem, Section, InsertSection, Machine, InsertMachine,
  MasterBatch, InsertMasterBatch, CustomerProduct, InsertCustomerProduct,
  Order, InsertOrder, JobOrder, InsertJobOrder, Roll, InsertRoll,
  RawMaterial, InsertRawMaterial, FinalProduct, InsertFinalProduct,
  QualityCheckType, InsertQualityCheckType, QualityCheck, InsertQualityCheck,
  CorrectiveAction, InsertCorrectiveAction, SmsMessage, InsertSmsMessage,
  MixMaterial, InsertMixMaterial, MixItem, InsertMixItem,
  MixMachine, InsertMixMachine, permissions, Permission, InsertPermission,
  MaterialInput, InsertMaterialInput, MaterialInputItem, InsertMaterialInputItem,
  PlatePricingParameter, InsertPlatePricingParameter,
  PlateCalculation, InsertPlateCalculation,
  categories, items, sections, machines, masterBatches, customers, customerProducts,
  orders, jobOrders, rolls, rawMaterials, finalProducts, qualityCheckTypes,
  qualityChecks, correctiveActions, smsMessages, mixMaterials, mixItems, mixMachines,
  platePricingParameters, plateCalculations,
  abaMaterialConfigs, AbaMaterialConfig, InsertAbaMaterialConfig
} from "@shared/schema";
import { db, pool } from "./db";
import { and, eq, or, sql, ne } from "drizzle-orm";

/**
 * Helper function to check if a database table exists
 * Uses parametrized SQL to avoid SQL injection
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ${tableName}
      )
    `);
    return result.rows[0]?.exists === true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * HybridStorage class that combines DatabaseStorage for authentication
 * with fallback implementations for the rest of the interface
 */
export class HybridStorage implements IStorage {
  private dbStorage: DatabaseStorage;
  sessionStore: session.Store;
  
  constructor() {
    // Create an instance of DatabaseStorage to handle authentication
    this.dbStorage = new DatabaseStorage();
    this.sessionStore = this.dbStorage.sessionStore;
  }
  
  // =========================================================================
  // User Management - Use database implementation
  // =========================================================================
  
  async getUsers(): Promise<User[]> {
    return this.dbStorage.getUsers();
  }
  
  async getUser(id: string): Promise<User | undefined> {
    return this.dbStorage.getUser(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.dbStorage.getUserByUsername(username);
  }
  
  async createUser(user: UpsertUser): Promise<User> {
    return this.dbStorage.createUser(user);
  }
  
  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    return this.dbStorage.updateUser(id, user);
  }
  
  async deleteUser(id: string): Promise<boolean> {
    return this.dbStorage.deleteUser(id);
  }
  
  async upsertUser(user: UpsertUser): Promise<User> {
    return this.dbStorage.upsertUser(user);
  }
  
  // =========================================================================
  // Permission Management - Use database implementation
  // =========================================================================
  
  async getPermissions(): Promise<Permission[]> {
    return this.dbStorage.getPermissions();
  }
  
  async getPermissionsByUser(userId: string): Promise<Permission[]> {
    return this.dbStorage.getPermissionsByUser(userId);
  }
  
  async getPermissionsBySection(sectionId: string): Promise<Permission[]> {
    return this.dbStorage.getPermissionsBySection(sectionId);
  }
  
  async getPermissionsByModule(moduleId: number): Promise<Permission[]> {
    return this.dbStorage.getPermissionsByModule(moduleId);
  }
  
  async getPermission(id: number): Promise<Permission | undefined> {
    return this.dbStorage.getPermission(id);
  }
  
  async createPermission(permission: InsertPermission): Promise<Permission> {
    return this.dbStorage.createPermission(permission);
  }
  
  async updatePermission(id: number, permission: Partial<Permission>): Promise<Permission | undefined> {
    return this.dbStorage.updatePermission(id, permission);
  }
  
  async deletePermission(id: number): Promise<boolean> {
    return this.dbStorage.deletePermission(id);
  }
  
  // =========================================================================
  // Fallback implementations for other methods
  // =========================================================================
  
  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories);
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }
  
  async getCategory(id: string): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      return category;
    } catch (error) {
      console.error(`Failed to get category ${id}:`, error);
      return undefined;
    }
  }
  
  async getCategoryByCode(code: string): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.code, code));
      return category;
    } catch (error) {
      console.error(`Failed to get category by code ${code}:`, error);
      return undefined;
    }
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const [result] = await db.insert(categories).values(category).returning();
      return result;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw new Error('Failed to create category');
    }
  }
  
  async updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined> {
    try {
      const [result] = await db.update(categories)
        .set(category)
        .where(eq(categories.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update category ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteCategory(id: string): Promise<boolean> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete category ${id}:`, error);
      return false;
    }
  }
  
  // Items
  async getItems(): Promise<Item[]> {
    try {
      return await db.select().from(items);
    } catch (error) {
      console.error('Failed to get items:', error);
      return [];
    }
  }
  
  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    try {
      return await db.select().from(items).where(eq(items.categoryId, categoryId));
    } catch (error) {
      console.error(`Failed to get items by category ${categoryId}:`, error);
      return [];
    }
  }
  
  async getItem(id: string): Promise<Item | undefined> {
    try {
      const [item] = await db.select().from(items).where(eq(items.id, id));
      return item;
    } catch (error) {
      console.error(`Failed to get item ${id}:`, error);
      return undefined;
    }
  }
  
  async createItem(item: InsertItem): Promise<Item> {
    try {
      const [result] = await db.insert(items).values(item).returning();
      return result;
    } catch (error) {
      console.error('Failed to create item:', error);
      throw new Error('Failed to create item');
    }
  }
  
  async updateItem(id: string, item: Partial<Item>): Promise<Item | undefined> {
    try {
      const [result] = await db.update(items)
        .set(item)
        .where(eq(items.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update item ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteItem(id: string): Promise<boolean> {
    try {
      await db.delete(items).where(eq(items.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete item ${id}:`, error);
      return false;
    }
  }
  
  // Sections
  async getSections(): Promise<Section[]> {
    try {
      return await db.select().from(sections);
    } catch (error) {
      console.error('Failed to get sections:', error);
      return [];
    }
  }
  
  async getSection(id: string): Promise<Section | undefined> {
    try {
      const [section] = await db.select().from(sections).where(eq(sections.id, id));
      return section;
    } catch (error) {
      console.error(`Failed to get section ${id}:`, error);
      return undefined;
    }
  }
  
  async createSection(section: InsertSection): Promise<Section> {
    try {
      const [result] = await db.insert(sections).values(section).returning();
      return result;
    } catch (error) {
      console.error('Failed to create section:', error);
      throw new Error('Failed to create section');
    }
  }
  
  async updateSection(id: string, section: Partial<Section>): Promise<Section | undefined> {
    try {
      const [result] = await db.update(sections)
        .set(section)
        .where(eq(sections.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update section ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteSection(id: string): Promise<boolean> {
    try {
      await db.delete(sections).where(eq(sections.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete section ${id}:`, error);
      return false;
    }
  }
  
  // Machines
  async getMachines(): Promise<Machine[]> {
    try {
      return await db.select().from(machines);
    } catch (error) {
      console.error('Failed to get machines:', error);
      return [];
    }
  }
  
  async getMachinesBySection(sectionId: string): Promise<Machine[]> {
    try {
      return await db.select().from(machines).where(eq(machines.sectionId, sectionId));
    } catch (error) {
      console.error(`Failed to get machines by section ${sectionId}:`, error);
      return [];
    }
  }
  
  async getMachine(id: string): Promise<Machine | undefined> {
    try {
      const [machine] = await db.select().from(machines).where(eq(machines.id, id));
      return machine;
    } catch (error) {
      console.error(`Failed to get machine ${id}:`, error);
      return undefined;
    }
  }
  
  async createMachine(machine: InsertMachine): Promise<Machine> {
    try {
      const [result] = await db.insert(machines).values(machine).returning();
      return result;
    } catch (error) {
      console.error('Failed to create machine:', error);
      throw new Error('Failed to create machine');
    }
  }
  
  async updateMachine(id: string, machine: Partial<Machine>): Promise<Machine | undefined> {
    try {
      const [result] = await db.update(machines)
        .set(machine)
        .where(eq(machines.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update machine ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteMachine(id: string): Promise<boolean> {
    try {
      await db.delete(machines).where(eq(machines.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete machine ${id}:`, error);
      return false;
    }
  }
  
  // Master Batches
  async getMasterBatches(): Promise<MasterBatch[]> {
    try {
      return await db.select().from(masterBatches);
    } catch (error) {
      console.error('Failed to get master batches:', error);
      return [];
    }
  }
  
  async getMasterBatch(id: string): Promise<MasterBatch | undefined> {
    try {
      const [masterBatch] = await db.select().from(masterBatches).where(eq(masterBatches.id, id));
      return masterBatch;
    } catch (error) {
      console.error(`Failed to get master batch ${id}:`, error);
      return undefined;
    }
  }
  
  async createMasterBatch(masterBatch: InsertMasterBatch): Promise<MasterBatch> {
    try {
      const [result] = await db.insert(masterBatches).values(masterBatch).returning();
      return result;
    } catch (error) {
      console.error('Failed to create master batch:', error);
      throw new Error('Failed to create master batch');
    }
  }
  
  async updateMasterBatch(id: string, masterBatch: Partial<MasterBatch>): Promise<MasterBatch | undefined> {
    try {
      const [result] = await db.update(masterBatches)
        .set(masterBatch)
        .where(eq(masterBatches.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update master batch ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteMasterBatch(id: string): Promise<boolean> {
    try {
      await db.delete(masterBatches).where(eq(masterBatches.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete master batch ${id}:`, error);
      return false;
    }
  }
  
  // Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      return await db.select().from(customers);
    } catch (error) {
      console.error('Failed to get customers:', error);
      return [];
    }
  }
  
  async getCustomer(id: string): Promise<Customer | undefined> {
    try {
      const [customer] = await db.select().from(customers).where(eq(customers.id, id));
      return customer;
    } catch (error) {
      console.error(`Failed to get customer ${id}:`, error);
      return undefined;
    }
  }
  
  async getCustomerByCode(code: string): Promise<Customer | undefined> {
    try {
      const [customer] = await db.select().from(customers).where(eq(customers.code, code));
      return customer;
    } catch (error) {
      console.error(`Failed to get customer by code ${code}:`, error);
      return undefined;
    }
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      const [result] = await db.insert(customers).values(customer).returning();
      return result;
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw new Error('Failed to create customer');
    }
  }
  
  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer | undefined> {
    try {
      const [result] = await db.update(customers)
        .set(customer)
        .where(eq(customers.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update customer ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await db.delete(customers).where(eq(customers.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete customer ${id}:`, error);
      return false;
    }
  }
  
  // Customer Products
  async getCustomerProducts(): Promise<CustomerProduct[]> {
    try {
      return await db.select().from(customerProducts);
    } catch (error) {
      console.error('Failed to get customer products:', error);
      return [];
    }
  }
  
  async getCustomerProductsByCustomer(customerId: string): Promise<CustomerProduct[]> {
    try {
      return await db.select().from(customerProducts).where(eq(customerProducts.customerId, customerId));
    } catch (error) {
      console.error(`Failed to get customer products by customer ${customerId}:`, error);
      return [];
    }
  }
  
  async getCustomerProduct(id: number): Promise<CustomerProduct | undefined> {
    try {
      const [customerProduct] = await db.select().from(customerProducts).where(eq(customerProducts.id, id));
      return customerProduct;
    } catch (error) {
      console.error(`Failed to get customer product ${id}:`, error);
      return undefined;
    }
  }
  
  async createCustomerProduct(customerProduct: InsertCustomerProduct): Promise<CustomerProduct> {
    try {
      const [result] = await db.insert(customerProducts).values(customerProduct).returning();
      return result;
    } catch (error) {
      console.error('Failed to create customer product:', error);
      throw new Error('Failed to create customer product');
    }
  }
  
  async updateCustomerProduct(id: number, customerProduct: Partial<CustomerProduct>): Promise<CustomerProduct | undefined> {
    try {
      const [result] = await db.update(customerProducts)
        .set(customerProduct)
        .where(eq(customerProducts.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update customer product ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteCustomerProduct(id: number): Promise<boolean> {
    try {
      await db.delete(customerProducts).where(eq(customerProducts.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete customer product ${id}:`, error);
      return false;
    }
  }
  
  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      return await db.select().from(orders);
    } catch (error) {
      console.error('Failed to get orders:', error);
      return [];
    }
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      return order;
    } catch (error) {
      console.error(`Failed to get order ${id}:`, error);
      return undefined;
    }
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const [result] = await db.insert(orders).values({
        ...order,
        date: new Date(),
        status: 'pending'
      }).returning();
      return result;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw new Error('Failed to create order');
    }
  }
  
  async updateOrder(id: number, order: Partial<Order>): Promise<Order | undefined> {
    try {
      const [result] = await db.update(orders)
        .set(order)
        .where(eq(orders.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update order ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    try {
      // First, we need to find all job orders related to this order
      const relatedJobOrders = await db.select().from(jobOrders).where(eq(jobOrders.orderId, id));
      
      if (relatedJobOrders.length > 0) {
        console.log(`Found ${relatedJobOrders.length} job orders related to order #${id}`);
        
        // Get all job order IDs
        const jobOrderIds = relatedJobOrders.map(jo => jo.id);
        
        // Find related rolls by job orders
        const relatedRolls = await db.select({id: rolls.id}).from(rolls)
          .where(or(...jobOrderIds.map(joId => eq(rolls.jobOrderId, joId))));
        
        if (relatedRolls.length > 0) {
          console.log(`Found ${relatedRolls.length} rolls related to job orders of order #${id}`);
          const rollIds = relatedRolls.map(r => r.id);
          
          // Delete quality checks related to these rolls (including corrective actions due to cascade)
          if (rollIds.length > 0) {
            try {
              for (const rollId of rollIds) {
                await db.delete(qualityChecks).where(eq(qualityChecks.rollId, rollId));
              }
              console.log(`Deleted quality checks related to rolls of order #${id}`);
            } catch (error) {
              console.error(`Error deleting quality checks for order #${id}:`, error);
            }
            
            // Delete the rolls
            try {
              for (const jobOrderId of jobOrderIds) {
                await db.delete(rolls).where(eq(rolls.jobOrderId, jobOrderId));
              }
              console.log(`Deleted rolls related to job orders of order #${id}`);
            } catch (error) {
              console.error(`Error deleting rolls for order #${id}:`, error);
            }
          }
        }
        
        // Delete final products related to these job orders
        try {
          for (const jobOrderId of jobOrderIds) {
            await db.delete(finalProducts).where(eq(finalProducts.jobOrderId, jobOrderId));
          }
          console.log(`Deleted final products related to job orders of order #${id}`);
        } catch (error) {
          console.error(`Error deleting final products for order #${id}:`, error);
        }
        
        // Use direct SQL to delete SMS messages first before attempting 
        // other deletions to avoid foreign key constraint issues
        try {
          // Check if SMS messages table exists
          const smsTableExists = await checkTableExists('sms_messages');
          if (smsTableExists) {
            // Use direct SQL with no parameters to avoid issues
            if (jobOrderIds.length > 0) {
              // Delete SMS messages related to job orders
              await db.execute(`DELETE FROM sms_messages WHERE job_order_id IN (${jobOrderIds.join(',')})`);
            }
            // Delete SMS messages related directly to the order
            await db.execute(`DELETE FROM sms_messages WHERE order_id = ${id}`);
            console.log(`Deleted SMS messages related to order #${id} and its job orders`);
          } else {
            console.log(`SMS messages table doesn't exist yet, skipping SMS deletion for order #${id}`);
          }
        } catch (error: any) {
          console.error(`Error deleting SMS messages for order #${id}:`, error);
          // Since SMS message deletion is critical for order deletion due to foreign key constraints,
          // we should return false if we can't delete them
          return false;
        }
        
        // Delete quality checks related to job orders
        try {
          for (const jobOrderId of jobOrderIds) {
            await db.delete(qualityChecks).where(eq(qualityChecks.jobOrderId, jobOrderId));
          }
          console.log(`Deleted quality checks related to job orders of order #${id}`);
        } catch (error) {
          console.error(`Error deleting quality checks for job orders of order #${id}:`, error);
        }
        
        // Delete all related job orders
        try {
          await db.delete(jobOrders).where(eq(jobOrders.orderId, id));
          console.log(`Deleted job orders related to order #${id}`);
        } catch (error) {
          console.error(`Error deleting job orders for order #${id}:`, error);
          return false;
        }
      }
      
      // Finally, delete the order itself
      await db.delete(orders).where(eq(orders.id, id));
      console.log(`Successfully deleted order #${id} and all related data`);
      return true;
    } catch (error) {
      console.error(`Failed to delete order ${id}:`, error);
      return false;
    }
  }
  
  // Job Orders
  async getJobOrders(): Promise<JobOrder[]> {
    try {
      return await db.select().from(jobOrders);
    } catch (error) {
      console.error('Failed to get job orders:', error);
      return [];
    }
  }
  
  async getJobOrdersByOrder(orderId: number): Promise<JobOrder[]> {
    try {
      return await db.select().from(jobOrders).where(eq(jobOrders.orderId, orderId));
    } catch (error) {
      console.error(`Failed to get job orders by order ${orderId}:`, error);
      return [];
    }
  }
  
  async getJobOrder(id: number): Promise<JobOrder | undefined> {
    try {
      const [jobOrder] = await db.select().from(jobOrders).where(eq(jobOrders.id, id));
      return jobOrder;
    } catch (error) {
      console.error(`Failed to get job order ${id}:`, error);
      return undefined;
    }
  }
  
  async createJobOrder(jobOrder: InsertJobOrder): Promise<JobOrder> {
    try {
      const [result] = await db.insert(jobOrders).values(jobOrder).returning();
      return result;
    } catch (error) {
      console.error('Failed to create job order:', error);
      throw new Error('Failed to create job order');
    }
  }
  
  async updateJobOrder(id: number, jobOrder: Partial<JobOrder>): Promise<JobOrder | undefined> {
    try {
      const [result] = await db.update(jobOrders)
        .set(jobOrder)
        .where(eq(jobOrders.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update job order ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteJobOrder(id: number): Promise<boolean> {
    try {
      await db.delete(jobOrders).where(eq(jobOrders.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete job order ${id}:`, error);
      return false;
    }
  }
  
  // Rolls
  async getRolls(): Promise<Roll[]> {
    try {
      return await db.select().from(rolls);
    } catch (error) {
      console.error('Failed to get rolls:', error);
      return [];
    }
  }
  
  async getRollsByJobOrder(jobOrderId: number): Promise<Roll[]> {
    try {
      return await db.select().from(rolls).where(eq(rolls.jobOrderId, jobOrderId));
    } catch (error) {
      console.error(`Failed to get rolls by job order ${jobOrderId}:`, error);
      return [];
    }
  }
  
  async getRollsByStage(stage: string): Promise<Roll[]> {
    try {
      return await db.select().from(rolls).where(eq(rolls.currentStage, stage));
    } catch (error) {
      console.error(`Failed to get rolls by stage ${stage}:`, error);
      return [];
    }
  }
  
  async getRoll(id: string): Promise<Roll | undefined> {
    try {
      const [roll] = await db.select().from(rolls).where(eq(rolls.id, id));
      return roll;
    } catch (error) {
      console.error(`Failed to get roll ${id}:`, error);
      return undefined;
    }
  }
  
  async createRoll(roll: InsertRoll): Promise<Roll> {
    try {
      const [result] = await db.insert(rolls).values(roll).returning();
      return result;
    } catch (error) {
      console.error('Failed to create roll:', error);
      throw new Error('Failed to create roll');
    }
  }
  
  async updateRoll(id: string, roll: Partial<Roll>): Promise<Roll | undefined> {
    try {
      const [result] = await db.update(rolls)
        .set(roll)
        .where(eq(rolls.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update roll ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteRoll(id: string): Promise<boolean> {
    try {
      await db.delete(rolls).where(eq(rolls.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete roll ${id}:`, error);
      return false;
    }
  }
  
  // Raw Materials
  async getRawMaterials(): Promise<RawMaterial[]> {
    try {
      return await db.select().from(rawMaterials);
    } catch (error) {
      console.error('Failed to get raw materials:', error);
      return [];
    }
  }
  
  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    try {
      const [rawMaterial] = await db.select().from(rawMaterials).where(eq(rawMaterials.id, id));
      return rawMaterial;
    } catch (error) {
      console.error(`Failed to get raw material ${id}:`, error);
      return undefined;
    }
  }
  
  async createRawMaterial(rawMaterial: InsertRawMaterial): Promise<RawMaterial> {
    try {
      const [result] = await db.insert(rawMaterials).values({
        ...rawMaterial,
        lastUpdated: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error('Failed to create raw material:', error);
      throw new Error('Failed to create raw material');
    }
  }
  
  async updateRawMaterial(id: number, rawMaterial: Partial<RawMaterial>): Promise<RawMaterial | undefined> {
    try {
      const [result] = await db.update(rawMaterials)
        .set({
          ...rawMaterial,
          lastUpdated: new Date()
        })
        .where(eq(rawMaterials.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update raw material ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteRawMaterial(id: number): Promise<boolean> {
    try {
      await db.delete(rawMaterials).where(eq(rawMaterials.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete raw material ${id}:`, error);
      return false;
    }
  }
  
  // Final Products
  async getFinalProducts(): Promise<FinalProduct[]> {
    try {
      return await db.select().from(finalProducts);
    } catch (error) {
      console.error('Failed to get final products:', error);
      return [];
    }
  }
  
  async getFinalProduct(id: number): Promise<FinalProduct | undefined> {
    try {
      const [finalProduct] = await db.select().from(finalProducts).where(eq(finalProducts.id, id));
      return finalProduct;
    } catch (error) {
      console.error(`Failed to get final product ${id}:`, error);
      return undefined;
    }
  }
  
  async createFinalProduct(finalProduct: InsertFinalProduct): Promise<FinalProduct> {
    try {
      const [result] = await db.insert(finalProducts).values({
        ...finalProduct,
        completedDate: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error('Failed to create final product:', error);
      throw new Error('Failed to create final product');
    }
  }
  
  async updateFinalProduct(id: number, finalProduct: Partial<FinalProduct>): Promise<FinalProduct | undefined> {
    try {
      const [result] = await db.update(finalProducts)
        .set(finalProduct)
        .where(eq(finalProducts.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update final product ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteFinalProduct(id: number): Promise<boolean> {
    try {
      await db.delete(finalProducts).where(eq(finalProducts.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete final product ${id}:`, error);
      return false;
    }
  }
  
  // Quality Check Types
  async getQualityCheckTypes(): Promise<QualityCheckType[]> {
    try {
      return await db.select().from(qualityCheckTypes);
    } catch (error) {
      console.error('Failed to get quality check types:', error);
      return [];
    }
  }
  
  async getQualityCheckTypesByStage(stage: string): Promise<QualityCheckType[]> {
    try {
      return await db.select().from(qualityCheckTypes).where(eq(qualityCheckTypes.targetStage, stage));
    } catch (error) {
      console.error(`Failed to get quality check types by stage ${stage}:`, error);
      return [];
    }
  }
  
  async getQualityCheckType(id: string): Promise<QualityCheckType | undefined> {
    try {
      const [qualityCheckType] = await db.select().from(qualityCheckTypes).where(eq(qualityCheckTypes.id, id));
      return qualityCheckType;
    } catch (error) {
      console.error(`Failed to get quality check type ${id}:`, error);
      return undefined;
    }
  }
  
  async createQualityCheckType(qualityCheckType: InsertQualityCheckType): Promise<QualityCheckType> {
    try {
      const [result] = await db.insert(qualityCheckTypes).values(qualityCheckType).returning();
      return result;
    } catch (error) {
      console.error('Failed to create quality check type:', error);
      throw new Error('Failed to create quality check type');
    }
  }
  
  async updateQualityCheckType(id: string, qualityCheckType: Partial<QualityCheckType>): Promise<QualityCheckType | undefined> {
    try {
      const [result] = await db.update(qualityCheckTypes)
        .set(qualityCheckType)
        .where(eq(qualityCheckTypes.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update quality check type ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteQualityCheckType(id: string): Promise<boolean> {
    try {
      await db.delete(qualityCheckTypes).where(eq(qualityCheckTypes.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete quality check type ${id}:`, error);
      return false;
    }
  }
  
  // Quality Checks
  async getQualityChecks(): Promise<QualityCheck[]> {
    try {
      return await db.select().from(qualityChecks);
    } catch (error) {
      console.error('Failed to get quality checks:', error);
      return [];
    }
  }
  
  async getQualityChecksByRoll(rollId: string): Promise<QualityCheck[]> {
    try {
      return await db.select().from(qualityChecks).where(eq(qualityChecks.rollId, rollId));
    } catch (error) {
      console.error(`Failed to get quality checks by roll ${rollId}:`, error);
      return [];
    }
  }
  
  async getQualityChecksByJobOrder(jobOrderId: number): Promise<QualityCheck[]> {
    try {
      return await db.select().from(qualityChecks).where(eq(qualityChecks.jobOrderId, jobOrderId));
    } catch (error) {
      console.error(`Failed to get quality checks by job order ${jobOrderId}:`, error);
      return [];
    }
  }
  
  async getQualityCheck(id: number): Promise<QualityCheck | undefined> {
    try {
      const [qualityCheck] = await db.select().from(qualityChecks).where(eq(qualityChecks.id, id));
      return qualityCheck;
    } catch (error) {
      console.error(`Failed to get quality check ${id}:`, error);
      return undefined;
    }
  }
  
  async createQualityCheck(qualityCheck: InsertQualityCheck): Promise<QualityCheck> {
    try {
      const [result] = await db.insert(qualityChecks).values({
        ...qualityCheck,
        timestamp: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error('Failed to create quality check:', error);
      throw new Error('Failed to create quality check');
    }
  }
  
  async updateQualityCheck(id: number, qualityCheck: Partial<QualityCheck>): Promise<QualityCheck | undefined> {
    try {
      const [result] = await db.update(qualityChecks)
        .set(qualityCheck)
        .where(eq(qualityChecks.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update quality check ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteQualityCheck(id: number): Promise<boolean> {
    try {
      await db.delete(qualityChecks).where(eq(qualityChecks.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete quality check ${id}:`, error);
      return false;
    }
  }
  
  // Corrective Actions
  async getCorrectiveActions(): Promise<CorrectiveAction[]> {
    try {
      return await db.select().from(correctiveActions);
    } catch (error) {
      console.error('Failed to get corrective actions:', error);
      return [];
    }
  }
  
  async getCorrectiveActionsByQualityCheck(qualityCheckId: number): Promise<CorrectiveAction[]> {
    try {
      return await db.select().from(correctiveActions).where(eq(correctiveActions.qualityCheckId, qualityCheckId));
    } catch (error) {
      console.error(`Failed to get corrective actions by quality check ${qualityCheckId}:`, error);
      return [];
    }
  }
  
  async getCorrectiveAction(id: number): Promise<CorrectiveAction | undefined> {
    try {
      const [correctiveAction] = await db.select().from(correctiveActions).where(eq(correctiveActions.id, id));
      return correctiveAction;
    } catch (error) {
      console.error(`Failed to get corrective action ${id}:`, error);
      return undefined;
    }
  }
  
  async createCorrectiveAction(correctiveAction: InsertCorrectiveAction): Promise<CorrectiveAction> {
    try {
      const [result] = await db.insert(correctiveActions).values(correctiveAction).returning();
      return result;
    } catch (error) {
      console.error('Failed to create corrective action:', error);
      throw new Error('Failed to create corrective action');
    }
  }
  
  async updateCorrectiveAction(id: number, correctiveAction: Partial<CorrectiveAction>): Promise<CorrectiveAction | undefined> {
    try {
      const [result] = await db.update(correctiveActions)
        .set(correctiveAction)
        .where(eq(correctiveActions.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update corrective action ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteCorrectiveAction(id: number): Promise<boolean> {
    try {
      await db.delete(correctiveActions).where(eq(correctiveActions.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete corrective action ${id}:`, error);
      return false;
    }
  }
  
  // SMS Messages
  async getSmsMessages(): Promise<SmsMessage[]> {
    try {
      return await db.select().from(smsMessages);
    } catch (error) {
      console.error('Failed to get SMS messages:', error);
      return [];
    }
  }
  
  async getSmsMessagesByOrder(orderId: number): Promise<SmsMessage[]> {
    try {
      return await db.select().from(smsMessages).where(eq(smsMessages.orderId, orderId));
    } catch (error) {
      console.error(`Failed to get SMS messages by order ${orderId}:`, error);
      return [];
    }
  }
  
  async getSmsMessagesByJobOrder(jobOrderId: number): Promise<SmsMessage[]> {
    try {
      return await db.select().from(smsMessages).where(eq(smsMessages.jobOrderId, jobOrderId));
    } catch (error) {
      console.error(`Failed to get SMS messages by job order ${jobOrderId}:`, error);
      return [];
    }
  }
  
  async getSmsMessagesByCustomer(customerId: string): Promise<SmsMessage[]> {
    try {
      return await db.select().from(smsMessages).where(eq(smsMessages.customerId, customerId));
    } catch (error) {
      console.error(`Failed to get SMS messages by customer ${customerId}:`, error);
      return [];
    }
  }
  
  async getSmsMessage(id: number): Promise<SmsMessage | undefined> {
    try {
      const [smsMessage] = await db.select().from(smsMessages).where(eq(smsMessages.id, id));
      return smsMessage;
    } catch (error) {
      console.error(`Failed to get SMS message ${id}:`, error);
      return undefined;
    }
  }
  
  async createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage> {
    try {
      const [result] = await db.insert(smsMessages).values({
        ...message,
        sentAt: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error('Failed to create SMS message:', error);
      throw new Error('Failed to create SMS message');
    }
  }
  
  async updateSmsMessage(id: number, message: Partial<SmsMessage>): Promise<SmsMessage | undefined> {
    try {
      const [result] = await db.update(smsMessages)
        .set(message)
        .where(eq(smsMessages.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update SMS message ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteSmsMessage(id: number): Promise<boolean> {
    try {
      await db.delete(smsMessages).where(eq(smsMessages.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete SMS message ${id}:`, error);
      return false;
    }
  }
  
  // Mix Materials
  async getMixMaterials(): Promise<MixMaterial[]> {
    try {
      return await db.select().from(mixMaterials);
    } catch (error) {
      console.error('Failed to get mix materials:', error);
      return [];
    }
  }
  
  async getMixMaterial(id: number): Promise<MixMaterial | undefined> {
    try {
      const [mixMaterial] = await db.select().from(mixMaterials).where(eq(mixMaterials.id, id));
      return mixMaterial;
    } catch (error) {
      console.error(`Failed to get mix material ${id}:`, error);
      return undefined;
    }
  }
  
  async createMixMaterial(mix: InsertMixMaterial): Promise<MixMaterial> {
    try {
      const [result] = await db.insert(mixMaterials).values({
        ...mix,
        mixDate: new Date(),
        totalQuantity: 0, // Will be updated as mix items are added
        createdAt: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error('Failed to create mix material:', error);
      throw new Error('Failed to create mix material');
    }
  }
  
  async updateMixMaterial(id: number, mix: Partial<MixMaterial>): Promise<MixMaterial | undefined> {
    try {
      const [result] = await db.update(mixMaterials)
        .set(mix)
        .where(eq(mixMaterials.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update mix material ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteMixMaterial(id: number): Promise<boolean> {
    try {
      await db.delete(mixMaterials).where(eq(mixMaterials.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete mix material ${id}:`, error);
      return false;
    }
  }
  
  // Mix Machines
  async getMixMachines(): Promise<MixMachine[]> {
    try {
      return await db.select().from(mixMachines);
    } catch (error) {
      console.error('Failed to get mix machines:', error);
      return [];
    }
  }
  
  async getMixMachinesByMixId(mixId: number): Promise<MixMachine[]> {
    try {
      return await db.select().from(mixMachines).where(eq(mixMachines.mixId, mixId));
    } catch (error) {
      console.error(`Failed to get mix machines by mix ID ${mixId}:`, error);
      return [];
    }
  }
  
  async createMixMachine(mixMachine: InsertMixMachine): Promise<MixMachine> {
    try {
      const [result] = await db.insert(mixMachines).values(mixMachine).returning();
      return result;
    } catch (error) {
      console.error('Failed to create mix machine:', error);
      throw new Error('Failed to create mix machine');
    }
  }
  
  async deleteMixMachinesByMixId(mixId: number): Promise<boolean> {
    try {
      await db.delete(mixMachines).where(eq(mixMachines.mixId, mixId));
      return true;
    } catch (error) {
      console.error(`Failed to delete mix machines by mix ID ${mixId}:`, error);
      return false;
    }
  }
  
  // Mix Items
  async getMixItems(): Promise<MixItem[]> {
    try {
      return await db.select().from(mixItems);
    } catch (error) {
      console.error('Failed to get mix items:', error);
      return [];
    }
  }
  
  async getMixItemsByMix(mixId: number): Promise<MixItem[]> {
    try {
      return await db.select().from(mixItems).where(eq(mixItems.mixId, mixId));
    } catch (error) {
      console.error(`Failed to get mix items by mix ID ${mixId}:`, error);
      return [];
    }
  }
  
  async getMixItem(id: number): Promise<MixItem | undefined> {
    try {
      const [mixItem] = await db.select().from(mixItems).where(eq(mixItems.id, id));
      return mixItem;
    } catch (error) {
      console.error(`Failed to get mix item ${id}:`, error);
      return undefined;
    }
  }
  
  async createMixItem(mixItem: InsertMixItem): Promise<MixItem> {
    try {
      const [result] = await db.insert(mixItems).values(mixItem).returning();
      
      // Update the total quantity in the mix material
      const mix = await this.getMixMaterial(mixItem.mixId);
      if (mix) {
        const currentTotal = mix.totalQuantity || 0;
        await this.updateMixMaterial(mix.id, {
          totalQuantity: currentTotal + mixItem.quantity
        });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to create mix item:', error);
      throw new Error('Failed to create mix item');
    }
  }
  
  async updateMixItem(id: number, mixItem: Partial<MixItem>): Promise<MixItem | undefined> {
    try {
      // If quantity is changing, need to update the mix total
      if (mixItem.quantity !== undefined) {
        const currentItem = await this.getMixItem(id);
        if (currentItem) {
          const mix = await this.getMixMaterial(currentItem.mixId);
          if (mix && mix.totalQuantity !== null) {
            const currentTotal = mix.totalQuantity;
            const difference = mixItem.quantity - currentItem.quantity;
            await this.updateMixMaterial(mix.id, {
              totalQuantity: currentTotal + difference
            });
          }
        }
      }
      
      const [result] = await db.update(mixItems)
        .set(mixItem)
        .where(eq(mixItems.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Failed to update mix item ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteMixItem(id: number): Promise<boolean> {
    try {
      // Need to update the mix total by subtracting this item's quantity
      const item = await this.getMixItem(id);
      if (item) {
        const mix = await this.getMixMaterial(item.mixId);
        if (mix && mix.totalQuantity !== null) {
          const currentTotal = mix.totalQuantity;
          await this.updateMixMaterial(mix.id, {
            totalQuantity: currentTotal - item.quantity
          });
        }
      }
      
      await db.delete(mixItems).where(eq(mixItems.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete mix item ${id}:`, error);
      return false;
    }
  }
  
  // Material Inputs - stub implementations
  async getMaterialInputs(): Promise<MaterialInput[]> {
    console.warn('getMaterialInputs not fully implemented');
    return [];
  }
  
  async getMaterialInput(id: number): Promise<MaterialInput | undefined> {
    console.warn('getMaterialInput not fully implemented');
    return undefined;
  }
  
  async createMaterialInput(materialInput: InsertMaterialInput): Promise<MaterialInput> {
    console.warn('createMaterialInput not fully implemented');
    throw new Error('Method not implemented');
  }
  
  async updateMaterialInput(id: number, materialInput: Partial<MaterialInput>): Promise<MaterialInput | undefined> {
    console.warn('updateMaterialInput not fully implemented');
    return undefined;
  }
  
  async deleteMaterialInput(id: number): Promise<boolean> {
    console.warn('deleteMaterialInput not fully implemented');
    return false;
  }
  
  // Material Input Items - stub implementations
  async getMaterialInputItems(): Promise<MaterialInputItem[]> {
    console.warn('getMaterialInputItems not fully implemented');
    return [];
  }
  
  async getMaterialInputItemsByInput(inputId: number): Promise<MaterialInputItem[]> {
    console.warn('getMaterialInputItemsByInput not fully implemented');
    return [];
  }
  
  async getMaterialInputItem(id: number): Promise<MaterialInputItem | undefined> {
    console.warn('getMaterialInputItem not fully implemented');
    return undefined;
  }
  
  async createMaterialInputItem(item: InsertMaterialInputItem): Promise<MaterialInputItem> {
    console.warn('createMaterialInputItem not fully implemented');
    throw new Error('Method not implemented');
  }
  
  async deleteMaterialInputItem(id: number): Promise<boolean> {
    console.warn('deleteMaterialInputItem not fully implemented');
    return false;
  }
  
  // Plate Pricing Parameters
  async getPlatePricingParameters(): Promise<PlatePricingParameter[]> {
    try {
      const result = await db.select().from(platePricingParameters);
      return result;
    } catch (error) {
      console.error('Error in getPlatePricingParameters:', error);
      return [];
    }
  }
  
  async getPlatePricingParameterByType(type: string): Promise<PlatePricingParameter | undefined> {
    try {
      const result = await db.select().from(platePricingParameters)
        .where(eq(platePricingParameters.type, type))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error in getPlatePricingParameterByType:', error);
      return undefined;
    }
  }
  
  async getPlatePricingParameter(id: number): Promise<PlatePricingParameter | undefined> {
    try {
      const result = await db.select().from(platePricingParameters)
        .where(eq(platePricingParameters.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error in getPlatePricingParameter:', error);
      return undefined;
    }
  }
  
  async createPlatePricingParameter(param: InsertPlatePricingParameter): Promise<PlatePricingParameter> {
    try {
      const result = await db.insert(platePricingParameters).values(param).returning();
      return result[0];
    } catch (error) {
      console.error('Error in createPlatePricingParameter:', error);
      throw new Error('Failed to create pricing parameter: ' + (error as Error).message);
    }
  }
  
  async updatePlatePricingParameter(id: number, update: Partial<PlatePricingParameter>): Promise<PlatePricingParameter | undefined> {
    try {
      const result = await db.update(platePricingParameters)
        .set(update)
        .where(eq(platePricingParameters.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error in updatePlatePricingParameter:', error);
      return undefined;
    }
  }
  
  async deletePlatePricingParameter(id: number): Promise<boolean> {
    try {
      const result = await db.delete(platePricingParameters)
        .where(eq(platePricingParameters.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in deletePlatePricingParameter:', error);
      return false;
    }
  }
  
  // Plate Calculations - stub implementations
  async getPlateCalculations(): Promise<PlateCalculation[]> {
    console.warn('getPlateCalculations not fully implemented');
    return [];
  }
  
  async getPlateCalculationsByCustomer(customerId: string): Promise<PlateCalculation[]> {
    console.warn('getPlateCalculationsByCustomer not fully implemented');
    return [];
  }
  
  async getPlateCalculation(id: number): Promise<PlateCalculation | undefined> {
    console.warn('getPlateCalculation not fully implemented');
    return undefined;
  }
  
  async createPlateCalculation(calculation: InsertPlateCalculation): Promise<PlateCalculation> {
    console.warn('createPlateCalculation not fully implemented');
    throw new Error('Method not implemented');
  }
  
  async updatePlateCalculation(id: number, update: Partial<PlateCalculation>): Promise<PlateCalculation | undefined> {
    console.warn('updatePlateCalculation not fully implemented');
    return undefined;
  }
  
  async deletePlateCalculation(id: number): Promise<boolean> {
    console.warn('deletePlateCalculation not fully implemented');
    return false;
  }
  
  // ABA Material Configurations
  async getAbaMaterialConfigs(): Promise<AbaMaterialConfig[]> {
    try {
      return await db.select().from(abaMaterialConfigs);
    } catch (error) {
      console.error('Failed to get ABA material configs:', error);
      return [];
    }
  }
  
  async getAbaMaterialConfigsByUser(createdBy: string): Promise<AbaMaterialConfig[]> {
    try {
      return await db.select().from(abaMaterialConfigs).where(eq(abaMaterialConfigs.createdBy, createdBy));
    } catch (error) {
      console.error(`Failed to get ABA material configs for user ${createdBy}:`, error);
      return [];
    }
  }
  
  async getAbaMaterialConfig(id: number): Promise<AbaMaterialConfig | undefined> {
    try {
      const [config] = await db.select().from(abaMaterialConfigs).where(eq(abaMaterialConfigs.id, id));
      return config;
    } catch (error) {
      console.error(`Failed to get ABA material config ${id}:`, error);
      return undefined;
    }
  }
  
  async getDefaultAbaMaterialConfig(): Promise<AbaMaterialConfig | undefined> {
    try {
      const [config] = await db.select().from(abaMaterialConfigs).where(eq(abaMaterialConfigs.isDefault, true));
      return config;
    } catch (error) {
      console.error('Failed to get default ABA material config:', error);
      return undefined;
    }
  }
  
  async createAbaMaterialConfig(config: InsertAbaMaterialConfig): Promise<AbaMaterialConfig> {
    try {
      // If this is the first config or marked as default, ensure it's set as default
      const existingConfigs = await this.getAbaMaterialConfigs();
      
      if (existingConfigs.length === 0 || config.isDefault) {
        // If this is marked as default, unset any other defaults
        if (existingConfigs.length > 0 && config.isDefault) {
          await db.update(abaMaterialConfigs)
            .set({ isDefault: false })
            .where(eq(abaMaterialConfigs.isDefault, true));
        }
        
        // For the first config, always set as default
        if (existingConfigs.length === 0) {
          config.isDefault = true;
        }
      }
      
      const [result] = await db.insert(abaMaterialConfigs)
        .values(config)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Failed to create ABA material config:', error);
      throw new Error('Failed to create ABA material config');
    }
  }
  
  async updateAbaMaterialConfig(id: number, update: Partial<AbaMaterialConfig>): Promise<AbaMaterialConfig | undefined> {
    try {
      // If this is being set as default, unset any other defaults
      if (update.isDefault) {
        await db.update(abaMaterialConfigs)
          .set({ isDefault: false })
          .where(and(
            eq(abaMaterialConfigs.isDefault, true),
            ne(abaMaterialConfigs.id, id)
          ));
      }
      
      const [result] = await db.update(abaMaterialConfigs)
        .set(update)
        .where(eq(abaMaterialConfigs.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Failed to update ABA material config ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteAbaMaterialConfig(id: number): Promise<boolean> {
    try {
      // Check if this is the default config
      const [config] = await db.select().from(abaMaterialConfigs).where(eq(abaMaterialConfigs.id, id));
      
      if (config && config.isDefault) {
        // If we're deleting the default, find another config to make default
        const [anotherConfig] = await db.select()
          .from(abaMaterialConfigs)
          .where(eq(abaMaterialConfigs.isDefault, false))
          .limit(1);
        
        if (anotherConfig) {
          await db.update(abaMaterialConfigs)
            .set({ isDefault: true })
            .where(eq(abaMaterialConfigs.id, anotherConfig.id));
        }
      }
      
      await db.delete(abaMaterialConfigs).where(eq(abaMaterialConfigs.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete ABA material config ${id}:`, error);
      return false;
    }
  }
  
  async setDefaultAbaMaterialConfig(id: number): Promise<boolean> {
    try {
      // First, unset any current defaults
      await db.update(abaMaterialConfigs)
        .set({ isDefault: false })
        .where(eq(abaMaterialConfigs.isDefault, true));
      
      // Then set the new default
      const [result] = await db.update(abaMaterialConfigs)
        .set({ isDefault: true })
        .where(eq(abaMaterialConfigs.id, id))
        .returning();
      
      return !!result;
    } catch (error) {
      console.error(`Failed to set ABA material config ${id} as default:`, error);
      return false;
    }
  }
}