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
exports.DatabaseStorage = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var schema_1 = require("@shared/schema");
var db_1 = require("./db");
var connect_pg_simple_1 = require("connect-pg-simple");
var express_session_1 = require("express-session");
var DatabaseStorage = /** @class */ (function () {
    function DatabaseStorage() {
        var pgStore = (0, connect_pg_simple_1.default)(express_session_1.default);
        // Use consistent database URL
        var databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error("DATABASE_URL environment variable is required");
        }
        this.sessionStore = new pgStore({
            conString: databaseUrl,
            createTableIfMissing: true,
            tableName: "sessions",
        });
    }
    // User operations with Replit Auth
    DatabaseStorage.prototype.getUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allUsers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users)];
                    case 1:
                        allUsers = _a.sent();
                        return [2 /*return*/, allUsers];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.createUser = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.users)
                            .values(__assign(__assign({}, userData), { createdAt: new Date(), updatedAt: new Date() }))
                            .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUser = function (id, userData) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.users)
                            .set(__assign(__assign({}, userData), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
                            .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.users)
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    DatabaseStorage.prototype.upsertUser = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanUserData, isUpdate, isPasswordUnchanged, existingUser, user, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        console.log("Upserting user:", userData.username);
                        cleanUserData = __assign({}, userData);
                        isUpdate = !!cleanUserData.id;
                        isPasswordUnchanged = cleanUserData.password === "UNCHANGED_PASSWORD";
                        if (!(isUpdate && isPasswordUnchanged)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getUser(cleanUserData.id)];
                    case 1:
                        existingUser = _a.sent();
                        if (!existingUser) {
                            throw new Error("User with id ".concat(cleanUserData.id, " not found"));
                        }
                        // Use the existing password instead of "UNCHANGED_PASSWORD"
                        cleanUserData.password = existingUser.password;
                        _a.label = 2;
                    case 2: return [4 /*yield*/, db_1.db
                            .insert(schema_1.users)
                            .values(__assign(__assign({}, cleanUserData), { updatedAt: new Date() }))
                            .onConflictDoUpdate({
                            target: schema_1.users.id,
                            set: __assign(__assign({}, cleanUserData), { updatedAt: new Date() }),
                        })
                            .returning()];
                    case 3:
                        user = (_a.sent())[0];
                        console.log("Upsert user success for:", cleanUserData.username);
                        return [2 /*return*/, user];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Error upserting user:", error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Permission management operations (section-based)
    DatabaseStorage.prototype.getPermissions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allPermissions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.permissions)];
                    case 1:
                        allPermissions = _a.sent();
                        return [2 /*return*/, allPermissions];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPermissionsBySection = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var sectionPermissions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.permissions)
                            .where((0, drizzle_orm_1.eq)(schema_1.permissions.sectionId, sectionId))];
                    case 1:
                        sectionPermissions = _a.sent();
                        return [2 /*return*/, sectionPermissions];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPermissionsByModule = function (moduleId) {
        return __awaiter(this, void 0, void 0, function () {
            var modulePermissions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.permissions)
                            .where((0, drizzle_orm_1.eq)(schema_1.permissions.moduleId, moduleId))];
                    case 1:
                        modulePermissions = _a.sent();
                        return [2 /*return*/, modulePermissions];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPermission = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var permission;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.permissions)
                            .where((0, drizzle_orm_1.eq)(schema_1.permissions.id, id))];
                    case 1:
                        permission = (_a.sent())[0];
                        return [2 /*return*/, permission];
                }
            });
        });
    };
    DatabaseStorage.prototype.createPermission = function (permission) {
        return __awaiter(this, void 0, void 0, function () {
            var created, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db
                                .insert(schema_1.permissions)
                                .values(permission)
                                .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error in createPermission:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.updatePermission = function (id, permissionData) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.permissions)
                                .set(permissionData)
                                .where((0, drizzle_orm_1.eq)(schema_1.permissions.id, id))
                                .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error in updatePermission:', error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deletePermission = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db
                                .delete(schema_1.permissions)
                                .where((0, drizzle_orm_1.eq)(schema_1.permissions.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error in deletePermission:', error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Modules management operations
    DatabaseStorage.prototype.getModules = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.modules)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getModulesByCategory = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.modules)
                            .where((0, drizzle_orm_1.eq)(schema_1.modules.category, category))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getModule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var module;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.modules)
                            .where((0, drizzle_orm_1.eq)(schema_1.modules.id, id))];
                    case 1:
                        module = (_a.sent())[0];
                        return [2 /*return*/, module];
                }
            });
        });
    };
    DatabaseStorage.prototype.createModule = function (module) {
        return __awaiter(this, void 0, void 0, function () {
            var created, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db
                                .insert(schema_1.modules)
                                .values(module)
                                .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Error in createModule:', error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateModule = function (id, module) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.modules)
                                .set(module)
                                .where((0, drizzle_orm_1.eq)(schema_1.modules.id, id))
                                .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Error in updateModule:', error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteModule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db_1.db
                                .delete(schema_1.modules)
                                .where((0, drizzle_orm_1.eq)(schema_1.modules.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Error in deleteModule:', error_7);
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Categories methods
    DatabaseStorage.prototype.getCategories = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.categories)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var category;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.categories)
                            .where((0, drizzle_orm_1.eq)(schema_1.categories.id, id))];
                    case 1:
                        category = (_a.sent())[0];
                        return [2 /*return*/, category];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCategoryByCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            var category;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.categories)
                            .where((0, drizzle_orm_1.eq)(schema_1.categories.code, code))];
                    case 1:
                        category = (_a.sent())[0];
                        return [2 /*return*/, category];
                }
            });
        });
    };
    DatabaseStorage.prototype.createCategory = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.categories)
                            .values(category)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateCategory = function (id, category) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.categories)
                            .set(category)
                            .where((0, drizzle_orm_1.eq)(schema_1.categories.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteCategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.categories)
                            .where((0, drizzle_orm_1.eq)(schema_1.categories.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Items methods
    DatabaseStorage.prototype.getItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.items)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getItemsByCategory = function (categoryId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.items)
                            .where((0, drizzle_orm_1.eq)(schema_1.items.categoryId, categoryId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.items)
                            .where((0, drizzle_orm_1.eq)(schema_1.items.id, id))];
                    case 1:
                        item = (_a.sent())[0];
                        return [2 /*return*/, item];
                }
            });
        });
    };
    DatabaseStorage.prototype.createItem = function (item) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.items)
                            .values(item)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateItem = function (id, item) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.items)
                            .set(item)
                            .where((0, drizzle_orm_1.eq)(schema_1.items.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.items)
                            .where((0, drizzle_orm_1.eq)(schema_1.items.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Sections methods
    DatabaseStorage.prototype.getSections = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.sections)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var section;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.sections)
                            .where((0, drizzle_orm_1.eq)(schema_1.sections.id, id))];
                    case 1:
                        section = (_a.sent())[0];
                        return [2 /*return*/, section];
                }
            });
        });
    };
    DatabaseStorage.prototype.createSection = function (section) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.sections)
                            .values(section)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateSection = function (id, section) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.sections)
                            .set(section)
                            .where((0, drizzle_orm_1.eq)(schema_1.sections.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteSection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.sections)
                            .where((0, drizzle_orm_1.eq)(schema_1.sections.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Machines methods
    DatabaseStorage.prototype.getMachines = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.machines)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMachinesBySection = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.machines)
                            .where((0, drizzle_orm_1.eq)(schema_1.machines.sectionId, sectionId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMachine = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var machine;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.machines)
                            .where((0, drizzle_orm_1.eq)(schema_1.machines.id, id))];
                    case 1:
                        machine = (_a.sent())[0];
                        return [2 /*return*/, machine];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMachine = function (machine) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.machines)
                            .values(machine)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateMachine = function (id, machine) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.machines)
                            .set(machine)
                            .where((0, drizzle_orm_1.eq)(schema_1.machines.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMachine = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.machines)
                            .where((0, drizzle_orm_1.eq)(schema_1.machines.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Master Batches methods
    DatabaseStorage.prototype.getMasterBatches = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.masterBatches)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMasterBatch = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var batch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.masterBatches)
                            .where((0, drizzle_orm_1.eq)(schema_1.masterBatches.id, id))];
                    case 1:
                        batch = (_a.sent())[0];
                        return [2 /*return*/, batch];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMasterBatch = function (masterBatch) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.masterBatches)
                            .values(masterBatch)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateMasterBatch = function (id, masterBatch) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.masterBatches)
                            .set(masterBatch)
                            .where((0, drizzle_orm_1.eq)(schema_1.masterBatches.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMasterBatch = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.masterBatches)
                            .where((0, drizzle_orm_1.eq)(schema_1.masterBatches.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Customers methods
    DatabaseStorage.prototype.getCustomers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.customers)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCustomer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.customers)
                            .where((0, drizzle_orm_1.eq)(schema_1.customers.id, id))];
                    case 1:
                        customer = (_a.sent())[0];
                        return [2 /*return*/, customer];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCustomerByCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            var customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.customers)
                            .where((0, drizzle_orm_1.eq)(schema_1.customers.code, code))];
                    case 1:
                        customer = (_a.sent())[0];
                        return [2 /*return*/, customer];
                }
            });
        });
    };
    DatabaseStorage.prototype.createCustomer = function (customer) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.customers)
                            .values(customer)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateCustomer = function (id, customer) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.customers)
                            .set(customer)
                            .where((0, drizzle_orm_1.eq)(schema_1.customers.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteCustomer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.customers)
                            .where((0, drizzle_orm_1.eq)(schema_1.customers.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Customer Products methods
    DatabaseStorage.prototype.getCustomerProducts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.customerProducts)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCustomerProductsByCustomer = function (customerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.customerProducts)
                            .where((0, drizzle_orm_1.eq)(schema_1.customerProducts.customerId, customerId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCustomerProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.customerProducts)
                            .where((0, drizzle_orm_1.eq)(schema_1.customerProducts.id, id))];
                    case 1:
                        product = (_a.sent())[0];
                        return [2 /*return*/, product];
                }
            });
        });
    };
    DatabaseStorage.prototype.createCustomerProduct = function (customerProduct) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.customerProducts)
                            .values(customerProduct)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateCustomerProduct = function (id, customerProduct) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.customerProducts)
                            .set(customerProduct)
                            .where((0, drizzle_orm_1.eq)(schema_1.customerProducts.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteCustomerProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.customerProducts)
                            .where((0, drizzle_orm_1.eq)(schema_1.customerProducts.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Orders methods
    DatabaseStorage.prototype.getOrders = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.orders)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getOrder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var order;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.orders)
                            .where((0, drizzle_orm_1.eq)(schema_1.orders.id, id))];
                    case 1:
                        order = (_a.sent())[0];
                        return [2 /*return*/, order];
                }
            });
        });
    };
    DatabaseStorage.prototype.createOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.orders)
                            .values(order)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateOrder = function (id, order) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.orders)
                            .set(order)
                            .where((0, drizzle_orm_1.eq)(schema_1.orders.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteOrder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Using a transaction to ensure all deletes succeed or fail together
                        return [4 /*yield*/, db_1.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var relatedJobOrders, _i, relatedJobOrders_1, jobOrder, relatedRolls, _a, relatedRolls_1, roll, rollQualityChecks, _b, rollQualityChecks_1, check;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0: return [4 /*yield*/, tx
                                                .select()
                                                .from(schema_1.jobOrders)
                                                .where((0, drizzle_orm_1.eq)(schema_1.jobOrders.orderId, id))];
                                        case 1:
                                            relatedJobOrders = _c.sent();
                                            _i = 0, relatedJobOrders_1 = relatedJobOrders;
                                            _c.label = 2;
                                        case 2:
                                            if (!(_i < relatedJobOrders_1.length)) return [3 /*break*/, 18];
                                            jobOrder = relatedJobOrders_1[_i];
                                            return [4 /*yield*/, tx
                                                    .select()
                                                    .from(schema_1.rolls)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.rolls.jobOrderId, jobOrder.id))];
                                        case 3:
                                            relatedRolls = _c.sent();
                                            _a = 0, relatedRolls_1 = relatedRolls;
                                            _c.label = 4;
                                        case 4:
                                            if (!(_a < relatedRolls_1.length)) return [3 /*break*/, 12];
                                            roll = relatedRolls_1[_a];
                                            return [4 /*yield*/, tx
                                                    .select()
                                                    .from(schema_1.qualityChecks)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.qualityChecks.rollId, roll.id))];
                                        case 5:
                                            rollQualityChecks = _c.sent();
                                            _b = 0, rollQualityChecks_1 = rollQualityChecks;
                                            _c.label = 6;
                                        case 6:
                                            if (!(_b < rollQualityChecks_1.length)) return [3 /*break*/, 9];
                                            check = rollQualityChecks_1[_b];
                                            // 2.1.1.1 Delete corrective actions related to this quality check
                                            return [4 /*yield*/, tx
                                                    .delete(schema_1.correctiveActions)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.correctiveActions.qualityCheckId, check.id))];
                                        case 7:
                                            // 2.1.1.1 Delete corrective actions related to this quality check
                                            _c.sent();
                                            _c.label = 8;
                                        case 8:
                                            _b++;
                                            return [3 /*break*/, 6];
                                        case 9: 
                                        // 2.1.1.2 Delete the quality checks
                                        return [4 /*yield*/, tx
                                                .delete(schema_1.qualityChecks)
                                                .where((0, drizzle_orm_1.eq)(schema_1.qualityChecks.rollId, roll.id))];
                                        case 10:
                                            // 2.1.1.2 Delete the quality checks
                                            _c.sent();
                                            _c.label = 11;
                                        case 11:
                                            _a++;
                                            return [3 /*break*/, 4];
                                        case 12: 
                                        // 2.1.2 Delete the rolls
                                        return [4 /*yield*/, tx
                                                .delete(schema_1.rolls)
                                                .where((0, drizzle_orm_1.eq)(schema_1.rolls.jobOrderId, jobOrder.id))];
                                        case 13:
                                            // 2.1.2 Delete the rolls
                                            _c.sent();
                                            // 2.2 Delete quality checks related directly to the job order (not through rolls)
                                            return [4 /*yield*/, tx
                                                    .delete(schema_1.qualityChecks)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.qualityChecks.jobOrderId, jobOrder.id))];
                                        case 14:
                                            // 2.2 Delete quality checks related directly to the job order (not through rolls)
                                            _c.sent();
                                            // 2.3 Delete SMS messages related to the job order
                                            return [4 /*yield*/, tx
                                                    .delete(schema_1.smsMessages)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.jobOrderId, jobOrder.id))];
                                        case 15:
                                            // 2.3 Delete SMS messages related to the job order
                                            _c.sent();
                                            // 2.4 Delete final products related to the job order
                                            return [4 /*yield*/, tx
                                                    .delete(schema_1.finalProducts)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.finalProducts.jobOrderId, jobOrder.id))];
                                        case 16:
                                            // 2.4 Delete final products related to the job order
                                            _c.sent();
                                            _c.label = 17;
                                        case 17:
                                            _i++;
                                            return [3 /*break*/, 2];
                                        case 18: 
                                        // 3. Delete all job orders for this order
                                        return [4 /*yield*/, tx
                                                .delete(schema_1.jobOrders)
                                                .where((0, drizzle_orm_1.eq)(schema_1.jobOrders.orderId, id))];
                                        case 19:
                                            // 3. Delete all job orders for this order
                                            _c.sent();
                                            // 4. Delete SMS messages related directly to the order
                                            return [4 /*yield*/, tx
                                                    .delete(schema_1.smsMessages)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.orderId, id))];
                                        case 20:
                                            // 4. Delete SMS messages related directly to the order
                                            _c.sent();
                                            // 5. Finally delete the order itself
                                            return [4 /*yield*/, tx
                                                    .delete(schema_1.orders)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.orders.id, id))];
                                        case 21:
                                            // 5. Finally delete the order itself
                                            _c.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        // Using a transaction to ensure all deletes succeed or fail together
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_8 = _a.sent();
                        console.error("Error deleting order:", error_8);
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Job Orders methods
    DatabaseStorage.prototype.getJobOrders = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.jobOrders)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getJobOrdersByOrder = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.jobOrders)
                            .where((0, drizzle_orm_1.eq)(schema_1.jobOrders.orderId, orderId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getJobOrder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var jobOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.jobOrders)
                            .where((0, drizzle_orm_1.eq)(schema_1.jobOrders.id, id))];
                    case 1:
                        jobOrder = (_a.sent())[0];
                        return [2 /*return*/, jobOrder];
                }
            });
        });
    };
    DatabaseStorage.prototype.createJobOrder = function (jobOrder) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.jobOrders)
                            .values(jobOrder)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateJobOrder = function (id, jobOrder) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.jobOrders)
                            .set(jobOrder)
                            .where((0, drizzle_orm_1.eq)(schema_1.jobOrders.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteJobOrder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.jobOrders)
                            .where((0, drizzle_orm_1.eq)(schema_1.jobOrders.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Rolls methods
    DatabaseStorage.prototype.getRolls = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.rolls)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRollsByJobOrder = function (jobOrderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.rolls)
                            .where((0, drizzle_orm_1.eq)(schema_1.rolls.jobOrderId, jobOrderId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRollsByStage = function (stage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.rolls)
                            .where((0, drizzle_orm_1.eq)(schema_1.rolls.currentStage, stage))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRoll = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var roll;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.rolls)
                            .where((0, drizzle_orm_1.eq)(schema_1.rolls.id, id))];
                    case 1:
                        roll = (_a.sent())[0];
                        return [2 /*return*/, roll];
                }
            });
        });
    };
    DatabaseStorage.prototype.createRoll = function (roll) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.rolls)
                            .values(roll)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateRoll = function (id, roll) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.rolls)
                            .set(roll)
                            .where((0, drizzle_orm_1.eq)(schema_1.rolls.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteRoll = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.rolls)
                            .where((0, drizzle_orm_1.eq)(schema_1.rolls.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Raw Materials methods
    DatabaseStorage.prototype.getRawMaterials = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.rawMaterials)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRawMaterial = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var material;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.rawMaterials)
                            .where((0, drizzle_orm_1.eq)(schema_1.rawMaterials.id, id))];
                    case 1:
                        material = (_a.sent())[0];
                        return [2 /*return*/, material];
                }
            });
        });
    };
    DatabaseStorage.prototype.createRawMaterial = function (rawMaterial) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.rawMaterials)
                            .values(rawMaterial)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateRawMaterial = function (id, rawMaterial) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.rawMaterials)
                            .set(rawMaterial)
                            .where((0, drizzle_orm_1.eq)(schema_1.rawMaterials.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteRawMaterial = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.rawMaterials)
                            .where((0, drizzle_orm_1.eq)(schema_1.rawMaterials.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Final Products methods
    DatabaseStorage.prototype.getFinalProducts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.finalProducts)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getFinalProductsByJobOrder = function (jobOrderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.finalProducts)
                            .where((0, drizzle_orm_1.eq)(schema_1.finalProducts.jobOrderId, jobOrderId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getFinalProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.finalProducts)
                            .where((0, drizzle_orm_1.eq)(schema_1.finalProducts.id, id))];
                    case 1:
                        product = (_a.sent())[0];
                        return [2 /*return*/, product];
                }
            });
        });
    };
    DatabaseStorage.prototype.createFinalProduct = function (finalProduct) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.finalProducts)
                            .values(finalProduct)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateFinalProduct = function (id, finalProduct) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.finalProducts)
                            .set(finalProduct)
                            .where((0, drizzle_orm_1.eq)(schema_1.finalProducts.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteFinalProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.finalProducts)
                            .where((0, drizzle_orm_1.eq)(schema_1.finalProducts.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Quality Check Types methods
    DatabaseStorage.prototype.getQualityCheckTypes = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.qualityCheckTypes)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityCheckTypesByStage = function (stage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityCheckTypes)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityCheckTypes.targetStage, stage))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityCheckType = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var checkType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityCheckTypes)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityCheckTypes.id, id))];
                    case 1:
                        checkType = (_a.sent())[0];
                        return [2 /*return*/, checkType];
                }
            });
        });
    };
    DatabaseStorage.prototype.createQualityCheckType = function (qualityCheckType) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.qualityCheckTypes)
                            .values(qualityCheckType)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateQualityCheckType = function (id, qualityCheckType) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.qualityCheckTypes)
                            .set(qualityCheckType)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityCheckTypes.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteQualityCheckType = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.qualityCheckTypes)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityCheckTypes.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Quality Checks methods
    DatabaseStorage.prototype.getQualityChecks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pool_1, adaptToFrontend_1, query, result, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./db'); })];
                    case 1:
                        pool_1 = (_a.sent()).pool;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./quality-check-adapter'); })];
                    case 2:
                        adaptToFrontend_1 = (_a.sent()).adaptToFrontend;
                        query = "\n        SELECT * FROM quality_checks \n        ORDER BY checked_at DESC\n      ";
                        return [4 /*yield*/, pool_1.query(query)];
                    case 3:
                        result = _a.sent();
                        if (!result || !result.rows) {
                            return [2 /*return*/, []];
                        }
                        // Convert all database records to frontend format
                        return [2 /*return*/, result.rows.map(function (row) { return adaptToFrontend_1(row); })];
                    case 4:
                        error_9 = _a.sent();
                        console.error("Error fetching quality checks:", error_9);
                        return [2 /*return*/, []];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityChecksByRoll = function (rollId) {
        return __awaiter(this, void 0, void 0, function () {
            var pool_2, adaptToFrontend_2, query, result, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./db'); })];
                    case 1:
                        pool_2 = (_a.sent()).pool;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./quality-check-adapter'); })];
                    case 2:
                        adaptToFrontend_2 = (_a.sent()).adaptToFrontend;
                        query = "\n        SELECT * FROM quality_checks \n        WHERE roll_id = $1\n        ORDER BY checked_at DESC\n      ";
                        return [4 /*yield*/, pool_2.query(query, [rollId])];
                    case 3:
                        result = _a.sent();
                        if (!result || !result.rows) {
                            return [2 /*return*/, []];
                        }
                        // Convert all database records to frontend format
                        return [2 /*return*/, result.rows.map(function (row) { return adaptToFrontend_2(row); })];
                    case 4:
                        error_10 = _a.sent();
                        console.error("Error fetching quality checks for roll ".concat(rollId, ":"), error_10);
                        return [2 /*return*/, []];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityChecksByJobOrder = function (jobOrderId) {
        return __awaiter(this, void 0, void 0, function () {
            var pool_3, adaptToFrontend_3, query, result, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./db'); })];
                    case 1:
                        pool_3 = (_a.sent()).pool;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./quality-check-adapter'); })];
                    case 2:
                        adaptToFrontend_3 = (_a.sent()).adaptToFrontend;
                        query = "\n        SELECT * FROM quality_checks \n        WHERE job_order_id = $1\n        ORDER BY checked_at DESC\n      ";
                        return [4 /*yield*/, pool_3.query(query, [jobOrderId])];
                    case 3:
                        result = _a.sent();
                        if (!result || !result.rows) {
                            return [2 /*return*/, []];
                        }
                        // Convert all database records to frontend format
                        return [2 /*return*/, result.rows.map(function (row) { return adaptToFrontend_3(row); })];
                    case 4:
                        error_11 = _a.sent();
                        console.error("Error fetching quality checks for job order ".concat(jobOrderId, ":"), error_11);
                        return [2 /*return*/, []];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityCheck = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var pool_4, adaptToFrontend, query, result, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./db'); })];
                    case 1:
                        pool_4 = (_a.sent()).pool;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./quality-check-adapter'); })];
                    case 2:
                        adaptToFrontend = (_a.sent()).adaptToFrontend;
                        query = "\n        SELECT * FROM quality_checks WHERE id = $1\n      ";
                        return [4 /*yield*/, pool_4.query(query, [id])];
                    case 3:
                        result = _a.sent();
                        if (!result || !result.rows || result.rows.length === 0) {
                            return [2 /*return*/, undefined];
                        }
                        // Map the database record to frontend format
                        return [2 /*return*/, adaptToFrontend(result.rows[0])];
                    case 4:
                        error_12 = _a.sent();
                        console.error("Error fetching quality check:", error_12);
                        throw error_12;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.createQualityCheck = function (qualityCheckData) {
        return __awaiter(this, void 0, void 0, function () {
            var pool_5, adaptToFrontend, query, values, result, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        console.log("Creating quality check with data in storage function:", qualityCheckData);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./db'); })];
                    case 1:
                        pool_5 = (_a.sent()).pool;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./quality-check-adapter'); })];
                    case 2:
                        adaptToFrontend = (_a.sent()).adaptToFrontend;
                        query = "\n        INSERT INTO quality_checks \n        (check_type_id, checked_by, job_order_id, roll_id, status, notes, checked_at, created_at)\n        VALUES \n        ($1, $2, $3, $4, $5, $6, $7, $8)\n        RETURNING *;\n      ";
                        values = [
                            qualityCheckData.check_type_id,
                            qualityCheckData.checked_by,
                            qualityCheckData.job_order_id,
                            qualityCheckData.roll_id,
                            qualityCheckData.status,
                            qualityCheckData.notes,
                            qualityCheckData.checked_at || new Date(),
                            qualityCheckData.created_at || new Date()
                        ];
                        console.log("Executing SQL with values:", values);
                        return [4 /*yield*/, pool_5.query(query, values)];
                    case 3:
                        result = _a.sent();
                        if (!result || !result.rows || result.rows.length === 0) {
                            throw new Error("No result returned from quality check creation");
                        }
                        console.log("Successfully created quality check:", result.rows[0]);
                        // Map the database record back to the expected frontend format using the adapter
                        return [2 /*return*/, adaptToFrontend(result.rows[0])];
                    case 4:
                        error_13 = _a.sent();
                        console.error("Database error creating quality check:", error_13);
                        throw error_13;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateQualityCheck = function (id, qualityCheckData) {
        return __awaiter(this, void 0, void 0, function () {
            var pool_6, _a, adaptToDatabase, adaptToFrontend, dbQualityCheck, updateFields, values, paramIndex, query, result, error_14;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./db'); })];
                    case 1:
                        pool_6 = (_b.sent()).pool;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./quality-check-adapter'); })];
                    case 2:
                        _a = _b.sent(), adaptToDatabase = _a.adaptToDatabase, adaptToFrontend = _a.adaptToFrontend;
                        dbQualityCheck = adaptToDatabase(qualityCheckData);
                        updateFields = [];
                        values = [];
                        paramIndex = 1;
                        // Only include fields that are provided in the update
                        if (dbQualityCheck.check_type_id !== undefined) {
                            updateFields.push("check_type_id = $".concat(paramIndex++));
                            values.push(dbQualityCheck.check_type_id);
                        }
                        if (dbQualityCheck.checked_by !== undefined) {
                            updateFields.push("checked_by = $".concat(paramIndex++));
                            values.push(dbQualityCheck.checked_by);
                        }
                        if (dbQualityCheck.job_order_id !== undefined) {
                            updateFields.push("job_order_id = $".concat(paramIndex++));
                            values.push(dbQualityCheck.job_order_id);
                        }
                        if (dbQualityCheck.roll_id !== undefined) {
                            updateFields.push("roll_id = $".concat(paramIndex++));
                            values.push(dbQualityCheck.roll_id);
                        }
                        if (dbQualityCheck.status !== undefined) {
                            updateFields.push("status = $".concat(paramIndex++));
                            values.push(dbQualityCheck.status);
                        }
                        if (dbQualityCheck.notes !== undefined) {
                            updateFields.push("notes = $".concat(paramIndex++));
                            values.push(dbQualityCheck.notes);
                        }
                        if (dbQualityCheck.checklist_results !== undefined) {
                            updateFields.push("checklist_results = $".concat(paramIndex++));
                            values.push(dbQualityCheck.checklist_results);
                        }
                        if (dbQualityCheck.parameter_values !== undefined) {
                            updateFields.push("parameter_values = $".concat(paramIndex++));
                            values.push(dbQualityCheck.parameter_values);
                        }
                        if (dbQualityCheck.issue_severity !== undefined) {
                            updateFields.push("issue_severity = $".concat(paramIndex++));
                            values.push(dbQualityCheck.issue_severity);
                        }
                        if (dbQualityCheck.image_urls !== undefined) {
                            updateFields.push("image_urls = $".concat(paramIndex++));
                            values.push(dbQualityCheck.image_urls);
                        }
                        // If no fields to update, return undefined
                        if (updateFields.length === 0) {
                            return [2 /*return*/, undefined];
                        }
                        // Add the ID as the last parameter
                        values.push(id);
                        query = "\n        UPDATE quality_checks \n        SET ".concat(updateFields.join(', '), "\n        WHERE id = $").concat(paramIndex, "\n        RETURNING *\n      ");
                        return [4 /*yield*/, pool_6.query(query, values)];
                    case 3:
                        result = _b.sent();
                        if (!result || !result.rows || result.rows.length === 0) {
                            return [2 /*return*/, undefined];
                        }
                        // Map the updated database record back to frontend format
                        return [2 /*return*/, adaptToFrontend(result.rows[0])];
                    case 4:
                        error_14 = _b.sent();
                        console.error("Error updating quality check ".concat(id, ":"), error_14);
                        throw error_14;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteQualityCheck = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.qualityChecks)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityChecks.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Corrective Actions methods
    DatabaseStorage.prototype.getCorrectiveActions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.correctiveActions)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCorrectiveActionsByQualityCheck = function (qualityCheckId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.correctiveActions)
                            .where((0, drizzle_orm_1.eq)(schema_1.correctiveActions.qualityCheckId, qualityCheckId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCorrectiveAction = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var action;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.correctiveActions)
                            .where((0, drizzle_orm_1.eq)(schema_1.correctiveActions.id, id))];
                    case 1:
                        action = (_a.sent())[0];
                        return [2 /*return*/, action];
                }
            });
        });
    };
    DatabaseStorage.prototype.createCorrectiveAction = function (correctiveAction) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.correctiveActions)
                            .values(correctiveAction)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateCorrectiveAction = function (id, correctiveAction) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.correctiveActions)
                            .set(correctiveAction)
                            .where((0, drizzle_orm_1.eq)(schema_1.correctiveActions.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteCorrectiveAction = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.correctiveActions)
                            .where((0, drizzle_orm_1.eq)(schema_1.correctiveActions.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Quality Violations methods
    DatabaseStorage.prototype.getQualityViolations = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.qualityViolations)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityViolationsByQualityCheck = function (qualityCheckId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityViolations)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityViolations.qualityCheckId, qualityCheckId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityViolationsByUser = function (reportedBy) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityViolations)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityViolations.reportedBy, reportedBy))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityViolationsBySeverity = function (severity) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityViolations)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityViolations.severity, severity))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityViolationsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityViolations)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityViolations.status, status))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityViolationsByDateRange = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityViolations)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.qualityViolations.reportDate, startDate), (0, drizzle_orm_1.lte)(schema_1.qualityViolations.reportDate, endDate)))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityViolation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var violation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityViolations)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityViolations.id, id))];
                    case 1:
                        violation = (_a.sent())[0];
                        return [2 /*return*/, violation];
                }
            });
        });
    };
    DatabaseStorage.prototype.createQualityViolation = function (violation) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.qualityViolations)
                            .values(__assign(__assign({}, violation), { reportDate: new Date() }))
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateQualityViolation = function (id, violation) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.qualityViolations)
                            .set(violation)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityViolations.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteQualityViolation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.qualityViolations)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityViolations.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Quality Penalties methods
    DatabaseStorage.prototype.getQualityPenalties = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.qualityPenalties)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityPenaltiesByViolation = function (violationId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityPenalties)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityPenalties.violationId, violationId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityPenaltiesByUser = function (assignedTo) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityPenalties)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityPenalties.assignedTo, assignedTo))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityPenaltiesByType = function (penaltyType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityPenalties)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityPenalties.penaltyType, penaltyType))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityPenaltiesByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityPenalties)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityPenalties.status, status))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityPenaltiesByDateRange = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityPenalties)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.qualityPenalties.startDate, startDate), (0, drizzle_orm_1.lte)(schema_1.qualityPenalties.startDate, endDate)))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getQualityPenalty = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var penalty;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.qualityPenalties)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityPenalties.id, id))];
                    case 1:
                        penalty = (_a.sent())[0];
                        return [2 /*return*/, penalty];
                }
            });
        });
    };
    DatabaseStorage.prototype.createQualityPenalty = function (penalty) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.qualityPenalties)
                            .values(penalty)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateQualityPenalty = function (id, penalty) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.qualityPenalties)
                            .set(penalty)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityPenalties.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteQualityPenalty = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.qualityPenalties)
                            .where((0, drizzle_orm_1.eq)(schema_1.qualityPenalties.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // SMS Messages methods
    DatabaseStorage.prototype.getSmsMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.smsMessages)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSmsMessagesByOrder = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.smsMessages)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.orderId, orderId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSmsMessagesByJobOrder = function (jobOrderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.smsMessages)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.jobOrderId, jobOrderId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSmsMessagesByCustomer = function (customerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.smsMessages)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.customerId, customerId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSmsMessage = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.smsMessages)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.id, id))];
                    case 1:
                        message = (_a.sent())[0];
                        return [2 /*return*/, message];
                }
            });
        });
    };
    DatabaseStorage.prototype.createSmsMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.smsMessages)
                            .values(message)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateSmsMessage = function (id, message) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.smsMessages)
                            .set(message)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteSmsMessage = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.smsMessages)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Mix Materials methods
    DatabaseStorage.prototype.getMixMaterials = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.mixMaterials)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMixMaterial = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var mix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.mixMaterials)
                            .where((0, drizzle_orm_1.eq)(schema_1.mixMaterials.id, id))];
                    case 1:
                        mix = (_a.sent())[0];
                        return [2 /*return*/, mix];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMixMaterial = function (mix) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.mixMaterials)
                            .values(mix)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateMixMaterial = function (id, mix) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.mixMaterials)
                            .set(mix)
                            .where((0, drizzle_orm_1.eq)(schema_1.mixMaterials.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMixMaterial = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_15;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Using a transaction to ensure all deletes succeed or fail together
                        return [4 /*yield*/, db_1.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: 
                                        // 1. Delete all mix items associated with this mix material
                                        return [4 /*yield*/, tx
                                                .delete(schema_1.mixItems)
                                                .where((0, drizzle_orm_1.eq)(schema_1.mixItems.mixId, id))];
                                        case 1:
                                            // 1. Delete all mix items associated with this mix material
                                            _a.sent();
                                            // 2. Delete all mix machine associations
                                            return [4 /*yield*/, tx
                                                    .delete(schema_1.mixMachines)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.mixMachines.mixId, id))];
                                        case 2:
                                            // 2. Delete all mix machine associations
                                            _a.sent();
                                            // 3. Finally delete the mix material itself
                                            return [4 /*yield*/, tx
                                                    .delete(schema_1.mixMaterials)
                                                    .where((0, drizzle_orm_1.eq)(schema_1.mixMaterials.id, id))];
                                        case 3:
                                            // 3. Finally delete the mix material itself
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        // Using a transaction to ensure all deletes succeed or fail together
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_15 = _a.sent();
                        console.error("Error deleting mix material:", error_15);
                        throw error_15;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Mix Machines methods
    DatabaseStorage.prototype.getMixMachines = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.mixMachines)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMixMachinesByMixId = function (mixId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.mixMachines)
                            .where((0, drizzle_orm_1.eq)(schema_1.mixMachines.mixId, mixId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMixMachine = function (mixMachine) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.mixMachines)
                            .values(mixMachine)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMixMachinesByMixId = function (mixId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.mixMachines)
                            .where((0, drizzle_orm_1.eq)(schema_1.mixMachines.mixId, mixId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Mix Items methods
    DatabaseStorage.prototype.getMixItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.mixItems)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMixItemsByMix = function (mixId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.mixItems)
                            .where((0, drizzle_orm_1.eq)(schema_1.mixItems.mixId, mixId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMixItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.mixItems)
                            .where((0, drizzle_orm_1.eq)(schema_1.mixItems.id, id))];
                    case 1:
                        item = (_a.sent())[0];
                        return [2 /*return*/, item];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMixItem = function (mixItem) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.mixItems)
                            .values(mixItem)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateMixItem = function (id, mixItem) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.mixItems)
                            .set(mixItem)
                            .where((0, drizzle_orm_1.eq)(schema_1.mixItems.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMixItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.mixItems)
                            .where((0, drizzle_orm_1.eq)(schema_1.mixItems.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // SMS Template methods
    DatabaseStorage.prototype.getSmsTemplates = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.smsTemplates)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSmsTemplate = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var template;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.smsTemplates)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsTemplates.id, id))];
                    case 1:
                        template = (_a.sent())[0];
                        return [2 /*return*/, template];
                }
            });
        });
    };
    DatabaseStorage.prototype.createSmsTemplate = function (template) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.smsTemplates)
                            .values(template)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateSmsTemplate = function (id, template) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.smsTemplates)
                            .set(template)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsTemplates.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteSmsTemplate = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.smsTemplates).where((0, drizzle_orm_1.eq)(schema_1.smsTemplates.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // SMS Notification Rules methods
    DatabaseStorage.prototype.getSmsNotificationRules = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.smsNotificationRules)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSmsNotificationRule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var rule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.smsNotificationRules)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsNotificationRules.id, id))];
                    case 1:
                        rule = (_a.sent())[0];
                        return [2 /*return*/, rule];
                }
            });
        });
    };
    DatabaseStorage.prototype.createSmsNotificationRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.smsNotificationRules)
                            .values(rule)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateSmsNotificationRule = function (id, rule) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.smsNotificationRules)
                            .set(rule)
                            .where((0, drizzle_orm_1.eq)(schema_1.smsNotificationRules.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteSmsNotificationRule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.smsNotificationRules).where((0, drizzle_orm_1.eq)(schema_1.smsNotificationRules.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Material Inputs methods
    DatabaseStorage.prototype.getMaterialInputs = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.materialInputs)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaterialInput = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var input;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.materialInputs)
                            .where((0, drizzle_orm_1.eq)(schema_1.materialInputs.id, id))];
                    case 1:
                        input = (_a.sent())[0];
                        return [2 /*return*/, input];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMaterialInput = function (materialInput) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.materialInputs)
                            .values(materialInput)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateMaterialInput = function (id, materialInput) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.materialInputs)
                            .set(materialInput)
                            .where((0, drizzle_orm_1.eq)(schema_1.materialInputs.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMaterialInput = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.materialInputs)
                            .where((0, drizzle_orm_1.eq)(schema_1.materialInputs.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Material Input Items methods
    DatabaseStorage.prototype.getMaterialInputItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.materialInputItems)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaterialInputItemsByInput = function (inputId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.materialInputItems)
                            .where((0, drizzle_orm_1.eq)(schema_1.materialInputItems.inputId, inputId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaterialInputItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.materialInputItems)
                            .where((0, drizzle_orm_1.eq)(schema_1.materialInputItems.id, id))];
                    case 1:
                        item = (_a.sent())[0];
                        return [2 /*return*/, item];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMaterialInputItem = function (item) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.materialInputItems)
                            .values(item)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMaterialInputItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.materialInputItems)
                            .where((0, drizzle_orm_1.eq)(schema_1.materialInputItems.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Cliché (Plate) Pricing Parameters methods
    DatabaseStorage.prototype.getPlatePricingParameters = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.platePricingParameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPlatePricingParameterByType = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            var param;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.platePricingParameters)
                            .where((0, drizzle_orm_1.eq)(schema_1.platePricingParameters.type, type))];
                    case 1:
                        param = (_a.sent())[0];
                        return [2 /*return*/, param];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPlatePricingParameter = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var param;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.platePricingParameters)
                            .where((0, drizzle_orm_1.eq)(schema_1.platePricingParameters.id, id))];
                    case 1:
                        param = (_a.sent())[0];
                        return [2 /*return*/, param];
                }
            });
        });
    };
    DatabaseStorage.prototype.createPlatePricingParameter = function (param) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.platePricingParameters)
                            .values(param)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updatePlatePricingParameter = function (id, update) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.platePricingParameters)
                            .set(update)
                            .where((0, drizzle_orm_1.eq)(schema_1.platePricingParameters.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deletePlatePricingParameter = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.platePricingParameters)
                            .where((0, drizzle_orm_1.eq)(schema_1.platePricingParameters.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Plate Calculations methods
    DatabaseStorage.prototype.getPlateCalculations = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.plateCalculations)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPlateCalculationsByCustomer = function (customerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.plateCalculations)
                            .where((0, drizzle_orm_1.eq)(schema_1.plateCalculations.customerId, customerId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPlateCalculation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var calculation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.plateCalculations)
                            .where((0, drizzle_orm_1.eq)(schema_1.plateCalculations.id, id))];
                    case 1:
                        calculation = (_a.sent())[0];
                        return [2 /*return*/, calculation];
                }
            });
        });
    };
    DatabaseStorage.prototype.createPlateCalculation = function (calculation) {
        return __awaiter(this, void 0, void 0, function () {
            var area, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        area = calculation.width * calculation.height;
                        return [4 /*yield*/, db_1.db
                                .insert(schema_1.plateCalculations)
                                .values(__assign(__assign({}, calculation), { area: area, calculatedPrice: 0 // Will be calculated by the calling function
                             }))
                                .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updatePlateCalculation = function (id, update) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.plateCalculations)
                            .set(update)
                            .where((0, drizzle_orm_1.eq)(schema_1.plateCalculations.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deletePlateCalculation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.plateCalculations)
                            .where((0, drizzle_orm_1.eq)(schema_1.plateCalculations.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // ABA Material Configurations methods
    DatabaseStorage.prototype.getAbaMaterialConfigs = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.abaMaterialConfigs)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAbaMaterialConfigsByUser = function (createdBy) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.abaMaterialConfigs)
                            .where((0, drizzle_orm_1.eq)(schema_1.abaMaterialConfigs.createdBy, createdBy))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAbaMaterialConfig = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.abaMaterialConfigs)
                            .where((0, drizzle_orm_1.eq)(schema_1.abaMaterialConfigs.id, id))];
                    case 1:
                        config = (_a.sent())[0];
                        return [2 /*return*/, config];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDefaultAbaMaterialConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.abaMaterialConfigs)
                            .where((0, drizzle_orm_1.eq)(schema_1.abaMaterialConfigs.isDefault, true))];
                    case 1:
                        config = (_a.sent())[0];
                        return [2 /*return*/, config];
                }
            });
        });
    };
    DatabaseStorage.prototype.createAbaMaterialConfig = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.abaMaterialConfigs)
                            .values(config)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateAbaMaterialConfig = function (id, update) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.abaMaterialConfigs)
                            .set(update)
                            .where((0, drizzle_orm_1.eq)(schema_1.abaMaterialConfigs.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteAbaMaterialConfig = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .delete(schema_1.abaMaterialConfigs)
                            .where((0, drizzle_orm_1.eq)(schema_1.abaMaterialConfigs.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    DatabaseStorage.prototype.setDefaultAbaMaterialConfig = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // First, set all configs to not default
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.abaMaterialConfigs)
                            .set({ isDefault: false })];
                    case 1:
                        // First, set all configs to not default
                        _a.sent();
                        return [4 /*yield*/, db_1.db
                                .update(schema_1.abaMaterialConfigs)
                                .set({ isDefault: true })
                                .where((0, drizzle_orm_1.eq)(schema_1.abaMaterialConfigs.id, id))
                                .returning()];
                    case 2:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, !!updated];
                }
            });
        });
    };
    // HR Module Methods
    // Time Attendance
    DatabaseStorage.prototype.getAllTimeAttendance = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.timeAttendance)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTimeAttendanceByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.timeAttendance).where((0, drizzle_orm_1.eq)(schema_1.timeAttendance.userId, userId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTimeAttendanceByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var startOfDay, endOfDay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startOfDay = new Date(date);
                        startOfDay.setHours(0, 0, 0, 0);
                        endOfDay = new Date(date);
                        endOfDay.setHours(23, 59, 59, 999);
                        return [4 /*yield*/, db_1.db.select().from(schema_1.timeAttendance)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.timeAttendance.date, startOfDay), (0, drizzle_orm_1.lte)(schema_1.timeAttendance.date, endOfDay)))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTimeAttendanceByUserAndDate = function (userId, date) {
        return __awaiter(this, void 0, void 0, function () {
            var startOfDay, endOfDay, attendance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startOfDay = new Date(date);
                        startOfDay.setHours(0, 0, 0, 0);
                        endOfDay = new Date(date);
                        endOfDay.setHours(23, 59, 59, 999);
                        return [4 /*yield*/, db_1.db.select().from(schema_1.timeAttendance)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.timeAttendance.userId, userId), (0, drizzle_orm_1.gte)(schema_1.timeAttendance.date, startOfDay), (0, drizzle_orm_1.lte)(schema_1.timeAttendance.date, endOfDay)))];
                    case 1:
                        attendance = (_a.sent())[0];
                        return [2 /*return*/, attendance || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTimeAttendance = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var attendance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.timeAttendance).where((0, drizzle_orm_1.eq)(schema_1.timeAttendance.id, id))];
                    case 1:
                        attendance = (_a.sent())[0];
                        return [2 /*return*/, attendance || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createTimeAttendance = function (attendanceData) {
        return __awaiter(this, void 0, void 0, function () {
            var attendance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.timeAttendance)
                            .values(attendanceData)
                            .returning()];
                    case 1:
                        attendance = (_a.sent())[0];
                        return [2 /*return*/, attendance];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateTimeAttendance = function (id, attendanceData) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.timeAttendance)
                            .set(attendanceData)
                            .where((0, drizzle_orm_1.eq)(schema_1.timeAttendance.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteTimeAttendance = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.timeAttendance).where((0, drizzle_orm_1.eq)(schema_1.timeAttendance.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Employee of the Month
    DatabaseStorage.prototype.getEmployeeOfMonth = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.employeeOfMonth)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEmployeeOfMonthByYear = function (year) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.employeeOfMonth).where((0, drizzle_orm_1.eq)(schema_1.employeeOfMonth.year, year))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEmployeeOfMonthByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.employeeOfMonth).where((0, drizzle_orm_1.eq)(schema_1.employeeOfMonth.userId, userId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEmployeeOfMonthRecord = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.employeeOfMonth).where((0, drizzle_orm_1.eq)(schema_1.employeeOfMonth.id, id))];
                    case 1:
                        record = (_a.sent())[0];
                        return [2 /*return*/, record || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createEmployeeOfMonth = function (employeeData) {
        return __awaiter(this, void 0, void 0, function () {
            var employee;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.employeeOfMonth)
                            .values(employeeData)
                            .returning()];
                    case 1:
                        employee = (_a.sent())[0];
                        return [2 /*return*/, employee];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateEmployeeOfMonth = function (id, employeeData) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.employeeOfMonth)
                            .set(employeeData)
                            .where((0, drizzle_orm_1.eq)(schema_1.employeeOfMonth.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteEmployeeOfMonth = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.employeeOfMonth).where((0, drizzle_orm_1.eq)(schema_1.employeeOfMonth.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // HR Violations
    DatabaseStorage.prototype.getHrViolations = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrViolations)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrViolationsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrViolations).where((0, drizzle_orm_1.eq)(schema_1.hrViolations.userId, userId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrViolationsByReporter = function (reportedBy) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrViolations).where((0, drizzle_orm_1.eq)(schema_1.hrViolations.reportedBy, reportedBy))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrViolationsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrViolations).where((0, drizzle_orm_1.eq)(schema_1.hrViolations.status, status))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrViolationsBySeverity = function (severity) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrViolations).where((0, drizzle_orm_1.eq)(schema_1.hrViolations.severity, severity))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrViolation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var violation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrViolations).where((0, drizzle_orm_1.eq)(schema_1.hrViolations.id, id))];
                    case 1:
                        violation = (_a.sent())[0];
                        return [2 /*return*/, violation || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createHrViolation = function (violationData) {
        return __awaiter(this, void 0, void 0, function () {
            var violation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.hrViolations)
                            .values(violationData)
                            .returning()];
                    case 1:
                        violation = (_a.sent())[0];
                        return [2 /*return*/, violation];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateHrViolation = function (id, violationData) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.hrViolations)
                            .set(violationData)
                            .where((0, drizzle_orm_1.eq)(schema_1.hrViolations.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteHrViolation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.hrViolations).where((0, drizzle_orm_1.eq)(schema_1.hrViolations.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // HR Complaints
    DatabaseStorage.prototype.getHrComplaints = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrComplaints)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrComplaintsByComplainant = function (complainantId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrComplaints).where((0, drizzle_orm_1.eq)(schema_1.hrComplaints.complainantId, complainantId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrComplaintsByAgainstUser = function (againstUserId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrComplaints).where((0, drizzle_orm_1.eq)(schema_1.hrComplaints.againstUserId, againstUserId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrComplaintsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrComplaints).where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.hrComplaints.complainantId, userId), (0, drizzle_orm_1.eq)(schema_1.hrComplaints.againstUserId, userId)))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrComplaintsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrComplaints).where((0, drizzle_orm_1.eq)(schema_1.hrComplaints.status, status))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHrComplaintsByAssignee = function (assignedTo) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Note: HR complaints don't have assignedTo field in current schema
                // This method returns empty array until schema is updated
                return [2 /*return*/, []];
            });
        });
    };
    DatabaseStorage.prototype.getHrComplaint = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var complaint;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.hrComplaints).where((0, drizzle_orm_1.eq)(schema_1.hrComplaints.id, id))];
                    case 1:
                        complaint = (_a.sent())[0];
                        return [2 /*return*/, complaint || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.createHrComplaint = function (complaintData) {
        return __awaiter(this, void 0, void 0, function () {
            var complaint;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.hrComplaints)
                            .values(complaintData)
                            .returning()];
                    case 1:
                        complaint = (_a.sent())[0];
                        return [2 /*return*/, complaint];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateHrComplaint = function (id, complaintData) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.hrComplaints)
                            .set(complaintData)
                            .where((0, drizzle_orm_1.eq)(schema_1.hrComplaints.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteHrComplaint = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.hrComplaints).where((0, drizzle_orm_1.eq)(schema_1.hrComplaints.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Maintenance Requests methods
    DatabaseStorage.prototype.getMaintenanceRequests = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceRequests).orderBy((0, drizzle_orm_1.desc)(schema_1.maintenanceRequests.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaintenanceRequest = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceRequests).where((0, drizzle_orm_1.eq)(schema_1.maintenanceRequests.id, id))];
                    case 1:
                        request = (_a.sent())[0];
                        return [2 /*return*/, request || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaintenanceRequestsByMachine = function (machineId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceRequests)
                            .where((0, drizzle_orm_1.eq)(schema_1.maintenanceRequests.machineId, machineId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.maintenanceRequests.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaintenanceRequestsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceRequests)
                            .where((0, drizzle_orm_1.eq)(schema_1.maintenanceRequests.status, status))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.maintenanceRequests.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaintenanceRequestsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceRequests)
                            .where((0, drizzle_orm_1.eq)(schema_1.maintenanceRequests.requestedBy, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.maintenanceRequests.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMaintenanceRequest = function (requestData) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.maintenanceRequests)
                            .values(requestData)
                            .returning()];
                    case 1:
                        request = (_a.sent())[0];
                        return [2 /*return*/, request];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateMaintenanceRequest = function (id, requestData) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.maintenanceRequests)
                            .set(requestData)
                            .where((0, drizzle_orm_1.eq)(schema_1.maintenanceRequests.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMaintenanceRequest = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.maintenanceRequests).where((0, drizzle_orm_1.eq)(schema_1.maintenanceRequests.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Maintenance Actions methods
    DatabaseStorage.prototype.getMaintenanceActions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceActions).orderBy((0, drizzle_orm_1.desc)(schema_1.maintenanceActions.actionDate))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaintenanceAction = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var action;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceActions).where((0, drizzle_orm_1.eq)(schema_1.maintenanceActions.id, id))];
                    case 1:
                        action = (_a.sent())[0];
                        return [2 /*return*/, action || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaintenanceActionsByRequest = function (requestId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceActions)
                            .where((0, drizzle_orm_1.eq)(schema_1.maintenanceActions.requestId, requestId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.maintenanceActions.actionDate))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaintenanceActionsByMachine = function (machineId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceActions)
                            .where((0, drizzle_orm_1.eq)(schema_1.maintenanceActions.machineId, machineId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.maintenanceActions.actionDate))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMaintenanceAction = function (actionData) {
        return __awaiter(this, void 0, void 0, function () {
            var action;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.maintenanceActions)
                            .values(actionData)
                            .returning()];
                    case 1:
                        action = (_a.sent())[0];
                        return [2 /*return*/, action];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateMaintenanceAction = function (id, actionData) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.maintenanceActions)
                            .set(actionData)
                            .where((0, drizzle_orm_1.eq)(schema_1.maintenanceActions.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMaintenanceAction = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.maintenanceActions).where((0, drizzle_orm_1.eq)(schema_1.maintenanceActions.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Maintenance Schedule methods
    DatabaseStorage.prototype.getMaintenanceSchedules = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceSchedule).orderBy((0, drizzle_orm_1.asc)(schema_1.maintenanceSchedule.nextDue))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaintenanceSchedule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var schedule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceSchedule).where((0, drizzle_orm_1.eq)(schema_1.maintenanceSchedule.id, id))];
                    case 1:
                        schedule = (_a.sent())[0];
                        return [2 /*return*/, schedule || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMaintenanceSchedulesByMachine = function (machineId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceSchedule)
                            .where((0, drizzle_orm_1.eq)(schema_1.maintenanceSchedule.machineId, machineId))
                            .orderBy((0, drizzle_orm_1.asc)(schema_1.maintenanceSchedule.nextDue))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getOverdueMaintenanceSchedules = function () {
        return __awaiter(this, void 0, void 0, function () {
            var today;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        today = new Date();
                        return [4 /*yield*/, db_1.db.select().from(schema_1.maintenanceSchedule)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.maintenanceSchedule.status, "active"), (0, drizzle_orm_1.lte)(schema_1.maintenanceSchedule.nextDue, today)))
                                .orderBy((0, drizzle_orm_1.asc)(schema_1.maintenanceSchedule.nextDue))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMaintenanceSchedule = function (scheduleData) {
        return __awaiter(this, void 0, void 0, function () {
            var schedule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .insert(schema_1.maintenanceSchedule)
                            .values(scheduleData)
                            .returning()];
                    case 1:
                        schedule = (_a.sent())[0];
                        return [2 /*return*/, schedule];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateMaintenanceSchedule = function (id, scheduleData) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.maintenanceSchedule)
                            .set(scheduleData)
                            .where((0, drizzle_orm_1.eq)(schema_1.maintenanceSchedule.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated || undefined];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMaintenanceSchedule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.maintenanceSchedule).where((0, drizzle_orm_1.eq)(schema_1.maintenanceSchedule.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    return DatabaseStorage;
}());
exports.DatabaseStorage = DatabaseStorage;
