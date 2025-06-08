"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationStorage = void 0;
var db_js_1 = require("./db.js");
var schema_js_1 = require("../shared/schema.js");
var drizzle_orm_1 = require("drizzle-orm");
var drizzle_orm_2 = require("drizzle-orm");
var NotificationStorage = /** @class */ (function () {
    function NotificationStorage() {
    }
    // Notification CRUD Operations
    NotificationStorage.prototype.createNotification = function (notification) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db.insert(schema_js_1.notificationCenter).values(notification).returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    NotificationStorage.prototype.getNotifications = function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var query, conditions;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = db_js_1.db.select().from(schema_js_1.notificationCenter);
                        conditions = [];
                        if (params.userId) {
                            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.userId, params.userId), (0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.userId) // Broadcast notifications
                            ));
                        }
                        if (params.userRole) {
                            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.userRole, params.userRole), (0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.userRole)));
                        }
                        if (params.category) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.category, params.category));
                        }
                        if (params.priority) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.priority, params.priority));
                        }
                        if (params.isRead !== undefined) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.isRead, params.isRead));
                        }
                        if (params.isArchived !== undefined) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.isArchived, params.isArchived));
                        }
                        // Filter out expired notifications
                        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.expiresAt), (0, drizzle_orm_1.gte)(schema_js_1.notificationCenter.expiresAt, new Date())));
                        if (conditions.length > 0) {
                            query = query.where(drizzle_orm_1.and.apply(void 0, conditions));
                        }
                        query = query.orderBy((0, drizzle_orm_1.desc)(schema_js_1.notificationCenter.priority), (0, drizzle_orm_1.desc)(schema_js_1.notificationCenter.createdAt));
                        if (params.limit) {
                            query = query.limit(params.limit);
                        }
                        if (params.offset) {
                            query = query.offset(params.offset);
                        }
                        return [4 /*yield*/, query];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotificationStorage.prototype.getNotificationById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var notification;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .select()
                            .from(schema_js_1.notificationCenter)
                            .where((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.id, id))];
                    case 1:
                        notification = (_a.sent())[0];
                        return [2 /*return*/, notification || null];
                }
            });
        });
    };
    NotificationStorage.prototype.markAsRead = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .update(schema_js_1.notificationCenter)
                            .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.id, id), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.userId, userId), (0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.userId))))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    NotificationStorage.prototype.markAllAsRead = function (userId, category) {
        return __awaiter(this, void 0, void 0, function () {
            var conditions, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [
                            (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.userId, userId), (0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.userId)),
                            (0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.isRead, false)
                        ];
                        if (category) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.category, category));
                        }
                        return [4 /*yield*/, db_js_1.db
                                .update(schema_js_1.notificationCenter)
                                .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
                                .where(drizzle_orm_1.and.apply(void 0, conditions))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount];
                }
            });
        });
    };
    NotificationStorage.prototype.dismissNotification = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .update(schema_js_1.notificationCenter)
                            .set({ isDismissed: true, dismissedAt: new Date(), updatedAt: new Date() })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.id, id), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.userId, userId), (0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.userId))))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    NotificationStorage.prototype.archiveNotification = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .update(schema_js_1.notificationCenter)
                            .set({ isArchived: true, updatedAt: new Date() })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.id, id), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.userId, userId), (0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.userId))))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    NotificationStorage.prototype.getUnreadCount = function (userId, userRole) {
        return __awaiter(this, void 0, void 0, function () {
            var conditions, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [
                            (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.userId, userId), (0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.userId)),
                            (0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.isRead, false),
                            (0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.isArchived, false),
                            (0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.isDismissed, false)
                        ];
                        if (userRole) {
                            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.userRole, userRole), (0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.userRole)));
                        }
                        // Filter out expired notifications
                        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.expiresAt), (0, drizzle_orm_1.gte)(schema_js_1.notificationCenter.expiresAt, new Date())));
                        return [4 /*yield*/, db_js_1.db
                                .select({ count: (0, drizzle_orm_2.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(schema_js_1.notificationCenter)
                                .where(drizzle_orm_1.and.apply(void 0, conditions))];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result.count];
                }
            });
        });
    };
    // Notification Preferences
    NotificationStorage.prototype.createNotificationPreference = function (preference) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db.insert(schema_js_1.notificationPreferences).values(preference).returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    NotificationStorage.prototype.getNotificationPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .select()
                            .from(schema_js_1.notificationPreferences)
                            .where((0, drizzle_orm_1.eq)(schema_js_1.notificationPreferences.userId, userId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotificationStorage.prototype.updateNotificationPreference = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .update(schema_js_1.notificationPreferences)
                            .set(__assign(__assign({}, updates), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_js_1.notificationPreferences.id, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    // Notification Templates
    NotificationStorage.prototype.createNotificationTemplate = function (template) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db.insert(schema_js_1.notificationTemplates).values(template).returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    NotificationStorage.prototype.getNotificationTemplates = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = db_js_1.db.select().from(schema_js_1.notificationTemplates);
                        if (category) {
                            query = query.where((0, drizzle_orm_1.eq)(schema_js_1.notificationTemplates.category, category));
                        }
                        return [4 /*yield*/, query.orderBy((0, drizzle_orm_1.asc)(schema_js_1.notificationTemplates.name))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotificationStorage.prototype.getNotificationTemplate = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var template;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .select()
                            .from(schema_js_1.notificationTemplates)
                            .where((0, drizzle_orm_1.eq)(schema_js_1.notificationTemplates.id, id))];
                    case 1:
                        template = (_a.sent())[0];
                        return [2 /*return*/, template || null];
                }
            });
        });
    };
    NotificationStorage.prototype.updateNotificationTemplate = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .update(schema_js_1.notificationTemplates)
                            .set(__assign(__assign({}, updates), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_js_1.notificationTemplates.id, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    NotificationStorage.prototype.deleteNotificationTemplate = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .delete(schema_js_1.notificationTemplates)
                            .where((0, drizzle_orm_1.eq)(schema_js_1.notificationTemplates.id, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    // Cleanup and Maintenance
    NotificationStorage.prototype.cleanupExpiredNotifications = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_js_1.db
                            .delete(schema_js_1.notificationCenter)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lte)(schema_js_1.notificationCenter.expiresAt, new Date()), (0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.isArchived, true)))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount];
                }
            });
        });
    };
    NotificationStorage.prototype.getNotificationStats = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var baseConditions, totalResult, unreadResult, categoryStats, priorityStats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        baseConditions = [
                            (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.userId, userId), (0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.userId)),
                            (0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.isArchived, false),
                            (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_js_1.notificationCenter.expiresAt), (0, drizzle_orm_1.gte)(schema_js_1.notificationCenter.expiresAt, new Date()))
                        ];
                        return [4 /*yield*/, db_js_1.db
                                .select({ count: (0, drizzle_orm_2.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(schema_js_1.notificationCenter)
                                .where(drizzle_orm_1.and.apply(void 0, baseConditions))];
                    case 1:
                        totalResult = (_a.sent())[0];
                        return [4 /*yield*/, db_js_1.db
                                .select({ count: (0, drizzle_orm_2.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(schema_js_1.notificationCenter)
                                .where(drizzle_orm_1.and.apply(void 0, __spreadArray(__spreadArray([], baseConditions, false), [(0, drizzle_orm_1.eq)(schema_js_1.notificationCenter.isRead, false)], false)))];
                    case 2:
                        unreadResult = (_a.sent())[0];
                        return [4 /*yield*/, db_js_1.db
                                .select({
                                category: schema_js_1.notificationCenter.category,
                                count: (0, drizzle_orm_2.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                                unread: (0, drizzle_orm_2.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["sum(case when is_read = false then 1 else 0 end)"], ["sum(case when is_read = false then 1 else 0 end)"])))
                            })
                                .from(schema_js_1.notificationCenter)
                                .where(drizzle_orm_1.and.apply(void 0, baseConditions))
                                .groupBy(schema_js_1.notificationCenter.category)];
                    case 3:
                        categoryStats = _a.sent();
                        return [4 /*yield*/, db_js_1.db
                                .select({
                                priority: schema_js_1.notificationCenter.priority,
                                count: (0, drizzle_orm_2.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                                unread: (0, drizzle_orm_2.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["sum(case when is_read = false then 1 else 0 end)"], ["sum(case when is_read = false then 1 else 0 end)"])))
                            })
                                .from(schema_js_1.notificationCenter)
                                .where(drizzle_orm_1.and.apply(void 0, baseConditions))
                                .groupBy(schema_js_1.notificationCenter.priority)];
                    case 4:
                        priorityStats = _a.sent();
                        return [2 /*return*/, {
                                total: totalResult.count,
                                unread: unreadResult.count,
                                byCategory: categoryStats,
                                byPriority: priorityStats
                            }];
                }
            });
        });
    };
    return NotificationStorage;
}());
exports.NotificationStorage = NotificationStorage;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
