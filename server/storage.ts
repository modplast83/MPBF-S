import {
  User, InsertUser, Customer, InsertCustomer, Category, InsertCategory,
  Item, InsertItem, Section, InsertSection, Machine, InsertMachine,
  MasterBatch, InsertMasterBatch, CustomerProduct, InsertCustomerProduct,
  Order, InsertOrder, JobOrder, InsertJobOrder, Roll, InsertRoll,
  RawMaterial, InsertRawMaterial, FinalProduct, InsertFinalProduct,
  QualityCheckType, InsertQualityCheckType, QualityCheck, InsertQualityCheck,
  CorrectiveAction, InsertCorrectiveAction, SmsMessage, InsertSmsMessage,
  MixMaterial, InsertMixMaterial, MixItem, InsertMixItem,
  MixMachine, InsertMixMachine, mixMachines
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
  
  // Mix Materials
  getMixMaterials(): Promise<MixMaterial[]>;
  getMixMaterial(id: number): Promise<MixMaterial | undefined>;
  createMixMaterial(mix: InsertMixMaterial): Promise<MixMaterial>;
  updateMixMaterial(id: number, mix: Partial<MixMaterial>): Promise<MixMaterial | undefined>;
  deleteMixMaterial(id: number): Promise<boolean>;
  
  // Mix Machines
  getMixMachines(): Promise<MixMachine[]>;
  getMixMachinesByMixId(mixId: number): Promise<MixMachine[]>; 
  createMixMachine(mixMachine: InsertMixMachine): Promise<MixMachine>;
  deleteMixMachinesByMixId(mixId: number): Promise<boolean>;
  
  // Mix Items
  getMixItems(): Promise<MixItem[]>;
  getMixItemsByMix(mixId: number): Promise<MixItem[]>;
  getMixItem(id: number): Promise<MixItem | undefined>;
  createMixItem(mixItem: InsertMixItem): Promise<MixItem>;
  updateMixItem(id: number, mixItem: Partial<MixItem>): Promise<MixItem | undefined>;
  deleteMixItem(id: number): Promise<boolean>;
  
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
  private mixMaterials: Map<number, MixMaterial>;
  private mixMachines: Map<number, MixMachine>;
  private mixItems: Map<number, MixItem>;
  
  private currentCustomerProductId: number;
  private currentOrderId: number;
  private currentJobOrderId: number;
  private currentRawMaterialId: number;
  private currentFinalProductId: number;
  private currentSmsMessageId: number;
  private currentMixMaterialId: number;
  private currentMixMachineId: number;
  private currentMixItemId: number;
  
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
    this.mixMaterials = new Map();
    this.mixMachines = new Map();
    this.mixItems = new Map();
    
    this.currentCustomerProductId = 1;
    this.currentOrderId = 1;
    this.currentJobOrderId = 1;
    this.currentRawMaterialId = 1;
    this.currentFinalProductId = 1;
    this.currentSmsMessageId = 1;
    this.currentMixMaterialId = 1;
    this.currentMixMachineId = 1;
    this.currentMixItemId = 1;
    
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

  // Mix Materials
  async getMixMaterials(): Promise<MixMaterial[]> {
    return Array.from(this.mixMaterials.values());
  }

  async getMixMaterial(id: number): Promise<MixMaterial | undefined> {
    return this.mixMaterials.get(id);
  }

  async createMixMaterial(mix: InsertMixMaterial): Promise<MixMaterial> {
    const id = this.currentMixMaterialId++;
    const totalQuantity = 0; // Will be updated as mix items are added
    const newMix: MixMaterial = {
      ...mix,
      id,
      mixDate: new Date(),
      totalQuantity,
      createdAt: new Date()
    };
    this.mixMaterials.set(id, newMix);
    return newMix;
  }

  async updateMixMaterial(id: number, mix: Partial<MixMaterial>): Promise<MixMaterial | undefined> {
    const existingMix = this.mixMaterials.get(id);
    if (!existingMix) return undefined;

    const updatedMix = { ...existingMix, ...mix };
    this.mixMaterials.set(id, updatedMix);
    return updatedMix;
  }

  async deleteMixMaterial(id: number): Promise<boolean> {
    // First delete any associated mix items
    const mixItems = await this.getMixItemsByMix(id);
    for (const item of mixItems) {
      await this.deleteMixItem(item.id);
    }
    
    // Delete any machine associations
    await this.deleteMixMachinesByMixId(id);
    
    return this.mixMaterials.delete(id);
  }
  
  // Mix Machines
  async getMixMachines(): Promise<MixMachine[]> {
    return Array.from(this.mixMachines.values());
  }
  
  async getMixMachinesByMixId(mixId: number): Promise<MixMachine[]> {
    return Array.from(this.mixMachines.values())
      .filter(mixMachine => mixMachine.mixId === mixId);
  }
  
  async createMixMachine(mixMachine: InsertMixMachine): Promise<MixMachine> {
    const id = this.currentMixMachineId++;
    const newMixMachine: MixMachine = {
      ...mixMachine,
      id
    };
    this.mixMachines.set(id, newMixMachine);
    return newMixMachine;
  }
  
  async deleteMixMachinesByMixId(mixId: number): Promise<boolean> {
    const toDelete = await this.getMixMachinesByMixId(mixId);
    
    let success = true;
    for (const mixMachine of toDelete) {
      if (!this.mixMachines.delete(mixMachine.id)) {
        success = false;
      }
    }
    
    return success;
  }

  // Mix Items
  async getMixItems(): Promise<MixItem[]> {
    return Array.from(this.mixItems.values());
  }

  async getMixItemsByMix(mixId: number): Promise<MixItem[]> {
    return Array.from(this.mixItems.values()).filter(item => item.mixId === mixId);
  }

  async getMixItem(id: number): Promise<MixItem | undefined> {
    return this.mixItems.get(id);
  }

  async createMixItem(mixItem: InsertMixItem): Promise<MixItem> {
    const id = this.currentMixItemId++;
    
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
    const newTotalQuantity = mix.totalQuantity + mixItem.quantity;
    await this.updateMixMaterial(mix.id, { totalQuantity: newTotalQuantity });
    
    // Calculate the percentage of this item in the mix
    const percentage = (mixItem.quantity / newTotalQuantity) * 100;
    
    // Create the mix item with percentage
    const newMixItem: MixItem = {
      ...mixItem,
      id,
      percentage
    };
    
    // Update percentages for all items in this mix
    const mixItems = await this.getMixItemsByMix(mixItem.mixId);
    for (const item of mixItems) {
      // Skip the current item as it's not in the map yet
      if (item.id === id) continue;
      
      // Recalculate percentage for existing items
      const updatedPercentage = (item.quantity / newTotalQuantity) * 100;
      await this.updateMixItem(item.id, { percentage: updatedPercentage });
    }
    
    this.mixItems.set(id, newMixItem);
    return newMixItem;
  }

  async updateMixItem(id: number, mixItemUpdate: Partial<MixItem>): Promise<MixItem | undefined> {
    const existingMixItem = this.mixItems.get(id);
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
      const newTotalQuantity = mix.totalQuantity + quantityDiff;
      
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
        const otherUpdatedItem = { ...item, percentage: updatedPercentage };
        this.mixItems.set(item.id, otherUpdatedItem);
      }
    }

    const updatedMixItem = { ...existingMixItem, ...mixItemUpdate };
    this.mixItems.set(id, updatedMixItem);
    return updatedMixItem;
  }

  async deleteMixItem(id: number): Promise<boolean> {
    const mixItem = this.mixItems.get(id);
    if (!mixItem) return false;
    
    // Get the mix to update total quantity
    const mix = await this.getMixMaterial(mixItem.mixId);
    if (!mix) {
      return this.mixItems.delete(id);
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
    const newTotalQuantity = mix.totalQuantity - mixItem.quantity;
    await this.updateMixMaterial(mix.id, { totalQuantity: newTotalQuantity });
    
    // Update percentages for remaining items in this mix
    const mixItems = await this.getMixItemsByMix(mixItem.mixId);
    for (const item of mixItems) {
      // Skip the current item as it will be deleted
      if (item.id === id) continue;
      
      // Recalculate percentage for remaining items
      const updatedPercentage = newTotalQuantity > 0 
        ? (item.quantity / newTotalQuantity) * 100 
        : 0;
      await this.updateMixItem(item.id, { percentage: updatedPercentage });
    }
    
    return this.mixItems.delete(id);
  }
}

import { DatabaseStorage } from './database-storage';

// Use the database storage implementation
export const storage = new DatabaseStorage();
