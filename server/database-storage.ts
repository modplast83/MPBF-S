import { IStorage } from './storage';
import { db } from './db';
import { eq, and, inArray } from 'drizzle-orm';
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
  MixingProcess, InsertMixingProcess, mixingProcesses,
  MixingDetail, InsertMixingDetail, mixingDetails,
  MixingProcessMachine, InsertMixingProcessMachine, mixingProcessMachines,
  MixingProcessOrder, InsertMixingProcessOrder, mixingProcessOrders
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

  // Material Mixing
  async getMixingProcesses(): Promise<MixingProcess[]> {
    return await db.select().from(mixingProcesses);
  }

  async getMixingProcess(id: number): Promise<MixingProcess | undefined> {
    const processes = await db.select().from(mixingProcesses).where(eq(mixingProcesses.id, id));
    return processes[0];
  }

  async getMixingProcessesByMachine(machineId: string): Promise<MixingProcess[]> {
    const processIds = await db.select({
      mixingProcessId: mixingProcessMachines.mixingProcessId
    })
    .from(mixingProcessMachines)
    .where(eq(mixingProcessMachines.machineId, machineId));
    
    if (processIds.length === 0) {
      return [];
    }
    
    return await db.select()
      .from(mixingProcesses)
      .where(inArray(mixingProcesses.id, processIds.map(p => p.mixingProcessId)));
  }

  async getMixingProcessesByOrder(orderId: number): Promise<MixingProcess[]> {
    const processIds = await db.select({
      mixingProcessId: mixingProcessOrders.mixingProcessId
    })
    .from(mixingProcessOrders)
    .where(eq(mixingProcessOrders.orderId, orderId));
    
    if (processIds.length === 0) {
      return [];
    }
    
    return await db.select()
      .from(mixingProcesses)
      .where(inArray(mixingProcesses.id, processIds.map(p => p.mixingProcessId)));
  }

  async getMixingProcessesByUser(userId: string): Promise<MixingProcess[]> {
    return await db.select().from(mixingProcesses).where(eq(mixingProcesses.mixedById, userId));
  }

  async createMixingProcess(mixingProcess: InsertMixingProcess): Promise<MixingProcess> {
    const result = await db.insert(mixingProcesses).values(mixingProcess).returning();
    return result[0];
  }

  async updateMixingProcess(id: number, updateData: Partial<MixingProcess>): Promise<MixingProcess | undefined> {
    const result = await db
      .update(mixingProcesses)
      .set(updateData)
      .where(eq(mixingProcesses.id, id))
      .returning();

    return result[0];
  }

  async deleteMixingProcess(id: number): Promise<boolean> {
    // First delete all mixing details related to this process
    await db.delete(mixingDetails).where(eq(mixingDetails.mixingProcessId, id));
    
    // Then delete all machine associations
    await db.delete(mixingProcessMachines).where(eq(mixingProcessMachines.mixingProcessId, id));
    
    // Then delete all order associations
    await db.delete(mixingProcessOrders).where(eq(mixingProcessOrders.mixingProcessId, id));
    
    // Finally delete the mixing process
    const result = await db.delete(mixingProcesses).where(eq(mixingProcesses.id, id)).returning();
    return result.length > 0;
  }
  
  // Mixing Process Machines
  async getMixingProcessMachines(mixingProcessId: number): Promise<MixingProcessMachine[]> {
    return await db.select()
      .from(mixingProcessMachines)
      .where(eq(mixingProcessMachines.mixingProcessId, mixingProcessId));
  }
  
  async getMixingProcessMachine(id: number): Promise<MixingProcessMachine | undefined> {
    const machines = await db.select()
      .from(mixingProcessMachines)
      .where(eq(mixingProcessMachines.id, id));
    return machines[0];
  }
  
  async createMixingProcessMachine(machine: InsertMixingProcessMachine): Promise<MixingProcessMachine> {
    const result = await db.insert(mixingProcessMachines).values(machine).returning();
    return result[0];
  }
  
  async deleteMixingProcessMachine(id: number): Promise<boolean> {
    const result = await db.delete(mixingProcessMachines)
      .where(eq(mixingProcessMachines.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Mixing Process Orders
  async getMixingProcessOrders(mixingProcessId: number): Promise<MixingProcessOrder[]> {
    return await db.select()
      .from(mixingProcessOrders)
      .where(eq(mixingProcessOrders.mixingProcessId, mixingProcessId));
  }
  
  async getMixingProcessOrder(id: number): Promise<MixingProcessOrder | undefined> {
    const orders = await db.select()
      .from(mixingProcessOrders)
      .where(eq(mixingProcessOrders.id, id));
    return orders[0];
  }
  
  async createMixingProcessOrder(order: InsertMixingProcessOrder): Promise<MixingProcessOrder> {
    const result = await db.insert(mixingProcessOrders).values(order).returning();
    return result[0];
  }
  
  async deleteMixingProcessOrder(id: number): Promise<boolean> {
    const result = await db.delete(mixingProcessOrders)
      .where(eq(mixingProcessOrders.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Helper for updating raw material quantity when confirming mixing
  async updateRawMaterialQuantity(materialId: number, quantityChange: number): Promise<RawMaterial | undefined> {
    const material = await this.getRawMaterial(materialId);
    if (!material || material.quantity === null) {
      return undefined;
    }
    
    const newQuantity = material.quantity + quantityChange;
    return this.updateRawMaterial(materialId, { quantity: newQuantity });
  }
  
  // Get mixing process with all related data
  async getMixingProcessWithDetails(id: number): Promise<{
    process: MixingProcess;
    machines: Machine[];
    orders: Order[];
    details: (MixingDetail & { material: RawMaterial })[];
    user: User;
  } | undefined> {
    const process = await this.getMixingProcess(id);
    if (!process) {
      return undefined;
    }
    
    // Get the user who created the process
    const user = await this.getUser(process.mixedById);
    if (!user) {
      return undefined;
    }
    
    // Get machines associated with this process
    const machineAssociations = await this.getMixingProcessMachines(id);
    const machines: Machine[] = [];
    for (const assoc of machineAssociations) {
      const machine = await this.getMachine(assoc.machineId);
      if (machine) {
        machines.push(machine);
      }
    }
    
    // Get orders associated with this process
    const orderAssociations = await this.getMixingProcessOrders(id);
    const orders: Order[] = [];
    for (const assoc of orderAssociations) {
      const order = await this.getOrder(assoc.orderId);
      if (order) {
        orders.push(order);
      }
    }
    
    // Get details with materials
    const detailsList = await this.getMixingDetails(id);
    const detailsWithMaterials: (MixingDetail & { material: RawMaterial })[] = [];
    
    for (const detail of detailsList) {
      const material = await this.getRawMaterial(detail.materialId);
      if (material) {
        detailsWithMaterials.push({
          ...detail,
          material
        });
      }
    }
    
    return {
      process,
      machines,
      orders,
      details: detailsWithMaterials,
      user
    };
  }

  // Mixing Details
  async getMixingDetails(mixingProcessId: number): Promise<MixingDetail[]> {
    return await db.select().from(mixingDetails).where(eq(mixingDetails.mixingProcessId, mixingProcessId));
  }

  async getMixingDetail(id: number): Promise<MixingDetail | undefined> {
    const details = await db.select().from(mixingDetails).where(eq(mixingDetails.id, id));
    return details[0];
  }

  async createMixingDetail(detail: InsertMixingDetail): Promise<MixingDetail> {
    const result = await db.insert(mixingDetails).values(detail).returning();
    
    // Update the total weight of the mixing process
    const mixingProcess = await this.getMixingProcess(detail.mixingProcessId);
    if (mixingProcess) {
      const details = await this.getMixingDetails(detail.mixingProcessId);
      const totalWeight = details.reduce((sum, d) => sum + d.quantity, 0);
      
      // Update total weight and recalculate percentages for all details
      await this.updateMixingProcess(detail.mixingProcessId, { totalWeight });
      
      // Update percentages for all details in this mixing process
      for (const d of details) {
        const percentage = (d.quantity / totalWeight) * 100;
        await db
          .update(mixingDetails)
          .set({ percentage })
          .where(eq(mixingDetails.id, d.id));
      }
    }
    
    return result[0];
  }

  async updateMixingDetail(id: number, updateData: Partial<MixingDetail>): Promise<MixingDetail | undefined> {
    const result = await db
      .update(mixingDetails)
      .set(updateData)
      .where(eq(mixingDetails.id, id))
      .returning();
    
    if (result[0] && updateData.quantity !== undefined) {
      // If quantity was updated, we need to recalculate total weight and percentages
      const detail = result[0];
      const mixingProcess = await this.getMixingProcess(detail.mixingProcessId);
      
      if (mixingProcess) {
        const details = await this.getMixingDetails(detail.mixingProcessId);
        const totalWeight = details.reduce((sum, d) => sum + d.quantity, 0);
        
        // Update total weight and recalculate percentages
        await this.updateMixingProcess(detail.mixingProcessId, { totalWeight });
        
        // Update percentages for all details in this mixing process
        for (const d of details) {
          const percentage = (d.quantity / totalWeight) * 100;
          await db
            .update(mixingDetails)
            .set({ percentage })
            .where(eq(mixingDetails.id, d.id));
        }
      }
    }
    
    return result[0];
  }

  async deleteMixingDetail(id: number): Promise<boolean> {
    // Get the detail first to know its mixing process
    const detail = await this.getMixingDetail(id);
    
    if (!detail) {
      return false;
    }
    
    // Delete the detail
    const result = await db.delete(mixingDetails).where(eq(mixingDetails.id, id)).returning();
    
    if (result.length > 0) {
      // Recalculate total weight and percentages for the mixing process
      const mixingProcess = await this.getMixingProcess(detail.mixingProcessId);
      
      if (mixingProcess) {
        const details = await this.getMixingDetails(detail.mixingProcessId);
        const totalWeight = details.reduce((sum, d) => sum + d.quantity, 0);
        
        // Update total weight
        await this.updateMixingProcess(detail.mixingProcessId, { totalWeight });
        
        // Update percentages for all remaining details
        for (const d of details) {
          const percentage = totalWeight > 0 ? (d.quantity / totalWeight) * 100 : 0;
          await db
            .update(mixingDetails)
            .set({ percentage })
            .where(eq(mixingDetails.id, d.id));
        }
      }
      
      return true;
    }
    
    return false;
  }
}