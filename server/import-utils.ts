import { IStorage } from './storage';
import { parse } from 'csv-parse/sync';

/**
 * Process CSV data and import it into the database
 * @param entityType The type of entity to import
 * @param csvData The CSV data as a string
 * @param storage The storage interface
 */
export async function importFromCSV(entityType: string, csvData: string, storage: IStorage) {
  // Parse CSV data
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) {
    return { success: false, message: "No records found in the CSV file" };
  }

  const results = {
    success: true,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    switch (entityType) {
      case 'categories':
        await importCategories(records, storage, results);
        break;
      case 'customers':
        await importCustomers(records, storage, results);
        break;
      case 'items':
        await importItems(records, storage, results);
        break;
      case 'customerProducts':
        await importCustomerProducts(records, storage, results);
        break;
      case 'sections':
        await importSections(records, storage, results);
        break;
      case 'machines':
        await importMachines(records, storage, results);
        break;
      case 'masterBatches':
        await importMasterBatches(records, storage, results);
        break;
      case 'rawMaterials':
        await importRawMaterials(records, storage, results);
        break;
      case 'users':
        await importUsers(records, storage, results);
        break;
      default:
        return { success: false, message: `Unsupported entity type: ${entityType}` };
    }

    return results;
  } catch (error: any) {
    return { 
      success: false, 
      message: `Error processing ${entityType}: ${error.message}`,
      errors: results.errors
    };
  }
}

// Helper function to safely process each record
async function safeProcess<T>(
  record: any, 
  process: () => Promise<T>, 
  results: { created: number, updated: number, failed: number, errors: string[] }
): Promise<T | null> {
  try {
    return await process();
  } catch (error: any) {
    results.failed++;
    results.errors.push(`Error processing record ${JSON.stringify(record)}: ${error.message}`);
    return null;
  }
}

// Import categories
async function importCategories(records: any[], storage: IStorage, results: any) {
  for (const record of records) {
    const existingCategory = await storage.getCategory(record.id);
    
    if (existingCategory) {
      // Update existing category
      await safeProcess(record, async () => {
        const updated = await storage.updateCategory(record.id, {
          name: record.name,
          code: record.code,
        });
        if (updated) results.updated++;
        return updated;
      }, results);
    } else {
      // Create new category
      await safeProcess(record, async () => {
        const created = await storage.createCategory({
          id: record.id,
          name: record.name,
          code: record.code,
        });
        results.created++;
        return created;
      }, results);
    }
  }
}

// Import customers
async function importCustomers(records: any[], storage: IStorage, results: any) {
  for (const record of records) {
    const existingCustomer = await storage.getCustomer(record.id);
    
    if (existingCustomer) {
      // Update existing customer
      await safeProcess(record, async () => {
        const updated = await storage.updateCustomer(record.id, {
          code: record.code,
          name: record.name,
          nameAr: record.nameAr || "",
          userId: record.userId || null,
          plateDrawerCode: record.plateDrawerCode || null,
        });
        if (updated) results.updated++;
        return updated;
      }, results);
    } else {
      // Create new customer
      await safeProcess(record, async () => {
        const created = await storage.createCustomer({
          id: record.id,
          code: record.code,
          name: record.name,
          nameAr: record.nameAr || "",
          userId: record.userId || null,
          plateDrawerCode: record.plateDrawerCode || null,
        });
        results.created++;
        return created;
      }, results);
    }
  }
}

// Import items
async function importItems(records: any[], storage: IStorage, results: any) {
  for (const record of records) {
    const existingItem = await storage.getItem(record.id);
    
    if (existingItem) {
      // Update existing item
      await safeProcess(record, async () => {
        const updated = await storage.updateItem(record.id, {
          categoryId: record.categoryId,
          name: record.name,
          fullName: record.fullName,
        });
        if (updated) results.updated++;
        return updated;
      }, results);
    } else {
      // Create new item
      await safeProcess(record, async () => {
        const created = await storage.createItem({
          id: record.id,
          categoryId: record.categoryId,
          name: record.name,
          fullName: record.fullName,
        });
        results.created++;
        return created;
      }, results);
    }
  }
}

