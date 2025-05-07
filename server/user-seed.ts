import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';

// Ensure admin user exists
export async function ensureAdminUser() {
  try {
    console.log("Checking for admin user existence...");
    
    // Check if admin user exists
    const adminUser = await storage.getUserByUsername('admin');
    
    if (!adminUser) {
      console.log("Admin user not found. Creating default admin user...");
      
      // Create admin user if it doesn't exist
      // For Replit Auth, we need to make sure the admin user has a valid ID
      // We'll use a UUID as a placeholder for the Replit user ID
      const adminUser = {
        id: uuidv4(), // Generate a UUID for the user ID
        username: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'administrator',
        isActive: true,
        phone: null,
        email: 'admin@example.com',
        bio: null,
        profileImageUrl: null,
        sectionId: null,
      };
      
      await storage.upsertUser(adminUser);
      console.log("Default admin user created successfully!");
    } else {
      console.log("Admin user already exists, no need to create.");
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error);
  }
}