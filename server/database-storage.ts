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
  FinalProduct, InsertFinalProduct, finalProducts
} from '@shared/schema';

export class DatabaseStorage implements IStorage {
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
}