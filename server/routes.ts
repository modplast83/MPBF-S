import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCategorySchema, insertCustomerSchema, insertUserSchema, 
  insertItemSchema, insertSectionSchema, insertMachineSchema,
  insertMasterBatchSchema, insertCustomerProductSchema,
  insertOrderSchema, insertJobOrderSchema, insertRollSchema,
  createRollSchema, InsertRoll,
  insertRawMaterialSchema, insertFinalProductSchema,
  insertSmsMessageSchema, InsertSmsMessage,
  insertMixMaterialSchema, insertMixItemSchema
} from "@shared/schema";
import { z } from "zod";
import fileUpload from 'express-fileupload';
import { setupAuth } from "./auth";

// Extend the Request type to include express-fileupload properties
declare global {
  namespace Express {
    interface Request {
      files?: fileUpload.FileArray | null;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Setup API routes
  const apiRouter = app.route("/api");
  
  // Authentication middleware for protected routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  
  // Categories
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });
  
  app.get("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to get category" });
    }
  });
  
  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const existingCategory = await storage.getCategoryByCode(validatedData.code);
      if (existingCategory) {
        return res.status(409).json({ message: "Category code already exists" });
      }
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  app.put("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const existingCategory = await storage.getCategory(req.params.id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const validatedData = insertCategorySchema.parse(req.body);
      
      // If code is being changed, check it doesn't conflict
      if (validatedData.code !== existingCategory.code) {
        const existingWithCode = await storage.getCategoryByCode(validatedData.code);
        if (existingWithCode && existingWithCode.id !== req.params.id) {
          return res.status(409).json({ message: "Category code already exists" });
        }
      }
      
      const category = await storage.updateCategory(req.params.id, validatedData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check for related items
      const items = await storage.getItemsByCategory(req.params.id);
      if (items.length > 0) {
        return res.status(409).json({ message: "Cannot delete category with associated items" });
      }
      
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  
  // Items
  app.get("/api/items", async (_req: Request, res: Response) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get items" });
    }
  });
  
  app.get("/api/categories/:categoryId/items", async (req: Request, res: Response) => {
    try {
      const category = await storage.getCategory(req.params.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const items = await storage.getItemsByCategory(req.params.categoryId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get items" });
    }
  });
  
  app.get("/api/items/:id", async (req: Request, res: Response) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to get item" });
    }
  });
  
  app.post("/api/items", async (req: Request, res: Response) => {
    try {
      const validatedData = insertItemSchema.parse(req.body);
      
      // Verify category exists
      const category = await storage.getCategory(validatedData.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const item = await storage.createItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create item" });
    }
  });
  
  app.put("/api/items/:id", async (req: Request, res: Response) => {
    try {
      const existingItem = await storage.getItem(req.params.id);
      if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      const validatedData = insertItemSchema.parse(req.body);
      
      // Verify category exists
      const category = await storage.getCategory(validatedData.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const item = await storage.updateItem(req.params.id, validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update item" });
    }
  });
  
  app.delete("/api/items/:id", async (req: Request, res: Response) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      await storage.deleteItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });
  
  // Sections
  app.get("/api/sections", async (_req: Request, res: Response) => {
    try {
      const sections = await storage.getSections();
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sections" });
    }
  });
  
  app.get("/api/sections/:id", async (req: Request, res: Response) => {
    try {
      const section = await storage.getSection(req.params.id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      res.json(section);
    } catch (error) {
      res.status(500).json({ message: "Failed to get section" });
    }
  });
  
  app.post("/api/sections", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSectionSchema.parse(req.body);
      const section = await storage.createSection(validatedData);
      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid section data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create section" });
    }
  });
  
  app.put("/api/sections/:id", async (req: Request, res: Response) => {
    try {
      const existingSection = await storage.getSection(req.params.id);
      if (!existingSection) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      const validatedData = insertSectionSchema.parse(req.body);
      const section = await storage.updateSection(req.params.id, validatedData);
      res.json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid section data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update section" });
    }
  });
  
  app.delete("/api/sections/:id", async (req: Request, res: Response) => {
    try {
      const section = await storage.getSection(req.params.id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      await storage.deleteSection(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete section" });
    }
  });
  
  // Machines
  app.get("/api/machines", async (_req: Request, res: Response) => {
    try {
      const machines = await storage.getMachines();
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "Failed to get machines" });
    }
  });
  
  app.get("/api/sections/:sectionId/machines", async (req: Request, res: Response) => {
    try {
      const section = await storage.getSection(req.params.sectionId);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      const machines = await storage.getMachinesBySection(req.params.sectionId);
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "Failed to get machines" });
    }
  });
  
  app.get("/api/machines/:id", async (req: Request, res: Response) => {
    try {
      const machine = await storage.getMachine(req.params.id);
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }
      res.json(machine);
    } catch (error) {
      res.status(500).json({ message: "Failed to get machine" });
    }
  });
  
  app.post("/api/machines", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMachineSchema.parse(req.body);
      
      if (validatedData.sectionId) {
        // Verify section exists if provided
        const section = await storage.getSection(validatedData.sectionId);
        if (!section) {
          return res.status(404).json({ message: "Section not found" });
        }
      }
      
      const machine = await storage.createMachine(validatedData);
      res.status(201).json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid machine data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create machine" });
    }
  });
  
  app.put("/api/machines/:id", async (req: Request, res: Response) => {
    try {
      const existingMachine = await storage.getMachine(req.params.id);
      if (!existingMachine) {
        return res.status(404).json({ message: "Machine not found" });
      }
      
      const validatedData = insertMachineSchema.parse(req.body);
      
      if (validatedData.sectionId) {
        // Verify section exists if provided
        const section = await storage.getSection(validatedData.sectionId);
        if (!section) {
          return res.status(404).json({ message: "Section not found" });
        }
      }
      
      const machine = await storage.updateMachine(req.params.id, validatedData);
      res.json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid machine data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update machine" });
    }
  });
  
  app.delete("/api/machines/:id", async (req: Request, res: Response) => {
    try {
      const machine = await storage.getMachine(req.params.id);
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }
      
      await storage.deleteMachine(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete machine" });
    }
  });
  
  // Master Batches
  app.get("/api/master-batches", async (_req: Request, res: Response) => {
    try {
      const masterBatches = await storage.getMasterBatches();
      res.json(masterBatches);
    } catch (error) {
      res.status(500).json({ message: "Failed to get master batches" });
    }
  });
  
  app.get("/api/master-batches/:id", async (req: Request, res: Response) => {
    try {
      const masterBatch = await storage.getMasterBatch(req.params.id);
      if (!masterBatch) {
        return res.status(404).json({ message: "Master batch not found" });
      }
      res.json(masterBatch);
    } catch (error) {
      res.status(500).json({ message: "Failed to get master batch" });
    }
  });
  
  app.post("/api/master-batches", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMasterBatchSchema.parse(req.body);
      const masterBatch = await storage.createMasterBatch(validatedData);
      res.status(201).json(masterBatch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid master batch data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create master batch" });
    }
  });
  
  app.put("/api/master-batches/:id", async (req: Request, res: Response) => {
    try {
      const existingMasterBatch = await storage.getMasterBatch(req.params.id);
      if (!existingMasterBatch) {
        return res.status(404).json({ message: "Master batch not found" });
      }
      
      const validatedData = insertMasterBatchSchema.parse(req.body);
      const masterBatch = await storage.updateMasterBatch(req.params.id, validatedData);
      res.json(masterBatch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid master batch data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update master batch" });
    }
  });
  
  app.delete("/api/master-batches/:id", async (req: Request, res: Response) => {
    try {
      const masterBatch = await storage.getMasterBatch(req.params.id);
      if (!masterBatch) {
        return res.status(404).json({ message: "Master batch not found" });
      }
      
      await storage.deleteMasterBatch(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete master batch" });
    }
  });
  
  // Users
  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      // Remove password from response
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      if (validatedData.sectionId) {
        // Verify section exists if provided
        const section = await storage.getSection(validatedData.sectionId);
        if (!section) {
          return res.status(404).json({ message: "Section not found" });
        }
      }
      
      const user = await storage.createUser(validatedData);
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const validatedData = insertUserSchema.parse(req.body);
      
      if (validatedData.username !== existingUser.username) {
        const usernameExists = await storage.getUserByUsername(validatedData.username);
        if (usernameExists) {
          return res.status(409).json({ message: "Username already exists" });
        }
      }
      
      if (validatedData.sectionId) {
        // Verify section exists if provided
        const section = await storage.getSection(validatedData.sectionId);
        if (!section) {
          return res.status(404).json({ message: "Section not found" });
        }
      }
      
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // Customers
  app.get("/api/customers", async (_req: Request, res: Response) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customers" });
    }
  });
  
  app.get("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customer" });
    }
  });
  
  app.post("/api/customers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      const existingCustomer = await storage.getCustomerByCode(validatedData.code);
      if (existingCustomer) {
        return res.status(409).json({ message: "Customer code already exists" });
      }
      
      if (validatedData.userId) {
        // Verify user exists if provided
        const user = await storage.getUser(validatedData.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }
      
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });
  
  app.put("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const existingCustomer = await storage.getCustomer(req.params.id);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const validatedData = insertCustomerSchema.parse(req.body);
      
      if (validatedData.code !== existingCustomer.code) {
        const codeExists = await storage.getCustomerByCode(validatedData.code);
        if (codeExists) {
          return res.status(409).json({ message: "Customer code already exists" });
        }
      }
      
      if (validatedData.userId) {
        // Verify user exists if provided
        const user = await storage.getUser(validatedData.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }
      
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });
  
  app.delete("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Check for related customer products
      const customerProducts = await storage.getCustomerProductsByCustomer(req.params.id);
      if (customerProducts.length > 0) {
        return res.status(409).json({ message: "Cannot delete customer with associated products" });
      }
      
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });
  
  // Customer Products
  app.get("/api/customer-products", async (_req: Request, res: Response) => {
    try {
      const customerProducts = await storage.getCustomerProducts();
      res.json(customerProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customer products" });
    }
  });
  
  app.get("/api/customers/:customerId/products", async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.params.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const customerProducts = await storage.getCustomerProductsByCustomer(req.params.customerId);
      res.json(customerProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customer products" });
    }
  });
  
  app.get("/api/customer-products/:id", async (req: Request, res: Response) => {
    try {
      const customerProduct = await storage.getCustomerProduct(parseInt(req.params.id));
      if (!customerProduct) {
        return res.status(404).json({ message: "Customer product not found" });
      }
      res.json(customerProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customer product" });
    }
  });
  
  app.post("/api/customer-products", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCustomerProductSchema.parse(req.body);
      
      // Verify customer exists
      const customer = await storage.getCustomer(validatedData.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Verify category exists
      const category = await storage.getCategory(validatedData.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Verify item exists
      const item = await storage.getItem(validatedData.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      if (validatedData.masterBatchId) {
        // Verify master batch exists if provided
        const masterBatch = await storage.getMasterBatch(validatedData.masterBatchId);
        if (!masterBatch) {
          return res.status(404).json({ message: "Master batch not found" });
        }
      }
      
      const customerProduct = await storage.createCustomerProduct(validatedData);
      res.status(201).json(customerProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer product" });
    }
  });
  
  app.put("/api/customer-products/:id", async (req: Request, res: Response) => {
    try {
      const existingCustomerProduct = await storage.getCustomerProduct(parseInt(req.params.id));
      if (!existingCustomerProduct) {
        return res.status(404).json({ message: "Customer product not found" });
      }
      
      const validatedData = insertCustomerProductSchema.parse(req.body);
      
      // Verify customer exists
      const customer = await storage.getCustomer(validatedData.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Verify category exists
      const category = await storage.getCategory(validatedData.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Verify item exists
      const item = await storage.getItem(validatedData.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      if (validatedData.masterBatchId) {
        // Verify master batch exists if provided
        const masterBatch = await storage.getMasterBatch(validatedData.masterBatchId);
        if (!masterBatch) {
          return res.status(404).json({ message: "Master batch not found" });
        }
      }
      
      const customerProduct = await storage.updateCustomerProduct(parseInt(req.params.id), validatedData);
      res.json(customerProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer product" });
    }
  });
  
  app.delete("/api/customer-products/:id", async (req: Request, res: Response) => {
    try {
      const customerProduct = await storage.getCustomerProduct(parseInt(req.params.id));
      if (!customerProduct) {
        return res.status(404).json({ message: "Customer product not found" });
      }
      
      await storage.deleteCustomerProduct(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer product" });
    }
  });
  
  // Orders
  app.get("/api/orders", async (_req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });
  
  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order" });
    }
  });
  
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      
      // Verify customer exists
      const customer = await storage.getCustomer(validatedData.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      if (validatedData.userId) {
        // Verify user exists if provided
        const user = await storage.getUser(validatedData.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }
      
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  app.put("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const existingOrder = await storage.getOrder(parseInt(req.params.id));
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // For status updates, we'll accept a simple object with just status
      const statusSchema = z.object({
        status: z.enum(["pending", "processing", "completed"]),
      });
      
      // Try to validate as a status update
      try {
        const { status } = statusSchema.parse(req.body);
        const updatedOrder = await storage.updateOrder(parseInt(req.params.id), { status });
        return res.json(updatedOrder);
      } catch (statusError) {
        // Not a status update, continue with full validation
      }
      
      const validatedData = insertOrderSchema.parse(req.body);
      
      // Verify customer exists
      const customer = await storage.getCustomer(validatedData.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      if (validatedData.userId) {
        // Verify user exists if provided
        const user = await storage.getUser(validatedData.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }
      
      const order = await storage.updateOrder(parseInt(req.params.id), validatedData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });
  
  app.delete("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      console.log(`Attempting to delete order with ID: ${orderId}`);
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        console.log(`Order with ID ${orderId} not found`);
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Let the storage implementation handle cascading delete
      const success = await storage.deleteOrder(orderId);
      
      if (success) {
        return res.status(200).json({ 
          success: true, 
          message: `Order and all associated job orders deleted successfully`
        });
      } else {
        return res.status(500).json({ message: "Failed to delete order" });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      return res.status(500).json({ 
        message: "Failed to delete order", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Job Orders
  app.get("/api/job-orders", async (_req: Request, res: Response) => {
    try {
      const jobOrders = await storage.getJobOrders();
      res.json(jobOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get job orders" });
    }
  });
  
  app.get("/api/orders/:orderId/job-orders", async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const jobOrders = await storage.getJobOrdersByOrder(parseInt(req.params.orderId));
      res.json(jobOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get job orders" });
    }
  });
  
  app.get("/api/job-orders/:id", async (req: Request, res: Response) => {
    try {
      const jobOrder = await storage.getJobOrder(parseInt(req.params.id));
      if (!jobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      res.json(jobOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to get job order" });
    }
  });
  
  app.post("/api/job-orders", async (req: Request, res: Response) => {
    try {
      const validatedData = insertJobOrderSchema.parse(req.body);
      
      // Verify order exists
      const order = await storage.getOrder(validatedData.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify customer product exists
      const customerProduct = await storage.getCustomerProduct(validatedData.customerProductId);
      if (!customerProduct) {
        return res.status(404).json({ message: "Customer product not found" });
      }
      
      const jobOrder = await storage.createJobOrder(validatedData);
      res.status(201).json(jobOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create job order" });
    }
  });
  
  app.put("/api/job-orders/:id", async (req: Request, res: Response) => {
    try {
      const existingJobOrder = await storage.getJobOrder(parseInt(req.params.id));
      if (!existingJobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      // For status updates, we'll accept a simpler object
      if (req.body && typeof req.body === 'object' && 'status' in req.body) {
        const statusSchema = z.object({
          status: z.enum(["pending", "in_progress", "extrusion_completed", "completed", "cancelled"]),
        });
        
        try {
          const { status } = statusSchema.parse(req.body);
          const updatedJobOrder = await storage.updateJobOrder(parseInt(req.params.id), { status });
          return res.json(updatedJobOrder);
        } catch (statusError) {
          // Not a valid status update, continue with full validation
        }
      }
      
      const validatedData = insertJobOrderSchema.parse(req.body);
      
      // Verify order exists
      const order = await storage.getOrder(validatedData.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify customer product exists
      const customerProduct = await storage.getCustomerProduct(validatedData.customerProductId);
      if (!customerProduct) {
        return res.status(404).json({ message: "Customer product not found" });
      }
      
      const jobOrder = await storage.updateJobOrder(parseInt(req.params.id), validatedData);
      res.json(jobOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update job order" });
    }
  });
  
  app.delete("/api/job-orders/:id", async (req: Request, res: Response) => {
    try {
      const jobOrder = await storage.getJobOrder(parseInt(req.params.id));
      if (!jobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      // We're allowing deletion of job orders with rolls now, as the storage layer
      // will handle the cascade deletion
      await storage.deleteJobOrder(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job order" });
    }
  });
  
  // Rolls
  app.get("/api/rolls", async (_req: Request, res: Response) => {
    try {
      const rolls = await storage.getRolls();
      res.json(rolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rolls" });
    }
  });
  
  app.get("/api/job-orders/:jobOrderId/rolls", async (req: Request, res: Response) => {
    try {
      const jobOrder = await storage.getJobOrder(parseInt(req.params.jobOrderId));
      if (!jobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      const rolls = await storage.getRollsByJobOrder(parseInt(req.params.jobOrderId));
      res.json(rolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rolls" });
    }
  });
  
  app.get("/api/rolls/stage/:stage", async (req: Request, res: Response) => {
    try {
      const stage = req.params.stage;
      if (!["extrusion", "printing", "cutting", "completed"].includes(stage)) {
        return res.status(400).json({ message: "Invalid stage" });
      }
      
      const rolls = await storage.getRollsByStage(stage);
      res.json(rolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rolls" });
    }
  });
  
  app.get("/api/rolls/:id", async (req: Request, res: Response) => {
    try {
      const roll = await storage.getRoll(req.params.id);
      if (!roll) {
        return res.status(404).json({ message: "Roll not found" });
      }
      res.json(roll);
    } catch (error) {
      res.status(500).json({ message: "Failed to get roll" });
    }
  });
  
  app.post("/api/rolls", async (req: Request, res: Response) => {
    try {
      console.log("Receiving roll creation request with data:", req.body);
      
      // Use the createRollSchema that omits id and serialNumber
      const validatedData = createRollSchema.parse(req.body);
      console.log("Validated roll data:", validatedData);
      
      // Verify job order exists
      const jobOrder = await storage.getJobOrder(validatedData.jobOrderId);
      if (!jobOrder) {
        console.error(`Job order not found with ID: ${validatedData.jobOrderId}`);
        return res.status(404).json({ message: "Job order not found" });
      }
      console.log("Found job order:", jobOrder);
      
      // Get existing rolls for this job order to generate the next serial number
      const existingRolls = await storage.getRollsByJobOrder(validatedData.jobOrderId);
      const nextSerialNumber = (existingRolls.length + 1).toString();
      console.log(`Next serial number: ${nextSerialNumber}, existing rolls: ${existingRolls.length}`);
      
      // Prepare the complete roll data with auto-generated fields
      // Get the current user ID (using admin for now)
      const currentUserId = "00U1"; // ID of admin user
      
      // Format the ID with padding to ensure uniqueness
      const paddedJobOrderId = String(validatedData.jobOrderId).padStart(4, '0');
      const paddedSerialNumber = nextSerialNumber.padStart(3, '0');
      
      const rollData: InsertRoll = {
        ...validatedData,
        serialNumber: paddedSerialNumber,
        id: `EX-${paddedJobOrderId}-${paddedSerialNumber}`,
        createdById: currentUserId,
        createdAt: new Date()
      };
      console.log("Roll data to be inserted:", rollData);
      
      const roll = await storage.createRoll(rollData);
      console.log("Successfully created roll:", roll);
      res.status(201).json(roll);
    } catch (error) {
      console.error("Error creating roll:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid roll data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create roll" });
    }
  });
  
  app.put("/api/rolls/:id", async (req: Request, res: Response) => {
    try {
      console.log(`Attempting to update roll ID: ${req.params.id} with data:`, req.body);
      
      const existingRoll = await storage.getRoll(req.params.id);
      if (!existingRoll) {
        console.log(`Roll with ID ${req.params.id} not found`);
        return res.status(404).json({ message: "Roll not found" });
      }
      
      console.log(`Found existing roll:`, existingRoll);
      
      // For status and stage updates, we'll accept a simple object
      const statusStageSchema = z.object({
        status: z.enum(["pending", "processing", "completed"]).optional(),
        currentStage: z.enum(["extrusion", "printing", "cutting", "completed"]).optional(),
        extrudingQty: z.number().optional(),
        printingQty: z.number().optional(),
        cuttingQty: z.number().optional(),
        wasteQty: z.number().optional(),
        wastePercentage: z.number().optional(),
        createdById: z.string().optional(),
        printedById: z.string().optional(),
        cutById: z.string().optional(),
      });
      
      // Try to validate as a status/stage update
      try {
        console.log("Attempting to validate as a stage/status update");
        const updateData = statusStageSchema.parse(req.body);
        console.log("Validation succeeded, updating roll with:", updateData);
        
        // If moving to printing stage from extrusion, set printedAt date
        if (existingRoll.currentStage === "extrusion" && updateData.currentStage === "printing") {
          console.log("Adding printedAt date to update data");
          updateData.printedAt = new Date();
        }
        
        // If moving to cutting stage from printing, set cutAt date
        if (existingRoll.currentStage === "printing" && updateData.currentStage === "cutting") {
          console.log("Adding cutAt date to update data");
          updateData.cutAt = new Date();
        }
        
        const updatedRoll = await storage.updateRoll(req.params.id, updateData);
        console.log("Roll successfully updated:", updatedRoll);
        return res.json(updatedRoll);
      } catch (statusError) {
        console.log("Status/stage validation failed:", statusError);
        // Not a status/stage update, continue with full validation
      }
      
      const validatedData = insertRollSchema.parse(req.body);
      
      // Verify job order exists
      const jobOrder = await storage.getJobOrder(validatedData.jobOrderId);
      if (!jobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      const roll = await storage.updateRoll(req.params.id, validatedData);
      res.json(roll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid roll data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update roll" });
    }
  });
  
  app.delete("/api/rolls/:id", async (req: Request, res: Response) => {
    try {
      const roll = await storage.getRoll(req.params.id);
      if (!roll) {
        return res.status(404).json({ message: "Roll not found" });
      }
      
      await storage.deleteRoll(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete roll" });
    }
  });
  
  // Raw Materials
  app.get("/api/raw-materials", async (_req: Request, res: Response) => {
    try {
      const rawMaterials = await storage.getRawMaterials();
      res.json(rawMaterials);
    } catch (error) {
      res.status(500).json({ message: "Failed to get raw materials" });
    }
  });
  
  app.get("/api/raw-materials/:id", async (req: Request, res: Response) => {
    try {
      const rawMaterial = await storage.getRawMaterial(parseInt(req.params.id));
      if (!rawMaterial) {
        return res.status(404).json({ message: "Raw material not found" });
      }
      res.json(rawMaterial);
    } catch (error) {
      res.status(500).json({ message: "Failed to get raw material" });
    }
  });
  
  app.post("/api/raw-materials", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRawMaterialSchema.parse(req.body);
      const rawMaterial = await storage.createRawMaterial(validatedData);
      res.status(201).json(rawMaterial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid raw material data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create raw material" });
    }
  });
  
  app.put("/api/raw-materials/:id", async (req: Request, res: Response) => {
    try {
      const existingRawMaterial = await storage.getRawMaterial(parseInt(req.params.id));
      if (!existingRawMaterial) {
        return res.status(404).json({ message: "Raw material not found" });
      }
      
      const validatedData = insertRawMaterialSchema.parse(req.body);
      const rawMaterial = await storage.updateRawMaterial(parseInt(req.params.id), validatedData);
      res.json(rawMaterial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid raw material data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update raw material" });
    }
  });
  
  app.delete("/api/raw-materials/:id", async (req: Request, res: Response) => {
    try {
      const rawMaterial = await storage.getRawMaterial(parseInt(req.params.id));
      if (!rawMaterial) {
        return res.status(404).json({ message: "Raw material not found" });
      }
      
      await storage.deleteRawMaterial(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete raw material" });
    }
  });
  
  // Final Products
  app.get("/api/final-products", async (_req: Request, res: Response) => {
    try {
      const finalProducts = await storage.getFinalProducts();
      res.json(finalProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get final products" });
    }
  });
  
  app.get("/api/final-products/:id", async (req: Request, res: Response) => {
    try {
      const finalProduct = await storage.getFinalProduct(parseInt(req.params.id));
      if (!finalProduct) {
        return res.status(404).json({ message: "Final product not found" });
      }
      res.json(finalProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to get final product" });
    }
  });
  
  app.post("/api/final-products", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFinalProductSchema.parse(req.body);
      
      // Verify job order exists
      const jobOrder = await storage.getJobOrder(validatedData.jobOrderId);
      if (!jobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      const finalProduct = await storage.createFinalProduct(validatedData);
      res.status(201).json(finalProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid final product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create final product" });
    }
  });
  
  app.put("/api/final-products/:id", async (req: Request, res: Response) => {
    try {
      const existingFinalProduct = await storage.getFinalProduct(parseInt(req.params.id));
      if (!existingFinalProduct) {
        return res.status(404).json({ message: "Final product not found" });
      }
      
      const validatedData = insertFinalProductSchema.parse(req.body);
      
      // Verify job order exists
      const jobOrder = await storage.getJobOrder(validatedData.jobOrderId);
      if (!jobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      const finalProduct = await storage.updateFinalProduct(parseInt(req.params.id), validatedData);
      res.json(finalProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid final product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update final product" });
    }
  });
  
  app.delete("/api/final-products/:id", async (req: Request, res: Response) => {
    try {
      const finalProduct = await storage.getFinalProduct(parseInt(req.params.id));
      if (!finalProduct) {
        return res.status(404).json({ message: "Final product not found" });
      }
      
      await storage.deleteFinalProduct(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete final product" });
    }
  });
  
  // Quality Check Types
  app.get("/api/quality-check-types", async (_req: Request, res: Response) => {
    try {
      const qualityCheckTypes = await storage.getQualityCheckTypes();
      res.json(qualityCheckTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quality check types" });
    }
  });

  app.get("/api/quality-check-types/stage/:stage", async (req: Request, res: Response) => {
    try {
      const stage = req.params.stage;
      const qualityCheckTypes = await storage.getQualityCheckTypesByStage(stage);
      res.json(qualityCheckTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quality check types by stage" });
    }
  });

  app.get("/api/quality-check-types/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const qualityCheckType = await storage.getQualityCheckType(id);
      
      if (!qualityCheckType) {
        return res.status(404).json({ message: "Quality check type not found" });
      }
      
      res.json(qualityCheckType);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quality check type" });
    }
  });

  app.post("/api/quality-check-types", async (req: Request, res: Response) => {
    try {
      const qualityCheckType = await storage.createQualityCheckType(req.body);
      res.status(201).json(qualityCheckType);
    } catch (error) {
      res.status(500).json({ message: "Failed to create quality check type" });
    }
  });

  app.patch("/api/quality-check-types/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const qualityCheckType = await storage.updateQualityCheckType(id, req.body);
      
      if (!qualityCheckType) {
        return res.status(404).json({ message: "Quality check type not found" });
      }
      
      res.json(qualityCheckType);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quality check type" });
    }
  });

  app.delete("/api/quality-check-types/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteQualityCheckType(id);
      
      if (!success) {
        return res.status(404).json({ message: "Quality check type not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quality check type" });
    }
  });

  // Quality Checks
  app.get("/api/quality-checks", async (_req: Request, res: Response) => {
    try {
      const qualityChecks = await storage.getQualityChecks();
      res.json(qualityChecks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quality checks" });
    }
  });

  app.get("/api/quality-checks/roll/:rollId", async (req: Request, res: Response) => {
    try {
      const rollId = req.params.rollId;
      const qualityChecks = await storage.getQualityChecksByRoll(rollId);
      res.json(qualityChecks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quality checks by roll" });
    }
  });

  app.get("/api/quality-checks/job-order/:jobOrderId", async (req: Request, res: Response) => {
    try {
      const jobOrderId = parseInt(req.params.jobOrderId);
      
      if (isNaN(jobOrderId)) {
        return res.status(400).json({ message: "Invalid job order ID" });
      }
      
      const qualityChecks = await storage.getQualityChecksByJobOrder(jobOrderId);
      res.json(qualityChecks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quality checks by job order" });
    }
  });

  app.get("/api/quality-checks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quality check ID" });
      }
      
      const qualityCheck = await storage.getQualityCheck(id);
      
      if (!qualityCheck) {
        return res.status(404).json({ message: "Quality check not found" });
      }
      
      res.json(qualityCheck);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quality check" });
    }
  });

  app.post("/api/quality-checks", async (req: Request, res: Response) => {
    try {
      const qualityCheck = await storage.createQualityCheck(req.body);
      res.status(201).json(qualityCheck);
    } catch (error) {
      res.status(500).json({ message: "Failed to create quality check" });
    }
  });

  app.patch("/api/quality-checks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quality check ID" });
      }
      
      const qualityCheck = await storage.updateQualityCheck(id, req.body);
      
      if (!qualityCheck) {
        return res.status(404).json({ message: "Quality check not found" });
      }
      
      res.json(qualityCheck);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quality check" });
    }
  });

  app.delete("/api/quality-checks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quality check ID" });
      }
      
      const success = await storage.deleteQualityCheck(id);
      
      if (!success) {
        return res.status(404).json({ message: "Quality check not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quality check" });
    }
  });

  // Corrective Actions
  app.get("/api/corrective-actions", async (_req: Request, res: Response) => {
    try {
      const correctiveActions = await storage.getCorrectiveActions();
      res.json(correctiveActions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch corrective actions" });
    }
  });

  app.get("/api/corrective-actions/quality-check/:qualityCheckId", async (req: Request, res: Response) => {
    try {
      const qualityCheckId = parseInt(req.params.qualityCheckId);
      
      if (isNaN(qualityCheckId)) {
        return res.status(400).json({ message: "Invalid quality check ID" });
      }
      
      const correctiveActions = await storage.getCorrectiveActionsByQualityCheck(qualityCheckId);
      res.json(correctiveActions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch corrective actions by quality check" });
    }
  });

  app.get("/api/corrective-actions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid corrective action ID" });
      }
      
      const correctiveAction = await storage.getCorrectiveAction(id);
      
      if (!correctiveAction) {
        return res.status(404).json({ message: "Corrective action not found" });
      }
      
      res.json(correctiveAction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch corrective action" });
    }
  });

  app.post("/api/corrective-actions", async (req: Request, res: Response) => {
    try {
      const correctiveAction = await storage.createCorrectiveAction(req.body);
      res.status(201).json(correctiveAction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create corrective action" });
    }
  });

  app.patch("/api/corrective-actions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid corrective action ID" });
      }
      
      const correctiveAction = await storage.updateCorrectiveAction(id, req.body);
      
      if (!correctiveAction) {
        return res.status(404).json({ message: "Corrective action not found" });
      }
      
      res.json(correctiveAction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update corrective action" });
    }
  });

  app.delete("/api/corrective-actions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid corrective action ID" });
      }
      
      const success = await storage.deleteCorrectiveAction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Corrective action not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete corrective action" });
    }
  });

  // Demo data endpoint - for initializing test data
  app.post("/api/init-demo-data", async (_req: Request, res: Response) => {
    try {
      // Import and use the separated demo data initialization function
      const { initializeDemoData } = await import('./demo-data');
      const result = await initializeDemoData(storage);
      
      if (result.success) {
        res.status(200).json({ message: "Demo data initialized successfully" });
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error("Failed to initialize demo data:", error);
      res.status(500).json({ message: "Failed to initialize demo data", error });
    }
  });

  // CSV Import endpoint
  app.post("/api/import-csv", async (req: Request, res: Response) => {
    try {
      const { entityType } = req.body;
      
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: "No file was uploaded" });
      }
      
      if (!entityType) {
        return res.status(400).json({ message: "Entity type is required" });
      }
      
      const file = req.files.file as fileUpload.UploadedFile;
      const csvData = file.data.toString();
      
      // Import and use the CSV import function
      const { importFromCSV } = await import('./import-utils');
      const result = await importFromCSV(entityType, csvData, storage);
      
      if (result.success === true && 'created' in result) {
        res.status(200).json({ 
          message: "CSV data imported successfully",
          created: result.created,
          updated: result.updated,
          failed: result.failed,
          errors: result.errors && result.errors.length > 0 ? result.errors : undefined
        });
      } else if (result.success === false && 'message' in result) {
        res.status(400).json({ 
          message: result.message,
          errors: result.errors || []
        });
      } else {
        res.status(500).json({ message: "Unknown import result format" });
      }
    } catch (error: any) {
      console.error("Failed to import CSV data:", error);
      res.status(500).json({ message: "Failed to import CSV data", error: error.message });
    }
  });

  // SMS Messages
  app.get("/api/sms-messages", async (_req: Request, res: Response) => {
    try {
      const messages = await storage.getSmsMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get SMS messages" });
    }
  });

  app.get("/api/orders/:orderId/sms-messages", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Verify order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const messages = await storage.getSmsMessagesByOrder(orderId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get SMS messages" });
    }
  });

  app.get("/api/job-orders/:jobOrderId/sms-messages", async (req: Request, res: Response) => {
    try {
      const jobOrderId = parseInt(req.params.jobOrderId);
      if (isNaN(jobOrderId)) {
        return res.status(400).json({ message: "Invalid job order ID" });
      }
      
      // Verify job order exists
      const jobOrder = await storage.getJobOrder(jobOrderId);
      if (!jobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      const messages = await storage.getSmsMessagesByJobOrder(jobOrderId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get SMS messages" });
    }
  });

  app.get("/api/customers/:customerId/sms-messages", async (req: Request, res: Response) => {
    try {
      const customerId = req.params.customerId;
      
      // Verify customer exists
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const messages = await storage.getSmsMessagesByCustomer(customerId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get SMS messages" });
    }
  });

  app.get("/api/sms-messages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid SMS message ID" });
      }
      
      const message = await storage.getSmsMessage(id);
      if (!message) {
        return res.status(404).json({ message: "SMS message not found" });
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to get SMS message" });
    }
  });

  app.post("/api/sms-messages", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSmsMessageSchema.parse(req.body);
      
      // Import and use the SMS service
      const { SmsService } = await import('./services/sms-service');
      
      // Send the SMS using the service
      let result;
      if (validatedData.messageType === 'order_notification' && validatedData.orderId) {
        result = await SmsService.sendOrderNotification(
          validatedData.orderId,
          validatedData.recipientPhone,
          validatedData.message,
          validatedData.sentBy || null,
          validatedData.recipientName || null,
          validatedData.customerId || null
        );
      } else if (validatedData.messageType === 'status_update' && validatedData.jobOrderId) {
        result = await SmsService.sendJobOrderUpdate(
          validatedData.jobOrderId,
          validatedData.recipientPhone,
          validatedData.message,
          validatedData.sentBy || null,
          validatedData.recipientName || null,
          validatedData.customerId || null
        );
      } else {
        result = await SmsService.sendCustomMessage(
          validatedData.recipientPhone,
          validatedData.message,
          validatedData.sentBy || null,
          validatedData.recipientName || null,
          validatedData.customerId || null,
          validatedData.orderId || null,
          validatedData.jobOrderId || null
        );
      }
      
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid SMS message data", errors: error.errors });
      }
      res.status(500).json({ message: `Failed to send SMS message: ${error.message}` });
    }
  });

  app.delete("/api/sms-messages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid SMS message ID" });
      }
      
      const message = await storage.getSmsMessage(id);
      if (!message) {
        return res.status(404).json({ message: "SMS message not found" });
      }
      
      await storage.deleteSmsMessage(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete SMS message" });
    }
  });

  // Mix Materials
  app.get("/api/mix-materials", requireAuth, async (_req: Request, res: Response) => {
    try {
      const mixMaterials = await storage.getMixMaterials();
      
      // Collect all mix IDs to get machine associations
      const mixIds = mixMaterials.map(mix => mix.id);
      
      // Create a map of mixId -> machines for efficient lookup
      const mixMachinesMap = new Map<number, string[]>();
      
      // Process each mix to get its associated machines
      for (const mixId of mixIds) {
        const mixMachines = await storage.getMixMachinesByMixId(mixId);
        const machineIds = mixMachines.map(mm => mm.machineId);
        mixMachinesMap.set(mixId, machineIds);
      }
      
      // Combine mix data with machine information
      const result = mixMaterials.map(mix => ({
        ...mix,
        machines: mixMachinesMap.get(mix.id) || []
      }));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mix materials" });
    }
  });

  app.get("/api/mix-materials/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const mixMaterial = await storage.getMixMaterial(id);
      if (!mixMaterial) {
        return res.status(404).json({ message: "Mix material not found" });
      }
      
      // Get associated machines
      const mixMachines = await storage.getMixMachinesByMixId(id);
      const machineIds = mixMachines.map(mm => mm.machineId);
      
      // Return mix with machine information
      const result = {
        ...mixMaterial,
        machines: machineIds
      };
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mix material" });
    }
  });

  app.post("/api/mix-materials", requireAuth, async (req: Request, res: Response) => {
    try {
      const { machineIds, ...mixData } = req.body;
      const validatedData = insertMixMaterialSchema.parse(mixData);
      
      // Validate orderId if provided
      if (validatedData.orderId) {
        const order = await storage.getOrder(validatedData.orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
      }
      
      // Set mixPerson to current user ID
      if (req.user) {
        validatedData.mixPerson = (req.user as any).id;
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Create the mix material
      const mixMaterial = await storage.createMixMaterial(validatedData);
      
      // Process machine associations if provided
      if (machineIds && Array.isArray(machineIds) && machineIds.length > 0) {
        for (const machineId of machineIds) {
          // Validate machine exists
          const machine = await storage.getMachine(machineId);
          if (!machine) {
            // Skip invalid machines but don't fail the whole operation
            console.warn(`Machine with ID ${machineId} not found. Skipping.`);
            continue;
          }
          
          // Add machine to mix
          await storage.createMixMachine({
            mixId: mixMaterial.id,
            machineId
          });
        }
      }
      
      // Return the created mix with machine information
      const result = {
        ...mixMaterial,
        machines: machineIds || []
      };
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mix material data", errors: error.errors });
      }
      console.error("Error creating mix material:", error);
      res.status(500).json({ message: "Failed to create mix material" });
    }
  });

  app.put("/api/mix-materials/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const existingMixMaterial = await storage.getMixMaterial(id);
      if (!existingMixMaterial) {
        return res.status(404).json({ message: "Mix material not found" });
      }
      
      const { machineIds, ...mixData } = req.body;
      const validatedData = insertMixMaterialSchema.parse(mixData);
      
      // Validate orderId if provided
      if (validatedData.orderId) {
        const order = await storage.getOrder(validatedData.orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
      }
      
      // Update the mix material
      const updatedMixMaterial = await storage.updateMixMaterial(id, validatedData);
      
      // Update machine associations if provided
      if (machineIds !== undefined) {
        // First, remove all existing machine associations
        await storage.deleteMixMachinesByMixId(id);
        
        // Then add the new ones
        if (Array.isArray(machineIds) && machineIds.length > 0) {
          for (const machineId of machineIds) {
            // Validate machine exists
            const machine = await storage.getMachine(machineId);
            if (!machine) {
              // Skip invalid machines but don't fail the whole operation
              console.warn(`Machine with ID ${machineId} not found. Skipping.`);
              continue;
            }
            
            // Add machine to mix
            await storage.createMixMachine({
              mixId: id,
              machineId
            });
          }
        }
      }
      
      // Get current machine associations
      const mixMachines = await storage.getMixMachinesByMixId(id);
      const machineIdsArray = mixMachines.map(mm => mm.machineId);
      
      // Return the updated mix with machine information
      const result = {
        ...updatedMixMaterial,
        machines: machineIdsArray
      };
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mix material data", errors: error.errors });
      }
      console.error("Error updating mix material:", error);
      res.status(500).json({ message: "Failed to update mix material" });
    }
  });

  app.delete("/api/mix-materials/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const mixMaterial = await storage.getMixMaterial(id);
      if (!mixMaterial) {
        return res.status(404).json({ message: "Mix material not found" });
      }
      
      await storage.deleteMixMaterial(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mix material" });
    }
  });

  // Mix Items
  app.get("/api/mix-items", requireAuth, async (_req: Request, res: Response) => {
    try {
      const mixItems = await storage.getMixItems();
      res.json(mixItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mix items" });
    }
  });

  app.get("/api/mix-materials/:mixId/items", requireAuth, async (req: Request, res: Response) => {
    try {
      const mixId = parseInt(req.params.mixId);
      if (isNaN(mixId)) {
        return res.status(400).json({ message: "Invalid mix ID format" });
      }
      
      const mixMaterial = await storage.getMixMaterial(mixId);
      if (!mixMaterial) {
        return res.status(404).json({ message: "Mix material not found" });
      }
      
      const mixItems = await storage.getMixItemsByMix(mixId);
      res.json(mixItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mix items" });
    }
  });

  app.get("/api/mix-items/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const mixItem = await storage.getMixItem(id);
      if (!mixItem) {
        return res.status(404).json({ message: "Mix item not found" });
      }
      
      res.json(mixItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mix item" });
    }
  });

  app.post("/api/mix-items", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertMixItemSchema.parse(req.body);
      
      // Validate mixId
      const mixMaterial = await storage.getMixMaterial(validatedData.mixId);
      if (!mixMaterial) {
        return res.status(404).json({ message: "Mix material not found" });
      }
      
      // Validate rawMaterialId
      const rawMaterial = await storage.getRawMaterial(validatedData.rawMaterialId);
      if (!rawMaterial) {
        return res.status(404).json({ message: "Raw material not found" });
      }
      
      // Validate quantity is greater than zero
      if (validatedData.quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be greater than zero" });
      }
      
      // Validate raw material has enough quantity
      if (rawMaterial.quantity === null || rawMaterial.quantity < validatedData.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity of raw material ${rawMaterial.name}`,
          available: rawMaterial.quantity,
          requested: validatedData.quantity
        });
      }
      
      const mixItem = await storage.createMixItem(validatedData);
      res.status(201).json(mixItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mix item data", errors: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create mix item" });
    }
  });

  app.put("/api/mix-items/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const existingMixItem = await storage.getMixItem(id);
      if (!existingMixItem) {
        return res.status(404).json({ message: "Mix item not found" });
      }
      
      // For updating, only allow quantity to be changed
      const { quantity } = req.body;
      if (quantity === undefined) {
        return res.status(400).json({ message: "Quantity is required" });
      }
      
      if (quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be greater than zero" });
      }
      
      const updatedMixItem = await storage.updateMixItem(id, { quantity });
      res.json(updatedMixItem);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update mix item" });
    }
  });

  app.delete("/api/mix-items/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const mixItem = await storage.getMixItem(id);
      if (!mixItem) {
        return res.status(404).json({ message: "Mix item not found" });
      }
      
      await storage.deleteMixItem(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete mix item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
