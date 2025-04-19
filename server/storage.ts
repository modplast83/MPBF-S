import {
  User, InsertUser, Customer, InsertCustomer, Category, InsertCategory,
  Item, InsertItem, Section, InsertSection, Machine, InsertMachine,
  MasterBatch, InsertMasterBatch, CustomerProduct, InsertCustomerProduct,
  Order, InsertOrder, JobOrder, InsertJobOrder, Roll, InsertRoll,
  RawMaterial, InsertRawMaterial, FinalProduct, InsertFinalProduct,
  QualityCheckType, InsertQualityCheckType, QualityCheck, InsertQualityCheck,
  CorrectiveAction, InsertCorrectiveAction, SmsMessage, InsertSmsMessage
} from "@shared/schema";
import session from "express-session";

// Interface for storage operations
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  // User management
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // SMS Messages
  getSmsMessages(): Promise<SmsMessage[]>;
  getSmsMessagesByOrder(orderId: number): Promise<SmsMessage[]>;
  getSmsMessagesByJobOrder(jobOrderId: number): Promise<SmsMessage[]>;
  getSmsMessagesByCustomer(customerId: string): Promise<SmsMessage[]>;
  getSmsMessage(id: number): Promise<SmsMessage | undefined>;
  createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage>;
  updateSmsMessage(id: number, message: Partial<SmsMessage>): Promise<SmsMessage | undefined>;
  deleteSmsMessage(id: number): Promise<boolean>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryByCode(code: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Items
  getItems(): Promise<Item[]>;
  getItemsByCategory(categoryId: string): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;
  
  // Sections
  getSections(): Promise<Section[]>;
  getSection(id: string): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: string, section: Partial<Section>): Promise<Section | undefined>;
  deleteSection(id: string): Promise<boolean>;
  
  // Machines
  getMachines(): Promise<Machine[]>;
  getMachinesBySection(sectionId: string): Promise<Machine[]>;
  getMachine(id: string): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachine(id: string, machine: Partial<Machine>): Promise<Machine | undefined>;
  deleteMachine(id: string): Promise<boolean>;
  
  // Master Batches
  getMasterBatches(): Promise<MasterBatch[]>;
  getMasterBatch(id: string): Promise<MasterBatch | undefined>;
  createMasterBatch(masterBatch: InsertMasterBatch): Promise<MasterBatch>;
  updateMasterBatch(id: string, masterBatch: Partial<MasterBatch>): Promise<MasterBatch | undefined>;
  deleteMasterBatch(id: string): Promise<boolean>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByCode(code: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  
  // Customer Products
  getCustomerProducts(): Promise<CustomerProduct[]>;
  getCustomerProductsByCustomer(customerId: string): Promise<CustomerProduct[]>;
  getCustomerProduct(id: number): Promise<CustomerProduct | undefined>;
  createCustomerProduct(customerProduct: InsertCustomerProduct): Promise<CustomerProduct>;
  updateCustomerProduct(id: number, customerProduct: Partial<CustomerProduct>): Promise<CustomerProduct | undefined>;
  deleteCustomerProduct(id: number): Promise<boolean>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  
  // Job Orders
  getJobOrders(): Promise<JobOrder[]>;
  getJobOrdersByOrder(orderId: number): Promise<JobOrder[]>;
  getJobOrder(id: number): Promise<JobOrder | undefined>;
  createJobOrder(jobOrder: InsertJobOrder): Promise<JobOrder>;
  updateJobOrder(id: number, jobOrder: Partial<JobOrder>): Promise<JobOrder | undefined>;
  deleteJobOrder(id: number): Promise<boolean>;
  
  // Rolls
  getRolls(): Promise<Roll[]>;
  getRollsByJobOrder(jobOrderId: number): Promise<Roll[]>;
  getRollsByStage(stage: string): Promise<Roll[]>;
  getRoll(id: string): Promise<Roll | undefined>;
  createRoll(roll: InsertRoll): Promise<Roll>;
  updateRoll(id: string, roll: Partial<Roll>): Promise<Roll | undefined>;
  deleteRoll(id: string): Promise<boolean>;
  
  // Raw Materials
  getRawMaterials(): Promise<RawMaterial[]>;
  getRawMaterial(id: number): Promise<RawMaterial | undefined>;
  createRawMaterial(rawMaterial: InsertRawMaterial): Promise<RawMaterial>;
  updateRawMaterial(id: number, rawMaterial: Partial<RawMaterial>): Promise<RawMaterial | undefined>;
  deleteRawMaterial(id: number): Promise<boolean>;
  
  // Final Products
  getFinalProducts(): Promise<FinalProduct[]>;
  getFinalProduct(id: number): Promise<FinalProduct | undefined>;
  createFinalProduct(finalProduct: InsertFinalProduct): Promise<FinalProduct>;
  updateFinalProduct(id: number, finalProduct: Partial<FinalProduct>): Promise<FinalProduct | undefined>;
  deleteFinalProduct(id: number): Promise<boolean>;
  
  // Quality Check Types methods
  getQualityCheckTypes(): Promise<QualityCheckType[]>;
  getQualityCheckTypesByStage(stage: string): Promise<QualityCheckType[]>;
  getQualityCheckType(id: string): Promise<QualityCheckType | undefined>;
  createQualityCheckType(qualityCheckType: InsertQualityCheckType): Promise<QualityCheckType>;
  updateQualityCheckType(id: string, qualityCheckTypeUpdate: Partial<QualityCheckType>): Promise<QualityCheckType | undefined>;
  deleteQualityCheckType(id: string): Promise<boolean>;
  
  // Quality Checks methods
  getQualityChecks(): Promise<QualityCheck[]>;
  getQualityChecksByRoll(rollId: string): Promise<QualityCheck[]>;
  getQualityChecksByJobOrder(jobOrderId: number): Promise<QualityCheck[]>;
  getQualityCheck(id: number): Promise<QualityCheck | undefined>;
  createQualityCheck(qualityCheck: InsertQualityCheck): Promise<QualityCheck>;
  updateQualityCheck(id: number, qualityCheckUpdate: Partial<QualityCheck>): Promise<QualityCheck | undefined>;
  deleteQualityCheck(id: number): Promise<boolean>;
  
  // Corrective Actions methods
  getCorrectiveActions(): Promise<CorrectiveAction[]>;
  getCorrectiveActionsByQualityCheck(qualityCheckId: number): Promise<CorrectiveAction[]>;
  getCorrectiveAction(id: number): Promise<CorrectiveAction | undefined>;
  createCorrectiveAction(correctiveAction: InsertCorrectiveAction): Promise<CorrectiveAction>;
  updateCorrectiveAction(id: number, correctiveActionUpdate: Partial<CorrectiveAction>): Promise<CorrectiveAction | undefined>;
  deleteCorrectiveAction(id: number): Promise<boolean>;
  
  // Material and warehouse operations
  updateRawMaterialQuantity(id: number, quantityChange: number): Promise<RawMaterial | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private items: Map<string, Item>;
  private sections: Map<string, Section>;
  private machines: Map<string, Machine>;
  private masterBatches: Map<string, MasterBatch>;
  private customers: Map<string, Customer>;
  private customerProducts: Map<number, CustomerProduct>;
  private orders: Map<number, Order>;
  private jobOrders: Map<number, JobOrder>;
  private rolls: Map<string, Roll>;
  private rawMaterials: Map<number, RawMaterial>;
  private finalProducts: Map<number, FinalProduct>;
  private smsMessages: Map<number, SmsMessage>;
  
  private currentCustomerProductId: number;
  private currentOrderId: number;
  private currentJobOrderId: number;
  private currentRawMaterialId: number;
  private currentFinalProductId: number;
  private currentSmsMessageId: number;
  
  sessionStore: session.Store;

  constructor() {
    // Initialize session store
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    this.users = new Map();
    this.categories = new Map();
    this.items = new Map();
    this.sections = new Map();
    this.machines = new Map();
    this.masterBatches = new Map();
    this.customers = new Map();
    this.customerProducts = new Map();
    this.orders = new Map();
    this.jobOrders = new Map();
    this.rolls = new Map();
    this.rawMaterials = new Map();
    this.finalProducts = new Map();
    this.smsMessages = new Map();
    
    this.currentCustomerProductId = 1;
    this.currentOrderId = 1;
    this.currentJobOrderId = 1;
    this.currentRawMaterialId = 1;
    this.currentFinalProductId = 1;
    this.currentSmsMessageId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Add an admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "Admin User",
      role: "administrator",
      isActive: true,
      sectionId: null,
    });
    
    // Add sections
    const extrusionSection = this.createSection({
      id: "SEC001",
      name: "Extrusion",
    });
    
    const printingSection = this.createSection({
      id: "SEC002",
      name: "Printing",
    });
    
    const cuttingSection = this.createSection({
      id: "SEC003",
      name: "Cutting",
    });
    
    // Add master batches
    this.createMasterBatch({
      id: "MB001",
      name: "White EP11105W",
    });
    
    // Add categories
    const bagCategory = this.createCategory({
      id: "CAT001",
      name: "Plastic Bags",
      code: "PB",
    });
    
    // Add items
    this.createItem({
      id: "ITM019",
      categoryId: bagCategory.id,
      name: "Small Plastic Bag",
      fullName: "Small HDPE Plastic Bag",
    });
    
    this.createItem({
      id: "ITM020",
      categoryId: bagCategory.id,
      name: "Medium Plastic Bag",
      fullName: "Medium HDPE Plastic Bag",
    });
    
    this.createItem({
      id: "ITM022",
      categoryId: bagCategory.id,
      name: "Large Plastic Bag",
      fullName: "Large HDPE Plastic Bag",
    });
  }

  // User management
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = `U${this.users.size + 1}`.padStart(4, "0");
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryByCode(code: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(category => category.code === code);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = { ...category };
    this.categories.set(category.id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;

    const updatedCategory = { ...existingCategory, ...category };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Items
  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.categoryId === categoryId);
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(item: InsertItem): Promise<Item> {
    const newItem: Item = { ...item };
    this.items.set(item.id, newItem);
    return newItem;
  }

  async updateItem(id: string, item: Partial<Item>): Promise<Item | undefined> {
    const existingItem = this.items.get(id);
    if (!existingItem) return undefined;

    const updatedItem = { ...existingItem, ...item };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  // Sections
  async getSections(): Promise<Section[]> {
    return Array.from(this.sections.values());
  }

  async getSection(id: string): Promise<Section | undefined> {
    return this.sections.get(id);
  }

  async createSection(section: InsertSection): Promise<Section> {
    const newSection: Section = { ...section };
    this.sections.set(section.id, newSection);
    return newSection;
  }

  async updateSection(id: string, section: Partial<Section>): Promise<Section | undefined> {
    const existingSection = this.sections.get(id);
    if (!existingSection) return undefined;

    const updatedSection = { ...existingSection, ...section };
    this.sections.set(id, updatedSection);
    return updatedSection;
  }

  async deleteSection(id: string): Promise<boolean> {
    return this.sections.delete(id);
  }

  // Machines
  async getMachines(): Promise<Machine[]> {
    return Array.from(this.machines.values());
  }

  async getMachinesBySection(sectionId: string): Promise<Machine[]> {
    return Array.from(this.machines.values()).filter(machine => machine.sectionId === sectionId);
  }

  async getMachine(id: string): Promise<Machine | undefined> {
    return this.machines.get(id);
  }

  async createMachine(machine: InsertMachine): Promise<Machine> {
    const newMachine: Machine = { ...machine };
    this.machines.set(machine.id, newMachine);
    return newMachine;
  }

  async updateMachine(id: string, machine: Partial<Machine>): Promise<Machine | undefined> {
    const existingMachine = this.machines.get(id);
    if (!existingMachine) return undefined;

    const updatedMachine = { ...existingMachine, ...machine };
    this.machines.set(id, updatedMachine);
    return updatedMachine;
  }

  async deleteMachine(id: string): Promise<boolean> {
    return this.machines.delete(id);
  }

  // Master Batches
  async getMasterBatches(): Promise<MasterBatch[]> {
    return Array.from(this.masterBatches.values());
  }

  async getMasterBatch(id: string): Promise<MasterBatch | undefined> {
    return this.masterBatches.get(id);
  }

  async createMasterBatch(masterBatch: InsertMasterBatch): Promise<MasterBatch> {
    const newMasterBatch: MasterBatch = { ...masterBatch };
    this.masterBatches.set(masterBatch.id, newMasterBatch);
    return newMasterBatch;
  }

  async updateMasterBatch(id: string, masterBatch: Partial<MasterBatch>): Promise<MasterBatch | undefined> {
    const existingMasterBatch = this.masterBatches.get(id);
    if (!existingMasterBatch) return undefined;

    const updatedMasterBatch = { ...existingMasterBatch, ...masterBatch };
    this.masterBatches.set(id, updatedMasterBatch);
    return updatedMasterBatch;
  }

  async deleteMasterBatch(id: string): Promise<boolean> {
    return this.masterBatches.delete(id);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByCode(code: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.code === code);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const newCustomer: Customer = { ...customer };
    this.customers.set(customer.id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;

    const updatedCustomer = { ...existingCustomer, ...customer };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Customer Products
  async getCustomerProducts(): Promise<CustomerProduct[]> {
    return Array.from(this.customerProducts.values());
  }

  async getCustomerProductsByCustomer(customerId: string): Promise<CustomerProduct[]> {
    return Array.from(this.customerProducts.values()).filter(cp => cp.customerId === customerId);
  }

  async getCustomerProduct(id: number): Promise<CustomerProduct | undefined> {
    return this.customerProducts.get(id);
  }

  async createCustomerProduct(customerProduct: InsertCustomerProduct): Promise<CustomerProduct> {
    const id = this.currentCustomerProductId++;
    const newCustomerProduct: CustomerProduct = { ...customerProduct, id };
    this.customerProducts.set(id, newCustomerProduct);
    return newCustomerProduct;
  }

  async updateCustomerProduct(id: number, customerProduct: Partial<CustomerProduct>): Promise<CustomerProduct | undefined> {
    const existingCustomerProduct = this.customerProducts.get(id);
    if (!existingCustomerProduct) return undefined;

    const updatedCustomerProduct = { ...existingCustomerProduct, ...customerProduct };
    this.customerProducts.set(id, updatedCustomerProduct);
    return updatedCustomerProduct;
  }

  async deleteCustomerProduct(id: number): Promise<boolean> {
    return this.customerProducts.delete(id);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const newOrder: Order = { 
      ...order, 
      id, 
      date: new Date(), 
      status: "pending" 
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<Order>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;

    const updatedOrder = { ...existingOrder, ...order };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }

  // Job Orders
  async getJobOrders(): Promise<JobOrder[]> {
    return Array.from(this.jobOrders.values());
  }

  async getJobOrdersByOrder(orderId: number): Promise<JobOrder[]> {
    return Array.from(this.jobOrders.values()).filter(jo => jo.orderId === orderId);
  }

  async getJobOrder(id: number): Promise<JobOrder | undefined> {
    return this.jobOrders.get(id);
  }

  async createJobOrder(jobOrder: InsertJobOrder): Promise<JobOrder> {
    const id = this.currentJobOrderId++;
    
    // Extract the customerId from the related customer product if not provided
    let customerId = jobOrder.customerId;
    if (!customerId) {
      const customerProduct = this.customerProducts.get(jobOrder.customerProductId);
      if (customerProduct) {
        customerId = customerProduct.customerId;
      }
    }
    
    const newJobOrder: JobOrder = { 
      ...jobOrder, 
      id,
      status: jobOrder.status || "pending", 
      customerId 
    };
    
    this.jobOrders.set(id, newJobOrder);
    
    // Update order status to processing when a job order is created
    const order = this.orders.get(jobOrder.orderId);
    if (order && order.status === "pending") {
      this.updateOrder(order.id, { status: "processing" });
    }
    
    return newJobOrder;
  }

  async updateJobOrder(id: number, jobOrder: Partial<JobOrder>): Promise<JobOrder | undefined> {
    const existingJobOrder = this.jobOrders.get(id);
    if (!existingJobOrder) return undefined;

    const updatedJobOrder = { ...existingJobOrder, ...jobOrder };
    this.jobOrders.set(id, updatedJobOrder);
    return updatedJobOrder;
  }

  async deleteJobOrder(id: number): Promise<boolean> {
    return this.jobOrders.delete(id);
  }

  // Rolls
  async getRolls(): Promise<Roll[]> {
    return Array.from(this.rolls.values());
  }

  async getRollsByJobOrder(jobOrderId: number): Promise<Roll[]> {
    return Array.from(this.rolls.values()).filter(roll => roll.jobOrderId === jobOrderId);
  }

  async getRollsByStage(stage: string): Promise<Roll[]> {
    return Array.from(this.rolls.values()).filter(roll => roll.currentStage === stage);
  }

  async getRoll(id: string): Promise<Roll | undefined> {
    return this.rolls.get(id);
  }

  async createRoll(roll: InsertRoll): Promise<Roll> {
    const newRoll: Roll = { ...roll };
    this.rolls.set(roll.id, newRoll);
    return newRoll;
  }

  async updateRoll(id: string, roll: Partial<Roll>): Promise<Roll | undefined> {
    const existingRoll = this.rolls.get(id);
    if (!existingRoll) return undefined;

    const updatedRoll = { ...existingRoll, ...roll };
    this.rolls.set(id, updatedRoll);
    return updatedRoll;
  }

  async deleteRoll(id: string): Promise<boolean> {
    return this.rolls.delete(id);
  }

  // Raw Materials
  async getRawMaterials(): Promise<RawMaterial[]> {
    return Array.from(this.rawMaterials.values());
  }

  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    return this.rawMaterials.get(id);
  }

  async createRawMaterial(rawMaterial: InsertRawMaterial): Promise<RawMaterial> {
    const id = this.currentRawMaterialId++;
    const newRawMaterial: RawMaterial = { 
      ...rawMaterial, 
      id, 
      lastUpdated: new Date() 
    };
    this.rawMaterials.set(id, newRawMaterial);
    return newRawMaterial;
  }

  async updateRawMaterial(id: number, rawMaterial: Partial<RawMaterial>): Promise<RawMaterial | undefined> {
    const existingRawMaterial = this.rawMaterials.get(id);
    if (!existingRawMaterial) return undefined;

    const updatedRawMaterial = { 
      ...existingRawMaterial, 
      ...rawMaterial, 
      lastUpdated: new Date() 
    };
    this.rawMaterials.set(id, updatedRawMaterial);
    return updatedRawMaterial;
  }

  async deleteRawMaterial(id: number): Promise<boolean> {
    return this.rawMaterials.delete(id);
  }

  // Final Products
  async getFinalProducts(): Promise<FinalProduct[]> {
    return Array.from(this.finalProducts.values());
  }

  async getFinalProduct(id: number): Promise<FinalProduct | undefined> {
    return this.finalProducts.get(id);
  }

  async createFinalProduct(finalProduct: InsertFinalProduct): Promise<FinalProduct> {
    const id = this.currentFinalProductId++;
    const newFinalProduct: FinalProduct = { 
      ...finalProduct, 
      id, 
      completedDate: new Date() 
    };
    this.finalProducts.set(id, newFinalProduct);
    return newFinalProduct;
  }

  async updateFinalProduct(id: number, finalProduct: Partial<FinalProduct>): Promise<FinalProduct | undefined> {
    const existingFinalProduct = this.finalProducts.get(id);
    if (!existingFinalProduct) return undefined;

    const updatedFinalProduct = { ...existingFinalProduct, ...finalProduct };
    this.finalProducts.set(id, updatedFinalProduct);
    return updatedFinalProduct;
  }

  async deleteFinalProduct(id: number): Promise<boolean> {
    return this.finalProducts.delete(id);
  }

  // SMS Messages methods
  async getSmsMessages(): Promise<SmsMessage[]> {
    return Array.from(this.smsMessages.values());
  }

  async getSmsMessagesByOrder(orderId: number): Promise<SmsMessage[]> {
    return Array.from(this.smsMessages.values()).filter(msg => msg.orderId === orderId);
  }

  async getSmsMessagesByJobOrder(jobOrderId: number): Promise<SmsMessage[]> {
    return Array.from(this.smsMessages.values()).filter(msg => msg.jobOrderId === jobOrderId);
  }

  async getSmsMessagesByCustomer(customerId: string): Promise<SmsMessage[]> {
    return Array.from(this.smsMessages.values()).filter(msg => msg.customerId === customerId);
  }

  async getSmsMessage(id: number): Promise<SmsMessage | undefined> {
    return this.smsMessages.get(id);
  }

  async createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage> {
    const id = this.currentSmsMessageId++;
    const newMessage: SmsMessage = {
      ...message,
      id,
      sentAt: new Date(),
      deliveredAt: null,
      twilioMessageId: null,
      status: message.status || "pending"
    };
    this.smsMessages.set(id, newMessage);
    return newMessage;
  }

  async updateSmsMessage(id: number, message: Partial<SmsMessage>): Promise<SmsMessage | undefined> {
    const existingMessage = this.smsMessages.get(id);
    if (!existingMessage) return undefined;

    const updatedMessage = { ...existingMessage, ...message };
    this.smsMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteSmsMessage(id: number): Promise<boolean> {
    return this.smsMessages.delete(id);
  }
}

import { DatabaseStorage } from './database-storage';

// Use the database storage implementation
export const storage = new DatabaseStorage();
