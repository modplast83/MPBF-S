import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from './db';
import { adaptToFrontend, adaptToDatabase } from './quality-adapter';
import { 
  insertCategorySchema, insertCustomerSchema, 
  insertItemSchema, insertSectionSchema, insertMachineSchema,
  insertMasterBatchSchema, insertCustomerProductSchema,
  insertOrderSchema, insertJobOrderSchema, insertRollSchema,
  createRollSchema, InsertRoll,
  insertRawMaterialSchema, insertFinalProductSchema,
  insertSmsMessageSchema, InsertSmsMessage,
  insertMixMaterialSchema, insertMixItemSchema,
  insertPermissionSchema, insertMaterialInputSchema,
  insertMaterialInputItemSchema,
  insertPlatePricingParameterSchema, insertPlateCalculationSchema,
  plateCalculationRequestSchema, PlateCalculationRequest,
  User, upsertUserSchema, UpsertUser,
  AbaMaterialConfig, insertAbaMaterialConfigSchema,
  insertTimeAttendanceSchema, insertEmployeeOfMonthSchema,
  insertHrViolationSchema, insertHrComplaintSchema
} from "@shared/schema";
import { z } from "zod";
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import fileUpload from 'express-fileupload';
import { setupAuth } from "./auth";
import { ensureAdminUser } from "./user-seed";
import { setupHRRoutes } from "./hr-routes";
import { setupBottleneckRoutes } from "./bottleneck-routes";

