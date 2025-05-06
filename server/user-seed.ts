import { storage } from './storage';
import { hashPassword } from './auth-utils';

// Ensure admin user exists
export async function ensureAdminUser() {
  try {
    console.log("Checking for admin user existence...");
    
    // Check if admin user exists
    const adminUser = await storage.getUserByUsername('admin');
    
    if (!adminUser) {
      console.log("Admin user not found. Creating default admin user...");
      
      // Create admin user if it doesn't exist
      const hashedPassword = await hashPassword('admin123');
      
      const adminUser = {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        role: 'administrator',
        phone: '',
        email: 'admin@example.com',
      };
      
      await storage.createUser(adminUser);
      console.log("Default admin user created successfully!");
    } else {
      console.log("Admin user already exists, no need to create.");
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error);
  }
}