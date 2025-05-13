import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from './auth-utils';

// Ensure admin user exists
export async function ensureAdminUser() {
  try {
    console.log("Checking for admin user existence...");
    
    // Check if admin user exists
    const adminUser = await storage.getUserByUsername('admin');
    
    if (!adminUser) {
      console.log("Admin user not found. Creating default admin user...");
      
      // Hash the default admin password 'admin123'
      const hashedPassword = await hashPassword('admin123');
      
      // Create admin user if it doesn't exist
      const adminUser = {
        id: uuidv4(), // Generate a UUID for the user ID
        username: 'admin',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'administrator',
        isActive: true,
        phone: null,
        email: 'admin@example.com',
        bio: null,
        profileImageUrl: null,
        sectionId: null,
        user: `admin_${Date.now()}`, // Make sure the user value is unique
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await storage.upsertUser(adminUser);
      console.log("Default admin user created successfully with username 'admin' and password 'admin123'!");
    } else {
      console.log("Admin user already exists, no need to create.");
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error);
  }
}