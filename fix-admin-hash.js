import { hashPassword } from './server/auth-utils.ts';
import { storage } from './server/storage.ts';

async function updateAdminPassword() {
  try {
    const hashedPassword = await hashPassword('admin123');
    const adminUser = await storage.getUserByUsername('admin');
    if (adminUser) {
      adminUser.password = hashedPassword;
      await storage.upsertUser(adminUser);
      console.log('Admin password updated successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

updateAdminPassword();