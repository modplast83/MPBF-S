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
exports.setupNotificationRoutes = setupNotificationRoutes;
var notification_service_js_1 = require("./notification-service.js");
var schema_js_1 = require("../shared/schema.js");
var auth_utils_1 = require("./auth-utils");
var zod_1 = require("zod");
function setupNotificationRoutes(app) {
    var _this = this;
    // Get notifications for current user
    app.get("/api/notifications", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userRole, _a, category, priority, unreadOnly, _b, limit, _c, offset, notifications, error_1;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 2, , 3]);
                    userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
                    userRole = (_e = req.user) === null || _e === void 0 ? void 0 : _e.role;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: "User not authenticated" })];
                    }
                    _a = req.query, category = _a.category, priority = _a.priority, unreadOnly = _a.unreadOnly, _b = _a.limit, limit = _b === void 0 ? 50 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                    return [4 /*yield*/, notification_service_js_1.notificationService.getUserNotifications(userId, userRole, {
                            category: category,
                            priority: priority,
                            unreadOnly: unreadOnly === 'true',
                            limit: parseInt(limit),
                            offset: parseInt(offset)
                        })];
                case 1:
                    notifications = _f.sent();
                    res.json(notifications);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _f.sent();
                    console.error("Error fetching notifications:", error_1);
                    res.status(500).json({ message: "Failed to fetch notifications" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Get notification statistics
    app.get("/api/notifications/stats", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, stats, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: "User not authenticated" })];
                    }
                    return [4 /*yield*/, notification_service_js_1.notificationService.getStats(userId)];
                case 1:
                    stats = _b.sent();
                    res.json(stats);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _b.sent();
                    console.error("Error fetching notification stats:", error_2);
                    res.status(500).json({ message: "Failed to fetch notification stats" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Get unread notification count
    app.get("/api/notifications/unread-count", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userRole, counts, error_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: "User not authenticated" })];
                    }
                    return [4 /*yield*/, notification_service_js_1.notificationService.getUnreadCount(userId, userRole)];
                case 1:
                    counts = _c.sent();
                    res.json(counts.total);
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _c.sent();
                    console.error("Error fetching unread count:", error_3);
                    res.status(500).json({ message: "Failed to fetch unread count" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Mark notification as read
    app.post("/api/notifications/:id/read", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, notificationId, success, error_4;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    notificationId = parseInt(req.params.id);
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: "User not authenticated" })];
                    }
                    return [4 /*yield*/, notification_service_js_1.notificationService.markAsRead(notificationId, userId)];
                case 1:
                    success = _b.sent();
                    if (success) {
                        res.json({ success: true });
                    }
                    else {
                        res.status(404).json({ message: "Notification not found or not accessible" });
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _b.sent();
                    console.error("Error marking notification as read:", error_4);
                    res.status(500).json({ message: "Failed to mark notification as read" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Mark all notifications as read
    app.post("/api/notifications/mark-all-read", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, category, count, error_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    category = req.body.category;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: "User not authenticated" })];
                    }
                    return [4 /*yield*/, notification_service_js_1.notificationService.markAllAsRead(userId, category)];
                case 1:
                    count = _b.sent();
                    res.json({ count: count });
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _b.sent();
                    console.error("Error marking all notifications as read:", error_5);
                    res.status(500).json({ message: "Failed to mark all notifications as read" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Dismiss notification
    app.post("/api/notifications/:id/dismiss", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, notificationId, success, error_6;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    notificationId = parseInt(req.params.id);
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: "User not authenticated" })];
                    }
                    return [4 /*yield*/, notification_service_js_1.notificationService.dismissNotification(notificationId, userId)];
                case 1:
                    success = _b.sent();
                    if (success) {
                        res.json({ success: true });
                    }
                    else {
                        res.status(404).json({ message: "Notification not found or not accessible" });
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _b.sent();
                    console.error("Error dismissing notification:", error_6);
                    res.status(500).json({ message: "Failed to dismiss notification" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Archive notification
    app.post("/api/notifications/:id/archive", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, notificationId, success, error_7;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    notificationId = parseInt(req.params.id);
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: "User not authenticated" })];
                    }
                    return [4 /*yield*/, notification_service_js_1.notificationService.archiveNotification(notificationId, userId)];
                case 1:
                    success = _b.sent();
                    if (success) {
                        res.json({ success: true });
                    }
                    else {
                        res.status(404).json({ message: "Notification not found or not accessible" });
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_7 = _b.sent();
                    console.error("Error archiving notification:", error_7);
                    res.status(500).json({ message: "Failed to archive notification" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Create notification (admin only)
    app.post("/api/notifications", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userRole, validatedData, notification, error_8;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
                    if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
                        return [2 /*return*/, res.status(403).json({ message: "Insufficient permissions" })];
                    }
                    validatedData = schema_js_1.insertNotificationSchema.parse(req.body);
                    return [4 /*yield*/, notification_service_js_1.notificationService.createNotification(validatedData)];
                case 1:
                    notification = _c.sent();
                    res.status(201).json(notification);
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _c.sent();
                    if (error_8 instanceof zod_1.z.ZodError) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid notification data", errors: error_8.errors })];
                    }
                    console.error("Error creating notification:", error_8);
                    res.status(500).json({ message: "Failed to create notification" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Broadcast notification (admin only)
    app.post("/api/notifications/broadcast", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userRole, _a, targetRole, notificationData, validatedData, notification, error_9;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                    userRole = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
                    if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
                        return [2 /*return*/, res.status(403).json({ message: "Insufficient permissions" })];
                    }
                    _a = req.body, targetRole = _a.targetRole, notificationData = __rest(_a, ["targetRole"]);
                    validatedData = schema_js_1.insertNotificationSchema.omit({ userId: true }).parse(notificationData);
                    return [4 /*yield*/, notification_service_js_1.notificationService.broadcastNotification(validatedData, targetRole)];
                case 1:
                    notification = _d.sent();
                    res.status(201).json(notification);
                    return [3 /*break*/, 3];
                case 2:
                    error_9 = _d.sent();
                    if (error_9 instanceof zod_1.z.ZodError) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid notification data", errors: error_9.errors })];
                    }
                    console.error("Error broadcasting notification:", error_9);
                    res.status(500).json({ message: "Failed to broadcast notification" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Notification Templates CRUD
    // Get notification templates
    app.get("/api/notification-templates", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var category, templates, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    category = req.query.category;
                    return [4 /*yield*/, notification_service_js_1.notificationService.getTemplates(category)];
                case 1:
                    templates = _a.sent();
                    res.json(templates);
                    return [3 /*break*/, 3];
                case 2:
                    error_10 = _a.sent();
                    console.error("Error fetching notification templates:", error_10);
                    res.status(500).json({ message: "Failed to fetch notification templates" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Create notification template (admin only)
    app.post("/api/notification-templates", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userRole, validatedData, template, error_11;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
                    if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
                        return [2 /*return*/, res.status(403).json({ message: "Insufficient permissions" })];
                    }
                    validatedData = schema_js_1.insertNotificationTemplateSchema.parse(__assign(__assign({}, req.body), { createdBy: userId }));
                    return [4 /*yield*/, notification_service_js_1.notificationService.createTemplate(validatedData)];
                case 1:
                    template = _c.sent();
                    res.status(201).json(template);
                    return [3 /*break*/, 3];
                case 2:
                    error_11 = _c.sent();
                    if (error_11 instanceof zod_1.z.ZodError) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid template data", errors: error_11.errors })];
                    }
                    console.error("Error creating notification template:", error_11);
                    res.status(500).json({ message: "Failed to create notification template" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Update notification template (admin only)
    app.put("/api/notification-templates/:id", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userRole, templateId, validatedData, success, error_12;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
                    templateId = req.params.id;
                    if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
                        return [2 /*return*/, res.status(403).json({ message: "Insufficient permissions" })];
                    }
                    validatedData = schema_js_1.insertNotificationTemplateSchema.partial().parse(req.body);
                    return [4 /*yield*/, notification_service_js_1.notificationService.updateTemplate(templateId, validatedData)];
                case 1:
                    success = _c.sent();
                    if (success) {
                        res.json({ success: true });
                    }
                    else {
                        res.status(404).json({ message: "Template not found" });
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_12 = _c.sent();
                    if (error_12 instanceof zod_1.z.ZodError) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid template data", errors: error_12.errors })];
                    }
                    console.error("Error updating notification template:", error_12);
                    res.status(500).json({ message: "Failed to update notification template" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Delete notification template (admin only)
    app.delete("/api/notification-templates/:id", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userRole, templateId, success, error_13;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
                    templateId = req.params.id;
                    if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
                        return [2 /*return*/, res.status(403).json({ message: "Insufficient permissions" })];
                    }
                    return [4 /*yield*/, notification_service_js_1.notificationService.deleteTemplate(templateId)];
                case 1:
                    success = _c.sent();
                    if (success) {
                        res.json({ success: true });
                    }
                    else {
                        res.status(404).json({ message: "Template not found" });
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_13 = _c.sent();
                    console.error("Error deleting notification template:", error_13);
                    res.status(500).json({ message: "Failed to delete notification template" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Generate system notification from template
    app.post("/api/notifications/generate", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userRole, _a, event_1, data, targetUsers, targetRoles, notifications, error_14;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                    userRole = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
                    if (!userId || (userRole !== 'administrator' && userRole !== 'Supervisor')) {
                        return [2 /*return*/, res.status(403).json({ message: "Insufficient permissions" })];
                    }
                    _a = req.body, event_1 = _a.event, data = _a.data, targetUsers = _a.targetUsers, targetRoles = _a.targetRoles;
                    return [4 /*yield*/, notification_service_js_1.notificationService.generateSystemNotification(event_1, data || {}, targetUsers, targetRoles)];
                case 1:
                    notifications = _d.sent();
                    res.json({
                        generated: notifications.length,
                        notifications: notifications
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_14 = _d.sent();
                    console.error("Error generating system notifications:", error_14);
                    res.status(500).json({ message: "Failed to generate system notifications" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
