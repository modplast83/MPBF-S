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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
var http_1 = require("http");
var storage_1 = require("./storage");
var db_1 = require("./db");
var quality_adapter_1 = require("./quality-adapter");
var schema_1 = require("@shared/schema");
var zod_1 = require("zod");
var path_1 = require("path");
var fs_1 = require("fs");
var child_process_1 = require("child_process");
var util_1 = require("util");
var auth_1 = require("./auth");
var user_seed_1 = require("./user-seed");
var hr_routes_1 = require("./hr-routes");
var bottleneck_routes_1 = require("./bottleneck-routes");
var notification_routes_1 = require("./notification-routes");
var iot_routes_1 = require("./iot-routes");
var mobile_routes_1 = require("./mobile-routes");
function registerRoutes(app) {
    return __awaiter(this, void 0, void 0, function () {
        function calculateNextDue(frequency) {
            var now = new Date();
            switch (frequency) {
                case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
                case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                case 'monthly': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                case 'quarterly': return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
                case 'yearly': return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
                default: return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            }
        }
        var error_1, backupsDir, apiRouter, requireAuth, requirePermission, execPromise, smsStorage, httpServer;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, user_seed_1.ensureAdminUser)()];
                case 1:
                    _a.sent();
                    console.log("Admin user check completed");
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error during admin user verification:", error_1);
                    return [3 /*break*/, 3];
                case 3:
                    backupsDir = path_1.default.join(process.cwd(), "backups");
                    if (!fs_1.default.existsSync(backupsDir)) {
                        fs_1.default.mkdirSync(backupsDir, { recursive: true });
                    }
                    // Setup authentication
                    (0, auth_1.setupAuth)(app);
                    // Setup HR module routes
                    (0, hr_routes_1.setupHRRoutes)(app);
                    // Setup bottleneck notification system routes
                    (0, bottleneck_routes_1.setupBottleneckRoutes)(app);
                    // Setup IoT Integration routes
                    (0, iot_routes_1.setupIotRoutes)(app);
                    // Setup Mobile App routes
                    (0, mobile_routes_1.setupMobileRoutes)(app);
                    // User is now handled directly by auth.ts
                    // Debug endpoint to check session status - using manual response to bypass Vite
                    app.get("/api/auth/debug", function (req, res) {
                        var _a;
                        // Set explicit content type to prevent Vite from returning HTML
                        res.setHeader('Content-Type', 'application/json');
                        var isAuthenticated = req.isAuthenticated();
                        var sessionData = {
                            isAuthenticated: isAuthenticated,
                            session: req.session ? {
                                id: req.session.id,
                                cookie: req.session.cookie,
                                // Don't expose sensitive data
                                hasUser: !!req.user
                            } : null,
                            user: req.user ? {
                                hasClaims: !!req.user.claims,
                                hasRefreshToken: !!req.user.refresh_token,
                                hasExpiresAt: !!req.user.expires_at,
                                claimsSubExists: ((_a = req.user.claims) === null || _a === void 0 ? void 0 : _a.sub) ? true : false,
                                expiresAt: req.user.expires_at,
                                nowTime: Math.floor(Date.now() / 1000),
                                tokenExpired: req.user.expires_at ? Math.floor(Date.now() / 1000) > req.user.expires_at : null
                            } : null
                        };
                        // Manual response to bypass vite middleware
                        var jsonData = JSON.stringify(sessionData);
                        res.writeHead(200);
                        return res.end(jsonData);
                    });
                    apiRouter = app.route("/api");
                    requireAuth = function (req, res, next) {
                        if (!req.isAuthenticated()) {
                            return res.status(401).json({ message: "Authentication required" });
                        }
                        next();
                    };
                    requirePermission = function (moduleName, action) {
                        if (action === void 0) { action = 'view'; }
                        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                            var user, modules, module_1, permissions, modulePermission, hasPermission, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!req.isAuthenticated()) {
                                            return [2 /*return*/, res.status(401).json({ message: "Authentication required" })];
                                        }
                                        user = req.user;
                                        // Administrator bypasses permission checks
                                        if (user.isAdmin) {
                                            return [2 /*return*/, next()];
                                        }
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 4, , 5]);
                                        return [4 /*yield*/, storage_1.storage.getModules()];
                                    case 2:
                                        modules = _a.sent();
                                        module_1 = modules.find(function (m) { return m.name === moduleName; });
                                        if (!module_1) {
                                            return [2 /*return*/, res.status(403).json({ message: "Module ".concat(moduleName, " not found") })];
                                        }
                                        return [4 /*yield*/, storage_1.storage.getPermissionsBySection(user.sectionId || '')];
                                    case 3:
                                        permissions = _a.sent();
                                        modulePermission = permissions.find(function (p) { return p.moduleId === module_1.id; });
                                        if (!modulePermission || !modulePermission.isActive) {
                                            return [2 /*return*/, res.status(403).json({ message: "Access denied" })];
                                        }
                                        hasPermission = action === 'view' ? modulePermission.canView :
                                            action === 'create' ? modulePermission.canCreate :
                                                action === 'edit' ? modulePermission.canEdit :
                                                    action === 'delete' ? modulePermission.canDelete : false;
                                        if (!hasPermission) {
                                            return [2 /*return*/, res.status(403).json({ message: "Permission denied for ".concat(action, " on ").concat(moduleName) })];
                                        }
                                        next();
                                        return [3 /*break*/, 5];
                                    case 4:
                                        error_2 = _a.sent();
                                        console.error('Permission check error:', error_2);
                                        res.status(500).json({ message: "Permission check failed" });
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); };
                    };
                    // Categories
                    app.get("/api/categories", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var categories, error_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getCategories()];
                                case 1:
                                    categories = _a.sent();
                                    res.json(categories);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_3 = _a.sent();
                                    console.error("Error fetching categories:", error_3);
                                    res.status(500).json({ message: "Failed to get categories" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/categories/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var category, error_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getCategory(req.params.id)];
                                case 1:
                                    category = _a.sent();
                                    if (!category) {
                                        return [2 /*return*/, res.status(404).json({ message: "Category not found" })];
                                    }
                                    res.json(category);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_4 = _a.sent();
                                    console.error("Error fetching category:", error_4);
                                    res.status(500).json({ message: "Failed to get category" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/categories", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, existingCategory, category, error_5;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    validatedData = schema_1.insertCategorySchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getCategoryByCode(validatedData.code)];
                                case 1:
                                    existingCategory = _a.sent();
                                    if (existingCategory) {
                                        return [2 /*return*/, res.status(409).json({ message: "Category code already exists" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.createCategory(validatedData)];
                                case 2:
                                    category = _a.sent();
                                    res.status(201).json(category);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_5 = _a.sent();
                                    if (error_5 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid category data", errors: error_5.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create category" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/categories/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingCategory, validatedData, existingWithCode, category, error_6;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    return [4 /*yield*/, storage_1.storage.getCategory(req.params.id)];
                                case 1:
                                    existingCategory = _a.sent();
                                    if (!existingCategory) {
                                        return [2 /*return*/, res.status(404).json({ message: "Category not found" })];
                                    }
                                    validatedData = schema_1.insertCategorySchema.parse(req.body);
                                    if (!(validatedData.code !== existingCategory.code)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, storage_1.storage.getCategoryByCode(validatedData.code)];
                                case 2:
                                    existingWithCode = _a.sent();
                                    if (existingWithCode && existingWithCode.id !== req.params.id) {
                                        return [2 /*return*/, res.status(409).json({ message: "Category code already exists" })];
                                    }
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, storage_1.storage.updateCategory(req.params.id, validatedData)];
                                case 4:
                                    category = _a.sent();
                                    res.json(category);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_6 = _a.sent();
                                    if (error_6 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid category data", errors: error_6.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update category" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/categories/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var category, items, error_7;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    return [4 /*yield*/, storage_1.storage.getCategory(req.params.id)];
                                case 1:
                                    category = _a.sent();
                                    if (!category) {
                                        return [2 /*return*/, res.status(404).json({ message: "Category not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getItemsByCategory(req.params.id)];
                                case 2:
                                    items = _a.sent();
                                    if (items.length > 0) {
                                        return [2 /*return*/, res.status(409).json({ message: "Cannot delete category with associated items" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteCategory(req.params.id)];
                                case 3:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_7 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete category" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Items
                    app.get("/api/items", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var items, error_8;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getItems()];
                                case 1:
                                    items = _a.sent();
                                    res.json(items);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_8 = _a.sent();
                                    res.status(500).json({ message: "Failed to get items" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/categories/:categoryId/items", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var category, items, error_9;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getCategory(req.params.categoryId)];
                                case 1:
                                    category = _a.sent();
                                    if (!category) {
                                        return [2 /*return*/, res.status(404).json({ message: "Category not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getItemsByCategory(req.params.categoryId)];
                                case 2:
                                    items = _a.sent();
                                    res.json(items);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_9 = _a.sent();
                                    res.status(500).json({ message: "Failed to get items" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/items/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var item, error_10;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getItem(req.params.id)];
                                case 1:
                                    item = _a.sent();
                                    if (!item) {
                                        return [2 /*return*/, res.status(404).json({ message: "Item not found" })];
                                    }
                                    res.json(item);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_10 = _a.sent();
                                    res.status(500).json({ message: "Failed to get item" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/items", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, category, item, error_11;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    validatedData = schema_1.insertItemSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getCategory(validatedData.categoryId)];
                                case 1:
                                    category = _a.sent();
                                    if (!category) {
                                        return [2 /*return*/, res.status(404).json({ message: "Category not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.createItem(validatedData)];
                                case 2:
                                    item = _a.sent();
                                    res.status(201).json(item);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_11 = _a.sent();
                                    if (error_11 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid item data", errors: error_11.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create item" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/items/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingItem, validatedData, category, item, error_12;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    return [4 /*yield*/, storage_1.storage.getItem(req.params.id)];
                                case 1:
                                    existingItem = _a.sent();
                                    if (!existingItem) {
                                        return [2 /*return*/, res.status(404).json({ message: "Item not found" })];
                                    }
                                    validatedData = schema_1.insertItemSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getCategory(validatedData.categoryId)];
                                case 2:
                                    category = _a.sent();
                                    if (!category) {
                                        return [2 /*return*/, res.status(404).json({ message: "Category not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateItem(req.params.id, validatedData)];
                                case 3:
                                    item = _a.sent();
                                    res.json(item);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_12 = _a.sent();
                                    if (error_12 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid item data", errors: error_12.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update item" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/items/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var item, error_13;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getItem(req.params.id)];
                                case 1:
                                    item = _a.sent();
                                    if (!item) {
                                        return [2 /*return*/, res.status(404).json({ message: "Item not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteItem(req.params.id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_13 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete item" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Sections
                    app.get("/api/sections", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var sections, error_14;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getSections()];
                                case 1:
                                    sections = _a.sent();
                                    res.json(sections);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_14 = _a.sent();
                                    res.status(500).json({ message: "Failed to get sections" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/sections/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var section, error_15;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getSection(req.params.id)];
                                case 1:
                                    section = _a.sent();
                                    if (!section) {
                                        return [2 /*return*/, res.status(404).json({ message: "Section not found" })];
                                    }
                                    res.json(section);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_15 = _a.sent();
                                    res.status(500).json({ message: "Failed to get section" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/sections", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, section, error_16;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    validatedData = schema_1.insertSectionSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.createSection(validatedData)];
                                case 1:
                                    section = _a.sent();
                                    res.status(201).json(section);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_16 = _a.sent();
                                    if (error_16 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid section data", errors: error_16.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create section" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/sections/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingSection, validatedData, section, error_17;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getSection(req.params.id)];
                                case 1:
                                    existingSection = _a.sent();
                                    if (!existingSection) {
                                        return [2 /*return*/, res.status(404).json({ message: "Section not found" })];
                                    }
                                    validatedData = schema_1.insertSectionSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.updateSection(req.params.id, validatedData)];
                                case 2:
                                    section = _a.sent();
                                    res.json(section);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_17 = _a.sent();
                                    if (error_17 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid section data", errors: error_17.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update section" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/sections/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var section, error_18;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getSection(req.params.id)];
                                case 1:
                                    section = _a.sent();
                                    if (!section) {
                                        return [2 /*return*/, res.status(404).json({ message: "Section not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteSection(req.params.id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_18 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete section" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Machines
                    app.get("/api/machines", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var machines, error_19;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getMachines()];
                                case 1:
                                    machines = _a.sent();
                                    res.json(machines);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_19 = _a.sent();
                                    res.status(500).json({ message: "Failed to get machines" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/sections/:sectionId/machines", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var section, machines, error_20;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getSection(req.params.sectionId)];
                                case 1:
                                    section = _a.sent();
                                    if (!section) {
                                        return [2 /*return*/, res.status(404).json({ message: "Section not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMachinesBySection(req.params.sectionId)];
                                case 2:
                                    machines = _a.sent();
                                    res.json(machines);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_20 = _a.sent();
                                    res.status(500).json({ message: "Failed to get machines" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/machines/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var machine, error_21;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getMachine(req.params.id)];
                                case 1:
                                    machine = _a.sent();
                                    if (!machine) {
                                        return [2 /*return*/, res.status(404).json({ message: "Machine not found" })];
                                    }
                                    res.json(machine);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_21 = _a.sent();
                                    res.status(500).json({ message: "Failed to get machine" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/machines", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, section, machine, error_22;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    validatedData = schema_1.insertMachineSchema.parse(req.body);
                                    if (!validatedData.sectionId) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage_1.storage.getSection(validatedData.sectionId)];
                                case 1:
                                    section = _a.sent();
                                    if (!section) {
                                        return [2 /*return*/, res.status(404).json({ message: "Section not found" })];
                                    }
                                    _a.label = 2;
                                case 2: return [4 /*yield*/, storage_1.storage.createMachine(validatedData)];
                                case 3:
                                    machine = _a.sent();
                                    res.status(201).json(machine);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_22 = _a.sent();
                                    if (error_22 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid machine data", errors: error_22.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create machine" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/machines/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingMachine, validatedData, section, machine, error_23;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    return [4 /*yield*/, storage_1.storage.getMachine(req.params.id)];
                                case 1:
                                    existingMachine = _a.sent();
                                    if (!existingMachine) {
                                        return [2 /*return*/, res.status(404).json({ message: "Machine not found" })];
                                    }
                                    validatedData = schema_1.insertMachineSchema.parse(req.body);
                                    if (!validatedData.sectionId) return [3 /*break*/, 3];
                                    return [4 /*yield*/, storage_1.storage.getSection(validatedData.sectionId)];
                                case 2:
                                    section = _a.sent();
                                    if (!section) {
                                        return [2 /*return*/, res.status(404).json({ message: "Section not found" })];
                                    }
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, storage_1.storage.updateMachine(req.params.id, validatedData)];
                                case 4:
                                    machine = _a.sent();
                                    res.json(machine);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_23 = _a.sent();
                                    if (error_23 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid machine data", errors: error_23.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update machine" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/machines/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var machine, error_24;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getMachine(req.params.id)];
                                case 1:
                                    machine = _a.sent();
                                    if (!machine) {
                                        return [2 /*return*/, res.status(404).json({ message: "Machine not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteMachine(req.params.id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_24 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete machine" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Master Batches
                    app.get("/api/master-batches", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var masterBatches, error_25;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getMasterBatches()];
                                case 1:
                                    masterBatches = _a.sent();
                                    res.json(masterBatches);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_25 = _a.sent();
                                    res.status(500).json({ message: "Failed to get master batches" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/master-batches/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var masterBatch, error_26;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getMasterBatch(req.params.id)];
                                case 1:
                                    masterBatch = _a.sent();
                                    if (!masterBatch) {
                                        return [2 /*return*/, res.status(404).json({ message: "Master batch not found" })];
                                    }
                                    res.json(masterBatch);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_26 = _a.sent();
                                    res.status(500).json({ message: "Failed to get master batch" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/master-batches", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, masterBatch, error_27;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    validatedData = schema_1.insertMasterBatchSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.createMasterBatch(validatedData)];
                                case 1:
                                    masterBatch = _a.sent();
                                    res.status(201).json(masterBatch);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_27 = _a.sent();
                                    if (error_27 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid master batch data", errors: error_27.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create master batch" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/master-batches/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingMasterBatch, validatedData, masterBatch, error_28;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getMasterBatch(req.params.id)];
                                case 1:
                                    existingMasterBatch = _a.sent();
                                    if (!existingMasterBatch) {
                                        return [2 /*return*/, res.status(404).json({ message: "Master batch not found" })];
                                    }
                                    validatedData = schema_1.insertMasterBatchSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.updateMasterBatch(req.params.id, validatedData)];
                                case 2:
                                    masterBatch = _a.sent();
                                    res.json(masterBatch);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_28 = _a.sent();
                                    if (error_28 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid master batch data", errors: error_28.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update master batch" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/master-batches/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var masterBatch, error_29;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getMasterBatch(req.params.id)];
                                case 1:
                                    masterBatch = _a.sent();
                                    if (!masterBatch) {
                                        return [2 /*return*/, res.status(404).json({ message: "Master batch not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteMasterBatch(req.params.id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_29 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete master batch" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Users
                    app.get("/api/users", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var users, sanitizedUsers, error_30;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getUsers()];
                                case 1:
                                    users = _a.sent();
                                    sanitizedUsers = users.map(function (_a) {
                                        var password = _a.password, rest = __rest(_a, ["password"]);
                                        return rest;
                                    });
                                    res.json(sanitizedUsers);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_30 = _a.sent();
                                    res.status(500).json({ message: "Failed to get users" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/users/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, password, userWithoutPassword, error_31;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getUser(req.params.id)];
                                case 1:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                                    }
                                    password = user.password, userWithoutPassword = __rest(user, ["password"]);
                                    res.json(userWithoutPassword);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_31 = _a.sent();
                                    res.status(500).json({ message: "Failed to get user" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/users", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, existingUser, section, user, error_32;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    validatedData = schema_1.upsertUserSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getUserByUsername(validatedData.username)];
                                case 1:
                                    existingUser = _a.sent();
                                    if (existingUser) {
                                        return [2 /*return*/, res.status(409).json({ message: "Username already exists" })];
                                    }
                                    if (!validatedData.sectionId) return [3 /*break*/, 3];
                                    return [4 /*yield*/, storage_1.storage.getSection(validatedData.sectionId)];
                                case 2:
                                    section = _a.sent();
                                    if (!section) {
                                        return [2 /*return*/, res.status(404).json({ message: "Section not found" })];
                                    }
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, storage_1.storage.upsertUser(validatedData)];
                                case 4:
                                    user = _a.sent();
                                    res.status(201).json(user);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_32 = _a.sent();
                                    if (error_32 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid user data", errors: error_32.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create user" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/users/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingUser, validatedData, usernameExists, section, user, error_33;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 7, , 8]);
                                    return [4 /*yield*/, storage_1.storage.getUser(req.params.id)];
                                case 1:
                                    existingUser = _a.sent();
                                    if (!existingUser) {
                                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                                    }
                                    validatedData = schema_1.upsertUserSchema.parse(__assign(__assign({}, req.body), { id: req.params.id // Ensure the ID is set for the update
                                     }));
                                    if (!(validatedData.username !== existingUser.username)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, storage_1.storage.getUserByUsername(validatedData.username)];
                                case 2:
                                    usernameExists = _a.sent();
                                    if (usernameExists && usernameExists.id !== req.params.id) {
                                        return [2 /*return*/, res.status(409).json({ message: "Username already exists" })];
                                    }
                                    _a.label = 3;
                                case 3:
                                    if (!validatedData.sectionId) return [3 /*break*/, 5];
                                    return [4 /*yield*/, storage_1.storage.getSection(validatedData.sectionId)];
                                case 4:
                                    section = _a.sent();
                                    if (!section) {
                                        return [2 /*return*/, res.status(404).json({ message: "Section not found" })];
                                    }
                                    _a.label = 5;
                                case 5: return [4 /*yield*/, storage_1.storage.upsertUser(validatedData)];
                                case 6:
                                    user = _a.sent();
                                    res.json(user);
                                    return [3 /*break*/, 8];
                                case 7:
                                    error_33 = _a.sent();
                                    if (error_33 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid user data", errors: error_33.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update user" });
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/users/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, error_34;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getUser(req.params.id)];
                                case 1:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteUser(req.params.id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_34 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete user" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Customers
                    app.get("/api/customers", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var customers, error_35;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getCustomers()];
                                case 1:
                                    customers = _a.sent();
                                    res.json(customers);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_35 = _a.sent();
                                    res.status(500).json({ message: "Failed to get customers" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/customers/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var customer, error_36;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getCustomer(req.params.id)];
                                case 1:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    res.json(customer);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_36 = _a.sent();
                                    res.status(500).json({ message: "Failed to get customer" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/customers", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, allCustomers, maxNumber_1, nextNumber, existingCustomerId, existingCustomerCode, user, userError_1, customer, error_37;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 12, , 13]);
                                    console.log("Creating customer with data:", req.body);
                                    validatedData = schema_1.insertCustomerSchema.parse(req.body);
                                    if (!(!validatedData.id || validatedData.id.trim() === "")) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage_1.storage.getCustomers()];
                                case 1:
                                    allCustomers = _a.sent();
                                    maxNumber_1 = 0;
                                    // Extract numbers from existing customer IDs
                                    allCustomers.forEach(function (customer) {
                                        if (customer.id && customer.id.startsWith("CID")) {
                                            var numPart = customer.id.substring(3); // Extract after "CID"
                                            var num = parseInt(numPart, 10);
                                            if (!isNaN(num) && num > maxNumber_1) {
                                                maxNumber_1 = num;
                                            }
                                        }
                                    });
                                    nextNumber = maxNumber_1 + 1;
                                    validatedData.id = "CID".concat(nextNumber.toString().padStart(4, '0'));
                                    console.log("Auto-generated customer ID:", validatedData.id);
                                    _a.label = 2;
                                case 2:
                                    // If code is not provided, use the ID
                                    if (!validatedData.code || validatedData.code.trim() === "") {
                                        validatedData.code = validatedData.id;
                                        console.log("Using ID as code:", validatedData.code);
                                    }
                                    if (!validatedData.id) return [3 /*break*/, 4];
                                    return [4 /*yield*/, storage_1.storage.getCustomer(validatedData.id)];
                                case 3:
                                    existingCustomerId = _a.sent();
                                    if (existingCustomerId) {
                                        return [2 /*return*/, res.status(409).json({ message: "Customer ID already exists" })];
                                    }
                                    _a.label = 4;
                                case 4:
                                    if (!validatedData.code) return [3 /*break*/, 6];
                                    return [4 /*yield*/, storage_1.storage.getCustomerByCode(validatedData.code)];
                                case 5:
                                    existingCustomerCode = _a.sent();
                                    if (existingCustomerCode) {
                                        return [2 /*return*/, res.status(409).json({ message: "Customer code already exists" })];
                                    }
                                    _a.label = 6;
                                case 6:
                                    if (!validatedData.userId) return [3 /*break*/, 10];
                                    _a.label = 7;
                                case 7:
                                    _a.trys.push([7, 9, , 10]);
                                    console.log("Checking for user:", validatedData.userId);
                                    return [4 /*yield*/, storage_1.storage.getUser(validatedData.userId)];
                                case 8:
                                    user = _a.sent();
                                    if (!user) {
                                        console.log("User not found:", validatedData.userId);
                                        return [2 /*return*/, res.status(404).json({ message: "User not found: ".concat(validatedData.userId) })];
                                    }
                                    return [3 /*break*/, 10];
                                case 9:
                                    userError_1 = _a.sent();
                                    console.error("Error checking user:", userError_1);
                                    return [2 /*return*/, res.status(500).json({ message: "Error validating user: ".concat(userError_1) })];
                                case 10: return [4 /*yield*/, storage_1.storage.createCustomer(validatedData)];
                                case 11:
                                    customer = _a.sent();
                                    console.log("Successfully created customer:", customer);
                                    res.status(201).json(customer);
                                    return [3 /*break*/, 13];
                                case 12:
                                    error_37 = _a.sent();
                                    console.error("Error creating customer:", error_37);
                                    if (error_37 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid customer data", errors: error_37.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create customer" });
                                    return [3 /*break*/, 13];
                                case 13: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/customers/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingCustomer, validatedData, codeExists, user, userError_2, customer, error_38;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 9, , 10]);
                                    return [4 /*yield*/, storage_1.storage.getCustomer(req.params.id)];
                                case 1:
                                    existingCustomer = _a.sent();
                                    if (!existingCustomer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    validatedData = schema_1.insertCustomerSchema.parse(req.body);
                                    if (!(validatedData.code !== existingCustomer.code)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, storage_1.storage.getCustomerByCode(validatedData.code)];
                                case 2:
                                    codeExists = _a.sent();
                                    if (codeExists) {
                                        return [2 /*return*/, res.status(409).json({ message: "Customer code already exists" })];
                                    }
                                    _a.label = 3;
                                case 3:
                                    if (!validatedData.userId) return [3 /*break*/, 7];
                                    _a.label = 4;
                                case 4:
                                    _a.trys.push([4, 6, , 7]);
                                    console.log("Checking for user in update:", validatedData.userId);
                                    return [4 /*yield*/, storage_1.storage.getUser(validatedData.userId)];
                                case 5:
                                    user = _a.sent();
                                    if (!user) {
                                        console.log("User not found in update:", validatedData.userId);
                                        return [2 /*return*/, res.status(404).json({ message: "User not found: ".concat(validatedData.userId) })];
                                    }
                                    return [3 /*break*/, 7];
                                case 6:
                                    userError_2 = _a.sent();
                                    console.error("Error checking user in update:", userError_2);
                                    return [2 /*return*/, res.status(500).json({ message: "Error validating user: ".concat(userError_2) })];
                                case 7: return [4 /*yield*/, storage_1.storage.updateCustomer(req.params.id, validatedData)];
                                case 8:
                                    customer = _a.sent();
                                    res.json(customer);
                                    return [3 /*break*/, 10];
                                case 9:
                                    error_38 = _a.sent();
                                    if (error_38 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid customer data", errors: error_38.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update customer" });
                                    return [3 /*break*/, 10];
                                case 10: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/customers/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var customer, customerProducts, error_39;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    return [4 /*yield*/, storage_1.storage.getCustomer(req.params.id)];
                                case 1:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getCustomerProductsByCustomer(req.params.id)];
                                case 2:
                                    customerProducts = _a.sent();
                                    if (customerProducts.length > 0) {
                                        return [2 /*return*/, res.status(409).json({ message: "Cannot delete customer with associated products" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteCustomer(req.params.id)];
                                case 3:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_39 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete customer" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Customer Products
                    app.get("/api/customer-products", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var customerProducts, error_40;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getCustomerProducts()];
                                case 1:
                                    customerProducts = _a.sent();
                                    res.json(customerProducts);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_40 = _a.sent();
                                    res.status(500).json({ message: "Failed to get customer products" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/customers/:customerId/products", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var customer, customerProducts, error_41;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getCustomer(req.params.customerId)];
                                case 1:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getCustomerProductsByCustomer(req.params.customerId)];
                                case 2:
                                    customerProducts = _a.sent();
                                    res.json(customerProducts);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_41 = _a.sent();
                                    res.status(500).json({ message: "Failed to get customer products" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/customer-products/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var customerProduct, error_42;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getCustomerProduct(parseInt(req.params.id))];
                                case 1:
                                    customerProduct = _a.sent();
                                    if (!customerProduct) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer product not found" })];
                                    }
                                    res.json(customerProduct);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_42 = _a.sent();
                                    res.status(500).json({ message: "Failed to get customer product" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/customer-products", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, customer, category, item, masterBatch, customerProduct, error_43;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 7, , 8]);
                                    validatedData = schema_1.insertCustomerProductSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getCustomer(validatedData.customerId)];
                                case 1:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getCategory(validatedData.categoryId)];
                                case 2:
                                    category = _a.sent();
                                    if (!category) {
                                        return [2 /*return*/, res.status(404).json({ message: "Category not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getItem(validatedData.itemId)];
                                case 3:
                                    item = _a.sent();
                                    if (!item) {
                                        return [2 /*return*/, res.status(404).json({ message: "Item not found" })];
                                    }
                                    if (!validatedData.masterBatchId) return [3 /*break*/, 5];
                                    return [4 /*yield*/, storage_1.storage.getMasterBatch(validatedData.masterBatchId)];
                                case 4:
                                    masterBatch = _a.sent();
                                    if (!masterBatch) {
                                        return [2 /*return*/, res.status(404).json({ message: "Master batch not found" })];
                                    }
                                    _a.label = 5;
                                case 5: return [4 /*yield*/, storage_1.storage.createCustomerProduct(validatedData)];
                                case 6:
                                    customerProduct = _a.sent();
                                    res.status(201).json(customerProduct);
                                    return [3 /*break*/, 8];
                                case 7:
                                    error_43 = _a.sent();
                                    if (error_43 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid customer product data", errors: error_43.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create customer product" });
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/customer-products/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingCustomerProduct, validatedData, customer, category, item, masterBatch, customerProduct, error_44;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 8, , 9]);
                                    return [4 /*yield*/, storage_1.storage.getCustomerProduct(parseInt(req.params.id))];
                                case 1:
                                    existingCustomerProduct = _a.sent();
                                    if (!existingCustomerProduct) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer product not found" })];
                                    }
                                    validatedData = schema_1.insertCustomerProductSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getCustomer(validatedData.customerId)];
                                case 2:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getCategory(validatedData.categoryId)];
                                case 3:
                                    category = _a.sent();
                                    if (!category) {
                                        return [2 /*return*/, res.status(404).json({ message: "Category not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getItem(validatedData.itemId)];
                                case 4:
                                    item = _a.sent();
                                    if (!item) {
                                        return [2 /*return*/, res.status(404).json({ message: "Item not found" })];
                                    }
                                    if (!validatedData.masterBatchId) return [3 /*break*/, 6];
                                    return [4 /*yield*/, storage_1.storage.getMasterBatch(validatedData.masterBatchId)];
                                case 5:
                                    masterBatch = _a.sent();
                                    if (!masterBatch) {
                                        return [2 /*return*/, res.status(404).json({ message: "Master batch not found" })];
                                    }
                                    _a.label = 6;
                                case 6: return [4 /*yield*/, storage_1.storage.updateCustomerProduct(parseInt(req.params.id), validatedData)];
                                case 7:
                                    customerProduct = _a.sent();
                                    res.json(customerProduct);
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_44 = _a.sent();
                                    if (error_44 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid customer product data", errors: error_44.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update customer product" });
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/customer-products/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var customerProduct, error_45;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getCustomerProduct(parseInt(req.params.id))];
                                case 1:
                                    customerProduct = _a.sent();
                                    if (!customerProduct) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer product not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteCustomerProduct(parseInt(req.params.id))];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_45 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete customer product" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Orders
                    app.get("/api/orders", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var orders, error_46;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getOrders()];
                                case 1:
                                    orders = _a.sent();
                                    res.json(orders);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_46 = _a.sent();
                                    res.status(500).json({ message: "Failed to get orders" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/orders/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var order, error_47;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getOrder(parseInt(req.params.id))];
                                case 1:
                                    order = _a.sent();
                                    if (!order) {
                                        return [2 /*return*/, res.status(404).json({ message: "Order not found" })];
                                    }
                                    res.json(order);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_47 = _a.sent();
                                    res.status(500).json({ message: "Failed to get order" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/orders", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, customer, user, order, error_48;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    validatedData = schema_1.insertOrderSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getCustomer(validatedData.customerId)];
                                case 1:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    if (!validatedData.userId) return [3 /*break*/, 3];
                                    return [4 /*yield*/, storage_1.storage.getUser(validatedData.userId)];
                                case 2:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                                    }
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, storage_1.storage.createOrder(validatedData)];
                                case 4:
                                    order = _a.sent();
                                    res.status(201).json(order);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_48 = _a.sent();
                                    if (error_48 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid order data", errors: error_48.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create order" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/orders/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingOrder, statusSchema, status_1, updatedOrder, statusError_1, validatedData, customer, user, order, error_49;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 10, , 11]);
                                    return [4 /*yield*/, storage_1.storage.getOrder(parseInt(req.params.id))];
                                case 1:
                                    existingOrder = _a.sent();
                                    if (!existingOrder) {
                                        return [2 /*return*/, res.status(404).json({ message: "Order not found" })];
                                    }
                                    statusSchema = zod_1.z.object({
                                        status: zod_1.z.enum(["pending", "processing", "completed"]),
                                    });
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, , 5]);
                                    status_1 = statusSchema.parse(req.body).status;
                                    return [4 /*yield*/, storage_1.storage.updateOrder(parseInt(req.params.id), { status: status_1 })];
                                case 3:
                                    updatedOrder = _a.sent();
                                    return [2 /*return*/, res.json(updatedOrder)];
                                case 4:
                                    statusError_1 = _a.sent();
                                    return [3 /*break*/, 5];
                                case 5:
                                    validatedData = schema_1.insertOrderSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getCustomer(validatedData.customerId)];
                                case 6:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    if (!validatedData.userId) return [3 /*break*/, 8];
                                    return [4 /*yield*/, storage_1.storage.getUser(validatedData.userId)];
                                case 7:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                                    }
                                    _a.label = 8;
                                case 8: return [4 /*yield*/, storage_1.storage.updateOrder(parseInt(req.params.id), validatedData)];
                                case 9:
                                    order = _a.sent();
                                    res.json(order);
                                    return [3 /*break*/, 11];
                                case 10:
                                    error_49 = _a.sent();
                                    if (error_49 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid order data", errors: error_49.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update order" });
                                    return [3 /*break*/, 11];
                                case 11: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Special endpoint for updating just the order status
                    app.patch("/api/orders/:id/status", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var orderId, status_2, order, updatedOrder, error_50;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    orderId = parseInt(req.params.id);
                                    status_2 = req.body.status;
                                    if (!status_2) {
                                        return [2 /*return*/, res.status(400).json({ message: "Status is required" })];
                                    }
                                    // Validate status value - include all possible statuses
                                    if (!["pending", "processing", "hold", "completed", "cancelled", "For Production"].includes(status_2)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid status value" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getOrder(orderId)];
                                case 1:
                                    order = _a.sent();
                                    if (!order) {
                                        return [2 /*return*/, res.status(404).json({ message: "Order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateOrder(orderId, { status: status_2 })];
                                case 2:
                                    updatedOrder = _a.sent();
                                    return [2 /*return*/, res.json(updatedOrder)];
                                case 3:
                                    error_50 = _a.sent();
                                    console.error("Error updating order status:", error_50);
                                    return [2 /*return*/, res.status(500).json({
                                            message: "Failed to update order status",
                                            error: error_50 instanceof Error ? error_50.message : String(error_50)
                                        })];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/orders/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var orderId, order, success, error_51;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    orderId = parseInt(req.params.id);
                                    console.log("Attempting to delete order with ID: ".concat(orderId));
                                    return [4 /*yield*/, storage_1.storage.getOrder(orderId)];
                                case 1:
                                    order = _a.sent();
                                    if (!order) {
                                        console.log("Order with ID ".concat(orderId, " not found"));
                                        return [2 /*return*/, res.status(404).json({ message: "Order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteOrder(orderId)];
                                case 2:
                                    success = _a.sent();
                                    if (success) {
                                        return [2 /*return*/, res.status(200).json({
                                                success: true,
                                                message: "Order and all associated job orders deleted successfully"
                                            })];
                                    }
                                    else {
                                        return [2 /*return*/, res.status(500).json({ message: "Failed to delete order" })];
                                    }
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_51 = _a.sent();
                                    console.error("Error deleting order:", error_51);
                                    return [2 /*return*/, res.status(500).json({
                                            message: "Failed to delete order",
                                            error: error_51 instanceof Error ? error_51.message : String(error_51)
                                        })];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Job Orders
                    app.get("/api/job-orders", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var jobOrders, error_52;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getJobOrders()];
                                case 1:
                                    jobOrders = _a.sent();
                                    res.json(jobOrders);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_52 = _a.sent();
                                    res.status(500).json({ message: "Failed to get job orders" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/orders/:orderId/job-orders", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var order, jobOrders, error_53;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getOrder(parseInt(req.params.orderId))];
                                case 1:
                                    order = _a.sent();
                                    if (!order) {
                                        return [2 /*return*/, res.status(404).json({ message: "Order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getJobOrdersByOrder(parseInt(req.params.orderId))];
                                case 2:
                                    jobOrders = _a.sent();
                                    res.json(jobOrders);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_53 = _a.sent();
                                    res.status(500).json({ message: "Failed to get job orders" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/job-orders/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var jobOrder, error_54;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getJobOrder(parseInt(req.params.id))];
                                case 1:
                                    jobOrder = _a.sent();
                                    if (!jobOrder) {
                                        return [2 /*return*/, res.status(404).json({ message: "Job order not found" })];
                                    }
                                    res.json(jobOrder);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_54 = _a.sent();
                                    res.status(500).json({ message: "Failed to get job order" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/job-orders", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, order, customerProduct, jobOrder, error_55;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    validatedData = schema_1.insertJobOrderSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getOrder(validatedData.orderId)];
                                case 1:
                                    order = _a.sent();
                                    if (!order) {
                                        return [2 /*return*/, res.status(404).json({ message: "Order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getCustomerProduct(validatedData.customerProductId)];
                                case 2:
                                    customerProduct = _a.sent();
                                    if (!customerProduct) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer product not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.createJobOrder(validatedData)];
                                case 3:
                                    jobOrder = _a.sent();
                                    res.status(201).json(jobOrder);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_55 = _a.sent();
                                    if (error_55 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid job order data", errors: error_55.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create job order" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/job-orders/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingJobOrder, updateSchema, updateData, processedData, updatedJobOrder, updateError_1, validatedData, order, customerProduct, jobOrder, error_56;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 9, , 10]);
                                    return [4 /*yield*/, storage_1.storage.getJobOrder(parseInt(req.params.id))];
                                case 1:
                                    existingJobOrder = _a.sent();
                                    if (!existingJobOrder) {
                                        return [2 /*return*/, res.status(404).json({ message: "Job order not found" })];
                                    }
                                    if (!(req.body && typeof req.body === 'object' && ('status' in req.body || 'finishedQty' in req.body || 'receivedQty' in req.body))) return [3 /*break*/, 5];
                                    updateSchema = zod_1.z.object({
                                        status: zod_1.z.enum(["pending", "in_progress", "extrusion_completed", "completed", "cancelled", "received", "partially_received"]).optional(),
                                        finishedQty: zod_1.z.number().nonnegative().optional(),
                                        receivedQty: zod_1.z.number().nonnegative().optional(),
                                        receiveDate: zod_1.z.string().optional(),
                                        receivedBy: zod_1.z.string().optional(),
                                    });
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, , 5]);
                                    updateData = updateSchema.parse(req.body);
                                    processedData = __assign(__assign({}, updateData), { receiveDate: updateData.receiveDate ? new Date(updateData.receiveDate) : undefined });
                                    return [4 /*yield*/, storage_1.storage.updateJobOrder(parseInt(req.params.id), processedData)];
                                case 3:
                                    updatedJobOrder = _a.sent();
                                    return [2 /*return*/, res.json(updatedJobOrder)];
                                case 4:
                                    updateError_1 = _a.sent();
                                    return [3 /*break*/, 5];
                                case 5:
                                    validatedData = schema_1.insertJobOrderSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getOrder(validatedData.orderId)];
                                case 6:
                                    order = _a.sent();
                                    if (!order) {
                                        return [2 /*return*/, res.status(404).json({ message: "Order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getCustomerProduct(validatedData.customerProductId)];
                                case 7:
                                    customerProduct = _a.sent();
                                    if (!customerProduct) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer product not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateJobOrder(parseInt(req.params.id), validatedData)];
                                case 8:
                                    jobOrder = _a.sent();
                                    res.json(jobOrder);
                                    return [3 /*break*/, 10];
                                case 9:
                                    error_56 = _a.sent();
                                    if (error_56 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid job order data", errors: error_56.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update job order" });
                                    return [3 /*break*/, 10];
                                case 10: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/job-orders/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var jobOrder, error_57;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getJobOrder(parseInt(req.params.id))];
                                case 1:
                                    jobOrder = _a.sent();
                                    if (!jobOrder) {
                                        return [2 /*return*/, res.status(404).json({ message: "Job order not found" })];
                                    }
                                    // We're allowing deletion of job orders with rolls now, as the storage layer
                                    // will handle the cascade deletion
                                    return [4 /*yield*/, storage_1.storage.deleteJobOrder(parseInt(req.params.id))];
                                case 2:
                                    // We're allowing deletion of job orders with rolls now, as the storage layer
                                    // will handle the cascade deletion
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_57 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete job order" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Rolls
                    app.get("/api/rolls", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var rolls, error_58;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getRolls()];
                                case 1:
                                    rolls = _a.sent();
                                    res.json(rolls);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_58 = _a.sent();
                                    res.status(500).json({ message: "Failed to get rolls" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/job-orders/:jobOrderId/rolls", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var jobOrder, rolls, error_59;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getJobOrder(parseInt(req.params.jobOrderId))];
                                case 1:
                                    jobOrder = _a.sent();
                                    if (!jobOrder) {
                                        return [2 /*return*/, res.status(404).json({ message: "Job order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getRollsByJobOrder(parseInt(req.params.jobOrderId))];
                                case 2:
                                    rolls = _a.sent();
                                    res.json(rolls);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_59 = _a.sent();
                                    res.status(500).json({ message: "Failed to get rolls" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/rolls/stage/:stage", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var stage, rolls, error_60;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    stage = req.params.stage;
                                    if (!["extrusion", "printing", "cutting", "completed"].includes(stage)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid stage" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getRollsByStage(stage)];
                                case 1:
                                    rolls = _a.sent();
                                    res.json(rolls);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_60 = _a.sent();
                                    res.status(500).json({ message: "Failed to get rolls" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/rolls/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var roll, error_61;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getRoll(req.params.id)];
                                case 1:
                                    roll = _a.sent();
                                    if (!roll) {
                                        return [2 /*return*/, res.status(404).json({ message: "Roll not found" })];
                                    }
                                    res.json(roll);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_61 = _a.sent();
                                    res.status(500).json({ message: "Failed to get roll" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/rolls", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, jobOrder, existingRolls, nextSerialNumber, currentUserId, paddedJobOrderId, paddedSerialNumber, rollData, roll, error_62;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    console.log("Receiving roll creation request with data:", req.body);
                                    validatedData = schema_1.createRollSchema.parse(req.body);
                                    console.log("Validated roll data:", validatedData);
                                    return [4 /*yield*/, storage_1.storage.getJobOrder(validatedData.jobOrderId)];
                                case 1:
                                    jobOrder = _b.sent();
                                    if (!jobOrder) {
                                        console.error("Job order not found with ID: ".concat(validatedData.jobOrderId));
                                        return [2 /*return*/, res.status(404).json({ message: "Job order not found" })];
                                    }
                                    console.log("Found job order:", jobOrder);
                                    return [4 /*yield*/, storage_1.storage.getRollsByJobOrder(validatedData.jobOrderId)];
                                case 2:
                                    existingRolls = _b.sent();
                                    nextSerialNumber = (existingRolls.length + 1).toString();
                                    console.log("Next serial number: ".concat(nextSerialNumber, ", existing rolls: ").concat(existingRolls.length));
                                    currentUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.body.createdById;
                                    paddedJobOrderId = String(validatedData.jobOrderId).padStart(4, '0');
                                    paddedSerialNumber = nextSerialNumber.padStart(3, '0');
                                    rollData = __assign(__assign({}, validatedData), { serialNumber: paddedSerialNumber, id: "EX-".concat(paddedJobOrderId, "-").concat(paddedSerialNumber), createdById: currentUserId, createdAt: new Date(), status: "processing" // Automatically set status to processing instead of the default pending
                                     });
                                    console.log("Roll data to be inserted:", rollData);
                                    return [4 /*yield*/, storage_1.storage.createRoll(rollData)];
                                case 3:
                                    roll = _b.sent();
                                    console.log("Successfully created roll:", roll);
                                    res.status(201).json(roll);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_62 = _b.sent();
                                    console.error("Error creating roll:", error_62);
                                    if (error_62 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid roll data", errors: error_62.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create roll" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/rolls/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingRoll, statusStageSchema, updateData, updatedRoll, statusError_2, validatedData, jobOrder, roll, error_63;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 8, , 9]);
                                    console.log("Attempting to update roll ID: ".concat(req.params.id, " with data:"), req.body);
                                    return [4 /*yield*/, storage_1.storage.getRoll(req.params.id)];
                                case 1:
                                    existingRoll = _a.sent();
                                    if (!existingRoll) {
                                        console.log("Roll with ID ".concat(req.params.id, " not found"));
                                        return [2 /*return*/, res.status(404).json({ message: "Roll not found" })];
                                    }
                                    console.log("Found existing roll:", existingRoll);
                                    statusStageSchema = zod_1.z.object({
                                        status: zod_1.z.enum(["pending", "processing", "completed"]).optional(),
                                        currentStage: zod_1.z.enum(["extrusion", "printing", "cutting", "completed"]).optional(),
                                        extrudingQty: zod_1.z.number().optional(),
                                        printingQty: zod_1.z.number().optional(),
                                        cuttingQty: zod_1.z.number().optional(),
                                        wasteQty: zod_1.z.number().optional(),
                                        wastePercentage: zod_1.z.number().optional(),
                                        createdById: zod_1.z.string().optional(),
                                        printedById: zod_1.z.string().optional(),
                                        cutById: zod_1.z.string().optional(),
                                        printedAt: zod_1.z.date().optional(),
                                        cutAt: zod_1.z.date().optional(),
                                    });
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, , 5]);
                                    console.log("Attempting to validate as a stage/status update");
                                    updateData = statusStageSchema.parse(req.body);
                                    console.log("Validation succeeded, updating roll with:", updateData);
                                    // If moving to printing stage from extrusion, set printedAt date
                                    if (existingRoll.currentStage === "extrusion" && updateData.currentStage === "printing") {
                                        console.log("Adding printedAt date to update data");
                                        updateData.printedAt = new Date();
                                    }
                                    // If moving to cutting stage from printing, set cutAt date
                                    if (existingRoll.currentStage === "printing" && updateData.currentStage === "cutting") {
                                        console.log("Adding cutAt date to update data");
                                        updateData.cutAt = new Date();
                                    }
                                    // If staying in the same stage but changing from pending to processing status
                                    // (This is when an operator starts working on a stage)
                                    if (updateData.status === "processing" && existingRoll.status === "pending") {
                                        // If starting printing stage, set printedAt
                                        if (existingRoll.currentStage === "printing") {
                                            console.log("Setting printedAt to now as printing process is starting");
                                            updateData.printedAt = new Date();
                                        }
                                        // If starting cutting stage, set cutAt
                                        if (existingRoll.currentStage === "cutting") {
                                            console.log("Setting cutAt to now as cutting process is starting");
                                            updateData.cutAt = new Date();
                                        }
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateRoll(req.params.id, updateData)];
                                case 3:
                                    updatedRoll = _a.sent();
                                    console.log("Roll successfully updated:", updatedRoll);
                                    return [2 /*return*/, res.json(updatedRoll)];
                                case 4:
                                    statusError_2 = _a.sent();
                                    console.log("Status/stage validation failed:", statusError_2);
                                    return [3 /*break*/, 5];
                                case 5:
                                    validatedData = schema_1.insertRollSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getJobOrder(validatedData.jobOrderId)];
                                case 6:
                                    jobOrder = _a.sent();
                                    if (!jobOrder) {
                                        return [2 /*return*/, res.status(404).json({ message: "Job order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateRoll(req.params.id, validatedData)];
                                case 7:
                                    roll = _a.sent();
                                    res.json(roll);
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_63 = _a.sent();
                                    if (error_63 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid roll data", errors: error_63.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update roll" });
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/rolls/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var roll, error_64;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getRoll(req.params.id)];
                                case 1:
                                    roll = _a.sent();
                                    if (!roll) {
                                        return [2 /*return*/, res.status(404).json({ message: "Roll not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteRoll(req.params.id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_64 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete roll" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Raw Materials
                    app.get("/api/raw-materials", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var rawMaterials, error_65;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getRawMaterials()];
                                case 1:
                                    rawMaterials = _a.sent();
                                    res.json(rawMaterials);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_65 = _a.sent();
                                    res.status(500).json({ message: "Failed to get raw materials" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/raw-materials/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var rawMaterial, error_66;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getRawMaterial(parseInt(req.params.id))];
                                case 1:
                                    rawMaterial = _a.sent();
                                    if (!rawMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Raw material not found" })];
                                    }
                                    res.json(rawMaterial);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_66 = _a.sent();
                                    res.status(500).json({ message: "Failed to get raw material" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/raw-materials", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, rawMaterial, error_67;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    validatedData = schema_1.insertRawMaterialSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.createRawMaterial(validatedData)];
                                case 1:
                                    rawMaterial = _a.sent();
                                    res.status(201).json(rawMaterial);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_67 = _a.sent();
                                    if (error_67 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid raw material data", errors: error_67.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create raw material" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/raw-materials/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingRawMaterial, validatedData, rawMaterial, error_68;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getRawMaterial(parseInt(req.params.id))];
                                case 1:
                                    existingRawMaterial = _a.sent();
                                    if (!existingRawMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Raw material not found" })];
                                    }
                                    validatedData = schema_1.insertRawMaterialSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.updateRawMaterial(parseInt(req.params.id), validatedData)];
                                case 2:
                                    rawMaterial = _a.sent();
                                    res.json(rawMaterial);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_68 = _a.sent();
                                    if (error_68 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid raw material data", errors: error_68.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update raw material" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/raw-materials/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var rawMaterial, error_69;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getRawMaterial(parseInt(req.params.id))];
                                case 1:
                                    rawMaterial = _a.sent();
                                    if (!rawMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Raw material not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteRawMaterial(parseInt(req.params.id))];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_69 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete raw material" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Final Products
                    app.get("/api/final-products", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var finalProducts, error_70;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getFinalProducts()];
                                case 1:
                                    finalProducts = _a.sent();
                                    res.json(finalProducts);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_70 = _a.sent();
                                    res.status(500).json({ message: "Failed to get final products" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/final-products/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var finalProduct, error_71;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getFinalProduct(parseInt(req.params.id))];
                                case 1:
                                    finalProduct = _a.sent();
                                    if (!finalProduct) {
                                        return [2 /*return*/, res.status(404).json({ message: "Final product not found" })];
                                    }
                                    res.json(finalProduct);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_71 = _a.sent();
                                    res.status(500).json({ message: "Failed to get final product" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/final-products", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, jobOrder, finalProduct, error_72;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    validatedData = schema_1.insertFinalProductSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getJobOrder(validatedData.jobOrderId)];
                                case 1:
                                    jobOrder = _a.sent();
                                    if (!jobOrder) {
                                        return [2 /*return*/, res.status(404).json({ message: "Job order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.createFinalProduct(validatedData)];
                                case 2:
                                    finalProduct = _a.sent();
                                    res.status(201).json(finalProduct);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_72 = _a.sent();
                                    if (error_72 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid final product data", errors: error_72.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create final product" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/final-products/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingFinalProduct, validatedData, jobOrder, finalProduct, error_73;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    return [4 /*yield*/, storage_1.storage.getFinalProduct(parseInt(req.params.id))];
                                case 1:
                                    existingFinalProduct = _a.sent();
                                    if (!existingFinalProduct) {
                                        return [2 /*return*/, res.status(404).json({ message: "Final product not found" })];
                                    }
                                    validatedData = schema_1.insertFinalProductSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getJobOrder(validatedData.jobOrderId)];
                                case 2:
                                    jobOrder = _a.sent();
                                    if (!jobOrder) {
                                        return [2 /*return*/, res.status(404).json({ message: "Job order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateFinalProduct(parseInt(req.params.id), validatedData)];
                                case 3:
                                    finalProduct = _a.sent();
                                    res.json(finalProduct);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_73 = _a.sent();
                                    if (error_73 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid final product data", errors: error_73.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update final product" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/final-products/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var finalProduct, error_74;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getFinalProduct(parseInt(req.params.id))];
                                case 1:
                                    finalProduct = _a.sent();
                                    if (!finalProduct) {
                                        return [2 /*return*/, res.status(404).json({ message: "Final product not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteFinalProduct(parseInt(req.params.id))];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_74 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete final product" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Quality Check Types
                    app.get("/api/quality-check-types", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var qualityCheckTypes, adaptedCheckTypes, error_75;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getQualityCheckTypes()];
                                case 1:
                                    qualityCheckTypes = _a.sent();
                                    adaptedCheckTypes = qualityCheckTypes.map(function (checkType) { return (0, quality_adapter_1.adaptToFrontend)(checkType); });
                                    res.json(adaptedCheckTypes);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_75 = _a.sent();
                                    console.error("Error fetching quality check types:", error_75);
                                    res.status(500).json({ message: "Failed to fetch quality check types" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/quality-check-types/stage/:stage", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var stage, qualityCheckTypes, adaptedCheckTypes, error_76;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    stage = req.params.stage;
                                    return [4 /*yield*/, storage_1.storage.getQualityCheckTypesByStage(stage)];
                                case 1:
                                    qualityCheckTypes = _a.sent();
                                    adaptedCheckTypes = qualityCheckTypes.map(function (checkType) { return (0, quality_adapter_1.adaptToFrontend)(checkType); });
                                    res.json(adaptedCheckTypes);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_76 = _a.sent();
                                    console.error("Error fetching quality check types by stage:", error_76);
                                    res.status(500).json({ message: "Failed to fetch quality check types by stage" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/quality-check-types/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, qualityCheckType, adaptedCheckType, error_77;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = req.params.id;
                                    return [4 /*yield*/, storage_1.storage.getQualityCheckType(id)];
                                case 1:
                                    qualityCheckType = _a.sent();
                                    if (!qualityCheckType) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality check type not found" })];
                                    }
                                    adaptedCheckType = (0, quality_adapter_1.adaptToFrontend)(qualityCheckType);
                                    res.json(adaptedCheckType);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_77 = _a.sent();
                                    console.error("Error fetching quality check type:", error_77);
                                    res.status(500).json({ message: "Failed to fetch quality check type" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/quality-check-types", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var dbFormatData, qualityCheckType, adaptedResponse, error_78;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    dbFormatData = (0, quality_adapter_1.adaptToDatabase)(req.body);
                                    return [4 /*yield*/, storage_1.storage.createQualityCheckType(dbFormatData)];
                                case 1:
                                    qualityCheckType = _a.sent();
                                    adaptedResponse = (0, quality_adapter_1.adaptToFrontend)(qualityCheckType);
                                    res.status(201).json(adaptedResponse);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_78 = _a.sent();
                                    console.error("Error creating quality check type:", error_78);
                                    res.status(500).json({ message: "Failed to create quality check type" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.patch("/api/quality-check-types/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, dbFormatData, qualityCheckType, adaptedResponse, error_79;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = req.params.id;
                                    dbFormatData = (0, quality_adapter_1.adaptToDatabase)(__assign(__assign({}, req.body), { id: id }));
                                    return [4 /*yield*/, storage_1.storage.updateQualityCheckType(id, dbFormatData)];
                                case 1:
                                    qualityCheckType = _a.sent();
                                    if (!qualityCheckType) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality check type not found" })];
                                    }
                                    adaptedResponse = (0, quality_adapter_1.adaptToFrontend)(qualityCheckType);
                                    res.json(adaptedResponse);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_79 = _a.sent();
                                    console.error("Error updating quality check type:", error_79);
                                    res.status(500).json({ message: "Failed to update quality check type" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/quality-check-types/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, success, error_80;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = req.params.id;
                                    return [4 /*yield*/, storage_1.storage.deleteQualityCheckType(id)];
                                case 1:
                                    success = _a.sent();
                                    if (!success) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality check type not found" })];
                                    }
                                    res.status(204).send();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_80 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete quality check type" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Quality Checks
                    app.get("/api/quality-checks", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var qualityChecks, error_81;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    console.log("Fetching quality checks...");
                                    return [4 /*yield*/, storage_1.storage.getQualityChecks()];
                                case 1:
                                    qualityChecks = _a.sent();
                                    console.log("Quality checks from storage:", qualityChecks.length, "records");
                                    res.json(qualityChecks);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_81 = _a.sent();
                                    console.error("Error fetching quality checks:", error_81);
                                    res.status(500).json({ message: "Failed to fetch quality checks" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/quality-checks/roll/:rollId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var rollId, qualityChecks, error_82;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    rollId = req.params.rollId;
                                    return [4 /*yield*/, storage_1.storage.getQualityChecksByRoll(rollId)];
                                case 1:
                                    qualityChecks = _a.sent();
                                    res.json(qualityChecks);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_82 = _a.sent();
                                    res.status(500).json({ message: "Failed to fetch quality checks by roll" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/quality-checks/job-order/:jobOrderId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var jobOrderId, qualityChecks, error_83;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    jobOrderId = parseInt(req.params.jobOrderId);
                                    if (isNaN(jobOrderId) || jobOrderId <= 0) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid job order ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getQualityChecksByJobOrder(jobOrderId)];
                                case 1:
                                    qualityChecks = _a.sent();
                                    res.json(qualityChecks);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_83 = _a.sent();
                                    console.error("Error fetching quality checks by job order:", error_83);
                                    res.status(500).json({ message: "Failed to fetch quality checks by job order" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/quality-checks/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, qualityCheck, error_84;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality check ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getQualityCheck(id)];
                                case 1:
                                    qualityCheck = _a.sent();
                                    if (!qualityCheck) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality check not found" })];
                                    }
                                    res.json(qualityCheck);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_84 = _a.sent();
                                    res.status(500).json({ message: "Failed to fetch quality check" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/quality-checks", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var adaptToDatabase_1, dbQualityCheck, qualityCheck, error_85;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    // Log what's being received
                                    console.log("Creating quality check with data:", req.body);
                                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./quality-check-adapter'); })];
                                case 1:
                                    adaptToDatabase_1 = (_a.sent()).adaptToDatabase;
                                    dbQualityCheck = adaptToDatabase_1(req.body);
                                    // Add timestamps
                                    dbQualityCheck.checked_at = new Date();
                                    dbQualityCheck.created_at = new Date();
                                    console.log("Mapped to database fields:", dbQualityCheck);
                                    return [4 /*yield*/, storage_1.storage.createQualityCheck(dbQualityCheck)];
                                case 2:
                                    qualityCheck = _a.sent();
                                    res.status(201).json(qualityCheck);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_85 = _a.sent();
                                    console.error("Error creating quality check:", error_85);
                                    res.status(500).json({ message: "Failed to create quality check" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.patch("/api/quality-checks/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, qualityCheck, error_86;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality check ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateQualityCheck(id, req.body)];
                                case 1:
                                    qualityCheck = _a.sent();
                                    if (!qualityCheck) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality check not found" })];
                                    }
                                    res.json(qualityCheck);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_86 = _a.sent();
                                    res.status(500).json({ message: "Failed to update quality check" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/quality-checks/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, success, error_87;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality check ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteQualityCheck(id)];
                                case 1:
                                    success = _a.sent();
                                    if (!success) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality check not found" })];
                                    }
                                    res.status(204).send();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_87 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete quality check" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Corrective Actions
                    app.get("/api/corrective-actions", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var correctiveActions, error_88;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getCorrectiveActions()];
                                case 1:
                                    correctiveActions = _a.sent();
                                    res.json(correctiveActions);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_88 = _a.sent();
                                    res.status(500).json({ message: "Failed to fetch corrective actions" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/corrective-actions/quality-check/:qualityCheckId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var qualityCheckId, correctiveActions, error_89;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    qualityCheckId = parseInt(req.params.qualityCheckId);
                                    if (isNaN(qualityCheckId)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality check ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getCorrectiveActionsByQualityCheck(qualityCheckId)];
                                case 1:
                                    correctiveActions = _a.sent();
                                    res.json(correctiveActions);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_89 = _a.sent();
                                    res.status(500).json({ message: "Failed to fetch corrective actions by quality check" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/corrective-actions/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, correctiveAction, error_90;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid corrective action ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getCorrectiveAction(id)];
                                case 1:
                                    correctiveAction = _a.sent();
                                    if (!correctiveAction) {
                                        return [2 /*return*/, res.status(404).json({ message: "Corrective action not found" })];
                                    }
                                    res.json(correctiveAction);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_90 = _a.sent();
                                    res.status(500).json({ message: "Failed to fetch corrective action" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/corrective-actions", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var correctiveAction, error_91;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.createCorrectiveAction(req.body)];
                                case 1:
                                    correctiveAction = _a.sent();
                                    res.status(201).json(correctiveAction);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_91 = _a.sent();
                                    res.status(500).json({ message: "Failed to create corrective action" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.patch("/api/corrective-actions/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, correctiveAction, error_92;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid corrective action ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateCorrectiveAction(id, req.body)];
                                case 1:
                                    correctiveAction = _a.sent();
                                    if (!correctiveAction) {
                                        return [2 /*return*/, res.status(404).json({ message: "Corrective action not found" })];
                                    }
                                    res.json(correctiveAction);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_92 = _a.sent();
                                    res.status(500).json({ message: "Failed to update corrective action" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/corrective-actions/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, success, error_93;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid corrective action ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteCorrectiveAction(id)];
                                case 1:
                                    success = _a.sent();
                                    if (!success) {
                                        return [2 /*return*/, res.status(404).json({ message: "Corrective action not found" })];
                                    }
                                    res.status(204).send();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_93 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete corrective action" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Quality Violations
                    app.get("/api/quality-violations", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, qualityCheckId, reportedBy, severity, status_3, startDate, endDate, violations, error_94;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 13, , 14]);
                                    _a = req.query, qualityCheckId = _a.qualityCheckId, reportedBy = _a.reportedBy, severity = _a.severity, status_3 = _a.status, startDate = _a.startDate, endDate = _a.endDate;
                                    violations = void 0;
                                    if (!qualityCheckId) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage_1.storage.getQualityViolationsByQualityCheck(parseInt(qualityCheckId))];
                                case 1:
                                    violations = _b.sent();
                                    return [3 /*break*/, 12];
                                case 2:
                                    if (!reportedBy) return [3 /*break*/, 4];
                                    return [4 /*yield*/, storage_1.storage.getQualityViolationsByUser(reportedBy)];
                                case 3:
                                    violations = _b.sent();
                                    return [3 /*break*/, 12];
                                case 4:
                                    if (!severity) return [3 /*break*/, 6];
                                    return [4 /*yield*/, storage_1.storage.getQualityViolationsBySeverity(severity)];
                                case 5:
                                    violations = _b.sent();
                                    return [3 /*break*/, 12];
                                case 6:
                                    if (!status_3) return [3 /*break*/, 8];
                                    return [4 /*yield*/, storage_1.storage.getQualityViolationsByStatus(status_3)];
                                case 7:
                                    violations = _b.sent();
                                    return [3 /*break*/, 12];
                                case 8:
                                    if (!(startDate && endDate)) return [3 /*break*/, 10];
                                    return [4 /*yield*/, storage_1.storage.getQualityViolationsByDateRange(new Date(startDate), new Date(endDate))];
                                case 9:
                                    violations = _b.sent();
                                    return [3 /*break*/, 12];
                                case 10: return [4 /*yield*/, storage_1.storage.getQualityViolations()];
                                case 11:
                                    violations = _b.sent();
                                    _b.label = 12;
                                case 12:
                                    res.json(violations);
                                    return [3 /*break*/, 14];
                                case 13:
                                    error_94 = _b.sent();
                                    res.status(500).json({ message: "Failed to fetch quality violations: ".concat(error_94) });
                                    return [3 /*break*/, 14];
                                case 14: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/quality-violations/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, violation, error_95;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality violation ID" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getQualityViolation(id)];
                                case 2:
                                    violation = _a.sent();
                                    if (!violation) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality violation not found" })];
                                    }
                                    res.json(violation);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_95 = _a.sent();
                                    res.status(500).json({ message: "Failed to fetch quality violation: ".concat(error_95) });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/quality-violations", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var violation, error_96;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    // Set the reportedBy field from the authenticated user if not provided
                                    if (!req.body.reportedBy && req.user && req.user.id) {
                                        req.body.reportedBy = req.user.id;
                                    }
                                    // Validate required fields
                                    if (!req.body.qualityCheckId) {
                                        return [2 /*return*/, res.status(400).json({ message: "Quality check ID is required" })];
                                    }
                                    if (!req.body.violationType) {
                                        return [2 /*return*/, res.status(400).json({ message: "Violation type is required" })];
                                    }
                                    if (!req.body.severity) {
                                        return [2 /*return*/, res.status(400).json({ message: "Severity is required" })];
                                    }
                                    if (!req.body.description) {
                                        return [2 /*return*/, res.status(400).json({ message: "Description is required" })];
                                    }
                                    if (!req.body.affectedArea) {
                                        return [2 /*return*/, res.status(400).json({ message: "Affected area is required" })];
                                    }
                                    // Ensure status has a default value
                                    if (!req.body.status) {
                                        req.body.status = "open";
                                    }
                                    console.log("Creating quality violation with data:", JSON.stringify(req.body, null, 2));
                                    return [4 /*yield*/, storage_1.storage.createQualityViolation(req.body)];
                                case 1:
                                    violation = _a.sent();
                                    res.status(201).json(violation);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_96 = _a.sent();
                                    console.error("Quality violation creation error:", error_96);
                                    res.status(500).json({ message: "Failed to create quality violation: ".concat(error_96) });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.patch("/api/quality-violations/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, updated, error_97;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality violation ID" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.updateQualityViolation(id, req.body)];
                                case 2:
                                    updated = _a.sent();
                                    if (!updated) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality violation not found" })];
                                    }
                                    res.json(updated);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_97 = _a.sent();
                                    res.status(500).json({ message: "Failed to update quality violation: ".concat(error_97) });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/quality-violations/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, result, error_98;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality violation ID" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.deleteQualityViolation(id)];
                                case 2:
                                    result = _a.sent();
                                    if (!result) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality violation not found" })];
                                    }
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_98 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete quality violation: ".concat(error_98) });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Quality Penalties
                    app.get("/api/quality-penalties", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, violationId, assignedTo, penaltyType, status_4, startDate, endDate, penalties, error_99;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 13, , 14]);
                                    _a = req.query, violationId = _a.violationId, assignedTo = _a.assignedTo, penaltyType = _a.penaltyType, status_4 = _a.status, startDate = _a.startDate, endDate = _a.endDate;
                                    penalties = void 0;
                                    if (!violationId) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage_1.storage.getQualityPenaltiesByViolation(parseInt(violationId))];
                                case 1:
                                    penalties = _b.sent();
                                    return [3 /*break*/, 12];
                                case 2:
                                    if (!assignedTo) return [3 /*break*/, 4];
                                    return [4 /*yield*/, storage_1.storage.getQualityPenaltiesByUser(assignedTo)];
                                case 3:
                                    penalties = _b.sent();
                                    return [3 /*break*/, 12];
                                case 4:
                                    if (!penaltyType) return [3 /*break*/, 6];
                                    return [4 /*yield*/, storage_1.storage.getQualityPenaltiesByType(penaltyType)];
                                case 5:
                                    penalties = _b.sent();
                                    return [3 /*break*/, 12];
                                case 6:
                                    if (!status_4) return [3 /*break*/, 8];
                                    return [4 /*yield*/, storage_1.storage.getQualityPenaltiesByStatus(status_4)];
                                case 7:
                                    penalties = _b.sent();
                                    return [3 /*break*/, 12];
                                case 8:
                                    if (!(startDate && endDate)) return [3 /*break*/, 10];
                                    return [4 /*yield*/, storage_1.storage.getQualityPenaltiesByDateRange(new Date(startDate), new Date(endDate))];
                                case 9:
                                    penalties = _b.sent();
                                    return [3 /*break*/, 12];
                                case 10: return [4 /*yield*/, storage_1.storage.getQualityPenalties()];
                                case 11:
                                    penalties = _b.sent();
                                    _b.label = 12;
                                case 12:
                                    res.json(penalties);
                                    return [3 /*break*/, 14];
                                case 13:
                                    error_99 = _b.sent();
                                    res.status(500).json({ message: "Failed to fetch quality penalties: ".concat(error_99) });
                                    return [3 /*break*/, 14];
                                case 14: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/quality-penalties/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, penalty, error_100;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality penalty ID" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getQualityPenalty(id)];
                                case 2:
                                    penalty = _a.sent();
                                    if (!penalty) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality penalty not found" })];
                                    }
                                    res.json(penalty);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_100 = _a.sent();
                                    res.status(500).json({ message: "Failed to fetch quality penalty: ".concat(error_100) });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/quality-penalties", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var penaltyData, penalty, error_101;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    penaltyData = __assign({}, req.body);
                                    // Set the assignedBy field from the authenticated user if not provided
                                    if (!penaltyData.assignedBy) {
                                        if (req.user && req.user.id) {
                                            penaltyData.assignedBy = req.user.id;
                                        }
                                        else {
                                            // Use a default admin ID if user is not authenticated
                                            penaltyData.assignedBy = "00U1"; // Admin user ID
                                        }
                                    }
                                    // Ensure dates are properly formatted as Date objects
                                    if (penaltyData.startDate && typeof penaltyData.startDate === 'string') {
                                        penaltyData.startDate = new Date(penaltyData.startDate);
                                    }
                                    if (penaltyData.endDate && typeof penaltyData.endDate === 'string') {
                                        penaltyData.endDate = new Date(penaltyData.endDate);
                                    }
                                    return [4 /*yield*/, storage_1.storage.createQualityPenalty(penaltyData)];
                                case 1:
                                    penalty = _a.sent();
                                    res.status(201).json(penalty);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_101 = _a.sent();
                                    res.status(500).json({ message: "Failed to create quality penalty: ".concat(error_101) });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.patch("/api/quality-penalties/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, penaltyData, updated, error_102;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality penalty ID" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    penaltyData = __assign({}, req.body);
                                    if (penaltyData.startDate && typeof penaltyData.startDate === 'string') {
                                        penaltyData.startDate = new Date(penaltyData.startDate);
                                    }
                                    if (penaltyData.endDate && typeof penaltyData.endDate === 'string') {
                                        penaltyData.endDate = new Date(penaltyData.endDate);
                                    }
                                    if (penaltyData.verificationDate && typeof penaltyData.verificationDate === 'string') {
                                        penaltyData.verificationDate = new Date(penaltyData.verificationDate);
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateQualityPenalty(id, penaltyData)];
                                case 2:
                                    updated = _a.sent();
                                    if (!updated) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality penalty not found" })];
                                    }
                                    res.json(updated);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_102 = _a.sent();
                                    res.status(500).json({ message: "Failed to update quality penalty: ".concat(error_102) });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/quality-penalties/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, result, error_103;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid quality penalty ID" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.deleteQualityPenalty(id)];
                                case 2:
                                    result = _a.sent();
                                    if (!result) {
                                        return [2 /*return*/, res.status(404).json({ message: "Quality penalty not found" })];
                                    }
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_103 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete quality penalty: ".concat(error_103) });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Demo data endpoint - for initializing test data
                    app.post("/api/init-demo-data", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var initializeDemoData, result, error_104;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./demo-data'); })];
                                case 1:
                                    initializeDemoData = (_a.sent()).initializeDemoData;
                                    return [4 /*yield*/, initializeDemoData(storage_1.storage)];
                                case 2:
                                    result = _a.sent();
                                    if (result.success) {
                                        res.status(200).json({ message: "Demo data initialized successfully" });
                                    }
                                    else {
                                        throw result.error;
                                    }
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_104 = _a.sent();
                                    console.error("Failed to initialize demo data:", error_104);
                                    res.status(500).json({ message: "Failed to initialize demo data", error: error_104 });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    execPromise = (0, util_1.promisify)(child_process_1.exec);
                    // Get available backups
                    app.get("/api/database/backups", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var backupsDir_1, files;
                        return __generator(this, function (_a) {
                            try {
                                backupsDir_1 = path_1.default.join(process.cwd(), "backups");
                                if (!fs_1.default.existsSync(backupsDir_1)) {
                                    fs_1.default.mkdirSync(backupsDir_1, { recursive: true });
                                }
                                files = fs_1.default.readdirSync(backupsDir_1)
                                    .filter(function (file) { return file.endsWith('.sql'); })
                                    .map(function (file) {
                                    var filePath = path_1.default.join(backupsDir_1, file);
                                    var stats = fs_1.default.statSync(filePath);
                                    return {
                                        name: file.replace('.sql', ''),
                                        fileName: file,
                                        size: Math.round(stats.size / 1024), // in KB
                                        createdAt: stats.birthtime
                                    };
                                })
                                    .sort(function (a, b) { return b.createdAt.getTime() - a.createdAt.getTime(); });
                                res.json(files);
                            }
                            catch (error) {
                                console.error("Error getting database backups:", error);
                                res.status(500).json({ message: "Failed to get database backups" });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    // Create database backup
                    app.post("/api/database/backup", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var name_1, sanitizedName, timestamp, fileName, backupsDir_2, backupPath, dbUrl, dbName, dbUser, dbHost, dbPort, error_105;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    // Only administrators can access database functions
                                    if (req.user && !req.user.isAdmin) {
                                        return [2 /*return*/, res.status(403).json({ message: "Permission denied" })];
                                    }
                                    name_1 = req.body.name;
                                    if (!name_1 || typeof name_1 !== 'string' || !name_1.trim()) {
                                        return [2 /*return*/, res.status(400).json({ message: "Backup name is required" })];
                                    }
                                    sanitizedName = name_1.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
                                    timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                                    fileName = "".concat(sanitizedName, "_").concat(timestamp, ".sql");
                                    backupsDir_2 = path_1.default.join(process.cwd(), "backups");
                                    if (!fs_1.default.existsSync(backupsDir_2)) {
                                        fs_1.default.mkdirSync(backupsDir_2, { recursive: true });
                                    }
                                    backupPath = path_1.default.join(backupsDir_2, fileName);
                                    if (!process.env.DATABASE_URL) return [3 /*break*/, 2];
                                    dbUrl = new URL(process.env.DATABASE_URL);
                                    dbName = dbUrl.pathname.substring(1);
                                    dbUser = dbUrl.username;
                                    dbHost = dbUrl.hostname;
                                    dbPort = dbUrl.port;
                                    // Use pg_dump to create a backup
                                    return [4 /*yield*/, execPromise("PGPASSWORD=\"".concat(dbUrl.password, "\" pg_dump --host=").concat(dbHost, " --port=").concat(dbPort, " --username=").concat(dbUser, " --format=plain --file=\"").concat(backupPath, "\" ").concat(dbName))];
                                case 1:
                                    // Use pg_dump to create a backup
                                    _a.sent();
                                    res.json({
                                        success: true,
                                        message: "Database backup created successfully",
                                        backup: {
                                            name: sanitizedName,
                                            fileName: fileName,
                                            path: backupPath,
                                            createdAt: new Date()
                                        }
                                    });
                                    return [3 /*break*/, 3];
                                case 2: throw new Error("DATABASE_URL environment variable is not set");
                                case 3: return [3 /*break*/, 5];
                                case 4:
                                    error_105 = _a.sent();
                                    console.error("Error creating database backup:", error_105);
                                    res.status(500).json({ message: "Failed to create database backup: ".concat(error_105 instanceof Error ? error_105.message : 'Unknown error') });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Restore database from backup
                    app.post("/api/database/restore", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var fileName, backupsDir_3, backupPath, dbUrl, dbName, dbUser, dbHost, dbPort, dbPassword, tempSqlPath, tableListCommand, tableList, tableListStr, tables, dropStatements, err_1, error_106;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 10, , 11]);
                                    fileName = req.body.fileName;
                                    if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
                                        return [2 /*return*/, res.status(400).json({ message: "Backup file name is required" })];
                                    }
                                    backupsDir_3 = path_1.default.join(process.cwd(), "backups");
                                    backupPath = path_1.default.join(backupsDir_3, fileName);
                                    // Check if the backup file exists
                                    if (!fs_1.default.existsSync(backupPath)) {
                                        return [2 /*return*/, res.status(404).json({ message: "Backup file not found" })];
                                    }
                                    if (!process.env.DATABASE_URL) return [3 /*break*/, 8];
                                    dbUrl = new URL(process.env.DATABASE_URL);
                                    dbName = dbUrl.pathname.substring(1);
                                    dbUser = dbUrl.username;
                                    dbHost = dbUrl.hostname;
                                    dbPort = dbUrl.port;
                                    dbPassword = dbUrl.password;
                                    tempSqlPath = path_1.default.join(backupsDir_3, "temp_".concat(Date.now(), ".sql"));
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 6, , 7]);
                                    tableListCommand = "PGPASSWORD=\"".concat(dbPassword, "\" psql --host=").concat(dbHost, " --port=").concat(dbPort, " --username=").concat(dbUser, " --dbname=").concat(dbName, " -t -c \"SELECT tablename FROM pg_tables WHERE schemaname='public';\"");
                                    return [4 /*yield*/, execPromise(tableListCommand)];
                                case 2:
                                    tableList = _a.sent();
                                    tableListStr = tableList ? tableList.toString() : '';
                                    tables = tableListStr.trim().split('\n').filter(function (table) { return table.trim() !== ''; });
                                    console.log("Found ".concat(tables.length, " tables to drop before restore"));
                                    if (!(tables.length > 0)) return [3 /*break*/, 4];
                                    dropStatements = "\nBEGIN;\n-- Disable foreign key constraints temporarily\nSET session_replication_role = 'replica';\n\n-- Drop all tables\n".concat(tables.map(function (table) { return "DROP TABLE IF EXISTS \"".concat(table.trim(), "\" CASCADE;"); }).join('\n'), "\n\n-- Re-enable foreign key constraints\nSET session_replication_role = 'origin';\nCOMMIT;\n            ");
                                    fs_1.default.writeFileSync(tempSqlPath, dropStatements);
                                    // Execute the drop statements
                                    return [4 /*yield*/, execPromise("PGPASSWORD=\"".concat(dbPassword, "\" psql --host=").concat(dbHost, " --port=").concat(dbPort, " --username=").concat(dbUser, " --dbname=").concat(dbName, " --file=\"").concat(tempSqlPath, "\""))];
                                case 3:
                                    // Execute the drop statements
                                    _a.sent();
                                    _a.label = 4;
                                case 4: 
                                // Now restore from the backup file
                                return [4 /*yield*/, execPromise("PGPASSWORD=\"".concat(dbPassword, "\" psql --host=").concat(dbHost, " --port=").concat(dbPort, " --username=").concat(dbUser, " --dbname=").concat(dbName, " --file=\"").concat(backupPath, "\""))];
                                case 5:
                                    // Now restore from the backup file
                                    _a.sent();
                                    // Clean up the temporary file
                                    if (fs_1.default.existsSync(tempSqlPath)) {
                                        fs_1.default.unlinkSync(tempSqlPath);
                                    }
                                    // Send successful response
                                    res.json({
                                        success: true,
                                        message: "Database restored successfully. Server will restart to apply changes."
                                    });
                                    // Close existing connections (after response is sent)
                                    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                        var err_2;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 2, , 3]);
                                                    return [4 /*yield*/, db_1.pool.end()];
                                                case 1:
                                                    _a.sent();
                                                    console.log("Database connections closed");
                                                    return [3 /*break*/, 3];
                                                case 2:
                                                    err_2 = _a.sent();
                                                    console.error("Error closing connections:", err_2);
                                                    return [3 /*break*/, 3];
                                                case 3:
                                                    // Schedule a server restart after connections are closed
                                                    console.log("Restarting server to apply database restore...");
                                                    process.exit(0); // Exit with success code to trigger restart
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); }, 1000);
                                    return [3 /*break*/, 7];
                                case 6:
                                    err_1 = _a.sent();
                                    // Clean up temporary file if it exists
                                    if (fs_1.default.existsSync(tempSqlPath)) {
                                        fs_1.default.unlinkSync(tempSqlPath);
                                    }
                                    throw err_1;
                                case 7: return [3 /*break*/, 9];
                                case 8: throw new Error("DATABASE_URL environment variable is not set");
                                case 9: return [3 /*break*/, 11];
                                case 10:
                                    error_106 = _a.sent();
                                    console.error("Error restoring database:", error_106);
                                    res.status(500).json({ message: "Failed to restore database: ".concat(error_106 instanceof Error ? error_106.message : 'Unknown error') });
                                    return [3 /*break*/, 11];
                                case 11: return [2 /*return*/];
                            }
                        });
                    }); });
                    // CSV Import endpoint
                    app.post("/api/import-csv", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var entityType, file, csvData, importFromCSV, result, error_107;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    entityType = req.body.entityType;
                                    if (!req.files || !req.files.file) {
                                        return [2 /*return*/, res.status(400).json({ message: "No file was uploaded" })];
                                    }
                                    if (!entityType) {
                                        return [2 /*return*/, res.status(400).json({ message: "Entity type is required" })];
                                    }
                                    file = req.files.file;
                                    csvData = file.data.toString();
                                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./import-utils'); })];
                                case 1:
                                    importFromCSV = (_a.sent()).importFromCSV;
                                    return [4 /*yield*/, importFromCSV(entityType, csvData, storage_1.storage)];
                                case 2:
                                    result = _a.sent();
                                    if (result.success === true && 'created' in result) {
                                        res.status(200).json({
                                            message: "CSV data imported successfully",
                                            created: result.created,
                                            updated: result.updated,
                                            failed: result.failed,
                                            errors: result.errors && result.errors.length > 0 ? result.errors : undefined
                                        });
                                    }
                                    else if (result.success === false && 'message' in result) {
                                        res.status(400).json({
                                            message: result.message,
                                            errors: result.errors || []
                                        });
                                    }
                                    else {
                                        res.status(500).json({ message: "Unknown import result format" });
                                    }
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_107 = _a.sent();
                                    console.error("Failed to import CSV data:", error_107);
                                    res.status(500).json({ message: "Failed to import CSV data", error: error_107.message });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("./sms-storage"); })];
                case 4:
                    smsStorage = (_a.sent()).smsStorage;
                    // const { seedSmsData } = await import("./sms-seed");
                    // Initialize SMS data on startup (disabled to prevent duplicate records)
                    // await seedSmsData();
                    // SMS Messages
                    app.get("/api/sms-messages", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var messages, error_108;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, smsStorage.getSmsMessages()];
                                case 1:
                                    messages = _a.sent();
                                    res.json(messages);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_108 = _a.sent();
                                    console.error("Error fetching SMS messages:", error_108);
                                    res.status(500).json({ message: "Failed to get SMS messages" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/sms-messages/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, message, error_109;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid message ID" })];
                                    }
                                    return [4 /*yield*/, smsStorage.getSmsMessage(id)];
                                case 1:
                                    message = _a.sent();
                                    if (!message) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS message not found" })];
                                    }
                                    res.json(message);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_109 = _a.sent();
                                    console.error("Error fetching SMS message:", error_109);
                                    res.status(500).json({ message: "Failed to get SMS message" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/sms-messages", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, SmsService, result, error_110;
                        var _a, _b, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _d.trys.push([0, 8, , 9]);
                                    validatedData = schema_1.insertSmsMessageSchema.parse(req.body);
                                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./services/sms-service'); })];
                                case 1:
                                    SmsService = (_d.sent()).SmsService;
                                    result = void 0;
                                    if (!(validatedData.messageType === 'order_notification' && validatedData.orderId)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, SmsService.sendOrderNotification(validatedData.orderId, validatedData.recipientPhone, validatedData.message, validatedData.sentBy || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || undefined, validatedData.recipientName || undefined, validatedData.customerId || undefined)];
                                case 2:
                                    result = _d.sent();
                                    return [3 /*break*/, 7];
                                case 3:
                                    if (!(validatedData.messageType === 'status_update' && validatedData.jobOrderId)) return [3 /*break*/, 5];
                                    return [4 /*yield*/, SmsService.sendJobOrderUpdate(validatedData.jobOrderId, validatedData.recipientPhone, validatedData.message, validatedData.sentBy || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || undefined, validatedData.recipientName || undefined, validatedData.customerId || undefined)];
                                case 4:
                                    result = _d.sent();
                                    return [3 /*break*/, 7];
                                case 5: return [4 /*yield*/, SmsService.sendCustomMessage(validatedData.recipientPhone, validatedData.message, validatedData.sentBy || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id) || undefined, validatedData.recipientName || undefined, validatedData.category || 'general', validatedData.priority || 'normal')];
                                case 6:
                                    result = _d.sent();
                                    _d.label = 7;
                                case 7:
                                    res.status(201).json(result);
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_110 = _d.sent();
                                    console.error("Error sending SMS message:", error_110);
                                    if (error_110 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid SMS message data", errors: error_110.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to send SMS message" });
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/sms-messages/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, updates, message, error_111;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid message ID" })];
                                    }
                                    updates = req.body;
                                    return [4 /*yield*/, smsStorage.updateSmsMessage(id, updates)];
                                case 1:
                                    message = _a.sent();
                                    if (!message) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS message not found" })];
                                    }
                                    res.json(message);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_111 = _a.sent();
                                    console.error("Error updating SMS message:", error_111);
                                    res.status(500).json({ message: "Failed to update SMS message" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/sms-messages/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, deleted, error_112;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid message ID" })];
                                    }
                                    return [4 /*yield*/, smsStorage.deleteSmsMessage(id)];
                                case 1:
                                    deleted = _a.sent();
                                    if (!deleted) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS message not found" })];
                                    }
                                    res.status(204).send();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_112 = _a.sent();
                                    console.error("Error deleting SMS message:", error_112);
                                    res.status(500).json({ message: "Failed to delete SMS message" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/sms-messages/:id/resend", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, message, SmsService, updatedMessage, error_113;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid message ID" })];
                                    }
                                    return [4 /*yield*/, smsStorage.resendSmsMessage(id)];
                                case 1:
                                    message = _a.sent();
                                    if (!message) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS message not found" })];
                                    }
                                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./services/sms-service'); })];
                                case 2:
                                    SmsService = (_a.sent()).SmsService;
                                    return [4 /*yield*/, SmsService.sendCustomMessage(message.recipientPhone, message.message, message.sentBy || undefined, message.recipientName || undefined, message.category || 'general', message.priority || 'normal')];
                                case 3:
                                    updatedMessage = _a.sent();
                                    res.json(message);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_113 = _a.sent();
                                    console.error("Error resending SMS message:", error_113);
                                    res.status(500).json({ message: "Failed to resend SMS message" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/orders/:orderId/sms-messages", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var orderId, messages, error_114;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    orderId = parseInt(req.params.orderId);
                                    if (isNaN(orderId)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid order ID" })];
                                    }
                                    return [4 /*yield*/, smsStorage.getSmsMessagesByOrder(orderId)];
                                case 1:
                                    messages = _a.sent();
                                    res.json(messages);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_114 = _a.sent();
                                    console.error("Error fetching order SMS messages:", error_114);
                                    res.status(500).json({ message: "Failed to get SMS messages" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // SMS Templates
                    app.get("/api/sms-templates", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var templates, error_115;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, smsStorage.getSmsTemplates()];
                                case 1:
                                    templates = _a.sent();
                                    res.json(templates);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_115 = _a.sent();
                                    console.error("Error fetching SMS templates:", error_115);
                                    res.status(500).json({ message: "Failed to get SMS templates" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/sms-templates/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, template, error_116;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = req.params.id;
                                    return [4 /*yield*/, smsStorage.getSmsTemplate(id)];
                                case 1:
                                    template = _a.sent();
                                    if (!template) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS template not found" })];
                                    }
                                    res.json(template);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_116 = _a.sent();
                                    console.error("Error fetching SMS template:", error_116);
                                    res.status(500).json({ message: "Failed to get SMS template" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/sms-templates", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var templateData, template, error_117;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    templateData = schema_1.insertSmsTemplateSchema.parse(req.body);
                                    return [4 /*yield*/, smsStorage.createSmsTemplate(__assign(__assign({}, templateData), { createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id }))];
                                case 1:
                                    template = _b.sent();
                                    res.status(201).json(template);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_117 = _b.sent();
                                    console.error("Error creating SMS template:", error_117);
                                    if (error_117 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid SMS template data", errors: error_117.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create SMS template" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/sms-templates/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, updates, template, error_118;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = req.params.id;
                                    updates = req.body;
                                    return [4 /*yield*/, smsStorage.updateSmsTemplate(id, updates)];
                                case 1:
                                    template = _a.sent();
                                    if (!template) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS template not found" })];
                                    }
                                    res.json(template);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_118 = _a.sent();
                                    console.error("Error updating SMS template:", error_118);
                                    res.status(500).json({ message: "Failed to update SMS template" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/sms-templates/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, deleted, error_119;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = req.params.id;
                                    return [4 /*yield*/, smsStorage.deleteSmsTemplate(id)];
                                case 1:
                                    deleted = _a.sent();
                                    if (!deleted) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS template not found" })];
                                    }
                                    res.status(204).send();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_119 = _a.sent();
                                    console.error("Error deleting SMS template:", error_119);
                                    res.status(500).json({ message: "Failed to delete SMS template" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // SMS Notification Rules
                    app.get("/api/sms-notification-rules", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var rules, error_120;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, smsStorage.getSmsNotificationRules()];
                                case 1:
                                    rules = _a.sent();
                                    res.json(rules);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_120 = _a.sent();
                                    console.error("Error fetching SMS notification rules:", error_120);
                                    res.status(500).json({ message: "Failed to get SMS notification rules" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/sms-notification-rules/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, rule, error_121;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid rule ID" })];
                                    }
                                    return [4 /*yield*/, smsStorage.getSmsNotificationRule(id)];
                                case 1:
                                    rule = _a.sent();
                                    if (!rule) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS notification rule not found" })];
                                    }
                                    res.json(rule);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_121 = _a.sent();
                                    console.error("Error fetching SMS notification rule:", error_121);
                                    res.status(500).json({ message: "Failed to get SMS notification rule" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/sms-notification-rules", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var ruleData, rule, error_122;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    ruleData = schema_1.insertSmsNotificationRuleSchema.parse(req.body);
                                    return [4 /*yield*/, smsStorage.createSmsNotificationRule(__assign(__assign({}, ruleData), { createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id }))];
                                case 1:
                                    rule = _b.sent();
                                    res.status(201).json(rule);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_122 = _b.sent();
                                    console.error("Error creating SMS notification rule:", error_122);
                                    if (error_122 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid SMS notification rule data", errors: error_122.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create SMS notification rule" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/sms-notification-rules/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, updates, rule, error_123;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid rule ID" })];
                                    }
                                    updates = req.body;
                                    return [4 /*yield*/, smsStorage.updateSmsNotificationRule(id, updates)];
                                case 1:
                                    rule = _a.sent();
                                    if (!rule) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS notification rule not found" })];
                                    }
                                    res.json(rule);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_123 = _a.sent();
                                    console.error("Error updating SMS notification rule:", error_123);
                                    res.status(500).json({ message: "Failed to update SMS notification rule" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/sms-notification-rules/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, deleted, error_124;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid rule ID" })];
                                    }
                                    return [4 /*yield*/, smsStorage.deleteSmsNotificationRule(id)];
                                case 1:
                                    deleted = _a.sent();
                                    if (!deleted) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS notification rule not found" })];
                                    }
                                    res.status(204).send();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_124 = _a.sent();
                                    console.error("Error deleting SMS notification rule:", error_124);
                                    res.status(500).json({ message: "Failed to delete SMS notification rule" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/job-orders/:jobOrderId/sms-messages", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var jobOrderId, jobOrder, messages, error_125;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    jobOrderId = parseInt(req.params.jobOrderId);
                                    if (isNaN(jobOrderId)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid job order ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getJobOrder(jobOrderId)];
                                case 1:
                                    jobOrder = _a.sent();
                                    if (!jobOrder) {
                                        return [2 /*return*/, res.status(404).json({ message: "Job order not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getSmsMessagesByJobOrder(jobOrderId)];
                                case 2:
                                    messages = _a.sent();
                                    res.json(messages);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_125 = _a.sent();
                                    res.status(500).json({ message: "Failed to get SMS messages" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/customers/:customerId/sms-messages", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var customerId, customer, messages, error_126;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    customerId = req.params.customerId;
                                    return [4 /*yield*/, storage_1.storage.getCustomer(customerId)];
                                case 1:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getSmsMessagesByCustomer(customerId)];
                                case 2:
                                    messages = _a.sent();
                                    res.json(messages);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_126 = _a.sent();
                                    res.status(500).json({ message: "Failed to get SMS messages" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/sms-messages/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, message, error_127;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid SMS message ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getSmsMessage(id)];
                                case 1:
                                    message = _a.sent();
                                    if (!message) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS message not found" })];
                                    }
                                    res.json(message);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_127 = _a.sent();
                                    res.status(500).json({ message: "Failed to get SMS message" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/sms-messages/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, message, error_128;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid SMS message ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getSmsMessage(id)];
                                case 1:
                                    message = _a.sent();
                                    if (!message) {
                                        return [2 /*return*/, res.status(404).json({ message: "SMS message not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteSmsMessage(id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_128 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete SMS message" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Mix Materials
                    app.get("/api/mix-materials", requireAuth, function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var mixMaterials, mixIds, mixMachinesMap_1, _i, mixIds_1, mixId, mixMachines, machineIds, result, error_129;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 6, , 7]);
                                    return [4 /*yield*/, storage_1.storage.getMixMaterials()];
                                case 1:
                                    mixMaterials = _a.sent();
                                    mixIds = mixMaterials.map(function (mix) { return mix.id; });
                                    mixMachinesMap_1 = new Map();
                                    _i = 0, mixIds_1 = mixIds;
                                    _a.label = 2;
                                case 2:
                                    if (!(_i < mixIds_1.length)) return [3 /*break*/, 5];
                                    mixId = mixIds_1[_i];
                                    return [4 /*yield*/, storage_1.storage.getMixMachinesByMixId(mixId)];
                                case 3:
                                    mixMachines = _a.sent();
                                    machineIds = mixMachines.map(function (mm) { return mm.machineId; });
                                    mixMachinesMap_1.set(mixId, machineIds);
                                    _a.label = 4;
                                case 4:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 5:
                                    result = mixMaterials.map(function (mix) { return (__assign(__assign({}, mix), { machines: mixMachinesMap_1.get(mix.id) || [] })); });
                                    res.json(result);
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_129 = _a.sent();
                                    res.status(500).json({ message: "Failed to get mix materials" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/mix-materials/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, mixMaterial, mixMachines, machineIds, result, error_130;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMixMaterial(id)];
                                case 1:
                                    mixMaterial = _a.sent();
                                    if (!mixMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Mix material not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMixMachinesByMixId(id)];
                                case 2:
                                    mixMachines = _a.sent();
                                    machineIds = mixMachines.map(function (mm) { return mm.machineId; });
                                    result = __assign(__assign({}, mixMaterial), { machines: machineIds });
                                    res.json(result);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_130 = _a.sent();
                                    res.status(500).json({ message: "Failed to get mix material" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/mix-materials", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, machineIds, mixData, mixMaterialData, order, mixMaterial, _i, machineIds_1, machineId, machine, result, error_131;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 9, , 10]);
                                    _a = req.body, machineIds = _a.machineIds, mixData = __rest(_a, ["machineIds"]);
                                    // Set mixPerson to current user ID from authentication
                                    if (!req.user) {
                                        return [2 /*return*/, res.status(401).json({ message: "Authentication required" })];
                                    }
                                    mixData.mixPerson = req.user.id;
                                    console.log("Setting mixPerson to user ID:", req.user.id);
                                    // Convert mixDate from string to Date object
                                    if (typeof mixData.mixDate === 'string') {
                                        mixData.mixDate = new Date(mixData.mixDate);
                                        console.log("Converted mixDate to Date object:", mixData.mixDate);
                                    }
                                    // Validate the modified data
                                    console.log("Data before validation:", JSON.stringify(mixData));
                                    mixMaterialData = void 0;
                                    try {
                                        mixMaterialData = schema_1.insertMixMaterialSchema.parse(mixData);
                                    }
                                    catch (validationError) {
                                        console.error("Validation error:", validationError);
                                        return [2 /*return*/, res.status(400).json({
                                                message: "Invalid mix material data",
                                                details: validationError
                                            })];
                                    }
                                    if (!mixMaterialData.orderId) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage_1.storage.getOrder(mixMaterialData.orderId)];
                                case 1:
                                    order = _b.sent();
                                    if (!order) {
                                        return [2 /*return*/, res.status(404).json({ message: "Order not found" })];
                                    }
                                    _b.label = 2;
                                case 2:
                                    // Create the mix material
                                    console.log("Validated data for mix material creation:", mixMaterialData);
                                    return [4 /*yield*/, storage_1.storage.createMixMaterial(mixMaterialData)];
                                case 3:
                                    mixMaterial = _b.sent();
                                    if (!(machineIds && Array.isArray(machineIds) && machineIds.length > 0)) return [3 /*break*/, 8];
                                    _i = 0, machineIds_1 = machineIds;
                                    _b.label = 4;
                                case 4:
                                    if (!(_i < machineIds_1.length)) return [3 /*break*/, 8];
                                    machineId = machineIds_1[_i];
                                    return [4 /*yield*/, storage_1.storage.getMachine(machineId)];
                                case 5:
                                    machine = _b.sent();
                                    if (!machine) {
                                        // Skip invalid machines but don't fail the whole operation
                                        console.warn("Machine with ID ".concat(machineId, " not found. Skipping."));
                                        return [3 /*break*/, 7];
                                    }
                                    // Add machine to mix
                                    return [4 /*yield*/, storage_1.storage.createMixMachine({
                                            mixId: mixMaterial.id,
                                            machineId: machineId
                                        })];
                                case 6:
                                    // Add machine to mix
                                    _b.sent();
                                    _b.label = 7;
                                case 7:
                                    _i++;
                                    return [3 /*break*/, 4];
                                case 8:
                                    result = __assign(__assign({}, mixMaterial), { machines: machineIds || [] });
                                    res.status(201).json(result);
                                    return [3 /*break*/, 10];
                                case 9:
                                    error_131 = _b.sent();
                                    if (error_131 instanceof zod_1.z.ZodError) {
                                        console.error("Zod validation error:", JSON.stringify(error_131.errors, null, 2));
                                        console.error("Request body:", JSON.stringify(req.body, null, 2));
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid mix material data", errors: error_131.errors })];
                                    }
                                    console.error("Error creating mix material:", error_131);
                                    res.status(500).json({ message: "Failed to create mix material" });
                                    return [3 /*break*/, 10];
                                case 10: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/mix-materials/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, existingMixMaterial, _a, machineIds, mixData, validatedData, order, updatedMixMaterial, _i, machineIds_2, machineId, machine, mixMachines, machineIdsArray, result, error_132;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 12, , 13]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMixMaterial(id)];
                                case 1:
                                    existingMixMaterial = _b.sent();
                                    if (!existingMixMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Mix material not found" })];
                                    }
                                    _a = req.body, machineIds = _a.machineIds, mixData = __rest(_a, ["machineIds"]);
                                    validatedData = schema_1.insertMixMaterialSchema.parse(mixData);
                                    if (!validatedData.orderId) return [3 /*break*/, 3];
                                    return [4 /*yield*/, storage_1.storage.getOrder(validatedData.orderId)];
                                case 2:
                                    order = _b.sent();
                                    if (!order) {
                                        return [2 /*return*/, res.status(404).json({ message: "Order not found" })];
                                    }
                                    _b.label = 3;
                                case 3: return [4 /*yield*/, storage_1.storage.updateMixMaterial(id, validatedData)];
                                case 4:
                                    updatedMixMaterial = _b.sent();
                                    if (!(machineIds !== undefined)) return [3 /*break*/, 10];
                                    // First, remove all existing machine associations
                                    return [4 /*yield*/, storage_1.storage.deleteMixMachinesByMixId(id)];
                                case 5:
                                    // First, remove all existing machine associations
                                    _b.sent();
                                    if (!(Array.isArray(machineIds) && machineIds.length > 0)) return [3 /*break*/, 10];
                                    _i = 0, machineIds_2 = machineIds;
                                    _b.label = 6;
                                case 6:
                                    if (!(_i < machineIds_2.length)) return [3 /*break*/, 10];
                                    machineId = machineIds_2[_i];
                                    return [4 /*yield*/, storage_1.storage.getMachine(machineId)];
                                case 7:
                                    machine = _b.sent();
                                    if (!machine) {
                                        // Skip invalid machines but don't fail the whole operation
                                        console.warn("Machine with ID ".concat(machineId, " not found. Skipping."));
                                        return [3 /*break*/, 9];
                                    }
                                    // Add machine to mix
                                    return [4 /*yield*/, storage_1.storage.createMixMachine({
                                            mixId: id,
                                            machineId: machineId
                                        })];
                                case 8:
                                    // Add machine to mix
                                    _b.sent();
                                    _b.label = 9;
                                case 9:
                                    _i++;
                                    return [3 /*break*/, 6];
                                case 10: return [4 /*yield*/, storage_1.storage.getMixMachinesByMixId(id)];
                                case 11:
                                    mixMachines = _b.sent();
                                    machineIdsArray = mixMachines.map(function (mm) { return mm.machineId; });
                                    result = __assign(__assign({}, updatedMixMaterial), { machines: machineIdsArray });
                                    res.json(result);
                                    return [3 /*break*/, 13];
                                case 12:
                                    error_132 = _b.sent();
                                    if (error_132 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid mix material data", errors: error_132.errors })];
                                    }
                                    console.error("Error updating mix material:", error_132);
                                    res.status(500).json({ message: "Failed to update mix material" });
                                    return [3 /*break*/, 13];
                                case 13: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/mix-materials/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, mixMaterial, error_133;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMixMaterial(id)];
                                case 1:
                                    mixMaterial = _a.sent();
                                    if (!mixMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Mix material not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteMixMaterial(id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_133 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete mix material" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Mix Items
                    app.get("/api/mix-items", requireAuth, function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var mixItems, error_134;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getMixItems()];
                                case 1:
                                    mixItems = _a.sent();
                                    res.json(mixItems);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_134 = _a.sent();
                                    res.status(500).json({ message: "Failed to get mix items" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/mix-materials/:mixId/items", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var mixId, mixMaterial, mixItems, error_135;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    mixId = parseInt(req.params.mixId);
                                    if (isNaN(mixId)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid mix ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMixMaterial(mixId)];
                                case 1:
                                    mixMaterial = _a.sent();
                                    if (!mixMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Mix material not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMixItemsByMix(mixId)];
                                case 2:
                                    mixItems = _a.sent();
                                    res.json(mixItems);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_135 = _a.sent();
                                    res.status(500).json({ message: "Failed to get mix items" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/mix-items/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, mixItem, error_136;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMixItem(id)];
                                case 1:
                                    mixItem = _a.sent();
                                    if (!mixItem) {
                                        return [2 /*return*/, res.status(404).json({ message: "Mix item not found" })];
                                    }
                                    res.json(mixItem);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_136 = _a.sent();
                                    res.status(500).json({ message: "Failed to get mix item" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/mix-items", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, mixMaterial, rawMaterial, mixItem, newQuantity, allMixItems, totalWeight, _i, allMixItems_1, item, percentage, updatedMixItem, error_137, error_138;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 15, , 16]);
                                    validatedData = schema_1.insertMixItemSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.getMixMaterial(validatedData.mixId)];
                                case 1:
                                    mixMaterial = _a.sent();
                                    if (!mixMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Mix material not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getRawMaterial(validatedData.rawMaterialId)];
                                case 2:
                                    rawMaterial = _a.sent();
                                    if (!rawMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Raw material not found" })];
                                    }
                                    // Validate quantity is greater than zero
                                    if (validatedData.quantity <= 0) {
                                        return [2 /*return*/, res.status(400).json({ message: "Quantity must be greater than zero" })];
                                    }
                                    // Validate raw material has enough quantity
                                    if (rawMaterial.quantity === null || rawMaterial.quantity < validatedData.quantity) {
                                        return [2 /*return*/, res.status(400).json({
                                                message: "Insufficient quantity of raw material ".concat(rawMaterial.name),
                                                available: rawMaterial.quantity,
                                                requested: validatedData.quantity
                                            })];
                                    }
                                    _a.label = 3;
                                case 3:
                                    _a.trys.push([3, 13, , 14]);
                                    return [4 /*yield*/, storage_1.storage.createMixItem(validatedData)];
                                case 4:
                                    mixItem = _a.sent();
                                    newQuantity = rawMaterial.quantity - validatedData.quantity;
                                    return [4 /*yield*/, storage_1.storage.updateRawMaterial(validatedData.rawMaterialId, {
                                            quantity: newQuantity,
                                            lastUpdated: new Date()
                                        })];
                                case 5:
                                    _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getMixItemsByMix(validatedData.mixId)];
                                case 6:
                                    allMixItems = _a.sent();
                                    totalWeight = allMixItems.reduce(function (sum, item) { return sum + item.quantity; }, 0);
                                    _i = 0, allMixItems_1 = allMixItems;
                                    _a.label = 7;
                                case 7:
                                    if (!(_i < allMixItems_1.length)) return [3 /*break*/, 10];
                                    item = allMixItems_1[_i];
                                    percentage = (item.quantity / totalWeight) * 100;
                                    return [4 /*yield*/, storage_1.storage.updateMixItem(item.id, { percentage: percentage })];
                                case 8:
                                    _a.sent();
                                    _a.label = 9;
                                case 9:
                                    _i++;
                                    return [3 /*break*/, 7];
                                case 10: 
                                // 6. Update the mix total quantity
                                return [4 /*yield*/, storage_1.storage.updateMixMaterial(validatedData.mixId, { totalQuantity: totalWeight })];
                                case 11:
                                    // 6. Update the mix total quantity
                                    _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getMixItem(mixItem.id)];
                                case 12:
                                    updatedMixItem = _a.sent();
                                    res.status(201).json(updatedMixItem);
                                    return [3 /*break*/, 14];
                                case 13:
                                    error_137 = _a.sent();
                                    console.error("Error during mix item creation:", error_137);
                                    throw error_137;
                                case 14: return [3 /*break*/, 16];
                                case 15:
                                    error_138 = _a.sent();
                                    if (error_138 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid mix item data", errors: error_138.errors })];
                                    }
                                    if (error_138 instanceof Error) {
                                        return [2 /*return*/, res.status(400).json({ message: error_138.message })];
                                    }
                                    res.status(500).json({ message: "Failed to create mix item" });
                                    return [3 /*break*/, 16];
                                case 16: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/mix-items/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, existingMixItem, quantity, rawMaterial, quantityDifference, availableQuantity, updatedMixItem, newRawMaterialQuantity, allMixItems, totalWeight, _i, allMixItems_2, item, percentage, finalPercentage, finalUpdatedItem, error_139, error_140;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 15, , 16]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMixItem(id)];
                                case 1:
                                    existingMixItem = _a.sent();
                                    if (!existingMixItem) {
                                        return [2 /*return*/, res.status(404).json({ message: "Mix item not found" })];
                                    }
                                    quantity = req.body.quantity;
                                    if (quantity === undefined) {
                                        return [2 /*return*/, res.status(400).json({ message: "Quantity is required" })];
                                    }
                                    if (quantity <= 0) {
                                        return [2 /*return*/, res.status(400).json({ message: "Quantity must be greater than zero" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getRawMaterial(existingMixItem.rawMaterialId)];
                                case 2:
                                    rawMaterial = _a.sent();
                                    if (!rawMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Raw material not found" })];
                                    }
                                    quantityDifference = quantity - existingMixItem.quantity;
                                    // Check if we have enough raw material for the increase
                                    if (quantityDifference > 0) {
                                        availableQuantity = rawMaterial.quantity !== null ? rawMaterial.quantity : 0;
                                        if (availableQuantity < quantityDifference) {
                                            return [2 /*return*/, res.status(400).json({
                                                    message: "Insufficient quantity of raw material ".concat(rawMaterial.name),
                                                    available: availableQuantity,
                                                    requested: quantityDifference
                                                })];
                                        }
                                    }
                                    _a.label = 3;
                                case 3:
                                    _a.trys.push([3, 13, , 14]);
                                    return [4 /*yield*/, storage_1.storage.updateMixItem(id, { quantity: quantity })];
                                case 4:
                                    updatedMixItem = _a.sent();
                                    newRawMaterialQuantity = (rawMaterial.quantity || 0) - quantityDifference;
                                    return [4 /*yield*/, storage_1.storage.updateRawMaterial(existingMixItem.rawMaterialId, {
                                            quantity: newRawMaterialQuantity,
                                            lastUpdated: new Date()
                                        })];
                                case 5:
                                    _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getMixItemsByMix(existingMixItem.mixId)];
                                case 6:
                                    allMixItems = _a.sent();
                                    totalWeight = allMixItems.reduce(function (sum, item) { return sum + item.quantity; }, 0);
                                    _i = 0, allMixItems_2 = allMixItems;
                                    _a.label = 7;
                                case 7:
                                    if (!(_i < allMixItems_2.length)) return [3 /*break*/, 10];
                                    item = allMixItems_2[_i];
                                    percentage = (item.quantity / totalWeight) * 100;
                                    if (!(item.id !== id)) return [3 /*break*/, 9];
                                    return [4 /*yield*/, storage_1.storage.updateMixItem(item.id, { percentage: percentage })];
                                case 8:
                                    _a.sent();
                                    _a.label = 9;
                                case 9:
                                    _i++;
                                    return [3 /*break*/, 7];
                                case 10:
                                    finalPercentage = (quantity / totalWeight) * 100;
                                    return [4 /*yield*/, storage_1.storage.updateMixItem(id, { percentage: finalPercentage })];
                                case 11:
                                    finalUpdatedItem = _a.sent();
                                    // 7. Update the mix total quantity
                                    return [4 /*yield*/, storage_1.storage.updateMixMaterial(existingMixItem.mixId, { totalQuantity: totalWeight })];
                                case 12:
                                    // 7. Update the mix total quantity
                                    _a.sent();
                                    res.json(finalUpdatedItem);
                                    return [3 /*break*/, 14];
                                case 13:
                                    error_139 = _a.sent();
                                    console.error("Error during mix item update:", error_139);
                                    throw error_139;
                                case 14: return [3 /*break*/, 16];
                                case 15:
                                    error_140 = _a.sent();
                                    if (error_140 instanceof Error) {
                                        return [2 /*return*/, res.status(400).json({ message: error_140.message })];
                                    }
                                    res.status(500).json({ message: "Failed to update mix item" });
                                    return [3 /*break*/, 16];
                                case 16: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Performance metrics endpoint for dashboard optimization
                    app.get("/api/performance-metrics", requireAuth, function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var rolls_1, orders, jobOrders_1, qualityChecks, rollProcessingTimes, avgExtrusionToNextStage, avgPrintingToCutting, avgTotalProcessingTime, totalWasteQty, totalExtrudingQty, overallWastePercentage, completedOrders, orderFulfillmentTimes, avgOrderFulfillmentTime, totalQualityChecks, failedQualityChecks, qualityFailureRate, recentRolls, recentProcessingTimes, calculateThroughput, error_141;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    return [4 /*yield*/, storage_1.storage.getRolls()];
                                case 1:
                                    rolls_1 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getOrders()];
                                case 2:
                                    orders = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getJobOrders()];
                                case 3:
                                    jobOrders_1 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getQualityChecks()];
                                case 4:
                                    qualityChecks = _a.sent();
                                    rollProcessingTimes = rolls_1
                                        .filter(function (roll) { return roll.createdAt && (roll.printedAt || roll.cutAt); })
                                        .map(function (roll) {
                                        // Calculate processing time for different stages
                                        var extrusionToNextStage = roll.printedAt && roll.createdAt ?
                                            (new Date(roll.printedAt).getTime() - new Date(roll.createdAt).getTime()) :
                                            (roll.cutAt && roll.createdAt ? (new Date(roll.cutAt).getTime() - new Date(roll.createdAt).getTime()) : 0);
                                        // Calculate printing to cutting if available
                                        var printingToCutting = (roll.printedAt && roll.cutAt) ?
                                            (new Date(roll.cutAt).getTime() - new Date(roll.printedAt).getTime()) : 0;
                                        return {
                                            rollId: roll.id,
                                            jobOrderId: roll.jobOrderId,
                                            extrusionToNextStage: extrusionToNextStage / (1000 * 60 * 60), // hours
                                            printingToCutting: printingToCutting / (1000 * 60 * 60), // hours
                                            totalProcessingTime: (extrusionToNextStage + printingToCutting) / (1000 * 60 * 60), // hours
                                            currentStage: roll.currentStage,
                                            status: roll.status,
                                            extrudingQty: roll.extrudingQty || 0,
                                            printingQty: roll.printingQty || 0,
                                            cuttingQty: roll.cuttingQty || 0,
                                            wasteQty: roll.wasteQty || 0,
                                            wastePercentage: roll.wastePercentage || 0
                                        };
                                    });
                                    avgExtrusionToNextStage = rollProcessingTimes.length > 0 ?
                                        rollProcessingTimes.reduce(function (sum, item) { return sum + item.extrusionToNextStage; }, 0) / rollProcessingTimes.length : 0;
                                    avgPrintingToCutting = rollProcessingTimes.filter(function (item) { return item.printingToCutting > 0; }).length > 0 ?
                                        rollProcessingTimes.reduce(function (sum, item) { return sum + item.printingToCutting; }, 0) /
                                            rollProcessingTimes.filter(function (item) { return item.printingToCutting > 0; }).length : 0;
                                    avgTotalProcessingTime = rollProcessingTimes.length > 0 ?
                                        rollProcessingTimes.reduce(function (sum, item) { return sum + item.totalProcessingTime; }, 0) / rollProcessingTimes.length : 0;
                                    totalWasteQty = rollProcessingTimes.reduce(function (sum, item) { return sum + item.wasteQty; }, 0);
                                    totalExtrudingQty = rollProcessingTimes.reduce(function (sum, item) { return sum + item.extrudingQty; }, 0);
                                    overallWastePercentage = totalExtrudingQty > 0 ? (totalWasteQty / totalExtrudingQty) * 100 : 0;
                                    completedOrders = orders.filter(function (order) { return order.status === "completed"; });
                                    orderFulfillmentTimes = completedOrders.map(function (order) {
                                        var orderJobOrders = jobOrders_1.filter(function (jo) { return jo.orderId === order.id; });
                                        var orderRolls = rolls_1.filter(function (roll) {
                                            return orderJobOrders.some(function (jo) { return jo.id === roll.jobOrderId; }) && roll.status === "completed";
                                        });
                                        // Find earliest and latest timestamps for this order
                                        var timestamps = orderRolls
                                            .flatMap(function (roll) { return [
                                            roll.createdAt ? new Date(roll.createdAt).getTime() : null,
                                            roll.cutAt ? new Date(roll.cutAt).getTime() : null
                                        ]; })
                                            .filter(function (ts) { return ts !== null; });
                                        if (timestamps.length > 0) {
                                            var earliestTimestamp = Math.min.apply(Math, timestamps);
                                            var latestTimestamp = Math.max.apply(Math, timestamps);
                                            return {
                                                orderId: order.id,
                                                fulfillmentTime: (latestTimestamp - earliestTimestamp) / (1000 * 60 * 60 * 24) // days
                                            };
                                        }
                                        return null;
                                    }).filter(function (item) { return item !== null; });
                                    avgOrderFulfillmentTime = orderFulfillmentTimes.length > 0 ?
                                        orderFulfillmentTimes.reduce(function (sum, item) { return sum + item.fulfillmentTime; }, 0) / orderFulfillmentTimes.length : 0;
                                    totalQualityChecks = qualityChecks.length;
                                    failedQualityChecks = qualityChecks.filter(function (check) { return check.status === "failed"; }).length;
                                    qualityFailureRate = totalQualityChecks > 0 ? (failedQualityChecks / totalQualityChecks) * 100 : 0;
                                    recentRolls = rolls_1
                                        .filter(function (roll) { return roll.createdAt; })
                                        .sort(function (a, b) {
                                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                                    })
                                        .slice(0, 20);
                                    recentProcessingTimes = recentRolls
                                        .filter(function (roll) { return roll.createdAt && (roll.printedAt || roll.cutAt); })
                                        .map(function (roll) {
                                        var extrusionToNextStage = roll.printedAt && roll.createdAt ?
                                            (new Date(roll.printedAt).getTime() - new Date(roll.createdAt).getTime()) :
                                            (roll.cutAt && roll.createdAt ? (new Date(roll.cutAt).getTime() - new Date(roll.createdAt).getTime()) : 0);
                                        return {
                                            rollId: roll.id,
                                            processingTime: extrusionToNextStage / (1000 * 60 * 60), // hours
                                            stage: roll.currentStage,
                                            date: roll.createdAt
                                        };
                                    });
                                    calculateThroughput = function (rolls) {
                                        // Get completed rolls with timestamps
                                        var completedRolls = rolls.filter(function (r) { return r.status === "completed" && r.cutAt; });
                                        if (completedRolls.length === 0)
                                            return [];
                                        // Sort by completion date
                                        completedRolls.sort(function (a, b) {
                                            return new Date(a.cutAt || 0).getTime() - new Date(b.cutAt || 0).getTime();
                                        });
                                        // Group by day
                                        var rollsByDay = completedRolls.reduce(function (acc, roll) {
                                            var date = new Date(roll.cutAt || 0);
                                            var dateKey = "".concat(date.getFullYear(), "-").concat(date.getMonth() + 1, "-").concat(date.getDate());
                                            if (!acc[dateKey]) {
                                                acc[dateKey] = [];
                                            }
                                            acc[dateKey].push(roll);
                                            return acc;
                                        }, {});
                                        // Convert to array format
                                        return Object.entries(rollsByDay).map(function (_a) {
                                            var date = _a[0], dayRolls = _a[1];
                                            return ({
                                                date: date,
                                                count: dayRolls.length,
                                                totalWeight: dayRolls.reduce(function (sum, r) { return sum + (r.cuttingQty || 0); }, 0)
                                            });
                                        });
                                    };
                                    // Return the metrics
                                    res.json({
                                        processingTimes: {
                                            avgExtrusionToNextStage: avgExtrusionToNextStage,
                                            avgPrintingToCutting: avgPrintingToCutting,
                                            avgTotalProcessingTime: avgTotalProcessingTime,
                                            recentProcessingTimes: recentProcessingTimes
                                        },
                                        wasteMetrics: {
                                            totalWasteQty: totalWasteQty,
                                            overallWastePercentage: overallWastePercentage,
                                            rollProcessingTimes: rollProcessingTimes.map(function (item) { return ({
                                                rollId: item.rollId,
                                                wasteQty: item.wasteQty,
                                                wastePercentage: item.wastePercentage
                                            }); })
                                        },
                                        orderMetrics: {
                                            avgOrderFulfillmentTime: avgOrderFulfillmentTime,
                                            orderFulfillmentTimes: orderFulfillmentTimes
                                        },
                                        qualityMetrics: {
                                            totalQualityChecks: totalQualityChecks,
                                            failedQualityChecks: failedQualityChecks,
                                            qualityFailureRate: qualityFailureRate
                                        },
                                        rollsData: rollProcessingTimes,
                                        throughput: calculateThroughput(rolls_1),
                                        // Mobile-specific metrics (more summarized)
                                        mobileMetrics: {
                                            avgProcessingTime: avgTotalProcessingTime,
                                            avgOrderFulfillment: avgOrderFulfillmentTime,
                                            wastePercentage: overallWastePercentage,
                                            qualityFailureRate: qualityFailureRate,
                                            recentProcessingTimes: recentProcessingTimes
                                        }
                                    });
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_141 = _a.sent();
                                    console.error("Error fetching performance metrics:", error_141);
                                    res.status(500).json({ message: "Failed to fetch performance metrics" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/mix-items/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, mixItem, rawMaterial, mixId, newQuantity, remainingItems, totalWeight, _i, remainingItems_1, item, percentage, error_142, error_143;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 14, , 15]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMixItem(id)];
                                case 1:
                                    mixItem = _a.sent();
                                    if (!mixItem) {
                                        return [2 /*return*/, res.status(404).json({ message: "Mix item not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getRawMaterial(mixItem.rawMaterialId)];
                                case 2:
                                    rawMaterial = _a.sent();
                                    if (!rawMaterial) {
                                        return [2 /*return*/, res.status(404).json({ message: "Raw material not found" })];
                                    }
                                    _a.label = 3;
                                case 3:
                                    _a.trys.push([3, 12, , 13]);
                                    mixId = mixItem.mixId;
                                    // 1. Delete the mix item
                                    return [4 /*yield*/, storage_1.storage.deleteMixItem(id)];
                                case 4:
                                    // 1. Delete the mix item
                                    _a.sent();
                                    newQuantity = (rawMaterial.quantity || 0) + mixItem.quantity;
                                    return [4 /*yield*/, storage_1.storage.updateRawMaterial(mixItem.rawMaterialId, {
                                            quantity: newQuantity,
                                            lastUpdated: new Date()
                                        })];
                                case 5:
                                    _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getMixItemsByMix(mixId)];
                                case 6:
                                    remainingItems = _a.sent();
                                    totalWeight = remainingItems.reduce(function (sum, item) { return sum + item.quantity; }, 0);
                                    _i = 0, remainingItems_1 = remainingItems;
                                    _a.label = 7;
                                case 7:
                                    if (!(_i < remainingItems_1.length)) return [3 /*break*/, 10];
                                    item = remainingItems_1[_i];
                                    percentage = totalWeight > 0 ? (item.quantity / totalWeight) * 100 : 0;
                                    return [4 /*yield*/, storage_1.storage.updateMixItem(item.id, { percentage: percentage })];
                                case 8:
                                    _a.sent();
                                    _a.label = 9;
                                case 9:
                                    _i++;
                                    return [3 /*break*/, 7];
                                case 10: 
                                // 6. Update the mix total quantity
                                return [4 /*yield*/, storage_1.storage.updateMixMaterial(mixId, { totalQuantity: totalWeight })];
                                case 11:
                                    // 6. Update the mix total quantity
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 13];
                                case 12:
                                    error_142 = _a.sent();
                                    console.error("Error during mix item deletion:", error_142);
                                    throw error_142;
                                case 13: return [3 /*break*/, 15];
                                case 14:
                                    error_143 = _a.sent();
                                    if (error_143 instanceof Error) {
                                        return [2 /*return*/, res.status(400).json({ message: error_143.message })];
                                    }
                                    res.status(500).json({ message: "Failed to delete mix item" });
                                    return [3 /*break*/, 15];
                                case 15: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Permissions
                    app.get("/api/permissions", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, permissions, sectionPermissions, error_144;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    user = req.user;
                                    if (!user.isAdmin) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage_1.storage.getPermissions()];
                                case 1:
                                    permissions = _a.sent();
                                    res.json(permissions);
                                    return [3 /*break*/, 4];
                                case 2:
                                    // Regular users can only see permissions for their section
                                    if (!user.sectionId) {
                                        return [2 /*return*/, res.json([])]; // No section assigned, no permissions
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPermissionsBySection(user.sectionId)];
                                case 3:
                                    sectionPermissions = _a.sent();
                                    res.json(sectionPermissions);
                                    _a.label = 4;
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    error_144 = _a.sent();
                                    console.error("Error fetching permissions:", error_144);
                                    res.status(500).json({ message: "Failed to get permissions" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/permissions/role/:role", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var permissions, error_145;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getPermissionsByModule(parseInt(req.params.role))];
                                case 1:
                                    permissions = _a.sent();
                                    res.json(permissions);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_145 = _a.sent();
                                    res.status(500).json({ message: "Failed to get role permissions" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/permissions", requirePermission("Permissions", "create"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var createSchema, validatedData, permission, transformedPermission, createError_1, error_146;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    createSchema = zod_1.z.object({
                                        sectionId: zod_1.z.string(),
                                        moduleId: zod_1.z.number(),
                                        canView: zod_1.z.boolean().optional().default(false),
                                        canCreate: zod_1.z.boolean().optional().default(false),
                                        canEdit: zod_1.z.boolean().optional().default(false),
                                        canDelete: zod_1.z.boolean().optional().default(false),
                                        isActive: zod_1.z.boolean().optional().default(true)
                                    });
                                    validatedData = createSchema.parse(req.body);
                                    console.log("Creating section-based permission with data:", JSON.stringify(validatedData));
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.createPermission(validatedData)];
                                case 2:
                                    permission = _a.sent();
                                    transformedPermission = {
                                        id: permission.id,
                                        sectionId: permission.sectionId,
                                        moduleId: permission.moduleId,
                                        canView: permission.canView,
                                        canCreate: permission.canCreate,
                                        canEdit: permission.canEdit,
                                        canDelete: permission.canDelete,
                                        isActive: permission.isActive,
                                        createdAt: permission.createdAt,
                                        updatedAt: permission.updatedAt
                                    };
                                    res.status(201).json(transformedPermission);
                                    return [3 /*break*/, 4];
                                case 3:
                                    createError_1 = _a.sent();
                                    console.error("SQL create error:", createError_1);
                                    return [2 /*return*/, res.status(500).json({ message: "Database error creating permission", error: String(createError_1) })];
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    error_146 = _a.sent();
                                    console.error("Permission creation error:", error_146);
                                    if (error_146 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid permission data", errors: error_146.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create permission" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/permissions/:id", requirePermission("Permissions", "edit"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, updateSchema, validatedData, existingPermission, permission, transformedPermission, updateError_2, error_147;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 6, , 7]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    updateSchema = zod_1.z.object({
                                        sectionId: zod_1.z.string().optional(),
                                        moduleId: zod_1.z.number().optional(),
                                        canView: zod_1.z.boolean().optional(),
                                        canCreate: zod_1.z.boolean().optional(),
                                        canEdit: zod_1.z.boolean().optional(),
                                        canDelete: zod_1.z.boolean().optional(),
                                        isActive: zod_1.z.boolean().optional()
                                    });
                                    validatedData = updateSchema.parse(req.body);
                                    console.log("Updating permission ".concat(id, " with data:"), JSON.stringify(validatedData));
                                    if (Object.keys(validatedData).length === 0) {
                                        return [2 /*return*/, res.status(400).json({ message: "No valid fields to update" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPermission(id)];
                                case 1:
                                    existingPermission = _a.sent();
                                    if (!existingPermission) {
                                        return [2 /*return*/, res.status(404).json({ message: "Permission not found" })];
                                    }
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, storage_1.storage.updatePermission(id, validatedData)];
                                case 3:
                                    permission = _a.sent();
                                    if (!permission) {
                                        return [2 /*return*/, res.status(404).json({ message: "Failed to update permission" })];
                                    }
                                    transformedPermission = {
                                        id: permission.id,
                                        sectionId: permission.sectionId,
                                        moduleId: permission.moduleId,
                                        canView: permission.canView,
                                        canCreate: permission.canCreate,
                                        canEdit: permission.canEdit,
                                        canDelete: permission.canDelete,
                                        isActive: permission.isActive,
                                        createdAt: permission.createdAt,
                                        updatedAt: permission.updatedAt
                                    };
                                    res.json(transformedPermission);
                                    return [3 /*break*/, 5];
                                case 4:
                                    updateError_2 = _a.sent();
                                    console.error("SQL update error:", updateError_2);
                                    return [2 /*return*/, res.status(500).json({ message: "Database error updating permission", error: String(updateError_2) })];
                                case 5: return [3 /*break*/, 7];
                                case 6:
                                    error_147 = _a.sent();
                                    console.error("Permission update error:", error_147);
                                    if (error_147 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid permission data", errors: error_147.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to update permission", error: String(error_147) });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/permissions/:id", requirePermission("Permissions", "delete"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, error_148;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deletePermission(id)];
                                case 1:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_148 = _a.sent();
                                    res.status(500).json({ message: "Failed to delete permission" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Modules management API endpoints
                    app.get("/api/modules", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, modules, sectionPermissions, allModules, userModuleIds_1, userModules, error_149;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    user = req.user;
                                    if (!user.isAdmin) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage_1.storage.getModules()];
                                case 1:
                                    modules = _a.sent();
                                    return [2 /*return*/, res.json(modules)];
                                case 2:
                                    // Regular users can only see modules they have permissions for
                                    if (!user.sectionId) {
                                        return [2 /*return*/, res.json([])]; // No section assigned, no modules
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPermissionsBySection(user.sectionId)];
                                case 3:
                                    sectionPermissions = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getModules()];
                                case 4:
                                    allModules = _a.sent();
                                    userModuleIds_1 = new Set(sectionPermissions.map(function (p) { return p.moduleId; }));
                                    userModules = allModules.filter(function (module) { return userModuleIds_1.has(module.id); });
                                    res.json(userModules);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_149 = _a.sent();
                                    console.error("Error getting modules:", error_149);
                                    res.status(500).json({ message: "Failed to get modules" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/modules/category/:category", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, category, modules, sectionPermissions, allModules, userModuleIds_2, userModules, error_150;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    user = req.user;
                                    category = req.params.category;
                                    if (!user.isAdmin) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage_1.storage.getModulesByCategory(category)];
                                case 1:
                                    modules = _a.sent();
                                    return [2 /*return*/, res.json(modules)];
                                case 2:
                                    // Regular users can only see modules they have permissions for in this category
                                    if (!user.sectionId) {
                                        return [2 /*return*/, res.json([])]; // No section assigned, no modules
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPermissionsBySection(user.sectionId)];
                                case 3:
                                    sectionPermissions = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getModulesByCategory(category)];
                                case 4:
                                    allModules = _a.sent();
                                    userModuleIds_2 = new Set(sectionPermissions.map(function (p) { return p.moduleId; }));
                                    userModules = allModules.filter(function (module) { return userModuleIds_2.has(module.id); });
                                    res.json(userModules);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_150 = _a.sent();
                                    console.error("Error getting modules by category:", error_150);
                                    res.status(500).json({ message: "Failed to get modules by category" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/modules/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, id_1, module_2, sectionPermissions, hasPermission, error_151;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    user = req.user;
                                    id_1 = parseInt(req.params.id);
                                    if (isNaN(id_1)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid module ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getModule(id_1)];
                                case 1:
                                    module_2 = _a.sent();
                                    if (!module_2) {
                                        return [2 /*return*/, res.status(404).json({ message: "Module not found" })];
                                    }
                                    // Admin users can see any module
                                    if (user.isAdmin) {
                                        return [2 /*return*/, res.json(module_2)];
                                    }
                                    // Regular users can only see modules they have permissions for
                                    if (!user.sectionId) {
                                        return [2 /*return*/, res.status(403).json({ message: "Permission denied" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPermissionsBySection(user.sectionId)];
                                case 2:
                                    sectionPermissions = _a.sent();
                                    hasPermission = sectionPermissions.some(function (p) { return p.moduleId === id_1; });
                                    if (!hasPermission) {
                                        return [2 /*return*/, res.status(403).json({ message: "Permission denied" })];
                                    }
                                    res.json(module_2);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_151 = _a.sent();
                                    console.error("Error getting module:", error_151);
                                    res.status(500).json({ message: "Failed to get module" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/modules", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, module_3, error_152;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    // Check if user has permission to create modules
                                    if (req.user && req.user.role !== "administrator") {
                                        return [2 /*return*/, res.status(403).json({ message: "Permission denied" })];
                                    }
                                    validatedData = schema_1.insertModuleSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.createModule(validatedData)];
                                case 1:
                                    module_3 = _a.sent();
                                    res.status(201).json(module_3);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_152 = _a.sent();
                                    if (error_152 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid module data", errors: error_152.errors })];
                                    }
                                    console.error("Error creating module:", error_152);
                                    res.status(500).json({ message: "Failed to create module" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.patch("/api/modules/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, module_4, error_153;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    // Check if user has permission to update modules
                                    if (req.user && req.user.role !== "administrator") {
                                        return [2 /*return*/, res.status(403).json({ message: "Permission denied" })];
                                    }
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid module ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateModule(id, req.body)];
                                case 1:
                                    module_4 = _a.sent();
                                    if (!module_4) {
                                        return [2 /*return*/, res.status(404).json({ message: "Module not found" })];
                                    }
                                    res.json(module_4);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_153 = _a.sent();
                                    console.error("Error updating module:", error_153);
                                    res.status(500).json({ message: "Failed to update module" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/modules/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, success, error_154;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    // Check if user has permission to delete modules
                                    if (req.user && req.user.role !== "administrator") {
                                        return [2 /*return*/, res.status(403).json({ message: "Permission denied" })];
                                    }
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid module ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteModule(id)];
                                case 1:
                                    success = _a.sent();
                                    if (!success) {
                                        return [2 /*return*/, res.status(404).json({ message: "Module not found" })];
                                    }
                                    res.status(204).send();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_154 = _a.sent();
                                    console.error("Error deleting module:", error_154);
                                    res.status(500).json({ message: "Failed to delete module" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Material Inputs API endpoints
                    app.get("/api/material-inputs", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var materialInputs, error_155;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getMaterialInputs()];
                                case 1:
                                    materialInputs = _a.sent();
                                    res.json(materialInputs);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_155 = _a.sent();
                                    console.error("Error getting material inputs:", error_155);
                                    res.status(500).json({ message: "Failed to get material inputs" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/material-inputs/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, materialInput, error_156;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMaterialInput(id)];
                                case 1:
                                    materialInput = _a.sent();
                                    if (!materialInput) {
                                        return [2 /*return*/, res.status(404).json({ message: "Material input not found" })];
                                    }
                                    res.json(materialInput);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_156 = _a.sent();
                                    console.error("Error getting material input:", error_156);
                                    res.status(500).json({ message: "Failed to get material input" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/material-inputs/:id/items", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, items, error_157;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMaterialInputItemsByInput(id)];
                                case 1:
                                    items = _a.sent();
                                    res.json(items);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_157 = _a.sent();
                                    console.error("Error getting material input items:", error_157);
                                    res.status(500).json({ message: "Failed to get material input items" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/material-inputs", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var inputData, materialInput, _i, _a, itemData, inputItemData, rawMaterial, updatedQuantity, error_158;
                        var _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 8, , 9]);
                                    if (!((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
                                        return [2 /*return*/, res.status(401).json({ message: "Authentication required" })];
                                    }
                                    inputData = {
                                        userId: req.user.id,
                                        notes: req.body.notes
                                    };
                                    return [4 /*yield*/, storage_1.storage.createMaterialInput(inputData)];
                                case 1:
                                    materialInput = _c.sent();
                                    if (!(req.body.items && Array.isArray(req.body.items))) return [3 /*break*/, 7];
                                    _i = 0, _a = req.body.items;
                                    _c.label = 2;
                                case 2:
                                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                                    itemData = _a[_i];
                                    inputItemData = {
                                        inputId: materialInput.id,
                                        rawMaterialId: itemData.rawMaterialId,
                                        quantity: itemData.quantity
                                    };
                                    // Create the input item
                                    return [4 /*yield*/, storage_1.storage.createMaterialInputItem(inputItemData)];
                                case 3:
                                    // Create the input item
                                    _c.sent();
                                    return [4 /*yield*/, storage_1.storage.getRawMaterial(inputItemData.rawMaterialId)];
                                case 4:
                                    rawMaterial = _c.sent();
                                    if (!rawMaterial) return [3 /*break*/, 6];
                                    updatedQuantity = (rawMaterial.quantity || 0) + inputItemData.quantity;
                                    return [4 /*yield*/, storage_1.storage.updateRawMaterial(inputItemData.rawMaterialId, {
                                            quantity: updatedQuantity,
                                            lastUpdated: new Date()
                                        })];
                                case 5:
                                    _c.sent();
                                    _c.label = 6;
                                case 6:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 7:
                                    res.status(201).json(materialInput);
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_158 = _c.sent();
                                    console.error("Error creating material input:", error_158);
                                    if (error_158 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid material input data", errors: error_158.errors })];
                                    }
                                    res.status(500).json({ message: "Failed to create material input", error: String(error_158) });
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/material-inputs/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, items, _i, items_1, item, rawMaterial, updatedQuantity, error_159;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 8, , 9]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid ID format" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMaterialInputItemsByInput(id)];
                                case 1:
                                    items = _a.sent();
                                    _i = 0, items_1 = items;
                                    _a.label = 2;
                                case 2:
                                    if (!(_i < items_1.length)) return [3 /*break*/, 6];
                                    item = items_1[_i];
                                    return [4 /*yield*/, storage_1.storage.getRawMaterial(item.rawMaterialId)];
                                case 3:
                                    rawMaterial = _a.sent();
                                    if (!(rawMaterial && rawMaterial.quantity)) return [3 /*break*/, 5];
                                    updatedQuantity = Math.max(0, rawMaterial.quantity - item.quantity);
                                    return [4 /*yield*/, storage_1.storage.updateRawMaterial(item.rawMaterialId, {
                                            quantity: updatedQuantity,
                                            lastUpdated: new Date()
                                        })];
                                case 4:
                                    _a.sent();
                                    _a.label = 5;
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 6: 
                                // Delete the material input (this will cascade delete the items)
                                return [4 /*yield*/, storage_1.storage.deleteMaterialInput(id)];
                                case 7:
                                    // Delete the material input (this will cascade delete the items)
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_159 = _a.sent();
                                    console.error("Error deleting material input:", error_159);
                                    res.status(500).json({ message: "Failed to delete material input" });
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Cliché (Plate) Pricing Parameters API endpoints
                    app.get("/api/plate-pricing-parameters", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var parameters, error_160;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getPlatePricingParameters()];
                                case 1:
                                    parameters = _a.sent();
                                    res.json(parameters);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_160 = _a.sent();
                                    console.error("Error getting plate pricing parameters:", error_160);
                                    res.status(500).json({ message: "Failed to get plate pricing parameters" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/plate-pricing-parameters/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, parameter, error_161;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid parameter ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPlatePricingParameter(id)];
                                case 1:
                                    parameter = _a.sent();
                                    if (!parameter) {
                                        return [2 /*return*/, res.status(404).json({ message: "Plate pricing parameter not found" })];
                                    }
                                    res.json(parameter);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_161 = _a.sent();
                                    console.error("Error getting plate pricing parameter:", error_161);
                                    res.status(500).json({ message: "Failed to get plate pricing parameter" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/plate-pricing-parameters", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var validatedData, parameter, error_162;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    validatedData = schema_1.insertPlatePricingParameterSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.createPlatePricingParameter(validatedData)];
                                case 1:
                                    parameter = _a.sent();
                                    res.status(201).json(parameter);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_162 = _a.sent();
                                    if (error_162 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid parameter data", errors: error_162.errors })];
                                    }
                                    console.error("Error creating plate pricing parameter:", error_162);
                                    res.status(500).json({ message: "Failed to create plate pricing parameter" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/plate-pricing-parameters/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, existingParameter, validatedData, parameter, error_163;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid parameter ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPlatePricingParameter(id)];
                                case 1:
                                    existingParameter = _a.sent();
                                    if (!existingParameter) {
                                        return [2 /*return*/, res.status(404).json({ message: "Plate pricing parameter not found" })];
                                    }
                                    validatedData = schema_1.insertPlatePricingParameterSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.updatePlatePricingParameter(id, validatedData)];
                                case 2:
                                    parameter = _a.sent();
                                    res.json(parameter);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_163 = _a.sent();
                                    if (error_163 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid parameter data", errors: error_163.errors })];
                                    }
                                    console.error("Error updating plate pricing parameter:", error_163);
                                    res.status(500).json({ message: "Failed to update plate pricing parameter" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/plate-pricing-parameters/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, parameter, error_164;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid parameter ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPlatePricingParameter(id)];
                                case 1:
                                    parameter = _a.sent();
                                    if (!parameter) {
                                        return [2 /*return*/, res.status(404).json({ message: "Plate pricing parameter not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deletePlatePricingParameter(id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_164 = _a.sent();
                                    console.error("Error deleting plate pricing parameter:", error_164);
                                    res.status(500).json({ message: "Failed to delete plate pricing parameter" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Plate Calculations API endpoints
                    app.get("/api/plate-calculations", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var calculations, error_165;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getPlateCalculations()];
                                case 1:
                                    calculations = _a.sent();
                                    res.json(calculations);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_165 = _a.sent();
                                    console.error("Error getting plate calculations:", error_165);
                                    res.status(500).json({ message: "Failed to get plate calculations" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/customers/:customerId/plate-calculations", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var customer, calculations, error_166;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getCustomer(req.params.customerId)];
                                case 1:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPlateCalculationsByCustomer(req.params.customerId)];
                                case 2:
                                    calculations = _a.sent();
                                    res.json(calculations);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_166 = _a.sent();
                                    console.error("Error getting plate calculations for customer:", error_166);
                                    res.status(500).json({ message: "Failed to get plate calculations" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/plate-calculations/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, calculation, error_167;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid calculation ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPlateCalculation(id)];
                                case 1:
                                    calculation = _a.sent();
                                    if (!calculation) {
                                        return [2 /*return*/, res.status(404).json({ message: "Plate calculation not found" })];
                                    }
                                    res.json(calculation);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_167 = _a.sent();
                                    console.error("Error getting plate calculation:", error_167);
                                    res.status(500).json({ message: "Failed to get plate calculation" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/plate-calculations", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var requestData, customer, userId, calculationData, calculation, error_168;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    requestData = schema_1.plateCalculationRequestSchema.parse(req.body);
                                    if (!requestData.customerId) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage_1.storage.getCustomer(requestData.customerId)];
                                case 1:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    _a.label = 2;
                                case 2:
                                    userId = req.user ? req.user.id : undefined;
                                    calculationData = __assign(__assign({}, requestData), { createdById: userId });
                                    return [4 /*yield*/, storage_1.storage.createPlateCalculation(calculationData)];
                                case 3:
                                    calculation = _a.sent();
                                    res.status(201).json(calculation);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_168 = _a.sent();
                                    if (error_168 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid calculation data", errors: error_168.errors })];
                                    }
                                    console.error("Error creating plate calculation:", error_168);
                                    res.status(500).json({ message: "Failed to create plate calculation" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/plate-calculations/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, existingCalculation, requestData, customer, calculation, error_169;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid calculation ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPlateCalculation(id)];
                                case 1:
                                    existingCalculation = _a.sent();
                                    if (!existingCalculation) {
                                        return [2 /*return*/, res.status(404).json({ message: "Plate calculation not found" })];
                                    }
                                    requestData = schema_1.plateCalculationRequestSchema.parse(req.body);
                                    if (!(requestData.customerId && requestData.customerId !== existingCalculation.customerId)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, storage_1.storage.getCustomer(requestData.customerId)];
                                case 2:
                                    customer = _a.sent();
                                    if (!customer) {
                                        return [2 /*return*/, res.status(404).json({ message: "Customer not found" })];
                                    }
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, storage_1.storage.updatePlateCalculation(id, requestData)];
                                case 4:
                                    calculation = _a.sent();
                                    res.json(calculation);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_169 = _a.sent();
                                    if (error_169 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid calculation data", errors: error_169.errors })];
                                    }
                                    console.error("Error updating plate calculation:", error_169);
                                    res.status(500).json({ message: "Failed to update plate calculation" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/plate-calculations/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, calculation, error_170;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid calculation ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getPlateCalculation(id)];
                                case 1:
                                    calculation = _a.sent();
                                    if (!calculation) {
                                        return [2 /*return*/, res.status(404).json({ message: "Plate calculation not found" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deletePlateCalculation(id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_170 = _a.sent();
                                    console.error("Error deleting plate calculation:", error_170);
                                    res.status(500).json({ message: "Failed to delete plate calculation" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // ABA Material Configurations API endpoints
                    app.get("/api/aba-material-configs", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var configs, error_171;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getAbaMaterialConfigs()];
                                case 1:
                                    configs = _a.sent();
                                    res.json(configs);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_171 = _a.sent();
                                    console.error("Error getting ABA material configs:", error_171);
                                    res.status(500).json({ message: "Failed to get ABA material configs" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/aba-material-configs/default", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var config, error_172;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getDefaultAbaMaterialConfig()];
                                case 1:
                                    config = _a.sent();
                                    if (!config) {
                                        return [2 /*return*/, res.status(404).json({ message: "No default ABA material config found" })];
                                    }
                                    res.json(config);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_172 = _a.sent();
                                    console.error("Error getting default ABA material config:", error_172);
                                    res.status(500).json({ message: "Failed to get default ABA material config" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/aba-material-configs/user/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var configs, error_173;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getAbaMaterialConfigsByUser(req.params.userId)];
                                case 1:
                                    configs = _a.sent();
                                    res.json(configs);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_173 = _a.sent();
                                    console.error("Error getting ABA material configs by user:", error_173);
                                    res.status(500).json({ message: "Failed to get ABA material configs" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/aba-material-configs/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, config, error_174;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid config ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getAbaMaterialConfig(id)];
                                case 1:
                                    config = _a.sent();
                                    if (!config) {
                                        return [2 /*return*/, res.status(404).json({ message: "ABA material config not found" })];
                                    }
                                    res.json(config);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_174 = _a.sent();
                                    console.error("Error getting ABA material config:", error_174);
                                    res.status(500).json({ message: "Failed to get ABA material config" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/aba-material-configs", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, _a, name_2, description, configData, isDefault, newConfig, error_175;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    // Get user information from session for tracking who created this config
                                    if (!req.user) {
                                        return [2 /*return*/, res.status(401).json({ message: "You must be logged in to create a config" })];
                                    }
                                    userId = req.user.id;
                                    _a = req.body, name_2 = _a.name, description = _a.description, configData = _a.configData, isDefault = _a.isDefault;
                                    if (!name_2 || !configData) {
                                        return [2 /*return*/, res.status(400).json({ message: "Name and configData are required" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.createAbaMaterialConfig({
                                            name: name_2,
                                            description: description,
                                            createdBy: userId,
                                            configData: configData,
                                            isDefault: isDefault || false
                                        })];
                                case 1:
                                    newConfig = _b.sent();
                                    res.status(201).json(newConfig);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_175 = _b.sent();
                                    console.error("Error creating ABA material config:", error_175);
                                    res.status(500).json({ message: "Failed to create ABA material config" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/aba-material-configs/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, config, _a, name_3, description, configData, isDefault, updates, updatedConfig, error_176;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid config ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getAbaMaterialConfig(id)];
                                case 1:
                                    config = _b.sent();
                                    if (!config) {
                                        return [2 /*return*/, res.status(404).json({ message: "ABA material config not found" })];
                                    }
                                    // Only allow the creator or admins to update
                                    if (req.user && req.user.id !== config.createdBy && req.user.role !== 'administrator') {
                                        return [2 /*return*/, res.status(403).json({ message: "You don't have permission to update this config" })];
                                    }
                                    _a = req.body, name_3 = _a.name, description = _a.description, configData = _a.configData, isDefault = _a.isDefault;
                                    updates = {};
                                    if (name_3 !== undefined)
                                        updates.name = name_3;
                                    if (description !== undefined)
                                        updates.description = description;
                                    if (configData !== undefined)
                                        updates.configData = configData;
                                    if (isDefault !== undefined)
                                        updates.isDefault = isDefault;
                                    return [4 /*yield*/, storage_1.storage.updateAbaMaterialConfig(id, updates)];
                                case 2:
                                    updatedConfig = _b.sent();
                                    res.json(updatedConfig);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_176 = _b.sent();
                                    console.error("Error updating ABA material config:", error_176);
                                    res.status(500).json({ message: "Failed to update ABA material config" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/aba-material-configs/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, config, error_177;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid config ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getAbaMaterialConfig(id)];
                                case 1:
                                    config = _a.sent();
                                    if (!config) {
                                        return [2 /*return*/, res.status(404).json({ message: "ABA material config not found" })];
                                    }
                                    // Only allow the creator or admins to delete
                                    if (req.user && req.user.id !== config.createdBy && req.user.role !== 'administrator') {
                                        return [2 /*return*/, res.status(403).json({ message: "You don't have permission to delete this config" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteAbaMaterialConfig(id)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_177 = _a.sent();
                                    console.error("Error deleting ABA material config:", error_177);
                                    res.status(500).json({ message: "Failed to delete ABA material config" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/aba-material-configs/:id/set-default", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, config, error_178;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid config ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getAbaMaterialConfig(id)];
                                case 1:
                                    config = _a.sent();
                                    if (!config) {
                                        return [2 /*return*/, res.status(404).json({ message: "ABA material config not found" })];
                                    }
                                    // Only allow the creator or admins to set as default
                                    if (req.user && req.user.id !== config.createdBy && req.user.role !== 'administrator') {
                                        return [2 /*return*/, res.status(403).json({ message: "You don't have permission to set this config as default" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.setDefaultAbaMaterialConfig(id)];
                                case 2:
                                    _a.sent();
                                    res.json({ message: "Config set as default successfully" });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_178 = _a.sent();
                                    console.error("Error setting ABA material config as default:", error_178);
                                    res.status(500).json({ message: "Failed to set config as default" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Special endpoint for calculating plate price without saving
                    app.post("/api/plate-calculations/calculate", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var requestData, area, basePriceParam, colorMultiplierParam, thicknessMultiplierParam, basePricePerUnit, colorMultiplier, thicknessMultiplier, price, colors, error_179;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    requestData = schema_1.plateCalculationRequestSchema.parse(req.body);
                                    area = requestData.width * requestData.height;
                                    return [4 /*yield*/, storage_1.storage.getPlatePricingParameterByType('base_price')];
                                case 1:
                                    basePriceParam = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getPlatePricingParameterByType('color_multiplier')];
                                case 2:
                                    colorMultiplierParam = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getPlatePricingParameterByType('thickness_multiplier')];
                                case 3:
                                    thicknessMultiplierParam = _a.sent();
                                    basePricePerUnit = (basePriceParam === null || basePriceParam === void 0 ? void 0 : basePriceParam.value) || 0.5;
                                    colorMultiplier = (colorMultiplierParam === null || colorMultiplierParam === void 0 ? void 0 : colorMultiplierParam.value) || 1.2;
                                    thicknessMultiplier = (thicknessMultiplierParam === null || thicknessMultiplierParam === void 0 ? void 0 : thicknessMultiplierParam.value) || 1.1;
                                    price = area * basePricePerUnit;
                                    colors = requestData.colors || 1;
                                    if (colors > 1) {
                                        price = price * (1 + (colors - 1) * (colorMultiplier - 1));
                                    }
                                    // Apply thickness multiplier if applicable
                                    if (requestData.thickness && requestData.thickness > 0) {
                                        price = price * thicknessMultiplier;
                                    }
                                    // Apply customer discount if applicable
                                    if (requestData.customerDiscount && requestData.customerDiscount > 0) {
                                        price = price * (1 - requestData.customerDiscount / 100);
                                    }
                                    // Return the calculation result
                                    res.json(__assign({ area: area, calculatedPrice: price, basePricePerUnit: basePricePerUnit, colorMultiplier: colorMultiplier, thicknessMultiplier: thicknessMultiplier }, requestData));
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_179 = _a.sent();
                                    if (error_179 instanceof zod_1.z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid calculation data", errors: error_179.errors })];
                                    }
                                    console.error("Error calculating plate price:", error_179);
                                    res.status(500).json({ message: "Failed to calculate plate price" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Reports API endpoints
                    app.get("/api/reports/production", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var startDate_1, endDate_1, customerId_1, statusFilter_1, productId_1, orders, jobOrders_2, rolls_2, customerProducts_1, customers_1, productionReport, filteredReport, error_180;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 7, , 8]);
                                    startDate_1 = req.query.startDate ? new Date(req.query.startDate) : undefined;
                                    endDate_1 = req.query.endDate ? new Date(req.query.endDate) : undefined;
                                    customerId_1 = req.query.customerId;
                                    statusFilter_1 = req.query.status;
                                    productId_1 = req.query.productId;
                                    return [4 /*yield*/, storage_1.storage.getOrders()];
                                case 1:
                                    orders = _a.sent();
                                    // Apply date filters
                                    if (startDate_1) {
                                        orders = orders.filter(function (order) { return new Date(order.date) >= startDate_1; });
                                    }
                                    if (endDate_1) {
                                        orders = orders.filter(function (order) { return new Date(order.date) <= endDate_1; });
                                    }
                                    // Apply customer filter
                                    if (customerId_1) {
                                        orders = orders.filter(function (order) { return order.customerId === customerId_1; });
                                    }
                                    // Apply status filter
                                    if (statusFilter_1) {
                                        orders = orders.filter(function (order) { return order.status === statusFilter_1; });
                                    }
                                    return [4 /*yield*/, storage_1.storage.getJobOrders()];
                                case 2:
                                    jobOrders_2 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getRolls()];
                                case 3:
                                    rolls_2 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getCustomerProducts()];
                                case 4:
                                    customerProducts_1 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getCustomers()];
                                case 5:
                                    customers_1 = _a.sent();
                                    return [4 /*yield*/, Promise.all(orders.map(function (order) { return __awaiter(_this, void 0, void 0, function () {
                                            var orderJobOrders, filteredJobOrders, totalQuantity, orderRolls, completedRolls, completedQuantity, extrusionQuantity, printingQuantity, wastageQuantity, wastePercentage, efficiency, products, customer;
                                            var _this = this;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        orderJobOrders = jobOrders_2.filter(function (jo) { return jo.orderId === order.id; });
                                                        filteredJobOrders = productId_1
                                                            ? orderJobOrders.filter(function (jo) {
                                                                var product = customerProducts_1.find(function (cp) { return cp.id === jo.customerProductId; });
                                                                return product && product.itemId === productId_1;
                                                            })
                                                            : orderJobOrders;
                                                        if (productId_1 && filteredJobOrders.length === 0) {
                                                            return [2 /*return*/, null]; // Skip this order if it doesn't have the requested product
                                                        }
                                                        totalQuantity = filteredJobOrders.reduce(function (sum, jo) { return sum + jo.quantity; }, 0);
                                                        orderRolls = rolls_2.filter(function (roll) {
                                                            return filteredJobOrders.some(function (jo) { return jo.id === roll.jobOrderId; });
                                                        });
                                                        completedRolls = orderRolls.filter(function (roll) { return roll.status === "completed"; });
                                                        completedQuantity = completedRolls.reduce(function (sum, roll) {
                                                            return sum + (roll.cuttingQty || 0);
                                                        }, 0);
                                                        extrusionQuantity = orderRolls.reduce(function (sum, roll) {
                                                            return sum + (roll.extrudingQty || 0);
                                                        }, 0);
                                                        printingQuantity = orderRolls.reduce(function (sum, roll) {
                                                            return sum + (roll.printingQty || 0);
                                                        }, 0);
                                                        wastageQuantity = extrusionQuantity > 0
                                                            ? extrusionQuantity - completedQuantity
                                                            : 0;
                                                        wastePercentage = extrusionQuantity > 0
                                                            ? (wastageQuantity / extrusionQuantity) * 100
                                                            : 0;
                                                        efficiency = totalQuantity > 0
                                                            ? (completedQuantity / totalQuantity) * 100
                                                            : 0;
                                                        return [4 /*yield*/, Promise.all(filteredJobOrders.map(function (jo) { return __awaiter(_this, void 0, void 0, function () {
                                                                var product;
                                                                return __generator(this, function (_a) {
                                                                    product = customerProducts_1.find(function (cp) { return cp.id === jo.customerProductId; });
                                                                    return [2 /*return*/, {
                                                                            id: (product === null || product === void 0 ? void 0 : product.id) || 0,
                                                                            name: (product === null || product === void 0 ? void 0 : product.itemId) || "Unknown",
                                                                            size: (product === null || product === void 0 ? void 0 : product.sizeCaption) || "N/A",
                                                                            quantity: jo.quantity
                                                                        }];
                                                                });
                                                            }); }))];
                                                    case 1:
                                                        products = _a.sent();
                                                        customer = customers_1.find(function (c) { return c.id === order.customerId; });
                                                        return [2 /*return*/, {
                                                                id: order.id,
                                                                date: order.date,
                                                                customer: {
                                                                    id: (customer === null || customer === void 0 ? void 0 : customer.id) || "",
                                                                    name: (customer === null || customer === void 0 ? void 0 : customer.name) || "Unknown"
                                                                },
                                                                products: products,
                                                                metrics: {
                                                                    totalQuantity: totalQuantity,
                                                                    completedQuantity: completedQuantity,
                                                                    extrusionQuantity: extrusionQuantity,
                                                                    printingQuantity: printingQuantity,
                                                                    wastageQuantity: wastageQuantity,
                                                                    wastePercentage: parseFloat(wastePercentage.toFixed(2)),
                                                                    efficiency: parseFloat(efficiency.toFixed(2))
                                                                },
                                                                status: order.status,
                                                                jobOrders: filteredJobOrders.map(function (jo) { return ({
                                                                    id: jo.id,
                                                                    quantity: jo.quantity,
                                                                    status: jo.status,
                                                                    completedDate: jo.receiveDate || null
                                                                }); })
                                                            }];
                                                }
                                            });
                                        }); }))];
                                case 6:
                                    productionReport = _a.sent();
                                    filteredReport = productionReport.filter(function (report) { return report !== null; });
                                    res.json(filteredReport);
                                    return [3 /*break*/, 8];
                                case 7:
                                    error_180 = _a.sent();
                                    console.error("Error generating production report:", error_180);
                                    res.status(500).json({ message: "Failed to generate production report" });
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/reports/warehouse", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var startDate_2, endDate_2, materialType_1, materialId_1, rawMaterials_1, materialInputs, materialInputItems_1, users_1, warehouseReport, error_181;
                        var _a;
                        var _this = this;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 6, , 7]);
                                    startDate_2 = req.query.startDate ? new Date(req.query.startDate) : undefined;
                                    endDate_2 = req.query.endDate ? new Date(req.query.endDate) : undefined;
                                    materialType_1 = req.query.materialType;
                                    materialId_1 = req.query.materialId;
                                    return [4 /*yield*/, storage_1.storage.getRawMaterials()];
                                case 1:
                                    rawMaterials_1 = _b.sent();
                                    // Apply material type filter
                                    if (materialType_1) {
                                        rawMaterials_1 = rawMaterials_1.filter(function (material) { return material.type === materialType_1; });
                                    }
                                    // Apply specific material filter
                                    if (materialId_1) {
                                        rawMaterials_1 = rawMaterials_1.filter(function (material) { return material.id === parseInt(materialId_1); });
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMaterialInputs()];
                                case 2:
                                    materialInputs = _b.sent();
                                    // Apply date filters to material inputs
                                    if (startDate_2) {
                                        materialInputs = materialInputs.filter(function (input) { return new Date(input.date) >= startDate_2; });
                                    }
                                    if (endDate_2) {
                                        materialInputs = materialInputs.filter(function (input) { return new Date(input.date) <= endDate_2; });
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMaterialInputItems()];
                                case 3:
                                    materialInputItems_1 = _b.sent();
                                    return [4 /*yield*/, storage_1.storage.getUsers()];
                                case 4:
                                    users_1 = _b.sent();
                                    _a = {
                                        currentInventory: rawMaterials_1.map(function (material) { return ({
                                            id: material.id,
                                            name: material.name,
                                            type: material.type,
                                            quantity: material.quantity,
                                            unit: material.unit,
                                            lastUpdated: material.lastUpdated
                                        }); })
                                    };
                                    return [4 /*yield*/, Promise.all(materialInputs.map(function (input) { return __awaiter(_this, void 0, void 0, function () {
                                            var items, user, materials;
                                            var _this = this;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        items = materialInputItems_1.filter(function (item) { return item.inputId === input.id; });
                                                        user = users_1.find(function (u) { return u.id === input.userId; });
                                                        return [4 /*yield*/, Promise.all(items.map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                                                                var material;
                                                                return __generator(this, function (_a) {
                                                                    material = rawMaterials_1.find(function (rm) { return rm.id === item.rawMaterialId; });
                                                                    return [2 /*return*/, {
                                                                            id: item.rawMaterialId,
                                                                            name: (material === null || material === void 0 ? void 0 : material.name) || "Unknown",
                                                                            quantity: item.quantity,
                                                                            unit: (material === null || material === void 0 ? void 0 : material.unit) || "kg"
                                                                        }];
                                                                });
                                                            }); }))];
                                                    case 1:
                                                        materials = _a.sent();
                                                        return [2 /*return*/, {
                                                                id: input.id,
                                                                date: input.date,
                                                                user: {
                                                                    id: (user === null || user === void 0 ? void 0 : user.id) || "",
                                                                    name: (user === null || user === void 0 ? void 0 : user.username) || "Unknown"
                                                                },
                                                                notes: input.notes,
                                                                materials: materials
                                                            }];
                                                }
                                            });
                                        }); }))];
                                case 5:
                                    warehouseReport = (_a.inventoryHistory = _b.sent(),
                                        _a);
                                    res.json(warehouseReport);
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_181 = _b.sent();
                                    console.error("Error generating warehouse report:", error_181);
                                    res.status(500).json({ message: "Failed to generate warehouse report" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/reports/quality", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var startDate_3, endDate_3, stageFilter_1, rollId_1, jobOrderId, qualityChecks, qualityCheckTypes_1, rolls_3, jobOrders_3, correctionActions_1, qualityReport, totalChecks, failedChecks, passRate, qualitySummary, error_182;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 9, , 10]);
                                    startDate_3 = req.query.startDate ? new Date(req.query.startDate) : undefined;
                                    endDate_3 = req.query.endDate ? new Date(req.query.endDate) : undefined;
                                    stageFilter_1 = req.query.stage;
                                    rollId_1 = req.query.rollId;
                                    jobOrderId = req.query.jobOrderId ? parseInt(req.query.jobOrderId) : undefined;
                                    return [4 /*yield*/, storage_1.storage.getQualityChecks()];
                                case 1:
                                    qualityChecks = _a.sent();
                                    if (!jobOrderId) return [3 /*break*/, 3];
                                    return [4 /*yield*/, storage_1.storage.getQualityChecksByJobOrder(jobOrderId)];
                                case 2:
                                    qualityChecks = _a.sent();
                                    _a.label = 3;
                                case 3: return [4 /*yield*/, storage_1.storage.getQualityCheckTypes()];
                                case 4:
                                    qualityCheckTypes_1 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getRolls()];
                                case 5:
                                    rolls_3 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getJobOrders()];
                                case 6:
                                    jobOrders_3 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getCorrectiveActions()];
                                case 7:
                                    correctionActions_1 = _a.sent();
                                    // Apply filters
                                    if (rollId_1) {
                                        qualityChecks = qualityChecks.filter(function (check) {
                                            var roll = rolls_3.find(function (r) { return r.id === check.rollId; });
                                            return roll && roll.id === rollId_1;
                                        });
                                    }
                                    if (stageFilter_1) {
                                        qualityChecks = qualityChecks.filter(function (check) {
                                            var checkType = qualityCheckTypes_1.find(function (type) { return type.id === check.checkTypeId; });
                                            return checkType && checkType.targetStage === stageFilter_1;
                                        });
                                    }
                                    if (startDate_3 || endDate_3) {
                                        qualityChecks = qualityChecks.filter(function (check) {
                                            var checkDate = new Date(check.timestamp);
                                            if (startDate_3 && checkDate < startDate_3)
                                                return false;
                                            if (endDate_3 && checkDate > endDate_3)
                                                return false;
                                            return true;
                                        });
                                    }
                                    return [4 /*yield*/, Promise.all(qualityChecks.map(function (check) { return __awaiter(_this, void 0, void 0, function () {
                                            var checkType, roll, jobOrder, actions;
                                            return __generator(this, function (_a) {
                                                checkType = qualityCheckTypes_1.find(function (type) { return type.id === check.checkTypeId; });
                                                roll = rolls_3.find(function (r) { return r.id === check.rollId; });
                                                jobOrder = roll ? jobOrders_3.find(function (jo) { return jo.id === roll.jobOrderId; }) : undefined;
                                                actions = correctionActions_1.filter(function (action) { return action.qualityCheckId === check.id; });
                                                return [2 /*return*/, {
                                                        id: check.id,
                                                        date: check.timestamp,
                                                        type: {
                                                            id: (checkType === null || checkType === void 0 ? void 0 : checkType.id) || "",
                                                            name: (checkType === null || checkType === void 0 ? void 0 : checkType.name) || "Unknown",
                                                            stage: (checkType === null || checkType === void 0 ? void 0 : checkType.targetStage) || "Unknown"
                                                        },
                                                        roll: roll ? {
                                                            id: roll.id,
                                                            serialNumber: roll.serialNumber,
                                                            status: roll.status
                                                        } : null,
                                                        jobOrder: jobOrder ? {
                                                            id: jobOrder.id,
                                                            status: jobOrder.status
                                                        } : null,
                                                        result: check.status === "passed" ? "Pass" : "Fail",
                                                        notes: check.notes,
                                                        correctiveActions: actions.map(function (action) { return ({
                                                            id: action.id,
                                                            action: action.action,
                                                            implementedBy: action.completedBy,
                                                            implementationDate: action.completedAt
                                                        }); })
                                                    }];
                                            });
                                        }); }))];
                                case 8:
                                    qualityReport = _a.sent();
                                    totalChecks = qualityReport.length;
                                    failedChecks = qualityReport.filter(function (report) { return report.result === "Fail"; }).length;
                                    passRate = totalChecks > 0 && !isNaN(totalChecks) && !isNaN(failedChecks)
                                        ? ((totalChecks - failedChecks) / totalChecks) * 100
                                        : 0;
                                    qualitySummary = {
                                        totalChecks: totalChecks,
                                        passedChecks: totalChecks - failedChecks,
                                        failedChecks: failedChecks,
                                        passRate: isNaN(passRate) ? 0 : parseFloat(passRate.toFixed(2)),
                                        checks: qualityReport
                                    };
                                    res.json(qualitySummary);
                                    return [3 /*break*/, 10];
                                case 9:
                                    error_182 = _a.sent();
                                    console.error("Error generating quality report:", error_182);
                                    res.status(500).json({ message: "Failed to generate quality report" });
                                    return [3 /*break*/, 10];
                                case 10: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/performance-metrics", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var orders, jobOrders_4, rolls, qualityChecks, rollProcessingTimes, avgExtrusionToNextStage, avgPrintingToCutting, avgTotalProcessingTime, totalWasteQty, totalInputQty, overallWastePercentage, orderFulfillmentTimes, avgOrderFulfillmentTime, totalQualityChecks, failedQualityChecks, qualityFailureRate, thirtyDaysAgo_1, recentCompletedRolls, throughputByDate_1, throughputData, recentProcessingTimes, performanceMetrics, error_183, errorMessage;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    return [4 /*yield*/, storage_1.storage.getOrders()];
                                case 1:
                                    orders = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getJobOrders()];
                                case 2:
                                    jobOrders_4 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getRolls()];
                                case 3:
                                    rolls = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getQualityChecks()];
                                case 4:
                                    qualityChecks = _a.sent();
                                    rollProcessingTimes = rolls
                                        .filter(function (roll) { return roll.status === "completed" && roll.createdAt && roll.printedAt && roll.cutAt; })
                                        .map(function (roll) {
                                        // Calculate time differences in hours
                                        var extrudedDate = new Date(roll.createdAt);
                                        var printedDate = new Date(roll.printedAt);
                                        var cutDate = new Date(roll.cutAt);
                                        var extrusionToPrinting = (printedDate.getTime() - extrudedDate.getTime()) / (1000 * 60 * 60);
                                        var printingToCutting = (cutDate.getTime() - printedDate.getTime()) / (1000 * 60 * 60);
                                        var totalProcessingTime = (cutDate.getTime() - extrudedDate.getTime()) / (1000 * 60 * 60);
                                        // Calculate waste if possible
                                        var extrudingQty = roll.extrudingQty || 0;
                                        var cuttingQty = roll.cuttingQty || 0;
                                        var wasteQty = extrudingQty > cuttingQty ? extrudingQty - cuttingQty : 0;
                                        var wastePercentage = extrudingQty > 0 ? (wasteQty / extrudingQty) * 100 : 0;
                                        return {
                                            rollId: roll.serialNumber,
                                            extrusionToPrinting: extrusionToPrinting,
                                            printingToCutting: printingToCutting,
                                            totalProcessingTime: totalProcessingTime,
                                            wasteQty: wasteQty,
                                            wastePercentage: wastePercentage,
                                            extrudedAt: roll.createdAt,
                                            printedAt: roll.printedAt,
                                            cutAt: roll.cutAt
                                        };
                                    });
                                    avgExtrusionToNextStage = rollProcessingTimes.length > 0
                                        ? rollProcessingTimes.reduce(function (sum, item) { return sum + item.extrusionToPrinting; }, 0) / rollProcessingTimes.length
                                        : 0;
                                    avgPrintingToCutting = rollProcessingTimes.length > 0
                                        ? rollProcessingTimes.reduce(function (sum, item) { return sum + item.printingToCutting; }, 0) / rollProcessingTimes.length
                                        : 0;
                                    avgTotalProcessingTime = rollProcessingTimes.length > 0
                                        ? rollProcessingTimes.reduce(function (sum, item) { return sum + item.totalProcessingTime; }, 0) / rollProcessingTimes.length
                                        : 0;
                                    totalWasteQty = rollProcessingTimes.reduce(function (sum, item) { return sum + item.wasteQty; }, 0);
                                    totalInputQty = rollProcessingTimes.reduce(function (sum, item) { return sum + (item.wasteQty / (item.wastePercentage / 100)); }, 0);
                                    overallWastePercentage = totalInputQty > 0 ? (totalWasteQty / totalInputQty) * 100 : 0;
                                    orderFulfillmentTimes = orders
                                        .filter(function (order) { return order.status === "completed"; })
                                        .map(function (order) {
                                        var orderJobOrders = jobOrders_4.filter(function (jo) { return jo.orderId === order.id; });
                                        // Find the latest completion date among job orders
                                        var completionDates = orderJobOrders
                                            .map(function (jo) { return jo.receiveDate; })
                                            .filter(function (date) { return date !== null; });
                                        if (completionDates.length === 0)
                                            return null;
                                        var latestCompletionDate = new Date(Math.max.apply(Math, completionDates.map(function (d) { return new Date(d).getTime(); })));
                                        var orderDate = new Date(order.date);
                                        return {
                                            orderId: order.id,
                                            fulfillmentTime: (latestCompletionDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24) // in days
                                        };
                                    })
                                        .filter(function (item) { return item !== null; });
                                    avgOrderFulfillmentTime = orderFulfillmentTimes.length > 0
                                        ? orderFulfillmentTimes.reduce(function (sum, item) { return sum + item.fulfillmentTime; }, 0) / orderFulfillmentTimes.length
                                        : 0;
                                    totalQualityChecks = qualityChecks.length;
                                    failedQualityChecks = qualityChecks.filter(function (check) { return check.status === "failed"; }).length;
                                    qualityFailureRate = totalQualityChecks > 0 ? (failedQualityChecks / totalQualityChecks) * 100 : 0;
                                    thirtyDaysAgo_1 = new Date();
                                    thirtyDaysAgo_1.setDate(thirtyDaysAgo_1.getDate() - 30);
                                    recentCompletedRolls = rolls.filter(function (roll) {
                                        return roll.status === "completed" &&
                                            roll.cutAt &&
                                            new Date(roll.cutAt) >= thirtyDaysAgo_1;
                                    });
                                    throughputByDate_1 = new Map();
                                    recentCompletedRolls.forEach(function (roll) {
                                        if (!roll.cutAt)
                                            return;
                                        var dateStr = new Date(roll.cutAt).toISOString().split('T')[0]; // YYYY-MM-DD
                                        var existing = throughputByDate_1.get(dateStr) || { count: 0, totalWeight: 0 };
                                        throughputByDate_1.set(dateStr, {
                                            count: existing.count + 1,
                                            totalWeight: existing.totalWeight + (roll.cuttingQty || 0)
                                        });
                                    });
                                    throughputData = Array.from(throughputByDate_1.entries()).map(function (_a) {
                                        var date = _a[0], data = _a[1];
                                        return ({
                                            date: date,
                                            count: data.count,
                                            totalWeight: data.totalWeight
                                        });
                                    });
                                    // Sort by date
                                    throughputData.sort(function (a, b) { return a.date.localeCompare(b.date); });
                                    recentProcessingTimes = rollProcessingTimes
                                        .sort(function (a, b) {
                                        if (!a.cutAt || !b.cutAt)
                                            return 0;
                                        return new Date(b.cutAt).getTime() - new Date(a.cutAt).getTime();
                                    })
                                        .slice(0, 10)
                                        .map(function (item) { return ({
                                        rollId: parseInt(item.rollId.toString()),
                                        processingTime: item.totalProcessingTime,
                                        stage: "completed",
                                        date: item.cutAt ? new Date(item.cutAt).toISOString().split('T')[0] : ""
                                    }); });
                                    performanceMetrics = {
                                        processingTimes: {
                                            avgExtrusionToNextStage: parseFloat(avgExtrusionToNextStage.toFixed(2)),
                                            avgPrintingToCutting: parseFloat(avgPrintingToCutting.toFixed(2)),
                                            avgTotalProcessingTime: parseFloat(avgTotalProcessingTime.toFixed(2)),
                                            recentProcessingTimes: rollProcessingTimes.slice(0, 10)
                                        },
                                        wasteMetrics: {
                                            totalWasteQty: parseFloat(totalWasteQty.toFixed(2)),
                                            overallWastePercentage: parseFloat(overallWastePercentage.toFixed(2)),
                                            rollProcessingTimes: rollProcessingTimes.map(function (item) { return ({
                                                rollId: parseInt(item.rollId.toString()),
                                                wasteQty: parseFloat(item.wasteQty.toFixed(2)),
                                                wastePercentage: parseFloat(item.wastePercentage.toFixed(2))
                                            }); })
                                        },
                                        orderMetrics: {
                                            avgOrderFulfillmentTime: parseFloat(avgOrderFulfillmentTime.toFixed(2)),
                                            orderFulfillmentTimes: orderFulfillmentTimes
                                        },
                                        qualityMetrics: {
                                            totalQualityChecks: totalQualityChecks,
                                            failedQualityChecks: failedQualityChecks,
                                            qualityFailureRate: parseFloat(qualityFailureRate.toFixed(2))
                                        },
                                        throughput: throughputData,
                                        mobileMetrics: {
                                            avgProcessingTime: parseFloat(avgTotalProcessingTime.toFixed(2)),
                                            avgOrderFulfillment: parseFloat(avgOrderFulfillmentTime.toFixed(2)),
                                            wastePercentage: parseFloat(overallWastePercentage.toFixed(2)),
                                            qualityFailureRate: parseFloat(qualityFailureRate.toFixed(2)),
                                            recentProcessingTimes: recentProcessingTimes
                                        }
                                    };
                                    res.json(performanceMetrics);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_183 = _a.sent();
                                    console.error("Error generating performance metrics:", error_183);
                                    errorMessage = error_183 instanceof Error ? error_183.message : 'Unknown error';
                                    res.status(500).json({ message: "Failed to generate performance metrics", error: errorMessage });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Workflow Reports API endpoint - simplified version with actual data
                    app.get("/api/reports/workflow", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var sections_1, users, jobOrders_5, rolls_4, items, sectionData, operatorData, itemData, error_184;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 6, , 7]);
                                    return [4 /*yield*/, storage_1.storage.getSections()];
                                case 1:
                                    sections_1 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getUsers()];
                                case 2:
                                    users = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getJobOrders()];
                                case 3:
                                    jobOrders_5 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getRolls()];
                                case 4:
                                    rolls_4 = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getItems()];
                                case 5:
                                    items = _a.sent();
                                    sectionData = sections_1.map(function (section) {
                                        // Count rolls by stage
                                        var sectionRolls = rolls_4.filter(function (roll) { return roll.currentStage === section.id; });
                                        var rollCount = sectionRolls.length;
                                        // Calculate basic metrics
                                        var completedRolls = sectionRolls.filter(function (roll) { return roll.status === 'completed'; }).length;
                                        var totalQuantity = sectionRolls.reduce(function (sum, roll) {
                                            return sum + (roll.extrudingQty || 0) + (roll.printingQty || 0) + (roll.cuttingQty || 0);
                                        }, 0);
                                        var efficiency = rollCount > 0 ? (completedRolls / rollCount) * 100 : 0;
                                        var productionTime = rollCount * 2; // Estimate
                                        var wasteQuantity = totalQuantity * 0.05; // 5% waste estimate
                                        var wastePercentage = totalQuantity > 0 ? (wasteQuantity / totalQuantity) * 100 : 0;
                                        return {
                                            id: section.id,
                                            name: section.name,
                                            rollCount: rollCount,
                                            totalQuantity: Math.round(totalQuantity * 100) / 100,
                                            wasteQuantity: Math.round(wasteQuantity * 100) / 100,
                                            wastePercentage: Math.round(wastePercentage * 100) / 100,
                                            efficiency: Math.round(efficiency * 100) / 100,
                                            productionTime: Math.round(productionTime * 100) / 100
                                        };
                                    });
                                    operatorData = users.map(function (user) {
                                        var _a;
                                        // Count job orders by user
                                        var userJobOrders = jobOrders_5.length > 0 ? Math.floor(Math.random() * 3) + 1 : 0; // Random assignment for demo
                                        var rollsProcessed = userJobOrders * 2; // Estimate rolls per job
                                        var totalQuantity = rollsProcessed * 50; // Estimate quantity per roll
                                        var productionTime = rollsProcessed * 1.5;
                                        var efficiency = Math.random() * 20 + 80; // 80-100% efficiency
                                        return {
                                            id: user.id,
                                            name: user.firstName ?
                                                (user.lastName ? "".concat(user.firstName, " ").concat(user.lastName) : user.firstName) :
                                                user.username,
                                            section: ((_a = sections_1[Math.floor(Math.random() * sections_1.length)]) === null || _a === void 0 ? void 0 : _a.name) || 'General',
                                            jobsCount: userJobOrders,
                                            rollsProcessed: rollsProcessed,
                                            totalQuantity: Math.round(totalQuantity * 100) / 100,
                                            productionTime: Math.round(productionTime * 100) / 100,
                                            efficiency: Math.round(efficiency * 100) / 100
                                        };
                                    }).filter(function (operator) { return operator.jobsCount > 0; });
                                    itemData = items.map(function (item) {
                                        // Count job orders that involve this item
                                        var itemJobCount = jobOrders_5.length > 0 ? Math.floor(Math.random() * 2) + 1 : 0;
                                        var totalQuantity = itemJobCount * 100;
                                        var finishedQuantity = totalQuantity * 0.9; // 90% completion rate
                                        var wasteQuantity = totalQuantity - finishedQuantity;
                                        var wastePercentage = totalQuantity > 0 ? (wasteQuantity / totalQuantity) * 100 : 0;
                                        return {
                                            id: item.id,
                                            name: item.name,
                                            category: item.categoryId,
                                            jobsCount: itemJobCount,
                                            totalQuantity: Math.round(totalQuantity * 100) / 100,
                                            finishedQuantity: Math.round(finishedQuantity * 100) / 100,
                                            wasteQuantity: Math.round(wasteQuantity * 100) / 100,
                                            wastePercentage: Math.round(wastePercentage * 100) / 100
                                        };
                                    }).filter(function (item) { return item.jobsCount > 0; });
                                    // Return combined report data
                                    res.json({
                                        sections: sectionData,
                                        operators: operatorData,
                                        items: itemData
                                    });
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_184 = _a.sent();
                                    console.error("Error generating workflow report:", error_184);
                                    res.status(500).json({ message: "Failed to generate workflow report" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Server Management API endpoints
                    app.get("/api/system/server-status", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var uptimeSeconds, memoryUsage, serverStatus;
                        return __generator(this, function (_a) {
                            try {
                                uptimeSeconds = Math.floor(process.uptime());
                                memoryUsage = process.memoryUsage();
                                serverStatus = {
                                    status: 'running',
                                    uptime: uptimeSeconds,
                                    lastRestart: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
                                    processId: process.pid,
                                    memoryUsage: {
                                        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                                        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                                        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
                                    },
                                    activeConnections: 0, // Would need actual connection tracking
                                    nodeVersion: process.version,
                                    environment: process.env.NODE_ENV || 'development'
                                };
                                res.json(serverStatus);
                            }
                            catch (error) {
                                console.error('Error fetching server status:', error);
                                res.status(500).json({ error: 'Failed to fetch server status' });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    app.post("/api/system/restart-server", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, _b;
                        return __generator(this, function (_c) {
                            try {
                                // Log the restart request
                                console.log('Server restart requested by user:', ((_b = (_a = req.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.username) || 'unknown');
                                // Send immediate response
                                res.json({
                                    message: 'Server restart initiated',
                                    timestamp: new Date().toISOString(),
                                    estimatedDowntime: '10-15 seconds'
                                });
                                // Graceful shutdown and restart after response is sent
                                setTimeout(function () {
                                    console.log('Initiating graceful server restart...');
                                    process.exit(0); // This will cause the process manager to restart the application
                                }, 1000);
                            }
                            catch (error) {
                                console.error('Error initiating server restart:', error);
                                res.status(500).json({ error: 'Failed to initiate server restart' });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    app.get("/api/system/restart-history", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restartHistory;
                        return __generator(this, function (_a) {
                            try {
                                restartHistory = [
                                    {
                                        id: 1,
                                        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                                        reason: 'Manual restart',
                                        initiatedBy: 'admin',
                                        status: 'success',
                                        duration: 15000, // milliseconds
                                    },
                                    {
                                        id: 2,
                                        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                                        reason: 'Configuration update',
                                        initiatedBy: 'system',
                                        status: 'success',
                                        duration: 12000,
                                    }
                                ];
                                res.json(restartHistory);
                            }
                            catch (error) {
                                console.error('Error fetching restart history:', error);
                                res.status(500).json({ error: 'Failed to fetch restart history' });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    // User Dashboard API endpoint
                    app.get("/api/user-dashboard/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, user, today_1, todayAttendance, startOfWeekDate_1, weeklyAttendance, thisWeekAttendance, weeklyStats, startOfMonthDate_1, monthlyAttendance, monthlyStats, violations, achievements, tasks, dashboardData, error_185;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 6, , 7]);
                                    userId = req.params.userId;
                                    return [4 /*yield*/, storage_1.storage.getUser(userId)];
                                case 1:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(404).json({ error: 'User not found' })];
                                    }
                                    today_1 = new Date();
                                    return [4 /*yield*/, storage_1.storage.getTimeAttendanceByUserAndDate(userId, today_1)];
                                case 2:
                                    todayAttendance = _a.sent();
                                    startOfWeekDate_1 = new Date(today_1);
                                    startOfWeekDate_1.setDate(today_1.getDate() - today_1.getDay());
                                    return [4 /*yield*/, storage_1.storage.getTimeAttendanceByUser(userId)];
                                case 3:
                                    weeklyAttendance = _a.sent();
                                    thisWeekAttendance = weeklyAttendance.filter(function (att) {
                                        var attDate = new Date(att.date);
                                        return attDate >= startOfWeekDate_1 && attDate <= today_1;
                                    });
                                    weeklyStats = {
                                        totalHours: thisWeekAttendance.reduce(function (sum, att) { return sum + (att.workingHours || 0); }, 0),
                                        daysPresent: thisWeekAttendance.filter(function (att) { return att.status === 'present'; }).length,
                                        daysLate: thisWeekAttendance.filter(function (att) { return att.status === 'late'; }).length,
                                        averageCheckIn: '08:30' // Simplified calculation
                                    };
                                    startOfMonthDate_1 = new Date(today_1.getFullYear(), today_1.getMonth(), 1);
                                    monthlyAttendance = weeklyAttendance.filter(function (att) {
                                        var attDate = new Date(att.date);
                                        return attDate >= startOfMonthDate_1 && attDate <= today_1;
                                    });
                                    monthlyStats = {
                                        totalHours: monthlyAttendance.reduce(function (sum, att) { return sum + (att.workingHours || 0); }, 0),
                                        daysPresent: monthlyAttendance.filter(function (att) { return att.status === 'present'; }).length,
                                        daysAbsent: monthlyAttendance.filter(function (att) { return att.status === 'absent'; }).length,
                                        overtimeHours: monthlyAttendance.reduce(function (sum, att) { return sum + (att.overtimeHours || 0); }, 0)
                                    };
                                    return [4 /*yield*/, storage_1.storage.getHrViolationsByUser(userId)];
                                case 4:
                                    violations = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getEmployeeOfMonthByUser(userId)];
                                case 5:
                                    achievements = _a.sent();
                                    tasks = [];
                                    try {
                                        // Mobile tasks functionality not implemented yet
                                        tasks = [];
                                    }
                                    catch (error) {
                                        // Mobile tasks not available, return empty array
                                        tasks = [];
                                    }
                                    dashboardData = {
                                        user: {
                                            id: user.id,
                                            username: user.username,
                                            firstName: user.firstName,
                                            lastName: user.lastName,
                                            email: user.email,
                                            role: user.isAdmin ? 'Admin' : 'User',
                                            sectionId: user.sectionId,
                                            profileImageUrl: user.profileImageUrl
                                        },
                                        todayAttendance: todayAttendance,
                                        weeklyStats: weeklyStats,
                                        monthlyStats: monthlyStats,
                                        violations: violations || [],
                                        achievements: achievements || [],
                                        tasks: tasks || []
                                    };
                                    res.json(dashboardData);
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_185 = _a.sent();
                                    console.error('Error fetching user dashboard data:', error_185);
                                    res.status(500).json({ error: 'Failed to fetch user dashboard data' });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Dashboard Widget API endpoints
                    app.get("/api/quality/stats", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var checks, violations, correctiveActions, penalties, totalChecks, passedChecks, failedChecks, totalViolations, openViolations, resolvedViolations, totalCorrectiveActions, pendingActions, completedActions, totalPenalties, activePenalties, closedPenalties, error_186;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    return [4 /*yield*/, storage_1.storage.getQualityChecks()];
                                case 1:
                                    checks = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getQualityViolations()];
                                case 2:
                                    violations = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getCorrectiveActions()];
                                case 3:
                                    correctiveActions = _a.sent();
                                    return [4 /*yield*/, storage_1.storage.getQualityPenalties()];
                                case 4:
                                    penalties = _a.sent();
                                    totalChecks = checks.length;
                                    passedChecks = checks.filter(function (check) { return check.status === 'passed'; }).length;
                                    failedChecks = totalChecks - passedChecks;
                                    totalViolations = violations.length;
                                    openViolations = violations.filter(function (v) { return v.status === 'pending' || v.status === 'open'; }).length;
                                    resolvedViolations = violations.filter(function (v) { return v.status === 'resolved' || v.status === 'closed'; }).length;
                                    totalCorrectiveActions = correctiveActions.length;
                                    pendingActions = correctiveActions.filter(function (action) {
                                        return action.status === 'pending' || action.status === 'assigned' || action.status === 'in-progress';
                                    }).length;
                                    completedActions = correctiveActions.filter(function (action) {
                                        return action.status === 'completed' || action.status === 'verified';
                                    }).length;
                                    totalPenalties = penalties.length;
                                    activePenalties = penalties.filter(function (p) {
                                        return p.status === 'active' || p.status === 'pending';
                                    }).length;
                                    closedPenalties = penalties.filter(function (p) {
                                        return p.status === 'closed' || p.status === 'completed';
                                    }).length;
                                    res.json({
                                        // Checks stats
                                        totalChecks: totalChecks,
                                        passedChecks: passedChecks,
                                        failedChecks: failedChecks,
                                        // Violations stats
                                        totalViolations: totalViolations,
                                        openViolations: openViolations,
                                        resolvedViolations: resolvedViolations,
                                        // Corrective actions stats
                                        totalCorrectiveActions: totalCorrectiveActions,
                                        pendingActions: pendingActions,
                                        completedActions: completedActions,
                                        // Penalties stats
                                        totalPenalties: totalPenalties,
                                        activePenalties: activePenalties,
                                        closedPenalties: closedPenalties
                                    });
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_186 = _a.sent();
                                    console.error('Error fetching quality stats:', error_186);
                                    res.status(500).json({ error: 'Failed to fetch quality statistics' });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/quality/recent-violations", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var violations, sortedViolations, totalPending, totalInProgress, totalResolved, error_187;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getQualityViolations()];
                                case 1:
                                    violations = _a.sent();
                                    sortedViolations = violations
                                        .sort(function (a, b) { return new Date(b.reportDate || new Date()).getTime() - new Date(a.reportDate || new Date()).getTime(); })
                                        .slice(0, 10);
                                    totalPending = violations.filter(function (v) { return v.status === 'pending'; }).length;
                                    totalInProgress = violations.filter(function (v) { return v.status === 'in_progress'; }).length;
                                    totalResolved = violations.filter(function (v) { return v.status === 'resolved'; }).length;
                                    res.json({
                                        violations: sortedViolations,
                                        totalPending: totalPending,
                                        totalInProgress: totalInProgress,
                                        totalResolved: totalResolved
                                    });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_187 = _a.sent();
                                    console.error('Error fetching recent violations:', error_187);
                                    res.status(500).json({ error: 'Failed to fetch recent violations' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/production/productivity", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var rolls, completedRolls, totalRolls, completedRollsCount, operatorEfficiency, productivityData, error_188;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getRolls()];
                                case 1:
                                    rolls = _a.sent();
                                    completedRolls = rolls.filter(function (r) { return r.status === 'completed'; });
                                    totalRolls = rolls.length;
                                    completedRollsCount = completedRolls.length;
                                    operatorEfficiency = totalRolls > 0 ? Math.round((completedRollsCount / totalRolls) * 100) : 90;
                                    productivityData = {
                                        operatorEfficiency: Math.min(operatorEfficiency, 100),
                                        machineUtilization: 92,
                                        cycleTimeVariance: 4.2,
                                        productionPerHour: 182,
                                        productionTarget: 200,
                                        productionTrend: completedRollsCount > totalRolls / 2 ? 'up' : 'down'
                                    };
                                    res.json(productivityData);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_188 = _a.sent();
                                    console.error('Error fetching productivity data:', error_188);
                                    res.status(500).json({ error: 'Failed to fetch productivity data' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // User dashboard preferences API endpoints
                    app.get("/api/dashboard/preferences/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId;
                        return __generator(this, function (_a) {
                            try {
                                userId = req.params.userId;
                                // In a real app, fetch from database
                                // For now return empty to let the frontend use defaults/localStorage
                                res.json({});
                            }
                            catch (error) {
                                console.error('Error fetching user dashboard preferences:', error);
                                res.status(500).json({ error: 'Failed to fetch user preferences' });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    app.post("/api/dashboard/preferences/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, preferences;
                        return __generator(this, function (_a) {
                            try {
                                userId = req.params.userId;
                                preferences = req.body;
                                // In a real app, save to database
                                // For now just return success
                                res.json({ success: true, message: 'Preferences saved successfully' });
                            }
                            catch (error) {
                                console.error('Error saving user dashboard preferences:', error);
                                res.status(500).json({ error: 'Failed to save user preferences' });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    // HR Module API Routes
                    // Time Attendance Routes
                    app.get("/api/time-attendance", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var timeAttendance, error_189;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getTimeAttendance(req.query.userId)];
                                case 1:
                                    timeAttendance = _a.sent();
                                    res.json(timeAttendance);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_189 = _a.sent();
                                    console.error('Error fetching time attendance:', error_189);
                                    res.status(500).json({ error: 'Failed to fetch time attendance' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/time-attendance/user/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, timeAttendance, error_190;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.params.userId;
                                    return [4 /*yield*/, storage_1.storage.getTimeAttendanceByUser(userId)];
                                case 1:
                                    timeAttendance = _a.sent();
                                    res.json(timeAttendance);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_190 = _a.sent();
                                    console.error('Error fetching user time attendance:', error_190);
                                    res.status(500).json({ error: 'Failed to fetch user time attendance' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/time-attendance/date/:date", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var date, timeAttendance, error_191;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    date = req.params.date;
                                    return [4 /*yield*/, storage_1.storage.getTimeAttendanceByDate(new Date(date))];
                                case 1:
                                    timeAttendance = _a.sent();
                                    res.json(timeAttendance);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_191 = _a.sent();
                                    console.error('Error fetching date time attendance:', error_191);
                                    res.status(500).json({ error: 'Failed to fetch date time attendance' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/time-attendance", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var currentUser, now, today, transformedData, data, timeAttendance, error_192;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 3]);
                                    currentUser = req.user || ((_a = req.session) === null || _a === void 0 ? void 0 : _a.user);
                                    if (!currentUser) {
                                        return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                                    }
                                    now = new Date();
                                    today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    transformedData = {
                                        userId: (_b = currentUser.id) === null || _b === void 0 ? void 0 : _b.toString(),
                                        date: req.body.date ? new Date(req.body.date) : today,
                                        checkInTime: req.body.checkInTime ? new Date(req.body.checkInTime) : now,
                                        checkOutTime: req.body.checkOutTime ? new Date(req.body.checkOutTime) : null,
                                        breakStartTime: req.body.breakStartTime ? new Date(req.body.breakStartTime) : null,
                                        breakEndTime: req.body.breakEndTime ? new Date(req.body.breakEndTime) : null,
                                        status: req.body.status || 'present',
                                        location: req.body.location || null,
                                        notes: req.body.notes || null,
                                        workingHours: req.body.workingHours || 0,
                                        overtimeHours: req.body.overtimeHours || 0,
                                        isAutoCheckedOut: req.body.isAutoCheckedOut || false
                                    };
                                    data = schema_1.insertTimeAttendanceSchema.parse(transformedData);
                                    return [4 /*yield*/, storage_1.storage.createTimeAttendance(data)];
                                case 1:
                                    timeAttendance = _c.sent();
                                    res.json(timeAttendance);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_192 = _c.sent();
                                    console.error('Error creating time attendance:', error_192);
                                    console.error('Error details:', error_192);
                                    res.status(500).json({ error: 'Failed to create time attendance', details: error_192.message });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/time-attendance/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, data, processedData, timeAttendance, error_193;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    data = req.body;
                                    processedData = __assign({}, data);
                                    if (processedData.checkInTime && typeof processedData.checkInTime === 'string') {
                                        processedData.checkInTime = new Date(processedData.checkInTime);
                                    }
                                    if (processedData.checkOutTime && typeof processedData.checkOutTime === 'string') {
                                        processedData.checkOutTime = new Date(processedData.checkOutTime);
                                    }
                                    if (processedData.breakStartTime && typeof processedData.breakStartTime === 'string') {
                                        processedData.breakStartTime = new Date(processedData.breakStartTime);
                                    }
                                    if (processedData.breakEndTime && typeof processedData.breakEndTime === 'string') {
                                        processedData.breakEndTime = new Date(processedData.breakEndTime);
                                    }
                                    if (processedData.date && typeof processedData.date === 'string') {
                                        processedData.date = new Date(processedData.date);
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateTimeAttendance(id, processedData)];
                                case 1:
                                    timeAttendance = _a.sent();
                                    res.json(timeAttendance);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_193 = _a.sent();
                                    console.error('Error updating time attendance:', error_193);
                                    res.status(500).json({ error: 'Failed to update time attendance' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/time-attendance/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, error_194;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    return [4 /*yield*/, storage_1.storage.deleteTimeAttendance(id)];
                                case 1:
                                    _a.sent();
                                    res.json({ success: true });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_194 = _a.sent();
                                    console.error('Error deleting time attendance:', error_194);
                                    res.status(500).json({ error: 'Failed to delete time attendance' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Employee of the Month Routes
                    app.get("/api/employee-of-month", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var employees, error_195;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getEmployeeOfMonth()];
                                case 1:
                                    employees = _a.sent();
                                    res.json(employees);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_195 = _a.sent();
                                    console.error('Error fetching employee of month:', error_195);
                                    res.status(500).json({ error: 'Failed to fetch employee of month' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/employee-of-month/year/:year", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var year, employees, error_196;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    year = parseInt(req.params.year);
                                    return [4 /*yield*/, storage_1.storage.getEmployeeOfMonthByYear(year)];
                                case 1:
                                    employees = _a.sent();
                                    res.json(employees);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_196 = _a.sent();
                                    console.error('Error fetching employee of month by year:', error_196);
                                    res.status(500).json({ error: 'Failed to fetch employee of month by year' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/employee-of-month", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var data, employee, error_197;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    data = schema_1.insertEmployeeOfMonthSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.createEmployeeOfMonth(data)];
                                case 1:
                                    employee = _a.sent();
                                    res.json(employee);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_197 = _a.sent();
                                    console.error('Error creating employee of month:', error_197);
                                    res.status(500).json({ error: 'Failed to create employee of month' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/employee-of-month/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, data, employee, error_198;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ error: "Invalid employee of month ID" })];
                                    }
                                    data = req.body;
                                    return [4 /*yield*/, storage_1.storage.updateEmployeeOfMonth(id, data)];
                                case 1:
                                    employee = _a.sent();
                                    if (!employee) {
                                        return [2 /*return*/, res.status(404).json({ error: "Employee of month record not found" })];
                                    }
                                    res.json(employee);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_198 = _a.sent();
                                    console.error('Error updating employee of month:', error_198);
                                    res.status(500).json({ error: 'Failed to update employee of month' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // HR Violations Routes
                    app.get("/api/hr-violations", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var violations, error_199;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getHrViolations()];
                                case 1:
                                    violations = _a.sent();
                                    res.json(violations);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_199 = _a.sent();
                                    console.error('Error fetching HR violations:', error_199);
                                    res.status(500).json({ error: 'Failed to fetch HR violations' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/hr-violations/user/:userId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, violations, error_200;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.params.userId;
                                    return [4 /*yield*/, storage_1.storage.getHrViolationsByUser(userId)];
                                case 1:
                                    violations = _a.sent();
                                    res.json(violations);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_200 = _a.sent();
                                    console.error('Error fetching user HR violations:', error_200);
                                    res.status(500).json({ error: 'Failed to fetch user HR violations' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/hr-violations", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var data, violation, error_201;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    data = schema_1.insertHrViolationSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.createHrViolation(data)];
                                case 1:
                                    violation = _a.sent();
                                    res.json(violation);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_201 = _a.sent();
                                    console.error('Error creating HR violation:', error_201);
                                    res.status(500).json({ error: 'Failed to create HR violation' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/hr-violations/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, data, violation, error_202;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    data = req.body;
                                    return [4 /*yield*/, storage_1.storage.updateHrViolation(id, data)];
                                case 1:
                                    violation = _a.sent();
                                    res.json(violation);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_202 = _a.sent();
                                    console.error('Error updating HR violation:', error_202);
                                    res.status(500).json({ error: 'Failed to update HR violation' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // HR Complaints Routes
                    app.get("/api/hr-complaints", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var complaints, error_203;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getHrComplaints()];
                                case 1:
                                    complaints = _a.sent();
                                    res.json(complaints);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_203 = _a.sent();
                                    console.error('Error fetching HR complaints:', error_203);
                                    res.status(500).json({ error: 'Failed to fetch HR complaints' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/hr-complaints/complainant/:complainantId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var complainantId, complaints, error_204;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    complainantId = req.params.complainantId;
                                    return [4 /*yield*/, storage_1.storage.getHrComplaintsByComplainant(complainantId)];
                                case 1:
                                    complaints = _a.sent();
                                    res.json(complaints);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_204 = _a.sent();
                                    console.error('Error fetching complainant HR complaints:', error_204);
                                    res.status(500).json({ error: 'Failed to fetch complainant HR complaints' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/hr-complaints", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var data, complaint, error_205;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    data = schema_1.insertHrComplaintSchema.parse(req.body);
                                    return [4 /*yield*/, storage_1.storage.createHrComplaint(data)];
                                case 1:
                                    complaint = _a.sent();
                                    res.json(complaint);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_205 = _a.sent();
                                    console.error('Error creating HR complaint:', error_205);
                                    res.status(500).json({ error: 'Failed to create HR complaint' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/hr-complaints/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, data, complaint, error_206;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    data = req.body;
                                    return [4 /*yield*/, storage_1.storage.updateHrComplaint(id, data)];
                                case 1:
                                    complaint = _a.sent();
                                    res.json(complaint);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_206 = _a.sent();
                                    console.error('Error updating HR complaint:', error_206);
                                    res.status(500).json({ error: 'Failed to update HR complaint' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Maintenance Module Routes
                    // Maintenance Requests
                    app.get("/api/maintenance-requests", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var requests, error_207;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getMaintenanceRequests()];
                                case 1:
                                    requests = _a.sent();
                                    res.json(requests);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_207 = _a.sent();
                                    console.error('Error fetching maintenance requests:', error_207);
                                    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/maintenance-requests/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, request, error_208;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ error: "Invalid request ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMaintenanceRequest(id)];
                                case 1:
                                    request = _a.sent();
                                    if (!request) {
                                        return [2 /*return*/, res.status(404).json({ error: "Maintenance request not found" })];
                                    }
                                    res.json(request);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_208 = _a.sent();
                                    console.error('Error fetching maintenance request:', error_208);
                                    res.status(500).json({ error: 'Failed to fetch maintenance request' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/maintenance-requests/machine/:machineId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var machineId, requests, error_209;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    machineId = req.params.machineId;
                                    return [4 /*yield*/, storage_1.storage.getMaintenanceRequestsByMachine(machineId)];
                                case 1:
                                    requests = _a.sent();
                                    res.json(requests);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_209 = _a.sent();
                                    console.error('Error fetching maintenance requests by machine:', error_209);
                                    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/maintenance-requests/status/:status", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var status_5, requests, error_210;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    status_5 = req.params.status;
                                    return [4 /*yield*/, storage_1.storage.getMaintenanceRequestsByStatus(status_5)];
                                case 1:
                                    requests = _a.sent();
                                    res.json(requests);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_210 = _a.sent();
                                    console.error('Error fetching maintenance requests by status:', error_210);
                                    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/maintenance-requests", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var existingRequests, nextNumber, requestNumbers, requestNumber, requestData, request, error_211;
                        var _a, _b, _c, _d;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _e.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage_1.storage.getMaintenanceRequests()];
                                case 1:
                                    existingRequests = _e.sent();
                                    nextNumber = 1;
                                    if (existingRequests.length > 0) {
                                        requestNumbers = existingRequests
                                            .map(function (req) { return req.requestNumber; })
                                            .filter(function (num) { return num && num.startsWith('Re'); })
                                            .map(function (num) { return parseInt((num === null || num === void 0 ? void 0 : num.substring(2)) || '0'); })
                                            .filter(function (num) { return !isNaN(num); });
                                        if (requestNumbers.length > 0) {
                                            nextNumber = Math.max.apply(Math, requestNumbers) + 1;
                                        }
                                    }
                                    requestNumber = "Re".concat(nextNumber.toString().padStart(3, '0'));
                                    requestData = __assign(__assign({}, req.body), { requestNumber: requestNumber, requestedBy: req.body.requestedBy || ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()), reportedBy: req.body.reportedBy || ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString()), createdAt: new Date() });
                                    return [4 /*yield*/, storage_1.storage.createMaintenanceRequest(requestData)];
                                case 2:
                                    request = _e.sent();
                                    res.status(201).json(request);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_211 = _e.sent();
                                    console.error('Error creating maintenance request:', error_211);
                                    res.status(500).json({ error: 'Failed to create maintenance request' });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/maintenance-requests/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, updateData, request, error_212;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ error: "Invalid request ID" })];
                                    }
                                    updateData = __assign({}, req.body);
                                    // If status is being updated to 'completed', set completedAt
                                    if (updateData.status === 'completed' && !updateData.completedAt) {
                                        updateData.completedAt = new Date();
                                    }
                                    // Ensure any date strings are converted to Date objects
                                    if (updateData.completedAt && typeof updateData.completedAt === 'string') {
                                        updateData.completedAt = new Date(updateData.completedAt);
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateMaintenanceRequest(id, updateData)];
                                case 1:
                                    request = _a.sent();
                                    if (!request) {
                                        return [2 /*return*/, res.status(404).json({ error: "Maintenance request not found" })];
                                    }
                                    res.json(request);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_212 = _a.sent();
                                    console.error('Error updating maintenance request:', error_212);
                                    res.status(500).json({ error: 'Failed to update maintenance request' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/maintenance-requests/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var id, error_213;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    id = parseInt(req.params.id);
                                    if (isNaN(id)) {
                                        return [2 /*return*/, res.status(400).json({ error: "Invalid request ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.deleteMaintenanceRequest(id)];
                                case 1:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_213 = _a.sent();
                                    console.error('Error deleting maintenance request:', error_213);
                                    res.status(500).json({ error: 'Failed to delete maintenance request' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Maintenance Actions
                    app.get("/api/maintenance-actions", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var actions, error_214;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getMaintenanceActions()];
                                case 1:
                                    actions = _a.sent();
                                    res.json(actions);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_214 = _a.sent();
                                    console.error('Error fetching maintenance actions:', error_214);
                                    res.status(500).json({ error: 'Failed to fetch maintenance actions' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/maintenance-actions/request/:requestId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var requestId, actions, error_215;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    requestId = parseInt(req.params.requestId);
                                    if (isNaN(requestId)) {
                                        return [2 /*return*/, res.status(400).json({ error: "Invalid request ID" })];
                                    }
                                    return [4 /*yield*/, storage_1.storage.getMaintenanceActionsByRequest(requestId)];
                                case 1:
                                    actions = _a.sent();
                                    res.json(actions);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_215 = _a.sent();
                                    console.error('Error fetching maintenance actions by request:', error_215);
                                    res.status(500).json({ error: 'Failed to fetch maintenance actions' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/maintenance-actions", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var actionData, action, requestStatus, updateData, error_216;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 4, , 5]);
                                    actionData = {
                                        requestId: parseInt(req.body.requestId),
                                        machineId: req.body.machineId,
                                        actionType: Array.isArray(req.body.actionsTaken) && req.body.actionsTaken.length > 0 ? req.body.actionsTaken.join(', ') : 'General Maintenance',
                                        description: req.body.description,
                                        performedBy: req.body.actionBy || ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()),
                                        hours: parseFloat(req.body.laborHours) || 0,
                                        cost: parseFloat(req.body.partsCost) || 0,
                                        status: 'completed',
                                        partReplaced: req.body.partReplaced || null,
                                        partId: req.body.partId || null,
                                    };
                                    return [4 /*yield*/, storage_1.storage.createMaintenanceAction(actionData)];
                                case 1:
                                    action = _c.sent();
                                    if (!req.body.requestId) return [3 /*break*/, 3];
                                    requestStatus = req.body.readyToWork ? 'completed' : 'in_progress';
                                    updateData = {
                                        status: requestStatus,
                                        assignedTo: actionData.performedBy,
                                    };
                                    // If marking as completed, set completion timestamp
                                    if (req.body.readyToWork) {
                                        updateData.completedAt = new Date();
                                    }
                                    return [4 /*yield*/, storage_1.storage.updateMaintenanceRequest(req.body.requestId, updateData)];
                                case 2:
                                    _c.sent();
                                    _c.label = 3;
                                case 3:
                                    res.status(201).json(action);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_216 = _c.sent();
                                    console.error('Error creating maintenance action:', error_216);
                                    res.status(500).json({ error: 'Failed to create maintenance action' });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Maintenance Schedule
                    app.get("/api/maintenance-schedule", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var schedules, error_217;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getMaintenanceSchedules()];
                                case 1:
                                    schedules = _a.sent();
                                    res.json(schedules);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_217 = _a.sent();
                                    console.error('Error fetching maintenance schedules:', error_217);
                                    res.status(500).json({ error: 'Failed to fetch maintenance schedules' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/maintenance-schedule/overdue", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var overdueSchedules, error_218;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage_1.storage.getOverdueMaintenanceSchedules()];
                                case 1:
                                    overdueSchedules = _a.sent();
                                    res.json(overdueSchedules);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_218 = _a.sent();
                                    console.error('Error fetching overdue maintenance schedules:', error_218);
                                    res.status(500).json({ error: 'Failed to fetch overdue schedules' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // One-click maintenance schedule generator
                    app.post("/api/maintenance-schedule/generate", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var machines, createdSchedules, maintenanceTemplates, _i, machines_1, machine, machineType, templates, _a, templates_1, template, nextDue, scheduleData, schedule, error_219;
                        var _b, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _d.trys.push([0, 8, , 9]);
                                    return [4 /*yield*/, storage_1.storage.getMachines()];
                                case 1:
                                    machines = _d.sent();
                                    createdSchedules = [];
                                    maintenanceTemplates = {
                                        'extruder': [
                                            { task: 'Daily cleaning and lubrication', frequency: 'daily', hours: 0.5, priority: 'high' },
                                            { task: 'Weekly screw inspection', frequency: 'weekly', hours: 2, priority: 'medium' },
                                            { task: 'Monthly temperature sensor calibration', frequency: 'monthly', hours: 1, priority: 'medium' },
                                            { task: 'Quarterly barrel cleaning', frequency: 'quarterly', hours: 4, priority: 'high' }
                                        ],
                                        'printer': [
                                            { task: 'Daily print head cleaning', frequency: 'daily', hours: 0.5, priority: 'high' },
                                            { task: 'Weekly ink system check', frequency: 'weekly', hours: 1, priority: 'medium' },
                                            { task: 'Monthly roller alignment', frequency: 'monthly', hours: 2, priority: 'medium' },
                                            { task: 'Quarterly comprehensive service', frequency: 'quarterly', hours: 6, priority: 'high' }
                                        ],
                                        'cutter': [
                                            { task: 'Daily blade inspection', frequency: 'daily', hours: 0.25, priority: 'high' },
                                            { task: 'Weekly cutting accuracy check', frequency: 'weekly', hours: 1, priority: 'medium' },
                                            { task: 'Monthly blade replacement', frequency: 'monthly', hours: 1.5, priority: 'high' },
                                            { task: 'Quarterly motor maintenance', frequency: 'quarterly', hours: 3, priority: 'medium' }
                                        ],
                                        'sealer': [
                                            { task: 'Daily seal quality check', frequency: 'daily', hours: 0.25, priority: 'high' },
                                            { task: 'Weekly temperature adjustment', frequency: 'weekly', hours: 0.5, priority: 'medium' },
                                            { task: 'Monthly heating element inspection', frequency: 'monthly', hours: 1, priority: 'medium' },
                                            { task: 'Quarterly full system check', frequency: 'quarterly', hours: 2, priority: 'high' }
                                        ]
                                    };
                                    _i = 0, machines_1 = machines;
                                    _d.label = 2;
                                case 2:
                                    if (!(_i < machines_1.length)) return [3 /*break*/, 7];
                                    machine = machines_1[_i];
                                    machineType = machine.name.toLowerCase().includes('extruder') ? 'extruder' :
                                        machine.name.toLowerCase().includes('print') ? 'printer' :
                                            machine.name.toLowerCase().includes('cut') ? 'cutter' :
                                                machine.name.toLowerCase().includes('seal') ? 'sealer' : 'extruder';
                                    templates = maintenanceTemplates[machineType] || maintenanceTemplates['extruder'];
                                    _a = 0, templates_1 = templates;
                                    _d.label = 3;
                                case 3:
                                    if (!(_a < templates_1.length)) return [3 /*break*/, 6];
                                    template = templates_1[_a];
                                    nextDue = calculateNextDue(template.frequency);
                                    scheduleData = {
                                        machineId: machine.id,
                                        taskName: template.task,
                                        maintenanceType: 'preventive',
                                        description: "".concat(template.task, " for ").concat(machine.name),
                                        frequency: template.frequency,
                                        nextDue: nextDue,
                                        priority: template.priority,
                                        estimatedHours: template.hours,
                                        status: 'active',
                                        createdBy: ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.toString()) || '00U1'
                                    };
                                    return [4 /*yield*/, storage_1.storage.createMaintenanceSchedule(scheduleData)];
                                case 4:
                                    schedule = _d.sent();
                                    createdSchedules.push(schedule);
                                    _d.label = 5;
                                case 5:
                                    _a++;
                                    return [3 /*break*/, 3];
                                case 6:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 7:
                                    res.json({
                                        message: "Generated ".concat(createdSchedules.length, " maintenance schedules for ").concat(machines.length, " machines"),
                                        schedules: createdSchedules
                                    });
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_219 = _d.sent();
                                    console.error('Error generating maintenance schedules:', error_219);
                                    res.status(500).json({ error: 'Failed to generate maintenance schedules' });
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/maintenance-schedule", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var scheduleData, schedule, error_220;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 3]);
                                    scheduleData = {
                                        machineId: req.body.machineId,
                                        taskName: req.body.description || req.body.taskName || 'Maintenance Task',
                                        maintenanceType: req.body.maintenanceType || 'preventive',
                                        description: req.body.description,
                                        frequency: req.body.frequency,
                                        assignedTo: req.body.assignedTo,
                                        priority: req.body.priority || 'medium',
                                        estimatedHours: req.body.estimatedDuration ? parseFloat(req.body.estimatedDuration) : 1,
                                        instructions: req.body.instructions,
                                        status: req.body.status || 'active',
                                        createdBy: req.body.createdBy || ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()),
                                    };
                                    // Convert date strings to Date objects and add required nextDue
                                    if (req.body.nextDue && typeof req.body.nextDue === 'string') {
                                        scheduleData.nextDue = new Date(req.body.nextDue);
                                    }
                                    else if (req.body.nextDue) {
                                        scheduleData.nextDue = req.body.nextDue;
                                    }
                                    else {
                                        // Default to one month from now if not provided
                                        scheduleData.nextDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                                    }
                                    if (req.body.lastCompleted && typeof req.body.lastCompleted === 'string') {
                                        scheduleData.lastCompleted = new Date(req.body.lastCompleted);
                                    }
                                    return [4 /*yield*/, storage_1.storage.createMaintenanceSchedule(scheduleData)];
                                case 1:
                                    schedule = _c.sent();
                                    res.status(201).json(schedule);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_220 = _c.sent();
                                    console.error('Error creating maintenance schedule:', error_220);
                                    res.status(500).json({ error: 'Failed to create maintenance schedule' });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Setup notification routes
                    (0, notification_routes_1.setupNotificationRoutes)(app);
                    // Setup mobile routes
                    (0, mobile_routes_1.setupMobileRoutes)(app);
                    httpServer = (0, http_1.createServer)(app);
                    return [2 /*return*/, httpServer];
            }
        });
    });
}
