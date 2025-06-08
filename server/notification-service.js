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
exports.notificationService = exports.NotificationService = void 0;
var notification_storage_js_1 = require("./notification-storage.js");
var NotificationService = /** @class */ (function () {
    function NotificationService() {
        // Priority levels for ordering
        this.priorityOrder = {
            urgent: 5,
            critical: 4,
            high: 3,
            medium: 2,
            low: 1
        };
        this.storage = new notification_storage_js_1.NotificationStorage();
    }
    // Create notification with smart prioritization
    NotificationService.prototype.createNotification = function (notification) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Auto-set priority based on type and category if not specified
                        if (!notification.priority) {
                            notification.priority = this.determinePriority(notification.type, notification.category);
                        }
                        // Set expiration if not specified based on priority
                        if (!notification.expiresAt) {
                            notification.expiresAt = this.calculateExpiration(notification.priority);
                        }
                        return [4 /*yield*/, this.storage.createNotification(notification)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Create notification from template
    NotificationService.prototype.createFromTemplate = function (templateId, variables, targetUser, targetRole) {
        return __awaiter(this, void 0, void 0, function () {
            var template, notification;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getNotificationTemplate(templateId)];
                    case 1:
                        template = _a.sent();
                        if (!template || !template.isActive) {
                            return [2 /*return*/, null];
                        }
                        notification = {
                            title: this.replaceVariables(template.title, variables),
                            message: this.replaceVariables(template.message, variables),
                            type: template.type,
                            priority: template.priority,
                            category: template.category,
                            source: "template:".concat(templateId),
                            userId: targetUser || null,
                            userRole: targetRole || null,
                            actionRequired: template.actionRequired,
                            actionUrl: template.actionUrl ? this.replaceVariables(template.actionUrl, variables) : null,
                            metadata: { templateId: templateId, variables: variables }
                        };
                        return [4 /*yield*/, this.createNotification(notification)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Broadcast notification to role or all users
    NotificationService.prototype.broadcastNotification = function (notification, targetRole) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createNotification(__assign(__assign({}, notification), { userId: null, userRole: targetRole || null }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Get prioritized notifications for user
    NotificationService.prototype.getUserNotifications = function (userId_1, userRole_1) {
        return __awaiter(this, arguments, void 0, function (userId, userRole, filters) {
            var notifications;
            var _this = this;
            if (filters === void 0) { filters = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getNotifications({
                            userId: userId,
                            userRole: userRole,
                            category: filters.category,
                            priority: filters.priority,
                            isRead: filters.unreadOnly ? false : undefined,
                            limit: filters.limit || 50,
                            offset: filters.offset || 0
                        })];
                    case 1:
                        notifications = _a.sent();
                        // Sort by priority and creation time
                        return [2 /*return*/, notifications.sort(function (a, b) {
                                var aPriority = _this.priorityOrder[a.priority] || 0;
                                var bPriority = _this.priorityOrder[b.priority] || 0;
                                if (aPriority !== bPriority) {
                                    return bPriority - aPriority; // Higher priority first
                                }
                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            })];
                }
            });
        });
    };
    // Mark notification as read
    NotificationService.prototype.markAsRead = function (notificationId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.markAsRead(notificationId, userId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Mark all notifications as read
    NotificationService.prototype.markAllAsRead = function (userId, category) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.markAllAsRead(userId, category)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Dismiss notification
    NotificationService.prototype.dismissNotification = function (notificationId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.dismissNotification(notificationId, userId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Archive notification
    NotificationService.prototype.archiveNotification = function (notificationId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.archiveNotification(notificationId, userId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Get unread count with priority breakdown
    NotificationService.prototype.getUnreadCount = function (userId, userRole) {
        return __awaiter(this, void 0, void 0, function () {
            var notifications, counts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getNotifications({
                            userId: userId,
                            userRole: userRole,
                            isRead: false,
                            isArchived: false
                        })];
                    case 1:
                        notifications = _a.sent();
                        counts = {
                            total: notifications.length,
                            urgent: 0,
                            critical: 0,
                            high: 0
                        };
                        notifications.forEach(function (notification) {
                            if (notification.priority === 'urgent')
                                counts.urgent++;
                            else if (notification.priority === 'critical')
                                counts.critical++;
                            else if (notification.priority === 'high')
                                counts.high++;
                        });
                        return [2 /*return*/, counts];
                }
            });
        });
    };
    // Get notification statistics
    NotificationService.prototype.getStats = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getNotificationStats(userId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Auto-generate notifications based on system events
    NotificationService.prototype.generateSystemNotification = function (event, data, targetUsers, targetRoles) {
        return __awaiter(this, void 0, void 0, function () {
            var notifications, templates, relevantTemplates, _i, relevantTemplates_1, template, _a, targetUsers_1, userId, notification, _b, targetRoles_1, role, notification, notification;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        notifications = [];
                        return [4 /*yield*/, this.storage.getNotificationTemplates()];
                    case 1:
                        templates = _c.sent();
                        relevantTemplates = templates.filter(function (template) { return template.triggerEvent === event && template.isActive; });
                        _i = 0, relevantTemplates_1 = relevantTemplates;
                        _c.label = 2;
                    case 2:
                        if (!(_i < relevantTemplates_1.length)) return [3 /*break*/, 13];
                        template = relevantTemplates_1[_i];
                        if (!this.evaluateConditions(template.conditions, data)) return [3 /*break*/, 12];
                        if (!targetUsers) return [3 /*break*/, 6];
                        _a = 0, targetUsers_1 = targetUsers;
                        _c.label = 3;
                    case 3:
                        if (!(_a < targetUsers_1.length)) return [3 /*break*/, 6];
                        userId = targetUsers_1[_a];
                        return [4 /*yield*/, this.createFromTemplate(template.id, data, userId)];
                    case 4:
                        notification = _c.sent();
                        if (notification)
                            notifications.push(notification);
                        _c.label = 5;
                    case 5:
                        _a++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (!targetRoles) return [3 /*break*/, 10];
                        _b = 0, targetRoles_1 = targetRoles;
                        _c.label = 7;
                    case 7:
                        if (!(_b < targetRoles_1.length)) return [3 /*break*/, 10];
                        role = targetRoles_1[_b];
                        return [4 /*yield*/, this.createFromTemplate(template.id, data, undefined, role)];
                    case 8:
                        notification = _c.sent();
                        if (notification)
                            notifications.push(notification);
                        _c.label = 9;
                    case 9:
                        _b++;
                        return [3 /*break*/, 7];
                    case 10:
                        if (!(!targetUsers && !targetRoles)) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.createFromTemplate(template.id, data)];
                    case 11:
                        notification = _c.sent();
                        if (notification)
                            notifications.push(notification);
                        _c.label = 12;
                    case 12:
                        _i++;
                        return [3 /*break*/, 2];
                    case 13: return [2 /*return*/, notifications];
                }
            });
        });
    };
    // Cleanup expired notifications
    NotificationService.prototype.cleanupExpiredNotifications = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.cleanupExpiredNotifications()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Private helper methods
    NotificationService.prototype.determinePriority = function (type, category) {
        // Auto-determine priority based on type and category
        if (type === 'alert' || category === 'quality')
            return 'high';
        if (type === 'warning' || category === 'maintenance')
            return 'medium';
        if (type === 'system' || category === 'hr')
            return 'medium';
        if (category === 'production')
            return 'high';
        return 'medium';
    };
    NotificationService.prototype.calculateExpiration = function (priority) {
        var now = new Date();
        var hours = {
            urgent: 1, // 1 hour
            critical: 4, // 4 hours
            high: 24, // 1 day
            medium: 72, // 3 days
            low: 168 // 1 week
        };
        var expirationHours = hours[priority] || 72;
        return new Date(now.getTime() + expirationHours * 60 * 60 * 1000);
    };
    NotificationService.prototype.replaceVariables = function (template, variables) {
        var result = template;
        Object.entries(variables).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            var regex = new RegExp("\\{\\{".concat(key, "\\}\\}"), 'g');
            result = result.replace(regex, String(value));
        });
        return result;
    };
    NotificationService.prototype.evaluateConditions = function (conditions, data) {
        if (!conditions)
            return true;
        try {
            // Simple condition evaluation - can be extended for complex rules
            if (typeof conditions === 'object') {
                return Object.entries(conditions).every(function (_a) {
                    var key = _a[0], expectedValue = _a[1];
                    return data[key] === expectedValue;
                });
            }
            return true;
        }
        catch (error) {
            console.error('Error evaluating notification conditions:', error);
            return false;
        }
    };
    // Template management
    NotificationService.prototype.createTemplate = function (template) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.createNotificationTemplate(template)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotificationService.prototype.getTemplates = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.getNotificationTemplates(category)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotificationService.prototype.updateTemplate = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.updateNotificationTemplate(id, updates)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotificationService.prototype.deleteTemplate = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.deleteNotificationTemplate(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return NotificationService;
}());
exports.NotificationService = NotificationService;
// Singleton instance
exports.notificationService = new NotificationService();