// Import customer products
async function importCustomerProducts(records: any[], storage: IStorage, results: any) {
  for (const record of records) {
    // Find if a customer product with the same customerId and itemId exists
    const existingProducts = await storage.getCustomerProducts();
    const existingProduct = existingProducts.find(p => 
      p.customerId === record.customerId && p.itemId === record.itemId
    );
    
    if (existingProduct) {
      // Update existing customer product
      await safeProcess(record, async () => {
        const updated = await storage.updateCustomerProduct(existingProduct.id, {
          customerId: record.customerId,
          categoryId: record.categoryId,
          itemId: record.itemId,
          sizeCaption: record.sizeCaption,
          width: parseFloat(record.width),
          leftF: parseFloat(record.leftF),
          rightF: parseFloat(record.rightF),
          thickness: parseFloat(record.thickness),
          thicknessOne: parseFloat(record.thicknessOne),
          printingCylinder: parseFloat(record.printingCylinder) || 0,
          lengthCm: parseFloat(record.lengthCm) || 0,
          cuttingLength: parseFloat(record.cuttingLength) || 0,
          rawMaterial: record.rawMaterial,
          masterBatchId: record.masterBatchId,
          printed: record.printed,
          cuttingUnit: record.cuttingUnit,
          unitWeight: parseFloat(record.unitWeight),
          packing: record.packing,
          punching: record.punching,
          cover: record.cover,
          volum: record.volum || null,
          knife: record.knife || null,
          notes: record.notes || null,
        });
        if (updated) results.updated++;
        return updated;
      }, results);
    } else {
      // Create new customer product
      await safeProcess(record, async () => {
        const created = await storage.createCustomerProduct({
          customerId: record.customerId,
          categoryId: record.categoryId,
          itemId: record.itemId,
          sizeCaption: record.sizeCaption,
          width: parseFloat(record.width),
          leftF: parseFloat(record.leftF),
          rightF: parseFloat(record.rightF),
          thickness: parseFloat(record.thickness),
          thicknessOne: parseFloat(record.thicknessOne),
          printingCylinder: parseFloat(record.printingCylinder) || 0,
          lengthCm: parseFloat(record.lengthCm) || 0,
          cuttingLength: parseFloat(record.cuttingLength) || 0,
          rawMaterial: record.rawMaterial,
          masterBatchId: record.masterBatchId,
          printed: record.printed,
          cuttingUnit: record.cuttingUnit,
          unitWeight: parseFloat(record.unitWeight),
          packing: record.packing,
          punching: record.punching,
          cover: record.cover,
          volum: record.volum || null,
          knife: record.knife || null,
          notes: record.notes || null,
        });
        results.created++;
        return created;
      }, results);
    }
  }
}

// Import sections
async function importSections(records: any[], storage: IStorage, results: any) {
  for (const record of records) {
    const existingSection = await storage.getSection(record.id);
    
    if (existingSection) {
      // Update existing section
      await safeProcess(record, async () => {
        const updated = await storage.updateSection(record.id, {
          name: record.name,
        });
        if (updated) results.updated++;
        return updated;
      }, results);
    } else {
      // Create new section
      await safeProcess(record, async () => {
        const created = await storage.createSection({
          id: record.id,
          name: record.name,
        });
        results.created++;
        return created;
      }, results);
    }
  }
}

// Import machines
async function importMachines(records: any[], storage: IStorage, results: any) {
  for (const record of records) {
    const existingMachine = await storage.getMachine(record.id);
    
    if (existingMachine) {
      // Update existing machine
      await safeProcess(record, async () => {
        const updated = await storage.updateMachine(record.id, {
          name: record.name,
          sectionId: record.sectionId,
          isActive: record.isActive === 'true',
        });
        if (updated) results.updated++;
        return updated;
      }, results);
    } else {
      // Create new machine
      await safeProcess(record, async () => {
        const created = await storage.createMachine({
          id: record.id,
          name: record.name,
          sectionId: record.sectionId,
          isActive: record.isActive === 'true',
        });
        results.created++;
        return created;
      }, results);
    }
  }
}

// Import master batches
async function importMasterBatches(records: any[], storage: IStorage, results: any) {
  for (const record of records) {
    const existingMasterBatch = await storage.getMasterBatch(record.id);
    
    if (existingMasterBatch) {
      // Update existing master batch
      await safeProcess(record, async () => {
        const updated = await storage.updateMasterBatch(record.id, {
          name: record.name,
        });
        if (updated) results.updated++;
        return updated;
      }, results);
    } else {
      // Create new master batch
      await safeProcess(record, async () => {
        const created = await storage.createMasterBatch({
          id: record.id,
          name: record.name,
        });
        results.created++;
        return created;
      }, results);
    }
  }
}

// Import raw materials
async function importRawMaterials(records: any[], storage: IStorage, results: any) {
  const existingRawMaterials = await storage.getRawMaterials();
  
  for (const record of records) {
    // Check if a raw material with the same name and type exists
    const existingMaterial = existingRawMaterials.find(m => 
      m.name === record.name && m.type === record.type
    );
    
    if (existingMaterial) {
      // Update existing raw material
      await safeProcess(record, async () => {
        const updated = await storage.updateRawMaterial(existingMaterial.id, {
          name: record.name,
          type: record.type,
          quantity: parseFloat(record.quantity),
          unit: record.unit,
        });
        if (updated) results.updated++;
        return updated;
      }, results);
    } else {
      // Create new raw material
      await safeProcess(record, async () => {
        const created = await storage.createRawMaterial({
          name: record.name,
          type: record.type,
          quantity: parseFloat(record.quantity),
          unit: record.unit,
        });
        results.created++;
        return created;
      }, results);
    }
  }
}

// Import users
async function importUsers(records: any[], storage: IStorage, results: any) {
  for (const record of records) {
    const existingUser = await storage.getUserByUsername(record.username);
    
    if (existingUser) {
      // Update existing user
      await safeProcess(record, async () => {
        const updated = await storage.updateUser(existingUser.id, {
          username: record.username,
          // Only update password if it's provided and not empty
          ...(record.password ? { password: record.password } : {}),
          name: record.name,
          role: record.role,
          isActive: record.isActive === 'true',
          sectionId: record.sectionId || null,
        });
        if (updated) results.updated++;
        return updated;
      }, results);
    } else {
      // Create new user
      await safeProcess(record, async () => {
        const created = await storage.createUser({
          username: record.username,
          password: record.password,
          name: record.name,
          role: record.role,
          isActive: record.isActive === 'true',
          sectionId: record.sectionId || null,
        });
        results.created++;
        return created;
      }, results);
    }
  }
}