// Extend the Request type to include express-fileupload properties
declare global {
  namespace Express {
    interface Request {
      files?: fileUpload.FileArray | null;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure admin user exists
  try {
    await ensureAdminUser();
    console.log("Admin user check completed");
  } catch (error) {
    console.error("Error during admin user verification:", error);
  }
  
  // Create backups directory if it doesn't exist
  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  
  // Setup authentication
  setupAuth(app);
  
  // Setup HR module routes
  setupHRRoutes(app);
  
  // Setup bottleneck notification system routes
  setupBottleneckRoutes(app);
  
  // User is now handled directly by auth.ts
  
  // Debug endpoint to check session status - using manual response to bypass Vite
  app.get("/api/auth/debug", (req: any, res: Response) => {
    // Set explicit content type to prevent Vite from returning HTML
    res.setHeader('Content-Type', 'application/json');
    
    const isAuthenticated = req.isAuthenticated();
    const sessionData = {
      isAuthenticated,
      session: req.session ? { 
        id: req.session.id,
        cookie: req.session.cookie,
        // Don't expose sensitive data
        hasUser: !!req.user
      } : null,
      user: req.user ? {
        hasClaims: !!req.user.claims,
        hasRefreshToken: !!req.user.refresh_token,
        hasExpiresAt: !!req.user.expires_at,
        claimsSubExists: req.user.claims?.sub ? true : false,
        expiresAt: req.user.expires_at,
        nowTime: Math.floor(Date.now() / 1000),
        tokenExpired: req.user.expires_at ? Math.floor(Date.now() / 1000) > req.user.expires_at : null
      } : null
    };
    
    // Manual response to bypass vite middleware
    const jsonData = JSON.stringify(sessionData);
    res.writeHead(200);
    return res.end(jsonData);
  });
  
  // Setup API routes
  const apiRouter = app.route("/api");
  
  // Authentication middleware for protected routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Skip role checking for testing - TEMPORARY
    // Comment the line below in production
    return next();
    
    // Check if user has admin role
    if (req.user && req.user.role !== "admin" && req.user.role !== "administrator") {
      return res.status(403).json({ message: "Permission denied" });
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
      const validatedData = upsertUserSchema.parse(req.body);
      
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
      
      const user = await storage.upsertUser(validatedData);
      res.status(201).json(user);
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
      
      const validatedData = upsertUserSchema.parse({
        ...req.body,
        id: req.params.id // Ensure the ID is set for the update
      });
      
      if (validatedData.username !== existingUser.username) {
        const usernameExists = await storage.getUserByUsername(validatedData.username);
        if (usernameExists && usernameExists.id !== req.params.id) {
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
      
      const user = await storage.upsertUser(validatedData);
      res.json(user);
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
      console.log("Creating customer with data:", req.body);
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Auto-generate customer ID if not provided
      if (!validatedData.id || validatedData.id.trim() === "") {
        // Get all customers to find the highest CID number
        const allCustomers = await storage.getCustomers();
        let maxNumber = 0;
        
        // Extract numbers from existing customer IDs
        allCustomers.forEach(customer => {
          if (customer.id && customer.id.startsWith("CID")) {
            const numPart = customer.id.substring(3); // Extract after "CID"
            const num = parseInt(numPart, 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        });
        
        // Generate next ID with leading zeros
        const nextNumber = maxNumber + 1;
        validatedData.id = `CID${nextNumber.toString().padStart(4, '0')}`;
        console.log("Auto-generated customer ID:", validatedData.id);
      }
      
      // If code is not provided, use the ID
      if (!validatedData.code || validatedData.code.trim() === "") {
        validatedData.code = validatedData.id;
        console.log("Using ID as code:", validatedData.code);
      }
      
      // Check if customer with same ID already exists
      if (validatedData.id) {
        const existingCustomerId = await storage.getCustomer(validatedData.id);
        if (existingCustomerId) {
          return res.status(409).json({ message: "Customer ID already exists" });
        }
      }
      
      // Check if customer with same code already exists
      if (validatedData.code) {
        const existingCustomerCode = await storage.getCustomerByCode(validatedData.code);
        if (existingCustomerCode) {
          return res.status(409).json({ message: "Customer code already exists" });
        }
      }
      
      // Verify user exists if provided (userId could be null)
      if (validatedData.userId) {
        try {
          console.log("Checking for user:", validatedData.userId);
          const user = await storage.getUser(validatedData.userId);
          if (!user) {
            console.log("User not found:", validatedData.userId);
            return res.status(404).json({ message: `User not found: ${validatedData.userId}` });
          }
        } catch (userError) {
          console.error("Error checking user:", userError);
          return res.status(500).json({ message: `Error validating user: ${userError}` });
        }
      }
      
      // Create the customer
      const customer = await storage.createCustomer(validatedData);
      console.log("Successfully created customer:", customer);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
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
      
      // Verify user exists if provided (userId could be null)
      if (validatedData.userId) {
        try {
          console.log("Checking for user in update:", validatedData.userId);
          const user = await storage.getUser(validatedData.userId);
          if (!user) {
            console.log("User not found in update:", validatedData.userId);
            return res.status(404).json({ message: `User not found: ${validatedData.userId}` });
          }
        } catch (userError) {
          console.error("Error checking user in update:", userError);
          return res.status(500).json({ message: `Error validating user: ${userError}` });
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
  
  // Special endpoint for updating just the order status
  app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Validate status value - include all possible statuses
      if (!["pending", "processing", "hold", "completed", "cancelled", "For Production"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      // Check if order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Update just the status
      const updatedOrder = await storage.updateOrder(orderId, { status });
      return res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      return res.status(500).json({ 
        message: "Failed to update order status", 
        error: error instanceof Error ? error.message : String(error) 
      });
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
      
      // For status updates or quantity updates, we'll accept a simpler object
      if (req.body && typeof req.body === 'object' && ('status' in req.body || 'finishedQty' in req.body || 'receivedQty' in req.body)) {
        const updateSchema = z.object({
          status: z.enum(["pending", "in_progress", "extrusion_completed", "completed", "cancelled", "received", "partially_received"]).optional(),
          finishedQty: z.number().nonnegative().optional(),
          receivedQty: z.number().nonnegative().optional(),
        });
        
        try {
          const updateData = updateSchema.parse(req.body);
          const updatedJobOrder = await storage.updateJobOrder(parseInt(req.params.id), updateData);
          return res.json(updatedJobOrder);
        } catch (updateError) {
          // Not a valid status or finishedQty update, continue with full validation
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
      // Get the current user ID from the authenticated session
      const currentUserId = req.user?.id || req.body.createdById;
      
      // Format the ID with padding to ensure uniqueness
      const paddedJobOrderId = String(validatedData.jobOrderId).padStart(4, '0');
      const paddedSerialNumber = nextSerialNumber.padStart(3, '0');
      
      const rollData: InsertRoll = {
        ...validatedData,
        serialNumber: paddedSerialNumber,
        id: `EX-${paddedJobOrderId}-${paddedSerialNumber}`,
        createdById: currentUserId,
        createdAt: new Date(),
        status: "processing" // Automatically set status to processing instead of the default pending
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
        printedAt: z.date().optional(),
        cutAt: z.date().optional(),
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
        
        // If staying in the same stage but changing from pending to processing status
        // (This is when an operator starts working on a stage)
        if (updateData.status === "processing" && existingRoll.status === "pending") {
          // If starting printing stage, set printedAt
          if (existingRoll.currentStage === "printing") {
            console.log("Setting printedAt to now as printing process is starting");
            updateData.printedAt = new Date();
          }
          
          // If starting cutting stage, set cutAt
          if (existingRoll.currentStage === "cutting") {
            console.log("Setting cutAt to now as cutting process is starting");
            updateData.cutAt = new Date();
          }
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
      
      // Transform database objects to frontend format
      const adaptedCheckTypes = qualityCheckTypes.map(checkType => adaptToFrontend(checkType));
      
      res.json(adaptedCheckTypes);
    } catch (error) {
      console.error("Error fetching quality check types:", error);
      res.status(500).json({ message: "Failed to fetch quality check types" });
    }
  });

  app.get("/api/quality-check-types/stage/:stage", async (req: Request, res: Response) => {
    try {
      const stage = req.params.stage;
      const qualityCheckTypes = await storage.getQualityCheckTypesByStage(stage);
      
      // Transform database objects to frontend format
      const adaptedCheckTypes = qualityCheckTypes.map(checkType => adaptToFrontend(checkType));
      
      res.json(adaptedCheckTypes);
    } catch (error) {
      console.error("Error fetching quality check types by stage:", error);
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
      
      // Transform database object to frontend format
      const adaptedCheckType = adaptToFrontend(qualityCheckType);
      
      res.json(adaptedCheckType);
    } catch (error) {
      console.error("Error fetching quality check type:", error);
      res.status(500).json({ message: "Failed to fetch quality check type" });
    }
  });

  app.post("/api/quality-check-types", async (req: Request, res: Response) => {
    try {
      // Transform frontend data to database format
      const dbFormatData = adaptToDatabase(req.body);
      
      // Create the quality check type in the database
      const qualityCheckType = await storage.createQualityCheckType(dbFormatData);
      
      // Transform the response back to frontend format
      const adaptedResponse = adaptToFrontend(qualityCheckType);
      
      res.status(201).json(adaptedResponse);
    } catch (error) {
      console.error("Error creating quality check type:", error);
      res.status(500).json({ message: "Failed to create quality check type" });
    }
  });

  app.patch("/api/quality-check-types/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      
      // Transform frontend data to database format
      const dbFormatData = adaptToDatabase({...req.body, id});
      
      // Update the quality check type in the database
      const qualityCheckType = await storage.updateQualityCheckType(id, dbFormatData);
      
      if (!qualityCheckType) {
        return res.status(404).json({ message: "Quality check type not found" });
      }
      
      // Transform the response back to frontend format
      const adaptedResponse = adaptToFrontend(qualityCheckType);
      
      res.json(adaptedResponse);
    } catch (error) {
      console.error("Error updating quality check type:", error);
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
      console.log("Fetching quality checks...");
      const qualityChecks = await storage.getQualityChecks();
      console.log("Quality checks from storage:", qualityChecks.length, "records");
      res.json(qualityChecks);
    } catch (error) {
      console.error("Error fetching quality checks:", error);
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
      // Log what's being received
      console.log("Creating quality check with data:", req.body);
      
      // Import the quality check adapter
      const { adaptToDatabase } = await import('./quality-check-adapter');
      
      // Convert frontend data to database format
      const dbQualityCheck = adaptToDatabase(req.body);
      
      // Add timestamps
      dbQualityCheck.checked_at = new Date();
      dbQualityCheck.created_at = new Date();
      
      console.log("Mapped to database fields:", dbQualityCheck);
      
      const qualityCheck = await storage.createQualityCheck(dbQualityCheck);
      res.status(201).json(qualityCheck);
    } catch (error) {
      console.error("Error creating quality check:", error);
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
  
  // Quality Violations
  app.get("/api/quality-violations", async (req: Request, res: Response) => {
    try {
      // Extract query parameters for filtering
      const { qualityCheckId, reportedBy, severity, status, startDate, endDate } = req.query;
      
      let violations;
      if (qualityCheckId) {
        violations = await storage.getQualityViolationsByQualityCheck(parseInt(qualityCheckId as string));
      } else if (reportedBy) {
        violations = await storage.getQualityViolationsByUser(reportedBy as string);
      } else if (severity) {
        violations = await storage.getQualityViolationsBySeverity(severity as string);
      } else if (status) {
        violations = await storage.getQualityViolationsByStatus(status as string);
      } else if (startDate && endDate) {
        violations = await storage.getQualityViolationsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        violations = await storage.getQualityViolations();
      }
      res.json(violations);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch quality violations: ${error}` });
    }
  });
  
  app.get("/api/quality-violations/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid quality violation ID" });
    }
    
    try {
      const violation = await storage.getQualityViolation(id);
      if (!violation) {
        return res.status(404).json({ message: "Quality violation not found" });
      }
      res.json(violation);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch quality violation: ${error}` });
    }
  });
  
  app.post("/api/quality-violations", async (req: Request, res: Response) => {
    try {
      // Set the reportedBy field from the authenticated user if not provided
      if (!req.body.reportedBy && req.user && req.user.id) {
        req.body.reportedBy = req.user.id;
      }
      
      // Validate required fields
      if (!req.body.qualityCheckId) {
        return res.status(400).json({ message: "Quality check ID is required" });
      }
      if (!req.body.violationType) {
        return res.status(400).json({ message: "Violation type is required" });
      }
      if (!req.body.severity) {
        return res.status(400).json({ message: "Severity is required" });
      }
      if (!req.body.description) {
        return res.status(400).json({ message: "Description is required" });
      }
      if (!req.body.affectedArea) {
        return res.status(400).json({ message: "Affected area is required" });
      }
      
      // Ensure status has a default value
      if (!req.body.status) {
        req.body.status = "open";
      }
      
      console.log("Creating quality violation with data:", JSON.stringify(req.body, null, 2));
      
      const violation = await storage.createQualityViolation(req.body);
      res.status(201).json(violation);
    } catch (error) {
      console.error("Quality violation creation error:", error);
      res.status(500).json({ message: `Failed to create quality violation: ${error}` });
    }
  });
  
  app.patch("/api/quality-violations/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid quality violation ID" });
    }
    
    try {
      const updated = await storage.updateQualityViolation(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Quality violation not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: `Failed to update quality violation: ${error}` });
    }
  });
  
  app.delete("/api/quality-violations/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid quality violation ID" });
    }
    
    try {
      const result = await storage.deleteQualityViolation(id);
      if (!result) {
        return res.status(404).json({ message: "Quality violation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: `Failed to delete quality violation: ${error}` });
    }
  });
  
  // Quality Penalties
  app.get("/api/quality-penalties", async (req: Request, res: Response) => {
    try {
      // Extract query parameters for filtering
      const { violationId, assignedTo, penaltyType, status, startDate, endDate } = req.query;
      
      let penalties;
      if (violationId) {
        penalties = await storage.getQualityPenaltiesByViolation(parseInt(violationId as string));
      } else if (assignedTo) {
        penalties = await storage.getQualityPenaltiesByUser(assignedTo as string);
      } else if (penaltyType) {
        penalties = await storage.getQualityPenaltiesByType(penaltyType as string);
      } else if (status) {
        penalties = await storage.getQualityPenaltiesByStatus(status as string);
      } else if (startDate && endDate) {
        penalties = await storage.getQualityPenaltiesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        penalties = await storage.getQualityPenalties();
      }
      res.json(penalties);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch quality penalties: ${error}` });
    }
  });
  
  app.get("/api/quality-penalties/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid quality penalty ID" });
    }
    
    try {
      const penalty = await storage.getQualityPenalty(id);
      if (!penalty) {
        return res.status(404).json({ message: "Quality penalty not found" });
      }
      res.json(penalty);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch quality penalty: ${error}` });
    }
  });
  
  app.post("/api/quality-penalties", async (req: Request, res: Response) => {
    try {
      // Create a copy of the request body for modification
      const penaltyData = { ...req.body };
      
      // Set the assignedBy field from the authenticated user if not provided
      if (!penaltyData.assignedBy) {
        if (req.user && req.user.id) {
          penaltyData.assignedBy = req.user.id;
        } else {
          // Use a default admin ID if user is not authenticated
          penaltyData.assignedBy = "00U1"; // Admin user ID
        }
      }
      
      // Ensure dates are properly formatted as Date objects
      if (penaltyData.startDate && typeof penaltyData.startDate === 'string') {
        penaltyData.startDate = new Date(penaltyData.startDate);
      }
      
      if (penaltyData.endDate && typeof penaltyData.endDate === 'string') {
        penaltyData.endDate = new Date(penaltyData.endDate);
      }
      
      const penalty = await storage.createQualityPenalty(penaltyData);
      res.status(201).json(penalty);
    } catch (error) {
      res.status(500).json({ message: `Failed to create quality penalty: ${error}` });
    }
  });
  
  app.patch("/api/quality-penalties/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid quality penalty ID" });
    }
    
    try {
      // Handle date format conversion for update operations
      const penaltyData = { ...req.body };
      
      if (penaltyData.startDate && typeof penaltyData.startDate === 'string') {
        penaltyData.startDate = new Date(penaltyData.startDate);
      }
      
      if (penaltyData.endDate && typeof penaltyData.endDate === 'string') {
        penaltyData.endDate = new Date(penaltyData.endDate);
      }
      
      if (penaltyData.verificationDate && typeof penaltyData.verificationDate === 'string') {
        penaltyData.verificationDate = new Date(penaltyData.verificationDate);
      }
      
      const updated = await storage.updateQualityPenalty(id, penaltyData);
      if (!updated) {
        return res.status(404).json({ message: "Quality penalty not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: `Failed to update quality penalty: ${error}` });
    }
  });
  
  app.delete("/api/quality-penalties/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid quality penalty ID" });
    }
    
    try {
      const result = await storage.deleteQualityPenalty(id);
      if (!result) {
        return res.status(404).json({ message: "Quality penalty not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: `Failed to delete quality penalty: ${error}` });
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

  // Database Management Endpoints
  const execPromise = promisify(exec);

  // Get available backups
  app.get("/api/database/backups", requireAuth, async (req: Request, res: Response) => {
    try {
      // Role check disabled for testing
      // if (req.user && req.user.role !== "admin" && req.user.role !== "administrator") {
      //   return res.status(403).json({ message: "Permission denied" });
      // }

      const backupsDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      
      const files = fs.readdirSync(backupsDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(backupsDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file.replace('.sql', ''),
            fileName: file,
            size: Math.round(stats.size / 1024), // in KB
            createdAt: stats.birthtime
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort newest first

      res.json(files);
    } catch (error) {
      console.error("Error getting database backups:", error);
      res.status(500).json({ message: "Failed to get database backups" });
    }
  });

  // Create database backup
  app.post("/api/database/backup", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only users with Admin role can access database functions
      if (req.user && req.user.role !== "admin") {
        return res.status(403).json({ message: "Permission denied" });
      }

      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: "Backup name is required" });
      }

      // Sanitize the backup name to be a valid filename
      const sanitizedName = name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${sanitizedName}_${timestamp}.sql`;
      
      const backupsDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      
      const backupPath = path.join(backupsDir, fileName);

      if (process.env.DATABASE_URL) {
        // Extract database details from the URL
        const dbUrl = new URL(process.env.DATABASE_URL);
        const dbName = dbUrl.pathname.substring(1);
        const dbUser = dbUrl.username;
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port;
        
        // Use pg_dump to create a backup
        await execPromise(`PGPASSWORD="${dbUrl.password}" pg_dump --host=${dbHost} --port=${dbPort} --username=${dbUser} --format=plain --file="${backupPath}" ${dbName}`);
      
        res.json({ 
          success: true, 
          message: "Database backup created successfully", 
          backup: {
            name: sanitizedName,
            fileName,
            path: backupPath,
            createdAt: new Date()
          }
        });
      } else {
        throw new Error("DATABASE_URL environment variable is not set");
      }
    } catch (error) {
      console.error("Error creating database backup:", error);
      res.status(500).json({ message: `Failed to create database backup: ${error.message}` });
    }
  });

  // Restore database from backup
  app.post("/api/database/restore", requireAuth, async (req: Request, res: Response) => {
    try {
      // Role check disabled for testing
      // if (req.user && req.user.role !== "admin" && req.user.role !== "administrator") {
      //   return res.status(403).json({ message: "Permission denied" });
      // }

      const { fileName } = req.body;
      
      if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
        return res.status(400).json({ message: "Backup file name is required" });
      }

      const backupsDir = path.join(process.cwd(), "backups");
      const backupPath = path.join(backupsDir, fileName);
      
      // Check if the backup file exists
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ message: "Backup file not found" });
      }

      if (process.env.DATABASE_URL) {
        // Extract database details from the URL
        const dbUrl = new URL(process.env.DATABASE_URL);
        const dbName = dbUrl.pathname.substring(1);
        const dbUser = dbUrl.username;
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port;
        const dbPassword = dbUrl.password;

        // Create a temporary SQL file to handle the drop tables first
        const tempSqlPath = path.join(backupsDir, `temp_${Date.now()}.sql`);
        
        try {
          // First, get a list of all tables to drop
          const tableListCommand = `PGPASSWORD="${dbPassword}" psql --host=${dbHost} --port=${dbPort} --username=${dbUser} --dbname=${dbName} -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"`;
          const tableList = await execPromise(tableListCommand);
          
          // Make sure tableList is a string and process it properly
          const tableListStr = tableList ? tableList.toString() : '';
          
          // Create drop statements for all tables (in reverse order to handle foreign key constraints)
          const tables = tableListStr.trim().split('\n').filter(table => table.trim() !== '');
          
          console.log(`Found ${tables.length} tables to drop before restore`);
          
          if (tables.length > 0) {
            // Create a temporary SQL file with drop statements
            const dropStatements = `
BEGIN;
-- Disable foreign key constraints temporarily
SET session_replication_role = 'replica';

-- Drop all tables
${tables.map(table => `DROP TABLE IF EXISTS "${table.trim()}" CASCADE;`).join('\n')}

-- Re-enable foreign key constraints
SET session_replication_role = 'origin';
COMMIT;
            `;
            
            fs.writeFileSync(tempSqlPath, dropStatements);
            
            // Execute the drop statements
            await execPromise(`PGPASSWORD="${dbPassword}" psql --host=${dbHost} --port=${dbPort} --username=${dbUser} --dbname=${dbName} --file="${tempSqlPath}"`);
          }
          
          // Now restore from the backup file
          await execPromise(`PGPASSWORD="${dbPassword}" psql --host=${dbHost} --port=${dbPort} --username=${dbUser} --dbname=${dbName} --file="${backupPath}"`);
          
          // Clean up the temporary file
          if (fs.existsSync(tempSqlPath)) {
            fs.unlinkSync(tempSqlPath);
          }
          
          // Send successful response
          res.json({ 
            success: true, 
            message: "Database restored successfully. Server will restart to apply changes."
          });
          
          // Close existing connections (after response is sent)
          setTimeout(async () => {
            try {
              await pool.end();
              console.log("Database connections closed");
            } catch (err) {
              console.error("Error closing connections:", err);
            }
            
            // Schedule a server restart after connections are closed
            console.log("Restarting server to apply database restore...");
            process.exit(0); // Exit with success code to trigger restart
          }, 1000);
          
        } catch (err) {
          // Clean up temporary file if it exists
          if (fs.existsSync(tempSqlPath)) {
            fs.unlinkSync(tempSqlPath);
          }
          throw err;
        }
      } else {
        throw new Error("DATABASE_URL environment variable is not set");
      }
    } catch (error) {
      console.error("Error restoring database:", error);
      res.status(500).json({ message: `Failed to restore database: ${error.message}` });
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
      
      // Set mixPerson to current user ID from authentication
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      mixData.mixPerson = (req.user as any).id;
      console.log("Setting mixPerson to user ID:", (req.user as any).id);
      
      // Convert mixDate from string to Date object
      if (typeof mixData.mixDate === 'string') {
        mixData.mixDate = new Date(mixData.mixDate);
        console.log("Converted mixDate to Date object:", mixData.mixDate);
      }
      
      // Validate the modified data
      console.log("Data before validation:", JSON.stringify(mixData));
      let mixMaterialData;
      try {
        mixMaterialData = insertMixMaterialSchema.parse(mixData);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        return res.status(400).json({ 
          message: "Invalid mix material data",
          details: validationError 
        });
      }
      
      // Validate orderId if provided
      if (mixMaterialData.orderId) {
        const order = await storage.getOrder(mixMaterialData.orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
      }
      
      // Create the mix material
      console.log("Validated data for mix material creation:", mixMaterialData);
      const mixMaterial = await storage.createMixMaterial(mixMaterialData);
      
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
        console.error("Zod validation error:", JSON.stringify(error.errors, null, 2));
        console.error("Request body:", JSON.stringify(req.body, null, 2));
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
      
      // Using a transaction to ensure all operations succeed or fail together
      try {
        // 1. Create the mix item
        const mixItem = await storage.createMixItem(validatedData);
        
        // 2. Update the raw material quantity by subtracting the used amount
        const newQuantity = rawMaterial.quantity! - validatedData.quantity;
        await storage.updateRawMaterial(validatedData.rawMaterialId, {
          quantity: newQuantity,
          lastUpdated: new Date()
        });
        
        // 3. Get all mix items to recalculate percentages
        const allMixItems = await storage.getMixItemsByMix(validatedData.mixId);
        
        // 4. Calculate total weight
        const totalWeight = allMixItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // 5. Update all items with correct percentages
        for (const item of allMixItems) {
          const percentage = (item.quantity / totalWeight) * 100;
          await storage.updateMixItem(item.id, { percentage });
        }
        
        // 6. Update the mix total quantity
        await storage.updateMixMaterial(validatedData.mixId, { totalQuantity: totalWeight });
        
        // 7. Get the updated item with correct percentage
        const updatedMixItem = await storage.getMixItem(mixItem.id);
        
        res.status(201).json(updatedMixItem);
      } catch (error) {
        console.error("Error during mix item creation:", error);
        throw error;
      }
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
      
      // Get the raw material
      const rawMaterial = await storage.getRawMaterial(existingMixItem.rawMaterialId);
      if (!rawMaterial) {
        return res.status(404).json({ message: "Raw material not found" });
      }
      
      // Calculate the quantity difference
      const quantityDifference = quantity - existingMixItem.quantity;
      
      // Check if we have enough raw material for the increase
      if (quantityDifference > 0) {
        const availableQuantity = rawMaterial.quantity !== null ? rawMaterial.quantity : 0;
        if (availableQuantity < quantityDifference) {
          return res.status(400).json({ 
            message: `Insufficient quantity of raw material ${rawMaterial.name}`,
            available: availableQuantity,
            requested: quantityDifference
          });
        }
      }
      
      try {
        // 1. Update the mix item
        const updatedMixItem = await storage.updateMixItem(id, { quantity });
        
        // 2. Update the raw material quantity
        // If quantityDifference is positive, we're using more raw material
        // If negative, we're returning some to inventory
        const newRawMaterialQuantity = (rawMaterial.quantity || 0) - quantityDifference;
        await storage.updateRawMaterial(existingMixItem.rawMaterialId, {
          quantity: newRawMaterialQuantity,
          lastUpdated: new Date()
        });
        
        // 3. Get all mix items to recalculate percentages
        const allMixItems = await storage.getMixItemsByMix(existingMixItem.mixId);
        
        // 4. Calculate total weight
        const totalWeight = allMixItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // 5. Update all items with correct percentages
        for (const item of allMixItems) {
          const percentage = (item.quantity / totalWeight) * 100;
          if (item.id !== id) { // Skip the just-updated item to avoid race condition
            await storage.updateMixItem(item.id, { percentage });
          }
        }
        
        // 6. Update the just-changed item's percentage last
        const finalPercentage = (quantity / totalWeight) * 100;
        const finalUpdatedItem = await storage.updateMixItem(id, { percentage: finalPercentage });
        
        // 7. Update the mix total quantity
        await storage.updateMixMaterial(existingMixItem.mixId, { totalQuantity: totalWeight });
        
        res.json(finalUpdatedItem);
      } catch (error) {
        console.error("Error during mix item update:", error);
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update mix item" });
    }
  });

  // Performance metrics endpoint for dashboard optimization
  app.get("/api/performance-metrics", requireAuth, async (_req: Request, res: Response) => {
    try {
      const rolls = await storage.getRolls();
      const orders = await storage.getOrders();
      const jobOrders = await storage.getJobOrders();
      const qualityChecks = await storage.getQualityChecks();
      
      // Calculate processing times
      const rollProcessingTimes = rolls
        .filter(roll => roll.createdAt && (roll.printedAt || roll.cutAt))
        .map(roll => {
          // Calculate processing time for different stages
          const extrusionToNextStage = roll.printedAt ? 
            (new Date(roll.printedAt).getTime() - new Date(roll.createdAt).getTime()) : 
            (roll.cutAt ? (new Date(roll.cutAt).getTime() - new Date(roll.createdAt).getTime()) : 0);
          
          // Calculate printing to cutting if available
          const printingToCutting = (roll.printedAt && roll.cutAt) ? 
            (new Date(roll.cutAt).getTime() - new Date(roll.printedAt).getTime()) : 0;
          
          return {
            rollId: roll.id,
            jobOrderId: roll.jobOrderId,
            extrusionToNextStage: extrusionToNextStage / (1000 * 60 * 60), // hours
            printingToCutting: printingToCutting / (1000 * 60 * 60), // hours
            totalProcessingTime: (extrusionToNextStage + printingToCutting) / (1000 * 60 * 60), // hours
            currentStage: roll.currentStage,
            status: roll.status,
            extrudingQty: roll.extrudingQty || 0,
            printingQty: roll.printingQty || 0,
            cuttingQty: roll.cuttingQty || 0,
            wasteQty: roll.wasteQty || 0,
            wastePercentage: roll.wastePercentage || 0
          };
        });
      
      // Calculate average processing times
      const avgExtrusionToNextStage = rollProcessingTimes.length > 0 ? 
        rollProcessingTimes.reduce((sum, item) => sum + item.extrusionToNextStage, 0) / rollProcessingTimes.length : 0;
      
      const avgPrintingToCutting = rollProcessingTimes.filter(item => item.printingToCutting > 0).length > 0 ?
        rollProcessingTimes.reduce((sum, item) => sum + item.printingToCutting, 0) / 
        rollProcessingTimes.filter(item => item.printingToCutting > 0).length : 0;
      
      const avgTotalProcessingTime = rollProcessingTimes.length > 0 ?
        rollProcessingTimes.reduce((sum, item) => sum + item.totalProcessingTime, 0) / rollProcessingTimes.length : 0;
      
      // Calculate waste statistics
      const totalWasteQty = rollProcessingTimes.reduce((sum, item) => sum + item.wasteQty, 0);
      const totalExtrudingQty = rollProcessingTimes.reduce((sum, item) => sum + item.extrudingQty, 0);
      const overallWastePercentage = totalExtrudingQty > 0 ? (totalWasteQty / totalExtrudingQty) * 100 : 0;
      
      // Calculate order fulfillment time
      const completedOrders = orders.filter(order => order.status === "completed");
      const orderFulfillmentTimes = completedOrders.map(order => {
        const orderJobOrders = jobOrders.filter(jo => jo.orderId === order.id);
        const orderRolls = rolls.filter(roll => 
          orderJobOrders.some(jo => jo.id === roll.jobOrderId) && roll.status === "completed"
        );
        
        // Find earliest and latest timestamps for this order
        const timestamps = orderRolls
          .flatMap(roll => [
            roll.createdAt ? new Date(roll.createdAt).getTime() : null,
            roll.cutAt ? new Date(roll.cutAt).getTime() : null
          ])
          .filter(ts => ts !== null) as number[];
        
        if (timestamps.length > 0) {
          const earliestTimestamp = Math.min(...timestamps);
          const latestTimestamp = Math.max(...timestamps);
          return {
            orderId: order.id,
            fulfillmentTime: (latestTimestamp - earliestTimestamp) / (1000 * 60 * 60 * 24) // days
          };
        }
        return null;
      }).filter(item => item !== null) as { orderId: number, fulfillmentTime: number }[];
      
      const avgOrderFulfillmentTime = orderFulfillmentTimes.length > 0 ?
        orderFulfillmentTimes.reduce((sum, item) => sum + item.fulfillmentTime, 0) / orderFulfillmentTimes.length : 0;
      
      // Calculate quality metrics
      const totalQualityChecks = qualityChecks.length;
      const failedQualityChecks = qualityChecks.filter(check => check.status === "failed").length;
      const qualityFailureRate = totalQualityChecks > 0 ? (failedQualityChecks / totalQualityChecks) * 100 : 0;
      
      // Mobile performance metrics
      const recentRolls = rolls
        .filter(roll => roll.createdAt)
        .sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 20);
      
      const recentProcessingTimes = recentRolls
        .filter(roll => roll.createdAt && (roll.printedAt || roll.cutAt))
        .map(roll => {
          const extrusionToNextStage = roll.printedAt ? 
            (new Date(roll.printedAt).getTime() - new Date(roll.createdAt).getTime()) : 
            (roll.cutAt ? (new Date(roll.cutAt).getTime() - new Date(roll.createdAt).getTime()) : 0);
          
          return {
            rollId: roll.id,
            processingTime: extrusionToNextStage / (1000 * 60 * 60), // hours
            stage: roll.currentStage,
            date: roll.createdAt
          };
        });
        
      // Calculate throughput - rolls per day over time
      const calculateThroughput = (rolls: any[]) => {
        // Get completed rolls with timestamps
        const completedRolls = rolls.filter(r => r.status === "completed" && r.cutAt);
        
        if (completedRolls.length === 0) return [];
        
        // Sort by completion date
        completedRolls.sort((a, b) => 
          new Date(a.cutAt || 0).getTime() - new Date(b.cutAt || 0).getTime()
        );
        
        // Group by day
        const rollsByDay = completedRolls.reduce((acc, roll) => {
          const date = new Date(roll.cutAt || 0);
          const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          
          acc[dateKey].push(roll);
          return acc;
        }, {} as Record<string, any[]>);
        
        // Convert to array format
        return Object.entries(rollsByDay).map(([date, dayRolls]) => ({
          date,
          count: dayRolls.length,
          totalWeight: dayRolls.reduce((sum, r) => sum + (r.cuttingQty || 0), 0)
        }));
      };
      
      // Return the metrics
      res.json({
        processingTimes: {
          avgExtrusionToNextStage,
          avgPrintingToCutting,
          avgTotalProcessingTime,
          recentProcessingTimes
        },
        wasteMetrics: {
          totalWasteQty,
          overallWastePercentage,
          rollProcessingTimes: rollProcessingTimes.map(item => ({
            rollId: item.rollId,
            wasteQty: item.wasteQty,
            wastePercentage: item.wastePercentage
          }))
        },
        orderMetrics: {
          avgOrderFulfillmentTime,
          orderFulfillmentTimes
        },
        qualityMetrics: {
          totalQualityChecks,
          failedQualityChecks,
          qualityFailureRate
        },
        rollsData: rollProcessingTimes,
        throughput: calculateThroughput(rolls),
        // Mobile-specific metrics (more summarized)
        mobileMetrics: {
          avgProcessingTime: avgTotalProcessingTime,
          avgOrderFulfillment: avgOrderFulfillmentTime,
          wastePercentage: overallWastePercentage,
          qualityFailureRate,
          recentProcessingTimes
        }
      });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
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
      
      // Get the raw material to restore its quantity
      const rawMaterial = await storage.getRawMaterial(mixItem.rawMaterialId);
      if (!rawMaterial) {
        return res.status(404).json({ message: "Raw material not found" });
      }
      
      try {
        // Using a transaction to ensure all operations succeed or fail together
        // Save the mixId before deleting the item
        const mixId = mixItem.mixId;
        
        // 1. Delete the mix item
        await storage.deleteMixItem(id);
        
        // 2. Restore the raw material quantity by adding back the amount that was used
        const newQuantity = (rawMaterial.quantity || 0) + mixItem.quantity;
        await storage.updateRawMaterial(mixItem.rawMaterialId, {
          quantity: newQuantity,
          lastUpdated: new Date()
        });
        
        // 3. Get remaining mix items to recalculate percentages
        const remainingItems = await storage.getMixItemsByMix(mixId);
        
        // 4. Calculate new total weight
        const totalWeight = remainingItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // 5. Update all remaining items with correct percentages
        for (const item of remainingItems) {
          const percentage = totalWeight > 0 ? (item.quantity / totalWeight) * 100 : 0;
          await storage.updateMixItem(item.id, { percentage });
        }
        
        // 6. Update the mix total quantity
        await storage.updateMixMaterial(mixId, { totalQuantity: totalWeight });
        
        res.status(204).send();
      } catch (error) {
        console.error("Error during mix item deletion:", error);
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete mix item" });
    }
  });

  // Permissions
  app.get("/api/permissions", requireAuth, async (_req: Request, res: Response) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get permissions" });
    }
  });

  app.get("/api/permissions/role/:role", requireAuth, async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getPermissionsByRole(req.params.role);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get role permissions" });
    }
  });



  app.post("/api/permissions", requireAuth, async (req: Request, res: Response) => {
    try {
      // Make sure only administrators can add permissions
      if (req.user && (req.user as any).role !== "administrator") {
        return res.status(403).json({ message: "Only administrators can manage permissions" });
      }

      // Define expected fields
      const createSchema = z.object({
        role: z.string(),
        module: z.string(),
        can_view: z.boolean().optional(),
        can_create: z.boolean().optional(),
        can_edit: z.boolean().optional(), 
        can_delete: z.boolean().optional(),
        is_active: z.boolean().optional(),
        // Also accept camelCase versions
        canView: z.boolean().optional(),
        canCreate: z.boolean().optional(),
        canEdit: z.boolean().optional(),
        canDelete: z.boolean().optional(),
        isActive: z.boolean().optional()
      });

      // Validate the request body
      const rawData = createSchema.parse(req.body);
      
      // Convert camelCase to snake_case if needed
      const validatedData: Record<string, any> = {
        role: rawData.role,
        module: rawData.module
      };
      
      // Handle each field, preferring snake_case if both formats are present
      if (rawData.can_view !== undefined) validatedData.can_view = rawData.can_view;
      else if (rawData.canView !== undefined) validatedData.can_view = rawData.canView;
      
      if (rawData.can_create !== undefined) validatedData.can_create = rawData.can_create;
      else if (rawData.canCreate !== undefined) validatedData.can_create = rawData.canCreate;
      
      if (rawData.can_edit !== undefined) validatedData.can_edit = rawData.can_edit;
      else if (rawData.canEdit !== undefined) validatedData.can_edit = rawData.canEdit;
      
      if (rawData.can_delete !== undefined) validatedData.can_delete = rawData.can_delete;
      else if (rawData.canDelete !== undefined) validatedData.can_delete = rawData.canDelete;
      
      if (rawData.is_active !== undefined) validatedData.is_active = rawData.is_active;
      else if (rawData.isActive !== undefined) validatedData.is_active = rawData.isActive;
      
      console.log("Creating permission with data:", JSON.stringify(validatedData));
      
      // Use the validated data to create the permission
      try {
        const permission = await storage.createPermission(validatedData);
        
        // Transform to camelCase for client compatibility
        const transformedPermission = {
          id: permission.id,
          role: permission.role,
          module: permission.module,
          canView: permission.can_view,
          canCreate: permission.can_create,
          canEdit: permission.can_edit,
          canDelete: permission.can_delete,
          isActive: permission.is_active
        };
        
        res.status(201).json(transformedPermission);
      } catch (createError) {
        console.error("SQL create error:", createError);
        return res.status(500).json({ message: "Database error creating permission", error: String(createError) });
      }
    } catch (error) {
      console.error("Permission creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid permission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create permission" });
    }
  });

  app.put("/api/permissions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      // Make sure only administrators can update permissions
      if (req.user && (req.user as any).role !== "administrator") {
        return res.status(403).json({ message: "Only administrators can manage permissions" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Define a schema for validated fields that might be updated
      const updateSchema = z.object({
        can_view: z.boolean().optional(),
        can_create: z.boolean().optional(),
        can_edit: z.boolean().optional(),
        can_delete: z.boolean().optional(),
        is_active: z.boolean().optional(),
        canView: z.boolean().optional(), // Also accept camelCase format
        canCreate: z.boolean().optional(),
        canEdit: z.boolean().optional(),
        canDelete: z.boolean().optional(),
        isActive: z.boolean().optional(),
        role: z.string().optional(),
        module: z.string().optional()
      });

      // Validate the request body
      const rawData = updateSchema.parse(req.body);
      
      // Convert camelCase to snake_case if needed
      const validatedData: Record<string, any> = {};
      
      // Handle each field, preferring snake_case if both formats are present
      if (rawData.can_view !== undefined) validatedData.can_view = rawData.can_view;
      else if (rawData.canView !== undefined) validatedData.can_view = rawData.canView;
      
      if (rawData.can_create !== undefined) validatedData.can_create = rawData.can_create;
      else if (rawData.canCreate !== undefined) validatedData.can_create = rawData.canCreate;
      
      if (rawData.can_edit !== undefined) validatedData.can_edit = rawData.can_edit;
      else if (rawData.canEdit !== undefined) validatedData.can_edit = rawData.canEdit;
      
      if (rawData.can_delete !== undefined) validatedData.can_delete = rawData.can_delete;
      else if (rawData.canDelete !== undefined) validatedData.can_delete = rawData.canDelete;
      
      if (rawData.is_active !== undefined) validatedData.is_active = rawData.is_active;
      else if (rawData.isActive !== undefined) validatedData.is_active = rawData.isActive;
      
      // Direct pass-through for role and module
      if (rawData.role !== undefined) validatedData.role = rawData.role;
      if (rawData.module !== undefined) validatedData.module = rawData.module;
      
      console.log(`Updating permission ${id} with data:`, JSON.stringify(validatedData));
      
      if (Object.keys(validatedData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      // Get the existing permission to confirm it exists
      const existingPermission = await storage.getPermission(id);
      if (!existingPermission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      // Send the validated data to storage
      try {
        const permission = await storage.updatePermission(id, validatedData);
        
        if (!permission) {
          return res.status(404).json({ message: "Failed to update permission" });
        }
        
        // Transform to camelCase for client compatibility
        const transformedPermission = {
          id: permission.id,
          role: permission.role,
          module: permission.module,
          canView: permission.can_view,
          canCreate: permission.can_create,
          canEdit: permission.can_edit,
          canDelete: permission.can_delete,
          isActive: permission.is_active
        };
        
        res.json(transformedPermission);
      } catch (updateError) {
        console.error("SQL update error:", updateError);
        return res.status(500).json({ message: "Database error updating permission", error: String(updateError) });
      }
    } catch (error) {
      console.error("Permission update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid permission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update permission", error: String(error) });
    }
  });

  app.delete("/api/permissions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      // Make sure only administrators can delete permissions
      if (req.user && (req.user as any).role !== "administrator") {
        return res.status(403).json({ message: "Only administrators can manage permissions" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      await storage.deletePermission(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  // Material Inputs API endpoints
  app.get("/api/material-inputs", requireAuth, async (req: Request, res: Response) => {
    try {
      const materialInputs = await storage.getMaterialInputs();
      res.json(materialInputs);
    } catch (error) {
      console.error("Error getting material inputs:", error);
      res.status(500).json({ message: "Failed to get material inputs" });
    }
  });

  app.get("/api/material-inputs/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const materialInput = await storage.getMaterialInput(id);
      if (!materialInput) {
        return res.status(404).json({ message: "Material input not found" });
      }

      res.json(materialInput);
    } catch (error) {
      console.error("Error getting material input:", error);
      res.status(500).json({ message: "Failed to get material input" });
    }
  });

  app.get("/api/material-inputs/:id/items", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const items = await storage.getMaterialInputItemsByInput(id);
      res.json(items);
    } catch (error) {
      console.error("Error getting material input items:", error);
      res.status(500).json({ message: "Failed to get material input items" });
    }
  });

  app.post("/api/material-inputs", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Prepare the validated data
      const inputData = {
        userId: req.user.id,
        notes: req.body.notes
      };
      
      // Create the material input
      const materialInput = await storage.createMaterialInput(inputData);

      // Add items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const itemData of req.body.items) {
          // Prepare the item data
          const inputItemData = {
            inputId: materialInput.id,
            rawMaterialId: itemData.rawMaterialId,
            quantity: itemData.quantity
          };
          
          // Create the input item
          await storage.createMaterialInputItem(inputItemData);
          
          // Update the raw material quantity
          const rawMaterial = await storage.getRawMaterial(inputItemData.rawMaterialId);
          if (rawMaterial) {
            const updatedQuantity = (rawMaterial.quantity || 0) + inputItemData.quantity;
            await storage.updateRawMaterial(inputItemData.rawMaterialId, {
              quantity: updatedQuantity,
              lastUpdated: new Date()
            });
          }
        }
      }
      
      res.status(201).json(materialInput);
    } catch (error) {
      console.error("Error creating material input:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid material input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create material input", error: String(error) });
    }
  });

  app.delete("/api/material-inputs/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Get the items to revert raw material quantities
      const items = await storage.getMaterialInputItemsByInput(id);
      
      // Revert raw material quantities for each item
      for (const item of items) {
        const rawMaterial = await storage.getRawMaterial(item.rawMaterialId);
        if (rawMaterial && rawMaterial.quantity) {
          const updatedQuantity = Math.max(0, rawMaterial.quantity - item.quantity);
          await storage.updateRawMaterial(item.rawMaterialId, {
            quantity: updatedQuantity,
            lastUpdated: new Date()
          });
        }
      }
      
      // Delete the material input (this will cascade delete the items)
      await storage.deleteMaterialInput(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting material input:", error);
      res.status(500).json({ message: "Failed to delete material input" });
    }
  });

  // Cliché (Plate) Pricing Parameters API endpoints
  app.get("/api/plate-pricing-parameters", async (_req: Request, res: Response) => {
    try {
      const parameters = await storage.getPlatePricingParameters();
      res.json(parameters);
    } catch (error) {
      console.error("Error getting plate pricing parameters:", error);
      res.status(500).json({ message: "Failed to get plate pricing parameters" });
    }
  });

  app.get("/api/plate-pricing-parameters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid parameter ID" });
      }
      
      const parameter = await storage.getPlatePricingParameter(id);
      if (!parameter) {
        return res.status(404).json({ message: "Plate pricing parameter not found" });
      }
      res.json(parameter);
    } catch (error) {
      console.error("Error getting plate pricing parameter:", error);
      res.status(500).json({ message: "Failed to get plate pricing parameter" });
    }
  });

  app.post("/api/plate-pricing-parameters", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPlatePricingParameterSchema.parse(req.body);
      const parameter = await storage.createPlatePricingParameter(validatedData);
      res.status(201).json(parameter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid parameter data", errors: error.errors });
      }
      console.error("Error creating plate pricing parameter:", error);
      res.status(500).json({ message: "Failed to create plate pricing parameter" });
    }
  });

  app.put("/api/plate-pricing-parameters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid parameter ID" });
      }
      
      const existingParameter = await storage.getPlatePricingParameter(id);
      if (!existingParameter) {
        return res.status(404).json({ message: "Plate pricing parameter not found" });
      }
      
      const validatedData = insertPlatePricingParameterSchema.parse(req.body);
      const parameter = await storage.updatePlatePricingParameter(id, validatedData);
      res.json(parameter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid parameter data", errors: error.errors });
      }
      console.error("Error updating plate pricing parameter:", error);
      res.status(500).json({ message: "Failed to update plate pricing parameter" });
    }
  });

  app.delete("/api/plate-pricing-parameters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid parameter ID" });
      }
      
      const parameter = await storage.getPlatePricingParameter(id);
      if (!parameter) {
        return res.status(404).json({ message: "Plate pricing parameter not found" });
      }
      
      await storage.deletePlatePricingParameter(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting plate pricing parameter:", error);
      res.status(500).json({ message: "Failed to delete plate pricing parameter" });
    }
  });

  // Plate Calculations API endpoints
  app.get("/api/plate-calculations", async (_req: Request, res: Response) => {
    try {
      const calculations = await storage.getPlateCalculations();
      res.json(calculations);
    } catch (error) {
      console.error("Error getting plate calculations:", error);
      res.status(500).json({ message: "Failed to get plate calculations" });
    }
  });

  app.get("/api/customers/:customerId/plate-calculations", async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.params.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const calculations = await storage.getPlateCalculationsByCustomer(req.params.customerId);
      res.json(calculations);
    } catch (error) {
      console.error("Error getting plate calculations for customer:", error);
      res.status(500).json({ message: "Failed to get plate calculations" });
    }
  });

  app.get("/api/plate-calculations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }
      
      const calculation = await storage.getPlateCalculation(id);
      if (!calculation) {
        return res.status(404).json({ message: "Plate calculation not found" });
      }
      res.json(calculation);
    } catch (error) {
      console.error("Error getting plate calculation:", error);
      res.status(500).json({ message: "Failed to get plate calculation" });
    }
  });

  app.post("/api/plate-calculations", async (req: Request, res: Response) => {
    try {
      // Validate using the request schema first
      const requestData = plateCalculationRequestSchema.parse(req.body);
      
      // If customerId is provided, verify it exists
      if (requestData.customerId) {
        const customer = await storage.getCustomer(requestData.customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      // Get user information from session for tracking who created this calculation
      const userId = req.user ? (req.user as any).id : undefined;
      
      // Create calculation with validated data
      const calculationData = {
        ...requestData,
        createdById: userId
      };
      
      const calculation = await storage.createPlateCalculation(calculationData);
      res.status(201).json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid calculation data", errors: error.errors });
      }
      console.error("Error creating plate calculation:", error);
      res.status(500).json({ message: "Failed to create plate calculation" });
    }
  });

  app.put("/api/plate-calculations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }
      
      const existingCalculation = await storage.getPlateCalculation(id);
      if (!existingCalculation) {
        return res.status(404).json({ message: "Plate calculation not found" });
      }
      
      // Validate using the request schema
      const requestData = plateCalculationRequestSchema.parse(req.body);
      
      // If customerId is changed, verify the new one exists
      if (requestData.customerId && requestData.customerId !== existingCalculation.customerId) {
        const customer = await storage.getCustomer(requestData.customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      const calculation = await storage.updatePlateCalculation(id, requestData);
      res.json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid calculation data", errors: error.errors });
      }
      console.error("Error updating plate calculation:", error);
      res.status(500).json({ message: "Failed to update plate calculation" });
    }
  });

  app.delete("/api/plate-calculations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }
      
      const calculation = await storage.getPlateCalculation(id);
      if (!calculation) {
        return res.status(404).json({ message: "Plate calculation not found" });
      }
      
      await storage.deletePlateCalculation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting plate calculation:", error);
      res.status(500).json({ message: "Failed to delete plate calculation" });
    }
  });
  
  // ABA Material Configurations API endpoints
  app.get("/api/aba-material-configs", async (_req: Request, res: Response) => {
    try {
      const configs = await storage.getAbaMaterialConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error getting ABA material configs:", error);
      res.status(500).json({ message: "Failed to get ABA material configs" });
    }
  });
  
  app.get("/api/aba-material-configs/default", async (_req: Request, res: Response) => {
    try {
      const config = await storage.getDefaultAbaMaterialConfig();
      if (!config) {
        return res.status(404).json({ message: "No default ABA material config found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error getting default ABA material config:", error);
      res.status(500).json({ message: "Failed to get default ABA material config" });
    }
  });
  
  app.get("/api/aba-material-configs/user/:userId", async (req: Request, res: Response) => {
    try {
      const configs = await storage.getAbaMaterialConfigsByUser(req.params.userId);
      res.json(configs);
    } catch (error) {
      console.error("Error getting ABA material configs by user:", error);
      res.status(500).json({ message: "Failed to get ABA material configs" });
    }
  });
  
  app.get("/api/aba-material-configs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid config ID" });
      }
      
      const config = await storage.getAbaMaterialConfig(id);
      if (!config) {
        return res.status(404).json({ message: "ABA material config not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error getting ABA material config:", error);
      res.status(500).json({ message: "Failed to get ABA material config" });
    }
  });
  
  app.post("/api/aba-material-configs", async (req: Request, res: Response) => {
    try {
      // Get user information from session for tracking who created this config
      if (!req.user) {
        return res.status(401).json({ message: "You must be logged in to create a config" });
      }
      const userId = (req.user as any).id;
      
      const { name, description, configData, isDefault } = req.body;
      
      if (!name || !configData) {
        return res.status(400).json({ message: "Name and configData are required" });
      }
      
      const newConfig = await storage.createAbaMaterialConfig({
        name,
        description,
        createdBy: userId,
        configData,
        isDefault: isDefault || false
      });
      
      res.status(201).json(newConfig);
    } catch (error) {
      console.error("Error creating ABA material config:", error);
      res.status(500).json({ message: "Failed to create ABA material config" });
    }
  });
  
  app.put("/api/aba-material-configs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid config ID" });
      }
      
      const config = await storage.getAbaMaterialConfig(id);
      if (!config) {
        return res.status(404).json({ message: "ABA material config not found" });
      }
      
      // Only allow the creator or admins to update
      if (req.user && (req.user as any).id !== config.createdBy && (req.user as any).role !== 'administrator') {
        return res.status(403).json({ message: "You don't have permission to update this config" });
      }
      
      const { name, description, configData, isDefault } = req.body;
      
      const updates: Partial<AbaMaterialConfig> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (configData !== undefined) updates.configData = configData;
      if (isDefault !== undefined) updates.isDefault = isDefault;
      
      const updatedConfig = await storage.updateAbaMaterialConfig(id, updates);
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating ABA material config:", error);
      res.status(500).json({ message: "Failed to update ABA material config" });
    }
  });
  
  app.delete("/api/aba-material-configs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid config ID" });
      }
      
      const config = await storage.getAbaMaterialConfig(id);
      if (!config) {
        return res.status(404).json({ message: "ABA material config not found" });
      }
      
      // Only allow the creator or admins to delete
      if (req.user && (req.user as any).id !== config.createdBy && (req.user as any).role !== 'administrator') {
        return res.status(403).json({ message: "You don't have permission to delete this config" });
      }
      
      await storage.deleteAbaMaterialConfig(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ABA material config:", error);
      res.status(500).json({ message: "Failed to delete ABA material config" });
    }
  });
  
  app.post("/api/aba-material-configs/:id/set-default", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid config ID" });
      }
      
      const config = await storage.getAbaMaterialConfig(id);
      if (!config) {
        return res.status(404).json({ message: "ABA material config not found" });
      }
      
      // Only allow the creator or admins to set as default
      if (req.user && (req.user as any).id !== config.createdBy && (req.user as any).role !== 'administrator') {
        return res.status(403).json({ message: "You don't have permission to set this config as default" });
      }
      
      await storage.setDefaultAbaMaterialConfig(id);
      res.json({ message: "Config set as default successfully" });
    } catch (error) {
      console.error("Error setting ABA material config as default:", error);
      res.status(500).json({ message: "Failed to set config as default" });
    }
  });

  // Special endpoint for calculating plate price without saving
  app.post("/api/plate-calculations/calculate", async (req: Request, res: Response) => {
    try {
      // Validate using the request schema
      const requestData = plateCalculationRequestSchema.parse(req.body);
      
      // Calculate area
      const area = requestData.width * requestData.height;
      
      // Get pricing parameters
      const basePriceParam = await storage.getPlatePricingParameterByType('base_price');
      const colorMultiplierParam = await storage.getPlatePricingParameterByType('color_multiplier');
      const thicknessMultiplierParam = await storage.getPlatePricingParameterByType('thickness_multiplier');
      
      // Set default values if parameters are not found
      const basePricePerUnit = basePriceParam?.value || 0.5; // Default $0.5 per cm²
      const colorMultiplier = colorMultiplierParam?.value || 1.2; // Default 20% increase per color
      const thicknessMultiplier = thicknessMultiplierParam?.value || 1.1; // Default 10% increase for thickness
      
      // Calculate price
      let price = area * basePricePerUnit;
      
      // Apply color multiplier (colors - 1 because first color is included in base price)
      const colors = requestData.colors || 1;
      if (colors > 1) {
        price = price * (1 + (colors - 1) * (colorMultiplier - 1));
      }
      
      // Apply thickness multiplier if applicable
      if (requestData.thickness && requestData.thickness > 0) {
        price = price * thicknessMultiplier;
      }
      
      // Apply customer discount if applicable
      if (requestData.customerDiscount && requestData.customerDiscount > 0) {
        price = price * (1 - requestData.customerDiscount / 100);
      }
      
      // Return the calculation result
      res.json({
        area,
        calculatedPrice: price,
        basePricePerUnit,
        colorMultiplier,
        thicknessMultiplier,
        ...requestData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid calculation data", errors: error.errors });
      }
      console.error("Error calculating plate price:", error);
      res.status(500).json({ message: "Failed to calculate plate price" });
    }
  });
  
  // Reports API endpoints
  app.get("/api/reports/production", async (req: Request, res: Response) => {
    try {
      // Parse query parameters for filtering
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const customerId = req.query.customerId as string | undefined;
      const statusFilter = req.query.status as string | undefined;
      const productId = req.query.productId as string | undefined;
      
      // Fetch orders
      let orders = await storage.getOrders();
      
      // Apply date filters
      if (startDate) {
        orders = orders.filter(order => new Date(order.date) >= startDate);
      }
      
      if (endDate) {
        orders = orders.filter(order => new Date(order.date) <= endDate);
      }
      
      // Apply customer filter
      if (customerId) {
        orders = orders.filter(order => order.customerId === customerId);
      }
      
      // Apply status filter
      if (statusFilter) {
        orders = orders.filter(order => order.status === statusFilter);
      }
      
      // Fetch related data for enriching the report
      const jobOrders = await storage.getJobOrders();
      const rolls = await storage.getRolls();
      const customerProducts = await storage.getCustomerProducts();
      const customers = await storage.getCustomers();
      
      // Process data to create a comprehensive report
      const productionReport = await Promise.all(orders.map(async (order) => {
        // Get job orders for this order
        const orderJobOrders = jobOrders.filter(jo => jo.orderId === order.id);
        
        // Filter by product if specified
        const filteredJobOrders = productId 
          ? orderJobOrders.filter(jo => {
              const product = customerProducts.find(cp => cp.id === jo.customerProductId);
              return product && product.itemId === productId;
            }) 
          : orderJobOrders;
        
        if (productId && filteredJobOrders.length === 0) {
          return null; // Skip this order if it doesn't have the requested product
        }
        
        const totalQuantity = filteredJobOrders.reduce((sum, jo) => sum + jo.quantity, 0);
        
        // Get rolls for these job orders
        const orderRolls = rolls.filter(roll => 
          filteredJobOrders.some(jo => jo.id === roll.jobOrderId)
        );
        
        // Calculate metrics
        const completedRolls = orderRolls.filter(roll => roll.status === "completed");
        const completedQuantity = completedRolls.reduce((sum, roll) => 
          sum + (roll.cuttingQty || 0), 0);
        
        const extrusionQuantity = orderRolls.reduce((sum, roll) => 
          sum + (roll.extrudingQty || 0), 0);
        
        const printingQuantity = orderRolls.reduce((sum, roll) => 
          sum + (roll.printingQty || 0), 0);
        
        // Calculate waste and efficiency
        const wastageQuantity = extrusionQuantity > 0 
          ? extrusionQuantity - completedQuantity 
          : 0;
        
        const wastePercentage = extrusionQuantity > 0 
          ? (wastageQuantity / extrusionQuantity) * 100 
          : 0;
        
        const efficiency = totalQuantity > 0 
          ? (completedQuantity / totalQuantity) * 100 
          : 0;
        
        // Get products information
        const products = await Promise.all(filteredJobOrders.map(async (jo) => {
          const product = customerProducts.find(cp => cp.id === jo.customerProductId);
          return {
            id: product?.id || 0,
            name: product?.itemId || "Unknown",
            size: product?.sizeCaption || "N/A",
            quantity: jo.quantity
          };
        }));
        
        // Get customer name
        const customer = customers.find(c => c.id === order.customerId);
        
        return {
          id: order.id,
          date: order.date,
          customer: {
            id: customer?.id || "",
            name: customer?.name || "Unknown"
          },
          products,
          metrics: {
            totalQuantity,
            completedQuantity,
            extrusionQuantity,
            printingQuantity,
            wastageQuantity,
            wastePercentage: parseFloat(wastePercentage.toFixed(2)),
            efficiency: parseFloat(efficiency.toFixed(2))
          },
          status: order.status,
          jobOrders: filteredJobOrders.map(jo => ({
            id: jo.id,
            quantity: jo.quantity,
            status: jo.status,
            completedDate: jo.completedDate
          }))
        };
      }));
      
      // Filter out null values (from product filtering)
      const filteredReport = productionReport.filter(report => report !== null);
      
      res.json(filteredReport);
    } catch (error) {
      console.error("Error generating production report:", error);
      res.status(500).json({ message: "Failed to generate production report" });
    }
  });
  
  app.get("/api/reports/warehouse", async (req: Request, res: Response) => {
    try {
      // Parse query parameters for filtering
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const materialType = req.query.materialType as string | undefined;
      const materialId = req.query.materialId as string | undefined;
      
      // Fetch raw materials
      let rawMaterials = await storage.getRawMaterials();
      
      // Apply material type filter
      if (materialType) {
        rawMaterials = rawMaterials.filter(material => material.type === materialType);
      }
      
      // Apply specific material filter
      if (materialId) {
        rawMaterials = rawMaterials.filter(material => material.id === parseInt(materialId));
      }
      
      // Fetch material inputs for inventory history
      let materialInputs = await storage.getMaterialInputs();
      
      // Apply date filters to material inputs
      if (startDate) {
        materialInputs = materialInputs.filter(input => new Date(input.date) >= startDate);
      }
      
      if (endDate) {
        materialInputs = materialInputs.filter(input => new Date(input.date) <= endDate);
      }
      
      // Fetch material input items
      const materialInputItems = await storage.getMaterialInputItems();
      
      // Fetch users for input tracking
      const users = await storage.getUsers();
      
      // Process data to create warehouse inventory report
      const warehouseReport = {
        currentInventory: rawMaterials.map(material => ({
          id: material.id,
          name: material.name,
          type: material.type,
          quantity: material.quantity,
          unit: material.unit,
          lastUpdated: material.lastUpdated
        })),
        inventoryHistory: await Promise.all(materialInputs.map(async (input) => {
          // Get items for this input
          const items = materialInputItems.filter(item => item.inputId === input.id);
          
          // Get user who performed the input
          const user = users.find(u => u.id === input.userId);
          
          // Get materials for each item
          const materials = await Promise.all(items.map(async (item) => {
            const material = rawMaterials.find(rm => rm.id === item.rawMaterialId);
            return {
              id: item.rawMaterialId,
              name: material?.name || "Unknown",
              quantity: item.quantity,
              unit: material?.unit || "kg"
            };
          }));
          
          return {
            id: input.id,
            date: input.date,
            user: {
              id: user?.id || "",
              name: user?.username || "Unknown"
            },
            notes: input.notes,
            materials
          };
        }))
      };
      
      res.json(warehouseReport);
    } catch (error) {
      console.error("Error generating warehouse report:", error);
      res.status(500).json({ message: "Failed to generate warehouse report" });
    }
  });
  
  app.get("/api/reports/quality", async (req: Request, res: Response) => {
    try {
      // Parse query parameters for filtering
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stageFilter = req.query.stage as string | undefined;
      const rollId = req.query.rollId as string | undefined;
      const jobOrderId = req.query.jobOrderId ? parseInt(req.query.jobOrderId as string) : undefined;
      
      // Fetch quality checks
      let qualityChecks = await storage.getQualityChecks();
      
      // Filter quality checks by job order if specified
      if (jobOrderId) {
        qualityChecks = await storage.getQualityChecksByJobOrder(jobOrderId);
      }
      
      // Fetch related data
      const qualityCheckTypes = await storage.getQualityCheckTypes();
      const rolls = await storage.getRolls();
      const jobOrders = await storage.getJobOrders();
      const correctionActions = await storage.getCorrectiveActions();
      
      // Apply filters
      if (rollId) {
        qualityChecks = qualityChecks.filter(check => {
          const roll = rolls.find(r => r.id === check.rollId);
          return roll && roll.id === rollId;
        });
      }
      
      if (stageFilter) {
        qualityChecks = qualityChecks.filter(check => {
          const checkType = qualityCheckTypes.find(type => type.id === check.checkTypeId);
          return checkType && checkType.stage === stageFilter;
        });
      }
      
      if (startDate || endDate) {
        qualityChecks = qualityChecks.filter(check => {
          const checkDate = new Date(check.checkDate);
          if (startDate && checkDate < startDate) return false;
          if (endDate && checkDate > endDate) return false;
          return true;
        });
      }
      
      // Process data to create quality report
      const qualityReport = await Promise.all(qualityChecks.map(async (check) => {
        // Get check type
        const checkType = qualityCheckTypes.find(type => type.id === check.checkTypeId);
        
        // Get roll
        const roll = rolls.find(r => r.id === check.rollId);
        
        // Get job order
        const jobOrder = roll ? jobOrders.find(jo => jo.id === roll.jobOrderId) : undefined;
        
        // Get corrective actions
        const actions = correctionActions.filter(action => action.qualityCheckId === check.id);
        
        return {
          id: check.id,
          date: check.checkDate,
          type: {
            id: checkType?.id || "",
            name: checkType?.name || "Unknown",
            stage: checkType?.stage || "Unknown"
          },
          roll: roll ? {
            id: roll.id,
            serialNumber: roll.serialNumber,
            status: roll.status
          } : null,
          jobOrder: jobOrder ? {
            id: jobOrder.id,
            status: jobOrder.status
          } : null,
          result: check.passed ? "Pass" : "Fail",
          notes: check.notes,
          correctiveActions: actions.map(action => ({
            id: action.id,
            action: action.action,
            implementedBy: action.implementedBy,
            implementationDate: action.implementationDate
          }))
        };
      }));
      
      // Calculate summary metrics
      const totalChecks = qualityReport.length;
      const failedChecks = qualityReport.filter(report => report.result === "Fail").length;
      const passRate = totalChecks > 0 ? ((totalChecks - failedChecks) / totalChecks) * 100 : 0;
      
      const qualitySummary = {
        totalChecks,
        passedChecks: totalChecks - failedChecks,
        failedChecks,
        passRate: parseFloat(passRate.toFixed(2)),
        checks: qualityReport
      };
      
      res.json(qualitySummary);
    } catch (error) {
      console.error("Error generating quality report:", error);
      res.status(500).json({ message: "Failed to generate quality report" });
    }
  });
  
  app.get("/api/performance-metrics", async (req: Request, res: Response) => {
    try {
      // Fetch all the data needed for performance metrics
      const orders = await storage.getOrders();
      const jobOrders = await storage.getJobOrders();
      const rolls = await storage.getRolls();
      const qualityChecks = await storage.getQualityChecks();
      
      // Calculate processing times for rolls
      const rollProcessingTimes = rolls
        .filter(roll => roll.status === "completed" && roll.extrudedAt && roll.printedAt && roll.cutAt)
        .map(roll => {
          // Calculate time differences in hours
          const extrudedDate = new Date(roll.extrudedAt!);
          const printedDate = new Date(roll.printedAt!);
          const cutDate = new Date(roll.cutAt!);
          
          const extrusionToPrinting = (printedDate.getTime() - extrudedDate.getTime()) / (1000 * 60 * 60);
          const printingToCutting = (cutDate.getTime() - printedDate.getTime()) / (1000 * 60 * 60);
          const totalProcessingTime = (cutDate.getTime() - extrudedDate.getTime()) / (1000 * 60 * 60);
          
          // Calculate waste if possible
          const extrudingQty = roll.extrudingQty || 0;
          const cuttingQty = roll.cuttingQty || 0;
          const wasteQty = extrudingQty > cuttingQty ? extrudingQty - cuttingQty : 0;
          const wastePercentage = extrudingQty > 0 ? (wasteQty / extrudingQty) * 100 : 0;
          
          return {
            rollId: roll.serialNumber,
            extrusionToPrinting,
            printingToCutting,
            totalProcessingTime,
            wasteQty,
            wastePercentage,
            extrudedAt: roll.extrudedAt,
            printedAt: roll.printedAt,
            cutAt: roll.cutAt
          };
        });
      
      // Processing time averages
      const avgExtrusionToNextStage = rollProcessingTimes.length > 0 
        ? rollProcessingTimes.reduce((sum, item) => sum + item.extrusionToPrinting, 0) / rollProcessingTimes.length 
        : 0;
        
      const avgPrintingToCutting = rollProcessingTimes.length > 0 
        ? rollProcessingTimes.reduce((sum, item) => sum + item.printingToCutting, 0) / rollProcessingTimes.length 
        : 0;
        
      const avgTotalProcessingTime = rollProcessingTimes.length > 0 
        ? rollProcessingTimes.reduce((sum, item) => sum + item.totalProcessingTime, 0) / rollProcessingTimes.length 
        : 0;
      
      // Waste metrics
      const totalWasteQty = rollProcessingTimes.reduce((sum, item) => sum + item.wasteQty, 0);
      const totalInputQty = rollProcessingTimes.reduce((sum, item) => sum + (item.wasteQty / (item.wastePercentage / 100)), 0);
      const overallWastePercentage = totalInputQty > 0 ? (totalWasteQty / totalInputQty) * 100 : 0;
      
      // Order fulfillment times (from order creation to all job orders completed)
      const orderFulfillmentTimes = orders
        .filter(order => order.status === "completed")
        .map(order => {
          const orderJobOrders = jobOrders.filter(jo => jo.orderId === order.id);
          
          // Find the latest completion date among job orders
          const completionDates = orderJobOrders
            .map(jo => jo.completedDate)
            .filter(date => date !== null) as Date[];
            
          if (completionDates.length === 0) return null;
          
          const latestCompletionDate = new Date(Math.max(...completionDates.map(d => new Date(d).getTime())));
          const orderDate = new Date(order.date);
          
          return {
            orderId: order.id,
            fulfillmentTime: (latestCompletionDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24) // in days
          };
        })
        .filter(item => item !== null) as { orderId: number; fulfillmentTime: number }[];
      
      // Average order fulfillment time
      const avgOrderFulfillmentTime = orderFulfillmentTimes.length > 0
        ? orderFulfillmentTimes.reduce((sum, item) => sum + item.fulfillmentTime, 0) / orderFulfillmentTimes.length
        : 0;
      
      // Quality metrics
      const totalQualityChecks = qualityChecks.length;
      const failedQualityChecks = qualityChecks.filter(check => !check.passed).length;
      const qualityFailureRate = totalQualityChecks > 0 ? (failedQualityChecks / totalQualityChecks) * 100 : 0;
      
      // Daily throughput for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get all rolls completed within the last 30 days
      const recentCompletedRolls = rolls.filter(roll => 
        roll.status === "completed" && 
        roll.cutAt && 
        new Date(roll.cutAt) >= thirtyDaysAgo
      );
      
      // Group by date
      const throughputByDate = new Map<string, { count: number; totalWeight: number }>();
      
      recentCompletedRolls.forEach(roll => {
        if (!roll.cutAt) return;
        
        const dateStr = new Date(roll.cutAt).toISOString().split('T')[0]; // YYYY-MM-DD
        const existing = throughputByDate.get(dateStr) || { count: 0, totalWeight: 0 };
        
        throughputByDate.set(dateStr, {
          count: existing.count + 1,
          totalWeight: existing.totalWeight + (roll.cuttingQty || 0)
        });
      });
      
      // Convert to array format
      const throughputData = Array.from(throughputByDate.entries()).map(([date, data]) => ({
        date,
        count: data.count,
        totalWeight: data.totalWeight
      }));
      
      // Sort by date
      throughputData.sort((a, b) => a.date.localeCompare(b.date));
      
      // Format recent processing times for mobile view
      const recentProcessingTimes = rollProcessingTimes
        .sort((a, b) => {
          if (!a.cutAt || !b.cutAt) return 0;
          return new Date(b.cutAt).getTime() - new Date(a.cutAt).getTime();
        })
        .slice(0, 10)
        .map(item => ({
          rollId: parseInt(item.rollId.toString()),
          processingTime: item.totalProcessingTime,
          stage: "completed",
          date: item.cutAt ? new Date(item.cutAt).toISOString().split('T')[0] : ""
        }));
      
      // Compile all metrics for the response
      const performanceMetrics = {
        processingTimes: {
          avgExtrusionToNextStage: parseFloat(avgExtrusionToNextStage.toFixed(2)),
          avgPrintingToCutting: parseFloat(avgPrintingToCutting.toFixed(2)),
          avgTotalProcessingTime: parseFloat(avgTotalProcessingTime.toFixed(2)),
          recentProcessingTimes: rollProcessingTimes.slice(0, 10)
        },
        wasteMetrics: {
          totalWasteQty: parseFloat(totalWasteQty.toFixed(2)),
          overallWastePercentage: parseFloat(overallWastePercentage.toFixed(2)),
          rollProcessingTimes: rollProcessingTimes.map(item => ({
            rollId: parseInt(item.rollId.toString()),
            wasteQty: parseFloat(item.wasteQty.toFixed(2)),
            wastePercentage: parseFloat(item.wastePercentage.toFixed(2))
          }))
        },
        orderMetrics: {
          avgOrderFulfillmentTime: parseFloat(avgOrderFulfillmentTime.toFixed(2)),
          orderFulfillmentTimes
        },
        qualityMetrics: {
          totalQualityChecks,
          failedQualityChecks,
          qualityFailureRate: parseFloat(qualityFailureRate.toFixed(2))
        },
        throughput: throughputData,
        mobileMetrics: {
          avgProcessingTime: parseFloat(avgTotalProcessingTime.toFixed(2)),
          avgOrderFulfillment: parseFloat(avgOrderFulfillmentTime.toFixed(2)),
          wastePercentage: parseFloat(overallWastePercentage.toFixed(2)),
          qualityFailureRate: parseFloat(qualityFailureRate.toFixed(2)),
          recentProcessingTimes
        }
      };
      
      res.json(performanceMetrics);
    } catch (error) {
      console.error("Error generating performance metrics:", error);
      res.status(500).json({ message: "Failed to generate performance metrics" });
    }
  });

  // Workflow Reports API endpoint - data by sections, operators, and items
  app.get("/api/reports/workflow", async (req: Request, res: Response) => {
    try {
      // Parse query parameters for filtering
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const sectionId = req.query.sectionId as string | undefined;
      const operatorId = req.query.operatorId as string | undefined;
      const itemId = req.query.itemId as string | undefined;
      
      // Fetch all necessary data
      const sections = await storage.getSections();
      const users = await storage.getUsers();
      const jobOrders = await storage.getJobOrders();
      const rolls = await storage.getRolls();
      const items = await storage.getItems();
      const orders = await storage.getOrders();
      const qualityChecks = await storage.getQualityChecks();
      
      // Filter rolls based on date range if specified
      let filteredRolls = [...rolls];
      
      if (startDate || endDate) {
        filteredRolls = filteredRolls.filter(roll => {
          // Use the roll's creation or completion date
          const rollDate = roll.completedDate ? new Date(roll.completedDate) : new Date(roll.createdAt || '');
          
          if (startDate && endDate) {
            return rollDate >= startDate && rollDate <= endDate;
          } else if (startDate) {
            return rollDate >= startDate;
          } else if (endDate) {
            return rollDate <= endDate;
          }
          
          return true;
        });
      }
      
      // Filter by section if specified
      if (sectionId) {
        filteredRolls = filteredRolls.filter(roll => roll.sectionId === sectionId);
      }
      
      // Filter by operator if specified
      if (operatorId) {
        filteredRolls = filteredRolls.filter(roll => roll.operatorId === operatorId);
      }
      
      // Get job orders related to filtered rolls
      const rollJobOrderIds = [...new Set(filteredRolls.map(roll => roll.jobOrderId))];
      const filteredJobOrders = jobOrders.filter(jo => rollJobOrderIds.includes(jo.id));
      
      // Filter by item if specified
      let itemFilteredJobOrders = [...filteredJobOrders];
      if (itemId) {
        // Need to trace back from job order to order to customer product to item
        itemFilteredJobOrders = filteredJobOrders.filter(jo => {
          const orderItem = orders.find(order => order.id === jo.orderId);
          if (!orderItem) return false;
          
          // Check if this job order involves the specified item
          return jo.itemId === itemId;
        });
        
        // Update filtered rolls to match the item-filtered job orders
        const itemFilteredJobOrderIds = itemFilteredJobOrders.map(jo => jo.id);
        filteredRolls = filteredRolls.filter(roll => itemFilteredJobOrderIds.includes(roll.jobOrderId));
      }
      
      // Prepare section data - include all sections even if no rolls
      const sectionData = sections.map(section => {
        // Get rolls for this section (using stage instead of sectionId)
        const sectionRolls = filteredRolls.filter(roll => roll.stage === section.id);
        const rollCount = sectionRolls.length;
        
        // Calculate total quantity
        const totalQuantity = sectionRolls.reduce((sum, roll) => {
          const qty = (roll.extrusionQty || 0) + (roll.printingQty || 0) + (roll.cuttingQty || 0);
          return sum + qty;
        }, 0);
        
        // Calculate waste quantity and percentage
        const wasteQuantity = sectionRolls.reduce((sum, roll) => {
          // Simple waste calculation based on available quantities
          const inputQty = (roll.mixQty || 0);
          const outputQty = (roll.extrusionQty || 0) + (roll.printingQty || 0) + (roll.cuttingQty || 0);
          const waste = Math.max(0, inputQty - outputQty);
          return sum + waste;
        }, 0);
        
        const wastePercentage = totalQuantity > 0 ? (wasteQuantity / (totalQuantity + wasteQuantity)) * 100 : 0;
        
        // Calculate efficiency based on completed vs total rolls
        const completedRolls = sectionRolls.filter(roll => roll.status === 'completed').length;
        const efficiency = rollCount > 0 ? (completedRolls / rollCount) * 100 : 0;
        
        // Calculate production time (simplified)
        const productionTime = rollCount * 2; // Estimate 2 hours per roll
        
        return {
          id: section.id,
          name: section.name,
          rollCount,
          totalQuantity: Math.round(totalQuantity * 100) / 100,
          wasteQuantity: Math.round(wasteQuantity * 100) / 100,
          wastePercentage: Math.round(wastePercentage * 100) / 100,
          efficiency: Math.round(efficiency * 100) / 100,
          productionTime: Math.round(productionTime * 100) / 100
        };
      }); // Include all sections, even with zero data
      
      // Prepare operator data - include all users but show meaningful data
      const operatorData = users.map(user => {
        // Get rolls processed by this operator
        const operatorRolls = filteredRolls.filter(roll => roll.operatorId === user.id);
        const rollsProcessed = operatorRolls.length;
        
        // Get all rolls by this user (not just filtered ones) for better reporting
        const allUserRolls = rolls.filter(roll => roll.operatorId === user.id);
        
        // Determine primary section
        const sectionCounts: { [key: string]: number } = {};
        allUserRolls.forEach(roll => {
          if (roll.sectionId) {
            sectionCounts[roll.sectionId] = (sectionCounts[roll.sectionId] || 0) + 1;
          }
        });
        
        let primarySection = 'General';
        let maxCount = 0;
        Object.entries(sectionCounts).forEach(([sectionId, count]) => {
          if (count > maxCount) {
            primarySection = sections.find(s => s.id === sectionId)?.name || sectionId;
            maxCount = count;
          }
        });
        
        // Count job orders processed
        const operatorJobOrderIds = [...new Set(operatorRolls.map(roll => roll.jobOrderId))];
        const jobsCount = operatorJobOrderIds.length;
        
        // Calculate total quantity processed
        const totalQuantity = operatorRolls.reduce((sum, roll) => {
          const qty = (roll.extrusionQty || 0) + (roll.printingQty || 0) + (roll.cuttingQty || 0);
          return sum + qty;
        }, 0);
        
        // Simplified production time calculation
        const productionTime = rollsProcessed * 1.5; // Estimate 1.5 hours per roll
        
        // Calculate efficiency based on completion rate
        const completedRolls = operatorRolls.filter(roll => roll.status === 'completed').length;
        const efficiency = rollsProcessed > 0 ? (completedRolls / rollsProcessed) * 100 : 0;
        
        return {
          id: user.id,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
          section: primarySection,
          jobsCount,
          rollsProcessed,
          totalQuantity: Math.round(totalQuantity * 100) / 100,
          productionTime: Math.round(productionTime * 100) / 100,
          efficiency: Math.round(efficiency * 100) / 100
        };
      }).filter(operator => operator.rollsProcessed > 0 || operator.jobsCount > 0); // Include operators with any activity
      
      // Prepare item data - include all items with actual job order data
      const itemData = items.map(item => {
        // Find job orders for this item
        const allItemJobOrders = jobOrders.filter(jo => jo.itemId === item.id.toString());
        const filteredItemJobOrders = itemFilteredJobOrders.filter(jo => jo.itemId === item.id.toString());
        const jobsCount = filteredItemJobOrders.length;
        
        // Get rolls for these job orders
        const itemRolls = filteredRolls.filter(roll => 
          filteredItemJobOrders.some(jo => jo.id === roll.jobOrderId)
        );
        
        // Total ordered quantity
        const totalQuantity = filteredItemJobOrders.reduce((sum, jo) => sum + jo.quantity, 0);
        
        // Total finished quantity from all production stages
        const finishedQuantity = itemRolls
          .filter(roll => roll.status === 'completed')
          .reduce((sum, roll) => {
            const qty = (roll.extrusionQty || 0) + (roll.printingQty || 0) + (roll.cuttingQty || 0);
            return sum + qty;
          }, 0);
        
        // Calculate waste (simplified)
        const wasteQuantity = Math.max(0, totalQuantity - finishedQuantity);
        const wastePercentage = totalQuantity > 0 ? (wasteQuantity / totalQuantity) * 100 : 0;
        
        return {
          id: item.id,
          name: item.name,
          category: item.categoryId,
          jobsCount,
          totalQuantity: Math.round(totalQuantity * 100) / 100,
          finishedQuantity: Math.round(finishedQuantity * 100) / 100,
          wasteQuantity: Math.round(wasteQuantity * 100) / 100,
          wastePercentage: Math.round(wastePercentage * 100) / 100
        };
      }).filter(item => item.jobsCount > 0 || item.totalQuantity > 0); // Include items with any activity
      
      // Return combined report data
      res.json({
        sections: sectionData,
        operators: operatorData,
        items: itemData
      });
      
    } catch (error) {
      console.error("Error generating workflow report:", error);
      res.status(500).json({ message: "Failed to generate workflow report" });
    }
  });

  // Dashboard Widget API endpoints
  app.get("/api/quality/stats", async (req: Request, res: Response) => {
    try {
      // Get all the necessary data
      const checks = await storage.getQualityChecks();
      const violations = await storage.getQualityViolations();
      const correctiveActions = await storage.getCorrectiveActions();
      const penalties = await storage.getQualityPenalties();
      
      // Calculate quality metrics for checks
      const totalChecks = checks.length;
      const passedChecks = checks.filter(check => check.status === 'passed').length;
      const failedChecks = totalChecks - passedChecks;
      
      // Calculate quality metrics for violations
      const totalViolations = violations.length;
      const openViolations = violations.filter(v => v.status === 'pending' || v.status === 'open').length;
      const resolvedViolations = violations.filter(v => v.status === 'resolved' || v.status === 'closed').length;
      
      // Calculate metrics for corrective actions
      const totalCorrectiveActions = correctiveActions.length;
      const pendingActions = correctiveActions.filter(action => 
        action.status === 'pending' || action.status === 'assigned' || action.status === 'in-progress'
      ).length;
      const completedActions = correctiveActions.filter(action => 
        action.status === 'completed' || action.status === 'verified'
      ).length;
      
      // Calculate metrics for penalties
      const totalPenalties = penalties.length;
      const activePenalties = penalties.filter(p => 
        p.status === 'active' || p.status === 'pending'
      ).length;
      const closedPenalties = penalties.filter(p => 
        p.status === 'closed' || p.status === 'completed'
      ).length;
      
      res.json({
        // Checks stats
        totalChecks,
        passedChecks,
        failedChecks,
        
        // Violations stats
        totalViolations,
        openViolations,
        resolvedViolations,
        
        // Corrective actions stats
        totalCorrectiveActions,
        pendingActions,
        completedActions,
        
        // Penalties stats
        totalPenalties,
        activePenalties,
        closedPenalties
      });
    } catch (error) {
      console.error('Error fetching quality stats:', error);
      res.status(500).json({ error: 'Failed to fetch quality statistics' });
    }
  });

  app.get("/api/quality/recent-violations", async (req: Request, res: Response) => {
    try {
      const violations = await storage.getQualityViolations();
      const sortedViolations = violations
        .sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime())
        .slice(0, 10); // Get the 10 most recent
      
      // Calculate totals by status
      const totalPending = violations.filter(v => v.status === 'pending').length;
      const totalInProgress = violations.filter(v => v.status === 'in_progress').length;
      const totalResolved = violations.filter(v => v.status === 'resolved').length;
      
      res.json({
        violations: sortedViolations,
        totalPending,
        totalInProgress,
        totalResolved
      });
    } catch (error) {
      console.error('Error fetching recent violations:', error);
      res.status(500).json({ error: 'Failed to fetch recent violations' });
    }
  });

  app.get("/api/production/productivity", async (req: Request, res: Response) => {
    try {
      // Calculate productivity data from real sources when available
      // For now, return realistic sample data based on our production metrics
      const rolls = await storage.getRolls();
      const completedRolls = rolls.filter(r => r.status === 'completed');
      
      // Calculate metrics from the available data
      const totalRolls = rolls.length;
      const completedRollsCount = completedRolls.length;
      const operatorEfficiency = totalRolls > 0 ? Math.round((completedRollsCount / totalRolls) * 100) : 90;
      
      const productivityData = {
        operatorEfficiency: Math.min(operatorEfficiency, 100),
        machineUtilization: 92,
        cycleTimeVariance: 4.2,
        productionPerHour: 182,
        productionTarget: 200,
        productionTrend: completedRollsCount > totalRolls / 2 ? 'up' : 'down'
      };
      
      res.json(productivityData);
    } catch (error) {
      console.error('Error fetching productivity data:', error);
      res.status(500).json({ error: 'Failed to fetch productivity data' });
    }
  });

  // User dashboard preferences API endpoints
  app.get("/api/dashboard/preferences/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // In a real app, fetch from database
      // For now return empty to let the frontend use defaults/localStorage
      res.json({});
    } catch (error) {
      console.error('Error fetching user dashboard preferences:', error);
      res.status(500).json({ error: 'Failed to fetch user preferences' });
    }
  });

  app.post("/api/dashboard/preferences/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const preferences = req.body;
      
      // In a real app, save to database
      // For now just return success
      res.json({ success: true, message: 'Preferences saved successfully' });
    } catch (error) {
      console.error('Error saving user dashboard preferences:', error);
      res.status(500).json({ error: 'Failed to save user preferences' });
    }
  });

  // HR Module API Routes

  // Time Attendance Routes
  app.get("/api/time-attendance", async (req: Request, res: Response) => {
    try {
      const timeAttendance = await storage.getTimeAttendance();
      res.json(timeAttendance);
    } catch (error) {
      console.error('Error fetching time attendance:', error);
      res.status(500).json({ error: 'Failed to fetch time attendance' });
    }
  });

  app.get("/api/time-attendance/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const timeAttendance = await storage.getTimeAttendanceByUser(userId);
      res.json(timeAttendance);
    } catch (error) {
      console.error('Error fetching user time attendance:', error);
      res.status(500).json({ error: 'Failed to fetch user time attendance' });
    }
  });

  app.get("/api/time-attendance/date/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const timeAttendance = await storage.getTimeAttendanceByDate(new Date(date));
      res.json(timeAttendance);
    } catch (error) {
      console.error('Error fetching date time attendance:', error);
      res.status(500).json({ error: 'Failed to fetch date time attendance' });
    }
  });

  app.post("/api/time-attendance", async (req: Request, res: Response) => {
    try {
      // Transform data to match schema expectations
      const transformedData = {
        ...req.body,
        userId: req.body.userId?.toString() || req.user?.id?.toString(),
        date: new Date(req.body.date),
        checkInTime: req.body.checkInTime ? new Date(req.body.checkInTime) : new Date(),
        checkOutTime: req.body.checkOutTime ? new Date(req.body.checkOutTime) : null,
        breakStartTime: req.body.breakStartTime ? new Date(req.body.breakStartTime) : null,
        breakEndTime: req.body.breakEndTime ? new Date(req.body.breakEndTime) : null,
      };
      
      const data = insertTimeAttendanceSchema.parse(transformedData);
      const timeAttendance = await storage.createTimeAttendance(data);
      res.json(timeAttendance);
    } catch (error) {
      console.error('Error creating time attendance:', error);
      res.status(500).json({ error: 'Failed to create time attendance' });
    }
  });

  app.put("/api/time-attendance/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const timeAttendance = await storage.updateTimeAttendance(id, data);
      res.json(timeAttendance);
    } catch (error) {
      console.error('Error updating time attendance:', error);
      res.status(500).json({ error: 'Failed to update time attendance' });
    }
  });

  app.delete("/api/time-attendance/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTimeAttendance(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting time attendance:', error);
      res.status(500).json({ error: 'Failed to delete time attendance' });
    }
  });

  // Employee of the Month Routes
  app.get("/api/employee-of-month", async (req: Request, res: Response) => {
    try {
      const employees = await storage.getEmployeeOfMonth();
      res.json(employees);
    } catch (error) {
      console.error('Error fetching employee of month:', error);
      res.status(500).json({ error: 'Failed to fetch employee of month' });
    }
  });

  app.get("/api/employee-of-month/year/:year", async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.params.year);
      const employees = await storage.getEmployeeOfMonthByYear(year);
      res.json(employees);
    } catch (error) {
      console.error('Error fetching employee of month by year:', error);
      res.status(500).json({ error: 'Failed to fetch employee of month by year' });
    }
  });

  app.post("/api/employee-of-month", async (req: Request, res: Response) => {
    try {
      const data = insertEmployeeOfMonthSchema.parse(req.body);
      const employee = await storage.createEmployeeOfMonth(data);
      res.json(employee);
    } catch (error) {
      console.error('Error creating employee of month:', error);
      res.status(500).json({ error: 'Failed to create employee of month' });
    }
  });

  app.put("/api/employee-of-month/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid employee of month ID" });
      }
      
      const data = req.body;
      const employee = await storage.updateEmployeeOfMonth(id, data);
      if (!employee) {
        return res.status(404).json({ error: "Employee of month record not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error('Error updating employee of month:', error);
      res.status(500).json({ error: 'Failed to update employee of month' });
    }
  });

  // HR Violations Routes
  app.get("/api/hr-violations", async (req: Request, res: Response) => {
    try {
      const violations = await storage.getHrViolations();
      res.json(violations);
    } catch (error) {
      console.error('Error fetching HR violations:', error);
      res.status(500).json({ error: 'Failed to fetch HR violations' });
    }
  });

  app.get("/api/hr-violations/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const violations = await storage.getHrViolationsByUser(userId);
      res.json(violations);
    } catch (error) {
      console.error('Error fetching user HR violations:', error);
      res.status(500).json({ error: 'Failed to fetch user HR violations' });
    }
  });

  app.post("/api/hr-violations", async (req: Request, res: Response) => {
    try {
      const data = insertHrViolationSchema.parse(req.body);
      const violation = await storage.createHrViolation(data);
      res.json(violation);
    } catch (error) {
      console.error('Error creating HR violation:', error);
      res.status(500).json({ error: 'Failed to create HR violation' });
    }
  });

  app.put("/api/hr-violations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const violation = await storage.updateHrViolation(id, data);
      res.json(violation);
    } catch (error) {
      console.error('Error updating HR violation:', error);
      res.status(500).json({ error: 'Failed to update HR violation' });
    }
  });

  // HR Complaints Routes
  app.get("/api/hr-complaints", async (req: Request, res: Response) => {
    try {
      const complaints = await storage.getHrComplaints();
      res.json(complaints);
    } catch (error) {
      console.error('Error fetching HR complaints:', error);
      res.status(500).json({ error: 'Failed to fetch HR complaints' });
    }
  });

  app.get("/api/hr-complaints/complainant/:complainantId", async (req: Request, res: Response) => {
    try {
      const { complainantId } = req.params;
      const complaints = await storage.getHrComplaintsByComplainant(complainantId);
      res.json(complaints);
    } catch (error) {
      console.error('Error fetching complainant HR complaints:', error);
      res.status(500).json({ error: 'Failed to fetch complainant HR complaints' });
    }
  });

  app.post("/api/hr-complaints", async (req: Request, res: Response) => {
    try {
      const data = insertHrComplaintSchema.parse(req.body);
      const complaint = await storage.createHrComplaint(data);
      res.json(complaint);
    } catch (error) {
      console.error('Error creating HR complaint:', error);
      res.status(500).json({ error: 'Failed to create HR complaint' });
    }
  });

  app.put("/api/hr-complaints/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const complaint = await storage.updateHrComplaint(id, data);
      res.json(complaint);
    } catch (error) {
      console.error('Error updating HR complaint:', error);
      res.status(500).json({ error: 'Failed to update HR complaint' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
