const { hashPassword } = require('./server/auth-utils');
const { storage } = require('./server/storage');

async function fixAdminPassword() {
  try {
    console.log('Generating new hash for admin password...');
    const hashedPassword = await hashPassword('admin123');
    console.log('New hash generated:', hashedPassword);
    
    console.log('Updating admin user password...');
    const adminUser = await storage.getUserByUsername('admin');
    if (adminUser) {
      adminUser.password = hashedPassword;
      await storage.upsertUser(adminUser);
      console.log('Admin password updated successfully!');
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
  process.exit(0);
}

fixAdminPassword();