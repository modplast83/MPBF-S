import {
  users,
  type User,
  type UpsertUser,
  permissions,
  type Permission,
  type InsertPermission,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { IStorage } from "./storage";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { Pool } from "@neondatabase/serverless";

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgreSQLStore = connectPg(session);
    
    // Initialize with connection string directly
    this.sessionStore = new PostgreSQLStore({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
      createTableIfMissing: true
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
      // Check if this role+module permission already exists
      const existingPermissions = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.role, permission.role),
            eq(permissions.module, permission.module)
          )
        );
      
      if (existingPermissions.length > 0) {
        console.log(`Permission for ${permission.role}/${permission.module} already exists`);
        return existingPermissions[0];
      }
      
      // Find the max ID and add 1 to get the next ID
      const maxIdResult = await db.execute(
        sql`SELECT MAX(id) as max_id FROM permissions`
      );
      
      // Get the max ID value or default to 0
      const maxId = maxIdResult.rows[0]?.max_id ? parseInt(maxIdResult.rows[0].max_id) : 0;
      const nextId = maxId + 1;
      
      console.log(`Creating new permission for ${permission.role}/${permission.module} with ID ${nextId}`);
      
      // Insert new permission with manually assigned ID
      const [createdPermission] = await db
        .insert(permissions)
        .values({
          id: nextId,
          ...permission
        })
        .returning();
      
      return createdPermission;
    } catch (error) {
      console.error("Error creating permission:", error);
      throw error;
    }
  }

  async updatePermission(id: number, permissionData: Partial<Permission>): Promise<Permission | undefined> {
    try {
      // Log the incoming data for debugging
      console.log(`Updating permission ${id} with data:`, permissionData);
      
      const [updatedPermission] = await db
        .update(permissions)
        .set(permissionData)
        .where(eq(permissions.id, id))
        .returning();
      
      return updatedPermission;
    } catch (error) {
      console.error(`Permission update error:`, error);
      throw error;
    }
  }

  async deletePermission(id: number): Promise<boolean> {
    await db
      .delete(permissions)
      .where(eq(permissions.id, id));
    return true;
  }
}