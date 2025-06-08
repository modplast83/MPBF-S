import { hashPassword } from './server/auth-utils.ts';
import { storage } from './server/storage.ts';

async function fixTestPassword() {
  try {
    console.log('Generating hash for Test user password...');
    const hashedPassword = await hashPassword('password');
    console.log('Hash generated:', hashedPassword);
    
    console.log('Updating Test user password...');
    const testUser = await storage.getUserByUsername('Test');
    if (testUser) {
      testUser.password = hashedPassword;
      await storage.upsertUser(testUser);
      console.log('Test user password updated successfully!');
    } else {
      console.log('Test user not found');
    }
  } catch (error) {
    console.error('Error updating Test user password:', error);
  }
  process.exit(0);
}

fixTestPassword();