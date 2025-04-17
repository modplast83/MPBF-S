import { IStorage } from './storage';

// Helper function to safely initialize an entity with error handling
async function safeInitialize<T>(operation: () => Promise<T>, errorMessage: string): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    console.warn(`${errorMessage}: ${error.message || String(error)}`);
    return null;
  }
}

export async function initializeDemoData(storage: IStorage) {
  try {
    // Check if admin user exists first
    let admin = await storage.getUserByUsername("admin");
    
    // Create admin user if it doesn't exist
    if (!admin) {
      admin = await storage.createUser({
        username: "admin",
        password: "admin123",
        name: "Admin User",
        role: "administrator",
        isActive: true,
        sectionId: null,
      });
    }
    
    // Check if sections exist, create if they don't
    let extrusionSection = await storage.getSection("SEC001");
    if (!extrusionSection) {
      extrusionSection = await storage.createSection({
        id: "SEC001",
        name: "Extrusion",
      });
    }
    
    let printingSection = await storage.getSection("SEC002");
    if (!printingSection) {
      printingSection = await storage.createSection({
        id: "SEC002",
        name: "Printing",
      });
    }
    
    let cuttingSection = await storage.getSection("SEC003");
    if (!cuttingSection) {
      cuttingSection = await storage.createSection({
        id: "SEC003",
        name: "Cutting",
      });
    }
    
    // Check if machines exist, create if they don't
    let machine1 = await storage.getMachine("MCH001");
    if (!machine1) {
      machine1 = await storage.createMachine({
        id: "MCH001",
        name: "Extruder 1",
        sectionId: extrusionSection.id,
        isActive: true
      });
    }
    
    let machine2 = await storage.getMachine("MCH002");
    if (!machine2) {
      machine2 = await storage.createMachine({
        id: "MCH002",
        name: "Printing Machine 1",
        sectionId: printingSection.id,
        isActive: true
      });
    }
    
    let machine3 = await storage.getMachine("MCH003");
    if (!machine3) {
      machine3 = await storage.createMachine({
        id: "MCH003",
        name: "Cutting Machine 1",
        sectionId: cuttingSection.id,
        isActive: true
      });
    }
    
    // Check if master batches exist, create if they don't
    let whiteMb = await storage.getMasterBatch("MB001");
    if (!whiteMb) {
      whiteMb = await storage.createMasterBatch({
        id: "MB001",
        name: "White EP11105W",
      });
    }
    
    // Check if categories exist, create if they don't
    let bagCategory = await storage.getCategory("CAT001");
    if (!bagCategory) {
      bagCategory = await storage.createCategory({
        id: "CAT001",
        name: "Plastic Bags",
        code: "PB",
      });
    }
    
    // Check if items exist, create if they don't
    let smallBag = await storage.getItem("ITM019");
    if (!smallBag) {
      smallBag = await storage.createItem({
        id: "ITM019",
        categoryId: bagCategory.id,
        name: "Small Plastic Bag",
        fullName: "Small HDPE Plastic Bag",
      });
    }
    
    let mediumBag = await storage.getItem("ITM020");
    if (!mediumBag) {
      mediumBag = await storage.createItem({
        id: "ITM020",
        categoryId: bagCategory.id,
        name: "Medium Plastic Bag",
        fullName: "Medium HDPE Plastic Bag",
      });
    }
    
    let largeBag = await storage.getItem("ITM022");
    if (!largeBag) {
      largeBag = await storage.createItem({
        id: "ITM022",
        categoryId: bagCategory.id,
        name: "Large Plastic Bag",
        fullName: "Large HDPE Plastic Bag",
      });
    }
    
    // Get existing raw materials
    const existingRawMaterials = await storage.getRawMaterials();
    
    // Create raw materials if they don't exist
    const existingHdpe = existingRawMaterials.find(rm => rm.name === "HDPE" && rm.type === "Plastic");
    if (!existingHdpe) {
      await storage.createRawMaterial({
        name: "HDPE",
        type: "Plastic",
        quantity: 1000,
        unit: "Kg"
      });
    }
    
    const existingLdpe = existingRawMaterials.find(rm => rm.name === "LDPE" && rm.type === "Plastic");
    if (!existingLdpe) {
      await storage.createRawMaterial({
        name: "LDPE",
        type: "Plastic",
        quantity: 750,
        unit: "Kg"
      });
    }
    
    // Check if customers exist, create if they don't
    let customer1 = await safeInitialize(
      async () => {
        const existingCustomer = await storage.getCustomer("CUST001");
        if (existingCustomer) return existingCustomer;
        
        return await storage.createCustomer({
          id: "CUST001",
          code: "PH001",
          name: "Price House",
          nameAr: "",
          userId: admin.id,
          plateDrawerCode: "A-01",
        });
      },
      "Failed to get or create customer 1"
    );
    
    // If customer1 is null, use a default object to prevent further errors
    if (!customer1) {
      customer1 = {
        id: "CUST001",
        code: "PH001",
        name: "Price House",
      };
    }
    
    let customer2 = await safeInitialize(
      async () => {
        const existingCustomer = await storage.getCustomer("CUST002");
        if (existingCustomer) return existingCustomer;
        
        return await storage.createCustomer({
          id: "CUST002",
          code: "SM002",
          name: "Supermarket Chain",
          nameAr: "",
          userId: admin.id,
          plateDrawerCode: "B-02",
        });
      },
      "Failed to get or create customer 2"
    );
    
    // If customer2 is null, use a default object to prevent further errors
    if (!customer2) {
      customer2 = {
        id: "CUST002",
        code: "SM002",
        name: "Supermarket Chain",
      };
    }
    
    // Get existing customer products or create new ones
    // Since we don't have a specific ID to check for a customer product, just get them all and filter
    const existingProducts = await storage.getCustomerProducts();
    
    // Create product 1 if not in the existing products with the same customerId and itemId
    let product1 = existingProducts.find(p => p.customerId === customer1.id && p.itemId === smallBag.id);
    if (!product1) {
      product1 = await storage.createCustomerProduct({
        customerId: customer1.id,
        categoryId: bagCategory.id,
        itemId: smallBag.id,
        sizeCaption: "9×9+28",
        width: 9,
        leftF: 9,
        rightF: 28,
        thickness: 15,
        thicknessOne: 15,
        printingCylinder: 0,
        lengthCm: 0,
        cuttingLength: 0,
        rawMaterial: "HDPE",
        masterBatchId: whiteMb.id,
        printed: "/",
        cuttingUnit: "Kg",
        unitWeight: 1,
        packing: "20K/Bag",
        punching: "None",
        cover: "-",
        volum: null,
        knife: null,
        notes: null,
      });
    }
    
    // Create product 2 if not in the existing products
    let product2 = existingProducts.find(p => p.customerId === customer1.id && p.itemId === mediumBag.id);
    if (!product2) {
      product2 = await storage.createCustomerProduct({
        customerId: customer1.id,
        categoryId: bagCategory.id,
        itemId: mediumBag.id,
        sizeCaption: "10×10+35",
        width: 10,
        leftF: 10,
        rightF: 35,
        thickness: 12,
        thicknessOne: 12,
        printingCylinder: 0,
        lengthCm: 0,
        cuttingLength: 0,
        rawMaterial: "HDPE",
        masterBatchId: whiteMb.id,
        printed: "/",
        cuttingUnit: "Kg",
        unitWeight: 1.2,
        packing: "20K/Bag",
        punching: "None",
        cover: "-",
        volum: null,
        knife: null,
        notes: null,
      });
    }
    
    // Create product 3 if not in the existing products
    let product3 = existingProducts.find(p => p.customerId === customer2.id && p.itemId === largeBag.id);
    if (!product3) {
      product3 = await storage.createCustomerProduct({
        customerId: customer2.id,
        categoryId: bagCategory.id,
        itemId: largeBag.id,
        sizeCaption: "12×12+45",
        width: 12,
        leftF: 12,
        rightF: 45,
        thickness: 10,
        thicknessOne: 10,
        printingCylinder: 0,
        lengthCm: 0,
        cuttingLength: 0,
        rawMaterial: "LDPE",
        masterBatchId: whiteMb.id,
        printed: "/",
        cuttingUnit: "Kg",
        unitWeight: 1.5,
        packing: "20K/Bag",
        punching: "None",
        cover: "-",
        volum: null,
        knife: null,
        notes: null,
      });
    }
    
    // Get all existing orders
    const existingOrders = await storage.getOrders();
    
    // Create first order if it doesn't exist (since we don't have a specific ID, check by customerId)
    let order1;
    let order1Id = -1;
    const existingOrder1 = existingOrders.find(o => o.customerId === customer1.id && o.note === "Urgent delivery needed");
    if (existingOrder1) {
      order1 = existingOrder1;
      order1Id = existingOrder1.id;
    } else {
      order1 = await storage.createOrder({
        customerId: customer1.id,
        note: "Urgent delivery needed",
        userId: admin.id
      });
      order1Id = order1.id;
      
      // Update the order status
      await storage.updateOrder(order1.id, {
        status: "processing"
      });
    }
    
    // Get existing job orders
    const existingJobOrders = await storage.getJobOrders();
    
    // Create job orders for first order if they don't exist
    let jobOrder1;
    const existingJobOrder1 = existingJobOrders.find(jo => jo.orderId === order1Id && jo.customerProductId === product1.id);
    if (!existingJobOrder1) {
      jobOrder1 = await storage.createJobOrder({
        orderId: order1Id,
        customerProductId: product1.id,
        quantity: 500,
      });
    } else {
      jobOrder1 = existingJobOrder1;
    }
    
    let jobOrder2;
    const existingJobOrder2 = existingJobOrders.find(jo => jo.orderId === order1Id && jo.customerProductId === product2.id);
    if (!existingJobOrder2) {
      jobOrder2 = await storage.createJobOrder({
        orderId: order1Id,
        customerProductId: product2.id,
        quantity: 600,
      });
    } else {
      jobOrder2 = existingJobOrder2;
    }
    
    // Create second order if it doesn't exist
    let order2;
    let order2Id = -1;
    const existingOrder2 = existingOrders.find(o => o.customerId === customer2.id && o.note === "Monthly repeated order");
    if (existingOrder2) {
      order2 = existingOrder2;
      order2Id = existingOrder2.id;
    } else {
      order2 = await storage.createOrder({
        customerId: customer2.id,
        note: "Monthly repeated order",
        userId: admin.id
      });
      order2Id = order2.id;
      
      // Update the order status
      await storage.updateOrder(order2.id, {
        status: "pending"
      });
    }
    
    // Create job order for second order if it doesn't exist
    let jobOrder3;
    const existingJobOrder3 = existingJobOrders.find(jo => jo.orderId === order2Id && jo.customerProductId === product3.id);
    if (!existingJobOrder3) {
      jobOrder3 = await storage.createJobOrder({
        orderId: order2Id,
        customerProductId: product3.id,
        quantity: 400,
      });
    } else {
      jobOrder3 = existingJobOrder3;
    }
    
    // Get existing rolls
    const existingRolls = await storage.getRolls();
    
    // Create rolls if they don't exist
    let roll1 = existingRolls.find(r => r.id === "EX-124");
    if (!roll1 && jobOrder1) {
      roll1 = await storage.createRoll({
        id: "EX-124",
        jobOrderId: jobOrder1.id,
        serialNumber: "124",
        extrudingQty: 100,
        printingQty: 0,
        cuttingQty: 0,
        currentStage: "extrusion",
        status: "processing",
      });
    }
    
    let roll2 = existingRolls.find(r => r.id === "EX-125");
    if (!roll2 && jobOrder2) {
      roll2 = await storage.createRoll({
        id: "EX-125",
        jobOrderId: jobOrder2.id,
        serialNumber: "125",
        extrudingQty: 75,
        printingQty: 0,
        cuttingQty: 0,
        currentStage: "extrusion",
        status: "pending",
      });
    }
    
    let roll3 = existingRolls.find(r => r.id === "PR-089");
    if (!roll3 && jobOrder3) {
      roll3 = await storage.createRoll({
        id: "PR-089",
        jobOrderId: jobOrder3.id,
        serialNumber: "089",
        extrudingQty: 100,
        printingQty: 75,
        cuttingQty: 0,
        currentStage: "printing",
        status: "processing",
      });
    }
    
    // Create additional raw materials if they don't exist
    const existingInk = existingRawMaterials.find(rm => rm.name === "Colored Ink" && rm.type === "Ink");
    if (!existingInk) {
      await storage.createRawMaterial({
        name: "Colored Ink",
        type: "Ink",
        quantity: 500,
        unit: "L",
      });
    }
    
    // Update HDPE quantity if it exists
    if (existingHdpe) {
      await storage.updateRawMaterial(existingHdpe.id, {
        quantity: 2400 // Update to a higher quantity to simulate a purchase
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to initialize demo data:", error);
    return { success: false, error };
  }
}