import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

async function migratePermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const db = drizzle(pool);

  try {
    console.log('Starting permissions system migration...');

    // Step 1: Create modules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        route TEXT,
        icon TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created modules table');

    // Step 2: Insert default modules
    const modules = [
      // Setup modules
      { name: 'Categories', displayName: 'Categories', category: 'setup', route: '/setup/categories', icon: 'FolderOpen' },
      { name: 'Products', displayName: 'Products', category: 'setup', route: '/setup/products', icon: 'Package' },
      { name: 'Customers', displayName: 'Customers', category: 'setup', route: '/setup/customers', icon: 'Users' },
      { name: 'Items', displayName: 'Items', category: 'setup', route: '/setup/items', icon: 'Box' },
      { name: 'Sections', displayName: 'Sections', category: 'setup', route: '/setup/sections', icon: 'Building2' },
      { name: 'Machines', displayName: 'Machines', category: 'setup', route: '/setup/machines', icon: 'Cog' },
      { name: 'Users', displayName: 'Users', category: 'setup', route: '/setup/users', icon: 'UserPlus' },
      
      // Production modules
      { name: 'Orders', displayName: 'Orders', category: 'production', route: '/orders', icon: 'ClipboardList' },
      { name: 'Workflow', displayName: 'Workflow', category: 'production', route: '/production/workflow', icon: 'GitBranch' },
      { name: 'Mix Materials', displayName: 'Mix Materials', category: 'production', route: '/production/mix-materials', icon: 'Beaker' },
      { name: 'Bottleneck Monitor', displayName: 'Bottleneck Monitor', category: 'production', route: '/production/bottleneck', icon: 'AlertTriangle' },
      { name: 'Production Metrics', displayName: 'Production Metrics', category: 'production', route: '/production/metrics', icon: 'BarChart3' },
      { name: 'IoT Monitor', displayName: 'IoT Monitor', category: 'production', route: '/production/iot', icon: 'Wifi' },
      
      // Warehouse modules
      { name: 'Raw Materials', displayName: 'Raw Materials', category: 'warehouse', route: '/warehouse/raw-materials', icon: 'Package2' },
      { name: 'Final Products', displayName: 'Final Products', category: 'warehouse', route: '/warehouse/final-products', icon: 'PackageCheck' },
      
      // Quality modules
      { name: 'Unified Dashboard', displayName: 'Quality Dashboard', category: 'quality', route: '/quality/unified-dashboard', icon: 'Shield' },
      
      // HR modules
      { name: 'Time Attendance', displayName: 'Time Attendance', category: 'hr', route: '/hr/time-attendance', icon: 'Clock' },
      { name: 'Employee of the Month', displayName: 'Employee of the Month', category: 'hr', route: '/hr/employee-of-month', icon: 'Award' },
      { name: 'Violation and Complaint', displayName: 'Violations & Complaints', category: 'hr', route: '/hr/violations', icon: 'AlertCircle' },
      
      // Maintenance modules
      { name: 'Maintenance Requests', displayName: 'Maintenance Requests', category: 'maintenance', route: '/maintenance/requests', icon: 'Wrench' },
      { name: 'Maintenance Actions', displayName: 'Maintenance Actions', category: 'maintenance', route: '/maintenance/actions', icon: 'Settings' },
      { name: 'Maintenance Schedule', displayName: 'Maintenance Schedule', category: 'maintenance', route: '/maintenance/schedule', icon: 'Calendar' },
      
      // Mobile modules
      { name: 'Dashboard', displayName: 'Dashboard', category: 'mobile', route: '/mobile/dashboard', icon: 'Smartphone' },
      { name: 'Operator Tasks', displayName: 'Operator Tasks', category: 'mobile', route: '/mobile/tasks', icon: 'CheckSquare' },
      { name: 'Quick Updates', displayName: 'Quick Updates', category: 'mobile', route: '/mobile/updates', icon: 'MessageSquare' },
      { name: 'Device Management', displayName: 'Device Management', category: 'mobile', route: '/mobile/devices', icon: 'Tablet' },
      { name: 'My Dashboard', displayName: 'My Dashboard', category: 'mobile', route: '/mobile/my-dashboard', icon: 'User' },
      
      // Reports modules
      { name: 'Reports', displayName: 'Reports', category: 'reports', route: '/reports', icon: 'FileText' },
      
      // Tools modules
      { name: 'Bag Weight Calculator', displayName: 'Bag Weight Calculator', category: 'tools', route: '/tools/bag-weight', icon: 'Calculator' },
      { name: 'Ink Consumption', displayName: 'Ink Consumption', category: 'tools', route: '/tools/ink-consumption', icon: 'Droplets' },
      { name: 'Mix Colors', displayName: 'Mix Colors', category: 'tools', route: '/tools/mix-colors', icon: 'Palette' },
      { name: 'Utility Tools', displayName: 'Utility Tools', category: 'tools', route: '/tools/utilities', icon: 'Wrench' },
      { name: 'Cost', displayName: 'Cost Calculator', category: 'tools', route: '/tools/cost', icon: 'DollarSign' },
      { name: 'Cliches', displayName: 'Cliches', category: 'tools', route: '/tools/cliches', icon: 'Image' },
      
      // System modules
      { name: 'Database', displayName: 'Database', category: 'system', route: '/system/database', icon: 'Database' },
      { name: 'Permissions', displayName: 'Permissions', category: 'system', route: '/system/permissions', icon: 'Lock' },
      { name: 'Import & Export', displayName: 'Import & Export', category: 'system', route: '/system/import-export', icon: 'Download' },
      { name: 'SMS Management', displayName: 'SMS Management', category: 'system', route: '/system/sms', icon: 'MessageCircle' },
      { name: 'Server Management', displayName: 'Server Management', category: 'system', route: '/system/server', icon: 'Server' }
    ];

    for (const module of modules) {
      await pool.query(`
        INSERT INTO modules (name, display_name, description, category, route, icon, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          category = EXCLUDED.category,
          route = EXCLUDED.route,
          icon = EXCLUDED.icon,
          updated_at = NOW()
      `, [module.name, module.displayName, module.displayName, module.category, module.route, module.icon, true]);
    }
    console.log('✓ Inserted default modules');

    // Step 3: Create backup of existing permissions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions_backup AS 
      SELECT * FROM permissions;
    `);
    console.log('✓ Backed up existing permissions');

    // Step 4: Create new permissions table structure
    await pool.query(`DROP TABLE IF EXISTS permissions_new;`);
    await pool.query(`
      CREATE TABLE permissions_new (
        id SERIAL PRIMARY KEY,
        section_id TEXT NOT NULL REFERENCES sections(id),
        module_id INTEGER NOT NULL REFERENCES modules(id),
        can_view BOOLEAN DEFAULT false,
        can_create BOOLEAN DEFAULT false,
        can_edit BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(section_id, module_id)
      );
    `);
    console.log('✓ Created new permissions table structure');

    // Step 5: Get all sections to create permissions for each section-module combination
    const sectionsResult = await pool.query('SELECT id, name FROM sections');
    const sections = sectionsResult.rows;
    
    const modulesResult = await pool.query('SELECT id, name FROM modules WHERE is_active = true');
    const modulesMap = modulesResult.rows;

    console.log(`Found ${sections.length} sections and ${modulesMap.length} modules`);

    // Step 6: Create default permissions for each section-module combination
    for (const section of sections) {
      for (const module of modulesMap) {
        // Give full permissions to admin sections, limited to others
        const isAdminSection = section.name.toLowerCase().includes('admin') || section.name.toLowerCase().includes('management');
        
        await pool.query(`
          INSERT INTO permissions_new (section_id, module_id, can_view, can_create, can_edit, can_delete, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (section_id, module_id) DO NOTHING
        `, [
          section.id, 
          module.id, 
          true, // All sections can view
          isAdminSection, // Only admin sections can create
          isAdminSection, // Only admin sections can edit
          isAdminSection, // Only admin sections can delete
          true
        ]);
      }
    }
    console.log('✓ Created default section-module permissions');

    // Step 7: Replace old permissions table with new one
    await pool.query('DROP TABLE permissions');
    await pool.query('ALTER TABLE permissions_new RENAME TO permissions');
    console.log('✓ Replaced permissions table');

    console.log('Permissions system migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migratePermissions().catch(console.error);
}

export { migratePermissions };