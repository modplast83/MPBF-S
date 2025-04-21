import { IStorage } from './storage';
import { db } from './db';
import { eq, and } from 'drizzle-orm';
import {
  User, InsertUser, users,
  Customer, InsertCustomer, customers,
  Category, InsertCategory, categories,
  Item, InsertItem, items,
  Section, InsertSection, sections,
  Machine, InsertMachine, machines,
  MasterBatch, InsertMasterBatch, masterBatches,
  CustomerProduct, InsertCustomerProduct, customerProducts,
  Order, InsertOrder, orders,
  JobOrder, InsertJobOrder, jobOrders,
  Roll, InsertRoll, rolls,
  RawMaterial, InsertRawMaterial, rawMaterials,
  FinalProduct, InsertFinalProduct, finalProducts,
  QualityCheckType, InsertQualityCheckType, qualityCheckTypes,
  QualityCheck, InsertQualityCheck, qualityChecks,
  CorrectiveAction, InsertCorrectiveAction, correctiveActions,
  SmsMessage, InsertSmsMessage, smsMessages,
  MixMaterial, InsertMixMaterial, mixMaterials,
  MixItem, InsertMixItem, mixItems,
  MixMachine, InsertMixMachine, mixMachines
} from '@shared/schema';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db';

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'session', // Default table name is "session"
      createTableIfMissing: true
    });
  }
  // User management
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Generate a new ID for the user
    const id = `U${(await this.getUsers()).length + 1}`.padStart(4, "0");
    const newUser = { ...user, id };
    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async getCategoryByCode(code: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.code, code));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: string, categoryUpdate: Partial<Category>): Promise<Category | undefined> {
    const result = await db.update(categories)
      .set(categoryUpdate)
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Items
  async getItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.categoryId, categoryId));
  }

  async getItem(id: string): Promise<Item | undefined> {
    const result = await db.select().from(items).where(eq(items.id, id));
    return result[0];
  }

  async createItem(item: InsertItem): Promise<Item> {
    const result = await db.insert(items).values(item).returning();
    return result[0];
  }

  async updateItem(id: string, itemUpdate: Partial<Item>): Promise<Item | undefined> {
    const result = await db.update(items)
      .set(itemUpdate)
      .where(eq(items.id, id))
      .returning();
    return result[0];
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id)).returning();
    return result.length > 0;
  }

  // Sections
  async getSections(): Promise<Section[]> {
    return await db.select().from(sections);
  }

  async getSection(id: string): Promise<Section | undefined> {
    const result = await db.select().from(sections).where(eq(sections.id, id));
    return result[0];
  }

  async createSection(section: InsertSection): Promise<Section> {
    const result = await db.insert(sections).values(section).returning();
    return result[0];
  }

  async updateSection(id: string, sectionUpdate: Partial<Section>): Promise<Section | undefined> {
    const result = await db.update(sections)
      .set(sectionUpdate)
      .where(eq(sections.id, id))
      .returning();
    return result[0];
  }

  async deleteSection(id: string): Promise<boolean> {
    const result = await db.delete(sections).where(eq(sections.id, id)).returning();
    return result.length > 0;
  }

  // Machines
  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines);
  }

  async getMachinesBySection(sectionId: string): Promise<Machine[]> {
    return await db.select().from(machines).where(eq(machines.sectionId, sectionId));
  }

  async getMachine(id: string): Promise<Machine | undefined> {
    const result = await db.select().from(machines).where(eq(machines.id, id));
    return result[0];
  }

  async createMachine(machine: InsertMachine): Promise<Machine> {
    const result = await db.insert(machines).values(machine).returning();
    return result[0];
  }

  async updateMachine(id: string, machineUpdate: Partial<Machine>): Promise<Machine | undefined> {
    const result = await db.update(machines)
      .set(machineUpdate)
      .where(eq(machines.id, id))
      .returning();
    return result[0];
  }

  async deleteMachine(id: string): Promise<boolean> {
    const result = await db.delete(machines).where(eq(machines.id, id)).returning();
    return result.length > 0;
  }

  // Master Batches
  async getMasterBatches(): Promise<MasterBatch[]> {
    return await db.select().from(masterBatches);
  }

  async getMasterBatch(id: string): Promise<MasterBatch | undefined> {
    const result = await db.select().from(masterBatches).where(eq(masterBatches.id, id));
    return result[0];
  }

  async createMasterBatch(masterBatch: InsertMasterBatch): Promise<MasterBatch> {
    const result = await db.insert(masterBatches).values(masterBatch).returning();
    return result[0];
  }

  async updateMasterBatch(id: string, masterBatchUpdate: Partial<MasterBatch>): Promise<MasterBatch | undefined> {
    const result = await db.update(masterBatches)
      .set(masterBatchUpdate)
      .where(eq(masterBatches.id, id))
      .returning();
    return result[0];
  }

  async deleteMasterBatch(id: string): Promise<boolean> {
    const result = await db.delete(masterBatches).where(eq(masterBatches.id, id)).returning();
    return result.length > 0;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async getCustomerByCode(code: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.code, code));
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(id: string, customerUpdate: Partial<Customer>): Promise<Customer | undefined> {
    const result = await db.update(customers)
      .set(customerUpdate)
      .where(eq(customers.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  // Customer Products
  async getCustomerProducts(): Promise<CustomerProduct[]> {
    return await db.select().from(customerProducts);
  }

  async getCustomerProductsByCustomer(customerId: string): Promise<CustomerProduct[]> {
    return await db.select().from(customerProducts).where(eq(customerProducts.customerId, customerId));
  }

  async getCustomerProduct(id: number): Promise<CustomerProduct | undefined> {
    const result = await db.select().from(customerProducts).where(eq(customerProducts.id, id));
    return result[0];
  }

  async createCustomerProduct(customerProduct: InsertCustomerProduct): Promise<CustomerProduct> {
    const result = await db.insert(customerProducts).values(customerProduct).returning();
    return result[0];
  }

  async updateCustomerProduct(id: number, customerProductUpdate: Partial<CustomerProduct>): Promise<CustomerProduct | undefined> {
    const result = await db.update(customerProducts)
      .set(customerProductUpdate)
      .where(eq(customerProducts.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomerProduct(id: number): Promise<boolean> {
    const result = await db.delete(customerProducts).where(eq(customerProducts.id, id)).returning();
    return result.length > 0;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrder(id: number, orderUpdate: Partial<Order>): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set(orderUpdate)
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async deleteOrder(id: number): Promise<boolean> {
    // Get all job orders that will be deleted
    const jobOrdersToDelete = await this.getJobOrdersByOrder(id);
    console.log(`Found ${jobOrdersToDelete.length} job orders to delete for order ${id}`);
    
    // Delete all rolls for these job orders first if any
    for (const jobOrder of jobOrdersToDelete) {
      const rollsToDelete = await this.getRollsByJobOrder(jobOrder.id);
      console.log(`Found ${rollsToDelete.length} rolls to delete for job order ${jobOrder.id}`);
      
      for (const roll of rollsToDelete) {
        console.log(`Deleting roll ${roll.id}`);
        await db.delete(rolls).where(eq(rolls.id, roll.id));
      }
      
      // Now delete the job order
      console.log(`Deleting job order ${jobOrder.id}`);
      await db.delete(jobOrders).where(eq(jobOrders.id, jobOrder.id));
    }
    
    // Finally delete the order
    console.log(`Deleting order ${id}`);
    const result = await db.delete(orders).where(eq(orders.id, id)).returning();
    return result.length > 0;
  }

  // Job Orders
  async getJobOrders(): Promise<JobOrder[]> {
    return await db.select().from(jobOrders);
  }

  async getJobOrdersByOrder(orderId: number): Promise<JobOrder[]> {
    return await db.select().from(jobOrders).where(eq(jobOrders.orderId, orderId));
  }

  async getJobOrder(id: number): Promise<JobOrder | undefined> {
    const result = await db.select().from(jobOrders).where(eq(jobOrders.id, id));
    return result[0];
  }

  async createJobOrder(jobOrder: InsertJobOrder): Promise<JobOrder> {
    const result = await db.insert(jobOrders).values(jobOrder).returning();
    return result[0];
  }

  async updateJobOrder(id: number, jobOrderUpdate: Partial<JobOrder>): Promise<JobOrder | undefined> {
    const result = await db.update(jobOrders)
      .set(jobOrderUpdate)
      .where(eq(jobOrders.id, id))
      .returning();
    return result[0];
  }

  async deleteJobOrder(id: number): Promise<boolean> {
    // First delete any associated rolls
    const relatedRolls = await this.getRollsByJobOrder(id);
    console.log(`Found ${relatedRolls.length} rolls to delete for job order ${id}`);
    
    for (const roll of relatedRolls) {
      console.log(`Deleting roll ${roll.id}`);
      await db.delete(rolls).where(eq(rolls.id, roll.id));
    }
    
    // Now delete the job order
    console.log(`Deleting job order ${id}`);
    const result = await db.delete(jobOrders).where(eq(jobOrders.id, id)).returning();
    return result.length > 0;
  }

  // Rolls
  async getRolls(): Promise<Roll[]> {
    return await db.select().from(rolls);
  }

  async getRollsByJobOrder(jobOrderId: number): Promise<Roll[]> {
    return await db.select().from(rolls).where(eq(rolls.jobOrderId, jobOrderId));
  }

  async getRollsByStage(stage: string): Promise<Roll[]> {
    return await db.select().from(rolls).where(eq(rolls.currentStage, stage));
  }

  async getRoll(id: string): Promise<Roll | undefined> {
    const result = await db.select().from(rolls).where(eq(rolls.id, id));
    return result[0];
  }

  async createRoll(roll: InsertRoll): Promise<Roll> {
    const result = await db.insert(rolls).values(roll).returning();
    return result[0];
  }

  async updateRoll(id: string, rollUpdate: Partial<Roll>): Promise<Roll | undefined> {
    const result = await db.update(rolls)
      .set(rollUpdate)
      .where(eq(rolls.id, id))
      .returning();
    return result[0];
  }

  async deleteRoll(id: string): Promise<boolean> {
    const result = await db.delete(rolls).where(eq(rolls.id, id)).returning();
    return result.length > 0;
  }

  // Raw Materials
  async getRawMaterials(): Promise<RawMaterial[]> {
    return await db.select().from(rawMaterials);
  }

  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    const result = await db.select().from(rawMaterials).where(eq(rawMaterials.id, id));
    return result[0];
  }

  async createRawMaterial(rawMaterial: InsertRawMaterial): Promise<RawMaterial> {
    const result = await db.insert(rawMaterials).values(rawMaterial).returning();
    return result[0];
  }

  async updateRawMaterial(id: number, rawMaterialUpdate: Partial<RawMaterial>): Promise<RawMaterial | undefined> {
    const result = await db.update(rawMaterials)
      .set(rawMaterialUpdate)
      .where(eq(rawMaterials.id, id))
      .returning();
    return result[0];
  }

  async deleteRawMaterial(id: number): Promise<boolean> {
    const result = await db.delete(rawMaterials).where(eq(rawMaterials.id, id)).returning();
    return result.length > 0;
  }

  // Final Products
  async getFinalProducts(): Promise<FinalProduct[]> {
    return await db.select().from(finalProducts);
  }

  async getFinalProduct(id: number): Promise<FinalProduct | undefined> {
    const result = await db.select().from(finalProducts).where(eq(finalProducts.id, id));
    return result[0];
  }

  async createFinalProduct(finalProduct: InsertFinalProduct): Promise<FinalProduct> {
    const result = await db.insert(finalProducts).values(finalProduct).returning();
    return result[0];
  }

  async updateFinalProduct(id: number, finalProductUpdate: Partial<FinalProduct>): Promise<FinalProduct | undefined> {
    const result = await db.update(finalProducts)
      .set(finalProductUpdate)
      .where(eq(finalProducts.id, id))
      .returning();
    return result[0];
  }

  async deleteFinalProduct(id: number): Promise<boolean> {
    const result = await db.delete(finalProducts).where(eq(finalProducts.id, id)).returning();
    return result.length > 0;
  }

  // SMS Messages
  async getSmsMessages(): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages);
  }

  async getSmsMessagesByOrder(orderId: number): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages).where(eq(smsMessages.orderId, orderId));
  }

  async getSmsMessagesByJobOrder(jobOrderId: number): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages).where(eq(smsMessages.jobOrderId, jobOrderId));
  }

  async getSmsMessagesByCustomer(customerId: string): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages).where(eq(smsMessages.customerId, customerId));
  }

  async getSmsMessage(id: number): Promise<SmsMessage | undefined> {
    const result = await db.select().from(smsMessages).where(eq(smsMessages.id, id));
    return result[0];
  }

  async createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage> {
    const result = await db.insert(smsMessages).values(message).returning();
    return result[0];
  }

  async updateSmsMessage(id: number, messageUpdate: Partial<SmsMessage>): Promise<SmsMessage | undefined> {
    const result = await db.update(smsMessages)
      .set(messageUpdate)
      .where(eq(smsMessages.id, id))
      .returning();
    return result[0];
  }

  async deleteSmsMessage(id: number): Promise<boolean> {
    const result = await db.delete(smsMessages).where(eq(smsMessages.id, id)).returning();
    return result.length > 0;
  }

  // Quality Check Types
  async getQualityCheckTypes(): Promise<QualityCheckType[]> {
    return await db.select().from(qualityCheckTypes);
  }

  async getQualityCheckTypesByStage(stage: string): Promise<QualityCheckType[]> {
    return await db.select().from(qualityCheckTypes).where(eq(qualityCheckTypes.targetStage, stage));
  }

  async getQualityCheckType(id: string): Promise<QualityCheckType | undefined> {
    const result = await db.select().from(qualityCheckTypes).where(eq(qualityCheckTypes.id, id));
    return result[0];
  }

  async createQualityCheckType(qualityCheckType: InsertQualityCheckType): Promise<QualityCheckType> {
    const result = await db.insert(qualityCheckTypes).values(qualityCheckType).returning();
    return result[0];
  }

  async updateQualityCheckType(id: string, qualityCheckTypeUpdate: Partial<QualityCheckType>): Promise<QualityCheckType | undefined> {
    const result = await db.update(qualityCheckTypes)
      .set(qualityCheckTypeUpdate)
      .where(eq(qualityCheckTypes.id, id))
      .returning();
    return result[0];
  }

  async deleteQualityCheckType(id: string): Promise<boolean> {
    const result = await db.delete(qualityCheckTypes).where(eq(qualityCheckTypes.id, id)).returning();
    return result.length > 0;
  }

  // Quality Checks
  async getQualityChecks(): Promise<QualityCheck[]> {
    return await db.select().from(qualityChecks);
  }

  async getQualityChecksByRoll(rollId: string): Promise<QualityCheck[]> {
    return await db.select().from(qualityChecks).where(eq(qualityChecks.rollId, rollId));
  }

  async getQualityChecksByJobOrder(jobOrderId: number): Promise<QualityCheck[]> {
    return await db.select().from(qualityChecks).where(eq(qualityChecks.jobOrderId, jobOrderId));
  }

  async getQualityCheck(id: number): Promise<QualityCheck | undefined> {
    const result = await db.select().from(qualityChecks).where(eq(qualityChecks.id, id));
    return result[0];
  }

  async createQualityCheck(qualityCheck: InsertQualityCheck): Promise<QualityCheck> {
    const result = await db.insert(qualityChecks).values(qualityCheck).returning();
    return result[0];
  }

  async updateQualityCheck(id: number, qualityCheckUpdate: Partial<QualityCheck>): Promise<QualityCheck | undefined> {
    const result = await db.update(qualityChecks)
      .set(qualityCheckUpdate)
      .where(eq(qualityChecks.id, id))
      .returning();
    return result[0];
  }

  async deleteQualityCheck(id: number): Promise<boolean> {
    const result = await db.delete(qualityChecks).where(eq(qualityChecks.id, id)).returning();
    return result.length > 0;
  }

  // Corrective Actions
  async getCorrectiveActions(): Promise<CorrectiveAction[]> {
    return await db.select().from(correctiveActions);
  }

  async getCorrectiveActionsByQualityCheck(qualityCheckId: number): Promise<CorrectiveAction[]> {
    return await db.select().from(correctiveActions).where(eq(correctiveActions.qualityCheckId, qualityCheckId));
  }

  async getCorrectiveAction(id: number): Promise<CorrectiveAction | undefined> {
    const result = await db.select().from(correctiveActions).where(eq(correctiveActions.id, id));
    return result[0];
  }

  async createCorrectiveAction(correctiveAction: InsertCorrectiveAction): Promise<CorrectiveAction> {
    const result = await db.insert(correctiveActions).values(correctiveAction).returning();
    return result[0];
  }

  async updateCorrectiveAction(id: number, correctiveActionUpdate: Partial<CorrectiveAction>): Promise<CorrectiveAction | undefined> {
    const result = await db.update(correctiveActions)
      .set(correctiveActionUpdate)
      .where(eq(correctiveActions.id, id))
      .returning();
    return result[0];
  }

  async deleteCorrectiveAction(id: number): Promise<boolean> {
    const result = await db.delete(correctiveActions).where(eq(correctiveActions.id, id)).returning();
    return result.length > 0;
  }
  
  // Mix Materials
  async getMixMaterials(): Promise<MixMaterial[]> {
    return await db.select().from(mixMaterials);
  }

  async getMixMaterial(id: number): Promise<MixMaterial | undefined> {
    const result = await db.select().from(mixMaterials).where(eq(mixMaterials.id, id));
    return result[0];
  }

  async createMixMaterial(mix: InsertMixMaterial): Promise<MixMaterial> {
    const result = await db.insert(mixMaterials).values({
      ...mix,
      mixDate: new Date(),
      totalQuantity: 0,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateMixMaterial(id: number, mixUpdate: Partial<MixMaterial>): Promise<MixMaterial | undefined> {
    const result = await db.update(mixMaterials)
      .set(mixUpdate)
      .where(eq(mixMaterials.id, id))
      .returning();
    return result[0];
  }

  async deleteMixMaterial(id: number): Promise<boolean> {
    // First delete any associated mix items
    const mixItems = await this.getMixItemsByMix(id);
    for (const item of mixItems) {
      await this.deleteMixItem(item.id);
    }
    
    // Delete any machine associations
    await this.deleteMixMachinesByMixId(id);
    
    const result = await db.delete(mixMaterials).where(eq(mixMaterials.id, id)).returning();
    return result.length > 0;
  }
  
  // Mix Machines
  async getMixMachines(): Promise<MixMachine[]> {
    return await db.select().from(mixMachines);
  }
  
  async getMixMachinesByMixId(mixId: number): Promise<MixMachine[]> {
    return await db.select().from(mixMachines).where(eq(mixMachines.mixId, mixId));
  }
  
  async createMixMachine(mixMachine: InsertMixMachine): Promise<MixMachine> {
    const result = await db.insert(mixMachines).values(mixMachine).returning();
    return result[0];
  }
  
  async deleteMixMachinesByMixId(mixId: number): Promise<boolean> {
    const result = await db.delete(mixMachines).where(eq(mixMachines.mixId, mixId)).returning();
    return result.length > 0;
  }

  // Mix Items
  async getMixItems(): Promise<MixItem[]> {
    return await db.select().from(mixItems);
  }

  async getMixItemsByMix(mixId: number): Promise<MixItem[]> {
    return await db.select().from(mixItems).where(eq(mixItems.mixId, mixId));
  }

  async getMixItem(id: number): Promise<MixItem | undefined> {
    const result = await db.select().from(mixItems).where(eq(mixItems.id, id));
    return result[0];
  }

  async createMixItem(mixItem: InsertMixItem): Promise<MixItem> {
    // Get the mix to update total quantity
    const mix = await this.getMixMaterial(mixItem.mixId);
    if (!mix) {
      throw new Error(`Mix with ID ${mixItem.mixId} not found`);
    }
    
    // Get the raw material to reduce quantity from inventory
    const rawMaterial = await this.getRawMaterial(mixItem.rawMaterialId);
    if (!rawMaterial) {
      throw new Error(`Raw material with ID ${mixItem.rawMaterialId} not found`);
    }

    // Update the raw material quantity
    if (rawMaterial.quantity !== null && rawMaterial.quantity >= mixItem.quantity) {
      await this.updateRawMaterial(
        rawMaterial.id, 
        { quantity: rawMaterial.quantity - mixItem.quantity }
      );
    } else {
      throw new Error(`Insufficient quantity of raw material ${rawMaterial.name}`);
    }
    
    // Update the mix total quantity
    const newTotalQuantity = (mix.totalQuantity || 0) + mixItem.quantity;
    await this.updateMixMaterial(mix.id, { totalQuantity: newTotalQuantity });
    
    // Calculate the percentage of this item in the mix
    const percentage = (mixItem.quantity / newTotalQuantity) * 100;
    
    // Create the mix item with percentage
    const result = await db.insert(mixItems).values({
      ...mixItem,
      percentage
    }).returning();
    
    // Update percentages for all items in this mix
    const existingMixItems = await this.getMixItemsByMix(mixItem.mixId);
    for (const item of existingMixItems) {
      // Skip the current item as it was just created
      if (item.id === result[0].id) continue;
      
      // Recalculate percentage for existing items
      const updatedPercentage = (item.quantity / newTotalQuantity) * 100;
      await this.updateMixItem(item.id, { percentage: updatedPercentage });
    }
    
    return result[0];
  }

  async updateMixItem(id: number, mixItemUpdate: Partial<MixItem>): Promise<MixItem | undefined> {
    const existingMixItem = await this.getMixItem(id);
    if (!existingMixItem) return undefined;

    // Handle quantity changes that require recalculation of percentages
    if (mixItemUpdate.quantity !== undefined && 
        mixItemUpdate.quantity !== existingMixItem.quantity) {
      
      const mix = await this.getMixMaterial(existingMixItem.mixId);
      if (!mix) {
        throw new Error(`Mix with ID ${existingMixItem.mixId} not found`);
      }

      // Calculate the new total quantity for the mix
      const quantityDiff = mixItemUpdate.quantity - existingMixItem.quantity;
      const newTotalQuantity = (mix.totalQuantity || 0) + quantityDiff;
      
      // Update the raw material quantity
      if (quantityDiff !== 0) {
        const rawMaterial = await this.getRawMaterial(existingMixItem.rawMaterialId);
        if (!rawMaterial) {
          throw new Error(`Raw material with ID ${existingMixItem.rawMaterialId} not found`);
        }
        
        if (quantityDiff > 0) {
          // Check if we have enough raw material
          if (rawMaterial.quantity !== null && rawMaterial.quantity >= quantityDiff) {
            await this.updateRawMaterial(
              rawMaterial.id, 
              { quantity: rawMaterial.quantity - quantityDiff }
            );
          } else {
            throw new Error(`Insufficient quantity of raw material ${rawMaterial.name}`);
          }
        } else {
          // Return raw material to inventory
          await this.updateRawMaterial(
            rawMaterial.id,
            { quantity: (rawMaterial.quantity || 0) - quantityDiff }
          );
        }
      }
      
      // Update the mix total quantity
      await this.updateMixMaterial(mix.id, { totalQuantity: newTotalQuantity });
      
      // Calculate the new percentage for this item
      mixItemUpdate.percentage = (mixItemUpdate.quantity / newTotalQuantity) * 100;
      
      // Update percentages for all other items in this mix
      const mixItems = await this.getMixItemsByMix(existingMixItem.mixId);
      for (const item of mixItems) {
        // Skip the current item as it will be updated later
        if (item.id === id) continue;
        
        // Recalculate percentage for other items
        const updatedPercentage = (item.quantity / newTotalQuantity) * 100;
        await this.updateMixItem(item.id, { percentage: updatedPercentage });
      }
    }

    const result = await db.update(mixItems)
      .set(mixItemUpdate)
      .where(eq(mixItems.id, id))
      .returning();
    return result[0];
  }

  async deleteMixItem(id: number): Promise<boolean> {
    const mixItem = await this.getMixItem(id);
    if (!mixItem) return false;
    
    // Get the mix to update total quantity
    const mix = await this.getMixMaterial(mixItem.mixId);
    if (!mix) {
      // Just delete the mix item if the mix is not found
      const result = await db.delete(mixItems).where(eq(mixItems.id, id)).returning();
      return result.length > 0;
    }
    
    // Get the raw material to return quantity to inventory
    const rawMaterial = await this.getRawMaterial(mixItem.rawMaterialId);
    if (rawMaterial) {
      // Return raw material to inventory
      await this.updateRawMaterial(
        rawMaterial.id,
        { quantity: (rawMaterial.quantity || 0) + mixItem.quantity }
      );
    }
    
    // Update the mix total quantity
    const newTotalQuantity = (mix.totalQuantity || 0) - mixItem.quantity;
    await this.updateMixMaterial(mix.id, { totalQuantity: newTotalQuantity });
    
    // Delete the mix item
    const result = await db.delete(mixItems).where(eq(mixItems.id, id)).returning();
    
    if (result.length > 0) {
      // Update percentages for remaining items in this mix
      const remainingItems = await this.getMixItemsByMix(mixItem.mixId);
      for (const item of remainingItems) {
        // Recalculate percentage for remaining items
        const updatedPercentage = newTotalQuantity > 0 
          ? (item.quantity / newTotalQuantity) * 100 
          : 0;
        await this.updateMixItem(item.id, { percentage: updatedPercentage });
      }
      return true;
    }
    
    return false;
  }
}