import { IStorage } from './storage';

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
    
    // Create raw materials
    await storage.createRawMaterial({
      name: "HDPE",
      type: "Plastic",
      quantity: 1000,
      unit: "Kg"
    });
    
    await storage.createRawMaterial({
      name: "LDPE",
      type: "Plastic",
      quantity: 750,
      unit: "Kg"
    });
    
    // Create a customer
    const customer1 = await storage.createCustomer({
      id: "CUST001",
      code: "PH001",
      name: "Price House",
      nameAr: "",
      userId: admin.id,
      plateDrawerCode: "A-01",
    });
    
    const customer2 = await storage.createCustomer({
      id: "CUST002",
      code: "SM002",
      name: "Supermarket Chain",
      nameAr: "",
      userId: admin.id,
      plateDrawerCode: "B-02",
    });
    
    // Create customer products
    const product1 = await storage.createCustomerProduct({
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
    
    const product2 = await storage.createCustomerProduct({
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
    
    const product3 = await storage.createCustomerProduct({
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
    
    // Create first order
    const order1 = await storage.createOrder({
      customerId: customer1.id,
      note: "Urgent delivery needed",
      userId: admin.id
    });
    
    // Update the order status
    await storage.updateOrder(order1.id, {
      status: "processing"
    });
    
    // Create job orders for first order
    const jobOrder1 = await storage.createJobOrder({
      orderId: order1.id,
      customerProductId: product1.id,
      quantity: 500,
    });
    
    const jobOrder2 = await storage.createJobOrder({
      orderId: order1.id,
      customerProductId: product2.id,
      quantity: 600,
    });
    
    // Create second order
    const order2 = await storage.createOrder({
      customerId: customer2.id,
      note: "Monthly repeated order",
      userId: admin.id
    });
    
    // Update the order status
    await storage.updateOrder(order2.id, {
      status: "pending"
    });
    
    // Create job order for second order
    const jobOrder3 = await storage.createJobOrder({
      orderId: order2.id,
      customerProductId: product3.id,
      quantity: 400,
    });
    
    // Create rolls for order 1
    await storage.createRoll({
      id: "EX-124",
      jobOrderId: jobOrder1.id,
      serialNumber: "124",
      extrudingQty: 100,
      printingQty: 0,
      cuttingQty: 0,
      currentStage: "extrusion",
      status: "processing",
    });
    
    await storage.createRoll({
      id: "EX-125",
      jobOrderId: jobOrder2.id,
      serialNumber: "125",
      extrudingQty: 75,
      printingQty: 0,
      cuttingQty: 0,
      currentStage: "extrusion",
      status: "pending",
    });
    
    await storage.createRoll({
      id: "PR-089",
      jobOrderId: jobOrder3.id,
      serialNumber: "089",
      extrudingQty: 100,
      printingQty: 75,
      cuttingQty: 0,
      currentStage: "printing",
      status: "processing",
    });
    
    // Create raw materials
    await storage.createRawMaterial({
      name: "HDPE",
      type: "Plastic",
      quantity: 2400,
      unit: "Kg",
    });
    
    await storage.createRawMaterial({
      name: "Colored Ink",
      type: "Ink",
      quantity: 500,
      unit: "L",
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to initialize demo data:", error);
    return { success: false, error };
  }
}