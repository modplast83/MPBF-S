"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.storage = exports.MemStorage = void 0;
var express_session_1 = require("express-session");
var MemStorage = /** @class */ (function () {
    function MemStorage() {
        // Initialize session store
        var MemoryStore = require('memorystore')(express_session_1.default);
        this.sessionStore = new MemoryStore({
            checkPeriod: 86400000 // Prune expired entries every 24h
        });
        this.users = new Map();
        this.categories = new Map();
        this.items = new Map();
        this.sections = new Map();
        this.machines = new Map();
        this.masterBatches = new Map();
        this.customers = new Map();
        this.customerProducts = new Map();
        this.orders = new Map();
        this.jobOrders = new Map();
        this.rolls = new Map();
        this.rawMaterials = new Map();
        this.finalProducts = new Map();
        this.smsMessages = new Map();
        this.mixMaterials = new Map();
        this.mixMachines = new Map();
        this.mixItems = new Map();
        this.qualityChecks = new Map();
        this.correctiveActions = new Map();
        this.permissions = new Map();
        this.currentCustomerProductId = 1;
        this.currentOrderId = 1;
        this.currentJobOrderId = 1;
        this.currentRawMaterialId = 1;
        this.currentFinalProductId = 1;
        this.currentSmsMessageId = 1;
        this.currentMixMaterialId = 1;
        this.currentMixMachineId = 1;
        this.currentMixItemId = 1;
        this.currentQualityCheckId = 1;
        this.currentCorrectiveActionId = 1;
        this.currentPermissionId = 1;
        // Initialize with sample data
        this.initializeData();
    }
    MemStorage.prototype.initializeData = function () {
        // Add an admin user
        this.createUser({
            id: "admin-user-001",
            username: "admin",
            password: "admin123",
            isAdmin: true,
            isActive: true,
            sectionId: null,
            email: null,
            firstName: null,
            lastName: null,
            bio: null,
            profileImageUrl: null,
            phone: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // Add sections
        var extrusionSection = this.createSection({
            id: "SEC001",
            name: "Extrusion",
        });
        var printingSection = this.createSection({
            id: "SEC002",
            name: "Printing",
        });
        var cuttingSection = this.createSection({
            id: "SEC003",
            name: "Cutting",
        });
        // Add master batches
        this.createMasterBatch({
            id: "MB001",
            name: "White EP11105W",
        });
        // Add categories
        var bagCategory = this.createCategory({
            id: "CAT001",
            name: "Plastic Bags",
            code: "PB",
        });
        // Add items
        this.createItem({
            id: "ITM019",
            categoryId: bagCategory.id,
            name: "Small Plastic Bag",
            fullName: "Small HDPE Plastic Bag",
        });
        this.createItem({
            id: "ITM020",
            categoryId: bagCategory.id,
            name: "Medium Plastic Bag",
            fullName: "Medium HDPE Plastic Bag",
        });
        this.createItem({
            id: "ITM022",
            categoryId: bagCategory.id,
            name: "Large Plastic Bag",
            fullName: "Large HDPE Plastic Bag",
        });
    };
    // User management
    MemStorage.prototype.getUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values())];
            });
        });
    };
    MemStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.users.get(id)];
            });
        });
    };
    MemStorage.prototype.getUserByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values()).find(function (user) { return user.username === username; })];
            });
        });
    };
    MemStorage.prototype.createUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newUser;
            return __generator(this, function (_a) {
                id = user.id || "U".concat(this.users.size + 1).padStart(4, "0");
                newUser = __assign(__assign({}, user), { id: id });
                this.users.set(id, newUser);
                return [2 /*return*/, newUser];
            });
        });
    };
    MemStorage.prototype.updateUser = function (id, user) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, updatedUser;
            return __generator(this, function (_a) {
                existingUser = this.users.get(id);
                if (!existingUser)
                    return [2 /*return*/, undefined];
                updatedUser = __assign(__assign({}, existingUser), user);
                this.users.set(id, updatedUser);
                return [2 /*return*/, updatedUser];
            });
        });
    };
    MemStorage.prototype.deleteUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.users.delete(id)];
            });
        });
    };
    MemStorage.prototype.upsertUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, updatedUser;
            return __generator(this, function (_a) {
                existingUser = user.id ? this.users.get(user.id) : undefined;
                if (existingUser) {
                    updatedUser = __assign(__assign(__assign({}, existingUser), user), { updatedAt: new Date() });
                    this.users.set(user.id, updatedUser);
                    return [2 /*return*/, updatedUser];
                }
                else {
                    // Create a new user
                    return [2 /*return*/, this.createUser(__assign(__assign({}, user), { createdAt: new Date(), updatedAt: new Date() }))];
                }
                return [2 /*return*/];
            });
        });
    };
    // Categories
    MemStorage.prototype.getCategories = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.categories.values())];
            });
        });
    };
    MemStorage.prototype.getCategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.categories.get(id)];
            });
        });
    };
    MemStorage.prototype.getCategoryByCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.categories.values()).find(function (category) { return category.code === code; })];
            });
        });
    };
    MemStorage.prototype.createCategory = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            var newCategory;
            return __generator(this, function (_a) {
                newCategory = __assign({}, category);
                this.categories.set(category.id, newCategory);
                return [2 /*return*/, newCategory];
            });
        });
    };
    MemStorage.prototype.updateCategory = function (id, category) {
        return __awaiter(this, void 0, void 0, function () {
            var existingCategory, updatedCategory;
            return __generator(this, function (_a) {
                existingCategory = this.categories.get(id);
                if (!existingCategory)
                    return [2 /*return*/, undefined];
                updatedCategory = __assign(__assign({}, existingCategory), category);
                this.categories.set(id, updatedCategory);
                return [2 /*return*/, updatedCategory];
            });
        });
    };
    MemStorage.prototype.deleteCategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.categories.delete(id)];
            });
        });
    };
    // Items
    MemStorage.prototype.getItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.items.values())];
            });
        });
    };
    MemStorage.prototype.getItemsByCategory = function (categoryId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.items.values()).filter(function (item) { return item.categoryId === categoryId; })];
            });
        });
    };
    MemStorage.prototype.getItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.items.get(id)];
            });
        });
    };
    MemStorage.prototype.createItem = function (item) {
        return __awaiter(this, void 0, void 0, function () {
            var newItem;
            return __generator(this, function (_a) {
                newItem = __assign({}, item);
                this.items.set(item.id, newItem);
                return [2 /*return*/, newItem];
            });
        });
    };
    MemStorage.prototype.updateItem = function (id, item) {
        return __awaiter(this, void 0, void 0, function () {
            var existingItem, updatedItem;
            return __generator(this, function (_a) {
                existingItem = this.items.get(id);
                if (!existingItem)
                    return [2 /*return*/, undefined];
                updatedItem = __assign(__assign({}, existingItem), item);
                this.items.set(id, updatedItem);
                return [2 /*return*/, updatedItem];
            });
        });
    };
    MemStorage.prototype.deleteItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.items.delete(id)];
            });
        });
    };
    // Sections
    MemStorage.prototype.getSections = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.sections.values())];
            });
        });
    };
    MemStorage.prototype.getSection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sections.get(id)];
            });
        });
    };
    MemStorage.prototype.createSection = function (section) {
        return __awaiter(this, void 0, void 0, function () {
            var newSection;
            return __generator(this, function (_a) {
                newSection = __assign({}, section);
                this.sections.set(section.id, newSection);
                return [2 /*return*/, newSection];
            });
        });
    };
    MemStorage.prototype.updateSection = function (id, section) {
        return __awaiter(this, void 0, void 0, function () {
            var existingSection, updatedSection;
            return __generator(this, function (_a) {
                existingSection = this.sections.get(id);
                if (!existingSection)
                    return [2 /*return*/, undefined];
                updatedSection = __assign(__assign({}, existingSection), section);
                this.sections.set(id, updatedSection);
                return [2 /*return*/, updatedSection];
            });
        });
    };
    MemStorage.prototype.deleteSection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sections.delete(id)];
            });
        });
    };
    // Machines
    MemStorage.prototype.getMachines = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.machines.values())];
            });
        });
    };
    MemStorage.prototype.getMachinesBySection = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.machines.values()).filter(function (machine) { return machine.sectionId === sectionId; })];
            });
        });
    };
    MemStorage.prototype.getMachine = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.machines.get(id)];
            });
        });
    };
    MemStorage.prototype.createMachine = function (machine) {
        return __awaiter(this, void 0, void 0, function () {
            var newMachine;
            return __generator(this, function (_a) {
                newMachine = __assign({}, machine);
                this.machines.set(machine.id, newMachine);
                return [2 /*return*/, newMachine];
            });
        });
    };
    MemStorage.prototype.updateMachine = function (id, machine) {
        return __awaiter(this, void 0, void 0, function () {
            var existingMachine, updatedMachine;
            return __generator(this, function (_a) {
                existingMachine = this.machines.get(id);
                if (!existingMachine)
                    return [2 /*return*/, undefined];
                updatedMachine = __assign(__assign({}, existingMachine), machine);
                this.machines.set(id, updatedMachine);
                return [2 /*return*/, updatedMachine];
            });
        });
    };
    MemStorage.prototype.deleteMachine = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.machines.delete(id)];
            });
        });
    };
    // Master Batches
    MemStorage.prototype.getMasterBatches = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.masterBatches.values())];
            });
        });
    };
    MemStorage.prototype.getMasterBatch = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.masterBatches.get(id)];
            });
        });
    };
    MemStorage.prototype.createMasterBatch = function (masterBatch) {
        return __awaiter(this, void 0, void 0, function () {
            var newMasterBatch;
            return __generator(this, function (_a) {
                newMasterBatch = __assign({}, masterBatch);
                this.masterBatches.set(masterBatch.id, newMasterBatch);
                return [2 /*return*/, newMasterBatch];
            });
        });
    };
    MemStorage.prototype.updateMasterBatch = function (id, masterBatch) {
        return __awaiter(this, void 0, void 0, function () {
            var existingMasterBatch, updatedMasterBatch;
            return __generator(this, function (_a) {
                existingMasterBatch = this.masterBatches.get(id);
                if (!existingMasterBatch)
                    return [2 /*return*/, undefined];
                updatedMasterBatch = __assign(__assign({}, existingMasterBatch), masterBatch);
                this.masterBatches.set(id, updatedMasterBatch);
                return [2 /*return*/, updatedMasterBatch];
            });
        });
    };
    MemStorage.prototype.deleteMasterBatch = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.masterBatches.delete(id)];
            });
        });
    };
    // Customers
    MemStorage.prototype.getCustomers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.customers.values())];
            });
        });
    };
    MemStorage.prototype.getCustomer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.customers.get(id)];
            });
        });
    };
    MemStorage.prototype.getCustomerByCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.customers.values()).find(function (customer) { return customer.code === code; })];
            });
        });
    };
    MemStorage.prototype.createCustomer = function (customer) {
        return __awaiter(this, void 0, void 0, function () {
            var newCustomer;
            return __generator(this, function (_a) {
                newCustomer = __assign({}, customer);
                this.customers.set(customer.id, newCustomer);
                return [2 /*return*/, newCustomer];
            });
        });
    };
    MemStorage.prototype.updateCustomer = function (id, customer) {
        return __awaiter(this, void 0, void 0, function () {
            var existingCustomer, updatedCustomer;
            return __generator(this, function (_a) {
                existingCustomer = this.customers.get(id);
                if (!existingCustomer)
                    return [2 /*return*/, undefined];
                updatedCustomer = __assign(__assign({}, existingCustomer), customer);
                this.customers.set(id, updatedCustomer);
                return [2 /*return*/, updatedCustomer];
            });
        });
    };
    MemStorage.prototype.deleteCustomer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.customers.delete(id)];
            });
        });
    };
    // Customer Products
    MemStorage.prototype.getCustomerProducts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.customerProducts.values())];
            });
        });
    };
    MemStorage.prototype.getCustomerProductsByCustomer = function (customerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.customerProducts.values()).filter(function (cp) { return cp.customerId === customerId; })];
            });
        });
    };
    MemStorage.prototype.getCustomerProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.customerProducts.get(id)];
            });
        });
    };
    MemStorage.prototype.createCustomerProduct = function (customerProduct) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newCustomerProduct;
            return __generator(this, function (_a) {
                id = this.currentCustomerProductId++;
                newCustomerProduct = __assign(__assign({}, customerProduct), { id: id });
                this.customerProducts.set(id, newCustomerProduct);
                return [2 /*return*/, newCustomerProduct];
            });
        });
    };
    MemStorage.prototype.updateCustomerProduct = function (id, customerProduct) {
        return __awaiter(this, void 0, void 0, function () {
            var existingCustomerProduct, updatedCustomerProduct;
            return __generator(this, function (_a) {
                existingCustomerProduct = this.customerProducts.get(id);
                if (!existingCustomerProduct)
                    return [2 /*return*/, undefined];
                updatedCustomerProduct = __assign(__assign({}, existingCustomerProduct), customerProduct);
                this.customerProducts.set(id, updatedCustomerProduct);
                return [2 /*return*/, updatedCustomerProduct];
            });
        });
    };
    MemStorage.prototype.deleteCustomerProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.customerProducts.delete(id)];
            });
        });
    };
    // Orders
    MemStorage.prototype.getOrders = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.orders.values())];
            });
        });
    };
    MemStorage.prototype.getOrder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.orders.get(id)];
            });
        });
    };
    MemStorage.prototype.createOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newOrder;
            return __generator(this, function (_a) {
                id = this.currentOrderId++;
                newOrder = __assign(__assign({}, order), { id: id, date: new Date(), status: "pending" });
                this.orders.set(id, newOrder);
                return [2 /*return*/, newOrder];
            });
        });
    };
    MemStorage.prototype.updateOrder = function (id, order) {
        return __awaiter(this, void 0, void 0, function () {
            var existingOrder, updatedOrder;
            return __generator(this, function (_a) {
                existingOrder = this.orders.get(id);
                if (!existingOrder)
                    return [2 /*return*/, undefined];
                updatedOrder = __assign(__assign({}, existingOrder), order);
                this.orders.set(id, updatedOrder);
                return [2 /*return*/, updatedOrder];
            });
        });
    };
    MemStorage.prototype.deleteOrder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var relatedJobOrders, _i, relatedJobOrders_1, jobOrder, rolls, _a, rolls_1, roll, qualityChecks, _b, qualityChecks_1, check, correctiveActions, _c, correctiveActions_1, action, jobOrderQualityChecks, _d, jobOrderQualityChecks_1, check, correctiveActions, _e, correctiveActions_2, action, jobOrderSmsMessages, _f, jobOrderSmsMessages_1, message, finalProducts, _g, finalProducts_1, product, orderSmsMessages, _h, orderSmsMessages_1, message, error_1;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _j.trys.push([0, 46, , 47]);
                        return [4 /*yield*/, this.getJobOrdersByOrder(id)];
                    case 1:
                        relatedJobOrders = _j.sent();
                        _i = 0, relatedJobOrders_1 = relatedJobOrders;
                        _j.label = 2;
                    case 2:
                        if (!(_i < relatedJobOrders_1.length)) return [3 /*break*/, 40];
                        jobOrder = relatedJobOrders_1[_i];
                        return [4 /*yield*/, this.getRollsByJobOrder(jobOrder.id)];
                    case 3:
                        rolls = _j.sent();
                        _a = 0, rolls_1 = rolls;
                        _j.label = 4;
                    case 4:
                        if (!(_a < rolls_1.length)) return [3 /*break*/, 17];
                        roll = rolls_1[_a];
                        return [4 /*yield*/, this.getQualityChecksByRoll(roll.id)];
                    case 5:
                        qualityChecks = _j.sent();
                        _b = 0, qualityChecks_1 = qualityChecks;
                        _j.label = 6;
                    case 6:
                        if (!(_b < qualityChecks_1.length)) return [3 /*break*/, 14];
                        check = qualityChecks_1[_b];
                        return [4 /*yield*/, this.getCorrectiveActionsByQualityCheck(check.id)];
                    case 7:
                        correctiveActions = _j.sent();
                        _c = 0, correctiveActions_1 = correctiveActions;
                        _j.label = 8;
                    case 8:
                        if (!(_c < correctiveActions_1.length)) return [3 /*break*/, 11];
                        action = correctiveActions_1[_c];
                        return [4 /*yield*/, this.deleteCorrectiveAction(action.id)];
                    case 9:
                        _j.sent();
                        _j.label = 10;
                    case 10:
                        _c++;
                        return [3 /*break*/, 8];
                    case 11: 
                    // 2.1.1.2 Delete the quality check
                    return [4 /*yield*/, this.deleteQualityCheck(check.id)];
                    case 12:
                        // 2.1.1.2 Delete the quality check
                        _j.sent();
                        _j.label = 13;
                    case 13:
                        _b++;
                        return [3 /*break*/, 6];
                    case 14: 
                    // 2.1.2 Delete the roll
                    return [4 /*yield*/, this.deleteRoll(roll.id)];
                    case 15:
                        // 2.1.2 Delete the roll
                        _j.sent();
                        _j.label = 16;
                    case 16:
                        _a++;
                        return [3 /*break*/, 4];
                    case 17: return [4 /*yield*/, this.getQualityChecksByJobOrder(jobOrder.id)];
                    case 18:
                        jobOrderQualityChecks = _j.sent();
                        _d = 0, jobOrderQualityChecks_1 = jobOrderQualityChecks;
                        _j.label = 19;
                    case 19:
                        if (!(_d < jobOrderQualityChecks_1.length)) return [3 /*break*/, 27];
                        check = jobOrderQualityChecks_1[_d];
                        return [4 /*yield*/, this.getCorrectiveActionsByQualityCheck(check.id)];
                    case 20:
                        correctiveActions = _j.sent();
                        _e = 0, correctiveActions_2 = correctiveActions;
                        _j.label = 21;
                    case 21:
                        if (!(_e < correctiveActions_2.length)) return [3 /*break*/, 24];
                        action = correctiveActions_2[_e];
                        return [4 /*yield*/, this.deleteCorrectiveAction(action.id)];
                    case 22:
                        _j.sent();
                        _j.label = 23;
                    case 23:
                        _e++;
                        return [3 /*break*/, 21];
                    case 24: 
                    // 2.2.2 Delete the quality check
                    return [4 /*yield*/, this.deleteQualityCheck(check.id)];
                    case 25:
                        // 2.2.2 Delete the quality check
                        _j.sent();
                        _j.label = 26;
                    case 26:
                        _d++;
                        return [3 /*break*/, 19];
                    case 27: return [4 /*yield*/, this.getSmsMessagesByJobOrder(jobOrder.id)];
                    case 28:
                        jobOrderSmsMessages = _j.sent();
                        _f = 0, jobOrderSmsMessages_1 = jobOrderSmsMessages;
                        _j.label = 29;
                    case 29:
                        if (!(_f < jobOrderSmsMessages_1.length)) return [3 /*break*/, 32];
                        message = jobOrderSmsMessages_1[_f];
                        return [4 /*yield*/, this.deleteSmsMessage(message.id)];
                    case 30:
                        _j.sent();
                        _j.label = 31;
                    case 31:
                        _f++;
                        return [3 /*break*/, 29];
                    case 32: return [4 /*yield*/, this.getFinalProductsByJobOrder(jobOrder.id)];
                    case 33:
                        finalProducts = _j.sent();
                        _g = 0, finalProducts_1 = finalProducts;
                        _j.label = 34;
                    case 34:
                        if (!(_g < finalProducts_1.length)) return [3 /*break*/, 37];
                        product = finalProducts_1[_g];
                        return [4 /*yield*/, this.deleteFinalProduct(product.id)];
                    case 35:
                        _j.sent();
                        _j.label = 36;
                    case 36:
                        _g++;
                        return [3 /*break*/, 34];
                    case 37: 
                    // 2.5 Delete the job order
                    return [4 /*yield*/, this.deleteJobOrder(jobOrder.id)];
                    case 38:
                        // 2.5 Delete the job order
                        _j.sent();
                        _j.label = 39;
                    case 39:
                        _i++;
                        return [3 /*break*/, 2];
                    case 40: return [4 /*yield*/, this.getSmsMessagesByOrder(id)];
                    case 41:
                        orderSmsMessages = _j.sent();
                        _h = 0, orderSmsMessages_1 = orderSmsMessages;
                        _j.label = 42;
                    case 42:
                        if (!(_h < orderSmsMessages_1.length)) return [3 /*break*/, 45];
                        message = orderSmsMessages_1[_h];
                        return [4 /*yield*/, this.deleteSmsMessage(message.id)];
                    case 43:
                        _j.sent();
                        _j.label = 44;
                    case 44:
                        _h++;
                        return [3 /*break*/, 42];
                    case 45: 
                    // 4. Finally delete the order itself
                    return [2 /*return*/, this.orders.delete(id)];
                    case 46:
                        error_1 = _j.sent();
                        console.error("Error deleting order:", error_1);
                        throw error_1;
                    case 47: return [2 /*return*/];
                }
            });
        });
    };
    // Job Orders
    MemStorage.prototype.getJobOrders = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.jobOrders.values())];
            });
        });
    };
    MemStorage.prototype.getJobOrdersByOrder = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.jobOrders.values()).filter(function (jo) { return jo.orderId === orderId; })];
            });
        });
    };
    MemStorage.prototype.getJobOrder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.jobOrders.get(id)];
            });
        });
    };
    MemStorage.prototype.createJobOrder = function (jobOrder) {
        return __awaiter(this, void 0, void 0, function () {
            var id, customerId, customerProduct, newJobOrder, order;
            return __generator(this, function (_a) {
                id = this.currentJobOrderId++;
                customerId = jobOrder.customerId;
                if (!customerId) {
                    customerProduct = this.customerProducts.get(jobOrder.customerProductId);
                    if (customerProduct) {
                        customerId = customerProduct.customerId;
                    }
                }
                newJobOrder = __assign(__assign({}, jobOrder), { id: id, status: jobOrder.status || "pending", customerId: customerId });
                this.jobOrders.set(id, newJobOrder);
                order = this.orders.get(jobOrder.orderId);
                if (order && order.status === "pending") {
                    this.updateOrder(order.id, { status: "processing" });
                }
                return [2 /*return*/, newJobOrder];
            });
        });
    };
    MemStorage.prototype.updateJobOrder = function (id, jobOrder) {
        return __awaiter(this, void 0, void 0, function () {
            var existingJobOrder, updatedJobOrder;
            return __generator(this, function (_a) {
                existingJobOrder = this.jobOrders.get(id);
                if (!existingJobOrder)
                    return [2 /*return*/, undefined];
                updatedJobOrder = __assign(__assign({}, existingJobOrder), jobOrder);
                this.jobOrders.set(id, updatedJobOrder);
                return [2 /*return*/, updatedJobOrder];
            });
        });
    };
    MemStorage.prototype.deleteJobOrder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.jobOrders.delete(id)];
            });
        });
    };
    // Rolls
    MemStorage.prototype.getRolls = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rolls.values())];
            });
        });
    };
    MemStorage.prototype.getRollsByJobOrder = function (jobOrderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rolls.values()).filter(function (roll) { return roll.jobOrderId === jobOrderId; })];
            });
        });
    };
    MemStorage.prototype.getRollsByStage = function (stage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rolls.values()).filter(function (roll) { return roll.currentStage === stage; })];
            });
        });
    };
    MemStorage.prototype.getRoll = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rolls.get(id)];
            });
        });
    };
    MemStorage.prototype.createRoll = function (roll) {
        return __awaiter(this, void 0, void 0, function () {
            var newRoll;
            return __generator(this, function (_a) {
                newRoll = __assign({}, roll);
                this.rolls.set(roll.id, newRoll);
                return [2 /*return*/, newRoll];
            });
        });
    };
    MemStorage.prototype.updateRoll = function (id, roll) {
        return __awaiter(this, void 0, void 0, function () {
            var existingRoll, updatedRoll;
            return __generator(this, function (_a) {
                existingRoll = this.rolls.get(id);
                if (!existingRoll)
                    return [2 /*return*/, undefined];
                updatedRoll = __assign(__assign({}, existingRoll), roll);
                this.rolls.set(id, updatedRoll);
                return [2 /*return*/, updatedRoll];
            });
        });
    };
    MemStorage.prototype.deleteRoll = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rolls.delete(id)];
            });
        });
    };
    // Raw Materials
    MemStorage.prototype.getRawMaterials = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rawMaterials.values())];
            });
        });
    };
    MemStorage.prototype.getRawMaterial = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rawMaterials.get(id)];
            });
        });
    };
    MemStorage.prototype.createRawMaterial = function (rawMaterial) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newRawMaterial;
            return __generator(this, function (_a) {
                id = this.currentRawMaterialId++;
                newRawMaterial = __assign(__assign({}, rawMaterial), { id: id, lastUpdated: new Date() });
                this.rawMaterials.set(id, newRawMaterial);
                return [2 /*return*/, newRawMaterial];
            });
        });
    };
    MemStorage.prototype.updateRawMaterial = function (id, rawMaterial) {
        return __awaiter(this, void 0, void 0, function () {
            var existingRawMaterial, updatedRawMaterial;
            return __generator(this, function (_a) {
                existingRawMaterial = this.rawMaterials.get(id);
                if (!existingRawMaterial)
                    return [2 /*return*/, undefined];
                updatedRawMaterial = __assign(__assign(__assign({}, existingRawMaterial), rawMaterial), { lastUpdated: new Date() });
                this.rawMaterials.set(id, updatedRawMaterial);
                return [2 /*return*/, updatedRawMaterial];
            });
        });
    };
    MemStorage.prototype.deleteRawMaterial = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rawMaterials.delete(id)];
            });
        });
    };
    // Final Products
    MemStorage.prototype.getFinalProducts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.finalProducts.values())];
            });
        });
    };
    MemStorage.prototype.getFinalProductsByJobOrder = function (jobOrderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.finalProducts.values()).filter(function (product) { return product.jobOrderId === jobOrderId; })];
            });
        });
    };
    MemStorage.prototype.getFinalProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.finalProducts.get(id)];
            });
        });
    };
    MemStorage.prototype.createFinalProduct = function (finalProduct) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newFinalProduct;
            return __generator(this, function (_a) {
                id = this.currentFinalProductId++;
                newFinalProduct = __assign(__assign({}, finalProduct), { id: id, completedDate: new Date() });
                this.finalProducts.set(id, newFinalProduct);
                return [2 /*return*/, newFinalProduct];
            });
        });
    };
    MemStorage.prototype.updateFinalProduct = function (id, finalProduct) {
        return __awaiter(this, void 0, void 0, function () {
            var existingFinalProduct, updatedFinalProduct;
            return __generator(this, function (_a) {
                existingFinalProduct = this.finalProducts.get(id);
                if (!existingFinalProduct)
                    return [2 /*return*/, undefined];
                updatedFinalProduct = __assign(__assign({}, existingFinalProduct), finalProduct);
                this.finalProducts.set(id, updatedFinalProduct);
                return [2 /*return*/, updatedFinalProduct];
            });
        });
    };
    MemStorage.prototype.deleteFinalProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.finalProducts.delete(id)];
            });
        });
    };
    // SMS Messages methods
    MemStorage.prototype.getSmsMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.smsMessages.values())];
            });
        });
    };
    MemStorage.prototype.getSmsMessagesByOrder = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.smsMessages.values()).filter(function (msg) { return msg.orderId === orderId; })];
            });
        });
    };
    MemStorage.prototype.getSmsMessagesByJobOrder = function (jobOrderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.smsMessages.values()).filter(function (msg) { return msg.jobOrderId === jobOrderId; })];
            });
        });
    };
    MemStorage.prototype.getSmsMessagesByCustomer = function (customerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.smsMessages.values()).filter(function (msg) { return msg.customerId === customerId; })];
            });
        });
    };
    MemStorage.prototype.getSmsMessage = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.smsMessages.get(id)];
            });
        });
    };
    MemStorage.prototype.createSmsMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newMessage;
            return __generator(this, function (_a) {
                id = this.currentSmsMessageId++;
                newMessage = __assign(__assign({}, message), { id: id, sentAt: new Date(), deliveredAt: null, twilioMessageId: null, status: message.status || "pending" });
                this.smsMessages.set(id, newMessage);
                return [2 /*return*/, newMessage];
            });
        });
    };
    MemStorage.prototype.updateSmsMessage = function (id, message) {
        return __awaiter(this, void 0, void 0, function () {
            var existingMessage, updatedMessage;
            return __generator(this, function (_a) {
                existingMessage = this.smsMessages.get(id);
                if (!existingMessage)
                    return [2 /*return*/, undefined];
                updatedMessage = __assign(__assign({}, existingMessage), message);
                this.smsMessages.set(id, updatedMessage);
                return [2 /*return*/, updatedMessage];
            });
        });
    };
    MemStorage.prototype.deleteSmsMessage = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.smsMessages.delete(id)];
            });
        });
    };
    // Mix Materials
    MemStorage.prototype.getMixMaterials = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.mixMaterials.values())];
            });
        });
    };
    MemStorage.prototype.getMixMaterial = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.mixMaterials.get(id)];
            });
        });
    };
    MemStorage.prototype.createMixMaterial = function (mix) {
        return __awaiter(this, void 0, void 0, function () {
            var id, totalQuantity, newMix;
            return __generator(this, function (_a) {
                id = this.currentMixMaterialId++;
                totalQuantity = 0;
                newMix = __assign(__assign({}, mix), { id: id, mixDate: new Date(), totalQuantity: totalQuantity, createdAt: new Date() });
                this.mixMaterials.set(id, newMix);
                return [2 /*return*/, newMix];
            });
        });
    };
    MemStorage.prototype.updateMixMaterial = function (id, mix) {
        return __awaiter(this, void 0, void 0, function () {
            var existingMix, updatedMix;
            return __generator(this, function (_a) {
                existingMix = this.mixMaterials.get(id);
                if (!existingMix)
                    return [2 /*return*/, undefined];
                updatedMix = __assign(__assign({}, existingMix), mix);
                this.mixMaterials.set(id, updatedMix);
                return [2 /*return*/, updatedMix];
            });
        });
    };
    MemStorage.prototype.deleteMixMaterial = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var mixItems, _i, mixItems_1, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMixItemsByMix(id)];
                    case 1:
                        mixItems = _a.sent();
                        _i = 0, mixItems_1 = mixItems;
                        _a.label = 2;
                    case 2:
                        if (!(_i < mixItems_1.length)) return [3 /*break*/, 5];
                        item = mixItems_1[_i];
                        return [4 /*yield*/, this.deleteMixItem(item.id)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: 
                    // Delete any machine associations
                    return [4 /*yield*/, this.deleteMixMachinesByMixId(id)];
                    case 6:
                        // Delete any machine associations
                        _a.sent();
                        return [2 /*return*/, this.mixMaterials.delete(id)];
                }
            });
        });
    };
    // Mix Machines
    MemStorage.prototype.getMixMachines = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.mixMachines.values())];
            });
        });
    };
    MemStorage.prototype.getMixMachinesByMixId = function (mixId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.mixMachines.values())
                        .filter(function (mixMachine) { return mixMachine.mixId === mixId; })];
            });
        });
    };
    MemStorage.prototype.createMixMachine = function (mixMachine) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newMixMachine;
            return __generator(this, function (_a) {
                id = this.currentMixMachineId++;
                newMixMachine = __assign(__assign({}, mixMachine), { id: id });
                this.mixMachines.set(id, newMixMachine);
                return [2 /*return*/, newMixMachine];
            });
        });
    };
    MemStorage.prototype.deleteMixMachinesByMixId = function (mixId) {
        return __awaiter(this, void 0, void 0, function () {
            var toDelete, success, _i, toDelete_1, mixMachine;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMixMachinesByMixId(mixId)];
                    case 1:
                        toDelete = _a.sent();
                        success = true;
                        for (_i = 0, toDelete_1 = toDelete; _i < toDelete_1.length; _i++) {
                            mixMachine = toDelete_1[_i];
                            if (!this.mixMachines.delete(mixMachine.id)) {
                                success = false;
                            }
                        }
                        return [2 /*return*/, success];
                }
            });
        });
    };
    // Mix Items
    MemStorage.prototype.getMixItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.mixItems.values())];
            });
        });
    };
    MemStorage.prototype.getMixItemsByMix = function (mixId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.mixItems.values()).filter(function (item) { return item.mixId === mixId; })];
            });
        });
    };
    MemStorage.prototype.getMixItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.mixItems.get(id)];
            });
        });
    };
    MemStorage.prototype.createMixItem = function (mixItem) {
        return __awaiter(this, void 0, void 0, function () {
            var id, mix, rawMaterial, newTotalQuantity, percentage, newMixItem, mixItems, _i, mixItems_2, item, updatedPercentage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = this.currentMixItemId++;
                        return [4 /*yield*/, this.getMixMaterial(mixItem.mixId)];
                    case 1:
                        mix = _a.sent();
                        if (!mix) {
                            throw new Error("Mix with ID ".concat(mixItem.mixId, " not found"));
                        }
                        return [4 /*yield*/, this.getRawMaterial(mixItem.rawMaterialId)];
                    case 2:
                        rawMaterial = _a.sent();
                        if (!rawMaterial) {
                            throw new Error("Raw material with ID ".concat(mixItem.rawMaterialId, " not found"));
                        }
                        if (!(rawMaterial.quantity !== null && rawMaterial.quantity >= mixItem.quantity)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.updateRawMaterial(rawMaterial.id, { quantity: rawMaterial.quantity - mixItem.quantity })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4: throw new Error("Insufficient quantity of raw material ".concat(rawMaterial.name));
                    case 5:
                        newTotalQuantity = mix.totalQuantity + mixItem.quantity;
                        return [4 /*yield*/, this.updateMixMaterial(mix.id, { totalQuantity: newTotalQuantity })];
                    case 6:
                        _a.sent();
                        percentage = (mixItem.quantity / newTotalQuantity) * 100;
                        newMixItem = __assign(__assign({}, mixItem), { id: id, percentage: percentage });
                        return [4 /*yield*/, this.getMixItemsByMix(mixItem.mixId)];
                    case 7:
                        mixItems = _a.sent();
                        _i = 0, mixItems_2 = mixItems;
                        _a.label = 8;
                    case 8:
                        if (!(_i < mixItems_2.length)) return [3 /*break*/, 11];
                        item = mixItems_2[_i];
                        // Skip the current item as it's not in the map yet
                        if (item.id === id)
                            return [3 /*break*/, 10];
                        updatedPercentage = (item.quantity / newTotalQuantity) * 100;
                        return [4 /*yield*/, this.updateMixItem(item.id, { percentage: updatedPercentage })];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        _i++;
                        return [3 /*break*/, 8];
                    case 11:
                        this.mixItems.set(id, newMixItem);
                        return [2 /*return*/, newMixItem];
                }
            });
        });
    };
    MemStorage.prototype.updateMixItem = function (id, mixItemUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var existingMixItem, mix, quantityDiff, newTotalQuantity, rawMaterial, mixItems, _i, mixItems_3, item, updatedPercentage, otherUpdatedItem, updatedMixItem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        existingMixItem = this.mixItems.get(id);
                        if (!existingMixItem)
                            return [2 /*return*/, undefined];
                        if (!(mixItemUpdate.quantity !== undefined &&
                            mixItemUpdate.quantity !== existingMixItem.quantity)) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.getMixMaterial(existingMixItem.mixId)];
                    case 1:
                        mix = _a.sent();
                        if (!mix) {
                            throw new Error("Mix with ID ".concat(existingMixItem.mixId, " not found"));
                        }
                        quantityDiff = mixItemUpdate.quantity - existingMixItem.quantity;
                        newTotalQuantity = mix.totalQuantity + quantityDiff;
                        if (!(quantityDiff !== 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.getRawMaterial(existingMixItem.rawMaterialId)];
                    case 2:
                        rawMaterial = _a.sent();
                        if (!rawMaterial) {
                            throw new Error("Raw material with ID ".concat(existingMixItem.rawMaterialId, " not found"));
                        }
                        if (!(quantityDiff > 0)) return [3 /*break*/, 6];
                        if (!(rawMaterial.quantity !== null && rawMaterial.quantity >= quantityDiff)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.updateRawMaterial(rawMaterial.id, { quantity: rawMaterial.quantity - quantityDiff })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4: throw new Error("Insufficient quantity of raw material ".concat(rawMaterial.name));
                    case 5: return [3 /*break*/, 8];
                    case 6: 
                    // Return raw material to inventory
                    return [4 /*yield*/, this.updateRawMaterial(rawMaterial.id, { quantity: (rawMaterial.quantity || 0) - quantityDiff })];
                    case 7:
                        // Return raw material to inventory
                        _a.sent();
                        _a.label = 8;
                    case 8: 
                    // Update the mix total quantity
                    return [4 /*yield*/, this.updateMixMaterial(mix.id, { totalQuantity: newTotalQuantity })];
                    case 9:
                        // Update the mix total quantity
                        _a.sent();
                        // Calculate the new percentage for this item
                        mixItemUpdate.percentage = (mixItemUpdate.quantity / newTotalQuantity) * 100;
                        return [4 /*yield*/, this.getMixItemsByMix(existingMixItem.mixId)];
                    case 10:
                        mixItems = _a.sent();
                        for (_i = 0, mixItems_3 = mixItems; _i < mixItems_3.length; _i++) {
                            item = mixItems_3[_i];
                            // Skip the current item as it will be updated later
                            if (item.id === id)
                                continue;
                            updatedPercentage = (item.quantity / newTotalQuantity) * 100;
                            otherUpdatedItem = __assign(__assign({}, item), { percentage: updatedPercentage });
                            this.mixItems.set(item.id, otherUpdatedItem);
                        }
                        _a.label = 11;
                    case 11:
                        updatedMixItem = __assign(__assign({}, existingMixItem), mixItemUpdate);
                        this.mixItems.set(id, updatedMixItem);
                        return [2 /*return*/, updatedMixItem];
                }
            });
        });
    };
    MemStorage.prototype.deleteMixItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var mixItem, mix, rawMaterial, newTotalQuantity, mixItems, _i, mixItems_4, item, updatedPercentage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mixItem = this.mixItems.get(id);
                        if (!mixItem)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, this.getMixMaterial(mixItem.mixId)];
                    case 1:
                        mix = _a.sent();
                        if (!mix) {
                            return [2 /*return*/, this.mixItems.delete(id)];
                        }
                        return [4 /*yield*/, this.getRawMaterial(mixItem.rawMaterialId)];
                    case 2:
                        rawMaterial = _a.sent();
                        if (!rawMaterial) return [3 /*break*/, 4];
                        // Return raw material to inventory
                        return [4 /*yield*/, this.updateRawMaterial(rawMaterial.id, { quantity: (rawMaterial.quantity || 0) + mixItem.quantity })];
                    case 3:
                        // Return raw material to inventory
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        newTotalQuantity = mix.totalQuantity - mixItem.quantity;
                        return [4 /*yield*/, this.updateMixMaterial(mix.id, { totalQuantity: newTotalQuantity })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.getMixItemsByMix(mixItem.mixId)];
                    case 6:
                        mixItems = _a.sent();
                        _i = 0, mixItems_4 = mixItems;
                        _a.label = 7;
                    case 7:
                        if (!(_i < mixItems_4.length)) return [3 /*break*/, 10];
                        item = mixItems_4[_i];
                        // Skip the current item as it will be deleted
                        if (item.id === id)
                            return [3 /*break*/, 9];
                        updatedPercentage = newTotalQuantity > 0
                            ? (item.quantity / newTotalQuantity) * 100
                            : 0;
                        return [4 /*yield*/, this.updateMixItem(item.id, { percentage: updatedPercentage })];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        _i++;
                        return [3 /*break*/, 7];
                    case 10: return [2 /*return*/, this.mixItems.delete(id)];
                }
            });
        });
    };
    return MemStorage;
}());
exports.MemStorage = MemStorage;
var database_storage_1 = require("./database-storage");
// Use the database storage implementation for all storage operations
exports.storage = new database_storage_1.DatabaseStorage();
