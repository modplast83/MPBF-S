"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDemoData = initializeDemoData;
// Helper function to safely initialize an entity with error handling
function safeInitialize(operation, errorMessage) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, operation()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_1 = _a.sent();
                    console.warn("".concat(errorMessage, ": ").concat(error_1.message || String(error_1)));
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function initializeDemoData(storage) {
    return __awaiter(this, void 0, void 0, function () {
        var admin_1, extrusionSection, printingSection, cuttingSection, machine1, machine2, machine3, whiteMb, bagCategory, smallBag_1, mediumBag_1, largeBag_1, existingRawMaterials, existingHdpe, existingLdpe, customer1_1, customer2_1, existingProducts, product1_1, product2_1, product3_1, existingOrders, order1, order1Id_1, existingOrder1, existingJobOrders, jobOrder1, existingJobOrder1, jobOrder2, existingJobOrder2, order2, order2Id_1, existingOrder2, jobOrder3, existingJobOrder3, existingRolls, roll1, roll2, roll3, existingInk, error_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 81, , 82]);
                    return [4 /*yield*/, storage.getUserByUsername("admin")];
                case 1:
                    admin_1 = _a.sent();
                    if (!!admin_1) return [3 /*break*/, 3];
                    return [4 /*yield*/, storage.createUser({
                            username: "admin",
                            password: "admin123",
                            name: "Admin User",
                            role: "administrator",
                            isActive: true,
                            sectionId: null,
                        })];
                case 2:
                    admin_1 = _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, storage.getSection("SEC001")];
                case 4:
                    extrusionSection = _a.sent();
                    if (!!extrusionSection) return [3 /*break*/, 6];
                    return [4 /*yield*/, storage.createSection({
                            id: "SEC001",
                            name: "Extrusion",
                        })];
                case 5:
                    extrusionSection = _a.sent();
                    _a.label = 6;
                case 6: return [4 /*yield*/, storage.getSection("SEC002")];
                case 7:
                    printingSection = _a.sent();
                    if (!!printingSection) return [3 /*break*/, 9];
                    return [4 /*yield*/, storage.createSection({
                            id: "SEC002",
                            name: "Printing",
                        })];
                case 8:
                    printingSection = _a.sent();
                    _a.label = 9;
                case 9: return [4 /*yield*/, storage.getSection("SEC003")];
                case 10:
                    cuttingSection = _a.sent();
                    if (!!cuttingSection) return [3 /*break*/, 12];
                    return [4 /*yield*/, storage.createSection({
                            id: "SEC003",
                            name: "Cutting",
                        })];
                case 11:
                    cuttingSection = _a.sent();
                    _a.label = 12;
                case 12: return [4 /*yield*/, storage.getMachine("MCH001")];
                case 13:
                    machine1 = _a.sent();
                    if (!!machine1) return [3 /*break*/, 15];
                    return [4 /*yield*/, storage.createMachine({
                            id: "MCH001",
                            name: "Extruder 1",
                            sectionId: extrusionSection.id,
                            isActive: true
                        })];
                case 14:
                    machine1 = _a.sent();
                    _a.label = 15;
                case 15: return [4 /*yield*/, storage.getMachine("MCH002")];
                case 16:
                    machine2 = _a.sent();
                    if (!!machine2) return [3 /*break*/, 18];
                    return [4 /*yield*/, storage.createMachine({
                            id: "MCH002",
                            name: "Printing Machine 1",
                            sectionId: printingSection.id,
                            isActive: true
                        })];
                case 17:
                    machine2 = _a.sent();
                    _a.label = 18;
                case 18: return [4 /*yield*/, storage.getMachine("MCH003")];
                case 19:
                    machine3 = _a.sent();
                    if (!!machine3) return [3 /*break*/, 21];
                    return [4 /*yield*/, storage.createMachine({
                            id: "MCH003",
                            name: "Cutting Machine 1",
                            sectionId: cuttingSection.id,
                            isActive: true
                        })];
                case 20:
                    machine3 = _a.sent();
                    _a.label = 21;
                case 21: return [4 /*yield*/, storage.getMasterBatch("MB001")];
                case 22:
                    whiteMb = _a.sent();
                    if (!!whiteMb) return [3 /*break*/, 24];
                    return [4 /*yield*/, storage.createMasterBatch({
                            id: "MB001",
                            name: "White EP11105W",
                        })];
                case 23:
                    whiteMb = _a.sent();
                    _a.label = 24;
                case 24: return [4 /*yield*/, storage.getCategory("CAT001")];
                case 25:
                    bagCategory = _a.sent();
                    if (!!bagCategory) return [3 /*break*/, 27];
                    return [4 /*yield*/, storage.createCategory({
                            id: "CAT001",
                            name: "Plastic Bags",
                            code: "PB",
                        })];
                case 26:
                    bagCategory = _a.sent();
                    _a.label = 27;
                case 27: return [4 /*yield*/, storage.getItem("ITM019")];
                case 28:
                    smallBag_1 = _a.sent();
                    if (!!smallBag_1) return [3 /*break*/, 30];
                    return [4 /*yield*/, storage.createItem({
                            id: "ITM019",
                            categoryId: bagCategory.id,
                            name: "Small Plastic Bag",
                            fullName: "Small HDPE Plastic Bag",
                        })];
                case 29:
                    smallBag_1 = _a.sent();
                    _a.label = 30;
                case 30: return [4 /*yield*/, storage.getItem("ITM020")];
                case 31:
                    mediumBag_1 = _a.sent();
                    if (!!mediumBag_1) return [3 /*break*/, 33];
                    return [4 /*yield*/, storage.createItem({
                            id: "ITM020",
                            categoryId: bagCategory.id,
                            name: "Medium Plastic Bag",
                            fullName: "Medium HDPE Plastic Bag",
                        })];
                case 32:
                    mediumBag_1 = _a.sent();
                    _a.label = 33;
                case 33: return [4 /*yield*/, storage.getItem("ITM022")];
                case 34:
                    largeBag_1 = _a.sent();
                    if (!!largeBag_1) return [3 /*break*/, 36];
                    return [4 /*yield*/, storage.createItem({
                            id: "ITM022",
                            categoryId: bagCategory.id,
                            name: "Large Plastic Bag",
                            fullName: "Large HDPE Plastic Bag",
                        })];
                case 35:
                    largeBag_1 = _a.sent();
                    _a.label = 36;
                case 36: return [4 /*yield*/, storage.getRawMaterials()];
                case 37:
                    existingRawMaterials = _a.sent();
                    existingHdpe = existingRawMaterials.find(function (rm) { return rm.name === "HDPE" && rm.type === "Plastic"; });
                    if (!!existingHdpe) return [3 /*break*/, 39];
                    return [4 /*yield*/, storage.createRawMaterial({
                            name: "HDPE",
                            type: "Plastic",
                            quantity: 1000,
                            unit: "Kg"
                        })];
                case 38:
                    _a.sent();
                    _a.label = 39;
                case 39:
                    existingLdpe = existingRawMaterials.find(function (rm) { return rm.name === "LDPE" && rm.type === "Plastic"; });
                    if (!!existingLdpe) return [3 /*break*/, 41];
                    return [4 /*yield*/, storage.createRawMaterial({
                            name: "LDPE",
                            type: "Plastic",
                            quantity: 750,
                            unit: "Kg"
                        })];
                case 40:
                    _a.sent();
                    _a.label = 41;
                case 41: return [4 /*yield*/, safeInitialize(function () { return __awaiter(_this, void 0, void 0, function () {
                        var existingCustomer;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, storage.getCustomer("CUST001")];
                                case 1:
                                    existingCustomer = _a.sent();
                                    if (existingCustomer)
                                        return [2 /*return*/, existingCustomer];
                                    return [4 /*yield*/, storage.createCustomer({
                                            id: "CUST001",
                                            code: "PH001",
                                            name: "Price House",
                                            nameAr: "",
                                            userId: admin_1.id,
                                            plateDrawerCode: "A-01",
                                        })];
                                case 2: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); }, "Failed to get or create customer 1")];
                case 42:
                    customer1_1 = _a.sent();
                    // If customer1 is null, use a default object to prevent further errors
                    if (!customer1_1) {
                        customer1_1 = {
                            id: "CUST001",
                            code: "PH001",
                            name: "Price House",
                        };
                    }
                    return [4 /*yield*/, safeInitialize(function () { return __awaiter(_this, void 0, void 0, function () {
                            var existingCustomer;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, storage.getCustomer("CUST002")];
                                    case 1:
                                        existingCustomer = _a.sent();
                                        if (existingCustomer)
                                            return [2 /*return*/, existingCustomer];
                                        return [4 /*yield*/, storage.createCustomer({
                                                id: "CUST002",
                                                code: "SM002",
                                                name: "Supermarket Chain",
                                                nameAr: "",
                                                userId: admin_1.id,
                                                plateDrawerCode: "B-02",
                                            })];
                                    case 2: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); }, "Failed to get or create customer 2")];
                case 43:
                    customer2_1 = _a.sent();
                    // If customer2 is null, use a default object to prevent further errors
                    if (!customer2_1) {
                        customer2_1 = {
                            id: "CUST002",
                            code: "SM002",
                            name: "Supermarket Chain",
                        };
                    }
                    return [4 /*yield*/, storage.getCustomerProducts()];
                case 44:
                    existingProducts = _a.sent();
                    product1_1 = existingProducts.find(function (p) { return p.customerId === customer1_1.id && p.itemId === smallBag_1.id; });
                    if (!!product1_1) return [3 /*break*/, 46];
                    return [4 /*yield*/, storage.createCustomerProduct({
                            customerId: customer1_1.id,
                            categoryId: bagCategory.id,
                            itemId: smallBag_1.id,
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
                        })];
                case 45:
                    product1_1 = _a.sent();
                    _a.label = 46;
                case 46:
                    product2_1 = existingProducts.find(function (p) { return p.customerId === customer1_1.id && p.itemId === mediumBag_1.id; });
                    if (!!product2_1) return [3 /*break*/, 48];
                    return [4 /*yield*/, storage.createCustomerProduct({
                            customerId: customer1_1.id,
                            categoryId: bagCategory.id,
                            itemId: mediumBag_1.id,
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
                        })];
                case 47:
                    product2_1 = _a.sent();
                    _a.label = 48;
                case 48:
                    product3_1 = existingProducts.find(function (p) { return p.customerId === customer2_1.id && p.itemId === largeBag_1.id; });
                    if (!!product3_1) return [3 /*break*/, 50];
                    return [4 /*yield*/, storage.createCustomerProduct({
                            customerId: customer2_1.id,
                            categoryId: bagCategory.id,
                            itemId: largeBag_1.id,
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
                        })];
                case 49:
                    product3_1 = _a.sent();
                    _a.label = 50;
                case 50: return [4 /*yield*/, storage.getOrders()];
                case 51:
                    existingOrders = _a.sent();
                    order1 = void 0;
                    order1Id_1 = -1;
                    existingOrder1 = existingOrders.find(function (o) { return o.customerId === customer1_1.id && o.note === "Urgent delivery needed"; });
                    if (!existingOrder1) return [3 /*break*/, 52];
                    order1 = existingOrder1;
                    order1Id_1 = existingOrder1.id;
                    return [3 /*break*/, 55];
                case 52: return [4 /*yield*/, storage.createOrder({
                        customerId: customer1_1.id,
                        note: "Urgent delivery needed",
                        userId: admin_1.id
                    })];
                case 53:
                    order1 = _a.sent();
                    order1Id_1 = order1.id;
                    // Update the order status
                    return [4 /*yield*/, storage.updateOrder(order1.id, {
                            status: "processing"
                        })];
                case 54:
                    // Update the order status
                    _a.sent();
                    _a.label = 55;
                case 55: return [4 /*yield*/, storage.getJobOrders()];
                case 56:
                    existingJobOrders = _a.sent();
                    jobOrder1 = void 0;
                    existingJobOrder1 = existingJobOrders.find(function (jo) { return jo.orderId === order1Id_1 && jo.customerProductId === product1_1.id; });
                    if (!!existingJobOrder1) return [3 /*break*/, 58];
                    return [4 /*yield*/, storage.createJobOrder({
                            orderId: order1Id_1,
                            customerProductId: product1_1.id,
                            quantity: 500,
                        })];
                case 57:
                    jobOrder1 = _a.sent();
                    return [3 /*break*/, 59];
                case 58:
                    jobOrder1 = existingJobOrder1;
                    _a.label = 59;
                case 59:
                    jobOrder2 = void 0;
                    existingJobOrder2 = existingJobOrders.find(function (jo) { return jo.orderId === order1Id_1 && jo.customerProductId === product2_1.id; });
                    if (!!existingJobOrder2) return [3 /*break*/, 61];
                    return [4 /*yield*/, storage.createJobOrder({
                            orderId: order1Id_1,
                            customerProductId: product2_1.id,
                            quantity: 600,
                        })];
                case 60:
                    jobOrder2 = _a.sent();
                    return [3 /*break*/, 62];
                case 61:
                    jobOrder2 = existingJobOrder2;
                    _a.label = 62;
                case 62:
                    order2 = void 0;
                    order2Id_1 = -1;
                    existingOrder2 = existingOrders.find(function (o) { return o.customerId === customer2_1.id && o.note === "Monthly repeated order"; });
                    if (!existingOrder2) return [3 /*break*/, 63];
                    order2 = existingOrder2;
                    order2Id_1 = existingOrder2.id;
                    return [3 /*break*/, 66];
                case 63: return [4 /*yield*/, storage.createOrder({
                        customerId: customer2_1.id,
                        note: "Monthly repeated order",
                        userId: admin_1.id
                    })];
                case 64:
                    order2 = _a.sent();
                    order2Id_1 = order2.id;
                    // Update the order status
                    return [4 /*yield*/, storage.updateOrder(order2.id, {
                            status: "pending"
                        })];
                case 65:
                    // Update the order status
                    _a.sent();
                    _a.label = 66;
                case 66:
                    jobOrder3 = void 0;
                    existingJobOrder3 = existingJobOrders.find(function (jo) { return jo.orderId === order2Id_1 && jo.customerProductId === product3_1.id; });
                    if (!!existingJobOrder3) return [3 /*break*/, 68];
                    return [4 /*yield*/, storage.createJobOrder({
                            orderId: order2Id_1,
                            customerProductId: product3_1.id,
                            quantity: 400,
                        })];
                case 67:
                    jobOrder3 = _a.sent();
                    return [3 /*break*/, 69];
                case 68:
                    jobOrder3 = existingJobOrder3;
                    _a.label = 69;
                case 69: return [4 /*yield*/, storage.getRolls()];
                case 70:
                    existingRolls = _a.sent();
                    roll1 = existingRolls.find(function (r) { return r.id === "EX-124"; });
                    if (!(!roll1 && jobOrder1)) return [3 /*break*/, 72];
                    return [4 /*yield*/, storage.createRoll({
                            id: "EX-124",
                            jobOrderId: jobOrder1.id,
                            serialNumber: "124",
                            extrudingQty: 100,
                            printingQty: 0,
                            cuttingQty: 0,
                            currentStage: "extrusion",
                            status: "processing",
                        })];
                case 71:
                    roll1 = _a.sent();
                    _a.label = 72;
                case 72:
                    roll2 = existingRolls.find(function (r) { return r.id === "EX-125"; });
                    if (!(!roll2 && jobOrder2)) return [3 /*break*/, 74];
                    return [4 /*yield*/, storage.createRoll({
                            id: "EX-125",
                            jobOrderId: jobOrder2.id,
                            serialNumber: "125",
                            extrudingQty: 75,
                            printingQty: 0,
                            cuttingQty: 0,
                            currentStage: "extrusion",
                            status: "pending",
                        })];
                case 73:
                    roll2 = _a.sent();
                    _a.label = 74;
                case 74:
                    roll3 = existingRolls.find(function (r) { return r.id === "PR-089"; });
                    if (!(!roll3 && jobOrder3)) return [3 /*break*/, 76];
                    return [4 /*yield*/, storage.createRoll({
                            id: "PR-089",
                            jobOrderId: jobOrder3.id,
                            serialNumber: "089",
                            extrudingQty: 100,
                            printingQty: 75,
                            cuttingQty: 0,
                            currentStage: "printing",
                            status: "processing",
                        })];
                case 75:
                    roll3 = _a.sent();
                    _a.label = 76;
                case 76:
                    existingInk = existingRawMaterials.find(function (rm) { return rm.name === "Colored Ink" && rm.type === "Ink"; });
                    if (!!existingInk) return [3 /*break*/, 78];
                    return [4 /*yield*/, storage.createRawMaterial({
                            name: "Colored Ink",
                            type: "Ink",
                            quantity: 500,
                            unit: "L",
                        })];
                case 77:
                    _a.sent();
                    _a.label = 78;
                case 78:
                    if (!existingHdpe) return [3 /*break*/, 80];
                    return [4 /*yield*/, storage.updateRawMaterial(existingHdpe.id, {
                            quantity: 2400 // Update to a higher quantity to simulate a purchase
                        })];
                case 79:
                    _a.sent();
                    _a.label = 80;
                case 80: return [2 /*return*/, { success: true }];
                case 81:
                    error_2 = _a.sent();
                    console.error("Failed to initialize demo data:", error_2);
                    return [2 /*return*/, { success: false, error: error_2 }];
                case 82: return [2 /*return*/];
            }
        });
    });
}
