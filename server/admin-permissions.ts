import { storage } from './storage';

// All available modules in the system (copied from client/src/pages/system/permissions.tsx)
const ALL_MODULES = [
  "Dashboard", 
  "Orders", 
  "Setup", 
  "Production",
  "Workflow", 
  "Warehouse",
  "Quality", 
  "Reports", 
  "System",
  "Tools",
  // Setup submodules
  "Categories", 
  "Products", 
  "Customers", 
  "Items", 
  "Sections", 
  "Machines", 
  "Users",
  // Warehouse submodules
  "Raw Materials", 
  "Final Products",
  // Production submodules
  "Mix Materials",
  // Quality submodules
  "Check Types", 
  "Quality Checks", 
  "Corrective Actions",
  // Tools submodules
  "Bag Weight Calculator", 
  "Ink Consumption", 
  "Utility Tools",
  // System submodules
  "Database", 
  "Permissions", 
  "Import & Export", 
  "SMS Management"
];

async function initializeAdminPermissions() {
  try {
    console.log("Starting admin permissions initialization...");
    
    // Role for admin
    const roles = ["admin", "administrator"];
    
    // Count existing permissions
    const existingPermissions = await storage.getPermissions();
    console.log(`Found ${existingPermissions.length} existing permissions`);
    
    // Track created permissions
    let created = 0;
    
    // For each role and module, create full permissions
    for (const role of roles) {
      for (const module of ALL_MODULES) {
        // Check if permission already exists
        const existingPermission = existingPermissions.find(
          p => p.role === role && p.module === module
        );
        
        if (existingPermission) {
          console.log(`Permission for ${role}/${module} already exists with ID ${existingPermission.id}`);
          
          // Update permissions to ensure they have full access
          await storage.updatePermission(existingPermission.id, {
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            isActive: true
          });
          console.log(`Updated existing permission for ${role}/${module}`);
        } else {
          // Create new permission
          await storage.createPermission({
            role,
            module,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            isActive: true
          });
          created++;
          console.log(`Created new permission for ${role}/${module}`);
        }
      }
    }
    
    console.log(`Admin permissions initialization completed.`);
    console.log(`Created ${created} new permissions.`);
    console.log(`Updated ${existingPermissions.length} existing permissions.`);
    
    return { created, updated: existingPermissions.length };
  } catch (error) {
    console.error("Error initializing admin permissions:", error);
    throw error;
  }
}

export { initializeAdminPermissions };