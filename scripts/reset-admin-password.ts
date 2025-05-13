import { storage } from '../server/storage';
import { hashPassword } from '../server/auth-utils';

async function resetAdminPassword() {
  try {
    console.log("Resetting admin password...");
    
    // Check if admin user exists
    const adminUser = await storage.getUserByUsername('admin');
    
    if (!adminUser) {
      console.error("Admin user not found! Please run the server first to create the admin user.");
      return;
    }
    
    // Hash the default admin password 'admin123'
    const hashedPassword = await hashPassword('admin123');
    
    // Update admin user with new password
    const updatedUser = await storage.updateUser(adminUser.id, {
      password: hashedPassword,
      updatedAt: new Date()
    });
    
    if (updatedUser) {
      console.log("Admin password has been reset successfully!");
      console.log("Username: admin");
      console.log("Password: admin123");
    } else {
      console.error("Failed to update admin user password.");
    }
  } catch (error) {
    console.error("Error resetting admin password:", error);
  }
}

// Run the function
resetAdminPassword();